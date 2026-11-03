package com.aegis.controller;

import com.aegis.dto.*;
import com.aegis.model.Patient;
import com.aegis.service.PatientService;
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
import java.util.List;
import java.util.Map;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/patients")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "2. Patients & ICU Beds", description = "ICU 8-Bed Heatmap Roster, Admission, Discharge, and Profile Management")
public class PatientController {

    private final PatientService patientService;

    /**
     * ICU Bed Heatmap Grid Roster:
     * Returns all beds (Beds 01 to 08) with color-coded triage indicators (RED, YELLOW, GREEN, GREY).
     */
    @GetMapping("/roster")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<List<BedRosterItemDto>> getIcuBedRoster() {
        List<BedRosterItemDto> roster = patientService.getIcuBedRoster();
        return ResponseEntity.ok(roster);
    }

    /**
     * Single patient clinical profile (Safe DTO without password hash).
     */
    @GetMapping("/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<PatientProfileDto> getPatientProfile(@PathVariable String patientId) {
        PatientProfileDto patient = patientService.getPatientProfileDto(patientId);
        return ResponseEntity.ok(patient);
    }

    /**
     * Patient Longitudinal Telemetry History:
     * Powers the multi-agent historical risk progression graphs across hours 0..N.
     */
    @GetMapping("/{patientId}/history")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<PatientHistoricalTelemetryDto> getPatientHistory(@PathVariable String patientId) {
        PatientHistoricalTelemetryDto history = patientService.getPatientHistory(patientId);
        return ResponseEntity.ok(history);
    }

    /**
     * Nurse/Doctor: Admit patient to an ICU bed.
     */
    @PostMapping("/admit")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<?> admitPatient(
            @Valid @RequestBody PatientAdmitRequest request,
            BindingResult bindingResult,
            Authentication authentication
    ) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError err : bindingResult.getFieldErrors()) {
                errors.put(err.getField(), err.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "error", "VALIDATION_ERROR",
                    "validationErrors", errors
            ));
        }

        try {
            String clinicianUsername = authentication != null ? authentication.getName() : "nurse.priya";
            Patient admitted = patientService.admitPatient(request, clinicianUsername);
            return ResponseEntity.status(HttpStatus.CREATED).body(admitted);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "error", "ADMISSION_FAILED",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Nurse/Doctor: Discharge / Transfer patient (soft delete, frees the ICU bed).
     */
    @PatchMapping("/{patientId}/discharge")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<?> dischargePatient(
            @PathVariable String patientId,
            Authentication authentication
    ) {
        try {
            String clinicianUsername = authentication != null ? authentication.getName() : "nurse.priya";
            Patient discharged = patientService.dischargePatient(patientId, clinicianUsername);
            return ResponseEntity.ok(Map.of(
                    "status", "DISCHARGED",
                    "patientId", discharged.getPatientId(),
                    "patientName", discharged.getFullName(),
                    "message", "Patient successfully discharged and ICU bed freed for next admission."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "status", 404,
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Nurse Bedside Logging / Frontend Ticker:
     * Logs hourly vitals and labs, runs multi-agent AI evaluation, and auto-generates sepsis orders.
     */
    @PostMapping("/{patientId}/telemetry")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<?> logTelemetry(
            @PathVariable String patientId,
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
                    "status", 400,
                    "error", "INVALID_TELEMETRY",
                    "validationErrors", errors
            ));
        }

        try {
            request.setPatientId(patientId); // Enforce URL as single source of truth
            String clinicianUsername = authentication != null ? authentication.getName() : "nurse.priya";
            PatientEvaluationResponse response = patientService.logTelemetryAndEvaluate(patientId, request, clinicianUsername);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to log telemetry for patient {}: {}", patientId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", 500,
                    "error", "TELEMETRY_LOGGING_FAILED",
                    "message", e.getMessage()
            ));
        }
    }
}
