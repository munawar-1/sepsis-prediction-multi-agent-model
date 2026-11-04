package com.aegis.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to assign or reassign an Attending Doctor to an ICU inpatient")
public class DoctorAssignmentRequest {

    @Schema(description = "Registered Doctor user ID (primary identifier)", example = "1")
    private Long doctorId;

    @Schema(description = "Registered Doctor username (fallback identifier)", example = "dr.munawar")
    private String doctorUsername;
}
