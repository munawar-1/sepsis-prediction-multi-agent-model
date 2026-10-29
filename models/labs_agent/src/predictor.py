"""
Model 2 (Labs Agent): Predictor & Pathology Engine
Evaluates blood pathology and organ dysfunction biomarkers:
1. Sepsis & Organ Stress Probability
2. Freshness / Missingness Status (STAT Lab Draw Escalation)
3. Cellular Hypoxia & Organ Dysfunction Drivers (SOFA criteria)
"""

import os
import joblib
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "artifacts", "labs_rf_model.pkl")

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
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        else:
            raise FileNotFoundError(f"Model not found at: {self.model_path}. Run train.py first.")

    def predict(self, labs_dict: dict) -> dict:
        """
        Input: Dictionary of blood pathology e.g. {'Lactate': 3.4, 'WBC': 16.2, 'Creatinine': 1.8, 'Platelets': 120}
        Output: Prediction dictionary with probability, organ stress status, and STAT lab triggers.
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

        return {
            "labs_risk_probability": round(prob, 4),
            "organ_stress_level": stress_level,
            "stat_lab_draws_required": stat_orders,
            "abnormal_biomarkers": abnormal_flags,
            "labs_snapshot": {k: labs_dict.get(k) for k in TRAIN_MEDIANS}
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
    print(f" [+] Lab-Confirmed Sepsis Probability : {prob_pct:.1f}%")
    print(f" [+] Organ Dysfunction Tier           : {result['organ_stress_level']}")
    print("-" * 60)
    print(" [+] Abnormal Blood Biomarkers Identified:")
    for flag in result["abnormal_biomarkers"]:
        print(f"     * {flag}")
    if result["stat_lab_draws_required"]:
        print(" [+] Immediate Diagnostic Escalations Required:")
        for order in result["stat_lab_draws_required"]:
            print(f"     ! {order}")
    print("=" * 60 + "\n")
