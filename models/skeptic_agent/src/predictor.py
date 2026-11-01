"""
Model 3 (Skeptic Agent): Predictor & False Alarm Evaluation Engine
Orchestrates confounder analysis, LLM clinical reasoning, and computes
the Confidence Discount Factor D in [0.0, 1.0] to suppress ICU alert fatigue.
"""

import os
from typing import Dict, Any, Optional
from models.skeptic_agent.src.reasoning_agent import SkepticReasoningAgent, SkepticEvidenceReport

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "artifacts", "skeptic_rf_model.pkl")


class SkepticPredictor:
    """
    Inference and clinical reasoning interface for Agent 3.
    """
    def __init__(
        self,
        model_path: str = MODEL_PATH,
        gemini_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        ollama_base_url: Optional[str] = None,
        ollama_model: Optional[str] = None
    ):
        self.model_path = model_path
        self.reasoning_agent = SkepticReasoningAgent(
            gemini_api_key=gemini_api_key,
            openai_api_key=openai_api_key,
            ollama_base_url=ollama_base_url,
            ollama_model=ollama_model
        )

    def evaluate_false_alarm(
        self,
        vitals_result: Dict[str, Any],
        labs_result: Dict[str, Any],
        ehr_data: Any
    ) -> Dict[str, Any]:
        """
        Evaluates whether an impending Sepsis Alert should be discounted
        due to benign EHR confounders (e.g. Albuterol-induced tachycardia)
        or if it represents TRUE SEPSIS requiring urgent intervention.

        Returns:
            Dictionary containing discount factor, classification, confounders,
            and explainable clinical reasoning.
        """
        report: SkepticEvidenceReport = self.reasoning_agent.explain(
            vitals_result=vitals_result,
            labs_result=labs_result,
            ehr_data=ehr_data
        )

        return {
            "confidence_discount_factor": round(report.confidence_discount_factor, 4),
            "is_false_alarm": report.is_false_alarm,
            "ehr_risk_modifier": report.ehr_risk_modifier,
            "classification": report.classification,
            "alarm_suppression_recommended": report.alarm_suppression_recommended,
            "detected_confounders": report.detected_confounders,
            "shap_attribution_critique": report.shap_attribution_critique,
            "clinical_reasoning": report.clinical_reasoning,
            "recommended_action": report.recommended_action,
            "llm_source": report.llm_source
        }


