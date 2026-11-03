"""
Unit & Integration Tests for TriageService and Service Layer
Tests the complete decoupling:
1. Telemetry tick evaluation (Nurse hardware fault vs Critical sepsis)
2. Nurse HITL verification (Confirmation vs Clinical Override)
3. Doctor grounded chat
4. Agent modular sandboxes (Validator, Vitals, Labs, Skeptic)
5. Observability & graph topology
"""

import os
import sys
import unittest

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ai_service.app.schemas.clinical_schemas import (
    TelemetryTickRequest,
    NurseVerificationRequest,
    DoctorChatRequest,
    ValidatorEvaluationRequest,
    SkepticEvaluationRequest
)
from ai_service.app.services.triage_service import get_triage_service
from ai_service.app.api.v1.endpoints import (
    evaluate_patient_state,
    verify_nurse_action,
    answer_doctor_inquiry,
    evaluate_sensor_validator,
    evaluate_vitals_agent,
    evaluate_labs_agent,
    evaluate_skeptic_agent,
    health_check,
    get_graph_topology
)


class TestServiceLayer(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Set SKIP_LOCAL_LLM=1 for fast, deterministic unit test execution
        os.environ["SKIP_LOCAL_LLM"] = "1"
        cls.service = get_triage_service()

    # -------------------------------------------------------------
    # 1. DIRECT SERVICE LAYER TESTS
    # -------------------------------------------------------------
    def test_service_evaluate_hardware_fault(self):
        """Test that sensor anomalies halt the workflow and alert ROLE_NURSE."""
        tick = TelemetryTickRequest(
            patient_id="bed_test_01",
            hour_index=1,
            HR=72.0, SBP=118.0, DBP=78.0, Resp=14.0, O2Sat=68.0
        )
        res = self.service.evaluate_patient_telemetry(tick)
        self.assertEqual(res.urgency_level, "HARDWARE_SENSOR_FAULT")
        self.assertEqual(res.target_role, "ROLE_NURSE")
        self.assertFalse(res.sensor_valid)
        self.assertEqual(res.workflow_status, "STOPPED_NURSE_HARDWARE_FAULT")
        self.assertIn("NURSE", res.evidence_chain_narrative)

    def test_service_evaluate_sepsis_case(self):
        """Test that high-risk telemetry triggers sepsis alert and resuscitation bundle."""
        tick = TelemetryTickRequest(
            patient_id="bed_test_02",
            hour_index=2,
            HR=114.0, SBP=102.0, MAP=72.0, Resp=24.0, O2Sat=94.0, Temp=38.3,
            Lactate=3.4, WBC=17.0, Creatinine=1.8,
            active_medications=["Albuterol 0.83 mg/mL Inhalation"]
        )
        res = self.service.evaluate_patient_telemetry(tick)
        self.assertIn(res.urgency_level, ["MODERATE", "CRITICAL_SEPSIS"])
        self.assertEqual(res.target_role, "ROLE_DOCTOR")
        self.assertTrue(res.sensor_valid)
        self.assertGreater(res.composite_sepsis_risk, 0.35)
        self.assertGreaterEqual(len(res.recommended_action_bundle), 4)

    def test_service_nurse_confirm_hardware_fault(self):
        """Test nurse confirming loose sensor halts alert."""
        req = NurseVerificationRequest(
            patient_id="bed_test_01",
            confirmed_hardware_fault=True,
            fault_type="PROBE_DETACHED",
            notes="Reattached finger clip."
        )
        res = self.service.handle_nurse_verification(req)
        self.assertEqual(res.action_taken, "CONFIRMED_HARDWARE_FAULT")
        self.assertEqual(res.target_role, "ROLE_NURSE")
        self.assertIsNone(res.evaluation_result)

    def test_service_nurse_override_clinical_illness(self):
        """Test nurse override executes clinical models and dispatches doctor alert."""
        req = NurseVerificationRequest(
            patient_id="bed_test_03",
            confirmed_hardware_fault=False,
            notes="Probe is securely attached. Patient is pale and diaphoretic.",
            vitals_dict={"HR": 110.0, "SBP": 96.0, "Resp": 22.0, "O2Sat": 93.0},
            labs_dict={"Lactate": 2.8, "WBC": 15.0}
        )
        res = self.service.handle_nurse_verification(req)
        self.assertEqual(res.action_taken, "OVERRIDE_CLINICAL_ILLNESS")
        self.assertEqual(res.target_role, "ROLE_DOCTOR")
        self.assertIsNotNone(res.evaluation_result)
        self.assertEqual(res.evaluation_result.target_role, "ROLE_DOCTOR")

    def test_service_doctor_grounded_chat(self):
        """Test that doctor chat response is grounded in patient measurements."""
        req = DoctorChatRequest(
            patient_id="bed_test_02",
            doctor_question="Why was sepsis triggered despite moderate blood pressure?",
            clinical_context={
                "composite_sepsis_risk": 0.58,
                "urgency_level": "CRITICAL_SEPSIS",
                "shock_index": 1.12,
                "vitals_evidence": {"shock_index": 1.12, "risk_drivers": [{"feature": "Shock Index"}]},
                "labs_evidence": {"organ_stress_level": "SEVERE_ORGAN_DYSFUNCTION"}
            }
        )
        res = self.service.answer_doctor_inquiry(req)
        self.assertEqual(res.patient_id, "bed_test_02")
        self.assertIn("Shock Index", res.llm_response)
        self.assertIn("1.12", res.llm_response)

    def test_service_modular_sandboxes(self):
        """Test modular individual agent execution."""
        # Validator
        val_res = self.service.evaluate_validator(ValidatorEvaluationRequest(
            current_vitals={"HR": 80.0, "SBP": 120.0, "DBP": 80.0, "Resp": 16.0, "O2Sat": 98.0}
        ))
        self.assertTrue(val_res["is_valid"])

        # Vitals Agent
        v_res = self.service.evaluate_vitals_agent({"HR": 115.0, "SBP": 95.0, "Resp": 24.0, "O2Sat": 93.0})
        self.assertGreater(v_res["vitals_risk_probability"], 0.40)
        self.assertIn("shock_index", v_res)

        # Labs Agent
        l_res = self.service.evaluate_labs_agent({"Lactate": 3.5, "WBC": 16.0})
        self.assertGreater(l_res["labs_risk_probability"], 0.40)

        # Skeptic Agent
        s_res = self.service.evaluate_skeptic_agent(SkepticEvaluationRequest(
            vitals_evidence=v_res,
            labs_evidence=l_res,
            active_medications=["Albuterol"]
        ))
        self.assertIn("classification", s_res)

    def test_service_topology_and_health(self):
        """Test graph topology and readiness probe."""
        health = self.service.get_system_health()
        self.assertEqual(health.status, "HEALTHY")
        self.assertIn("vitals_agent", health.models)

        topo = self.service.get_graph_topology()
        self.assertEqual(topo.entry_point, "data_validator")
        node_ids = [n["id"] for n in topo.nodes]
        self.assertIn("data_validator", node_ids)
        self.assertIn("nurse_verification", node_ids)
        self.assertIn("vitals_agent", node_ids)
        self.assertIn("labs_agent", node_ids)
        self.assertIn("skeptic_agent", node_ids)
        self.assertIn("synthesis", node_ids)

    # -------------------------------------------------------------
    # 2. CONTROLLER ENDPOINT DISPATCH TESTS
    # -------------------------------------------------------------
    def test_endpoint_evaluate_dispatch(self):
        """Test evaluate_patient_state controller function."""
        tick = TelemetryTickRequest(
            patient_id="bed_ctrl_01",
            hour_index=1,
            HR=110.0, SBP=100.0, MAP=70.0, Resp=22.0, O2Sat=94.0, Temp=38.2,
            Lactate=3.0, WBC=15.0
        )
        res = evaluate_patient_state(tick, self.service)
        self.assertEqual(res.patient_id, "bed_ctrl_01")
        self.assertEqual(res.target_role, "ROLE_DOCTOR")

    def test_endpoint_nurse_verify_dispatch(self):
        """Test verify_nurse_action controller function."""
        req = NurseVerificationRequest(
            patient_id="bed_ctrl_02",
            confirmed_hardware_fault=True,
            fault_type="LOOSE_BP_CUFF"
        )
        res = verify_nurse_action(req, self.service)
        self.assertEqual(res.action_taken, "CONFIRMED_HARDWARE_FAULT")

    def test_endpoint_doctor_chat_dispatch(self):
        """Test answer_doctor_inquiry controller function."""
        req = DoctorChatRequest(
            patient_id="bed_ctrl_01",
            doctor_question="Is antibiotic therapy indicated?"
        )
        res = answer_doctor_inquiry(req, self.service)
        data = res.model_dump() if hasattr(res, "model_dump") else res.dict()
        self.assertIn("llm_response", data)

    def test_endpoint_health_and_topology_dispatch(self):
        """Test health_check and get_graph_topology controller functions."""
        h = health_check(self.service)
        self.assertEqual(h.status, "HEALTHY")

        topo = get_graph_topology(self.service)
        self.assertEqual(topo.entry_point, "data_validator")


if __name__ == "__main__":
    unittest.main()
