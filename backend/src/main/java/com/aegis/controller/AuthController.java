package com.aegis.controller;

import com.aegis.dto.ApiResponse;
import com.aegis.dto.AuthResponse;
import com.aegis.dto.LoginRequest;
import com.aegis.dto.SignupRequest;
import com.aegis.dto.UserDto;
import com.aegis.model.Role;
import com.aegis.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> register(@Valid @RequestBody SignupRequest request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError fieldError : bindingResult.getFieldErrors()) {
                errors.put(fieldError.getField(), fieldError.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "status", HttpStatus.BAD_REQUEST.value(),
                    "error", "VALIDATION_ERROR",
                    "validationErrors", errors
            ));
        }

        try {
            AuthResponse response = authService.signup(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", HttpStatus.BAD_REQUEST.value(),
                    "error", "SIGNUP_FAILED",
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "error", "SERVER_ERROR",
                    "message", "Registration failed: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", HttpStatus.BAD_REQUEST.value(),
                    "error", "VALIDATION_ERROR",
                    "message", "Username and password are required"
            ));
        }

        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "status", HttpStatus.UNAUTHORIZED.value(),
                    "error", "AUTHENTICATION_FAILED",
                    "message", "Invalid username or password"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "error", "SERVER_ERROR",
                    "message", "Login error: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "No authenticated session found"
            ));
        }

        String username = authentication.getName();
        try {
            UserDto user = authService.getCurrentUser(username);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/roles")
    public ResponseEntity<?> getAvailableRoles() {
        return ResponseEntity.ok(Map.of(
                "roles", List.of(Role.DOCTOR.name(), Role.NURSE.name()),
                "descriptions", Map.of(
                        Role.DOCTOR.name(), "Attending Physician / Intensivist: Clinical diagnostic authority, medication orders, bundle authorization, AI override rights.",
                        Role.NURSE.name(), "Bedside ICU Registered Nurse: Telemetry continuous monitoring, vital sign recording, medication administration, STAT lab escalation."
                ),
                "authorities", Map.of(
                        Role.DOCTOR.name(), List.of("ROLE_DOCTOR", "PRESCRIPTION_AUTHORITY", "OVERRIDE_AUTHORITY", "SEPSIS_BUNDLE_SIGN_OFF"),
                        Role.NURSE.name(), List.of("ROLE_NURSE", "TELEMETRY_LOGGING", "MED_ADMINISTRATION", "STAT_ESCALATION")
                )
        ));
    }
}

