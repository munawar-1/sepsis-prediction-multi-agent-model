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
    private String recipientEmail;
    private String patientId;
    private String icuBedNumber;
    private String alertTitle;
    private Double riskScore;
    private String timestamp;
    private String message;
    private String errorMessage;
}
