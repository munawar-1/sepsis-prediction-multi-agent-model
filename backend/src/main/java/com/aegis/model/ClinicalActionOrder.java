package com.aegis.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
    private TriageEvaluation evaluation;

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
    private User signedBy; // Doctor or Nurse who executed/authorized the bundle item

    @Column(name = "rationale", columnDefinition = "TEXT")
    private String rationale;

    @Builder.Default
    @Column(name = "ordered_at", nullable = false)
    private LocalDateTime orderedAt = LocalDateTime.now();

    @Column(name = "executed_at")
    private LocalDateTime executedAt;
}
