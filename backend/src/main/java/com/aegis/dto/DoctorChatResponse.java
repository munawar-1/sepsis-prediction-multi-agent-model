package com.aegis.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DoctorChatResponse {

    @JsonProperty("patient_id")
    private String patientId;

    @JsonProperty("doctor_question")
    private String doctorQuestion;

    @JsonProperty("llm_response")
    private String llmResponse;

    @JsonProperty("clinical_grounding")
    private Map<String, Object> clinicalGrounding;
}
