package com.aegis;

import com.aegis.dto.ClinicalExplainRequest;
import com.aegis.dto.LoginRequest;
import com.aegis.dto.OrderAdministerRequest;
import com.aegis.dto.OrderSignRequest;
import com.aegis.dto.PatientAdmitRequest;
import com.aegis.model.Gender;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ClinicalWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String doctorToken;
    private String nurseToken;

    @BeforeEach
    void setUp() throws Exception {
        // Authenticate Doctor (Dr. Mohammad Munawar)
        LoginRequest docLogin = LoginRequest.builder()
                .username("dr.munawar")
                .password("monu2007")
                .build();
        MvcResult docRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docLogin)))
                .andExpect(status().isOk())
                .andReturn();
        doctorToken = objectMapper.readTree(docRes.getResponse().getContentAsString()).get("token").asText();

        // Authenticate Nurse (Nurse Priya Patel)
        LoginRequest nurseLogin = LoginRequest.builder()
                .username("nurse.priya")
                .password("Nurse123!")
                .build();
        MvcResult nurseRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nurseLogin)))
                .andExpect(status().isOk())
                .andReturn();
        nurseToken = objectMapper.readTree(nurseRes.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    @Order(1)
    @DisplayName("1. Doctor views ICU Bed Roster Heatmap with 8 beds and color indicators (Green, Yellow, Red, Grey)")
    void testDoctorViewsIcuBedRosterHeatmap() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/patients/roster")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(8)))
                .andReturn();

        JsonNode beds = objectMapper.readTree(result.getResponse().getContentAsString());

        // Bed 01: Stable Post-Op CABG (GREEN)
        JsonNode bed1 = beds.get(0);
        assertEquals("ICU-BED-01", bed1.get("bedNumber").asText());
        assertTrue(bed1.get("isOccupied").asBoolean());
        assertEquals("GREEN", bed1.get("triageColor").asText());
        assertEquals("STABLE", bed1.get("urgencyLevel").asText());

        // Bed 03: Compensated Sepsis Surveillance (YELLOW)
        JsonNode bed3 = beds.get(2);
        assertEquals("ICU-BED-03", bed3.get("bedNumber").asText());
        assertEquals("YELLOW", bed3.get("triageColor").asText());
        assertEquals("MODERATE", bed3.get("urgencyLevel").asText());

        // Bed 04: Critical Septic Shock - Vikram Mehta (RED)
        JsonNode bed4 = beds.get(3);
        assertEquals("ICU-BED-04", bed4.get("bedNumber").asText());
        assertEquals("RED", bed4.get("triageColor").asText());
        assertEquals("CRITICAL_SEPSIS", bed4.get("urgencyLevel").asText());
        assertEquals("PT-9042", bed4.get("patientId").asText());
        assertTrue(bed4.get("compositeSepsisRisk").asDouble() >= 0.70);
        assertEquals(1.34, bed4.get("shockIndex").asDouble(), 0.05);

        // Bed 05: Unoccupied (GREY)
        JsonNode bed5 = beds.get(4);
        assertEquals("ICU-BED-05", bed5.get("bedNumber").asText());
        assertFalse(bed5.get("isOccupied").asBoolean());
        assertEquals("GREY", bed5.get("triageColor").asText());
    }

    @Test
    @Order(2)
    @DisplayName("2. Doctor drills down into Red Bed (Bed 04) and views 4-hour multi-agent risk progression")
    void testDoctorInspectsRedBedHistoryAndMultiAgentCurves() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/patients/PT-9042/history")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId", is("PT-9042")))
                .andExpect(jsonPath("$.latestTriageColor", is("RED")))
                .andExpect(jsonPath("$.latestUrgencyLevel", is("CRITICAL_SEPSIS")))
                .andExpect(jsonPath("$.timeline", hasSize(greaterThanOrEqualTo(4))))
                .andReturn();

        JsonNode history = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode timeline = history.get("timeline");

        // Verify progression: Hour 0 is normal, Hour 3 is Critical Sepsis
        JsonNode hour0 = timeline.get(0);
        assertEquals(0, hour0.get("hourIndex").asInt());
        assertTrue(hour0.get("compositeSepsisRisk").asDouble() < 0.40);

        JsonNode hour3 = timeline.get(3);
        assertEquals(3, hour3.get("hourIndex").asInt());
        assertEquals("RED", hour3.get("statusColor").asText());
        assertEquals(1.34, hour3.get("shockIndex").asDouble(), 0.05);
        assertEquals(3.8, hour3.get("lactate").asDouble(), 0.05);
        assertTrue(hour3.get("vitalsAgentRisk").asDouble() >= 0.70);
        assertTrue(hour3.get("labsAgentRisk").asDouble() >= 0.70);
    }

    @Test
    @Order(3)
    @DisplayName("3. Doctor asks conversational AI for explanation and receives multi-agent rationale")
    void testDoctorConversationalExplainability() throws Exception {
        ClinicalExplainRequest request = ClinicalExplainRequest.builder()
                .patientId("PT-9042")
                .alertId("ALT-1092")
                .question("Why did you flag this patient as Critical?")
                .build();

        mockMvc.perform(post("/api/v1/alerts/explain")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId", is("PT-9042")))
                .andExpect(jsonPath("$.answer", containsString("Shock Index")))
                .andExpect(jsonPath("$.answer", containsString("lactate")))
                .andExpect(jsonPath("$.agentContributions.['Vitals Agent']", notNullValue()))
                .andExpect(jsonPath("$.agentContributions.['Labs Agent']", notNullValue()));
    }

    @Test
    @Order(4)
    @DisplayName("4. Surviving Sepsis Bundle Lifecycle: Doctor signs orders, Nurse administers at bedside")
    void testSepsisBundleSignAndAdministerLifecycle() throws Exception {
        // Step 1: Query recommended orders for Bed 04 (PT-9042)
        MvcResult ordersResult = mockMvc.perform(get("/api/v1/orders/patient/PT-9042")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(5))))
                .andReturn();

        JsonNode orders = objectMapper.readTree(ordersResult.getResponse().getContentAsString());
        long antibioticOrderId = orders.get(1).get("id").asLong(); // ACT_ANTIBIOTICS

        // Step 2: Doctor signs the antibiotic order
        OrderSignRequest signRequest = OrderSignRequest.builder()
                .doctorNotes("Authorized STAT Meropenem 1g + Vancomycin 1.5g. Infuse immediately.")
                .approved(true)
                .build();

        mockMvc.perform(post("/api/v1/orders/" + antibioticOrderId + "/sign")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SIGNED_SUCCESSFULLY")))
                .andExpect(jsonPath("$.orderStatus", is("APPROVED")))
                .andExpect(jsonPath("$.signedByDoctor", is("dr.munawar")));

        // Step 3: Nurse administers the approved medication at bedside
        OrderAdministerRequest adminRequest = OrderAdministerRequest.builder()
                .doseAdministered("Meropenem 1g IV in 100mL NS + Vancomycin 1.5g IV hung")
                .nurseNotes("IV access verified via right subclavian central line.")
                .build();

        mockMvc.perform(post("/api/v1/orders/" + antibioticOrderId + "/administer")
                        .header("Authorization", "Bearer " + nurseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ADMINISTERED_SUCCESSFULLY")))
                .andExpect(jsonPath("$.orderStatus", is("EXECUTED")))
                .andExpect(jsonPath("$.executedAt", notNullValue()));
    }

    @Test
    @Order(5)
    @DisplayName("5. Role RBAC Enforcement: Nurse cannot sign doctor orders, Doctor cannot administer nurse tasks")
    void testRoleEnforcementOnOrders() throws Exception {
        MvcResult ordersResult = mockMvc.perform(get("/api/v1/orders/patient/PT-9042")
                        .header("Authorization", "Bearer " + doctorToken))
                .andReturn();
        JsonNode orders = objectMapper.readTree(ordersResult.getResponse().getContentAsString());
        long orderId = orders.get(0).get("id").asLong();

        // Nurse attempting to sign doctor order -> 403 Forbidden
        OrderSignRequest signRequest = OrderSignRequest.builder().approved(true).build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/sign")
                        .header("Authorization", "Bearer " + nurseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signRequest)))
                .andExpect(status().isForbidden());

        // Doctor attempting to administer nurse task -> 403 Forbidden
        OrderAdministerRequest adminRequest = OrderAdministerRequest.builder().build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/administer")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(6)
    @DisplayName("6. Nurse admits patient to empty bed (Bed 05) and bed becomes occupied; then discharges patient")
    void testPatientAdmitAndDischargeLifecycle() throws Exception {
        // Step 1: Admit new patient to Bed 05
        PatientAdmitRequest admitRequest = PatientAdmitRequest.builder()
                .patientId("PT-1005")
                .mrn("MRN-2026-1005")
                .firstName("Robert")
                .lastName("Taylor")
                .age(62)
                .gender(Gender.MALE)
                .icuBedNumber("ICU-BED-05")
                .primaryDiagnosis("Acute Pancreatitis with SIRS")
                .activeMedications(List.of("IV Fluids Plasma-Lyte 150 mL/hr", "Hydromorphone PCA"))
                .build();

        mockMvc.perform(post("/api/v1/patients/admit")
                        .header("Authorization", "Bearer " + nurseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(admitRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.patientId", is("PT-1005")))
                .andExpect(jsonPath("$.icuBedNumber", is("ICU-BED-05")));

        // Step 2: Verify Bed 05 in Roster is now occupied
        mockMvc.perform(get("/api/v1/patients/roster")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[4].bedNumber", is("ICU-BED-05")))
                .andExpect(jsonPath("$[4].isOccupied", is(true)))
                .andExpect(jsonPath("$[4].patientName", is("Robert Taylor")));

        // Step 3: Nurse discharges patient from Bed 05 (soft delete, frees the bed)
        mockMvc.perform(patch("/api/v1/patients/PT-1005/discharge")
                        .header("Authorization", "Bearer " + nurseToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DISCHARGED")))
                .andExpect(jsonPath("$.patientId", is("PT-1005")));

        // Step 4: Verify Bed 05 in Roster is now freed (unoccupied)
        mockMvc.perform(get("/api/v1/patients/roster")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[4].bedNumber", is("ICU-BED-05")))
                .andExpect(jsonPath("$[4].isOccupied", is(false)))
                .andExpect(jsonPath("$[4].triageColor", is("GREY")));
    }
}
