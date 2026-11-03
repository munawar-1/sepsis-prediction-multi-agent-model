package com.aegis.service;

import com.aegis.dto.AlertDispatchDto;
import com.aegis.dto.NotificationDispatchResponse;
import com.aegis.model.User;
import com.aegis.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final UserRepository userRepository;
    private final Optional<JavaMailSender> mailSender;

    @Value("${spring.mail.username:aegis.icu.alerts@gmail.com}")
    private String mailFrom;

    public NotificationDispatchResponse dispatchAlert(AlertDispatchDto alertDto) {
        log.warn("🚨 [CLINICAL ALERT DISPATCH] Patient: {} | Role: {} | Urgency: {} | Title: {}",
                alertDto.getPatientId(), alertDto.getTargetRole(), alertDto.getUrgency(), alertDto.getAlertTitle());

        boolean emailSent = false;
        String channel = "ICU_CENTRAL_CONSOLE";

        // Attempt live email notification if JavaMailSender is present and destination is found
        if (mailSender.isPresent() && alertDto.getTargetRole() != null) {
            try {
                String targetEmail = resolveClinicianEmail(alertDto.getTargetRole());
                if (targetEmail != null && !targetEmail.isBlank()) {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setFrom(mailFrom);
                    message.setTo(targetEmail);
                    message.setSubject("🚨 [AEGIS ICU ALERT] " + alertDto.getUrgency() + ": " + alertDto.getAlertTitle());
                    message.setText(String.format(
                            "CRITICAL ICU ALERT\n\n" +
                            "Patient ID: %s\n" +
                            "Urgency: %s\n" +
                            "Clinical Message:\n%s\n\n" +
                            "Recommended Actions:\n%s\n\n" +
                            "Dispatched at: %s",
                            alertDto.getPatientId(),
                            alertDto.getUrgency(),
                            alertDto.getClinicalMessage(),
                            alertDto.getRecommendedActions() != null ? String.join("\n- ", alertDto.getRecommendedActions()) : "None",
                            LocalDateTime.now()
                    ));
                    mailSender.get().send(message);
                    emailSent = true;
                    channel = "EMAIL_SMTP_DISPATCH";
                    log.info("Live SMTP email alert delivered to {}", targetEmail);
                }
            } catch (Exception e) {
                log.warn("Live SMTP dispatch failed (falling back to central console log): {}", e.getMessage());
            }
        }

        return NotificationDispatchResponse.builder()
                .deliveryStatus(emailSent ? "SENT_LIVE" : "DELIVERED_TO_CONSOLE")
                .channel(channel)
                .targetRole(alertDto.getTargetRole())
                .patientId(alertDto.getPatientId())
                .alertTitle(alertDto.getAlertTitle())
                .timestamp(LocalDateTime.now().toString())
                .message("Alert acknowledged by Aegis ICU Notification Dispatcher.")
                .build();
    }

    private String resolveClinicianEmail(String targetRole) {
        if ("ROLE_DOCTOR".equalsIgnoreCase(targetRole) || "DOCTOR".equalsIgnoreCase(targetRole)) {
            return userRepository.findByUsername("dr.munawar")
                    .map(User::getEmail)
                    .orElse("dr.sharma@aegis.icu");
        } else if ("ROLE_NURSE".equalsIgnoreCase(targetRole) || "NURSE".equalsIgnoreCase(targetRole)) {
            return userRepository.findByUsername("nurse.priya")
                    .map(User::getEmail)
                    .orElse("priya.patel@aegis.icu");
        }
        return null;
    }
}
