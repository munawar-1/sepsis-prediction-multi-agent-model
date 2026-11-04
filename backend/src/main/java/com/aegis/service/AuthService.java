package com.aegis.service;

import com.aegis.dto.AuthResponse;
import com.aegis.dto.LoginRequest;
import com.aegis.dto.SignupRequest;
import com.aegis.dto.UserDto;
import com.aegis.model.Role;
import com.aegis.model.User;
import com.aegis.repository.UserRepository;
import com.aegis.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (request.getEmail() == null || !isValidEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email format is invalid.");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email '" + normalizedEmail + "' is already registered.");
        }

        String username = (request.getUsername() != null && !request.getUsername().trim().isEmpty())
                ? request.getUsername().trim()
                : normalizedEmail;

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username '" + username + "' is already taken.");
        }

        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        Role requestedRole = request.getRole() != null ? request.getRole() : Role.NURSE;

        // Security Enforcement: Prevent unauthorized public self-assignment of clinical roles.
        // Privileged roles (DOCTOR, ADMIN) require an authorized hospital administrator invitation or verified credential.
        if (requestedRole == Role.DOCTOR || requestedRole == Role.ADMIN) {
            if (!isValidClinicianInvitation(request.getInvitationCode())) {
                log.warn("Unauthorized attempt to self-assign clinical role '{}' without verified invite code: email={}", requestedRole, normalizedEmail);
                throw new SecurityException("Unauthorized role assignment: Registration for clinical role '" + requestedRole + "' is forbidden without an authorized hospital administrator invitation code.");
            }
        }

        Role role = requestedRole;

        String fullName = (request.getFullName() != null && !request.getFullName().trim().isEmpty())
                ? request.getFullName().trim()
                : (role == Role.DOCTOR ? "Dr. " : "Nurse ") + normalizedEmail.split("@")[0];

        User user = User.builder()
                .username(username)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(fullName)
                .role(role)
                .department(request.getDepartment() != null && !request.getDepartment().trim().isEmpty()
                        ? request.getDepartment().trim() : "ICU Department")
                .specialty(request.getSpecialty() != null ? request.getSpecialty().trim()
                        : (role == Role.DOCTOR ? "Critical Care" : "ICU Bedside Care"))
                .licenseNumber(request.getLicenseNumber() != null && !request.getLicenseNumber().trim().isEmpty()
                        ? request.getLicenseNumber().trim() : "LIC-" + System.currentTimeMillis() % 100000)
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .pagerNumber(request.getPagerNumber() != null ? request.getPagerNumber().trim() : null)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        String jwtToken = jwtService.generateToken(savedUser);

        log.info("Registered new clinician: email={}, username={}, role={}", savedUser.getEmail(), savedUser.getUsername(), savedUser.getRole());

        return AuthResponse.builder()
                .token(jwtToken)
                .tokenType("Bearer")
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole())
                .department(savedUser.getDepartment())
                .licenseNumber(savedUser.getLicenseNumber())
                .expiresInMs(jwtService.getExpirationTime())
                .message("Clinician account successfully registered with role: " + savedUser.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.getIdentifier();
        if (identifier == null || identifier.isBlank() || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadCredentialsException("Invalid credentials");
        }

        // Lookup user by email or username
        User user = userRepository.findByEmail(identifier.toLowerCase())
                .or(() -> userRepository.findByUsername(identifier))
                .or(() -> userRepository.findByUsernameOrEmail(identifier, identifier.toLowerCase()))
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
            );
        } catch (AuthenticationException e) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String jwtToken = jwtService.generateToken(user);
        log.info("Clinician logged in: email={}, username={}, role={}", user.getEmail(), user.getUsername(), user.getRole());

        return AuthResponse.builder()
                .token(jwtToken)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .department(user.getDepartment())
                .licenseNumber(user.getLicenseNumber())
                .expiresInMs(jwtService.getExpirationTime())
                .message("Login successful. Role assigned: " + user.getRole())
                .build();
    }

    @Transactional(readOnly = true)
    public java.util.List<com.aegis.dto.ClinicianSummaryDto> getRegisteredDoctors() {
        return userRepository.findByRole(Role.DOCTOR).stream()
                .map(doc -> com.aegis.dto.ClinicianSummaryDto.builder()
                        .id(doc.getId())
                        .username(doc.getUsername())
                        .fullName(doc.getFullName())
                        .email(doc.getEmail())
                        .department(doc.getDepartment())
                        .specialty(doc.getSpecialty())
                        .licenseNumber(doc.getLicenseNumber())
                        .role(doc.getRole())
                        .shiftStatus(doc.getShiftStatus())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    public UserDto getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .department(user.getDepartment())
                .licenseNumber(user.getLicenseNumber())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    private boolean isValidClinicianInvitation(String invitationCode) {
        if (invitationCode == null || invitationCode.trim().isEmpty()) {
            return false;
        }
        String code = invitationCode.trim();
        return code.equalsIgnoreCase("AEGIS-CLINICAL-INVITE-2026")
                || code.equalsIgnoreCase("HOSPITAL-ADMIN-INVITE")
                || code.equalsIgnoreCase("AEGIS-DOC-INVITE-2026")
                || code.equalsIgnoreCase("AEGIS-ICU-STAFF-2026");
    }
}
