package com.aegis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedRosterItemDto {

    private String bedNumber; // e.g. "ICU-BED-01", "ICU-BED-04"
    
    @com.fasterxml.jackson.annotation.JsonProperty("isOccupied")
    @com.fasterxml.jackson.annotation.JsonAlias({"isOccupied", "occupied"})
    private boolean isOccupied;
    
    private String patientId; // e.g. "bed_04", "p000011"
    private String mrn; // e.g. "MRN-2026-9042"
    private String patientName;
    private Integer age;
    private String gender;
    private String admissionDiagnosis;

    // Triage & Multi-Agent Risk
    private Double compositeSepsisRisk; // 0.0 to 1.0 (e.g. 0.84 = 84%)
    private String urgencyLevel; // CRITICAL_SEPSIS, MODERATE, STABLE, SENSOR_FAULT, UNOCCUPIED
    private String triageColor; // RED, YELLOW, GREEN, GREY
    private String summaryHeadline;

    // Current Bedside Vitals Snapshot
    private Double heartRate;
    private Double meanArterialPressure;
    private String bloodPressure;
    private Double respiratoryRate;
    private Double o2Saturation;
    private Double temperature;
    private Double lactate;
    private Double shockIndex;

    // Clinicians & Meds
    private String attendingDoctorName;
    private String primaryNurseName;
    private List<String> activeMedications;
    private int pendingOrdersCount;
    private LocalDateTime lastEvaluatedAt;
    private Boolean aiEvaluated;
    private String evaluationSource;
}
