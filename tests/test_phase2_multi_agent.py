"""
Unit & Integration Test Suite for Phase 2: Aegis-ICU Multi-Agent System
Tests each agent independently:
- Agent 0: Data Quality & Reliability Agent
- Agent 1: Vitals Agent (Predictor & Reasoning)
- Agent 2: Labs Agent (Predictor & Reasoning, Martha's Rule)
- Agent 3: Skeptic Agent (Predictor & Reasoning, Medication Confounders)
And tests the full pipeline through the Triage Orchestrator.
"""

import os
import sys
import unittest

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
from models.vitals_agent.src.predictor import VitalsPredictor
from models.labs_agent.src.predictor import LabsPredictor
from models.skeptic_agent.src.predictor import SkepticPredictor
from models.triage_orchestrator.src.orchestrator import SepsisOrchestrator


class TestVitalsAgent(unittest.TestCase):
    def setUp(self):
        self.predictor = VitalsPredictor()

    def test_structured_finding_format(self):
        vitals = {"HR": 105.0, "SBP": 110.0, "MAP": 76.0, "Resp": 22.0, "O2Sat": 96.0, "Temp": 38.1}
        res = self.predictor.predict(vitals)
        self.assertEqual(res["agent_name"], "Vitals Agent")
        self.assertIn("timestamp", res)
        self.assertIn("confidence", res)
        self.assertIn("risk_level", res)
        self.assertIn("clinical_explanation", res)
        self.assertIn("shap_contributions", res)
        self.assertGreater(res["confidence"], 0.80)

    def test_shock_index_and_tachypnea_detection(self):
        # HR 115 / SBP 100 = Shock index 1.15 (severe shock)
        vitals = {"HR": 115.0, "SBP": 100.0, "MAP": 72.0, "Resp": 24.0, "O2Sat": 94.0, "Temp": 38.5}
        res = self.predictor.predict(vitals)
        self.assertGreaterEqual(res["shock_index"], 1.0)
        self.assertEqual(res["risk_level"], "CRITICAL_SEPSIS")
        self.assertTrue(any("Critical Occult Shock" in d for d in res["risk_drivers"]))


class TestLabsAgent(unittest.TestCase):
    def setUp(self):
        self.predictor = LabsPredictor()

    def test_structured_finding_and_marthas_rule_notice(self):
        # Normal lactate should NOT rule out sepsis
        labs = {"Lactate": 1.3, "WBC": 7.5, "Creatinine": 0.9, "Platelets": 230.0}
        res = self.predictor.predict(labs)
        self.assertEqual(res["agent_name"], "Labs Agent")
        self.assertIn("timestamp", res)
        self.assertIn("confidence", res)
        self.assertIn("safety_notice", res)
        self.assertIn("MARTHA'S RULE", res["safety_notice"])
        self.assertIn("pathology_summary", res)

    def test_missing_lactate_escalation(self):
        labs = {"WBC": 8.0}  # Lactate missing
        res = self.predictor.predict(labs)
        self.assertTrue(any("STAT Blood Lactate" in o for o in res["stat_lab_draws_required"]))
        self.assertIn("MARTHA'S RULE SAFETY NOTICE", res["safety_notice"])

    def test_acute_organ_dysfunction(self):
        labs = {"Lactate": 4.5, "WBC": 19.0, "Creatinine": 2.2, "Platelets": 80.0}
        res = self.predictor.predict(labs)
        self.assertEqual(res["organ_stress_level"], "SEVERE_ORGAN_DYSFUNCTION")
        self.assertGreaterEqual(res["labs_risk_probability"], 0.60)


class TestSkepticAgent(unittest.TestCase):
    def setUp(self):
        self.predictor = SkepticPredictor()

    def test_never_suppress_sepsis_warning_due_to_medication(self):
        """
        CRITICAL SAFETY RULE: Never suppress a sepsis warning solely because
        medication might explain a symptom.
        When Albuterol is given BUT patient has tachypnea (Resp 22) and elevated shock index (0.88),
        alarm suppression MUST be False and action MUST be STAND_ALERT.
        """
        mock_vitals = {
            "vitals_risk_probability": 0.65,
            "shock_index": 0.88,
            "news2_score": 4,
            "risk_drivers": ["Tachycardia: 108 bpm", "Elevated Shock Index: 0.88", "Tachypnea: 22 /min"],
            "shap_contributions": {"HR": 0.25, "Resp": 0.18},
            "telemetry_snapshot": {"HR": 108.0, "SBP": 122.0, "MAP": 80.0, "Resp": 22.0, "Temp": 37.8, "O2Sat": 96.0}
        }
        mock_labs = {
            "labs_risk_probability": 0.15,
            "organ_stress_level": "NORMAL_HOMEOSTASIS",
            "abnormal_biomarkers": [],
            "stat_lab_draws_required": [],
            "shap_contributions": {"Lactate": -0.20},
            "labs_snapshot": {"Lactate": 1.1, "WBC": 6.8}
        }
        ehr = {"medications": ["Albuterol 0.83 mg/mL Inhalation Solution"]}

        res = self.predictor.evaluate_false_alarm(mock_vitals, mock_labs, ehr)
        self.assertFalse(res["alarm_suppression_recommended"], "Sepsis alert must NEVER be suppressed due to medication!")
        self.assertEqual(res["recommended_action"], "STAND_ALERT")
        self.assertIn("Clinical Safety Mandate", res["clinical_reasoning"])

    def test_immunocompromised_escalation(self):
        mock_vitals = {
            "vitals_risk_probability": 0.45,
            "shock_index": 0.80,
            "news2_score": 3,
            "risk_drivers": ["HR 98 bpm"],
            "shap_contributions": {"HR": 0.10},
            "telemetry_snapshot": {"HR": 98.0, "SBP": 122.0, "MAP": 82.0, "Resp": 19.0, "Temp": 37.4, "O2Sat": 97.0}
        }
        mock_labs = {
            "labs_risk_probability": 0.20,
            "organ_stress_level": "NORMAL_HOMEOSTASIS",
            "abnormal_biomarkers": [],
            "stat_lab_draws_required": [],
            "shap_contributions": {},
            "labs_snapshot": {"Lactate": 1.2}
        }
        ehr = {"conditions": ["Chemotherapy-induced neutropenia"]}

        res = self.predictor.evaluate_false_alarm(mock_vitals, mock_labs, ehr)
        self.assertEqual(res["classification"], "EHR_HIGH_RISK_ESCALATION")
        self.assertEqual(res["recommended_action"], "ESCALATE_ALERT")
        self.assertEqual(res["ehr_risk_modifier"], "ELEVATE_RISK")


