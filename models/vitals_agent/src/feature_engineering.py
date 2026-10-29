"""
Model 1 (Vitals Agent): Feature Engineering & Preprocessing Pipeline
Transforms raw ICU telemetry into a clean dataset with ZERO NaNs and computes
high-value clinical biomarkers (Shock Index, Delta trends, NEWS2).
"""

import os
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "dataset")
OUTPUT_PATH = os.path.join(DATA_DIR, "vitals_features.csv")

CLINICAL_DEFAULTS = {
    "HR": 75.0, "SBP": 120.0, "DBP": 75.0, "MAP": 85.0,
    "Resp": 16.0, "O2Sat": 98.0, "Temp": 37.0
}

def calculate_news2(row):
    score = 0
    resp = row["Resp"]
    if resp <= 8 or resp >= 25: score += 3
    elif resp >= 21: score += 2
    elif 9 <= resp <= 11: score += 1
    
    o2 = row["O2Sat"]
    if o2 <= 91: score += 3
    elif o2 in [92, 93]: score += 2
    elif o2 in [94, 95]: score += 1
        
    sbp = row["SBP"]
    if sbp <= 90 or sbp >= 220: score += 3
    elif 91 <= sbp <= 100: score += 2
    elif 101 <= sbp <= 110: score += 1
        
    hr = row["HR"]
    if hr <= 40 or hr >= 131: score += 3
    elif 111 <= hr <= 130: score += 2
    elif (41 <= hr <= 50) or (91 <= hr <= 110): score += 1
        
    temp = row["Temp"]
    if temp <= 35.0: score += 3
    elif temp >= 39.1: score += 2
    elif (35.1 <= temp <= 36.0) or (38.1 <= temp <= 39.0): score += 1
        
    return score

def clean_vitals_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    vitals_cols = ["HR", "O2Sat", "Temp", "SBP", "MAP", "DBP", "Resp"]
    keep_cols = [c for c in ["Patient_ID", "ICULOS"] + vitals_cols + ["SepsisLabel"] if c in df.columns]
    sub_df = df[keep_cols].copy()

    pid_col = "Patient_ID" if "Patient_ID" in sub_df.columns else None

    if pid_col:
        cleaned_groups = []
        for pid, grp in sub_df.groupby(pid_col, sort=False):
            grp = grp.sort_values("ICULOS") if "ICULOS" in grp.columns else grp
            grp[vitals_cols] = grp[vitals_cols].ffill().bfill()
            for col, default_val in CLINICAL_DEFAULTS.items():
                if col in grp.columns:
                    grp[col] = grp[col].fillna(default_val)
            
            grp["Shock_Index"] = grp["HR"] / np.maximum(grp["SBP"], 1.0)
            grp["Pulse_Pressure"] = grp["SBP"] - grp["DBP"]
            grp["HR_Delta_3h"] = grp["HR"] - grp["HR"].shift(3).fillna(grp["HR"])
            grp["Resp_Delta_3h"] = grp["Resp"] - grp["Resp"].shift(3).fillna(grp["Resp"])
            cleaned_groups.append(grp)
        clean_df = pd.concat(cleaned_groups, ignore_index=True)
    else:
        clean_df = sub_df.ffill().bfill()
        for col, default_val in CLINICAL_DEFAULTS.items():
            if col in clean_df.columns:
                clean_df[col] = clean_df[col].fillna(default_val)
        clean_df["Shock_Index"] = clean_df["HR"] / np.maximum(clean_df["SBP"], 1.0)
        clean_df["Pulse_Pressure"] = clean_df["SBP"] - clean_df["DBP"]
        clean_df["HR_Delta_3h"] = 0.0
        clean_df["Resp_Delta_3h"] = 0.0

    clean_df["NEWS2_Score"] = clean_df.apply(calculate_news2, axis=1)
    return clean_df
