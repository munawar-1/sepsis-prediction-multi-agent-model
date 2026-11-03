package com.aegis.repository;

import com.aegis.model.Patient;
import com.aegis.model.PatientStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, String> {

    Optional<Patient> findByPatientId(String patientId);

    Optional<Patient> findByMrn(String mrn);

    Optional<Patient> findByIcuBedNumber(String icuBedNumber);

    List<Patient> findByStatus(PatientStatus status);

    List<Patient> findByAttendingDoctorId(Long doctorId);

    List<Patient> findByPrimaryNurseId(Long nurseId);

    boolean existsByPatientId(String patientId);

    boolean existsByIcuBedNumber(String icuBedNumber);

    long countByStatus(PatientStatus status);

    @Query("SELECT p FROM Patient p WHERE p.status != 'DISCHARGED' ORDER BY p.icuBedNumber ASC")
    List<Patient> findAllActiveInpatients();

    @Query("SELECT p FROM Patient p WHERE p.attendingDoctor.id = :doctorId AND p.status != 'DISCHARGED'")
    List<Patient> findActivePatientsByDoctor(@Param("doctorId") Long doctorId);

    @Query("SELECT p FROM Patient p WHERE p.primaryNurse.id = :nurseId AND p.status != 'DISCHARGED'")
    List<Patient> findActivePatientsByNurse(@Param("nurseId") Long nurseId);
}
