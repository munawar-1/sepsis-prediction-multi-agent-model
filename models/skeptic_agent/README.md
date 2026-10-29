# Model 3: Skeptic & Artifact Agent (Alert Fatigue & Confounder Filter)

## 1. Clinical Purpose & The MGH Telemetry Incident
In typical ICUs, **85% to 95% of alarms are false positives** caused by benign clinical events (e.g., drug-induced tachycardia from asthma inhalers, post-op pain, shivering, or patient motion artifacts). Overwhelmed nurses mute monitors, leading to fatal alert fatigue.

Model 3 acts as the **adversarial clinical skeptic**:
* It questions whether elevated vitals are explained by **benign confounders** (e.g., Nebulized Albuterol/Salbutamol administered 20 minutes ago).
* It verifies whether sensor readings exhibit **noise/artifact signatures** (e.g., sudden impossible HR spikes like 70 -> 180 -> 70 in 5 minutes with normal blood pressure and zero respiratory change).
* It outputs a **Confidence Discount Factor ($D \in [0.0, 1.0]$)** to prevent sounding false alarms.

---

## 2. Confounder Discrimination Matrix
1. **Drug-Induced Tachycardia:**
   * *Confounder Trigger:* Patient administered $\beta_2$-agonist (Albuterol) or inotrope.
   * *Skeptic Evaluation:* If HR is 115 bpm, BUT Lactate is normal (< 1.5), Respiratory Rate is normal, and Shock Index < 0.75 -> High discount (Suppress False Alarm).
   * *True Sepsis Trigger:* If HR is 115 bpm, BUT accompanied by tachypnea (Resp > 22) and rising Shock Index -> Low discount (Alert stands; sepsis co-occurs with asthma).
2. **Post-Operative Reactive Spikes:**
   * Transient fever or hypertension immediately post-extubation.
3. **Electrode Motion / Sensor Disconnect Artifacts:**
   * Non-physiological gradients (e.g. $\Delta \text{HR} > 50$ bpm within 1 hour without any change in blood pressure or pulse pressure).

---

## 3. Required Features for Model 3
1. **`Recent_Sympathomimetic_Med`** (Boolean / Hours since administration: Albuterol, Epinephrine, Dobutamine)
2. **`HR_to_Resp_Discordance`**: $\frac{\Delta \text{HR}}{\Delta \text{Resp}}$ (Drug tachycardia spikes HR without tachypnea; sepsis spikes both)
3. **`Sensor_Noise_Index`**: Variance of SpO2 / HR waveform stability
4. **`Post_Op_Hours`**: Time elapsed since surgical intervention
5. **`Shock_Index_Compensated`**: Confirms whether hemodynamics are truly stable despite the heart rate spike

---

## 4. Folder Structure
```
models/skeptic_agent/
├── README.md               # Clinical specification & MGH incident grounding
├── dataset/                # Annotated artifact & medication confounder cases
├── artifacts/              # Serialized skeptic model (.pkl)
└── src/
    ├── __init__.py
    ├── feature_engineering.py  # Computes confounder correlations & signal noise
    ├── train.py                # Trains the false-alarm discount classifier
    ├── predictor.py            # Computes discount factor D and artifact flags
    └── reasoning_agent.py      # LLM explainability for why an alarm was discounted/allowed
```
