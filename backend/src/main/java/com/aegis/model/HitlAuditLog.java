package com.aegis.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "hitl_audit_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HitlAuditLog {
    @Id
    @Column(name = "audit_id", length = 64)
    private String auditId;

    @Column(name = "evaluation_id", nullable = false, length = 64)
    private String evaluationId;

    @Column(name = "patient_id", nullable = false, length = 64)
    private String patientId;

    @Column(name = "clinician_id", nullable = false, length = 64)
    private String clinicianId;

    @Column(name = "action_taken", nullable = false, length = 32)
    private String actionTaken; // 'APPROVED' or 'OVERRIDDEN'

    @Column(name = "override_reason", columnDefinition = "TEXT")
    private String overrideReason;

    @Column(name = "actions_authorized", columnDefinition = "TEXT")
    private String actionsAuthorized;

    @Column(name = "signature_hash", nullable = false, length = 256)
    private String signatureHash;

    @Builder.Default
    @Column(name = "recorded_at", updatable = false)
    private LocalDateTime recordedAt = LocalDateTime.now();
}
