"""
Model 2 (Labs Agent): Training Pipeline
Trains a calibrated Random Forest model on the official PhysioNet 2019 split:
- Features: Lactate, WBC, Creatinine, Platelets + missingness indicators
- Evaluates on validation.csv (ROC-AUC, Precision, Recall, F1)
- Saves model artifact to models/labs_agent/artifacts/labs_rf_model.pkl
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    classification_report,
    confusion_matrix
)

# Project paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))
DATA_DIR = os.path.join(PROJECT_ROOT, "data", "raw")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
MODEL_OUTPUT_PATH = os.path.join(ARTIFACTS_DIR, "labs_rf_model.pkl")
METRICS_OUTPUT_PATH = os.path.join(ARTIFACTS_DIR, "labs_metrics.json")

os.makedirs(ARTIFACTS_DIR, exist_ok=True)

# Lab features defined by official dataset specification
CORE_LABS = ["Lactate", "WBC", "Creatinine", "Platelets"]

def get_labs_features(df: pd.DataFrame):
    """
    Extracts blood pathology features and missingness indicator flags.
    """
    feature_cols = []
    
    # Core labs
    for col in CORE_LABS:
        if col in df.columns:
            feature_cols.append(col)
            
    # *_was_missing indicator columns if present
    for col in CORE_LABS:
        flag_col = f"{col}_was_missing"
        if flag_col in df.columns:
            feature_cols.append(flag_col)
            
    return df[feature_cols].copy()

def train_labs_agent(data_folder=DATA_DIR):
    train_file = os.path.join(data_folder, "train.csv")
    val_file = os.path.join(data_folder, "validation.csv")
    
    # Check candidate data directories
    candidates = [
        data_folder,
        os.path.join(data_folder, "sepsis traning data"),
        os.path.join(data_folder, "sepsis training data"),
        os.path.join(BASE_DIR, "dataset")
    ]
    for c in candidates:
        if os.path.exists(os.path.join(c, "train.csv")):
            data_folder = c
            train_file = os.path.join(c, "train.csv")
            val_file = os.path.join(c, "validation.csv")
            break

    if not os.path.exists(train_file):
        print(f"[!] train.csv not found in candidate paths: {candidates}")
        return None

    print(f"[*] Loading training data from: {train_file}")
    df_train = pd.read_csv(train_file)
    print(f"[+] Loaded {len(df_train)} training rows across {df_train['patient_id'].nunique()} patients.")

    print(f"[*] Loading validation data from: {val_file}")
    df_val = pd.read_csv(val_file)
    print(f"[+] Loaded {len(df_val)} validation rows across {df_val['patient_id'].nunique()} patients.")

    # Prepare features and labels
    X_train = get_labs_features(df_train)
    y_train = df_train["SepsisLabel"].values
    
    X_val = get_labs_features(df_val)
    y_val = df_val["SepsisLabel"].values

    feature_names = list(X_train.columns)
    print(f"[*] Training Model 2 with {len(feature_names)} features: {feature_names}")

    # Train high-performance Random Forest
    print("[*] Training Random Forest model with balanced class weighting...")
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=10,
        min_samples_leaf=5,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42
    )
    rf.fit(X_train, y_train)

    # Evaluate on Validation Set
    print("[*] Evaluating on validation set...")
    val_probs = rf.predict_proba(X_val)[:, 1]
    val_preds = (val_probs >= 0.5).astype(int)

    roc_auc = roc_auc_score(y_val, val_probs)
    pr_auc = average_precision_score(y_val, val_probs)
    cm = confusion_matrix(y_val, val_preds).tolist()
    report = classification_report(y_val, val_preds, output_dict=True)

    print("\n" + "=" * 50)
    print(" MODEL 2 (LABS AGENT) EVALUATION RESULTS ")
    print("=" * 50)
    print(f"[*] Validation ROC-AUC Score: {roc_auc:.4f}")
    print(f"[*] Validation PR-AUC Score:  {pr_auc:.4f}")
    print(f"[*] Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")
    print("=" * 50 + "\n")

    # Feature Importance analysis
    importances = dict(zip(feature_names, [float(x) for x in rf.feature_importances_]))
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

    print("[*] Top Lab Organ Dysfunction Drivers:")
    for feat, imp in list(sorted_importances.items())[:5]:
        print(f"    - {feat}: {imp:.4f}")

    # Serialize Model Artifact
    joblib.dump(rf, MODEL_OUTPUT_PATH)
    print(f"[+] Model saved to: {MODEL_OUTPUT_PATH}")

    # Save Metrics & Feature Manifest
    metrics_payload = {
        "model_name": "labs_rf_model",
        "features": feature_names,
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "confusion_matrix": cm,
        "feature_importances": sorted_importances,
        "classification_report": report
    }
    with open(METRICS_OUTPUT_PATH, "w") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"[+] Metrics saved to: {METRICS_OUTPUT_PATH}")

    return rf

if __name__ == "__main__":
    train_labs_agent()
