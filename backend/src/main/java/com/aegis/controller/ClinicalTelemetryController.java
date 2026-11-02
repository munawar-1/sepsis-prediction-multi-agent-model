package com.aegis.controller;

import com.aegis.dto.AiHealthResponse;
import com.aegis.dto.PatientEvaluationResponse;
import com.aegis.dto.TelemetryTickRequest;
import com.aegis.exception.AiServiceException;
import com.aegis.service.AiServiceClient;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/clinical")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ClinicalTelemetryController {

    private final AiServiceClient aiServiceClient;

    /**
     * AI Health check endpoint: verifies connectivity to the FastAPI microservice and model status.
     */
    @GetMapping("/ai-health")
    public ResponseEntity<AiHealthResponse> checkAiServiceHealth() {
        AiHealthResponse health = aiServiceClient.checkHealth();
        HttpStatus status = health.isReachable() ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status).body(health);
    }

    /**
     * Primary Clinical Prediction Endpoint:
     * Receives patient telemetry ticks from clinicians, runs physiological validation,
     * forwards to the FastAPI Multi-Agent Diagnostic Engine, and returns calibrated consensus.
     * Restricted to authenticated DOCTOR or NURSE roles.
     */
    @PostMapping("/evaluate")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<?> evaluatePatientState(
            @Valid @RequestBody TelemetryTickRequest request,
            BindingResult bindingResult,
            Authentication authentication
    ) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError err : bindingResult.getFieldErrors()) {
                errors.put(err.getField(), err.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "status", HttpStatus.BAD_REQUEST.value(),
                    "error", "INVALID_TELEMETRY_DATA",
                    "validationErrors", errors
            ));
        }

        try {
            log.info("Clinician {} ({}) submitted patient {} evaluation for hour {}",
                    authentication.getName(), authentication.getAuthorities(),
                    request.getPatientId(), request.getHourIndex());

            PatientEvaluationResponse response = aiServiceClient.evaluatePatientState(request);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Clinical range rejection for patient {}: {}", request.getPatientId(), e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "status", HttpStatus.BAD_REQUEST.value(),
                    "error", "PHYSIOLOGICAL_RANGE_VALIDATION_ERROR",
                    "message", e.getMessage()
            ));
        } catch (AiServiceException e) {
            log.error("AI service error during evaluation: {}", e.getMessage());
            return ResponseEntity.status(e.getStatus()).body(Map.of(
                    "status", e.getStatus().value(),
                    "error", "AI_MICROSERVICE_ERROR",
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Unhandled error evaluating patient telemetry: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "error", "SERVER_ERROR",
                    "message", "An unexpected error occurred: " + e.getMessage()
            ));
        }
    }
}

