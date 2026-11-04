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
    @GetMapping({"/roster", "/bed-roster"})
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
     * List all registered doctors in the hospital system.
     * Used by bedside nurses during patient admission and attending physician reassignment.
     */
    @GetMapping("/doctors")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<List<ClinicianSummaryDto>> getRegisteredDoctors() {
        List<ClinicianSummaryDto> doctors = patientService.getRegisteredDoctors();
        return ResponseEntity.ok(doctors);
    }

    /**
     * Nurse: Admit patient to an ICU bed.
     * Enforces Nurse role via RBAC (@PreAuthorize).
     */
    @PostMapping("/admit")
    @PreAuthorize("hasRole('NURSE')")
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
     * Nurse: Discharge / Transfer patient (soft delete, frees the ICU bed).
     * Enforces Nurse role via RBAC (@PreAuthorize).
     */
    @PatchMapping("/{patientId}/discharge")
    @PreAuthorize("hasRole('NURSE')")
    public ResponseEntity<?> dischargePatient(
            @PathVariable String patientId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication
    ) {
        try {
            String clinicianUsername = authentication != null ? authentication.getName() : "nurse.priya";
            String notes = body != null ? body.get("notes") : null;
            Patient discharged = patientService.dischargePatient(patientId, clinicianUsername, notes);
            return ResponseEntity.ok(Map.of(
                    "status", "DISCHARGED",
                    "patientId", discharged.getPatientId(),
                    "patientName", discharged.getFullName(),
                    "dischargeTime", discharged.getDischargeTime() != null ? discharged.getDischargeTime().toString() : "",
                    "message", "Patient successfully discharged and ICU bed freed for next admission."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "status", 404,
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "status", 409,
                    "error", "CONFLICT",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Nurse: Reassign attending doctor for an ICU patient.
     * Enforces Nurse role via RBAC (@PreAuthorize).
     */
    @PatchMapping("/{patientId}/assign-doctor")
    @PreAuthorize("hasRole('NURSE')")
    public ResponseEntity<?> reassignDoctor(
            @PathVariable String patientId,
            @RequestBody DoctorAssignmentRequest request,
            Authentication authentication
    ) {
        try {
            String clinicianUsername = authentication != null ? authentication.getName() : "nurse.priya";
            PatientProfileDto updated = patientService.reassignDoctor(patientId, request, clinicianUsername);
            return ResponseEntity.ok(Map.of(
                    "status", "DOCTOR_REASSIGNED",
                    "patientId", updated.getPatientId(),
                    "patientName", updated.getFullName(),
                    "attendingDoctor", updated.getAttendingDoctor(),
                    "message", "Attending doctor successfully updated to Dr. " + updated.getAttendingDoctor().getFullName()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "error", "INVALID_DOCTOR",
                    "message", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "status", 409,
                    "error", "CONFLICT",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Nurse Bedside Logging / Frontend Ticker:
     * Logs hourly vitals and labs, runs multi-agent AI evaluation, and auto-generates sepsis orders.
     */
    @PostMapping("/reset-demo")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<?> resetDemoWard() {
        patientService.resetWardData();
        return ResponseEntity.ok(Map.of(
                "status", "RESET_SUCCESSFUL",
                "message", "ICU ward simulation reset completed."
        ));
    }

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

    /**
     * Standalone Medication, Fluid Bolus, or Point-of-Care Glucose Entry:
     * Allows clinicians to chart medications/fluids at any time (asynchronous to hourly vitals rounds).
     * These entries persist on the patient record and are automatically factored into subsequent AI multi-agent evaluations.
     */
    @PostMapping("/{patientId}/medications")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<?> logStandaloneMedication(
            @PathVariable String patientId,
            @RequestBody StandaloneMedicationRequest request,
            Authentication authentication
    ) {
        try {
            String clinicianUsername = authentication != null ? authentication.getName() : "nurse.priya";
            List<String> updatedMeds = patientService.logStandaloneMedication(patientId, request, clinicianUsername);
            return ResponseEntity.ok(Map.of(
                    "status", "MEDICATION_LOGGED",
                    "patientId", patientId,
                    "activeMedications", updatedMeds,
                    "message", "Medication/fluid entry successfully recorded and clinical profile updated."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "error", "INVALID_MEDICATION_DATA",
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Failed to log standalone medication for patient {}: {}", patientId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", 500,
                    "error", "MEDICATION_LOGGING_FAILED",
                    "message", e.getMessage()
            ));
        }
    }
}
