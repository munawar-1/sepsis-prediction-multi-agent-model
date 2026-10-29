# Aegis-ICU: Neuro-Symbolic Multi-Agent Clinical Deterioration & Alert Fatigue Intelligence

[![Domain](https://img.shields.io/badge/Domain-Agentic%20AI%20in%20Healthcare-blue.svg)](#)
[![Standards](https://img.shields.io/badge/Standard-HL7%20FHIR%20R4-green.svg)](#)
[![Compliance](https://img.shields.io/badge/Compliance-India%20DPDP%20Act%202023-orange.svg)](#)
[![Dataset](https://img.shields.io/badge/Dataset-PhysioNet%202019%20ICU%20Sepsis-purple.svg)](#)

---

## 1. Executive Summary & Clinical Grounding

Aegis-ICU is an industry-grade, neuro-symbolic multi-agent clinical decision support system designed to solve two lethal failures in modern Intensive Care Units:

1. **Late Recognition of Deterioration (Martha's Rule / Rory Staunton cases):** Fixed rule scorecards (NEWS2) miss insidious subclinical sepsis because vitals (like SBP) stay temporarily compensated while heart rate and lactate creep upward. Aegis-ICU's predictive agents detect this trajectory **4 to 6 hours before septic shock**.
2. **Fatal ICU Alert Fatigue (MGH Telemetry Incident):** Overwhelmed nurses mute monitors due to 85–95% false alarms caused by benign drug reactions (e.g. Albuterol-induced tachycardia) or sensor motion. Aegis-ICU's Skeptic Agent discounts false positives by cross-referencing electronic health records.

---

## 2. Complete Monorepo Folder Structure

```
OpenQuest/ (Aegis-ICU)
├── data/
│   ├── raw/                       # External PhysioNet ICU files (.psv)
│   ├── processed/                 # Cleaned datasets with 0 NaNs
│   ├── fhir_resources/            # HL7 FHIR R4 JSON bundles (Patient, Condition, Meds)
│   └── replay_cases/              # Curated hour-by-hour patient cases for real-time replay
│
├── models/                        # The 4 Predictive ML Models & Reasoning Agents
│   ├── vitals_agent/              # MODEL 1: Telemetry & Hemodynamic Sepsis Prediction
│   │   ├── README.md              # Clinical specification & feature formulas
│   │   ├── dataset/               # Clean vitals features (Shock Index, Deltas, NEWS2)
│   │   ├── artifacts/             # Trained vitals_rf_model.pkl
│   │   └── src/
│   │       ├── feature_engineering.py
│   │       ├── train.py
│   │       ├── predictor.py
│   │       └── reasoning_agent.py
│   │
│   ├── labs_agent/                # MODEL 2: Pathology & Organ Dysfunction (SOFA)
│   │   ├── README.md              # Lab sparsity handling & STAT escalation logic
│   │   ├── dataset/               # Lab records with freshness indicators
│   │   ├── artifacts/             # Trained labs_rf_model.pkl
│   │   └── src/
│   │       ├── feature_engineering.py
│   │       ├── train.py
│   │       ├── predictor.py
│   │       └── reasoning_agent.py
│   │
│   ├── skeptic_agent/             # MODEL 3: False Alarm & Artifact Discrimination
│   │   ├── README.md              # MGH alert fatigue grounding & confounder matrix
│   │   ├── dataset/               # Medication correlation benchmarks
│   │   ├── artifacts/             # Trained skeptic_rf_model.pkl
│   │   └── src/
│   │       ├── feature_engineering.py
│   │       ├── train.py
│   │       ├── predictor.py
│   │       └── reasoning_agent.py
│   │
│   └── triage_orchestrator/       # MODEL 4: Composite Consensus & Sepsis-3 Gatekeeper
│       ├── README.md              # Calibrated consensus formula & SSC 1-Hour Bundle
│       ├── artifacts/             # Serialized meta-ensemble weights
│       └── src/
│           ├── ensemble_model.py  # Mathematical multi-modal calibration
│           ├── train.py           # Calibration script
│           ├── orchestrator.py    # Multi-agent execution pipeline
│           └── hitl_recommender.py# Ranked Sepsis-3 bundle action recommender
│
├── ai_service/                    # FastAPI Microservice (Python ML Inference Engine)
│   ├── requirements.txt
│   └── app/
│       ├── main.py                # FastAPI entrypoint
│       ├── schemas/               # Pydantic schemas (FHIR-compliant, strictly typed)
│       └── api/v1/endpoints.py    # POST /evaluate-patient-state
│
├── backend/                       # Java Spring Boot 3.x Enterprise Clinical Core
│   ├── pom.xml                    # HAPI FHIR, JPA, Flyway, JavaMailSender
│   └── src/main/
│       ├── java/com/aegis/
│       │   ├── AegisApplication.java
│       │   ├── controller/        # HITL Decision Controller (/hitl/decision)
│       │   └── model/             # JPA Entities (HitlAuditLog, TelemetryTicks)
│       └── resources/
│           ├── application.yml
│           └── db/migration/      # Flyway SQL (Immutable audit table)
│
├── frontend/                      # React Clinical Flight Deck (Vite UI)
│   ├── package.json
│   └── src/
│       ├── App.jsx                # Bedside Telemetry Strip + Evidence + HITL Modal
│       └── components/
│
└── download_sepsis_csv.py         # Automated PhysioNet dataset ingestion tool
```

---

## 3. Overview of the 4 Models Being Trained

| Model | Agent Name | Core Inputs | Target Output | Clinical Objective |
| :--- | :--- | :--- | :--- | :--- |
| **Model 1** | **Vitals Agent** | `HR`, `SBP`, `MAP`, `Resp`, `O2Sat`, `Temp`, `Shock_Index`, $\Delta\text{HR}_{3h}$, `NEWS2` | $P_{\text{vitals}} \in [0, 1]$ | Detects subclinical shock 4–6h early before blood pressure decompensates. |
| **Model 2** | **Labs Agent** | `Lactate`, `WBC`, `Creatinine`, `Platelets`, `BUN`, `pH`, `Lab_Age_Hours` | $P_{\text{labs}} \in [0, 1]$ + `STAT_ORDER` | Evaluates cellular hypoxia & organ stress; triggers STAT lab draws if stale. |
| **Model 3** | **Skeptic Agent** | Active EHR Meds (`Albuterol`), $\frac{\Delta\text{HR}}{\Delta\text{Resp}}$, Sensor noise | Discount $D \in [0, 1]$ | Filters false alarms from drug reactions and motion artifacts (combats alert fatigue). |
| **Model 4** | **Triage Orchestrator** | Fused outputs from Models 1, 2, 3 | Composite Risk + Urgency Tier + Sepsis-3 Bundle | Calibrates consensus and enforces mandatory Human-in-the-Loop review. |

---

## 4. Human-in-the-Loop (HITL) & Compliance

* **Mandatory Override Rationale:** Clinicians reviewing an alert on the React Flight Deck can `[Approve]` the Sepsis-3 bundle or `[Override]`. If overridden, the system **mandates** a written clinical explanation.
* **Tamper-Evident Audit Trail:** Every decision, timestamp, clinician ID, and rationale is stored with a cryptographic SHA-256 signature in MySQL (`hitl_audit_log` table).
* **India DPDP Act 2023 Compliance:** Notifications dispatched via `JavaMailSender` mask all PII (patient name, Aadhaar/ABHA ID). Messages carry only de-identified bed tokens (e.g. `ICU-BED-04`), with zero patient medical records exposed in transit.
