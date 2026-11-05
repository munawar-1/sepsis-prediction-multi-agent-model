package com.aegis.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorAssignTaskRequest {

    @NotBlank(message = "Patient ID is required")
    private String patientId;

    @NotBlank(message = "Action or medication order name is required")
    private String actionName;

    private String category; // MEDICATION_CHANGE, THERAPY_ORDER, RESUSCITATION, STAT_LABS

    private String priority; // STAT, URGENT, ROUTINE

    private String rationale;

    private String doctorNotes;
}
