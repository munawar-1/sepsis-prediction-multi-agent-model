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
public class ClinicalExplainResponse {

    private String patientId;
    private String question;
    private String answer;
    private Map<String, Double> agentContributions; // e.g. {"Vitals Agent": 0.44, "Labs Agent": 0.38, "Skeptic": 0.18}
    private List<Map<String, Object>> topFeatures;
    private String evidenceSummary;
    private Boolean groundedInPersistedEvaluation;
    private String evaluationSource;
}
