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
public class LoginRequest {

    private String email;

    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    public String getIdentifier() {
        if (email != null && !email.trim().isEmpty()) {
            return email.trim().toLowerCase();
        }
        if (username != null && !username.trim().isEmpty()) {
            return username.trim();
        }
        return null;
    }
}

