package com.aegis.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalExplainRequest {

    @NotBlank(message = "Patient ID is required")
    private String patientId;

    private String alertId;

    @NotBlank(message = "Question is required")
    private String question;
}
