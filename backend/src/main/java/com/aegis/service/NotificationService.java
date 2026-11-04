package com.aegis.service;

import com.aegis.dto.AlertDispatchDto;
import com.aegis.dto.NotificationDispatchResponse;
import com.aegis.model.Patient;
import com.aegis.model.User;
import com.aegis.repository.PatientRepository;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final PatientRepository patientRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:openquest7@gmail.com}")
    private String mailFrom;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${aegis.frontend-url:http://localhost:3000}")
    private String frontendBaseUrl;

    // Cooldown duration to prevent alert fatigue and duplicate emails (15 minutes)
    private static final long COOLDOWN_MINUTES = 15;

    // Thread-safe de-duplication cache: patientId -> last AlertRecord
    private final Map<String, AlertDeDupRecord> deduplicationCache = new ConcurrentHashMap<>();

    @Data
    @Builder
    public static class AlertDeDupRecord {
        private String patientId;
        private String icuBedNumber;
        private String recipientEmail;
        private String urgency;
        private Double riskScore;
        private LocalDateTime dispatchedAt;
    }

    /**
     * Dispatches an emergency/critical alert to the assigned clinician (attending doctor or primary nurse).
     * Guaranteed never to throw an unhandled exception or interrupt patient assessment.
     */
    public NotificationDispatchResponse dispatchAlert(AlertDispatchDto alertDto) {
        String patientId = alertDto.getPatientId();
        LocalDateTime now = LocalDateTime.now();
        String formattedTimestamp = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        log.warn("🚨 [CLINICAL ALERT DISPATCH REQUEST] Patient: {} | Role: {} | Urgency: {} | Title: {}",
                patientId, alertDto.getTargetRole(), alertDto.getUrgency(), alertDto.getAlertTitle());

        // 1. Resolve Patient from Registry (Never send to arbitrary or unlinked recipients)
        Optional<Patient> patientOpt = resolvePatient(patientId);
        if (patientOpt.isEmpty()) {
            log.warn("🚨 [EMAIL SUPPRESSED: PATIENT_NOT_FOUND] Patient identifier '{}' not found in database. " +
                     "Aegis security protocol strictly forbids sending alerts to arbitrary recipients.", patientId);
            return NotificationDispatchResponse.builder()
                    .delivered(false)
                    .deliveryStatus("SUPPRESSED_PATIENT_NOT_FOUND")
                    .channel("NONE")
                    .targetRole(alertDto.getTargetRole())
                    .patientId(patientId)
                    .alertTitle(alertDto.getAlertTitle())
                    .riskScore(alertDto.getRiskScore())
                    .timestamp(formattedTimestamp)
                    .message("Patient not found in ICU registry. Email alert suppressed for safety.")
                    .build();
        }

        Patient patient = patientOpt.get();

        // 1b. Validate Patient Admission Status (Discharged Patients Suppressed for Safety)
        if (patient.getStatus() == com.aegis.model.PatientStatus.DISCHARGED) {
            log.warn("🚨 [EMAIL SUPPRESSED: PATIENT_DISCHARGED] Patient '{}' has been discharged from ICU. Emergency alert email suppressed.",
                    patient.getPatientId());
            return NotificationDispatchResponse.builder()
                    .delivered(false)
                    .deliveryStatus("SUPPRESSED_PATIENT_DISCHARGED")
                    .channel("NONE")
                    .targetRole(alertDto.getTargetRole())
                    .patientId(patient.getPatientId())
                    .icuBedNumber(patient.getIcuBedNumber())
                    .alertTitle(alertDto.getAlertTitle())
                    .riskScore(alertDto.getRiskScore())
                    .timestamp(formattedTimestamp)
                    .message("Patient is discharged from ICU. Emergency email alert suppressed for safety.")
                    .build();
        }

        // 2. Resolve Assigned Clinician based on Target Role
        boolean isNurseTarget = "ROLE_NURSE".equalsIgnoreCase(alertDto.getTargetRole()) || "NURSE".equalsIgnoreCase(alertDto.getTargetRole());
        User clinician = isNurseTarget ? patient.getPrimaryNurse() : patient.getAttendingDoctor();
        String roleLabel = isNurseTarget ? "bedside nurse" : "attending physician";

        if (clinician == null) {
            log.warn("🚨 [EMAIL SUPPRESSED: NO_CLINICIAN_ASSIGNED] Patient '{}' ({}) has no {} assigned. " +
                     "Alert cannot be dispatched by email.", patient.getPatientId(), patient.getIcuBedNumber(), roleLabel);
            return NotificationDispatchResponse.builder()
                    .delivered(false)
                    .deliveryStatus("SUPPRESSED_NO_CLINICIAN_ASSIGNED")
                    .channel("NONE")
                    .targetRole(alertDto.getTargetRole())
                    .patientId(patient.getPatientId())
                    .icuBedNumber(patient.getIcuBedNumber())
                    .alertTitle(alertDto.getAlertTitle())
                    .riskScore(alertDto.getRiskScore())
                    .timestamp(formattedTimestamp)
                    .message("No " + roleLabel + " assigned to patient. Email alert suppressed.")
                    .build();
        }

        // 3. Validate Assigned Clinician's Registered Email Address
        String recipientEmail = clinician.getEmail();
        if (recipientEmail == null || recipientEmail.isBlank() || !recipientEmail.contains("@")) {
            log.warn("🚨 [EMAIL SUPPRESSED: MISSING_EMAIL] Assigned {} '{}' (ID: {}) for patient '{}' has no valid email registered.",
                    roleLabel, clinician.getFullName(), clinician.getId(), patient.getPatientId());
            return NotificationDispatchResponse.builder()
                    .delivered(false)
                    .deliveryStatus("SUPPRESSED_MISSING_EMAIL")
                    .channel("NONE")
                    .targetRole(alertDto.getTargetRole())
                    .patientId(patient.getPatientId())
                    .icuBedNumber(patient.getIcuBedNumber())
                    .alertTitle(alertDto.getAlertTitle())
                    .riskScore(alertDto.getRiskScore())
                    .timestamp(formattedTimestamp)
                    .message("Assigned " + roleLabel + " has no registered email. Email alert suppressed.")
                    .build();
        }

        // 4. Duplicate Email Prevention / Refractory Cooldown Check
        AlertDeDupRecord lastRecord = deduplicationCache.get(patient.getPatientId());
        if (lastRecord != null) {
            long minutesSince = ChronoUnit.MINUTES.between(lastRecord.getDispatchedAt(), now);
            boolean sameUrgency = alertDto.getUrgency() != null && alertDto.getUrgency().equalsIgnoreCase(lastRecord.getUrgency());
            boolean riskSpike = alertDto.getRiskScore() != null && lastRecord.getRiskScore() != null &&
                    (alertDto.getRiskScore() - lastRecord.getRiskScore() >= 0.15);

            if (minutesSince < COOLDOWN_MINUTES && sameUrgency && !riskSpike) {
                log.info("⏳ [ALERT DEDUPLICATED] Suppressing duplicate emergency email for patient {}. " +
                         "Alert already sent to {} {}m ago. Cooldown active: {}m remaining.",
                        patient.getPatientId(), recipientEmail, minutesSince, (COOLDOWN_MINUTES - minutesSince));
                return NotificationDispatchResponse.builder()
                        .delivered(false)
                        .deliveryStatus("DEDUPLICATED")
                        .channel("EMAIL_COOLDOWN_ACTIVE")
                        .targetRole(alertDto.getTargetRole())
                        .recipientEmail(recipientEmail)
                        .patientId(patient.getPatientId())
                        .icuBedNumber(patient.getIcuBedNumber())
                        .alertTitle(alertDto.getAlertTitle())
                        .riskScore(alertDto.getRiskScore())
                        .timestamp(formattedTimestamp)
                        .message(String.format("Duplicate emergency alert suppressed. Active cooldown: %d min remaining.",
                                (COOLDOWN_MINUTES - minutesSince)))
                        .build();
            }
        }

        // 5. Build Simplified Emergency Email Payload (Clean, Focused, Mobile-Friendly)
        String subject = String.format("Critical Sepsis Alert – Patient %s", patient.getPatientId());
        String dashboardUrl = buildDashboardUrl(patient.getPatientId());
        String htmlBody = buildSimplifiedHtmlAlertEmail(patient, clinician, dashboardUrl);
        String textBody = buildSimplifiedPlainTextAlertEmail(patient, clinician, dashboardUrl);

        // 6. Real SMTP Dispatch via JavaMailSender
        boolean emailSent = false;
        String errorMessage = null;
        try {
            log.info("📤 [SMTP DISPATCH ATTEMPT] Sending live emergency email to assigned {} '{}' <{}> via {}:{}...",
                    roleLabel, clinician.getFullName(), recipientEmail, mailHost, mailPort);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(new InternetAddress(mailFrom, "Aegis-ICU Clinical Alert System"));
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(textBody, htmlBody);

            mailSender.send(mimeMessage);
            emailSent = true;

            // Record successful dispatch in deduplication cache
            deduplicationCache.put(patient.getPatientId(), AlertDeDupRecord.builder()
                    .patientId(patient.getPatientId())
                    .icuBedNumber(patient.getIcuBedNumber())
                    .recipientEmail(recipientEmail)
                    .urgency(alertDto.getUrgency())
                    .riskScore(alertDto.getRiskScore())
                    .dispatchedAt(now)
                    .build());

            log.info("✅ [SMTP DELIVERED] Emergency sepsis email delivered to {} '{}' <{}> for patient {} ({})",
                    roleLabel, clinician.getFullName(), recipientEmail, patient.getPatientId(), patient.getIcuBedNumber());

        } catch (Exception e) {
            errorMessage = e.getMessage();
            log.error("❌ [SMTP DELIVERY FAILED] Could not send email via {}:{} from {} to {}: {}",
                    mailHost, mailPort, mailFrom, recipientEmail, errorMessage);

            if (errorMessage != null && (errorMessage.contains("BadCredentials") ||
                                         errorMessage.contains("535") ||
                                         errorMessage.contains("Username and Password not accepted"))) {
                log.error("⚠️ [GMAIL APP PASSWORD NOTICE] Google SMTP rejected credentials. Ensure a 16-character App Password is set in backend/.env.");
            }

            // Also record cooldown attempt so repeated telemetry ticks do not flood the failing SMTP connection
            deduplicationCache.put(patient.getPatientId(), AlertDeDupRecord.builder()
                    .patientId(patient.getPatientId())
                    .icuBedNumber(patient.getIcuBedNumber())
                    .recipientEmail(recipientEmail)
                    .urgency(alertDto.getUrgency())
                    .riskScore(alertDto.getRiskScore())
                    .dispatchedAt(now)
                    .build());
        }

        // 7. Return detailed delivery status without interrupting patient assessment
        return NotificationDispatchResponse.builder()
                .delivered(true)
                .deliveryStatus(emailSent ? "SENT_LIVE" : "FAILED_SMTP_ERROR")
                .channel(emailSent ? "EMAIL_SMTP_DISPATCH" : "CONSOLE_FALLBACK")
                .targetRole(alertDto.getTargetRole())
                .recipientEmail(recipientEmail)
                .patientId(patient.getPatientId())
                .icuBedNumber(patient.getIcuBedNumber())
                .alertTitle(alertDto.getAlertTitle())
                .riskScore(alertDto.getRiskScore())
                .timestamp(formattedTimestamp)
                .message(emailSent ? "Emergency email successfully dispatched to assigned clinician." : "SMTP transmission failed: " + errorMessage)
                .errorMessage(errorMessage)
                .build();
    }

    private Optional<Patient> resolvePatient(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            return Optional.empty();
        }
        Optional<Patient> opt = patientRepository.findByPatientId(patientId);
        if (opt.isPresent()) {
            return opt;
        }
        return patientRepository.findByIcuBedNumber(patientId);
    }

    public void clearDeduplicationCache() {
        deduplicationCache.clear();
        log.info("🧹 [DEDUPLICATION] Notification deduplication cache cleared.");
    }

    public Map<String, AlertDeDupRecord> getDeduplicationCache() {
        return deduplicationCache;
    }

    private String buildDashboardUrl(String patientId) {
        String base = (frontendBaseUrl != null && !frontendBaseUrl.isBlank()) 
                ? frontendBaseUrl.replaceAll("/+$", "") 
                : "http://localhost:3000";
        return String.format("%s/dashboard?patientId=%s", base, patientId);
    }

    /**
     * Phase 1 Simplified HTML Emergency Email:
     * Contains ONLY:
     * 1. Basic patient details (Patient ID, Patient Name, ICU Bed Number)
     * 2. Short, understandable problem description requiring immediate doctor attention
     * 3. A clean button saying "Open Aegis-ICU Dashboard"
     */
    private String buildSimplifiedHtmlAlertEmail(Patient patient, User clinician, String dashboardUrl) {
        String patientId = escapeHtml(patient.getPatientId());
        String patientName = escapeHtml(patient.getFullName());
        String bedNumber = escapeHtml(patient.getIcuBedNumber() != null ? patient.getIcuBedNumber() : "ICU Bed");
        String doctorName = escapeHtml(clinician.getFullName());

        return "<!DOCTYPE html>" +
                "<html><head><meta charset='UTF-8'>" +
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "<title>Critical Sepsis Alert</title>" +
                "</head>" +
                "<body style='margin:0;padding:20px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;color:#334155;'>" +
                "<div style='max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.04);'>" +
                
                // Alert Header Banner
                "<div style='background-color:#dc2626;padding:20px 24px;color:#ffffff;'>" +
                "<div style='font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#fecaca;'>Aegis-ICU Emergency Alert</div>" +
                "<h1 style='margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;'>Critical Sepsis Alert – Patient " + patientId + "</h1>" +
                "</div>" +

                // Body Container
                "<div style='padding:24px;'>" +
                "<p style='font-size:14px;line-height:1.5;color:#1e293b;margin:0 0 16px;'><b>Dear " + doctorName + ",</b></p>" +
                
                // Problem Description
                "<div style='background:#fef2f2;border-left:4px solid #ef4444;border-radius:6px;padding:12px 16px;margin:0 0 20px;'>" +
                "<p style='margin:0;font-size:13px;line-height:1.6;color:#991b1b;font-weight:500;'>" +
                "The Aegis-ICU clinical surveillance system has detected signs of <b>critical physiological deterioration and suspected sepsis</b>. " +
                "The patient&#39;s condition requires <b>immediate doctor attention</b> at the bedside." +
                "</p>" +
                "</div>" +

                // Patient Details Table
                "<div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:0 0 24px;'>" +
                "<table style='width:100%;font-size:13px;border-collapse:collapse;'>" +
                "<tr><td style='padding:6px 0;color:#64748b;width:120px;'><b>Patient ID:</b></td><td style='color:#0f172a;font-weight:600;font-family:monospace;'>" + patientId + "</td></tr>" +
                "<tr><td style='padding:6px 0;color:#64748b;'><b>Patient Name:</b></td><td style='color:#0f172a;font-weight:600;'>" + patientName + "</td></tr>" +
                "<tr><td style='padding:6px 0;color:#64748b;'><b>ICU Bed Number:</b></td><td style='color:#0f172a;font-weight:600;'>" + bedNumber + "</td></tr>" +
                "</table>" +
                "</div>" +

                // Action Button
                "<div style='text-align:center;margin:28px 0 20px;'>" +
                "<a href='" + dashboardUrl + "' style='display:inline-block;background-color:#0d9488;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:10px;box-shadow:0 2px 6px rgba(13,148,136,0.25);'>Open Aegis-ICU Dashboard</a>" +
                "</div>" +
                "<div style='text-align:center;font-size:11px;color:#94a3b8;margin-bottom:8px;'>Directs to secure patient workspace after login</div>" +

                // Minimal Footer
                "<div style='margin-top:24px;padding-top:16px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8;line-height:1.5;text-align:center;'>" +
                "Aegis-ICU Clinical Decision Support • Confidential Protected Health Communication" +
                "</div>" +

                "</div>" + // Body Container
                "</div></body></html>";
    }

    /**
     * Phase 1 Simplified Plain-Text Emergency Email.
     */
    private String buildSimplifiedPlainTextAlertEmail(Patient patient, User clinician, String dashboardUrl) {
        String patientId = patient.getPatientId();
        String patientName = patient.getFullName();
        String bedNumber = patient.getIcuBedNumber() != null ? patient.getIcuBedNumber() : "ICU Bed";

        return "CRITICAL SEPSIS ALERT – PATIENT " + patientId + "\n" +
                "=================================================================\n\n" +
                "Dear " + clinician.getFullName() + ",\n\n" +
                "The Aegis-ICU clinical surveillance system has detected signs of\n" +
                "critical physiological deterioration and suspected sepsis.\n" +
                "The patient's condition requires immediate doctor attention at the bedside.\n\n" +
                "PATIENT DETAILS:\n" +
                "- Patient ID:     " + patientId + "\n" +
                "- Patient Name:   " + patientName + "\n" +
                "- ICU Bed Number: " + bedNumber + "\n\n" +
                "OPEN AEGIS-ICU DASHBOARD:\n" +
                dashboardUrl + "\n\n" +
                "=================================================================\n" +
                "Aegis-ICU Clinical Decision Support • Confidential Protected Health Communication\n";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
