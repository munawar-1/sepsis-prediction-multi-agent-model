# Model 2: Lab & Pathology Agent (Organ Dysfunction & Hypoxia)

## 1. Clinical Purpose
Evaluates **cellular hypoxia, metabolic acidosis, and multi-organ dysfunction** (SOFA score components) to corroborate or challenge hemodynamic deterioration signals from the Vitals Agent.

It focuses on intermittent blood pathology panels (arterial blood gases, complete blood count, metabolic panel, renal & liver function).

---

## 2. Dealing with Clinical Lab Sparsity (PhysioNet Reality)
In an ICU, lab tests are drawn only every 6–24 hours. Over 85% of hourly rows in raw ICU data have empty lab values.
* **Corroboration Mode (Labs < 4h old):** The model assesses active lactic acidosis, leukocytosis, and thrombocytopenia.
* **STAT Recommendation Mode (Vitals Alert + Missing/Stale Labs):** If vitals show acute deterioration but labs are older than 4 hours, this agent generates an immediate **STAT Lab Order Recommendation** (Serum Lactate, ABG, Blood Cultures) per Martha's Rule / Rory Staunton clinical protocols.

---

## 3. Required Features for Model 2
1. **`Lactate`** (mmol/L): Hall-mark of cellular hypoxia & septic shock (> 2.0 mmol/L warning, > 4.0 mmol/L severe)
2. **`WBC`** (White Blood Cell count, $10^3/\mu\text{L}$): Leukocytosis (> 12.0) or leukopenia (< 4.0)
3. **`Creatinine`** (mg/dL): Acute Kidney Injury (AKI) marker (SOFA renal component)
4. **`Platelets`** ($10^3/\mu\text{L}$): Sepsis-induced coagulopathy (< 100 thrombocytopenia)
5. **`BUN`** (Blood Urea Nitrogen, mg/dL): Uremic retention & dehydration
6. **`Glucose`** (mg/dL): Stress-induced hyperglycemia / hypoglycemia
7. **`pH`**: Acid-base status (< 7.35 indicates acidemia)
8. **`PaCO2`** / **`BaseExcess`**: Respiratory vs. metabolic acidosis discrimination
9. **`Lab_Age_Hours`**: Time elapsed since last blood draw (ensures the model knows whether data is fresh or stale)

---

## 4. Folder Structure
```
models/labs_agent/
├── README.md               # Clinical specification
├── dataset/                # Cleaned lab records (with Last-Observation-Carried-Forward + age)
├── artifacts/              # Serialized model (.pkl) & imputation scalers
└── src/
    ├── __init__.py
    ├── feature_engineering.py  # Calculates lab staleness, organ SOFA delta, imputation
    ├── train.py                # Trains Random Forest / LightGBM lab model
    ├── predictor.py            # Computes organ stress probability + STAT lab trigger
    └── reasoning_agent.py      # LLM clinical pathology explanation
```
