package com.aegis.service;

import com.aegis.dto.OrderAdministerRequest;
import com.aegis.dto.OrderSignRequest;
import com.aegis.model.ClinicalActionOrder;
import com.aegis.model.HitlAuditLog;
import com.aegis.model.OrderStatus;
import com.aegis.model.User;
import com.aegis.repository.ClinicalActionOrderRepository;
import com.aegis.repository.HitlAuditLogRepository;
import com.aegis.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClinicalOrderService {

    private final ClinicalActionOrderRepository orderRepository;
    private final UserRepository userRepository;
    private final HitlAuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public List<ClinicalActionOrder> getOrdersForPatient(String patientId) {
        return orderRepository.findByEvaluationPatientPatientId(patientId);
    }

    @Transactional
    public ClinicalActionOrder signOrder(Long orderId, OrderSignRequest request, String doctorUsername) {
        ClinicalActionOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Clinical order not found with ID: " + orderId));

        User doctor = userRepository.findByUsername(doctorUsername)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found: " + doctorUsername));

        if (!doctor.isDoctor()) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Clinical Safety Violation: Only Attending Physicians can digitally sign medication and resuscitation orders.");
        }

        if (order.getStatus() != OrderStatus.RECOMMENDED) {
            throw new IllegalStateException("Order " + order.getOrderCode() + " cannot be signed. Current status is " + order.getStatus() + " (only orders in RECOMMENDED state can be signed).");
        }

        order.setStatus(request.isApproved() ? OrderStatus.APPROVED : OrderStatus.OVERRIDDEN);
        order.setSignedBy(doctor);
        if (request.getDoctorNotes() != null && !request.getDoctorNotes().trim().isEmpty()) {
            order.setRationale(order.getRationale() + " | Doctor Note: " + request.getDoctorNotes().trim());
        }

        ClinicalActionOrder saved = orderRepository.save(order);

        // Record immutable HITL audit log entry with recorded cryptographic integrity hash
        String auditId = "SIGN-" + UUID.randomUUID().toString().substring(0, 8);
        String patientId = order.getEvaluation().getPatient().getPatientId();
        String signatureHash = computeSha256(auditId + ":" + patientId + ":" + doctorUsername + ":" + order.getOrderCode() + ":" + System.currentTimeMillis());

        HitlAuditLog audit = HitlAuditLog.builder()
                .auditId(auditId)
                .evaluationId(String.valueOf(order.getEvaluation().getId()))
                .patientId(patientId)
                .clinicianId(doctorUsername)
                .actionTaken(request.isApproved() ? "SIGNED_APPROVED" : "SIGNED_OVERRIDDEN")
                .overrideReason(request.getDoctorNotes())
                .actionsAuthorized(order.getOrderCode() + " - " + order.getActionName())
                .signatureHash(signatureHash)
                .recordedAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(audit);

        log.info("Doctor {} digitally signed order {} ({}) -> status {}",
                doctorUsername, order.getId(), order.getOrderCode(), order.getStatus());

        return saved;
    }

    @Transactional
    public ClinicalActionOrder administerOrder(Long orderId, OrderAdministerRequest request, String nurseUsername) {
        ClinicalActionOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Clinical order not found with ID: " + orderId));

        if (order.getStatus() != OrderStatus.APPROVED) {
            throw new IllegalStateException("Order " + order.getOrderCode() + " must be signed and APPROVED by an Attending Doctor before bedside administration (current status: " + order.getStatus() + ")");
        }

        String doseAdministered = (request.getDoseAdministered() != null && !request.getDoseAdministered().isBlank())
                ? request.getDoseAdministered().trim()
                : "Standard bundle dose administered";

        order.setStatus(OrderStatus.EXECUTED);
        order.setExecutedAt(LocalDateTime.now());
        String adminNote = " | Bedside Nurse Administration Dose: " + doseAdministered;
        if (request.getNurseNotes() != null && !request.getNurseNotes().trim().isEmpty()) {
            adminNote += " | Notes: " + request.getNurseNotes().trim();
        }
        order.setRationale((order.getRationale() != null ? order.getRationale() : "") + adminNote);

        ClinicalActionOrder saved = orderRepository.save(order);

        // Record immutable HITL audit log entry for bedside nurse administration
        String auditId = "ADMIN-" + UUID.randomUUID().toString().substring(0, 8);
        String patientId = order.getEvaluation() != null && order.getEvaluation().getPatient() != null
                ? order.getEvaluation().getPatient().getPatientId()
                : "UNKNOWN";
        String signatureHash = computeSha256(auditId + ":" + patientId + ":" + nurseUsername + ":" + order.getOrderCode() + ":" + doseAdministered + ":" + System.currentTimeMillis());

        HitlAuditLog audit = HitlAuditLog.builder()
                .auditId(auditId)
                .evaluationId(order.getEvaluation() != null ? String.valueOf(order.getEvaluation().getId()) : null)
                .patientId(patientId)
                .clinicianId(nurseUsername)
                .actionTaken("BEDSIDE_ADMINISTERED")
                .overrideReason(request.getNurseNotes())
                .actionsAuthorized(order.getOrderCode() + " - " + order.getActionName() + " | Administered Dose: " + doseAdministered)
                .signatureHash(signatureHash)
                .recordedAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(audit);

        log.info("Nurse {} recorded administration for order {} ({}) with dose: {}", nurseUsername, order.getId(), order.getOrderCode(), doseAdministered);

        return saved;
    }

    private String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "HASH-" + UUID.randomUUID().toString().replace("-", "");
        }
    }
}
