package com.aegis.controller;

import com.aegis.dto.ClinicalExplainRequest;
import com.aegis.dto.ClinicalExplainResponse;
import com.aegis.service.ClinicalAlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/alerts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "4. Alerts & Explainability", description = "Multi-Agent Clinical Q&A Grounded in TreeSHAP & Consensus Evidence")
public class ClinicalAlertController {

    private final ClinicalAlertService alertService;

    /**
     * Get latest active alert and multi-agent evidence breakdown for a patient.
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<Map<String, Object>> getPatientAlert(@PathVariable String patientId) {
        Map<String, Object> alert = alertService.getPatientAlert(patientId);
        return ResponseEntity.ok(alert);
    }

    /**
     * Interactive Multi-Agent Explainability Q&A:
     * Answers clinical doctor inquiries ("Why did you flag this?", "Could medication timing explain it?").
     */
    @PostMapping("/explain")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<?> explainAlert(
            @Valid @RequestBody ClinicalExplainRequest request,
            BindingResult bindingResult
    ) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "error", "VALIDATION_ERROR",
                    "message", "Patient ID and question are required."
            ));
        }

        try {
            ClinicalExplainResponse response = alertService.explainClinicalAlert(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }
}
