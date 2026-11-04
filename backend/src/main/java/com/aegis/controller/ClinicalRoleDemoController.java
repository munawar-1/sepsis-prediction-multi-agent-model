package com.aegis.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/clinical")
@CrossOrigin(origins = "*")
public class ClinicalRoleDemoController {

    /**
     * Public Endpoint: Accessible to anyone without authentication.
     */
    @GetMapping("/public/status")
    public ResponseEntity<?> getPublicStatus() {
        return ResponseEntity.ok(Map.of(
                "status", "OPERATIONAL",
                "service", "Aegis-ICU Multi-Agent Sepsis Surveillance System",
                "securityLevel", "PUBLIC_UNAUTHENTICATED",
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * Shared Clinician Endpoint: Requires authentication as either DOCTOR or NURSE.
     */
    @GetMapping("/shared/patient-roster")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<?> getPatientRoster(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "accessLevel", "SHARED_CLINICAL_ACCESS",
                "requestedBy", authentication.getName(),
                "authorities", authentication.getAuthorities().stream().map(Object::toString).toList(),
                "patients", List.of(
                        Map.of(
                                "patientId", "ICU-BED-04 (p000011)",
                                "room", "MICU Room 402",
                                "deteriorationRisk", "84%",
                                "urgency", "CRITICAL_SEPSIS",
                                "status", "Attending review pending"
                        ),
                        Map.of(
                                "patientId", "ICU-BED-02 (p000008)",
                                "room", "SICU Room 201",
                                "deteriorationRisk", "14%",
                                "urgency", "STABLE",
                                "status", "Routine observation"
                        )
                ),
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * Doctor-Only Endpoint: Requires DOCTOR role.
     * Forbidden (403) to Nurses and unauthenticated callers.
     */
    @GetMapping("/doctor/prescription-privileges")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getDoctorPrivileges(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "accessLevel", "DOCTOR_RESTRICTED",
                "authenticatedDoctor", authentication.getName(),
                "grantedPrivileges", List.of(
                        "SEPSIS_3_BUNDLE_PRESCRIPTION",
                        "ANTIMICROBIAL_STEWARDSHIP_OVERRIDE",
                        "INOTROPE_VASOPRESSOR_TITRATION_ORDERS",
                        "AI_EVIDENCE_CHAIN_OVERRIDE_AUTHORITY",
                        "CENTRAL_LINE_INSERTION_ORDER"
                ),
                "message", "Clinical Doctor credentials successfully verified. Full prescription privileges granted.",
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * Doctor-Only Action: Authorize Sepsis-3 Bundle
     */
    @PostMapping("/doctor/authorize-bundle")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> authorizeBundle(
            @RequestBody(required = false) Map<String, Object> payload,
            Authentication authentication
    ) {
        String patientId = payload != null && payload.containsKey("patientId") 
                ? (String) payload.get("patientId") : "ICU-BED-04 (p000011)";
        return ResponseEntity.ok(Map.of(
                "status", "BUNDLE_AUTHORIZED",
                "authorizedByDoctor", authentication.getName(),
                "patientId", patientId,
                "protocol", "Surviving Sepsis Campaign (SSC) 1-Hour Bundle",
                "prescribedInterventions", List.of(
                        "STAT Blood Lactate",
                        "Blood Cultures x 2 prior to antibiotics",
                        "Empiric IV Meropenem + Vancomycin",
                        "30 mL/kg Crystalloid Fluid Bolus"
                ),
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * Doctor approvals for sepsis bundle actions
     * POST /api/v1/clinical/actions/sign
     */
    @PostMapping("/actions/sign")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> signClinicalActions(
            @RequestBody(required = false) Map<String, Object> payload,
            Authentication authentication
    ) {
        String patientId = payload != null && payload.containsKey("patientId")
                ? (String) payload.get("patientId") : "ICU-BED-04";
        String doctorUsername = authentication != null ? authentication.getName() : "dr.sharma";
        return ResponseEntity.ok(Map.of(
                "status", "ACTIONS_SIGNED",
                "signedByDoctor", doctorUsername,
                "patientId", patientId,
                "protocol", "Surviving Sepsis Campaign (SSC) 1-Hour Bundle",
                "actionsAuthorized", payload != null && payload.containsKey("actionsAuthorized") 
                        ? payload.get("actionsAuthorized") : List.of("BLOOD_CULTURES", "ANTIBIOTICS", "FLUID_RESUSCITATION"),
                "timestamp", LocalDateTime.now().toString(),
                "message", "Attending physician signature recorded for clinical bundle."
        ));
    }

    /**
     * Nurse-Only Endpoint: Requires NURSE role.
     * Forbidden (403) to Doctors and unauthenticated callers.
     */
    @GetMapping("/nurse/care-workflow")
    @PreAuthorize("hasRole('NURSE')")
    public ResponseEntity<?> getNurseWorkflow(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "accessLevel", "NURSE_RESTRICTED",
                "authenticatedNurse", authentication.getName(),
                "grantedPrivileges", List.of(
                        "BEDSIDE_TELEMETRY_STREAM_LOGGING",
                        "CONTINUOUS_VITALS_ACQUISITION",
                        "STAT_LAB_ORDER_DISPATCH",
                        "ADMINISTER_VERIFIED_MEDICATION",
                        "CLINICAL_ESCALATION_TO_ATTENDING"
                ),
                "message", "ICU Registered Nurse credentials verified. Bedside care management workflows unlocked.",
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * Nurse-Only Action: Record Bedside Vitals
     */
    @PostMapping("/nurse/record-vitals")
    @PreAuthorize("hasRole('NURSE')")
    public ResponseEntity<?> recordVitals(
            @RequestBody(required = false) Map<String, Object> payload,
            Authentication authentication
    ) {
        return ResponseEntity.ok(Map.of(
                "status", "VITALS_RECORDED",
                "recordedByNurse", authentication.getName(),
                "patientId", payload != null && payload.containsKey("patientId") ? payload.get("patientId") : "ICU-BED-04 (p000011)",
                "recordedData", payload != null ? payload : Map.of("hr", 101, "sbp", 146, "resp", 21, "o2sat", 96),
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}
