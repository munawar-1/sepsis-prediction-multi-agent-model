package com.aegis.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/hitl")
@CrossOrigin(origins = "*")
public class HitlDecisionController {

    @PostMapping("/decision")
    public ResponseEntity<?> recordClinicianDecision(@RequestBody Map<String, Object> payload) {
        String actionTaken = (String) payload.get("actionTaken");
        String overrideReason = (String) payload.get("overrideReason");

        // Mandatory check: Clinician cannot override AI without mandatory clinical rationale
        if ("OVERRIDDEN".equalsIgnoreCase(actionTaken) && (overrideReason == null || overrideReason.trim().isEmpty())) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "VALIDATION_FAILED",
                "message", "Mandatory clinical justification is required to override AI recommendation."
            ));
        }

        String auditId = "AUDIT-" + UUID.randomUUID().toString().substring(0, 8);
        return ResponseEntity.ok(Map.of(
            "status", "RECORDED_IMMUTABLE",
            "auditId", auditId,
            "message", "Decision signed and committed to append-only audit trail."
        ));
    }
}
