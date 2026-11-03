package com.aegis.repository;

import com.aegis.model.ClinicalActionOrder;
import com.aegis.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicalActionOrderRepository extends JpaRepository<ClinicalActionOrder, Long> {

    @Query("SELECT o FROM ClinicalActionOrder o WHERE o.evaluation.id = :evaluationId")
    List<ClinicalActionOrder> findByEvaluationId(@Param("evaluationId") Long evaluationId);

    List<ClinicalActionOrder> findByEvaluationPatientPatientId(String patientId);

    List<ClinicalActionOrder> findByStatus(OrderStatus status);

    List<ClinicalActionOrder> findByEvaluationPatientPatientIdAndStatus(String patientId, OrderStatus status);

    @Query("SELECT o FROM ClinicalActionOrder o WHERE o.evaluation.patient.patientId = :patientId AND o.status IN ('RECOMMENDED', 'APPROVED') ORDER BY o.orderedAt DESC")
    List<ClinicalActionOrder> findPendingOrdersByPatient(@Param("patientId") String patientId);

    @Query("SELECT o FROM ClinicalActionOrder o WHERE o.evaluation.patient.attendingDoctor.id = :doctorId AND o.status = 'RECOMMENDED' ORDER BY o.orderedAt DESC")
    List<ClinicalActionOrder> findPendingOrdersForDoctorApproval(@Param("doctorId") Long doctorId);
}
