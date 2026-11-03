package com.aegis.repository;

import com.aegis.model.PatientTelemetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientTelemetryRepository extends JpaRepository<PatientTelemetry, Long> {

    List<PatientTelemetry> findByPatientPatientIdOrderByHourIndexAsc(String patientId);

    Optional<PatientTelemetry> findTopByPatientPatientIdOrderByHourIndexDesc(String patientId);

    Optional<PatientTelemetry> findByPatientPatientIdAndHourIndex(String patientId, Integer hourIndex);

    @Query("SELECT t FROM PatientTelemetry t WHERE t.patient.patientId = :patientId ORDER BY t.recordedAt DESC")
    List<PatientTelemetry> findRecentTelemetryByPatient(@Param("patientId") String patientId);

    void deleteByPatientPatientId(String patientId);
}
