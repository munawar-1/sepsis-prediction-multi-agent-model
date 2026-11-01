package com.aegis;

import com.aegis.dto.LoginRequest;
import com.aegis.dto.SignupRequest;
import com.aegis.model.Role;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthAndRoleSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("1. Public endpoint is accessible without authentication")
    void testPublicEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/clinical/public/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("OPERATIONAL")))
                .andExpect(jsonPath("$.securityLevel", is("PUBLIC_UNAUTHENTICATED")));
    }

    @Test
    @DisplayName("2. Available roles endpoint lists DOCTOR and NURSE")
    void testGetRoles() throws Exception {
        mockMvc.perform(get("/api/v1/auth/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles", hasItems("DOCTOR", "NURSE")))
                .andExpect(jsonPath("$.authorities.DOCTOR", hasItem("ROLE_DOCTOR")))
                .andExpect(jsonPath("$.authorities.NURSE", hasItem("ROLE_NURSE")));
    }

    @Test
    @DisplayName("3. Signup new Doctor succeeds and returns JWT token")
    void testDoctorSignup() throws Exception {
        SignupRequest request = SignupRequest.builder()
                .username("dr.test_" + System.currentTimeMillis())
                .email("dr.test_" + System.currentTimeMillis() + "@hospital.org")
                .password("Password123!")
                .fullName("Dr. Test Physician")
                .role(Role.DOCTOR)
                .department("Trauma ICU")
                .licenseNumber("MD-TR-9988")
                .build();

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.role", is("DOCTOR")))
                .andExpect(jsonPath("$.username", is(request.getUsername())));
    }

    @Test
    @DisplayName("4. Signup new Nurse succeeds and returns JWT token")
    void testNurseSignup() throws Exception {
        SignupRequest request = SignupRequest.builder()
                .username("nurse.test_" + System.currentTimeMillis())
                .email("nurse.test_" + System.currentTimeMillis() + "@hospital.org")
                .password("Password123!")
                .fullName("Nurse Test Specialist")
                .role(Role.NURSE)
                .department("Neuro ICU")
                .licenseNumber("RN-NEURO-7766")
                .build();

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.role", is("NURSE")))
                .andExpect(jsonPath("$.username", is(request.getUsername())));
    }

    @Test
    @DisplayName("5. Pre-seeded Doctor can login and access Doctor-only endpoint")
    void testDoctorLoginAndRestrictedAccess() throws Exception {
        // Step 1: Login as pre-seeded doctor
        LoginRequest loginRequest = LoginRequest.builder()
                .username("dr.sharma")
                .password("Doctor123!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.role", is("DOCTOR")))
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();

        // Step 2: Access /me with JWT
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("DOCTOR")))
                .andExpect(jsonPath("$.username", is("dr.sharma")));

        // Step 3: Access Shared endpoint (Should SUCCEED)
        mockMvc.perform(get("/api/v1/clinical/shared/patient-roster")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessLevel", is("SHARED_CLINICAL_ACCESS")));

        // Step 4: Access Doctor-only endpoint (Should SUCCEED)
        mockMvc.perform(get("/api/v1/clinical/doctor/prescription-privileges")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessLevel", is("DOCTOR_RESTRICTED")))
                .andExpect(jsonPath("$.grantedPrivileges", hasItem("SEPSIS_3_BUNDLE_PRESCRIPTION")));

        // Step 5: Access Nurse-only endpoint with Doctor token (Should be FORBIDDEN 403)
        mockMvc.perform(get("/api/v1/clinical/nurse/care-workflow")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("ACCESS_DENIED")));
    }

    @Test
    @DisplayName("6. Pre-seeded Nurse can login and access Nurse-only endpoint, blocked from Doctor endpoint")
    void testNurseLoginAndRestrictedAccess() throws Exception {
        // Step 1: Login as pre-seeded nurse
        LoginRequest loginRequest = LoginRequest.builder()
                .username("nurse.priya")
                .password("Nurse123!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.role", is("NURSE")))
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();

        // Step 2: Access Shared endpoint (Should SUCCEED)
        mockMvc.perform(get("/api/v1/clinical/shared/patient-roster")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessLevel", is("SHARED_CLINICAL_ACCESS")));

        // Step 3: Access Nurse-only endpoint (Should SUCCEED)
        mockMvc.perform(get("/api/v1/clinical/nurse/care-workflow")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessLevel", is("NURSE_RESTRICTED")))
                .andExpect(jsonPath("$.grantedPrivileges", hasItem("BEDSIDE_TELEMETRY_STREAM_LOGGING")));

        // Step 4: Access Doctor-only endpoint with Nurse token (Should be FORBIDDEN 403)
        mockMvc.perform(get("/api/v1/clinical/doctor/prescription-privileges")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("ACCESS_DENIED")));
    }

    @Test
    @DisplayName("7. Unauthenticated request to secured endpoint returns 401 Unauthorized")
    void testUnauthenticatedAccessRejected() throws Exception {
        mockMvc.perform(get("/api/v1/clinical/doctor/prescription-privileges"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("UNAUTHORIZED")));

        mockMvc.perform(get("/api/v1/clinical/nurse/care-workflow"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("UNAUTHORIZED")));

        mockMvc.perform(get("/api/v1/clinical/shared/patient-roster"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("UNAUTHORIZED")));
    }

    @Test
    @DisplayName("8. HITL Decision Override enforces Doctor role authorization")
    void testHitlOverrideRoleEnforcement() throws Exception {
        // Nurse trying to override AI -> Rejected with 403
        LoginRequest nurseLogin = LoginRequest.builder()
                .username("nurse.priya")
                .password("Nurse123!")
                .build();
        MvcResult nurseRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nurseLogin)))
                .andReturn();
        String nurseToken = objectMapper.readTree(nurseRes.getResponse().getContentAsString()).get("token").asText();

        Map<String, Object> overridePayload = Map.of(
                "actionTaken", "OVERRIDDEN",
                "overrideReason", "Clinical assessment differs from AI alert"
        );

        mockMvc.perform(post("/api/v1/hitl/decision")
                        .header("Authorization", "Bearer " + nurseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(overridePayload)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("requires Attending Doctor authorization")));

        // Doctor trying to override AI with rationale -> Accepted with 200 OK
        LoginRequest docLogin = LoginRequest.builder()
                .username("dr.sharma")
                .password("Doctor123!")
                .build();
        MvcResult docRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docLogin)))
                .andReturn();
        String docToken = objectMapper.readTree(docRes.getResponse().getContentAsString()).get("token").asText();

        mockMvc.perform(post("/api/v1/hitl/decision")
                        .header("Authorization", "Bearer " + docToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(overridePayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("RECORDED_IMMUTABLE")))
                .andExpect(jsonPath("$.clinician", is("dr.sharma")))
                .andExpect(jsonPath("$.role", is("DOCTOR")));
    }
}

