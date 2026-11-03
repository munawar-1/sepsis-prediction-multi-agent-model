package com.aegis.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "triage_evaluations",
    indexes = {
        @Index(name = "idx_eval_patient_time", columnList = "patient_id, evaluated_at"),
        @Index(name = "idx_eval_urgency", columnList = "urgency_level"),
        @Index(name = "idx_eval_target_role", columnList = "target_role")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TriageEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "telemetry_id")
    private PatientTelemetry telemetry;

    @Column(name = "composite_sepsis_risk", nullable = false)
    private Double compositeSepsisRisk; // 0.0 to 1.0

    @Column(name = "urgency_level", nullable = false, length = 32)
    private String urgencyLevel; // LOW_RISK, MODERATE, CRITICAL_SEPSIS, HARDWARE_SENSOR_FAULT

    @Column(name = "target_role", nullable = false, length = 32)
    private String targetRole; // ROLE_NURSE or ROLE_DOCTOR

    @Column(name = "news2_score")
    private Integer news2Score;

    @Column(name = "shock_index")
    private Double shockIndex;

    @Column(name = "discrepancy_detected")
    private Boolean discrepancyDetected;

    @Column(name = "sensor_valid")
    private Boolean sensorValid;

    @Column(name = "workflow_status", length = 64)
    private String workflowStatus;

    // Full Model Evidence JSON Payloads (for transparent explainability & SHAP replay)
    @Column(name = "vitals_evidence_json", columnDefinition = "LONGTEXT")
    private String vitalsEvidenceJson;

    @Column(name = "labs_evidence_json", columnDefinition = "LONGTEXT")
    private String labsEvidenceJson;

    @Column(name = "skeptic_evidence_json", columnDefinition = "LONGTEXT")
    private String skepticEvidenceJson;

    @Column(name = "evidence_chain_narrative", columnDefinition = "TEXT")
    private String evidenceChainNarrative;

    @Builder.Default
    @Column(name = "evaluated_at", nullable = false)
    private LocalDateTime evaluatedAt = LocalDateTime.now();
}
