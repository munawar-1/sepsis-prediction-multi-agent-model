package com.aegis.repository;

import com.aegis.model.HitlAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HitlAuditLogRepository extends JpaRepository<HitlAuditLog, String> {
    List<HitlAuditLog> findByPatientIdOrderByRecordedAtDesc(String patientId);
    List<HitlAuditLog> findByClinicianIdOrderByRecordedAtDesc(String clinicianId);
    List<HitlAuditLog> findAllByOrderByRecordedAtDesc();
}
