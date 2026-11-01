"""
Model 2 (Labs Agent): Predictor & Pathology Engine
Evaluates blood pathology and organ dysfunction biomarkers:
1. Sepsis & Organ Stress Probability
2. Freshness / Missingness Status (STAT Lab Draw Escalation)
3. Cellular Hypoxia & Organ Dysfunction Drivers (SOFA criteria)
4. SHAP-based per-prediction feature contributions
5. Structured Evidence Report adhering to Martha's Rule
"""

import os
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")
from datetime import datetime, timezone
import joblib
import numpy as np
import pandas as pd
import shap
from models.labs_agent.src.reasoning_agent import LabsReasoningAgent

MODEL_PATH = os.path.join(BASE_DIR, "artifacts", "labs_rf_model.pkl")
SHAP_EXPLAINER_PATH = os.path.join(BASE_DIR, "artifacts", "labs_shap_explainer.pkl")

# Fitted medians from training split
TRAIN_MEDIANS = {
    "Lactate": 1.8,
    "WBC": 10.8,
    "Creatinine": 0.9,
    "Platelets": 180.0
}

class LabsPredictor:
    def __init__(self, model_path=MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.shap_explainer = None
        self.reasoning_agent = LabsReasoningAgent()
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        else:
            raise FileNotFoundError(f"Model not found at: {self.model_path}. Run train.py first.")

        # Load pre-computed SHAP TreeExplainer (created during training)
        if os.path.exists(SHAP_EXPLAINER_PATH):
            self.shap_explainer = joblib.load(SHAP_EXPLAINER_PATH)
        else:
            # Fallback: create explainer on-the-fly from the model
            self.shap_explainer = shap.TreeExplainer(self.model)

    def _compute_shap_contributions(self, df_row: pd.DataFrame) -> dict:
        """
        Compute per-prediction SHAP values explaining *why* this patient
        received this particular organ stress score.
        Returns a dict of {feature_name: shap_value} sorted by |contribution|.
        """
        shap_values = self.shap_explainer.shap_values(df_row)

        # For binary classification: extract positive-class SHAP values
        if isinstance(shap_values, list):
            sv = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        else:
            shap_arr = np.asarray(shap_values)
            if shap_arr.ndim == 3 and shap_arr.shape[-1] >= 2:
                sv = shap_arr[0, :, 1]
            elif shap_arr.ndim == 2:
                sv = shap_arr[0]
            else:
                sv = shap_arr.flatten()

        feature_names = list(df_row.columns)
        contributions = dict(zip(feature_names, [float(v) for v in sv]))
        # Sort by absolute contribution (most impactful first)
        sorted_contributions = dict(
            sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)
        )
        return sorted_contributions

    def predict(self, labs_dict: dict) -> dict:
        """
        Input: Dictionary of blood pathology e.g. {'Lactate': 3.4, 'WBC': 16.2, 'Creatinine': 1.8, 'Platelets': 120}
        Output: Prediction dictionary with probability, organ stress status, STAT lab triggers, and structured report.
        """
        features = {}
        missing_count = 0
        stat_orders = []
        abnormal_flags = []

        # 1. Feature extraction with missingness tracking
        for key, default_val in TRAIN_MEDIANS.items():
            val = labs_dict.get(key)
            if val is None or np.isnan(val):
                features[key] = default_val
                features[f"{key}_was_missing"] = 1
                missing_count += 1
            else:
                features[key] = float(val)
                features[f"{key}_was_missing"] = 0

        # 2. Align feature names with model
        feature_order = list(self.model.feature_names_in_)
        df_row = pd.DataFrame([features])[feature_order]
        prob = float(self.model.predict_proba(df_row)[0, 1])

        # 3. Clinical Pathology Rules (Surviving Sepsis Campaign / SOFA)
        lactate = features["Lactate"]
        if features["Lactate_was_missing"] == 1:
            stat_orders.append("STAT Blood Lactate (Martha's Rule: Uncorroborated Vitals Strain)")
        elif lactate >= 4.0:
            abnormal_flags.append(f"Severe Lactic Acidosis: {lactate:.1f} mmol/L (Severe Hypoxia / Septic Shock)")
        elif lactate >= 2.0:
            abnormal_flags.append(f"Elevated Lactate: {lactate:.1f} mmol/L (Metabolic Stress Warning)")

        wbc = features["WBC"]
        if features["WBC_was_missing"] == 1:
            stat_orders.append("STAT Complete Blood Count (CBC) with differential")
        else:
            if wbc >= 12.0:
                abnormal_flags.append(f"Leukocytosis: WBC {wbc:.1f} x10^3/uL (Active Systemic Infection)")
            elif wbc <= 4.0:
                abnormal_flags.append(f"Leukopenia: WBC {wbc:.1f} x10^3/uL (Severe Immunosuppressive Sepsis)")

        platelets = features["Platelets"]
        if features["Platelets_was_missing"] == 0 and platelets < 100.0:
            abnormal_flags.append(f"Thrombocytopenia: Platelets {platelets:.0f} x10^3/uL (Sepsis Coagulopathy)")

        creatinine = features["Creatinine"]
        if features["Creatinine_was_missing"] == 0 and creatinine >= 1.6:
            abnormal_flags.append(f"Acute Kidney Injury (AKI): Creatinine {creatinine:.2f} mg/dL")

        # 4. Organ Stress Tiering
        if lactate >= 4.0 or (platelets < 50.0 and features["Platelets_was_missing"] == 0):
            stress_level = "SEVERE_ORGAN_DYSFUNCTION"
        elif len(abnormal_flags) >= 2 or lactate >= 2.0:
            stress_level = "MODERATE_HYPOXIA"
        elif missing_count >= 3:
            stress_level = "UNASSESSED_MISSING_LABS"
        else:
            stress_level = "NORMAL_HOMEOSTASIS"

        shap_contribs = self._compute_shap_contributions(df_row)

        raw_result = {
            "labs_risk_probability": round(prob, 4),
            "organ_stress_level": stress_level,
            "stat_lab_draws_required": stat_orders,
            "abnormal_biomarkers": abnormal_flags,
            "shap_contributions": shap_contribs,
            "labs_snapshot": {k: labs_dict.get(k) for k in TRAIN_MEDIANS}
        }

        # 5. Synthesize structured report via reasoning agent
        evidence_report = self.reasoning_agent.explain(raw_result)

        return {
            "agent_name": "Labs Agent",
            "timestamp": evidence_report.timestamp,
            "confidence": evidence_report.confidence,
            "organ_stress_level": evidence_report.organ_stress_level,
            "labs_risk_probability": evidence_report.lab_probability,
            "freshness_status": evidence_report.freshness_status,
            "safety_notice": evidence_report.safety_notice,
            "stat_lab_draws_required": evidence_report.stat_orders_recommended,
            "abnormal_biomarkers": evidence_report.abnormal_biomarkers,
            "pathology_summary": evidence_report.pathology_summary,
            "shap_contributions": evidence_report.shap_contributions,
            "labs_snapshot": evidence_report.labs_snapshot
        }

