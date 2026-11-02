package com.aegis;

import com.aegis.dto.LoginRequest;
import com.aegis.dto.TelemetryTickRequest;
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
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AiBackendIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private HitlAuditLogRepository auditLogRepository;

    private String doctorToken;
    private String nurseToken;

    @BeforeEach
    void setUp() throws Exception {
        // Authenticate Doctor
        LoginRequest docLogin = LoginRequest.builder()
                .username("dr.sharma")
                .password("Doctor123!")
                .build();
        MvcResult docRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docLogin)))
                .andReturn();
        doctorToken = objectMapper.readTree(docRes.getResponse().getContentAsString()).get("token").asText();

        // Authenticate Nurse
        LoginRequest nurseLogin = LoginRequest.builder()
                .username("nurse.priya")
                .password("Nurse123!")
                .build();
        MvcResult nurseRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nurseLogin)))
                .andReturn();
        nurseToken = objectMapper.readTree(nurseRes.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    @DisplayName("1. AI Health check endpoint reports FastAPI status and loaded models")
    void testAiHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/clinical/ai-health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("HEALTHY")))
                .andExpect(jsonPath("$.models_loaded", is(4)))
                .andExpect(jsonPath("$.reachable", is(true)));
    }

    @Test
    @DisplayName("2. Unauthenticated call to evaluate patient state is rejected with 401")
    void testUnauthenticatedEvaluateFails() throws Exception {
        TelemetryTickRequest req = TelemetryTickRequest.builder()
                .patientId("p000011")
                .hourIndex(22)
                .hr(101.0)
                .build();

        mockMvc.perform(post("/api/v1/clinical/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("UNAUTHORIZED")));
    }

    @Test
    @DisplayName("3. Doctor sends real patient telemetry to Spring Boot -> FastAPI returns real prediction & SHAP")
    void testDoctorSendsRealTelemetry() throws Exception {
        TelemetryTickRequest req = TelemetryTickRequest.builder()
                .patientId("p000011")
                .hourIndex(22)
                .hr(101.0)
                .sbp(146.0)
                .resp(21.0)
                .o2Sat(98.0)
                .temp(37.0)
                .lactate(1.1)
                .activeMedications(List.of("Albuterol 0.83 mg/mL Inhalation Solution"))
                .build();

        mockMvc.perform(post("/api/v1/clinical/evaluate")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patient_id", is("p000011")))
                .andExpect(jsonPath("$.hour_index", is(22)))
                .andExpect(jsonPath("$.composite_sepsis_risk", notNullValue()))
                .andExpect(jsonPath("$.urgency_level", notNullValue()))
                .andExpect(jsonPath("$.vitals_evidence.vitals_risk_probability", notNullValue()))
                .andExpect(jsonPath("$.vitals_evidence.shap_contributions", notNullValue()))
                .andExpect(jsonPath("$.labs_evidence.labs_risk_probability", notNullValue()))
                .andExpect(jsonPath("$.skeptic_evidence.confidence_discount_factor", notNullValue()))
                .andExpect(jsonPath("$.evidence_chain_narrative", notNullValue()))
                .andExpect(jsonPath("$.recommended_action_bundle", notNullValue()));
    }

    @Test
    @DisplayName("4. Nurse can also submit telemetry for evaluation")
    void testNurseSubmitsTelemetry() throws Exception {
        TelemetryTickRequest req = TelemetryTickRequest.builder()
                .patientId("p000011")
                .hourIndex(23)
                .hr(105.0)
                .sbp(140.0)
                .resp(22.0)
                .o2Sat(97.0)
                .temp(37.2)
                .lactate(1.2)
                .build();

        mockMvc.perform(post("/api/v1/clinical/evaluate")
                        .header("Authorization", "Bearer " + nurseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patient_id", is("p000011")))
                .andExpect(jsonPath("$.composite_sepsis_risk", notNullValue()));
    }

    @Test
    @DisplayName("5. Physiological sanity check catches impossible heart rate (e.g. -50 or 999 bpm)")
    void testPhysiologicalValidationRejection() throws Exception {
        TelemetryTickRequest invalidReq = TelemetryTickRequest.builder()
                .patientId("p000011")
                .hourIndex(5)
                .hr(-50.0) // Impossible negative HR
                .sbp(120.0)
                .build();

        mockMvc.perform(post("/api/v1/clinical/evaluate")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("PHYSIOLOGICAL_RANGE_VALIDATION_ERROR")))
                .andExpect(jsonPath("$.message", containsString("Physiologically invalid Heart Rate")));
    }

    @Test
    @DisplayName("6. Missing required patient_id or negative hour_index is rejected")
    void testMissingRequiredFieldsRejection() throws Exception {
        TelemetryTickRequest invalidReq = TelemetryTickRequest.builder()
                .patientId("") // Blank ID
                .hourIndex(-1) // Negative hour
                .hr(80.0)
                .build();

        mockMvc.perform(post("/api/v1/clinical/evaluate")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("7. HITL Decision persists real audit record in database with signature hash")
    void testHitlAuditPersistence() throws Exception {
        Map<String, Object> payload = Map.of(
                "patientId", "p000011",
                "evaluationId", "EVAL-TEST-001",
                "actionTaken", "APPROVED",
                "actionsAuthorized", List.of("STAT Serum Lactate", "Blood Cultures x 2")
        );

        MvcResult res = mockMvc.perform(post("/api/v1/hitl/decision")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("RECORDED_IMMUTABLE")))
                .andExpect(jsonPath("$.auditId", notNullValue()))
                .andExpect(jsonPath("$.signatureHash", notNullValue()))
                .andReturn();

        String auditId = objectMapper.readTree(res.getResponse().getContentAsString()).get("auditId").asText();

        // Verify record was actually saved in DB
        assertFalse(auditLogRepository.findByPatientIdOrderByRecordedAtDesc("p000011").isEmpty());

        // Verify patient audit history endpoint
        mockMvc.perform(get("/api/v1/hitl/patient/p000011")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRecords", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.auditTrail[0].auditId", is(auditId)));
    }
}

