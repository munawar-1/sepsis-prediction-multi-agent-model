"""
Model 1 (Vitals Agent): Predictor & Inference Engine
Loads vitals_rf_model.pkl and evaluates incoming hourly telemetry.
Outputs:
1. Sepsis Risk Probability (0.0 to 1.0)
2. Classical NEWS2 Score comparison
3. Top Mathematical Risk Drivers (Shock Index, Tachypnea, etc.)
4. SHAP-based per-prediction feature contributions
"""

import os
os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")
import joblib
import numpy as np
import pandas as pd
import shap

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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
    score = 0
    resp = vitals.get("Resp", 18.0)
    if resp <= 8 or resp >= 25: score += 3
    elif resp >= 21: score += 2
    elif 9 <= resp <= 11: score += 1
    
    o2 = vitals.get("O2Sat", 98.0)
    if o2 <= 91: score += 3
    elif o2 in [92, 93]: score += 2
    elif o2 in [94, 95]: score += 1
        
    sbp = vitals.get("SBP", 118.0)
    if sbp <= 90 or sbp >= 220: score += 3
    elif 91 <= sbp <= 100: score += 2
    elif 101 <= sbp <= 110: score += 1
        
    hr = vitals.get("HR", 84.0)
    if hr <= 40 or hr >= 131: score += 3
    elif 111 <= hr <= 130: score += 2
    elif (41 <= hr <= 50) or (91 <= hr <= 110): score += 1
        
    temp = vitals.get("Temp", 37.06)
    if temp <= 35.0: score += 3
    elif temp >= 39.1: score += 2
    elif (35.1 <= temp <= 36.0) or (38.1 <= temp <= 39.0): score += 1
        
    return score

class VitalsPredictor:
    def __init__(self, model_path=MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.shap_explainer = None
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
        received this particular risk score.
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

    def predict(self, vitals_dict: dict) -> dict:
        """
        Input: Dictionary of vital signs e.g. {'HR': 105, 'SBP': 102, 'Resp': 22, ...}
        Output: Prediction dictionary with risk probability, NEWS2, and risk drivers.
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

        return {
            "vitals_risk_probability": round(prob, 4),
            "news2_score": news2_score,
            "shock_index": round(shock_index, 2),
            "discrepancy_detected": discrepancy,
            "risk_drivers": drivers,
            "shap_contributions": shap_contributions,
            "telemetry_snapshot": {k: features[k] for k in TRAIN_MEDIANS}
        }

if __name__ == "__main__":
    predictor = VitalsPredictor()
    
    # Test Case 1: Rory Staunton / Martha Mills scenario (Compensated early sepsis)
    # HR is high (106), Resp is elevated (23), but SBP looks normal (112). NEWS2 is low!
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
    
    # Clinical risk categorization relative to 2% baseline ICU rate
    if prob_pct >= 50.0:
        risk_tier = "CRITICAL SEPSIS RISK (25x baseline)"
    elif prob_pct >= 30.0:
        risk_tier = "ELEVATED RISK - SUBCLINICAL (15x-20x baseline)"
    else:
        risk_tier = "LOW / ROUTINE RISK"

    print("\n" + "=" * 60)
    print("      AEGIS-ICU: MODEL 1 (VITALS AGENT) INFERENCE")
    print("=" * 60)
    print(f" [+] ML Sepsis Probability : {prob_pct:.1f}%")
    print(f" [+] Clinical Risk Tier    : {risk_tier}")
    print(f" [+] Shock Index (HR/SBP)  : {result['shock_index']} (Normal: < 0.70)")
    print(f" [+] Traditional NEWS2     : {result['news2_score']} / 20 (Classified as Low Risk)")
    print(f" [+] Discrepancy Caught    : {result['discrepancy_detected']}")
    print("-" * 60)
    print(" [+] Key Physiological Risk Drivers:")
    for driver in result['risk_drivers']:
        print(f"     * {driver}")
    print("-" * 60)
    print(" [+] SHAP Feature Contributions (per-prediction):")
    for feat, val in result['shap_contributions'].items():
        direction = "↑ Risk" if val > 0 else "↓ Risk"
        print(f"     {'+'if val > 0 else ''}{val:.4f}  {feat}  ({direction})")
    print("=" * 60 + "\n")
