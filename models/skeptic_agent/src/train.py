"""
Model 3 (Skeptic Agent): Training & Dataset Synthesis Script
Trains a Random Forest model on simulated & annotated ICU confounder scenarios
(Drug-induced tachycardia vs. septic shock) and serializes skeptic_rf_model.pkl.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)
os.makedirs(DATASET_DIR, exist_ok=True)

MODEL_OUTPUT_PATH = os.path.join(ARTIFACTS_DIR, "skeptic_rf_model.pkl")
DATASET_OUTPUT_PATH = os.path.join(DATASET_DIR, "skeptic_confounders_dataset.csv")


def generate_confounder_dataset(n_samples: int = 1500) -> pd.DataFrame:
    """
    Generates an annotated ICU dataset of telemetry + EHR confounders:
    - Class 1: Benign Confounder / False Alarm (e.g. Albuterol given, high HR, normal lactate, normal resp)
    - Class 0: True Sepsis / True Deterioration (high HR, elevated lactate, abnormal resp, organ stress)
    """
    np.random.seed(42)
    records = []

    for _ in range(n_samples):
        # 50% chance of receiving sympathomimetic bronchodilator / inotrope
        has_sympathomimetic = int(np.random.rand() > 0.5)
        # 20% chance of immunocompromised status
        is_immunocompromised = int(np.random.rand() > 0.8)

        if has_sympathomimetic and not is_immunocompromised and np.random.rand() > 0.35:
            # BENIGN FALSE ALARM CASE:
            # HR elevated from drug, but metabolism and respiration are benign
            hr = np.random.uniform(98.0, 135.0)
            sbp = np.random.uniform(110.0, 140.0)
            resp = np.random.uniform(14.0, 20.0)
            lactate = np.random.uniform(0.7, 1.8)
            wbc = np.random.uniform(5.0, 10.5)
            platelets = np.random.uniform(160.0, 320.0)
            vitals_risk_raw = np.random.uniform(0.60, 0.85)  # Agent 1 flagged it!
            labs_risk_raw = np.random.uniform(0.05, 0.25)    # Agent 2 is calm
            is_false_alarm = 1
        else:
            # TRUE SEPSIS OR TRUE CLINICAL STABILITY
            # If septic: elevated lactate, abnormal resp, abnormal WBC
            is_septic = np.random.rand() > 0.45
            if is_septic:
                hr = np.random.uniform(95.0, 145.0)
                sbp = np.random.uniform(75.0, 115.0)
                resp = np.random.uniform(22.0, 36.0)
                lactate = np.random.uniform(2.2, 6.5)
                wbc = np.random.choice([np.random.uniform(13.0, 28.0), np.random.uniform(2.0, 3.8)])
                platelets = np.random.uniform(40.0, 140.0)
                vitals_risk_raw = np.random.uniform(0.65, 0.95)
                labs_risk_raw = np.random.uniform(0.55, 0.95)
                is_false_alarm = 0
            else:
                # Normal healthy patient
                hr = np.random.uniform(65.0, 88.0)
                sbp = np.random.uniform(115.0, 130.0)
                resp = np.random.uniform(12.0, 18.0)
                lactate = np.random.uniform(0.8, 1.6)
                wbc = np.random.uniform(5.5, 9.5)
                platelets = np.random.uniform(180.0, 300.0)
                vitals_risk_raw = np.random.uniform(0.05, 0.30)
                labs_risk_raw = np.random.uniform(0.05, 0.25)
                is_false_alarm = 0

        shock_index = hr / max(sbp, 1.0)
        # Isolated tachycardia: HR > 95 and Resp <= 20
        isolated_tachycardia = int(hr >= 95.0 and resp <= 20.0)

        records.append({
            "has_sympathomimetic": has_sympathomimetic,
            "is_immunocompromised": is_immunocompromised,
            "HR": round(hr, 1),
            "SBP": round(sbp, 1),
            "Resp": round(resp, 1),
            "Shock_Index": round(shock_index, 2),
            "Lactate": round(lactate, 2),
            "WBC": round(wbc, 1),
            "Platelets": round(platelets, 1),
            "isolated_tachycardia": isolated_tachycardia,
            "vitals_risk_prob": round(vitals_risk_raw, 3),
            "labs_risk_prob": round(labs_risk_raw, 3),
            "is_false_alarm": is_false_alarm
        })

    df = pd.DataFrame(records)
    df.to_csv(DATASET_OUTPUT_PATH, index=False)
    return df


def train_skeptic_model():
    print(f"Generating synthetic confounder training dataset...")
    df = generate_confounder_dataset()

    feature_cols = [
        "has_sympathomimetic",
        "is_immunocompromised",
        "HR",
        "SBP",
        "Resp",
        "Shock_Index",
        "Lactate",
        "WBC",
        "Platelets",
        "isolated_tachycardia",
        "vitals_risk_prob",
        "labs_risk_prob"
    ]

    X = df[feature_cols]
    y = df["is_false_alarm"]

    split_idx = int(0.8 * len(df))
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    print("Training Random Forest Skeptic Classifier...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    y_prob = rf.predict_proba(X_test)[:, 1]

    print("\n--- MODEL 3 EVALUATION REPORT ---")
    print(classification_report(y_test, y_pred, target_names=["True Deterioration / Sepsis", "Benign False Alarm"]))
    auc = roc_auc_score(y_test, y_prob)
    print(f"ROC-AUC Score: {auc:.4f}")

    joblib.dump(rf, MODEL_OUTPUT_PATH)
    print(f"Serialized model successfully to: {MODEL_OUTPUT_PATH}")


if __name__ == "__main__":
    train_skeptic_model()
