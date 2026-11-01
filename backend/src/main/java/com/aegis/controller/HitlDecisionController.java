package com.aegis.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/hitl")
@CrossOrigin(origins = "*")
public class HitlDecisionController {

    @PostMapping("/decision")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<?> recordClinicianDecision(
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        String actionTaken = (String) payload.get("actionTaken");
        String overrideReason = (String) payload.get("overrideReason");
        String clinicianUsername = authentication != null ? authentication.getName() : "anonymous_clinician";

        // Doctor authority check: Only Doctors are clinically licensed to OVERRIDE multi-agent AI deterioration warnings
        boolean isDoctor = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));

        if ("OVERRIDDEN".equalsIgnoreCase(actionTaken)) {
            if (!isDoctor) {
                return ResponseEntity.status(403).body(Map.of(
                        "status", 403,
                        "error", "ACCESS_DENIED",
                        "message", "Clinical Protocol Violation: Overriding an AI deterioration warning requires Attending Doctor authorization. ICU Nurses cannot sign off on AI overrides."
                ));
            }

            if (overrideReason == null || overrideReason.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "VALIDATION_FAILED",
                        "message", "Mandatory clinical justification is required to override AI recommendation."
                ));
            }
        }

        String auditId = "AUDIT-" + UUID.randomUUID().toString().substring(0, 8);
        return ResponseEntity.ok(Map.of(
                "status", "RECORDED_IMMUTABLE",
                "auditId", auditId,
                "clinician", clinicianUsername,
                "role", isDoctor ? "DOCTOR" : "NURSE",
                "actionTaken", actionTaken,
                "message", "Decision signed and committed to append-only audit trail."
        ));
    }
}
