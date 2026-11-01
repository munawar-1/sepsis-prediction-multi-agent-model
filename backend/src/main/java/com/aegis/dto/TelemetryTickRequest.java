package com.aegis.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryTickRequest {

    @NotBlank(message = "patient_id cannot be blank")
    @JsonProperty("patient_id")
    @JsonAlias({"patientId", "patient_id"})
    private String patientId;

    @NotNull(message = "hour_index is required")
    @Min(value = 0, message = "hour_index cannot be negative")
    @JsonProperty("hour_index")
    @JsonAlias({"hourIndex", "hour_index"})
    private Integer hourIndex;

    // Vitals
    @JsonProperty("HR")
    @JsonAlias({"hr", "HR", "heartRate"})
    private Double hr;

    @JsonProperty("SBP")
    @JsonAlias({"sbp", "SBP", "systolicBp"})
    private Double sbp;

    @JsonProperty("DBP")
    @JsonAlias({"dbp", "DBP", "diastolicBp"})
    private Double dbp;

    @JsonProperty("MAP")
    @JsonAlias({"map", "MAP", "meanArterialPressure"})
    private Double map;

    @JsonProperty("Resp")
    @JsonAlias({"resp", "Resp", "respiratoryRate"})
    private Double resp;

    @JsonProperty("O2Sat")
    @JsonAlias({"o2sat", "O2Sat", "oxygenSaturation", "o2"})
    private Double o2Sat;

    @JsonProperty("Temp")
    @JsonAlias({"temp", "Temp", "temperature"})
    private Double temp;

    // Labs
    @JsonProperty("Lactate")
    @JsonAlias({"lactate", "Lactate"})
    private Double lactate;

    @JsonProperty("WBC")
    @JsonAlias({"wbc", "WBC", "whiteBloodCells"})
    private Double wbc;

    @JsonProperty("Creatinine")
    @JsonAlias({"creatinine", "Creatinine"})
    private Double creatinine;

    @JsonProperty("Platelets")
    @JsonAlias({"platelets", "Platelets"})
    private Double platelets;

    @JsonProperty("Glucose")
    @JsonAlias({"glucose", "Glucose"})
    private Double glucose;

    // Clinical Context
    @Builder.Default
    @JsonProperty("active_medications")
    @JsonAlias({"activeMedications", "active_medications", "medications", "meds"})
    private List<String> activeMedications = new ArrayList<>();
}

