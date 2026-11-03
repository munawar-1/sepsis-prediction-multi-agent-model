package com.aegis.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", unique = true, nullable = false, length = 64)
    private String username;

    @Column(name = "email", unique = true, nullable = false, length = 128)
    private String email;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "full_name", length = 128)
    private String fullName;

    @Column(name = "department", length = 128)
    private String department;

    @Column(name = "specialty", length = 128)
    private String specialty;

    @Column(name = "license_number", length = 64)
    private String licenseNumber;

    @Column(name = "phone_number", length = 32)
    private String phoneNumber;

    @Column(name = "pager_number", length = 32)
    private String pagerNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 32)
    private Role role;

    @Builder.Default
    @Column(name = "shift_status", length = 32)
    private String shiftStatus = "ON_DUTY"; // ON_DUTY, OFF_DUTY, ON_CALL

    @Builder.Default
    @Column(name = "enabled")
    private boolean enabled = true;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    public boolean isDoctor() {
        return this.role == Role.DOCTOR;
    }

    public boolean isNurse() {
        return this.role == Role.NURSE;
    }
}
