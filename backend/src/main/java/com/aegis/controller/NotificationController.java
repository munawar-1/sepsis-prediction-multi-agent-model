package com.aegis.controller;

import com.aegis.dto.AlertDispatchDto;
import com.aegis.dto.NotificationDispatchResponse;
import com.aegis.service.NotificationService;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "5. Live Notification Dispatcher", description = "Receiver Endpoint for Python AI Orchestrator & Live Alerts")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping({"/api/notifications/dispatch-alert", "/api/v1/notifications/dispatch-alert"})
    public ResponseEntity<NotificationDispatchResponse> dispatchAlert(@RequestBody AlertDispatchDto alertDto) {
        NotificationDispatchResponse response = notificationService.dispatchAlert(alertDto);
        return ResponseEntity.ok(response);
    }
}
