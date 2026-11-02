package com.aegis.service;

import com.aegis.dto.AiHealthResponse;
import com.aegis.dto.PatientEvaluationResponse;
import com.aegis.dto.TelemetryTickRequest;
import com.aegis.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiServiceClient {

    private final WebClient aiServiceWebClient;

    @Value("${aegis.ai-service.base-url:http://localhost:8000/api/v1}")
    private String aiServiceBaseUrl;

    /**
     * Sends patient telemetry tick to FastAPI multi-agent orchestrator.
     * Evaluates Model 1 (Vitals), Model 2 (Labs), Model 3 (Skeptic), and Model 4 (Triage).
     */
    public PatientEvaluationResponse evaluatePatientState(TelemetryTickRequest request) {
        validateTelemetry(request);

        log.info("Dispatching patient evaluation to FastAPI AI Engine: patientId={}, hourIndex={}",
                request.getPatientId(), request.getHourIndex());

        try {
            return aiServiceWebClient.post()
                    .uri("/evaluate-patient-state")
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response ->
                            response.bodyToMono(String.class)
                                    .flatMap(body -> Mono.error(new AiServiceException(
                                            "AI Engine validation rejected payload: " + body, HttpStatus.BAD_REQUEST)))
                    )
                    .onStatus(HttpStatusCode::is5xxServerError, response ->
                            response.bodyToMono(String.class)
                                    .flatMap(body -> Mono.error(new AiServiceException(
                                            "AI Engine internal error during multi-agent inference: " + body, HttpStatus.BAD_GATEWAY)))
                    )
                    .bodyToMono(PatientEvaluationResponse.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

        } catch (WebClientRequestException e) {
            log.error("Failed to connect to FastAPI microservice at {}: {}", aiServiceBaseUrl, e.getMessage());
            throw new AiServiceException(
                    "Aegis Diagnostic AI Microservice is unreachable at " + aiServiceBaseUrl +
                    ". Please verify the FastAPI service is active.",
                    e, HttpStatus.SERVICE_UNAVAILABLE
            );
        } catch (WebClientResponseException e) {
            log.error("AI service returned HTTP error: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiServiceException("AI service error: " + e.getResponseBodyAsString(), HttpStatus.valueOf(e.getStatusCode().value()));
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during AI evaluation: {}", e.getMessage(), e);
            throw new AiServiceException("Unexpected error during multi-agent clinical evaluation: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Checks health status of the FastAPI microservice.
     */
    public AiHealthResponse checkHealth() {
        String healthUrl = aiServiceBaseUrl.replace("/api/v1", "") + "/health";
        try {
            WebClient client = WebClient.builder().baseUrl(healthUrl).build();
            return client.get()
                    .retrieve()
                    .bodyToMono(AiHealthResponse.class)
                    .timeout(Duration.ofSeconds(3))
                    .block();
        } catch (Exception e) {
            log.warn("FastAPI health check failed: {}", e.getMessage());
            return AiHealthResponse.builder()
                    .status("DOWN")
                    .service("Aegis-ICU AI Engine")
                    .modelsLoaded(0)
                    .reachable(false)
                    .build();
        }
    }

    /**
     * Validates physiological plausibility of patient data to catch sensor artifacts or malformed inputs.
     */
    private void validateTelemetry(TelemetryTickRequest req) {
        if (req.getPatientId() == null || req.getPatientId().trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid telemetry: patientId is mandatory.");
        }
        if (req.getHourIndex() == null || req.getHourIndex() < 0) {
            throw new IllegalArgumentException("Invalid telemetry: hourIndex must be 0 or greater.");
        }

        // Physiological range sanity bounds
        if (req.getHr() != null && (req.getHr() < 20 || req.getHr() > 300)) {
            throw new IllegalArgumentException("Physiologically invalid Heart Rate: " + req.getHr() + " bpm (Valid clinical range: 20-300).");
        }
        if (req.getSbp() != null && (req.getSbp() < 30 || req.getSbp() > 300)) {
            throw new IllegalArgumentException("Physiologically invalid Systolic BP: " + req.getSbp() + " mmHg (Valid clinical range: 30-300).");
        }
        if (req.getDbp() != null && (req.getDbp() < 10 || req.getDbp() > 200)) {
            throw new IllegalArgumentException("Physiologically invalid Diastolic BP: " + req.getDbp() + " mmHg (Valid clinical range: 10-200).");
        }
        if (req.getResp() != null && (req.getResp() < 4 || req.getResp() > 80)) {
            throw new IllegalArgumentException("Physiologically invalid Respiratory Rate: " + req.getResp() + " /min (Valid clinical range: 4-80).");
        }
        if (req.getO2Sat() != null && (req.getO2Sat() < 0 || req.getO2Sat() > 100)) {
            throw new IllegalArgumentException("Physiologically invalid O2 Saturation: " + req.getO2Sat() + "% (Valid clinical range: 0-100%).");
        }
        if (req.getTemp() != null && (req.getTemp() < 25.0 || req.getTemp() > 45.0)) {
            throw new IllegalArgumentException("Physiologically invalid Temperature: " + req.getTemp() + " °C (Valid clinical range: 25-45°C).");
        }
        if (req.getLactate() != null && (req.getLactate() < 0 || req.getLactate() > 35.0)) {
            throw new IllegalArgumentException("Physiologically invalid Lactate: " + req.getLactate() + " mmol/L (Valid clinical range: 0-35).");
        }
    }
}

