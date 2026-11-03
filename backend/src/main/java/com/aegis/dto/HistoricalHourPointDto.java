package com.aegis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricalHourPointDto {

    private int hourIndex;
    private LocalDateTime recordedAt;

    // Bedside Vitals
    private Double heartRate;
    private Double systolicBp;
    private Double diastolicBp;
    private Double meanArterialPressure;
    private Double respiratoryRate;
    private Double o2Saturation;
    private Double temperature;

    // Laboratory Values
    private Double lactate;
    private Double whiteBloodCellCount;
    private Double creatinine;
    private Double platelets;

    // Calculated Clinical Scores
    private Double shockIndex;
    private Integer news2Score;

    // Multi-Agent Risk Trajectory (0.0 to 1.0)
    private Double compositeSepsisRisk;
    private Double vitalsAgentRisk;
    private Double labsAgentRisk;
    private Double skepticDiscount;
    private String urgencyLevel;
    private String statusColor; // GREEN, YELLOW, RED
}
