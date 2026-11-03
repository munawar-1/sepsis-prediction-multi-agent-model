package com.aegis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDispatchResponse {
    @Builder.Default
    private boolean delivered = true;
    private String deliveryStatus;
    private String channel;
    private String targetRole;
    private String patientId;
    private String alertTitle;
    private String timestamp;
    private String message;
}
