package com.aegis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientHistoricalTelemetryDto {

    private String patientId;
    private String mrn;
    private String fullName;
    private String icuBedNumber;
    private String primaryDiagnosis;
    private List<String> activeMedications;

    private Double latestCompositeRisk;
    private String latestUrgencyLevel;
    private String latestTriageColor;

    private List<HistoricalHourPointDto> timeline;
}
