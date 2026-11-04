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

    @JsonProperty("patient_id")
    @JsonAlias({"patientId", "patient_id"})
    private String patientId;

    @JsonProperty("patient_name")
    @JsonAlias({"patientName", "patient_name", "name", "fullName"})
    private String patientName;

    @JsonProperty("age")
    @JsonAlias({"age"})
    private Integer age;

    @JsonProperty("gender")
    @JsonAlias({"gender", "sex"})
    private String gender;

    @JsonProperty("diagnosis")
    @JsonAlias({"diagnosis", "primaryDiagnosis", "primary_diagnosis"})
    private String diagnosis;

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

    @JsonProperty("active_medications")
    @JsonAlias({"activeMedications", "active_medications", "medications", "meds"})
    public void setActiveMedications(Object meds) {
        if (meds == null) {
            this.activeMedications = new java.util.ArrayList<>();
        } else if (meds instanceof java.util.List<?> list) {
            this.activeMedications = new java.util.ArrayList<>(list.stream().map(Object::toString).toList());
        } else if (meds instanceof String str) {
            if (str.trim().isEmpty() || str.equalsIgnoreCase("None")) {
                this.activeMedications = new java.util.ArrayList<>();
            } else {
                this.activeMedications = new java.util.ArrayList<>(java.util.Arrays.stream(str.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList());
            }
        }
    }

    public Double getHeartRate() { return hr != null ? hr : 80.0; }
    public Double getSystolicBp() { return sbp != null ? sbp : 120.0; }
    public Double getDiastolicBp() { return dbp != null ? dbp : 80.0; }
    public Double getMeanArterialPressure() { return map != null ? map : (getSystolicBp() + 2 * getDiastolicBp()) / 3.0; }
    public Double getRespiratoryRate() { return resp != null ? resp : 16.0; }
    public Double getO2Saturation() { return o2Sat != null ? o2Sat : 98.0; }
    public Double getTemperature() { return temp != null ? temp : 37.0; }
    public Double getWhiteBloodCellCount() { return wbc != null ? wbc : 10.0; }
}

