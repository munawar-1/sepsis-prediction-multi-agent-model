package com.aegis.config;

import com.aegis.model.Role;
import com.aegis.model.User;
import com.aegis.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedDoctorMunawar();
        seedDoctor();
        seedNurse();
    }

    private void seedDoctorMunawar() {
        if (!userRepository.existsByUsername("dr.munawar") && !userRepository.existsByEmail("mohammad.munawar2007@gmail.com")) {
            User doctor = User.builder()
                    .username("dr.munawar")
                    .email("mohammad.munawar2007@gmail.com")
                    .password(passwordEncoder.encode("monu2007"))
                    .fullName("Dr. Mohammad Munawar, MD")
                    .role(Role.DOCTOR)
                    .department("Critical Care & Intensive Care Medicine")
                    .specialty("Chief Attending Intensivist")
                    .licenseNumber("MCI-DEL-2026-9901")
                    .phoneNumber("+91-9876543210")
                    .pagerNumber("PAGER-ICU-01")
                    .shiftStatus("ON_DUTY")
                    .enabled(true)
                    .build();
            userRepository.save(doctor);
            log.info("Primary Attending Doctor seeded: username=dr.munawar, email=mohammad.munawar2007@gmail.com, role=DOCTOR");
        }
    }

    private void seedDoctor() {
        if (!userRepository.existsByUsername("dr.sharma")) {
            User doctor = User.builder()
                    .username("dr.sharma")
                    .email("dr.sharma@aegis.icu")
                    .password(passwordEncoder.encode("Doctor123!"))
                    .fullName("Dr. Rajesh Sharma, MD")
                    .role(Role.DOCTOR)
                    .department("Critical Care & Pulmonology")
                    .licenseNumber("MED-CC-90210")
                    .enabled(true)
                    .build();
            userRepository.save(doctor);
            log.info("Default Attending Doctor seeded: username=dr.sharma, role=DOCTOR");
        }
    }

    private void seedNurse() {
        if (!userRepository.existsByUsername("nurse.priya")) {
            User nurse = User.builder()
                    .username("nurse.priya")
                    .email("priya.patel@aegis.icu")
                    .password(passwordEncoder.encode("Nurse123!"))
                    .fullName("Priya Patel, BSN, RN, CCRN")
                    .role(Role.NURSE)
                    .department("Medical Intensive Care Unit (MICU)")
                    .licenseNumber("RN-ICU-44102")
                    .enabled(true)
                    .build();
            userRepository.save(nurse);
            log.info("Default Bedside Nurse seeded: username=nurse.priya, role=NURSE");
        }
    }
}

