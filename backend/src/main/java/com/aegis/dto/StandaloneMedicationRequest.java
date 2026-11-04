package com.aegis.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StandaloneMedicationRequest {

    @JsonProperty("medication_name")
    @JsonAlias({"medicationName", "medication_name", "name"})
    private String medicationName;

    @JsonProperty("dosage")
    @JsonAlias({"dosage", "dose"})
    private String dosage;

    @JsonProperty("route")
    @JsonAlias({"route"})
    private String route;

    @JsonProperty("category")
    @JsonAlias({"category", "type"})
    private String category; // MEDICATION, FLUID, GLUCOSE

    @JsonProperty("glucose_value")
    @JsonAlias({"glucoseValue", "glucose_value", "glucose"})
    private Double glucoseValue;

    @JsonProperty("fluid_volume_ml")
    @JsonAlias({"fluidVolumeMl", "fluid_volume_ml", "fluidMl", "volume"})
    private Double fluidVolumeMl;

    @JsonProperty("notes")
    private String notes;
}