class TestTriageOrchestrator(unittest.TestCase):
    def setUp(self):
        self.orchestrator = SepsisOrchestrator()

    def test_full_pipeline_structured_findings_all_agents(self):
        vitals = {"HR": 106.0, "SBP": 118.0, "MAP": 80.0, "Resp": 22.0, "O2Sat": 96.0, "Temp": 38.0}
        labs = {"Lactate": 1.3, "WBC": 7.8, "Creatinine": 0.9, "Platelets": 210.0}
        meds = ["Albuterol Inhalation"]

        eval_res = self.orchestrator.evaluate(
            patient_id="p_test_full",
            hour=1,
            vitals_dict=vitals,
            labs_dict=labs,
            meds_list=meds
        )

        # Check structured findings from the 3 clinical intelligence agents
        self.assertEqual(len(eval_res.agent_findings), 3)
        agent_names = [f["agent_name"] for f in eval_res.agent_findings]
        self.assertIn("Vitals Agent", agent_names)
        self.assertIn("Labs Agent", agent_names)
        self.assertIn("Skeptic Agent", agent_names)
        self.assertIsNotNone(eval_res.data_quality_evidence)
        self.assertTrue(eval_res.data_quality_evidence.get("is_valid"))

        # Verify timestamps and confidences present
        for finding in eval_res.agent_findings:
            self.assertIn("timestamp", finding)
            self.assertIn("confidence", finding)
            self.assertGreater(finding["confidence"], 0.0)

    def test_vitals_labs_discordance_transparent_handling(self):
        """
        Martha's Rule scenario: Vitals show shock and tachypnea, but labs are normal or uncollected.
        Must generate VITALS_LABS_DISCORDANCE and must NOT suppress the sepsis urgency!
        """
        vitals = {"HR": 112.0, "SBP": 105.0, "MAP": 74.0, "Resp": 24.0, "O2Sat": 94.0, "Temp": 38.4}
        labs = {"Lactate": 1.2, "WBC": 7.0}  # Normal lactate!
        meds = []

        eval_res = self.orchestrator.evaluate(
            patient_id="p_martha_scenario",
            hour=3,
            vitals_dict=vitals,
            labs_dict=labs,
            meds_list=meds
        )

        discordance_types = [d["disagreement_type"] for d in eval_res.agent_disagreements]
        self.assertIn("VITALS_LABS_DISCORDANCE", discordance_types)
        # Urgency must remain MODERATE or CRITICAL_SEPSIS, NOT LOW!
        self.assertIn(eval_res.urgency_level, ["MODERATE", "CRITICAL_SEPSIS"])
        # Action bundle must include STAT lab orders
        self.assertTrue(any("STAT_LAB" in str(b) or "Lactate" in str(b) for b in eval_res.recommended_action_bundle))

    def test_vitals_skeptic_discordance_transparent_handling(self):
        """
        Patient on Albuterol has elevated vitals risk and tachypnea.
        Must report VITALS_SKEPTIC_DISCORDANCE and alert must NOT be suppressed!
        """
        vitals = {"HR": 108.0, "SBP": 120.0, "MAP": 82.0, "Resp": 22.0, "O2Sat": 96.0, "Temp": 37.9}
        labs = {"Lactate": 1.4, "WBC": 8.0, "Creatinine": 0.9, "Platelets": 220.0}
        meds = ["Albuterol 0.83 mg/mL Inhalation Solution"]

        eval_res = self.orchestrator.evaluate(
            patient_id="p_albuterol_concomitant",
            hour=2,
            vitals_dict=vitals,
            labs_dict=labs,
            meds_list=meds
        )

        self.assertFalse(eval_res.skeptic_evidence["alarm_suppression_recommended"])
        self.assertEqual(eval_res.skeptic_evidence["recommended_action"], "STAND_ALERT")
        discordance_types = [d["disagreement_type"] for d in eval_res.agent_disagreements]
        self.assertIn("VITALS_SKEPTIC_DISCORDANCE", discordance_types)



if __name__ == "__main__":
    unittest.main()

