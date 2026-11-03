package com.aegis.controller;

import com.aegis.dto.OrderAdministerRequest;
import com.aegis.dto.OrderSignRequest;
import com.aegis.model.ClinicalActionOrder;
import com.aegis.service.ClinicalOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "3. Sepsis-3 Orders & Nurse Worklist", description = "Attending Physician Authorization & Bedside Nurse Medication Administration")
public class ClinicalOrderController {

    private final ClinicalOrderService orderService;

    /**
     * Get all recommended and active orders for a patient.
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<List<ClinicalActionOrder>> getOrdersForPatient(@PathVariable String patientId) {
        List<ClinicalActionOrder> orders = orderService.getOrdersForPatient(patientId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Bedside Nurse Actionable Task List:
     * Returns all orders that have been signed & APPROVED by Attending Doctors across the ICU
     * awaiting bedside administration.
     */
    @GetMapping("/nurse/tasks")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<List<ClinicalActionOrder>> getNurseTasks() {
        List<ClinicalActionOrder> tasks = orderService.getNursePendingTasks();
        return ResponseEntity.ok(tasks);
    }

    /**
     * Attending Doctor digitally signs and authorizes recommended sepsis bundle order.
     * Forbidden (403) to non-doctor roles.
     */
    @PostMapping("/{orderId}/sign")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> signOrder(
            @PathVariable Long orderId,
            @RequestBody(required = false) OrderSignRequest request,
            Authentication authentication
    ) {
        try {
            String doctorUsername = authentication != null ? authentication.getName() : "dr.munawar";
            OrderSignRequest signRequest = request != null ? request : new OrderSignRequest();
            ClinicalActionOrder signed = orderService.signOrder(orderId, signRequest, doctorUsername);
            return ResponseEntity.ok(Map.of(
                    "status", "SIGNED_SUCCESSFULLY",
                    "orderId", signed.getId(),
                    "orderCode", signed.getOrderCode(),
                    "orderStatus", signed.getStatus(),
                    "signedByDoctor", signed.getSignedBy() != null ? signed.getSignedBy().getUsername() : doctorUsername,
                    "message", "Order authorized and dispatched to bedside nurse task list."
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "error", "ORDER_NOT_SIGNABLE",
                    "message", e.getMessage()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Bedside Nurse logs administration / execution of the signed order.
     * Forbidden (403) to non-nurse roles.
     */
    @PostMapping("/{orderId}/administer")
    @PreAuthorize("hasRole('NURSE')")
    public ResponseEntity<?> administerOrder(
            @PathVariable Long orderId,
            @RequestBody(required = false) OrderAdministerRequest request,
            Authentication authentication
    ) {
        try {
            String nurseUsername = authentication != null ? authentication.getName() : "nurse.priya";
            OrderAdministerRequest adminRequest = request != null ? request : new OrderAdministerRequest();
            ClinicalActionOrder executed = orderService.administerOrder(orderId, adminRequest, nurseUsername);
            return ResponseEntity.ok(Map.of(
                    "status", "ADMINISTERED_SUCCESSFULLY",
                    "orderId", executed.getId(),
                    "orderCode", executed.getOrderCode(),
                    "orderStatus", executed.getStatus(),
                    "executedAt", executed.getExecutedAt().toString(),
                    "message", "Bedside execution recorded in clinical audit log."
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "error", "EXECUTION_REJECTED",
                    "message", e.getMessage()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", 400,
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }
}
