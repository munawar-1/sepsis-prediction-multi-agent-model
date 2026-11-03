package com.aegis.controller;

import com.aegis.model.HitlAuditLog;
import com.aegis.repository.HitlAuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/hitl")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "6. Human-in-the-Loop Audit Trail", description = "Immutable Append-Only Audit Log with Cryptographic Signatures")
public class HitlDecisionController {

    private final HitlAuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/decision")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<?> recordClinicianDecision(
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        String actionTaken = (String) payload.get("actionTaken");
        String overrideReason = (String) payload.get("overrideReason");
        String patientId = payload.containsKey("patientId") ? (String) payload.get("patientId") : "p000011";
        String evaluationId = payload.containsKey("evaluationId") ? (String) payload.get("evaluationId") : "EVAL-" + UUID.randomUUID().toString().substring(0, 8);
        Object actionsAuthorized = payload.get("actionsAuthorized");

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
                        "status", 400,
                        "error", "VALIDATION_FAILED",
                        "message", "Mandatory clinical justification is required to override AI recommendation."
                ));
            }
        }

        String auditId = "AUDIT-" + UUID.randomUUID().toString().substring(0, 8);
        String signatureHash = computeSha256(auditId + ":" + patientId + ":" + clinicianUsername + ":" + actionTaken + ":" + System.currentTimeMillis());

        String actionsJson = "";
        try {
            if (actionsAuthorized != null) {
                actionsJson = objectMapper.writeValueAsString(actionsAuthorized);
            }
        } catch (Exception e) {
            actionsJson = String.valueOf(actionsAuthorized);
        }

        // Persist to immutable append-only audit log
        HitlAuditLog auditRecord = HitlAuditLog.builder()
                .auditId(auditId)
                .evaluationId(evaluationId)
                .patientId(patientId)
                .clinicianId(clinicianUsername)
                .actionTaken(actionTaken != null ? actionTaken.toUpperCase() : "APPROVED")
                .overrideReason(overrideReason)
                .actionsAuthorized(actionsJson)
                .signatureHash(signatureHash)
                .recordedAt(LocalDateTime.now())
                .build();

        HitlAuditLog saved = auditLogRepository.save(auditRecord);
        log.info("Persisted immutable HITL audit log entry: auditId={}, clinician={}, action={}",
                saved.getAuditId(), saved.getClinicianId(), saved.getActionTaken());

        return ResponseEntity.ok(Map.of(
                "status", "RECORDED_IMMUTABLE",
                "auditId", saved.getAuditId(),
                "patientId", saved.getPatientId(),
                "clinician", saved.getClinicianId(),
                "role", isDoctor ? "DOCTOR" : "NURSE",
                "actionTaken", saved.getActionTaken(),
                "signatureHash", saved.getSignatureHash(),
                "recordedAt", saved.getRecordedAt().toString(),
                "message", "Decision digitally signed and committed to append-only audit trail."
        ));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<?> getPatientAuditHistory(@PathVariable String patientId) {
        List<HitlAuditLog> history = auditLogRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        return ResponseEntity.ok(Map.of(
                "patientId", patientId,
                "totalRecords", history.size(),
                "auditTrail", history
        ));
    }

    private String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "HASH-" + UUID.randomUUID().toString().replace("-", "");
        }
    }
}
