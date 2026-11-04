package com.aegis.controller;

import com.aegis.dto.AlertDispatchDto;
import com.aegis.dto.NotificationDispatchResponse;
import com.aegis.service.NotificationService;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "5. Live Notification Dispatcher", description = "Receiver Endpoint for Python AI Orchestrator & Live Emergency Alerts")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping({"/api/notifications/dispatch-alert", "/api/v1/notifications/dispatch-alert"})
    @Operation(summary = "Dispatch emergency sepsis email alert to assigned attending doctor")
    public ResponseEntity<NotificationDispatchResponse> dispatchAlert(@RequestBody AlertDispatchDto alertDto) {
        NotificationDispatchResponse response = notificationService.dispatchAlert(alertDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping({"/api/notifications/reset-cooldown", "/api/v1/notifications/reset-cooldown"})
    @Operation(summary = "Clear notification deduplication cache for testing or emergency re-evaluation")
    public ResponseEntity<Map<String, Object>> resetCooldown() {
        notificationService.clearDeduplicationCache();
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Notification deduplication cache cleared successfully."
        ));
    }
}
