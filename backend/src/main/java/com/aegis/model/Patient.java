package com.aegis.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "patients",
    indexes = {
        @Index(name = "idx_patient_bed", columnList = "icu_bed_number"),
        @Index(name = "idx_patient_mrn", columnList = "mrn", unique = true),
        @Index(name = "idx_patient_status", columnList = "status")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Patient {

    @Id
    @Column(name = "patient_id", nullable = false, length = 64)
    private String patientId; // e.g. "bed_01", "p000011"

    @Column(name = "mrn", nullable = false, unique = true, length = 64)
    private String mrn; // Medical Record Number e.g. "MRN-90428"

    @Column(name = "first_name", nullable = false, length = 64)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 64)
    private String lastName;

    @Column(name = "age")
    private Integer age;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 16)
    private Gender gender;

    @Column(name = "icu_bed_number", nullable = true, length = 32)
    private String icuBedNumber; // e.g. "ICU-BED-02" (null when discharged)

    @Column(name = "discharge_time")
    private LocalDateTime dischargeTime;

    @Column(name = "admission_time", nullable = false)
    private LocalDateTime admissionTime;

    @Column(name = "primary_diagnosis", columnDefinition = "TEXT")
    private String primaryDiagnosis;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "patient_active_medications",
        joinColumns = @JoinColumn(name = "patient_id")
    )
    @Column(name = "medication_name", length = 255)
    private List<String> activeMedications = new ArrayList<>();

    // Care Team Assignment
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "attending_doctor_id")
    private User attendingDoctor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "primary_nurse_id")
    private User primaryNurse;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private PatientStatus status = PatientStatus.ADMITTED;

    @Column(name = "clinical_notes", columnDefinition = "TEXT")
    private String clinicalNotes;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getFullName() {
        return (firstName != null ? firstName : "") + (lastName != null ? " " + lastName : "");
    }
}
