package com.aegis;

import com.aegis.dto.AuthResponse;
import com.aegis.dto.LoginRequest;
import com.aegis.dto.SignupRequest;
import com.aegis.model.Role;
import com.aegis.model.User;
import com.aegis.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class DoctorAuthenticationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("1. Doctor registers using email and password, receives valid JWT and DOCTOR role")
    void testDoctorRegistrationWithEmailAndPassword() throws Exception {
        String email = "dr.watson_" + System.currentTimeMillis() + "@hospital.org";
        String password = "SecureDoctorPassword2026!";

        SignupRequest signupRequest = SignupRequest.builder()
                .email(email)
                .password(password)
                .fullName("Dr. John Watson, MD")
                .role(Role.DOCTOR)
                .invitationCode("AEGIS-CLINICAL-INVITE-2026")
                .department("Pulmonology & Critical Care")
                .specialty("Pulmonologist")
                .licenseNumber("MD-PULM-7711")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.email", is(email)))
                .andExpect(jsonPath("$.role", is("DOCTOR")))
                .andExpect(jsonPath("$.message", containsString("successfully registered")))
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class);
        assertNotNull(authResponse.getToken());
        assertEquals("DOCTOR", authResponse.getRole().name());
    }

    @Test
    @DisplayName("2. Passwords are securely hashed with BCrypt before DB persistence; never stored plain-text")
    void testPasswordIsSecurelyHashedInDatabase() throws Exception {
        String email = "dr.securesave_" + System.currentTimeMillis() + "@hospital.org";
        String plainPassword = "SuperSecretPassword123#";

        SignupRequest signupRequest = SignupRequest.builder()
                .email(email)
                .password(plainPassword)
                .fullName("Dr. Security Audit")
                .role(Role.DOCTOR)
                .invitationCode("AEGIS-CLINICAL-INVITE-2026")
                .build();

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isCreated());

        // Inspect user record in the database directly
        Optional<User> userOptional = userRepository.findByEmail(email);
        assertTrue(userOptional.isPresent(), "Saved doctor record must exist in the database");

        User savedUser = userOptional.get();
        String storedPassword = savedUser.getPassword();

        // 1. Password must NEVER be stored plain-text
        assertNotEquals(plainPassword, storedPassword, "Plain-text password must never be stored in the database");

        // 2. Password must start with standard BCrypt hash prefix ($2a$ or $2b$)
        assertTrue(storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$"),
                "Stored password hash must follow standard BCrypt prefix format: " + storedPassword);

        // 3. PasswordEncoder must successfully verify the hash matches original plain-text password
        assertTrue(passwordEncoder.matches(plainPassword, storedPassword),
                "BCrypt password encoder must match original password against database hash");

        // 4. Verification with wrong password must strictly fail
        assertFalse(passwordEncoder.matches("WrongPassword", storedPassword),
                "BCrypt password encoder must reject incorrect passwords");
    }

    @Test
    @DisplayName("3. Duplicate email registration is rejected with HTTP 400 Bad Request")
    void testDuplicateEmailRegistrationRejected() throws Exception {
        String duplicateEmail = "dr.duplicate_" + System.currentTimeMillis() + "@hospital.org";
        String password = "StrongPassword123!";

        SignupRequest firstSignup = SignupRequest.builder()
                .email(duplicateEmail)
                .password(password)
                .fullName("Dr. First Applicant")
                .role(Role.DOCTOR)
                .invitationCode("AEGIS-CLINICAL-INVITE-2026")
                .build();

        // First registration succeeds
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstSignup)))
                .andExpect(status().isCreated());

        // Duplicate registration with the same email must fail
        SignupRequest duplicateSignup = SignupRequest.builder()
                .email(duplicateEmail)
                .password("AnotherPassword456!")
                .fullName("Dr. Second Applicant")
                .role(Role.DOCTOR)
                .invitationCode("AEGIS-CLINICAL-INVITE-2026")
                .build();

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateSignup)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("SIGNUP_FAILED")))
                .andExpect(jsonPath("$.message", containsString("already registered")));
    }

    @Test
    @DisplayName("4. Invalid email formats are rejected with HTTP 400 Bad Request")
    void testInvalidEmailFormatRegistrationRejected() throws Exception {
        String[] invalidEmails = {
                "not-an-email",
                "doctor@",
                "@hospital.org",
                "doctor@hospital",
                "doctor@.com"
        };

        for (String invalidEmail : invalidEmails) {
            SignupRequest invalidRequest = SignupRequest.builder()
                    .email(invalidEmail)
                    .password("ValidPassword123!")
                    .fullName("Dr. Invalid Email")
                    .role(Role.DOCTOR)
                .invitationCode("AEGIS-CLINICAL-INVITE-2026")
                    .build();

            mockMvc.perform(post("/api/v1/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    @DisplayName("5. Passwords shorter than 6 characters are rejected with HTTP 400 Bad Request")
    void testShortPasswordRegistrationRejected() throws Exception {
        SignupRequest shortPasswordRequest = SignupRequest.builder()
                .email("dr.shortpass_" + System.currentTimeMillis() + "@hospital.org")
                .password("12345")
                .fullName("Dr. Short Pass")
                .role(Role.DOCTOR)
                .invitationCode("AEGIS-CLINICAL-INVITE-2026")
                .build();

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shortPasswordRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("6. Returning doctor successfully logs in using email and password")
    void testDoctorLoginWithEmailSuccess() throws Exception {
        String email = "dr.login_" + System.currentTimeMillis() + "@hospital.org";
        String password = "CorrectDoctorPassword2026!";

        // 1. Register doctor
        SignupRequest signupRequest = SignupRequest.builder()
                .email(email)
                .password(password)
                .fullName("Dr. Returning Intensivist")
                .role(Role.DOCTOR)
                .invitationCode("AEGIS-CLINICAL-INVITE-2026")
                .department("Surgical ICU")
                .licenseNumber("MD-SICU-1122")
                .build();

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isCreated());

        // 2. Authenticate returning doctor using email and password
        LoginRequest loginRequest = LoginRequest.builder()
                .email(email)
                .password(password)
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.email", is(email)))
                .andExpect(jsonPath("$.role", is("DOCTOR")))
                .andExpect(jsonPath("$.message", containsString("Login successful")));
    }

    @Test
    @DisplayName("7. Failed login with wrong password returns unified 'Invalid credentials' error (401)")
    void testDoctorLoginFailedWithIncorrectPassword() throws Exception {
        String email = "dr.wrongpass_" + System.currentTimeMillis() + "@hospital.org";
        String password = "DoctorPassword2026!";

        // Register doctor
        SignupRequest signupRequest = SignupRequest.builder()
                .email(email)
                .password(password)
                .role(Role.DOCTOR)
                .invitationCode("AEGIS-CLINICAL-INVITE-2026")
                .build();

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isCreated());

        // Login with incorrect password
        LoginRequest badPasswordRequest = LoginRequest.builder()
                .email(email)
                .password("TotallyWrongPassword999!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badPasswordRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("AUTHENTICATION_FAILED")))
                .andExpect(jsonPath("$.message", is("Invalid credentials")));
    }

    @Test
    @DisplayName("8. Failed login with non-existent email returns identical 'Invalid credentials' error (no email leak)")
    void testDoctorLoginFailedWithNonExistentEmail() throws Exception {
        LoginRequest nonExistentRequest = LoginRequest.builder()
                .email("ghost.doctor.never.registered@hospital.org")
                .password("AnyPassword123!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nonExistentRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("AUTHENTICATION_FAILED")))
                .andExpect(jsonPath("$.message", is("Invalid credentials")));
    }

    @Test
    @DisplayName("9. Unauthenticated request to protected Doctor route returns 401 Unauthorized")
    void testAccessProtectedDoctorRouteWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/clinical/doctor/prescription-privileges"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("UNAUTHORIZED")));
    }

    @Test
    @DisplayName("10. Authenticated Doctor accesses protected clinical routes using JWT Bearer token")
    void testAccessProtectedDoctorRouteWithValidDoctorToken() throws Exception {
        String email = "dr.privileges_" + System.currentTimeMillis() + "@hospital.org";
        String password = "DoctorPassword2026!";

        // Register and get token
        SignupRequest signupRequest = SignupRequest.builder()
                .email(email)
                .password(password)
                .fullName("Dr. Attending Specialist")
                .role(Role.DOCTOR)
                .invitationCode("AEGIS-CLINICAL-INVITE-2026")
                .build();

        MvcResult signupResult = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String token = objectMapper.readTree(signupResult.getResponse().getContentAsString())
                .get("token").asText();

        // 1. Access Doctor-only privileged endpoint
        mockMvc.perform(get("/api/v1/clinical/doctor/prescription-privileges")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessLevel", is("DOCTOR_RESTRICTED")))
                .andExpect(jsonPath("$.grantedPrivileges", hasItem("SEPSIS_3_BUNDLE_PRESCRIPTION")));

        // 2. Access Shared clinical endpoint
        mockMvc.perform(get("/api/v1/clinical/shared/patient-roster")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessLevel", is("SHARED_CLINICAL_ACCESS")));

        // 3. Access /me authenticated endpoint
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is(email)))
                .andExpect(jsonPath("$.role", is("DOCTOR")));
    }

    @Test
    @DisplayName("11. Doctor token is forbidden (403) from accessing Nurse-only workflow endpoint")
    void testDoctorCannotAccessNurseRestrictedRoute() throws Exception {
        String email = "dr.rolecheck_" + System.currentTimeMillis() + "@hospital.org";
        String password = "DoctorPassword2026!";

        SignupRequest signupRequest = SignupRequest.builder()
                .email(email)
                .password(password)
                .role(Role.DOCTOR)
                .invitationCode("AEGIS-CLINICAL-INVITE-2026")
                .build();

        MvcResult signupResult = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String token = objectMapper.readTree(signupResult.getResponse().getContentAsString())
                .get("token").asText();

        // Doctor attempting Nurse workflow -> 403 Forbidden
        mockMvc.perform(get("/api/v1/clinical/nurse/care-workflow")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("ACCESS_DENIED")))
                .andExpect(jsonPath("$.message", containsString("does not hold clinical authorization")));
    }
}
