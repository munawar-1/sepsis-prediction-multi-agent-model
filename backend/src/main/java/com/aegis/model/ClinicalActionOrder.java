package com.aegis.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "clinical_action_orders",
    indexes = {
        @Index(name = "idx_order_evaluation", columnList = "evaluation_id"),
        @Index(name = "idx_order_status", columnList = "status"),
        @Index(name = "idx_order_code", columnList = "order_code")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ClinicalActionOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_id", nullable = false)
    @JsonIgnore
    private TriageEvaluation evaluation;

    @Transient
    @JsonProperty("evaluationId")
    public Long getEvaluationId() {
        return evaluation != null ? evaluation.getId() : null;
    }

    @Column(name = "order_code", nullable = false, length = 64)
    private String orderCode; // e.g. "ACT_LACTATE", "ACT_BLOOD_CULTURES", "ACT_ANTIBIOTICS"

    @Column(name = "action_name", nullable = false, length = 255)
    private String actionName; // e.g. "Administer Broad-Spectrum IV Antimicrobials"

    @Column(name = "category", length = 64)
    private String category; // STAT RESUSCITATION, DIAGNOSTIC, SUPPORTIVE, BEDSIDE_HARDWARE

    @Column(name = "priority", length = 32)
    private String priority; // STAT, RECOMMENDED, ROUTINE

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private OrderStatus status = OrderStatus.RECOMMENDED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signed_by_user_id")
    @JsonIgnore
    private User signedBy; // Doctor or Nurse who executed/authorized the bundle item

    @Transient
    @JsonProperty("signedByDoctor")
    public String getSignedByDoctor() {
        return signedBy != null ? signedBy.getUsername() : null;
    }

    @Column(name = "rationale", columnDefinition = "TEXT")
    private String rationale;

    @Builder.Default
    @Column(name = "simulated_recommendation")
    private Boolean simulatedRecommendation = true;

    @Builder.Default
    @Column(name = "clinical_review_required")
    private Boolean clinicalReviewRequired = true;

    @Builder.Default
    @Column(name = "ordered_at", nullable = false)
    private LocalDateTime orderedAt = LocalDateTime.now();

    @Column(name = "executed_at")
    private LocalDateTime executedAt;
}
