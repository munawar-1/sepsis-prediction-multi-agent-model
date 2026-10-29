package com.aegis.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "hitl_audit_log")
@Data
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

    @Column(name = "actions_authorized", columnDefinition = "JSON")
    private String actionsAuthorized;

    @Column(name = "signature_hash", nullable = false, length = 256)
    private String signatureHash;

    @Column(name = "recorded_at", updatable = false)
    private LocalDateTime recordedAt = LocalDateTime.now();
}
