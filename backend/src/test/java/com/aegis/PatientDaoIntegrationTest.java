package com.aegis;

import com.aegis.model.*;
import com.aegis.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class PatientDaoIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private PatientTelemetryRepository telemetryRepository;

    @Autowired
    private TriageEvaluationRepository evaluationRepository;

    @Autowired
    private ClinicalActionOrderRepository orderRepository;

    private User doctor;
    private User nurse;
    private Patient patient;

    @BeforeEach
    void setUp() {
        // 1. Seed Doctor
        doctor = userRepository.save(User.builder()
                .username("dr_sharma")
                .email("dr.sharma@hospital.org")
                .password("$2a$10$hashedpassword")
                .fullName("Dr. Rajesh Sharma, MD")
                .department("Critical Care Medicine")
                .specialty("Intensivist")
                .licenseNumber("MCI-19482")
                .role(Role.DOCTOR)
                .shiftStatus("ON_DUTY")
                .build());

        // 2. Seed Nurse
        nurse = userRepository.save(User.builder()
                .username("nurse_anita")
                .email("anita.r@hospital.org")
                .password("$2a$10$hashedpassword")
                .fullName("Anita Roy, RN")
                .department("ICU South Wing")
                .licenseNumber("INC-83921")
                .role(Role.NURSE)
                .shiftStatus("ON_DUTY")
                .build());

        // 3. Seed Patient
        patient = patientRepository.save(Patient.builder()
                .patientId("bed_icu_04")
                .mrn("MRN-DAO-TEST-001")
                .firstName("Vikram")
                .lastName("Mehta")
                .age(64)
                .gender(Gender.MALE)
                .icuBedNumber("ICU-BED-99")
                .admissionTime(LocalDateTime.now().minusDays(1))
                .primaryDiagnosis("Community-Acquired Lobar Pneumonia")
                .activeMedications(List.of("Albuterol 0.83 mg/mL", "Metoprolol 25mg", "Ceftriaxone 1g"))
                .attendingDoctor(doctor)
                .primaryNurse(nurse)
                .status(PatientStatus.ADMITTED)
                .clinicalNotes("Patient showing early signs of tachypnea.")
                .build());
    }

    @Test
    @DisplayName("1. Verify Patient persistence and Clinician assignment queries")
    void testPatientPersistenceAndQueries() {
        Optional<Patient> found = patientRepository.findByPatientId("bed_icu_04");
        assertTrue(found.isPresent());
        assertEquals("Vikram", found.get().getFirstName());
        assertEquals("ICU-BED-99", found.get().getIcuBedNumber());

        // Query by Doctor
        List<Patient> docPatients = patientRepository.findActivePatientsByDoctor(doctor.getId());
        assertEquals(1, docPatients.size());
        assertEquals("bed_icu_04", docPatients.get(0).getPatientId());

        // Query by Nurse
        List<Patient> nursePatients = patientRepository.findActivePatientsByNurse(nurse.getId());
        assertEquals(1, nursePatients.size());
        assertEquals("bed_icu_04", nursePatients.get(0).getPatientId());

        // Check active medications collection
        assertEquals(3, found.get().getActiveMedications().size());
        assertTrue(found.get().getActiveMedications().contains("Albuterol 0.83 mg/mL"));
    }

    @Test
    @DisplayName("2. Verify Patient Telemetry time-series DAO operations")
    void testTelemetryPersistenceAndOrdering() {
        // Record Hour 0
        telemetryRepository.save(PatientTelemetry.builder()
                .patient(patient)
                .hourIndex(0)
                .heartRate(82.0)
                .systolicBp(124.0)
                .diastolicBp(80.0)
                .meanArterialPressure(94.0)
                .respiratoryRate(16.0)
                .o2Saturation(98.0)
                .temperature(37.0)
                .lactate(1.2)
                .whiteBloodCellCount(9.8)
                .build());

        // Record Hour 1 (Deterioration)
        telemetryRepository.save(PatientTelemetry.builder()
                .patient(patient)
                .hourIndex(1)
                .heartRate(114.0)
                .systolicBp(102.0)
                .diastolicBp(68.0)
                .meanArterialPressure(79.0)
                .respiratoryRate(24.0)
                .o2Saturation(93.0)
                .temperature(38.4)
                .lactate(3.4)
                .whiteBloodCellCount(16.8)
                .build());

        List<PatientTelemetry> series = telemetryRepository.findByPatientPatientIdOrderByHourIndexAsc("bed_icu_04");
        assertEquals(2, series.size());
        assertEquals(0, series.get(0).getHourIndex());
        assertEquals(1, series.get(1).getHourIndex());

        Optional<PatientTelemetry> latest = telemetryRepository.findTopByPatientPatientIdOrderByHourIndexDesc("bed_icu_04");
        assertTrue(latest.isPresent());
        assertEquals(1, latest.get().getHourIndex());
        assertEquals(114.0, latest.get().getHeartRate());
    }

    @Test
    @DisplayName("3. Verify TriageEvaluation multi-agent verdict DAO persistence")
    void testTriageEvaluationPersistence() {
        PatientTelemetry telem = telemetryRepository.save(PatientTelemetry.builder()
                .patient(patient)
                .hourIndex(1)
                .heartRate(112.0)
                .systolicBp(104.0)
                .respiratoryRate(23.0)
                .lactate(3.2)
                .build());

        TriageEvaluation eval = evaluationRepository.save(TriageEvaluation.builder()
                .patient(patient)
                .telemetry(telem)
                .compositeSepsisRisk(0.543)
                .urgencyLevel("CRITICAL_SEPSIS")
                .targetRole("ROLE_DOCTOR")
                .shockIndex(1.08)
                .news2Score(7)
                .discrepancyDetected(false)
                .sensorValid(true)
                .workflowStatus("COMPLETED_CLINICAL_EVALUATION")
                .vitalsEvidenceJson("{\"vitals_risk\": 0.543, \"shap\": {\"Shock Index\": 0.32}}")
                .labsEvidenceJson("{\"labs_risk\": 0.601, \"organ_tier\": \"SEVERE\"}")
                .skepticEvidenceJson("{\"classification\": \"REAL_SEPSIS_DETERIORATION\", \"discount\": 0.05}")
                .evidenceChainNarrative("[CRITICAL_SEPSIS]: Shock index 1.08 with severe hyperlactatemia.")
                .build());

        assertNotNull(eval.getId());

        // Test custom repository queries
        List<TriageEvaluation> criticalAlerts = evaluationRepository.findAllCriticalSepsisAlerts();
        assertFalse(criticalAlerts.isEmpty());
        assertEquals("CRITICAL_SEPSIS", criticalAlerts.get(0).getUrgencyLevel());

        Optional<TriageEvaluation> latestEval = evaluationRepository.findTopByPatientPatientIdOrderByEvaluatedAtDesc("bed_icu_04");
        assertTrue(latestEval.isPresent());
        assertEquals(0.543, latestEval.get().getCompositeSepsisRisk(), 0.001);
    }

    @Test
    @DisplayName("4. Verify Clinical Action Orders (Surviving Sepsis Bundle) DAO execution")
    void testClinicalActionOrdersLifecycle() {
        TriageEvaluation eval = evaluationRepository.save(TriageEvaluation.builder()
                .patient(patient)
                .compositeSepsisRisk(0.62)
                .urgencyLevel("CRITICAL_SEPSIS")
                .targetRole("ROLE_DOCTOR")
                .build());

        ClinicalActionOrder order1 = orderRepository.save(ClinicalActionOrder.builder()
                .evaluation(eval)
                .orderCode("ACT_BLOOD_CULTURES")
                .actionName("Obtain STAT Blood Cultures (Aerobic & Anaerobic)")
                .category("STAT RESUSCITATION")
                .priority("STAT")
                .status(OrderStatus.RECOMMENDED)
                .rationale("Identify pathogen prior to initiating broad-spectrum antimicrobials.")
                .build());

        ClinicalActionOrder order2 = orderRepository.save(ClinicalActionOrder.builder()
                .evaluation(eval)
                .orderCode("ACT_ANTIBIOTICS")
                .actionName("Administer Empiric Broad-Spectrum IV Antimicrobials")
                .category("STAT RESUSCITATION")
                .priority("STAT")
                .status(OrderStatus.RECOMMENDED)
                .rationale("1-hour Sepsis-3 bundle adherence.")
                .build());

        List<ClinicalActionOrder> pending = orderRepository.findPendingOrdersByPatient("bed_icu_04");
        assertEquals(2, pending.size());

        // Doctor approves and signs order 1
        order1.setStatus(OrderStatus.APPROVED);
        order1.setSignedBy(doctor);
        order1.setExecutedAt(LocalDateTime.now());
        orderRepository.save(order1);

        ClinicalActionOrder updated = orderRepository.findById(order1.getId()).orElseThrow();
        assertEquals(OrderStatus.APPROVED, updated.getStatus());
        assertEquals(doctor.getId(), updated.getSignedBy().getId());
    }
}
