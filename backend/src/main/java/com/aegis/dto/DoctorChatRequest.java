package com.aegis.dto;

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
public class DoctorChatRequest {

    @JsonProperty("patient_id")
    private String patientId;

    @JsonProperty("doctor_question")
    private String doctorQuestion;

    @JsonProperty("clinical_context")
    private Map<String, Object> clinicalContext;
}
