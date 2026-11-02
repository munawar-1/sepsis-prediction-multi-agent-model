"""
Model 2 (Labs Agent): Predictor & Pathology Engine
Evaluates blood pathology and organ dysfunction biomarkers:
1. Sepsis & Organ Stress Probability
2. Freshness / Missingness Status (STAT Lab Draw Escalation)
3. Cellular Hypoxia & Organ Dysfunction Drivers (SOFA criteria)
4. SHAP-based per-prediction feature contributions
5. LLM-powered pathological reasoning explaining the biomarker numbers
"""

import os
import tempfile
os.environ.setdefault("MPLCONFIGDIR", os.path.join(tempfile.gettempdir(), "matplotlib"))
import joblib
import numpy as np
import pandas as pd
import shap
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

try:
    from models.labs_agent.src.reasoning_agent import LabsReasoningAgent, LabsEvidenceReport
except ImportError:
    from reasoning_agent import LabsReasoningAgent, LabsEvidenceReport

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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

    def explain(self, labs_result: dict) -> LabsEvidenceReport:
        """
        Explicit reasoning method producing typed LabsEvidenceReport.
        """
        return self.reasoning_agent.explain(labs_result)

    def predict(self, labs_dict: dict, generate_reasoning: bool = True) -> dict:
        """
        Input: Dictionary of blood pathology e.g. {'Lactate': 3.4, 'WBC': 16.2, 'Creatinine': 1.8, 'Platelets': 120}
        Output: Prediction dictionary with probability, organ stress status, STAT lab triggers,
                SHAP attributions, and LLM clinical pathology reasoning.
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
        if features["WBC_was_missing"] == 0:
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

        result = {
            "labs_risk_probability": round(prob, 4),
            "organ_stress_level": stress_level,
            "stat_lab_draws_required": stat_orders,
            "abnormal_biomarkers": abnormal_flags,
            "shap_contributions": self._compute_shap_contributions(df_row),
            "labs_snapshot": {k: labs_dict.get(k) for k in TRAIN_MEDIANS}
        }

        # 5. LLM Clinical Pathology Reasoning Wrap
        if generate_reasoning:
            report: LabsEvidenceReport = self.reasoning_agent.explain(result)
            result["organ_stress_level"] = report.organ_stress_level
            result["cellular_hypoxia_grade"] = report.cellular_hypoxia_grade
            result["freshness_status"] = report.freshness_status
            result["stat_orders_recommended"] = report.stat_orders_recommended
            result["abnormal_biomarkers"] = report.abnormal_biomarkers
            result["pathology_summary"] = report.pathology_summary
            result["clinical_reasoning"] = report.clinical_reasoning
            result["shap_summary"] = report.shap_summary
            result["llm_source"] = report.llm_source

        return result

if __name__ == "__main__":
    predictor = LabsPredictor()

    # Test Case: Real Sepsis Pathology (Rory Staunton / Martha Mills profile)
    sepsis_labs = {
        "Lactate": 3.4,
        "WBC": 17.5,
        "Creatinine": 1.7,
        "Platelets": 95.0
    }
    result = predictor.predict(sepsis_labs)
    prob_pct = result["labs_risk_probability"] * 100

    print("\n" + "=" * 65)
    print("       AEGIS-ICU: MODEL 2 (LABS AGENT) INFERENCE & LLM REASONING")
    print("=" * 65)
    print(f" [+] Lab-Confirmed Sepsis Probability : {prob_pct:.1f}%")
    print(f" [+] Organ Dysfunction Tier           : {result['organ_stress_level']}")
    print(f" [+] Cellular Hypoxia Grade           : {result.get('cellular_hypoxia_grade')}")
    print(f" [+] Freshness Status                 : {result.get('freshness_status')}")
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
