package com.aegis.dto;

import com.aegis.model.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientAdmitRequest {

    private String patientId;

    private String mrn;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotNull(message = "Age is required")
    private Integer age;

    @NotNull(message = "Gender is required (MALE, FEMALE, OTHER)")
    private Gender gender;

    @NotBlank(message = "ICU Bed Number is required (e.g. ICU-BED-04)")
    private String icuBedNumber;

    @NotBlank(message = "Primary diagnosis is required")
    private String primaryDiagnosis;

    private List<String> activeMedications;

    private Long attendingDoctorId;

    private Long primaryNurseId;

    private String clinicalNotes;
}
