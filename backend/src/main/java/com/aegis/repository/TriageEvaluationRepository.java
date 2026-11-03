package com.aegis.repository;

import com.aegis.model.TriageEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TriageEvaluationRepository extends JpaRepository<TriageEvaluation, Long> {

    Optional<TriageEvaluation> findTopByPatientPatientIdOrderByEvaluatedAtDesc(String patientId);

    List<TriageEvaluation> findByPatientPatientIdOrderByEvaluatedAtDesc(String patientId);

    List<TriageEvaluation> findByUrgencyLevel(String urgencyLevel);

    List<TriageEvaluation> findByTargetRole(String targetRole);

    @Query("SELECT e FROM TriageEvaluation e WHERE e.urgencyLevel = 'CRITICAL_SEPSIS' ORDER BY e.evaluatedAt DESC")
    List<TriageEvaluation> findAllCriticalSepsisAlerts();

    @Query("SELECT e FROM TriageEvaluation e WHERE e.targetRole = 'ROLE_NURSE' AND e.sensorValid = false ORDER BY e.evaluatedAt DESC")
    List<TriageEvaluation> findAllActiveHardwareFaults();

    @Query("SELECT e FROM TriageEvaluation e WHERE e.discrepancyDetected = true ORDER BY e.evaluatedAt DESC")
    List<TriageEvaluation> findOccultEarlyDeteriorationAlerts();

    @Query("SELECT e FROM TriageEvaluation e WHERE e.patient.attendingDoctor.id = :doctorId AND e.urgencyLevel IN ('MODERATE', 'CRITICAL_SEPSIS') ORDER BY e.evaluatedAt DESC")
    List<TriageEvaluation> findUrgentAlertsByDoctor(@Param("doctorId") Long doctorId);

    @Query("SELECT e FROM TriageEvaluation e WHERE e.patient.primaryNurse.id = :nurseId AND e.targetRole = 'ROLE_NURSE' ORDER BY e.evaluatedAt DESC")
    List<TriageEvaluation> findNurseAlertsByNurse(@Param("nurseId") Long nurseId);
}
