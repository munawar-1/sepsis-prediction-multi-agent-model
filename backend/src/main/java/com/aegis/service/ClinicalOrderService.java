package com.aegis.service;

import com.aegis.dto.DoctorAssignTaskRequest;
import com.aegis.dto.OrderAdministerRequest;
import com.aegis.dto.OrderSignRequest;
import com.aegis.model.ClinicalActionOrder;
import com.aegis.model.HitlAuditLog;
import com.aegis.model.OrderStatus;
import com.aegis.model.Patient;
import com.aegis.model.TriageEvaluation;
import com.aegis.model.User;
import com.aegis.repository.ClinicalActionOrderRepository;
import com.aegis.repository.HitlAuditLogRepository;
import com.aegis.repository.PatientRepository;
import com.aegis.repository.TriageEvaluationRepository;
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
    private final NotificationService notificationService;
    private final TriageEvaluationRepository evaluationRepository;
    private final PatientRepository patientRepository;

    @Transactional(readOnly = true)
    public List<ClinicalActionOrder> getOrdersForPatient(String patientId) {
        return orderRepository.findByEvaluationPatientPatientId(patientId);
    }

    @Transactional(readOnly = true)
    public List<ClinicalActionOrder> getNursePendingTasks() {
        return orderRepository.findByStatus(OrderStatus.APPROVED);
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

        // When doctor approves medication/resuscitation, dispatch message directly to Bedside Nurse Task List
        if (request.isApproved()) {
            try {
                notificationService.dispatchAlert(com.aegis.dto.AlertDispatchDto.builder()
                        .patientId(patientId)
                        .targetRole("ROLE_NURSE")
                        .urgency("DOCTOR_AUTHORIZED_ORDER")
                        .alertTitle("DOCTOR AUTHORIZED: " + order.getActionName())
                        .clinicalMessage("Dr. " + doctorUsername + " authorized order " + order.getOrderCode() + " (" + order.getActionName() + ") for bedside administration.")
                        .recommendedActions(List.of("Administer " + order.getActionName(), "Document administered dose in Aegis ICU"))
                        .build());
            } catch (Exception e) {
                log.warn("Could not dispatch nurse task alert: {}", e.getMessage());
            }
        }

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

    @Transactional
    public ClinicalActionOrder assignDoctorOrder(DoctorAssignTaskRequest request, String doctorUsername) {
        User doctor = userRepository.findByUsername(doctorUsername).orElse(null);

        TriageEvaluation evaluation = evaluationRepository
                .findTopByPatientPatientIdOrderByEvaluatedAtDesc(request.getPatientId())
                .orElse(null);

        if (evaluation == null) {
            Patient patient = patientRepository.findByPatientId(request.getPatientId())
                    .orElseThrow(() -> new IllegalArgumentException("Patient not found: " + request.getPatientId()));
            evaluation = evaluationRepository.save(TriageEvaluation.builder()
                    .patient(patient)
                    .urgencyLevel("CRITICAL_SEPSIS")
                    .compositeSepsisRisk(0.85)
                    .news2Score(8)
                    .shockIndex(1.2)
                    .targetRole("ROLE_NURSE")
                    .sensorValid(true)
                    .evaluatedAt(LocalDateTime.now())
                    .build());
        }

        String orderCode = "ACT_" + (request.getCategory() != null ? request.getCategory() : "TASK") + "_" + (System.currentTimeMillis() % 10000);

        ClinicalActionOrder order = ClinicalActionOrder.builder()
                .evaluation(evaluation)
                .orderCode(orderCode)
                .actionName(request.getActionName())
                .category(request.getCategory() != null ? request.getCategory() : "MEDICATION_CHANGE")
                .priority(request.getPriority() != null ? request.getPriority() : "STAT")
                .status(OrderStatus.APPROVED)
                .signedBy(doctor)
                .rationale((request.getRationale() != null ? request.getRationale() : "Attending Physician Bedside Order")
                        + (request.getDoctorNotes() != null && !request.getDoctorNotes().isBlank() ? " | Doctor Note: " + request.getDoctorNotes().trim() : ""))
                .simulatedRecommendation(false)
                .clinicalReviewRequired(false)
                .orderedAt(LocalDateTime.now())
                .build();

        ClinicalActionOrder saved = orderRepository.save(order);

        String auditId = "ASSIGN-" + UUID.randomUUID().toString().substring(0, 8);
        HitlAuditLog audit = HitlAuditLog.builder()
                .auditId(auditId)
                .evaluationId(String.valueOf(evaluation.getId()))
                .patientId(request.getPatientId())
                .clinicianId(doctorUsername)
                .actionTaken("DOCTOR_ASSIGNED_TASK")
                .overrideReason(request.getDoctorNotes())
                .actionsAuthorized(order.getOrderCode() + " - " + order.getActionName())
                .signatureHash(computeSha256(auditId + ":" + request.getPatientId() + ":" + doctorUsername + ":" + order.getOrderCode()))
                .recordedAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(audit);

        try {
            notificationService.dispatchAlert(com.aegis.dto.AlertDispatchDto.builder()
                    .patientId(request.getPatientId())
                    .targetRole("ROLE_NURSE")
                    .urgency("STAT_DOCTOR_TASK")
                    .alertTitle("DOCTOR ORDER ASSIGNED: " + order.getActionName())
                    .clinicalMessage("Dr. " + doctorUsername + " assigned urgent task to bedside nurse: " + order.getActionName())
                    .recommendedActions(List.of("Execute " + order.getActionName(), "Document bedside administration"))
                    .build());
        } catch (Exception e) {
            log.warn("Could not dispatch nurse task alert: {}", e.getMessage());
        }

        log.info("Doctor {} assigned task {} ({}) to bedside nurse for patient {}",
                doctorUsername, saved.getId(), saved.getActionName(), request.getPatientId());

        return saved;
    }

    @Transactional
    public List<ClinicalActionOrder> batchAssignDoctorOrders(List<DoctorAssignTaskRequest> requests, String doctorUsername) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }
        return requests.stream()
                .map(req -> assignDoctorOrder(req, doctorUsername))
                .toList();
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
