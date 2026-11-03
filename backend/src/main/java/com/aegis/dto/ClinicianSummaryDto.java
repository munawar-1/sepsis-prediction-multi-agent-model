package com.aegis.dto;

import com.aegis.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicianSummaryDto {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String department;
    private String specialty;
    private String licenseNumber;
    private Role role;
    private String shiftStatus;
}
