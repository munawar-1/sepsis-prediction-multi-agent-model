package com.aegis.config;

import com.aegis.model.*;
import com.aegis.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PatientRepository patientRepository;
    private final PatientTelemetryRepository telemetryRepository;
    private final TriageEvaluationRepository evaluationRepository;
    private final ClinicalActionOrderRepository orderRepository;

    @Override
    @Transactional
    public void run(String... args) {
        User doctorMunawar = seedDoctorMunawar();
        User doctorSharma = seedDoctorSharma();
        User nursePriya = seedNursePriya();

        // Seed initial ICU beds and baseline patients if unpopulated
        if (patientRepository.count() == 0) {
            log.info("Seeding initial ICU beds and baseline patients including Bed 04 PT-9042...");
            seedIcuPatients(doctorMunawar, nursePriya);
            log.info("Initial ICU bed roster populated successfully.");
        }
    }

    private User seedDoctorMunawar() {
        return userRepository.findByUsername("dr.munawar")
                .or(() -> userRepository.findByEmail("mohammad.munawar2007@gmail.com"))
                .orElseGet(() -> {
                    User doctor = User.builder()
                            .username("dr.munawar")
                            .email("mohammad.munawar2007@gmail.com")
                            .password(passwordEncoder.encode("monu2007"))
                            .fullName("Dr. Mohammad Munawar, MD")
                            .role(Role.DOCTOR)
                            .department("Critical Care & Intensive Care Medicine")
                            .specialty("Chief Attending Intensivist")
                            .licenseNumber("MCI-DEL-2026-9901")
                            .phoneNumber("+91-9876543210")
                            .pagerNumber("PAGER-ICU-01")
                            .shiftStatus("ON_DUTY")
                            .enabled(true)
                            .build();
                    User saved = userRepository.save(doctor);
                    log.info("Primary Attending Doctor seeded: username=dr.munawar, role=DOCTOR");
                    return saved;
                });
    }

    private User seedDoctorSharma() {
        return userRepository.findByUsername("dr.sharma")
                .orElseGet(() -> {
                    User doctor = User.builder()
                            .username("dr.sharma")
                            .email("dr.sharma@aegis.icu")
                            .password(passwordEncoder.encode("Doctor123!"))
                            .fullName("Dr. Rajesh Sharma, MD")
                            .role(Role.DOCTOR)
                            .department("Critical Care & Pulmonology")
                            .licenseNumber("MED-CC-90210")
                            .enabled(true)
                            .build();
                    User saved = userRepository.save(doctor);
                    log.info("Default Attending Doctor seeded: username=dr.sharma, role=DOCTOR");
                    return saved;
                });
    }

    private User seedNursePriya() {
        return userRepository.findByUsername("nurse.priya")
                .orElseGet(() -> {
                    User nurse = User.builder()
                            .username("nurse.priya")
                            .email("priya.patel@aegis.icu")
                            .password(passwordEncoder.encode("Nurse123!"))
                            .fullName("Priya Patel, BSN, RN, CCRN")
                            .role(Role.NURSE)
                            .department("Medical Intensive Care Unit (MICU)")
                            .licenseNumber("RN-ICU-44102")
                            .enabled(true)
                            .build();
                    User saved = userRepository.save(nurse);
                    log.info("Default Bedside Nurse seeded: username=nurse.priya, role=NURSE");
                    return saved;
                });
    }

    private void seedIcuPatients(User doctor, User nurse) {
        if (patientRepository.count() > 0) {
            return; // Patients already seeded
        }

        log.info("Seeding realistic clinical ICU beds (Beds 01 to 04)...");

        // BED 01: GREEN (Stable Post-Op)
        Patient bed1 = patientRepository.save(Patient.builder()
                .patientId("PT-1001")
                .mrn("MRN-2026-1001")
                .firstName("John")
                .lastName("Doe")
                .age(58)
                .gender(Gender.MALE)
                .icuBedNumber("ICU-BED-01")
                .primaryDiagnosis("Coronary Artery Disease / Post-Op CABG Day 2")
                .activeMedications(List.of("Aspirin 81mg", "Atorvastatin 40mg", "Metoprolol 25mg"))
                .attendingDoctor(doctor)
                .primaryNurse(nurse)
                .status(PatientStatus.ADMITTED)
                .admissionTime(LocalDateTime.now().minusDays(2))
                .clinicalNotes("Extubated. Hemodynamically stable. Transfer to step-down ward planned tomorrow.")
                .build());

        PatientTelemetry telem1 = telemetryRepository.save(PatientTelemetry.builder()
                .patient(bed1)
                .hourIndex(0)
                .heartRate(74.0)
                .systolicBp(122.0)
                .diastolicBp(78.0)
                .meanArterialPressure(92.0)
                .respiratoryRate(15.0)
                .o2Saturation(98.0)
                .temperature(36.8)
                .lactate(1.1)
                .whiteBloodCellCount(8.5)
                .recordedAt(LocalDateTime.now().minusMinutes(25))
                .build());

        evaluationRepository.save(TriageEvaluation.builder()
                .patient(bed1)
                .telemetry(telem1)
                .compositeSepsisRisk(0.12)
                .urgencyLevel("STABLE")
                .targetRole("ROLE_NURSE")
                .shockIndex(0.60)
                .news2Score(1)
                .sensorValid(true)
                .evidenceChainNarrative("Physiological telemetry within stable baseline parameters.")
                .evaluatedAt(LocalDateTime.now().minusMinutes(25))
                .build());

        // BED 02: GREEN (Stable Resolving)
        Patient bed2 = patientRepository.save(Patient.builder()
                .patientId("PT-1002")
                .mrn("MRN-2026-1002")
                .firstName("Sarah")
                .lastName("Jenkins")
                .age(45)
                .gender(Gender.FEMALE)
                .icuBedNumber("ICU-BED-02")
                .primaryDiagnosis("Diabetic Ketoacidosis (DKA) - Anion Gap Closed")
                .activeMedications(List.of("Subcutaneous Insulin Glargine", "Potassium Chloride 20 mEq"))
                .attendingDoctor(doctor)
                .primaryNurse(nurse)
                .status(PatientStatus.ADMITTED)
                .admissionTime(LocalDateTime.now().minusDays(1))
                .clinicalNotes("DKA protocol completed. Transitioned to subcutaneous insulin.")
                .build());

        PatientTelemetry telem2 = telemetryRepository.save(PatientTelemetry.builder()
                .patient(bed2)
                .hourIndex(0)
                .heartRate(82.0)
                .systolicBp(118.0)
                .diastolicBp(74.0)
                .meanArterialPressure(88.0)
                .respiratoryRate(16.0)
                .o2Saturation(99.0)
                .temperature(37.1)
                .lactate(1.4)
                .whiteBloodCellCount(11.2)
                .recordedAt(LocalDateTime.now().minusMinutes(18))
                .build());

        evaluationRepository.save(TriageEvaluation.builder()
                .patient(bed2)
                .telemetry(telem2)
                .compositeSepsisRisk(0.18)
                .urgencyLevel("STABLE")
                .targetRole("ROLE_NURSE")
                .shockIndex(0.69)
                .news2Score(1)
                .sensorValid(true)
                .evidenceChainNarrative("Anion gap normalized. Electrolytes stable.")
                .evaluatedAt(LocalDateTime.now().minusMinutes(18))
                .build());

        // BED 03: YELLOW (Compensated Sepsis Surveillance)
        Patient bed3 = patientRepository.save(Patient.builder()
                .patientId("PT-1003")
                .mrn("MRN-2026-1003")
                .firstName("Anita")
                .lastName("Roy")
                .age(71)
                .gender(Gender.FEMALE)
                .icuBedNumber("ICU-BED-03")
                .primaryDiagnosis("Complicated UTI / Urosepsis Surveillance")
                .activeMedications(List.of("Ceftriaxone 2g IV", "IV Maintenance Fluids 75 mL/hr"))
                .attendingDoctor(doctor)
                .primaryNurse(nurse)
                .status(PatientStatus.ADMITTED)
                .admissionTime(LocalDateTime.now().minusHours(14))
                .clinicalNotes("Low-grade fever with mild tachycardia. Monitored for occult deterioration.")
                .build());

        PatientTelemetry telem3 = telemetryRepository.save(PatientTelemetry.builder()
                .patient(bed3)
                .hourIndex(0)
                .heartRate(98.0)
                .systolicBp(108.0)
                .diastolicBp(68.0)
                .meanArterialPressure(81.0)
                .respiratoryRate(20.0)
                .o2Saturation(95.0)
                .temperature(38.2)
                .lactate(2.2)
                .whiteBloodCellCount(14.1)
                .recordedAt(LocalDateTime.now().minusMinutes(12))
                .build());

        evaluationRepository.save(TriageEvaluation.builder()
                .patient(bed3)
                .telemetry(telem3)
                .compositeSepsisRisk(0.45)
                .urgencyLevel("MODERATE")
                .targetRole("ROLE_DOCTOR")
                .shockIndex(0.90)
                .news2Score(4)
                .sensorValid(true)
                .evidenceChainNarrative("[MODERATE]: Mild tachycardia and low-grade pyrexia. Subclinical vitals strain.")
                .evaluatedAt(LocalDateTime.now().minusMinutes(12))
                .build());

        // BED 04: RED ALERT (Critical Septic Shock - Vikram Mehta)
        Patient bed4 = patientRepository.save(Patient.builder()
                .patientId("PT-9042")
                .mrn("MRN-2026-9042")
                .firstName("Vikram")
                .lastName("Mehta")
                .age(64)
                .gender(Gender.MALE)
                .icuBedNumber("ICU-BED-04")
                .primaryDiagnosis("Acute Hypoxemic Respiratory Failure / Severe Lobar Pneumonia")
                .activeMedications(List.of("Norepinephrine 0.08 mcg/kg/min", "Vancomycin IV 1.25g", "Metoprolol 50mg (Held)"))
                .attendingDoctor(doctor)
                .primaryNurse(nurse)
                .status(PatientStatus.ADMITTED)
                .admissionTime(LocalDateTime.now().minusHours(6))
                .clinicalNotes("Patient showing acute signs of septic shock decompensation. Refractory to initial fluids.")
                .build());

        // Seed 4 hours of progressive deterioration telemetry and model evaluations for Bed 04
        PatientTelemetry b4Telem0 = telemetryRepository.save(PatientTelemetry.builder()
                .patient(bed4)
                .hourIndex(0)
                .heartRate(84.0)
                .systolicBp(124.0)
                .diastolicBp(80.0)
                .meanArterialPressure(94.0)
                .respiratoryRate(16.0)
                .o2Saturation(97.0)
                .temperature(37.2)
                .lactate(1.3)
                .whiteBloodCellCount(10.2)
                .recordedAt(LocalDateTime.now().minusHours(3))
                .build());

        evaluationRepository.save(TriageEvaluation.builder()
                .patient(bed4)
                .telemetry(b4Telem0)
                .compositeSepsisRisk(0.12)
                .urgencyLevel("STABLE")
                .targetRole("ROLE_NURSE")
                .shockIndex(0.68)
                .news2Score(1)
                .sensorValid(true)
                .workflowStatus("BASELINE")
                .evidenceChainNarrative("Baseline post-admission vitals stable. Normal physiological thresholds.")
                .vitalsEvidenceJson("{\"shock_index\": 0.68, \"hr\": 84, \"map\": 94, \"temp\": 37.2}")
                .labsEvidenceJson("{\"lactate\": 1.3, \"wbc\": 10.2, \"tier\": \"NORMAL\"}")
                .skepticEvidenceJson("{\"classification\": \"STABLE\", \"confidence\": 0.95}")
                .evaluatedAt(LocalDateTime.now().minusHours(3))
                .build());

        PatientTelemetry b4Telem1 = telemetryRepository.save(PatientTelemetry.builder()
                .patient(bed4)
                .hourIndex(1)
                .heartRate(96.0)
                .systolicBp(114.0)
                .diastolicBp(72.0)
                .meanArterialPressure(86.0)
                .respiratoryRate(19.0)
                .o2Saturation(95.0)
                .temperature(37.8)
                .lactate(1.8)
                .whiteBloodCellCount(12.4)
                .recordedAt(LocalDateTime.now().minusHours(2))
                .build());

        evaluationRepository.save(TriageEvaluation.builder()
                .patient(bed4)
                .telemetry(b4Telem1)
                .compositeSepsisRisk(0.38)
                .urgencyLevel("STABLE")
                .targetRole("ROLE_NURSE")
                .shockIndex(0.84)
                .news2Score(3)
                .sensorValid(true)
                .workflowStatus("MONITORING")
                .evidenceChainNarrative("Mild subclinical tachycardia (96 bpm) and lactate elevation to 1.8 mmol/L.")
                .vitalsEvidenceJson("{\"shock_index\": 0.84, \"hr\": 96, \"map\": 86, \"temp\": 37.8}")
                .labsEvidenceJson("{\"lactate\": 1.8, \"wbc\": 12.4, \"tier\": \"SUBCLINICAL\"}")
                .skepticEvidenceJson("{\"classification\": \"EARLY_WARNING\", \"confidence\": 0.91}")
                .evaluatedAt(LocalDateTime.now().minusHours(2))
                .build());

        PatientTelemetry b4Telem2 = telemetryRepository.save(PatientTelemetry.builder()
                .patient(bed4)
                .hourIndex(2)
                .heartRate(108.0)
                .systolicBp(102.0)
                .diastolicBp(64.0)
                .meanArterialPressure(76.0)
                .respiratoryRate(23.0)
                .o2Saturation(93.0)
                .temperature(38.4)
                .lactate(2.6)
                .whiteBloodCellCount(14.8)
                .recordedAt(LocalDateTime.now().minusHours(1))
                .build());

        evaluationRepository.save(TriageEvaluation.builder()
                .patient(bed4)
                .telemetry(b4Telem2)
                .compositeSepsisRisk(0.65)
                .urgencyLevel("MODERATE")
                .targetRole("ROLE_DOCTOR")
                .shockIndex(1.06)
                .news2Score(6)
                .sensorValid(true)
                .workflowStatus("SURVEILLANCE")
                .evidenceChainNarrative("[MODERATE]: Progressive tachycardia (108 bpm) with shock index exceeding 1.0 and lactate 2.6 mmol/L.")
                .vitalsEvidenceJson("{\"shock_index\": 1.06, \"hr\": 108, \"map\": 76, \"temp\": 38.4}")
                .labsEvidenceJson("{\"lactate\": 2.6, \"wbc\": 14.8, \"tier\": \"ELEVATED\"}")
                .skepticEvidenceJson("{\"classification\": \"SUBCLINICAL_DETERIORATION\", \"confidence\": 0.93}")
                .evaluatedAt(LocalDateTime.now().minusHours(1))
                .build());

        PatientTelemetry latestTelem4 = telemetryRepository.save(PatientTelemetry.builder()
                .patient(bed4)
                .hourIndex(3)
                .heartRate(118.0)
                .systolicBp(88.0)
                .diastolicBp(54.0)
                .meanArterialPressure(65.0)
                .respiratoryRate(26.0)
                .o2Saturation(92.0)
                .temperature(38.9)
                .lactate(3.8)
                .whiteBloodCellCount(16.4)
                .creatinine(1.8)
                .platelets(138.0)
                .recordedAt(LocalDateTime.now().minusMinutes(5))
                .build());

        TriageEvaluation criticalEval = evaluationRepository.save(TriageEvaluation.builder()
                .patient(bed4)
                .telemetry(latestTelem4)
                .compositeSepsisRisk(0.84)
                .urgencyLevel("CRITICAL_SEPSIS")
                .targetRole("ROLE_DOCTOR")
                .shockIndex(1.34)
                .news2Score(9)
                .discrepancyDetected(false)
                .sensorValid(true)
                .workflowStatus("ACTIVE_ALERT")
                .evidenceChainNarrative("[CRITICAL_SEPSIS]: Shock index 1.34 with acute MAP drop to 65 mmHg and hyperlactatemia 3.8 mmol/L. Meets Sepsis-3 consensus criteria.")
                .vitalsEvidenceJson("{\"shock_index\": 1.34, \"hr\": 118, \"map\": 65, \"temp\": 38.9, \"shap\": {\"Shock Index\": 0.44, \"MAP Rate\": 0.32}}")
                .labsEvidenceJson("{\"lactate\": 3.8, \"wbc\": 16.4, \"creatinine\": 1.8, \"tier\": \"CRITICAL\"}")
                .skepticEvidenceJson("{\"classification\": \"REAL_SEPSIS_DETERIORATION\", \"confidence\": 0.94, \"discount\": 0.05}")
                .evaluatedAt(LocalDateTime.now().minusMinutes(5))
                .build());

        // Pre-populate recommended Surviving Sepsis Campaign 1-Hour Bundle Orders for Bed 04
        orderRepository.saveAll(List.of(
                ClinicalActionOrder.builder()
                        .evaluation(criticalEval)
                        .orderCode("ACT_BLOOD_CULTURES")
                        .actionName("Obtain STAT Blood Cultures x 2 (Aerobic & Anaerobic) prior to antibiotics")
                        .category("DIAGNOSTIC")
                        .priority("STAT")
                        .status(OrderStatus.RECOMMENDED)
                        .simulatedRecommendation(true)
                        .clinicalReviewRequired(true)
                        .rationale("Simulated Surviving Sepsis recommendation. Clinician must verify allergies and vein access before signing.")
                        .build(),
                ClinicalActionOrder.builder()
                        .evaluation(criticalEval)
                        .orderCode("ACT_ANTIBIOTICS")
                        .actionName("Administer Empiric Broad-Spectrum IV Antimicrobials (Meropenem 1g + Vancomycin 1.5g)")
                        .category("STAT RESUSCITATION")
                        .priority("STAT")
                        .status(OrderStatus.RECOMMENDED)
                        .simulatedRecommendation(true)
                        .clinicalReviewRequired(true)
                        .rationale("Simulated Surviving Sepsis recommendation. Clinician must verify renal function (GFR/Creatinine) and weight-based dosing before signing.")
                        .build(),
                ClinicalActionOrder.builder()
                        .evaluation(criticalEval)
                        .orderCode("ACT_FLUID_RESUSCITATION")
                        .actionName("Rapid IV Balanced Crystalloid Bolus 30 mL/kg (Plasma-Lyte / Lactated Ringer's)")
                        .category("STAT RESUSCITATION")
                        .priority("STAT")
                        .status(OrderStatus.RECOMMENDED)
                        .simulatedRecommendation(true)
                        .clinicalReviewRequired(true)
                        .rationale("Simulated Surviving Sepsis recommendation. Clinician must assess fluid responsiveness and heart failure history before signing.")
                        .build(),
                ClinicalActionOrder.builder()
                        .evaluation(criticalEval)
                        .orderCode("ACT_VASOPRESSORS")
                        .actionName("Initiate Norepinephrine Infusion (Titrate to target MAP >= 65 mmHg)")
                        .category("SUPPORTIVE")
                        .priority("STAT")
                        .status(OrderStatus.RECOMMENDED)
                        .simulatedRecommendation(true)
                        .clinicalReviewRequired(true)
                        .rationale("Simulated Surviving Sepsis recommendation. First-line vasopressor for septic shock refractory to initial fluid bolus.")
                        .build(),
                ClinicalActionOrder.builder()
                        .evaluation(criticalEval)
                        .orderCode("ACT_RECHECK_LACTATE")
                        .actionName("Repeat Venous Blood Lactate in 2 to 4 Hours")
                        .category("DIAGNOSTIC")
                        .priority("RECOMMENDED")
                        .status(OrderStatus.RECOMMENDED)
                        .simulatedRecommendation(true)
                        .clinicalReviewRequired(true)
                        .rationale("Simulated Surviving Sepsis recommendation. Surveillance of tissue hypoperfusion clearance.")
                        .build()
        ));

        log.info("Successfully seeded 4 ICU beds with complete historical telemetry, multi-agent triage evaluations, and Sepsis-3 bundle orders.");
    }
}
