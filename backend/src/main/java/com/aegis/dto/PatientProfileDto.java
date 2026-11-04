package com.aegis.dto;

import com.aegis.model.Gender;
import com.aegis.model.PatientStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientProfileDto {
    private String patientId;
    private String mrn;
    private String firstName;
    private String lastName;
    private String fullName;
    private Integer age;
    private Gender gender;
    private String icuBedNumber;
    private LocalDateTime admissionTime;
    private LocalDateTime dischargeTime;
    private String primaryDiagnosis;
    private List<String> activeMedications;
    private PatientStatus status;
    private String clinicalNotes;
    private ClinicianSummaryDto attendingDoctor;
    private ClinicianSummaryDto primaryNurse;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
