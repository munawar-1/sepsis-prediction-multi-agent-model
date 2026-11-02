"""
Model 2 (Labs Agent): Predictor & Pathology Evaluation Engine
Loads labs_rf_model.pkl and evaluates episodic or hourly laboratory panels.
Outputs:
1. Laboratory Sepsis Probability (0.0 to 1.0)
2. Organ Dysfunction Categorization (Sepsis-3 aligned)
3. Cellular Hypoxia & Metabolic Acidosis Grading
4. Immediate STAT Diagnostic Lab Draw Escalations
5. Structured Evidence Report with Timestamp and Confidence Score
6. LLM-powered clinical pathology reasoning
"""

import os
import sys
import tempfile
from typing import Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault("MPLCONFIGDIR", os.path.join(tempfile.gettempdir(), "matplotlib"))

import joblib
import numpy as np
import pandas as pd
import shap

try:
    from models.labs_agent.src.reasoning_agent import LabsReasoningAgent, LabsEvidenceReport
except ImportError:
    from reasoning_agent import LabsReasoningAgent, LabsEvidenceReport

MODEL_PATH = os.path.join(BASE_DIR, "artifacts", "labs_rf_model.pkl")
SHAP_EXPLAINER_PATH = os.path.join(BASE_DIR, "artifacts", "labs_shap_explainer.pkl")

# Fitted medians from training cohort
TRAIN_MEDIANS = {
    "Lactate": 1.6,
    "WBC": 9.2,
    "Creatinine": 0.9,
    "Platelets": 220.0
}

class LabsPredictor:
    def __init__(
        self,
        model_path: str = MODEL_PATH,
        gemini_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        ollama_base_url: Optional[str] = None,
        ollama_model: Optional[str] = None
    ):
        self.model_path = model_path
        self.model = None
        self.shap_explainer = None
        self.load_model()
        self.reasoning_agent = LabsReasoningAgent(
            gemini_api_key=gemini_api_key,
            openai_api_key=openai_api_key,
            ollama_base_url=ollama_base_url,
            ollama_model=ollama_model
        )

    def load_model(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        else:
            raise FileNotFoundError(f"Labs RF Model not found at {self.model_path}. Train it first.")

        if os.path.exists(SHAP_EXPLAINER_PATH):
            self.shap_explainer = joblib.load(SHAP_EXPLAINER_PATH)
        else:
            self.shap_explainer = shap.TreeExplainer(self.model)

    def _compute_shap_contributions(self, df_row: pd.DataFrame) -> dict:
        """
        Computes SHAP value contributions for a single inference row.
        Returns a sorted dict of {feature: shap_value} for the Sepsis positive class.
        """
        raw_shap = self.shap_explainer.shap_values(df_row)
        if isinstance(raw_shap, list) and len(raw_shap) == 2:
            vals = raw_shap[1][0]
        elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 3:
            vals = raw_shap[0, :, 1]
        elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 2:
            vals = raw_shap[0]
        else:
            vals = np.zeros(len(df_row.columns))

        features = list(df_row.columns)
        contributions = {feat: float(round(v, 4)) for feat, v in zip(features, vals)}
        sorted_contributions = dict(
            sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)
        )
        return sorted_contributions

    def explain(self, labs_result: dict) -> LabsEvidenceReport:
        """
        Explicit reasoning method producing typed LabsEvidenceReport.
        """
        return self.reasoning_agent.explain(labs_result)

    def predict(self, labs_dict: dict, generate_reasoning: bool = True) -> dict:
        """
        Input: Dictionary of blood pathology e.g. {'Lactate': 3.4, 'WBC': 16.2, 'Creatinine': 1.8, 'Platelets': 120}
        Output: Prediction dictionary with probability, organ stress status, STAT lab triggers, and structured report.
        """
        features = {}
        missing_count = 0
        for key, default_val in TRAIN_MEDIANS.items():
            val = labs_dict.get(key)
            if val is None or np.isnan(val):
                features[key] = default_val
                features[f"{key}_was_missing"] = 1
                missing_count += 1
            else:
                features[key] = float(val)
                features[f"{key}_was_missing"] = 0

        # Sepsis-3 Clinical Rule Flags
        stat_orders = []
        abnormal = []

        lactate = labs_dict.get("Lactate")
        if lactate is None:
            stat_orders.append("STAT Blood Lactate (Martha's Rule: Occult Hypoperfusion Protocol)")
        elif lactate >= 4.0:
            abnormal.append(f"Severe Lactic Acidosis: {lactate} mmol/L (Severe Cellular Hypoperfusion)")
            stat_orders.append("Serial Blood Lactate q2h (Resuscitation Clearance Protocol)")
        elif lactate >= 2.0:
            abnormal.append(f"Elevated Lactate: {lactate} mmol/L (Occult Tissue Hypoperfusion)")
            stat_orders.append("STAT Repeat Lactate in 2-4 Hours")

        creat = labs_dict.get("Creatinine")
        if creat is not None and creat >= 2.0:
            abnormal.append(f"Acute Kidney Injury Risk: Creatinine {creat} mg/dL (2x Baseline)")
            stat_orders.append("STAT Urinalysis & Nephrotoxic Medication Review")

        plat = labs_dict.get("Platelets")
        if plat is not None and plat < 100.0:
            abnormal.append(f"Thrombocytopenia: Platelet count {plat} x10^3/uL (Consumptive Coagulopathy)")
            stat_orders.append("Coagulation Panel (PT/INR, PTT, Fibrinogen)")

        wbc = labs_dict.get("WBC")
        if wbc is not None:
            if wbc >= 12.0:
                abnormal.append(f"Leukocytosis: WBC {wbc} x10^3/uL (Systemic Immune Response)")
            elif wbc <= 4.0:
                abnormal.append(f"Leukopenia: WBC {wbc} x10^3/uL (Severe Sepsis Bone Marrow Suppression)")

        feature_order = list(self.model.feature_names_in_)
        df_row = pd.DataFrame([features])[feature_order]
        prob = float(self.model.predict_proba(df_row)[0, 1])

        # Sepsis-3 Organ Failure / Stress Staging
        if prob >= 0.60 or (lactate and lactate >= 4.0) or (creat and creat >= 2.0) or (plat and plat < 100.0):
            stress_level = "SEVERE_ORGAN_DYSFUNCTION"
        elif prob >= 0.30 or (lactate and lactate >= 2.0) or (wbc and wbc >= 12.0):
            stress_level = "MODERATE_HYPOXIA"
        elif missing_count == len(TRAIN_MEDIANS):
            stress_level = "UNASSESSED_MISSING_LABS"
        else:
            stress_level = "NORMAL_HOMEOSTASIS"

        shap_contribs = self._compute_shap_contributions(df_row)

        raw_result = {
            "labs_risk_probability": round(prob, 4),
            "organ_stress_level": stress_level,
            "stat_lab_draws_required": stat_orders,
            "abnormal_biomarkers": abnormal,
            "shap_contributions": shap_contribs,
            "labs_snapshot": {k: labs_dict.get(k) for k in TRAIN_MEDIANS}
        }

        # Synthesize structured evidence report via reasoning agent
        evidence_report = self.reasoning_agent.explain(raw_result)

        return {
            "agent_name": evidence_report.agent_name,
            "timestamp": evidence_report.timestamp,
            "confidence": evidence_report.confidence,
            "organ_stress_level": evidence_report.organ_stress_level,
            "labs_risk_probability": evidence_report.lab_probability,
            "cellular_hypoxia_grade": evidence_report.cellular_hypoxia_grade,
            "freshness_status": evidence_report.freshness_status,
            "safety_notice": evidence_report.safety_notice,
            "stat_lab_draws_required": evidence_report.stat_orders_recommended,
            "stat_orders_recommended": evidence_report.stat_orders_recommended,
            "abnormal_biomarkers": evidence_report.abnormal_biomarkers,
            "shap_summary": evidence_report.shap_summary,
            "pathology_summary": evidence_report.pathology_summary,
            "clinical_reasoning": evidence_report.clinical_reasoning,
            "shap_contributions": evidence_report.shap_contributions,
            "labs_snapshot": evidence_report.labs_snapshot,
            "llm_source": evidence_report.llm_source
        }