if __name__ == "__main__":
    predictor = LabsPredictor()

    # Test Case: Real Sepsis Pathology (Rory Staunton / Martha Mills profile)
    # Lactic acidosis (3.4 mmol/L) + Leukocytosis (17.5) + Elevated Creatinine
    sepsis_labs = {
        "Lactate": 3.4,
        "WBC": 17.5,
        "Creatinine": 1.7,
        "Platelets": 95.0
    }
    result = predictor.predict(sepsis_labs)
    prob_pct = result["labs_risk_probability"] * 100

    print("\n" + "=" * 60)
    print("       AEGIS-ICU: MODEL 2 (LABS AGENT) INFERENCE")
    print("=" * 60)
    print(f" [+] Agent Name                       : {result['agent_name']}")
    print(f" [+] Evaluation Timestamp             : {result['timestamp']}")
    print(f" [+] Agent Confidence                 : {result['confidence'] * 100:.0f}%")
    print(f" [+] Freshness Status                 : {result['freshness_status']}")
    print(f" [+] Lab-Confirmed Sepsis Probability : {prob_pct:.1f}%")
    print(f" [+] Organ Dysfunction Tier           : {result['organ_stress_level']}")
    print(f" [+] Safety Guardrail Notice          : {result['safety_notice']}")
    print("-" * 60)
    print(" [+] Abnormal Blood Biomarkers Identified:")
    for flag in result["abnormal_biomarkers"]:
        print(f"     * {flag}")
    if result["stat_lab_draws_required"]:
        print(" [+] Immediate Diagnostic Escalations Required:")
        for order in result["stat_lab_draws_required"]:
            print(f"     ! {order}")
    print("-" * 60)
    print(f" [+] Pathology Summary:\n     {result['pathology_summary']}")
    print("-" * 60)
    print(" [+] SHAP Feature Contributions (per-prediction):")
    for feat, val in result['shap_contributions'].items():
        direction = "(+) Increases Risk" if val > 0 else "(-) Decreases Risk"
        print(f"     {'+'if val > 0 else ''}{val:.4f}  {feat}  {direction}")
    print("=" * 60 + "\n")
