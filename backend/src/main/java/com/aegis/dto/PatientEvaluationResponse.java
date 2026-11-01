package com.aegis.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PatientEvaluationResponse {

    @JsonProperty("patient_id")
    @JsonAlias({"patientId", "patient_id"})
    private String patientId;

    @JsonProperty("hour_index")
    @JsonAlias({"hourIndex", "hour_index"})
    private int hourIndex;

    @JsonProperty("urgency_level")
    @JsonAlias({"urgencyLevel", "urgency_level"})
    private String urgencyLevel;

    @JsonProperty("composite_sepsis_risk")
    @JsonAlias({"compositeSepsisRisk", "composite_sepsis_risk"})
    private double compositeSepsisRisk;

    @JsonProperty("news2_score")
    @JsonAlias({"news2Score", "news2_score"})
    private int news2Score;

    @JsonProperty("shock_index")
    @JsonAlias({"shockIndex", "shock_index"})
    private double shockIndex;

    @JsonProperty("discrepancy_detected")
    @JsonAlias({"discrepancyDetected", "discrepancy_detected"})
    private boolean discrepancyDetected;

    @JsonProperty("data_quality_evidence")
    @JsonAlias({"dataQualityEvidence", "data_quality_evidence"})
    private Map<String, Object> dataQualityEvidence;

    @JsonProperty("vitals_evidence")
    @JsonAlias({"vitalsEvidence", "vitals_evidence"})
    private Map<String, Object> vitalsEvidence;

    @JsonProperty("labs_evidence")
    @JsonAlias({"labsEvidence", "labs_evidence"})
    private Map<String, Object> labsEvidence;

    @JsonProperty("skeptic_evidence")
    @JsonAlias({"skepticEvidence", "skeptic_evidence"})
    private Map<String, Object> skepticEvidence;

    @JsonProperty("agent_findings")
    @JsonAlias({"agentFindings", "agent_findings"})
    private List<Map<String, Object>> agentFindings;

    @JsonProperty("agent_disagreements")
    @JsonAlias({"agentDisagreements", "agent_disagreements"})
    private List<Map<String, Object>> agentDisagreements;

    @JsonProperty("recommended_action_bundle")
    @JsonAlias({"recommendedActionBundle", "recommended_action_bundle"})
    private List<Map<String, Object>> recommendedActionBundle;

    @JsonProperty("evidence_chain_narrative")
    @JsonAlias({"evidenceChainNarrative", "evidence_chain_narrative"})
    private String evidenceChainNarrative;

    @JsonProperty("requires_hitl_action")
    @JsonAlias({"requiresHitlAction", "requires_hitl_action"})
    private boolean requiresHitlAction;

    @Builder.Default
    private LocalDateTime evaluatedAt = LocalDateTime.now();
}
