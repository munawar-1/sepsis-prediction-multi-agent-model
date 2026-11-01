package com.aegis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiHealthResponse {
    private String status;
    private String service;
    @JsonProperty("models_loaded")
    private Integer modelsLoaded;
    @Builder.Default
    private boolean reachable = true;
    @Builder.Default
    private LocalDateTime checkedAt = LocalDateTime.now();
}

