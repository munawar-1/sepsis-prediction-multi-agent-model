package com.aegis.repository;

import com.aegis.model.Role;
import com.aegis.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);
    List<User> findByRole(Role role);
    List<User> findByRoleAndShiftStatus(Role role, String shiftStatus);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
