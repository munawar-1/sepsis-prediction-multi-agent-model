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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' is already taken.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email '" + request.getEmail() + "' is already registered.");
        }

        Role role = request.getRole();
        if (role == null) {
            throw new IllegalArgumentException("A valid role (DOCTOR or NURSE) is required.");
        }

        User user = User.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(role)
                .department(request.getDepartment() != null ? request.getDepartment().trim() : "ICU Department")
                .licenseNumber(request.getLicenseNumber() != null ? request.getLicenseNumber().trim() : "LIC-" + System.currentTimeMillis() % 100000)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        String jwtToken = jwtService.generateToken(savedUser);

        log.info("Registered new clinician: username={}, role={}", savedUser.getUsername(), savedUser.getRole());

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
        // Find user by username or email first
        User user = userRepository.findByUsernameOrEmail(request.getUsername(), request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
            );
        } catch (Exception e) {
            throw new BadCredentialsException("Invalid username or password");
        }

        String jwtToken = jwtService.generateToken(user);
        log.info("Clinician logged in: username={}, role={}", user.getUsername(), user.getRole());

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

    public UserDto getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
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
}

