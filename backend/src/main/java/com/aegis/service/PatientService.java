package com.aegis.service;

import com.aegis.dto.*;
import com.aegis.model.*;
import com.aegis.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientService {

    private final PatientRepository patientRepository;
    private final PatientTelemetryRepository telemetryRepository;
    private final TriageEvaluationRepository evaluationRepository;
    private final ClinicalActionOrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final List<String> ALL_ICU_BEDS = List.of(
            "ICU-BED-01", "ICU-BED-02", "ICU-BED-03", "ICU-BED-04",
            "ICU-BED-05", "ICU-BED-06", "ICU-BED-07", "ICU-BED-08"
    );

    @Transactional(readOnly = true)
    public List<BedRosterItemDto> getIcuBedRoster() {
        List<Patient> activePatients = patientRepository.findAllActiveInpatients();
        Map<String, Patient> bedPatientMap = new HashMap<>();
        for (Patient p : activePatients) {
            if (p.getIcuBedNumber() != null) {
                bedPatientMap.put(p.getIcuBedNumber(), p);
            }
        }

        List<BedRosterItemDto> roster = new ArrayList<>();

        for (String bedNumber : ALL_ICU_BEDS) {
            Patient p = bedPatientMap.get(bedNumber);
            if (p == null) {
                // Empty bed
                roster.add(BedRosterItemDto.builder()
                        .bedNumber(bedNumber)
                        .isOccupied(false)
                        .urgencyLevel("UNOCCUPIED")
                        .triageColor("GREY")
                        .summaryHeadline("Bed available for clinical admission")
                        .aiEvaluated(false)
                        .evaluationSource("EMPTY_BED")
                        .build());
            } else {
                // Occupied bed
                Optional<PatientTelemetry> latestTelem = telemetryRepository.findTopByPatientPatientIdOrderByHourIndexDesc(p.getPatientId());
                Optional<TriageEvaluation> latestEval = evaluationRepository.findTopByPatientPatientIdOrderByEvaluatedAtDesc(p.getPatientId());
                List<ClinicalActionOrder> pendingOrders = orderRepository.findPendingOrdersByPatient(p.getPatientId());

                double risk = latestEval.map(TriageEvaluation::getCompositeSepsisRisk).orElse(0.15);
                String urgency = latestEval.map(TriageEvaluation::getUrgencyLevel).orElse("STABLE");
                boolean sensorValid = latestEval.map(TriageEvaluation::isSensorValid).orElse(true);

                String color;
                if (!sensorValid) {
                    color = "GREY"; // Sensor artifact fault
                } else if ("CRITICAL_SEPSIS".equalsIgnoreCase(urgency) || risk >= 0.70) {
                    color = "RED";
                } else if ("MODERATE".equalsIgnoreCase(urgency) || risk >= 0.35) {
                    color = "YELLOW";
                } else {
                    color = "GREEN";
                }

                String bpStr = null;
                if (latestTelem.isPresent() && latestTelem.get().getSystolicBp() != null && latestTelem.get().getDiastolicBp() != null) {
                    bpStr = Math.round(latestTelem.get().getSystolicBp()) + "/" + Math.round(latestTelem.get().getDiastolicBp());
                }

                String headline = latestEval.map(TriageEvaluation::getEvidenceChainNarrative)
                        .orElse(p.getPrimaryDiagnosis() != null ? p.getPrimaryDiagnosis() : "Continuous observation");

                roster.add(BedRosterItemDto.builder()
                        .bedNumber(bedNumber)
                        .isOccupied(true)
                        .patientId(p.getPatientId())
                        .mrn(p.getMrn())
                        .patientName(p.getFullName())
                        .age(p.getAge())
                        .gender(p.getGender() != null ? p.getGender().name() : null)
                        .admissionDiagnosis(p.getPrimaryDiagnosis())
                        .compositeSepsisRisk(Math.round(risk * 100.0) / 100.0)
                        .urgencyLevel(urgency)
                        .triageColor(color)
                        .summaryHeadline(headline)
                        .heartRate(latestTelem.map(PatientTelemetry::getHeartRate).orElse(null))
                        .meanArterialPressure(latestTelem.map(PatientTelemetry::getMeanArterialPressure).orElse(null))
                        .bloodPressure(bpStr)
                        .respiratoryRate(latestTelem.map(PatientTelemetry::getRespiratoryRate).orElse(null))
                        .o2Saturation(latestTelem.map(PatientTelemetry::getO2Saturation).orElse(null))
                        .temperature(latestTelem.map(PatientTelemetry::getTemperature).orElse(null))
                        .lactate(latestTelem.map(PatientTelemetry::getLactate).orElse(null))
                        .shockIndex(latestTelem.map(PatientTelemetry::getShockIndex).orElse(null))
                        .attendingDoctorName(p.getAttendingDoctor() != null ? p.getAttendingDoctor().getFullName() : "Dr. Mohammad Munawar, MD")
                        .primaryNurseName(p.getPrimaryNurse() != null ? p.getPrimaryNurse().getFullName() : "Priya Patel, RN")
                        .activeMedications(p.getActiveMedications() != null ? new ArrayList<>(p.getActiveMedications()) : List.of())
                        .pendingOrdersCount(pendingOrders.size())
                        .lastEvaluatedAt(latestEval.map(TriageEvaluation::getEvaluatedAt).orElse(p.getAdmissionTime()))
                        .aiEvaluated(latestEval.isPresent())
                        .evaluationSource(latestEval.isPresent() ? "MULTI_AGENT_AI" : "BASELINE_SEED")
                        .build());
            }
        }

        return roster;
    }

    @Transactional(readOnly = true)
    public Patient getPatientProfile(String patientId) {
        return patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + patientId));
    }

    @Transactional(readOnly = true)
    public PatientProfileDto getPatientProfileDto(String patientId) {
        Patient patient = getPatientProfile(patientId);
        return mapToProfileDto(patient);
    }

    public PatientProfileDto mapToProfileDto(Patient p) {
        ClinicianSummaryDto docDto = null;
        if (p.getAttendingDoctor() != null) {
            User doc = p.getAttendingDoctor();
            docDto = ClinicianSummaryDto.builder()
                    .id(doc.getId())
                    .username(doc.getUsername())
                    .fullName(doc.getFullName())
                    .email(doc.getEmail())
                    .department(doc.getDepartment())
                    .specialty(doc.getSpecialty())
                    .licenseNumber(doc.getLicenseNumber())
                    .role(doc.getRole())
                    .shiftStatus(doc.getShiftStatus())
                    .build();
        }

        ClinicianSummaryDto nurseDto = null;
        if (p.getPrimaryNurse() != null) {
            User nurse = p.getPrimaryNurse();
            nurseDto = ClinicianSummaryDto.builder()
                    .id(nurse.getId())
                    .username(nurse.getUsername())
                    .fullName(nurse.getFullName())
                    .email(nurse.getEmail())
                    .department(nurse.getDepartment())
                    .specialty(nurse.getSpecialty())
                    .licenseNumber(nurse.getLicenseNumber())
                    .role(nurse.getRole())
                    .shiftStatus(nurse.getShiftStatus())
                    .build();
        }

        return PatientProfileDto.builder()
                .patientId(p.getPatientId())
                .mrn(p.getMrn())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .fullName(p.getFullName())
                .age(p.getAge())
                .gender(p.getGender())
                .icuBedNumber(p.getIcuBedNumber())
                .admissionTime(p.getAdmissionTime())
                .primaryDiagnosis(p.getPrimaryDiagnosis())
                .activeMedications(p.getActiveMedications() != null ? new ArrayList<>(p.getActiveMedications()) : List.of())
                .status(p.getStatus())
                .clinicalNotes(p.getClinicalNotes())
                .attendingDoctor(docDto)
                .primaryNurse(nurseDto)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public PatientHistoricalTelemetryDto getPatientHistory(String patientId) {
        Patient patient = getPatientProfile(patientId);
        List<PatientTelemetry> telemList = telemetryRepository.findByPatientPatientIdOrderByHourIndexAsc(patientId);
        List<TriageEvaluation> evalList = evaluationRepository.findByPatientPatientIdOrderByEvaluatedAtDesc(patientId);

        // Index evaluations by telemetry id and hourIndex to ground history in true persisted evaluations
        Map<Long, TriageEvaluation> evalByTelemetryId = new HashMap<>();
        Map<Integer, TriageEvaluation> evalByHourIndex = new HashMap<>();
        for (TriageEvaluation e : evalList) {
            if (e.getTelemetry() != null && e.getTelemetry().getId() != null) {
                evalByTelemetryId.put(e.getTelemetry().getId(), e);
                if (e.getTelemetry().getHourIndex() != null) {
                    evalByHourIndex.putIfAbsent(e.getTelemetry().getHourIndex(), e);
                }
            }
        }

        List<HistoricalHourPointDto> timeline = new ArrayList<>();
        Double latestRisk = 0.12;
        String latestUrgency = "STABLE";

        for (PatientTelemetry t : telemList) {
            TriageEvaluation eval = evalByTelemetryId.get(t.getId());
            if (eval == null && t.getHourIndex() != null) {
                eval = evalByHourIndex.get(t.getHourIndex());
            }

            double shockIdx = t.getShockIndex() != null 
                    ? t.getShockIndex() 
                    : (t.getSystolicBp() != null && t.getSystolicBp() > 0 ? (t.getHeartRate() / t.getSystolicBp()) : 0.8);
            double vitalsRisk = Math.min(1.0, Math.max(0.08, (shockIdx - 0.5) / 0.95));
            double lactateVal = t.getLactate() != null ? t.getLactate() : 1.2;
            double labsRisk = Math.min(1.0, Math.max(0.08, lactateVal / 4.0));
            double skepticDiscount = 0.05;

            double compRisk;
            String urgency;

            if (eval != null) {
                compRisk = eval.getCompositeSepsisRisk();
                urgency = eval.getUrgencyLevel();
                if (eval.getShockIndex() != null) {
                    shockIdx = eval.getShockIndex();
                }
                vitalsRisk = Math.min(1.0, Math.max(0.08, (shockIdx - 0.5) / 0.95));
                labsRisk = Math.min(1.0, Math.max(0.08, lactateVal / 4.0));
            } else {
                compRisk = Math.min(1.0, (0.55 * vitalsRisk + 0.45 * labsRisk));
                urgency = compRisk >= 0.70 ? "CRITICAL_SEPSIS" : (compRisk >= 0.35 ? "MODERATE" : "STABLE");
            }

            latestRisk = compRisk;
            latestUrgency = urgency;

            String statusColor = compRisk >= 0.70 ? "RED" : (compRisk >= 0.35 ? "YELLOW" : "GREEN");

            timeline.add(HistoricalHourPointDto.builder()
                    .hourIndex(t.getHourIndex())
                    .recordedAt(t.getRecordedAt())
                    .heartRate(t.getHeartRate())
                    .systolicBp(t.getSystolicBp())
                    .diastolicBp(t.getDiastolicBp())
                    .meanArterialPressure(t.getMeanArterialPressure())
                    .respiratoryRate(t.getRespiratoryRate())
                    .o2Saturation(t.getO2Saturation())
                    .temperature(t.getTemperature())
                    .lactate(t.getLactate())
                    .whiteBloodCellCount(t.getWhiteBloodCellCount())
                    .creatinine(t.getCreatinine())
                    .platelets(t.getPlatelets())
                    .shockIndex(Math.round(shockIdx * 100.0) / 100.0)
                    .news2Score(t.getNews2Score())
                    .compositeSepsisRisk(Math.round(compRisk * 100.0) / 100.0)
                    .vitalsAgentRisk(Math.round(vitalsRisk * 100.0) / 100.0)
                    .labsAgentRisk(Math.round(labsRisk * 100.0) / 100.0)
                    .skepticDiscount(skepticDiscount)
                    .urgencyLevel(urgency)
                    .statusColor(statusColor)
                    .build());
        }

        String overallColor = latestRisk >= 0.70 ? "RED" : (latestRisk >= 0.35 ? "YELLOW" : "GREEN");

        return PatientHistoricalTelemetryDto.builder()
                .patientId(patient.getPatientId())
                .mrn(patient.getMrn())
                .fullName(patient.getFullName())
                .icuBedNumber(patient.getIcuBedNumber())
                .primaryDiagnosis(patient.getPrimaryDiagnosis())
                .activeMedications(patient.getActiveMedications() != null ? new ArrayList<>(patient.getActiveMedications()) : List.of())
                .latestCompositeRisk(Math.round(latestRisk * 100.0) / 100.0)
                .latestUrgencyLevel(latestUrgency)
                .latestTriageColor(overallColor)
                .timeline(timeline)
                .build();
    }

    @Transactional
    public Patient admitPatient(PatientAdmitRequest request, String clinicianUsername) {
        String bedNum = request.getIcuBedNumber().trim().toUpperCase();

        // Check if bed is already occupied by active patient
        Optional<Patient> existing = patientRepository.findByIcuBedNumber(bedNum);
        if (existing.isPresent() && existing.get().getStatus() != PatientStatus.DISCHARGED) {
            throw new IllegalArgumentException("Bed " + bedNum + " is currently occupied by patient " + existing.get().getFullName());
        }

        String patientId = (request.getPatientId() != null && !request.getPatientId().trim().isEmpty())
                ? request.getPatientId().trim()
                : "PT-" + (1000 + new Random().nextInt(9000));

        String mrn = (request.getMrn() != null && !request.getMrn().trim().isEmpty())
                ? request.getMrn().trim()
                : "MRN-2026-" + (1000 + new Random().nextInt(9000));

        // Find doctor and nurse
        User doctor = null;
        if (request.getAttendingDoctorId() != null) {
            doctor = userRepository.findById(request.getAttendingDoctorId()).orElse(null);
        }
        if (doctor == null) {
            doctor = userRepository.findByUsername("dr.munawar")
                    .or(() -> userRepository.findByUsername("dr.sharma"))
                    .orElse(null);
        }

        User nurse = null;
        if (request.getPrimaryNurseId() != null) {
            nurse = userRepository.findById(request.getPrimaryNurseId()).orElse(null);
        }
        if (nurse == null) {
            nurse = userRepository.findByUsername(clinicianUsername)
                    .or(() -> userRepository.findByUsername("nurse.priya"))
                    .orElse(null);
        }

        Patient patient = Patient.builder()
                .patientId(patientId)
                .mrn(mrn)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .age(request.getAge())
                .gender(request.getGender())
                .icuBedNumber(bedNum)
                .primaryDiagnosis(request.getPrimaryDiagnosis().trim())
                .activeMedications(request.getActiveMedications() != null ? new ArrayList<>(request.getActiveMedications()) : new ArrayList<>())
                .attendingDoctor(doctor)
                .primaryNurse(nurse)
                .status(PatientStatus.ADMITTED)
                .admissionTime(LocalDateTime.now())
                .clinicalNotes("Admitted to " + bedNum + " by clinician " + clinicianUsername + ". " + (request.getClinicalNotes() != null ? request.getClinicalNotes() : ""))
                .build();

        Patient saved = patientRepository.save(patient);
        log.info("Admitted patient {} ({}) to {}", saved.getPatientId(), saved.getFullName(), saved.getIcuBedNumber());
        return saved;
    }

    @Transactional
    public Patient dischargePatient(String patientId, String clinicianUsername) {
        Patient patient = getPatientProfile(patientId);
        String oldBed = patient.getIcuBedNumber();

        patient.setStatus(PatientStatus.DISCHARGED);
        patient.setIcuBedNumber(null); // Frees the bed for admission
        patient.setClinicalNotes((patient.getClinicalNotes() != null ? patient.getClinicalNotes() + " | " : "")
                + "Discharged/transferred from " + oldBed + " by " + clinicianUsername + " at " + LocalDateTime.now());

        Patient saved = patientRepository.save(patient);
        log.info("Discharged patient {} from bed {}", saved.getPatientId(), oldBed);
        return saved;
    }

    @Transactional
    public PatientEvaluationResponse logTelemetryAndEvaluate(String patientId, TelemetryTickRequest request, String clinicianUsername) {
        Optional<Patient> patientOpt = patientRepository.findByPatientId(patientId);
        Patient patient;
        if (patientOpt.isEmpty()) {
            log.info("Patient ID '{}' not found in database. Auto-admitting to available ICU bed...", patientId);
            List<Patient> activeInpatients = patientRepository.findAllActiveInpatients();
            Set<String> occupiedBeds = new HashSet<>();
            for (Patient actP : activeInpatients) {
                if (actP.getIcuBedNumber() != null) occupiedBeds.add(actP.getIcuBedNumber());
            }
            String assignedBed = ALL_ICU_BEDS.stream()
                    .filter(b -> !occupiedBeds.contains(b))
                    .findFirst()
                    .orElse("ICU-OVERFLOW");

            User doctor = userRepository.findByUsername("dr.sharma")
                    .or(() -> userRepository.findByUsername("dr.munawar"))
                    .orElse(null);
            User nurse = userRepository.findByUsername("nurse.priya")
                    .orElse(null);

            String firstName = "Patient";
            String lastName = patientId;
            if (request.getPatientName() != null && !request.getPatientName().trim().isEmpty()) {
                String[] parts = request.getPatientName().trim().split("\\s+", 2);
                firstName = parts[0];
                lastName = parts.length > 1 ? parts[1] : "";
            }
            int ageVal = (request.getAge() != null && request.getAge() > 0) ? request.getAge() : 55;
            Gender genderVal = Gender.OTHER;
            if (request.getGender() != null) {
                String g = request.getGender().trim().toUpperCase();
                if (g.startsWith("M")) genderVal = Gender.MALE;
                else if (g.startsWith("F")) genderVal = Gender.FEMALE;
            }
            String diagVal = (request.getDiagnosis() != null && !request.getDiagnosis().trim().isEmpty())
                    ? request.getDiagnosis().trim()
                    : "Continuous ICU Surveillance";

            patient = Patient.builder()
                    .patientId(patientId)
                    .mrn("MRN-" + patientId)
                    .firstName(firstName)
                    .lastName(lastName)
                    .age(ageVal)
                    .gender(genderVal)
                    .icuBedNumber(assignedBed)
                    .primaryDiagnosis(diagVal)
                    .activeMedications(new ArrayList<>())
                    .attendingDoctor(doctor)
                    .primaryNurse(nurse)
                    .status(PatientStatus.ADMITTED)
                    .admissionTime(LocalDateTime.now())
                    .clinicalNotes("Auto-admitted via telemetry feed to " + assignedBed + " at " + LocalDateTime.now())
                    .build();
            patient = patientRepository.save(patient);
            log.info("Successfully auto-admitted unknown patient '{}' into bed '{}'", patientId, assignedBed);
        } else {
            patient = patientOpt.get();
        }

        if (patient.getStatus() == PatientStatus.DISCHARGED) {
            throw new IllegalStateException("Clinical Safety Violation: Cannot ingest telemetry for discharged patient: " + patientId);
        }

        // URL patientId is the single source of truth
        request.setPatientId(patientId);

        // Merge incoming medications into patient activeMedications & forward all to AI engine
        List<String> patientMeds = patient.getActiveMedications();
        if (patientMeds == null) {
            patientMeds = new ArrayList<>();
        }
        List<String> incomingMeds = request.getActiveMedications();
        boolean updatedMeds = false;
        if (incomingMeds != null && !incomingMeds.isEmpty()) {
            for (String med : incomingMeds) {
                if (med != null && !med.trim().isEmpty() && !med.equalsIgnoreCase("None")) {
                    String trimmed = med.trim();
                    boolean exists = false;
                    for (String em : patientMeds) {
                        if (em.equalsIgnoreCase(trimmed)) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        patientMeds.add(trimmed);
                        updatedMeds = true;
                    }
                }
            }
        }
        request.setActiveMedications(new ArrayList<>(patientMeds));
        if (updatedMeds) {
            patient.setActiveMedications(patientMeds);
            patient = patientRepository.save(patient);
        }

        // 1. Calculate MAP & Shock Index if missing, normalize onto request
        double sbp = request.getSystolicBp();
        double dbp = request.getDiastolicBp();
        double map = request.getMeanArterialPressure() > 0 
                ? request.getMeanArterialPressure() 
                : (sbp > 0 && dbp > 0 ? (sbp + 2.0 * dbp) / 3.0 : 0.0);
        request.setMap(map); // Normalization so AI engine receives consistent MAP!
        double shockIdx = (sbp > 0 && request.getHeartRate() > 0) ? (request.getHeartRate() / sbp) : 0.8;

        // Forward-fill previous lab values if omitted or zero in current hourly tick
        Double lactate = request.getLactate();
        Double wbc = request.getWhiteBloodCellCount();
        Double creat = request.getCreatinine();
        Double plat = request.getPlatelets();
        if (lactate == null || lactate <= 0.0 || wbc == null || wbc <= 0.0 || creat == null || creat <= 0.0 || plat == null || plat <= 0.0) {
            java.util.Optional<PatientTelemetry> prevTelem = telemetryRepository.findTopByPatientPatientIdOrderByHourIndexDesc(patientId);
            if (prevTelem.isPresent()) {
                PatientTelemetry prev = prevTelem.get();
                if ((lactate == null || lactate <= 0.0) && prev.getLactate() != null) { lactate = prev.getLactate(); request.setLactate(lactate); }
                if ((wbc == null || wbc <= 0.0) && prev.getWhiteBloodCellCount() != null) { wbc = prev.getWhiteBloodCellCount(); request.setWbc(wbc); }
                if ((creat == null || creat <= 0.0) && prev.getCreatinine() != null) { creat = prev.getCreatinine(); request.setCreatinine(creat); }
                if ((plat == null || plat <= 0.0) && prev.getPlatelets() != null) { plat = prev.getPlatelets(); request.setPlatelets(plat); }
            }
        }

        // 2. Persist hourly telemetry into database
        PatientTelemetry telemetry = PatientTelemetry.builder()
                .patient(patient)
                .hourIndex(request.getHourIndex())
                .heartRate(request.getHeartRate())
                .systolicBp(sbp)
                .diastolicBp(dbp)
                .meanArterialPressure(map)
                .respiratoryRate(request.getRespiratoryRate())
                .o2Saturation(request.getO2Saturation())
                .temperature(request.getTemperature())
                .lactate(request.getLactate())
                .whiteBloodCellCount(request.getWhiteBloodCellCount())
                .creatinine(request.getCreatinine())
                .platelets(request.getPlatelets())
                .recordedAt(LocalDateTime.now())
                .build();

        PatientTelemetry savedTelem = telemetryRepository.save(telemetry);

        // 3. Multi-Agent AI Evaluation (using normalized request)
        PatientEvaluationResponse evalResponse;
        try {
            evalResponse = aiServiceClient.evaluatePatientState(request);
        } catch (Exception e) {
            log.warn("FastAPI AI engine unreachable. Computing clinical consensus via internal rule engine: {}", e.getMessage());
            evalResponse = fallbackClinicalEvaluation(patient, request, shockIdx, map);
        }

        // 4. Persist TriageEvaluation
        TriageEvaluation triageEval = TriageEvaluation.builder()
                .patient(patient)
                .telemetry(savedTelem)
                .compositeSepsisRisk(evalResponse.getCompositeSepsisRisk())
                .urgencyLevel(evalResponse.getUrgencyLevel())
                .targetRole(evalResponse.getCompositeSepsisRisk() >= 0.60 ? "ROLE_DOCTOR" : "ROLE_NURSE")
                .shockIndex(shockIdx)
                .news2Score(evalResponse.getNews2Score())
                .discrepancyDetected(evalResponse.isDiscrepancyDetected())
                .sensorValid(true)
                .workflowStatus("COMPLETED_EVALUATION")
                .vitalsEvidenceJson(serializeJson(evalResponse.getVitalsEvidence()))
                .labsEvidenceJson(serializeJson(evalResponse.getLabsEvidence()))
                .skepticEvidenceJson(serializeJson(evalResponse.getSkepticEvidence()))
                .evidenceChainNarrative(evalResponse.getEvidenceChainNarrative())
                .evaluatedAt(LocalDateTime.now())
                .build();

        TriageEvaluation savedEval = evaluationRepository.save(triageEval);

        // 5. If Critical Sepsis or Septic Shock, auto-populate recommended Surviving Sepsis 1-Hour Bundle
        if ("CRITICAL_SEPSIS".equalsIgnoreCase(evalResponse.getUrgencyLevel()) || evalResponse.getCompositeSepsisRisk() >= 0.70) {
            createSepsisBundleOrders(savedEval, patient);
        }

        return evalResponse;
    }

    private void createSepsisBundleOrders(TriageEvaluation eval, Patient patient) {
        List<ClinicalActionOrder> existing = orderRepository.findPendingOrdersByPatient(patient.getPatientId());
        if (!existing.isEmpty()) {
            return; // Bundle already generated
        }

        List<ClinicalActionOrder> bundle = List.of(
                ClinicalActionOrder.builder()
                        .evaluation(eval)
                        .orderCode("ACT_BLOOD_CULTURES")
                        .actionName("Obtain STAT Blood Cultures x 2 (Aerobic & Anaerobic) prior to antibiotics")
                        .category("DIAGNOSTIC")
                        .priority("STAT")
                        .status(OrderStatus.RECOMMENDED)
                        .simulatedRecommendation(true)
                        .clinicalReviewRequired(true)
                        .rationale("Simulated recommendation: Identify causative pathogen prior to broad-spectrum antimicrobials. Requires physician clinical review.")
                        .build(),
                ClinicalActionOrder.builder()
                        .evaluation(eval)
                        .orderCode("ACT_ANTIBIOTICS")
                        .actionName("Administer Empiric Broad-Spectrum IV Antimicrobials (Meropenem 1g + Vancomycin 1.5g)")
                        .category("STAT RESUSCITATION")
                        .priority("STAT")
                        .status(OrderStatus.RECOMMENDED)
                        .simulatedRecommendation(true)
                        .clinicalReviewRequired(true)
                        .rationale("Simulated recommendation: Empiric coverage for suspected septic shock. Clinician must verify renal clearance (eGFR/Creatinine) and allergy profile.")
                        .build(),
                ClinicalActionOrder.builder()
                        .evaluation(eval)
                        .orderCode("ACT_FLUID_RESUSCITATION")
                        .actionName("Rapid IV Balanced Crystalloid Bolus 30 mL/kg (Plasma-Lyte / Lactated Ringer's)")
                        .category("STAT RESUSCITATION")
                        .priority("STAT")
                        .status(OrderStatus.RECOMMENDED)
                        .simulatedRecommendation(true)
                        .clinicalReviewRequired(true)
                        .rationale("Simulated recommendation: Indicated for MAP < 65 or elevated lactate. Clinician must assess fluid overload / congestive heart failure risks.")
                        .build(),
                ClinicalActionOrder.builder()
                        .evaluation(eval)
                        .orderCode("ACT_VASOPRESSORS")
                        .actionName("Initiate Continuous Norepinephrine Infusion (0.05 mcg/kg/min, titrate for MAP >= 65 mmHg)")
                        .category("SUPPORTIVE")
                        .priority("STAT")
                        .status(OrderStatus.RECOMMENDED)
                        .simulatedRecommendation(true)
                        .clinicalReviewRequired(true)
                        .rationale("Simulated recommendation: First-line vasopressor for septic shock refractory to fluid resuscitation. Clinician must titrate to arterial line readings.")
                        .build(),
                ClinicalActionOrder.builder()
                        .evaluation(eval)
                        .orderCode("ACT_RECHECK_LACTATE")
                        .actionName("Repeat Venous Blood Lactate in 2 to 4 Hours")
                        .category("DIAGNOSTIC")
                        .priority("RECOMMENDED")
                        .status(OrderStatus.RECOMMENDED)
                        .simulatedRecommendation(true)
                        .clinicalReviewRequired(true)
                        .rationale("Simulated recommendation: Surveillance of tissue hypoperfusion clearance (> 10-20% per 2 hours indicates reperfusion).")
                        .build()
        );

        orderRepository.saveAll(bundle);
        log.info("Auto-generated Surviving Sepsis 1-Hour Bundle (5 orders) for patient {}", patient.getPatientId());
    }

    private PatientEvaluationResponse fallbackClinicalEvaluation(Patient patient, TelemetryTickRequest request, double shockIndex, double map) {
        Double lactate = request.getLactate();
        double hr = request.getHeartRate();
        boolean critical = shockIndex >= 1.0 || (lactate != null && lactate >= 3.0) || hr >= 110;
        double risk = critical ? 0.84 : (shockIndex >= 0.8 || (lactate != null && lactate >= 2.0) ? 0.45 : 0.14);
        String urgency = critical ? "CRITICAL_SEPSIS" : (risk >= 0.35 ? "MODERATE" : "STABLE");

        Map<String, Object> vitalsMap = new HashMap<>();
        vitalsMap.put("shock_index", Math.round(shockIndex * 100.0) / 100.0);
        vitalsMap.put("map", Math.round(map * 10.0) / 10.0);
        vitalsMap.put("hr", hr);

        Map<String, Object> labsMap = new HashMap<>();
        if (lactate != null) labsMap.put("lactate", lactate);
        if (request.getWhiteBloodCellCount() != null) labsMap.put("wbc", request.getWhiteBloodCellCount());
        if (request.getCreatinine() != null) labsMap.put("creatinine", request.getCreatinine());
        if (request.getPlatelets() != null) labsMap.put("platelets", request.getPlatelets());

        Map<String, Object> skepticMap = new HashMap<>();
        skepticMap.put("classification", critical ? "REAL_SEPSIS_DETERIORATION" : "NORMAL_VARIATION");
        skepticMap.put("confidence", 0.92);
        skepticMap.put("evaluationSource", "HEURISTIC_RULE_FALLBACK");
        skepticMap.put("isDegraded", true);

        return PatientEvaluationResponse.builder()
                .patientId(patient.getPatientId())
                .hourIndex(request.getHourIndex())
                .urgencyLevel(urgency)
                .compositeSepsisRisk(risk)
                .shockIndex(Math.round(shockIndex * 100.0) / 100.0)
                .news2Score(critical ? 8 : 2)
                .discrepancyDetected(false)
                .requiresHitlAction(critical)
                .evidenceChainNarrative(critical
                        ? String.format("[CRITICAL_SEPSIS - FALLBACK]: Shock index %.2f with %s and MAP %.0f mmHg.",
                                shockIndex, lactate != null ? String.format("lactate %.1f mmol/L", lactate) : "acute tachycardia", map)
                        : "Physiological telemetry within stable therapeutic thresholds (rule-based fallback evaluation).")
                .vitalsEvidence(vitalsMap)
                .labsEvidence(labsMap)
                .skepticEvidence(skepticMap)
                .build();
    }

    private String serializeJson(Object obj) {
        if (obj == null) return "{}";
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }

    @Transactional
    public List<String> logStandaloneMedication(String patientId, StandaloneMedicationRequest request, String clinicianUsername) {
        Optional<Patient> patientOpt = patientRepository.findByPatientId(patientId);
        Patient patient;
        if (patientOpt.isEmpty()) {
            // Auto-admit patient first
            logTelemetryAndEvaluate(patientId, TelemetryTickRequest.builder().hourIndex(0).hr(80.0).sbp(120.0).dbp(80.0).resp(16.0).temp(37.0).o2Sat(98.0).build(), clinicianUsername);
            patient = getPatientProfile(patientId);
        } else {
            patient = patientOpt.get();
        }

        String medName = request.getMedicationName() != null ? request.getMedicationName().trim() : "";
        StringBuilder sb = new StringBuilder(medName);
        if (request.getDosage() != null && !request.getDosage().trim().isEmpty()) {
            sb.append(" ").append(request.getDosage().trim());
        }
        if (request.getRoute() != null && !request.getRoute().trim().isEmpty()) {
            sb.append(" (").append(request.getRoute().trim()).append(")");
        }
        if (request.getGlucoseValue() != null) {
            sb.append(" [Glucose: ").append(request.getGlucoseValue()).append(" mg/dL]");
        }
        if (request.getFluidVolumeMl() != null) {
            sb.append(" [Fluid: ").append(request.getFluidVolumeMl()).append(" mL]");
        }

        String fullEntry = sb.toString().trim();
        if (fullEntry.isEmpty()) {
            throw new IllegalArgumentException("Medication name, fluid, or glucose value must be provided.");
        }

        List<String> meds = patient.getActiveMedications();
        if (meds == null) {
            meds = new ArrayList<>();
        }
        boolean exists = meds.stream().anyMatch(m -> m.equalsIgnoreCase(fullEntry));
        if (!exists) {
            meds.add(fullEntry);
            patient.setActiveMedications(meds);
            patientRepository.save(patient);
            log.info("Clinician {} logged standalone medication entry '{}' for patient {}", clinicianUsername, fullEntry, patientId);
        }
        return meds;
    }

    @Transactional
    public void resetWardData() {
        log.info("Resetting ICU ward simulation data - wiping all patient records to clean 0-patient ward...");
        orderRepository.deleteAll();
        evaluationRepository.deleteAll();
        telemetryRepository.deleteAll();
        patientRepository.deleteAll();
        log.info("ICU ward reset complete: 0 patients, 8 available beds.");
    }
}
