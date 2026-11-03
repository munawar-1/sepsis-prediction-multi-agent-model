package com.aegis.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "patient_telemetry",
    indexes = {
        @Index(name = "idx_telemetry_patient_hour", columnList = "patient_id, hour_index"),
        @Index(name = "idx_telemetry_recorded_at", columnList = "recorded_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PatientTelemetry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "hour_index", nullable = false)
    private Integer hourIndex; // 0, 1, 2, ...

    // Hemodynamic Telemetry (Agent 1 Vitals Inputs)
    @Column(name = "heart_rate")
    private Double heartRate; // HR (bpm)

    @Column(name = "systolic_bp")
    private Double systolicBp; // SBP (mmHg)

    @Column(name = "diastolic_bp")
    private Double diastolicBp; // DBP (mmHg)

    @Column(name = "mean_arterial_pressure")
    private Double meanArterialPressure; // MAP (mmHg)

    @Column(name = "respiratory_rate")
    private Double respiratoryRate; // Resp (/min)

    @Column(name = "o2_saturation")
    private Double o2Saturation; // O2Sat (%)

    @Column(name = "temperature")
    private Double temperature; // Temp (°C)

    // Laboratory Pathology (Agent 2 Labs Inputs)
    @Column(name = "lactate")
    private Double lactate; // mmol/L

    @Column(name = "white_blood_cell_count")
    private Double whiteBloodCellCount; // WBC (x10^3/uL)

    @Column(name = "creatinine")
    private Double creatinine; // mg/dL

    @Column(name = "platelets")
    private Double platelets; // x10^3/uL

    @Column(name = "glucose")
    private Double glucose; // mg/dL

    @Column(name = "lab_age_hours")
    private Double labAgeHours;

    @Builder.Default
    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt = LocalDateTime.now();

    public Double getShockIndex() {
        if (heartRate != null && systolicBp != null && systolicBp > 0) {
            return Math.round((heartRate / systolicBp) * 100.0) / 100.0;
        }
        return 0.8;
    }

    public Integer getNews2Score() {
        int score = 0;
        if (respiratoryRate != null && (respiratoryRate <= 8 || respiratoryRate >= 25)) score += 3;
        else if (respiratoryRate != null && respiratoryRate >= 21) score += 2;
        if (o2Saturation != null && o2Saturation <= 91) score += 3;
        else if (o2Saturation != null && o2Saturation <= 93) score += 2;
        if (systolicBp != null && systolicBp <= 90) score += 3;
        else if (systolicBp != null && systolicBp <= 100) score += 2;
        if (heartRate != null && (heartRate <= 40 || heartRate >= 131)) score += 3;
        else if (heartRate != null && (heartRate >= 111 || heartRate <= 50)) score += 1;
        if (temperature != null && temperature <= 35.0) score += 3;
        else if (temperature != null && temperature >= 39.1) score += 2;
        return score;
    }
}
