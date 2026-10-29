# Model 4: Triage Orchestrator & HITL Gatekeeper

## 1. Clinical Purpose
Model 4 is the **Meta-Ensemble & Human-in-the-Loop (HITL) Gatekeeper**:
1. It ingests the evaluations from the 3 specialized clinical agents:
   * **$P_{\text{vitals}}$** (from Model 1: Vitals Agent)
   * **$P_{\text{labs}}$** (from Model 2: Labs Agent)
   * **$\text{Discount}_D$** (from Model 3: Skeptic Agent)
2. Runs a calibrated **Ensemble Model** to calculate the final composite sepsis probability.
3. Classifies the patient into one of three **Clinical Urgency Tiers**:
   * **`LOW`**: Hemodynamically stable, routine monitoring.
   * **`MODERATE` (Subclinical Warning):** Creeping vitals or uncorroborated shock. Triggers STAT diagnostic bundle (Serum Lactate, Blood Cultures, Q15m vitals).
   * **`CRITICAL_SEPSIS`:** Impending or active septic shock. Triggers Surviving Sepsis Campaign (SSC) **1-Hour Clinical Bundle**.
4. Dispatches the explainable evidence chain to the **React Clinical Flight Deck** and triggers **DPDP-masked email notifications** requiring physician authorization (`[Approve Bundle]` or `[Override with Reason]`).

---

## 2. Mathematical Consensus Formula
The Meta-Ensemble uses a logistic calibration:
$$P_{\text{sepsis}} = \sigma \left( w_1 \cdot P_{\text{vitals}} + w_2 \cdot P_{\text{labs}} - w_3 \cdot \text{Discount}_D + w_4 \cdot \text{Shock\_Index} \right)$$
* If Labs are missing, the model dynamically shifts weight to vitals dynamics and flags the absence of laboratory corroboration.
* If Skeptic flags a high discount (e.g. Albuterol confounder), the alarm threshold is elevated to prevent alert fatigue.

---

## 3. Surviving Sepsis Campaign (Sepsis-3) 1-Hour Action Bundle
When `CRITICAL_SEPSIS` is flagged, the Orchestrator generates a ranked clinical order bundle:
1. **STAT Serum Lactate** (re-measure within 2-4 hours if initial > 2.0 mmol/L)
2. **Blood Cultures prior to antibiotics** (Aerobic & Anaerobic bottles x 2 sites)
3. **Broad-Spectrum IV Antimicrobial Therapy** (Empiric coverage within 1 hour)
4. **Rapid IV Crystalloid Infusion** ($30\text{ mL/kg}$ for hypotension or Lactate $\ge 4.0\text{ mmol/L}$)
5. **Vasopressor Support** (Norepinephrine titration to maintain $\text{MAP} \ge 65\text{ mmHg}$)

---

## 4. Folder Structure
```
models/triage_orchestrator/
├── README.md               # Clinical specification & Sepsis-3 1-Hour Bundle guide
├── artifacts/              # Serialized meta-ensemble model (.pkl / weights)
└── src/
    ├── __init__.py
    ├── ensemble_model.py   # Meta-classifier fusing Agent 1, 2, 3 outputs
    ├── train.py            # Calibrates weights w1, w2, w3 on validation cohort
    ├── orchestrator.py     # End-to-end multi-agent execution pipeline
    └── hitl_recommender.py # Generates ranked Sepsis-3 bundle & audit records
```
