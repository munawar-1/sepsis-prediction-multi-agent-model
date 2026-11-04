package com.aegis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertDispatchDto {
    private String patientId;
    private String targetRole;
    private String alertTitle;
    private String urgency;
    private String clinicalMessage;
    private Double riskScore;
    private List<Map<String, Object>> agentFindings;
    private List<String> recommendedActions;
    private String timestamp;
}