if __name__ == "__main__":
    # Test Scenario 1: FALSE ALARM (Albuterol Inhalation + Asthma)
    # Vitals Agent shows elevated risk due to HR (108), but Labs shows normal lactate (1.1).
    mock_vitals_false_alarm = {
        "vitals_risk_probability": 0.72,
        "shock_index": 0.88,
        "news2_score": 3,
        "risk_drivers": ["Tachycardia: Heart Rate 108 bpm", "Elevated Shock Index: 0.88"],
        "shap_contributions": {
            "HR": 0.28,
            "Shock_Index": 0.19,
            "Resp": 0.02,
            "MAP": -0.05,
            "Temp": -0.02
        },
        "telemetry_snapshot": {"HR": 108.0, "SBP": 122.0, "MAP": 80.0, "Resp": 18.0, "Temp": 36.8, "O2Sat": 98.0}
    }

    mock_labs_normal = {
        "labs_risk_probability": 0.15,
        "organ_stress_level": "NORMAL_HOMEOSTASIS",
        "abnormal_biomarkers": [],
        "stat_lab_draws_required": [],
        "shap_contributions": {
            "Lactate": -0.22,
            "WBC": -0.15,
            "Creatinine": -0.08,
            "Platelets": -0.05
        },
        "labs_snapshot": {"Lactate": 1.1, "WBC": 6.8, "Creatinine": 0.9, "Platelets": 240.0}
    }

    ehr_albuterol = {
        "medications": ["Albuterol 0.83 mg/mL Inhalation Solution"],
        "conditions": ["Asthma, unspecified"]
    }

    predictor = SkepticPredictor()
    result_false_alarm = predictor.evaluate_false_alarm(mock_vitals_false_alarm, mock_labs_normal, ehr_albuterol)

    print("\n" + "=" * 65)
    print("      AEGIS-ICU: AGENT 3 (SKEPTIC & FALSE ALARM CHECKER)")
    print("=" * 65)
    print(" [TEST CASE 1: ALBUTEROL CONVOLUTED FALSE ALARM]")
    print(f" [+] Is False Alarm                 : {result_false_alarm['is_false_alarm']}")
    print(f" [+] Classification                 : {result_false_alarm['classification']}")
    print(f" [+] Confidence Discount Factor (D) : {result_false_alarm['confidence_discount_factor']}")
    print(f" [+] Alarm Suppression Recommended  : {result_false_alarm['alarm_suppression_recommended']}")
    print(f" [+] Action                         : {result_false_alarm['recommended_action']}")
    print(f" [+] Detected Confounders           : {result_false_alarm['detected_confounders']}")
    print(f" [+] SHAP Critique                  : {result_false_alarm['shap_attribution_critique']}")
    print(f" [+] Clinical Reasoning             : {result_false_alarm['clinical_reasoning']}")
    print("-" * 65)

    # Test Scenario 2: TRUE SEPSIS (Severe Lactic Acidosis despite Albuterol)
    mock_labs_septic = {
        "labs_risk_probability": 0.85,
        "organ_stress_level": "SEVERE_ORGAN_DYSFUNCTION",
        "abnormal_biomarkers": ["Elevated Lactate: 3.6 mmol/L", "Leukocytosis: WBC 18.2"],
        "stat_lab_draws_required": ["STAT Repeat Lactate in 2h"],
        "shap_contributions": {
            "Lactate": 0.35,
            "WBC": 0.22,
            "Creatinine": 0.14,
            "Platelets": 0.10
        },
        "labs_snapshot": {"Lactate": 3.6, "WBC": 18.2, "Creatinine": 1.8, "Platelets": 85.0}
    }

    result_true_sepsis = predictor.evaluate_false_alarm(mock_vitals_false_alarm, mock_labs_septic, ehr_albuterol)
    print("\n [TEST CASE 2: TRUE SEPSIS (ORGAN DYSFUNCTION CANNOT BE DISCOUNTED)]")
    print(f" [+] Is False Alarm                 : {result_true_sepsis['is_false_alarm']}")
    print(f" [+] Classification                 : {result_true_sepsis['classification']}")
    print(f" [+] Confidence Discount Factor (D) : {result_true_sepsis['confidence_discount_factor']}")
    print(f" [+] Alarm Suppression Recommended  : {result_true_sepsis['alarm_suppression_recommended']}")
    print(f" [+] Action                         : {result_true_sepsis['recommended_action']}")
    print(f" [+] Clinical Reasoning             : {result_true_sepsis['clinical_reasoning']}")
    print("-" * 65)

    # Test Scenario 3: HIGH-RISK EHR (Immunocompromised / Chemotherapy)
    ehr_high_risk = {
        "medications": ["Cisplatin 50 mg/m2", "Doxorubicin 60 mg/m2"],
        "conditions": ["Chemotherapy-induced neutropenia", "Diffuse large B-cell lymphoma"]
    }
    result_high_risk = predictor.evaluate_false_alarm(mock_vitals_false_alarm, mock_labs_normal, ehr_high_risk)
    print("\n [TEST CASE 3: HIGH-RISK EHR (IMMUNOCOMPROMISED ESCALATION)]")
    print(f" [+] Is False Alarm                 : {result_high_risk['is_false_alarm']}")
    print(f" [+] EHR Risk Modifier              : {result_high_risk['ehr_risk_modifier']}")
    print(f" [+] Classification                 : {result_high_risk['classification']}")
    print(f" [+] Confidence Discount Factor (D) : {result_high_risk['confidence_discount_factor']}")
    print(f" [+] Action                         : {result_high_risk['recommended_action']}")
    print(f" [+] Clinical Reasoning             : {result_high_risk['clinical_reasoning']}")
    print("=" * 65 + "\n")