if __name__ == "__main__":
    predictor = LabsPredictor()
    
    # Severe Sepsis Test Panel
    sepsis_labs = {
        "Lactate": 3.8,
        "WBC": 17.4,
        "Creatinine": 1.9,
        "Platelets": 95.0
    }
    result = predictor.predict(sepsis_labs)
    prob_pct = result["labs_risk_probability"] * 100

    print("\n" + "=" * 65)
    print("       AEGIS-ICU: MODEL 2 (LABS AGENT) INFERENCE & LLM REASONING")
    print("=" * 65)
    print(f" [+] Agent Name                       : {result['agent_name']}")
    print(f" [+] Evaluation Timestamp             : {result['timestamp']}")
    print(f" [+] Agent Confidence                 : {result['confidence'] * 100:.0f}%")
    print(f" [+] Freshness Status                 : {result['freshness_status']}")
    print(f" [+] Lab-Confirmed Sepsis Probability : {prob_pct:.1f}%")
    print(f" [+] Organ Dysfunction Tier           : {result['organ_stress_level']}")
    print(f" [+] Cellular Hypoxia Grade           : {result.get('cellular_hypoxia_grade')}")
    print(f" [+] Safety Guardrail Notice          : {result['safety_notice']}")
    print(f" [+] Reasoning Engine                 : {result.get('llm_source')}")
    print("-" * 65)
    print(" [+] Abnormal Blood Biomarkers Identified:")
    for flag in result["abnormal_biomarkers"]:
        print(f"     * {flag}")
    if result.get("stat_orders_recommended"):
        print(" [+] Immediate Diagnostic Escalations Required:")
        for order in result["stat_orders_recommended"]:
            print(f"     ! {order}")
    print("-" * 65)
    print(" [+] Clinical Pathology Reasoning:")
    print(f"     \"{result.get('pathology_summary')}\"")
    print("-" * 65)
    print(" [+] Top SHAP Feature Contributions:")
    for feat, val in list(result['shap_contributions'].items())[:4]:
        direction = "↑ Risk" if val > 0 else "↓ Risk"
        print(f"     {'+'if val > 0 else ''}{val:.4f}  {feat}  ({direction})")
    print("=" * 65 + "\n")
