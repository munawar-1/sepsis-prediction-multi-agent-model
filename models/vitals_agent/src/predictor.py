"""
Model 1 (Vitals Agent): Predictor & Inference Engine
Loads vitals_rf_model.pkl and evaluates incoming hourly telemetry.
Outputs:
1. Sepsis Risk Probability (0.0 to 1.0)
2. Classical NEWS2 Score comparison
3. Top Mathematical Risk Drivers (Shock Index, Tachypnea, etc.)
4. SHAP-based per-prediction feature contributions
5. Structured Evidence Report with Timestamp and Confidence Score
6. LLM-powered physiological reasoning explaining the exact numbers
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
    from models.vitals_agent.src.reasoning_agent import VitalsReasoningAgent, VitalsEvidenceReport
except ImportError:
    from reasoning_agent import VitalsReasoningAgent, VitalsEvidenceReport

MODEL_PATH = os.path.join(BASE_DIR, "artifacts", "vitals_rf_model.pkl")
SHAP_EXPLAINER_PATH = os.path.join(BASE_DIR, "artifacts", "vitals_shap_explainer.pkl")

# Fitted medians from training cohort
TRAIN_MEDIANS = {
    "HR": 84.0,
    "SBP": 118.0,
    "MAP": 77.0,
    "Resp": 18.0,
    "O2Sat": 98.0,
    "Temp": 37.06
}

def calculate_news2(vitals: dict) -> int:
    """Calculates classical NEWS2 component score for physiological vitals."""
    score = 0
    resp = vitals.get("Resp")
    if resp is not None and not np.isnan(resp):
        if resp <= 8 or resp >= 25:
            score += 3
        elif 21 <= resp <= 24:
            score += 2
        elif 9 <= resp <= 11:
            score += 1

    spo2 = vitals.get("O2Sat")
    if spo2 is not None and not np.isnan(spo2):
        if spo2 <= 91:
            score += 3
        elif 92 <= spo2 <= 93:
            score += 2
        elif 94 <= spo2 <= 95:
            score += 1

    sbp = vitals.get("SBP")
    if sbp is not None and not np.isnan(sbp):
        if sbp <= 90 or sbp >= 220:
            score += 3
        elif 91 <= sbp <= 100:
            score += 2
        elif 101 <= sbp <= 110:
            score += 1

    hr = vitals.get("HR")
    if hr is not None and not np.isnan(hr):
        if hr <= 40 or hr >= 131:
            score += 3
        elif 111 <= hr <= 130:
            score += 2
        elif 41 <= hr <= 50 or 91 <= hr <= 110:
            score += 1

    temp = vitals.get("Temp")
    if temp is not None and not np.isnan(temp):
        if temp <= 35.0:
            score += 3
        elif temp >= 39.1:
            score += 2
        elif 35.1 <= temp <= 36.0 or 38.1 <= temp <= 39.0:
            score += 1

    return score

class VitalsPredictor:
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
        self.reasoning_agent = VitalsReasoningAgent(
            gemini_api_key=gemini_api_key,
            openai_api_key=openai_api_key,
            ollama_base_url=ollama_base_url,
            ollama_model=ollama_model
        )

    def load_model(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        else:
            raise FileNotFoundError(f"Vitals RF Model not found at {self.model_path}. Train it first.")
        
        if os.path.exists(SHAP_EXPLAINER_PATH):
            self.shap_explainer = joblib.load(SHAP_EXPLAINER_PATH)
        else:
            # Fallback: create TreeExplainer on the fly
            self.shap_explainer = shap.TreeExplainer(self.model)

    def _compute_shap_contributions(self, df_row: pd.DataFrame) -> dict:
        """
        Computes SHAP value contributions for a single inference row.
        Returns a sorted dict of {feature: shap_value} for the Sepsis positive class.
        """
        raw_shap = self.shap_explainer.shap_values(df_row)
        # Handle format differences between shap versions:
        # Some return [array_class0, array_class1], others return an ndarray of shape (1, n_features, 2)
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
        # Sort by absolute impact descending
        sorted_contributions = dict(
            sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)
        )
        return sorted_contributions

    def explain(self, vitals_result: dict) -> VitalsEvidenceReport:
        """
        Explicit reasoning method producing typed VitalsEvidenceReport.
        """
        return self.reasoning_agent.explain(vitals_result)

    def predict(self, vitals_dict: dict, generate_reasoning: bool = True) -> dict:
        """
        Input: Dictionary of vital signs e.g. {'HR': 105, 'SBP': 102, 'Resp': 22, ...}
        Output: Prediction dictionary with risk probability, NEWS2, structured findings, confidence, and timestamp.
        """
        # 1. Feature extraction with missingness handling
        features = {}
        for key, default_val in TRAIN_MEDIANS.items():
            val = vitals_dict.get(key)
            if val is None or np.isnan(val):
                features[key] = default_val
                features[f"{key}_was_missing"] = 1
            else:
                features[key] = float(val)
                features[f"{key}_was_missing"] = 0

        # 2. Derive Shock Index (HR / SBP)
        hr = features["HR"]
        sbp = max(features["SBP"], 1.0)
        shock_index = hr / sbp
        features["Shock_Index"] = shock_index

        # 3. Align feature names and order exactly with trained model
        feature_order = list(self.model.feature_names_in_)
        df_row = pd.DataFrame([features])[feature_order]
        prob = float(self.model.predict_proba(df_row)[0, 1])

        # 4. Traditional NEWS2 comparison
        news2_score = calculate_news2(vitals_dict)

        # 5. Extract top clinical risk drivers
        drivers = []
        if shock_index >= 1.0:
            drivers.append(f"Critical Occult Shock: Shock Index is {shock_index:.2f} (Normal < 0.70)")
        elif shock_index >= 0.80:
            drivers.append(f"Elevated Shock Index: {shock_index:.2f} (Occult Hypoperfusion Warning)")

        if features["Resp"] >= 22:
            drivers.append(f"Tachypnea: Respiratory Rate {features['Resp']} /min (Metabolic Acidosis Compensation)")

        if features["HR"] >= 100:
            drivers.append(f"Tachycardia: Heart Rate {features['HR']} bpm")

        if features["MAP"] < 65:
            drivers.append(f"Hypotension: MAP {features['MAP']} mmHg (< 65 threshold)")

        # Discrepancy detection: AI flags high risk while NEWS2 is still classified as low/normal (< 5)
        discrepancy = (prob >= 0.50 and news2_score < 5)

        # 6. Per-prediction SHAP feature contributions
        shap_contributions = self._compute_shap_contributions(df_row)

        raw_result = {
            "vitals_risk_probability": round(prob, 4),
            "news2_score": news2_score,
            "shock_index": round(shock_index, 2),
            "discrepancy_detected": discrepancy,
            "risk_drivers": drivers,
            "shap_contributions": shap_contributions,
            "telemetry_snapshot": {k: features[k] for k in TRAIN_MEDIANS}
        }

        # 7. Synthesize structured evidence report via reasoning agent
        evidence_report = self.reasoning_agent.explain(raw_result)

        return {
            "agent_name": evidence_report.agent_name,
            "timestamp": evidence_report.timestamp,
            "confidence": evidence_report.confidence,
            "risk_level": evidence_report.risk_level,
            "vitals_risk_probability": evidence_report.ml_probability,
            "news2_score": evidence_report.news2_score,
            "shock_index": evidence_report.shock_index,
            "discrepancy_detected": evidence_report.discrepancy_flag,
            "hemodynamic_stage": evidence_report.hemodynamic_stage,
            "risk_drivers": evidence_report.primary_drivers,
            "primary_drivers": evidence_report.primary_drivers,
            "shap_summary": evidence_report.shap_summary,
            "discrepancy_rationale": evidence_report.discrepancy_rationale,
            "clinical_explanation": evidence_report.clinical_explanation,
            "clinical_reasoning": evidence_report.clinical_explanation,
            "shap_contributions": evidence_report.shap_contributions,
            "telemetry_snapshot": evidence_report.telemetry_snapshot,
            "llm_source": evidence_report.llm_source
        }

if __name__ == "__main__":
    predictor = VitalsPredictor()
    
    # Test Case: Compensated early sepsis (Rory Staunton / Martha Mills scenario)
    sample_patient = {
        "HR": 106.0,
        "SBP": 112.0,
        "MAP": 78.0,
        "Resp": 23.0,
        "O2Sat": 96.0,
        "Temp": 38.2
    }
    result = predictor.predict(sample_patient)
    prob_pct = result['vitals_risk_probability'] * 100

    print("\n" + "=" * 65)
    print("      AEGIS-ICU: MODEL 1 (VITALS AGENT) INFERENCE & LLM REASONING")
    print("=" * 65)
    print(f" [+] Agent Name            : {result['agent_name']}")
    print(f" [+] Evaluation Timestamp  : {result['timestamp']}")
    print(f" [+] Agent Confidence      : {result['confidence'] * 100:.0f}%")
    print(f" [+] ML Sepsis Probability : {prob_pct:.1f}%")
    print(f" [+] Clinical Risk Tier    : {result['risk_level']}")
    print(f" [+] Hemodynamic Stage     : {result.get('hemodynamic_stage')}")
    print(f" [+] Shock Index (HR/SBP)  : {result['shock_index']} (Normal: < 0.70)")
    print(f" [+] Traditional NEWS2     : {result['news2_score']} / 20")
    print(f" [+] Discrepancy Caught    : {result['discrepancy_detected']}")
    print(f" [+] Reasoning Engine      : {result.get('llm_source')}")
    print("-" * 65)
    print(" [+] Discrepancy Rationale:")
    print(f"     \"{result.get('discrepancy_rationale')}\"")
    print("-" * 65)
    print(" [+] Clinical Physiological Reasoning:")
    print(f"     \"{result.get('clinical_explanation')}\"")
    print("-" * 65)
    print(" [+] Top SHAP Feature Contributions:")
    for feat, val in list(result['shap_contributions'].items())[:4]:
        direction = "↑ Risk" if val > 0 else "↓ Risk"
        print(f"     {'+'if val > 0 else ''}{val:.4f}  {feat}  ({direction})")
    print("=" * 65 + "\n")
