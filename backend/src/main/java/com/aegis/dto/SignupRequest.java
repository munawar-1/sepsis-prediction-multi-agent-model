package com.aegis.dto;

import com.aegis.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {

    @NotBlank(message = "Email is required")
    @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Email must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
    private String password;

    @Size(min = 3, max = 64, message = "Username must be between 3 and 64 characters")
    private String username;

    private String fullName;

    @Builder.Default
    private Role role = Role.NURSE;

    private String department;

    private String specialty;

    private String licenseNumber;

    private String phoneNumber;

    private String pagerNumber;

    private String invitationCode;
}

