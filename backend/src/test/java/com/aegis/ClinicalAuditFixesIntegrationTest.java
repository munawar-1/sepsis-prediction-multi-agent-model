package com.aegis;

import com.aegis.dto.AlertDispatchDto;
import com.aegis.dto.LoginRequest;
import com.aegis.dto.OrderAdministerRequest;
import com.aegis.dto.OrderSignRequest;
import com.aegis.dto.SignupRequest;
import com.aegis.dto.TelemetryTickRequest;
import com.aegis.model.ClinicalActionOrder;
import com.aegis.model.OrderStatus;
import com.aegis.model.Role;
import com.aegis.repository.ClinicalActionOrderRepository;
import com.aegis.repository.HitlAuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.test.annotation.DirtiesContext(classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
public class ClinicalAuditFixesIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClinicalActionOrderRepository orderRepository;

    @Autowired
    private HitlAuditLogRepository auditLogRepository;

    private String doctorJwt;
    private String nurseJwt;

    @BeforeEach
    void setUp() throws Exception {
        LoginRequest docLogin = LoginRequest.builder()
                .username("dr.munawar")
                .password("monu2007")
                .build();

        MvcResult docRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docLogin)))
                .andExpect(status().isOk())
                .andReturn();
        doctorJwt = objectMapper.readTree(docRes.getResponse().getContentAsString()).get("token").asText();

        LoginRequest nurseLogin = LoginRequest.builder()
                .username("nurse.priya")
                .password("Nurse123!")
                .build();

        MvcResult nurseRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nurseLogin)))
                .andExpect(status().isOk())
                .andReturn();
        nurseJwt = objectMapper.readTree(nurseRes.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    @DisplayName("Fix 1: Public signup rejects doctor role without authorized invitation code")
    void testDoctorSignupWithoutAuthorizedCodeIsForbidden() throws Exception {
        SignupRequest unverifiedRequest = SignupRequest.builder()
                .username("unauthorized.doc." + System.currentTimeMillis())
                .email("unauthorized." + System.currentTimeMillis() + "@gmail.com")
                .password("SecurePass123!")
                .fullName("Dr. Malicious SelfAssign")
                .role(Role.DOCTOR)
                .invitationCode("INVALID-HOSPITAL-CODE")
                .build();

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unverifiedRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("CLINICIAN_AUTHORIZATION_REQUIRED")));
    }

    @Test
    @DisplayName("Fix 1b: Public signup succeeds for doctor role with verified invitation code")
    void testDoctorSignupWithValidInvitationCodeSucceeds() throws Exception {
        SignupRequest validRequest = SignupRequest.builder()
                .username("dr.verified." + System.currentTimeMillis())
                .email("dr.verified." + System.currentTimeMillis() + "@aegis.icu")
                .password("SecurePass123!")
                .fullName("Dr. Verified Physician")
                .role(Role.DOCTOR)
                .invitationCode("AEGIS-CLINICAL-INVITE-2026")
                .department("Critical Care")
                .licenseNumber("MD-IND-90210")
                .build();

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.role", is("DOCTOR")));
    }

    @Test
    @DisplayName("Fix 2: Patient profile endpoint returns DTO and NEVER exposes password hashes")
    void testPatientProfileDoesNotLeakPasswordHash() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/patients/PT-9042")
                        .header("Authorization", "Bearer " + doctorJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId", is("PT-9042")))
                .andExpect(jsonPath("$.firstName", is("Vikram")))
                .andExpect(jsonPath("$.lastName", is("Mehta")))
                .andExpect(jsonPath("$.attendingDoctor", notNullValue()))
                .andExpect(jsonPath("$.attendingDoctor.username", is("dr.munawar")))
                .andReturn();

        String rawJson = result.getResponse().getContentAsString();
        // Strict HIPAA/Security assertion: Password hashes must NEVER be present anywhere in the payload
        assertFalse(rawJson.contains("\"password\""), "Patient response must not contain password field");
        assertFalse(rawJson.contains("$2a$"), "Patient response must not contain BCrypt hash prefix");
    }

    @Test
    @DisplayName("Fix 3: Telemetry ingest uses URL path variable as single source of truth")
    void testTelemetryIngestPathSourceOfTruthAndMapNormalization() throws Exception {
        // Request body has NO patient_id or a conflicting patient_id
        TelemetryTickRequest request = TelemetryTickRequest.builder()
                .hr(104.0)
                .sbp(95.0)
                .dbp(60.0)
                .resp(22.0)
                .o2Sat(94.0)
                .temp(38.3)
                .lactate(2.8)
                .wbc(15.2)
                .hourIndex(1)
                .build();

        mockMvc.perform(post("/api/v1/patients/PT-1003/telemetry")
                        .header("Authorization", "Bearer " + nurseJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patient_id", is("PT-1003")))
                .andExpect(jsonPath("$.urgency_level", notNullValue()))
                .andExpect(jsonPath("$.composite_sepsis_risk", notNullValue()));
    }

    @Test
    @DisplayName("Fix 4: Clinical alert explain is grounded in persisted evaluation evidence")
    void testClinicalAlertExplainGroundedInPersistedEvidence() throws Exception {
        com.aegis.dto.ClinicalExplainRequest request = com.aegis.dto.ClinicalExplainRequest.builder()
                .patientId("PT-9042")
                .question("Why was critical sepsis alert triggered?")
                .build();

        mockMvc.perform(post("/api/v1/alerts/explain")
                        .header("Authorization", "Bearer " + doctorJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId", is("PT-9042")))
                .andExpect(jsonPath("$.groundedInPersistedEvaluation", is(true)))
                .andExpect(jsonPath("$.agentContributions", notNullValue()))
                .andExpect(jsonPath("$.evidenceSummary", containsString("Shock index")));
    }

    @Test
    @DisplayName("Fix 5: Python orchestrator notification dispatch endpoint operates live")
    void testNotificationDispatchEndpoint() throws Exception {
        AlertDispatchDto alertDto = AlertDispatchDto.builder()
                .patientId("PT-9042")
                .targetRole("ROLE_DOCTOR")
                .alertTitle("CRITICAL SEPSIS ALERT - Bed 04")
                .urgency("CRITICAL_SEPSIS")
                .clinicalMessage("Consensus Sepsis-3 threshold breach: Shock index 1.34 with lactate 3.8 mmol/L.")
                .recommendedActions(List.of("Initiate 30 mL/kg IV crystalloid resuscitation", "Administer Broad-Spectrum IV Antimicrobials"))
                .timestamp("2026-11-03T21:45:00")
                .build();

        mockMvc.perform(post("/api/notifications/dispatch-alert")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(alertDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.delivered", is(true)))
                .andExpect(jsonPath("$.patientId", is("PT-9042")))
                .andExpect(jsonPath("$.targetRole", is("ROLE_DOCTOR")));
    }

    @Test
    @DisplayName("Fix 6: Order state-machine safety, nurse dose tracking, and HITL audit log")
    void testOrderStateSafetyAndNurseDoseTracking() throws Exception {
        List<ClinicalActionOrder> bed4Orders = orderRepository.findByEvaluationPatientPatientId("PT-9042");
        assertFalse(bed4Orders.isEmpty(), "Bed 4 orders should exist");

        ClinicalActionOrder targetOrder = bed4Orders.get(0);
        Long orderId = targetOrder.getId();

        // Step 1: Doctor signs order (transitions from RECOMMENDED to APPROVED)
        OrderSignRequest signRequest = OrderSignRequest.builder()
                .doctorNotes("Approved per Sepsis-3 consensus protocol. Initiate immediately.")
                .approved(true)
                .build();

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/sign")
                        .header("Authorization", "Bearer " + doctorJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderStatus", is("APPROVED")));

        // Step 1b: Verify that the authorized order appears directly on the Bedside Nurse's Task List
        mockMvc.perform(get("/api/v1/orders/nurse/tasks")
                        .header("Authorization", "Bearer " + nurseJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem(orderId.intValue())))
                .andExpect(jsonPath("$[*].status", hasItem("APPROVED")));

        // Step 2: Attempting to sign already APPROVED order should be REJECTED (state-safety check)
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/sign")
                        .header("Authorization", "Bearer " + doctorJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("ORDER_NOT_SIGNABLE")));

        // Step 3: Nurse administers approved order with dose documentation
        long auditCountBefore = auditLogRepository.count();

        OrderAdministerRequest adminRequest = OrderAdministerRequest.builder()
                .doseAdministered("500 mL IV Bolus infused via pressure bag at 21:45")
                .nurseNotes("Patient vitals re-checked post-infusion: MAP improved to 72 mmHg.")
                .build();

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/administer")
                        .header("Authorization", "Bearer " + nurseJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderStatus", is("EXECUTED")));

        // Step 4: Verify that nurse administration generated a cryptographic HITL audit record
        long auditCountAfter = auditLogRepository.count();
        assertTrue(auditCountAfter > auditCountBefore, "HITL Audit log count must increase after nurse administration");

        ClinicalActionOrder completedOrder = orderRepository.findById(orderId).orElseThrow();
        assertEquals(OrderStatus.EXECUTED, completedOrder.getStatus());
        assertTrue(completedOrder.getSimulatedRecommendation(), "Order disclaimer should reflect simulated recommendation");
        assertTrue(completedOrder.getClinicalReviewRequired(), "Order disclaimer should reflect clinical review required");
        assertNotNull(completedOrder.getRationale());
        assertTrue(completedOrder.getRationale().contains("Dose: 500 mL IV Bolus"));
    }

    @Test
    @DisplayName("Fix 7: Swagger UI and OpenAPI 3 schema endpoints are operational and accessible")
    void testSwaggerDocumentationAccessible() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi", notNullValue()))
                .andExpect(jsonPath("$.info.title", containsString("Aegis-ICU")));

        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }
}
