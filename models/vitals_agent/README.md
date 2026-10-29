# Model 1: Vitals Monitoring Agent (Hemodynamic Intelligence)

## 1. Clinical Purpose
Catches **subclinical hemodynamic deterioration** (early sepsis & septic shock) 4 to 6 hours before traditional hospital scorecards (like NEWS2) trigger alarms.

It focuses strictly on high-frequency bedside telemetry (heart rate, blood pressure, respiration, oxygen saturation, temperature) and calculated clinical indices.

---

## 2. Dealing with Clinical Missingness (Zero NaNs)
1. Drop all 30 laboratory columns completely.
2. For vitals, apply patient-level **Forward-Fill (LOCF)** and **Backward-Fill (bfill)**.
3. Impute any remaining edge cases with clinical defaults (HR=75, SBP=120, DBP=75, MAP=85, Resp=16, O2Sat=98, Temp=37.0).
4. Result: **Zero NaNs** in the training dataset.

---

## 3. Required Features for Model 1
1. **`HR`** (Heart Rate, bpm)
2. **`SBP`** (Systolic Blood Pressure, mmHg)
3. **`DBP`** (Diastolic Blood Pressure, mmHg)
4. **`MAP`** (Mean Arterial Pressure, mmHg)
5. **`Resp`** (Respiratory Rate, breaths/min)
6. **`O2Sat`** (Oxygen Saturation, %)
7. **`Temp`** (Core Body Temperature, °C)
8. **`Shock_Index`** = `HR / SBP` (> 0.8 flags occult shock even if SBP is compensated > 100)
9. **`Pulse_Pressure`** = `SBP - DBP`
10. **`HR_Delta_3h`** = $\text{HR} - \text{HR}_{3h\_ago}$
11. **`Resp_Delta_3h`** = $\text{Resp} - \text{Resp}_{3h\_ago}$
12. **`NEWS2_Score`** (National Early Warning Score 2)
13. **Target:** `SepsisLabel` (0 = Stable, 1 = Sepsis deterioration)

---

## 4. Folder Structure
```
models/vitals_agent/
├── README.md               # Clinical specification
├── dataset/                # Clean vitals features (0 NaNs)
├── artifacts/              # Serialized vitals_rf_model.pkl
└── src/
    ├── __init__.py
    ├── feature_engineering.py  # Calculates Shock Index, Deltas, NEWS2
    ├── train.py                # Trains Random Forest / XGBoost model
    ├── predictor.py            # Predicts sepsis probability + top risk drivers
    └── reasoning_agent.py      # LLM clinical explanation bridge
```
