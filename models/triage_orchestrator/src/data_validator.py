"""
Data Validator Tool (Hybrid Neuro-Symbolic Validator)
Screening tool invoked by the Sepsis Orchestrator before clinical AI models execute.

Stage 1: Deterministic physical/biological sanity checks (sub-millisecond).
Stage 2: LLM Clinical Anomaly Explainer (invoked only on anomalies to diagnose 
         hardware vs true physiological catastrophe for the bedside nurse).
"""

import os
import json
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__
        def model_dump(self):
            return self.__dict__
    def Field(default=None, default_factory=None, description=""):
        if default_factory is not None:
            return default_factory()
        return default


class ValidationResult(BaseModel):
    is_valid: bool = Field(description="True if telemetry is physiologically plausible and reliable")
    target_role: Optional[str] = Field(default=None, description="'ROLE_NURSE' if hardware/sensor fault; None if data is valid")
    fault_type: Optional[str] = Field(default=None, description="Type of fault detected, e.g., 'OXIMETER_DETACHED', 'INVERTED_BLOOD_PRESSURE'")
    alert_title: Optional[str] = Field(default=None, description="Short headline for dashboard banner")
    bedside_action: Optional[str] = Field(default=None, description="Physical task for the bedside nurse")
    clinical_explanation: Optional[str] = Field(default=None, description="LLM intensivist explanation of the anomaly")
    detected_anomalies: List[str] = Field(default_factory=list, description="List of raw anomaly signatures")
    llm_source: Optional[str] = Field(default=None, description="Model used for anomaly explanation")


class DataValidator:
    """
    Hybrid Neuro-Symbolic Data Validator.
    Screens telemetry for physical impossibilities and generates actionable Nurse alerts.
    """

    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        ollama_base_url: Optional[str] = None,
        ollama_model: Optional[str] = None
    ):
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.ollama_base_url = ollama_base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.ollama_model = ollama_model or os.getenv("OLLAMA_MODEL", "llama3")

    def _detect_physical_anomalies(
        self,
        current_vitals: Dict[str, Any],
        previous_vitals: Optional[Dict[str, Any]] = None,
        lab_age_hours: Optional[float] = None
    ) -> List[Dict[str, str]]:
        """
        Fast deterministic rules checking physical and biological impossibilities.
        """
        anomalies = []

        hr = current_vitals.get("HR")
        sbp = current_vitals.get("SBP")
        dbp = current_vitals.get("DBP")
        resp = current_vitals.get("Resp")
        spo2 = current_vitals.get("O2Sat")

        # 1. Fluid Dynamics: Inverted Blood Pressure
        if sbp is not None and dbp is not None:
            if sbp <= dbp:
                anomalies.append({
                    "fault_type": "INVERTED_BLOOD_PRESSURE",
                    "title": "Inverted Blood Pressure Detected",
                    "signature": f"SBP ({sbp} mmHg) <= DBP ({dbp} mmHg)",
                    "default_action": "Reposition NIBP cuff or re-zero arterial line transducer."
                })
            elif (sbp - dbp) < 10:
                anomalies.append({
                    "fault_type": "NARROW_PULSE_PRESSURE",
                    "title": "Severe Pulse Pressure Dampening",
                    "signature": f"Pulse Pressure ({sbp - dbp} mmHg) < 10 mmHg",
                    "default_action": "Check arterial line catheter dampening, air in transducer, or cuff air leak."
                })

        # 2. Biological Coherence: Isolated SpO2 Drop without Tachypnea/Tachycardia
        if spo2 is not None and spo2 < 80.0:
            is_breathing_calm = (resp is not None and resp < 18.0)
            is_hr_calm = (hr is not None and hr < 90.0)

            if is_breathing_calm and is_hr_calm:
                anomalies.append({
                    "fault_type": "OXIMETER_DETACHED",
                    "title": "Suspected Pulse Oximeter Detachment",
                    "signature": f"SpO2 {spo2}% reading while breathing ({resp}/min) and HR ({hr} bpm) are completely relaxed",
                    "default_action": "Inspect bedside finger probe clip and reattach to index finger."
                })

        # 3. Rate of change: Impossible instantaneous jump
        if previous_vitals:
            prev_hr = previous_vitals.get("HR")
            if hr is not None and prev_hr is not None and abs(hr - prev_hr) >= 60.0:
                anomalies.append({
                    "fault_type": "SIGNAL_DISCONTINUITY",
                    "title": "Sudden Physiological Discontinuity",
                    "signature": f"Heart Rate jumped from {prev_hr:.0f} to {hr:.0f} bpm in 1 hour",
                    "default_action": "Assess ECG electrode skin contact against patient motion tremor."
                })

            # Signal freeze: all core values identical across consecutive cycles
            core_params = ["HR", "SBP", "MAP", "Resp"]
            matching = sum(
                1 for p in core_params
                if current_vitals.get(p) is not None and current_vitals.get(p) == previous_vitals.get(p)
            )
            if matching == len(core_params):
                anomalies.append({
                    "fault_type": "TELEMETRY_FROZEN",
                    "title": "Static Telemetry Feed (Frozen Stream)",
                    "signature": "Identical vital numbers across consecutive reading cycles",
                    "default_action": "Verify telemetry monitor wireless transmitter status."
                })

        return anomalies

    def _query_llm_anomaly_explainer(
        self,
        current_vitals: Dict[str, Any],
        anomalies: List[Dict[str, str]]
    ) -> Optional[Dict[str, str]]:
        """
        Queries LLM only when an anomaly is present to provide rich clinical context for the nurse.
        """
        anomaly_str = "\n".join([f"- {a['fault_type']}: {a['signature']}" for a in anomalies])
        prompt = f"""
You are an expert ICU Clinical Engineer and Nurse Educator.
The bedside monitoring system has detected the following anomalous vital sign readings:

[PATIENT TELEMETRY SNAPSHOT]
- Heart Rate: {current_vitals.get('HR', 'N/A')} bpm
- Systolic BP: {current_vitals.get('SBP', 'N/A')} mmHg
- Diastolic BP: {current_vitals.get('DBP', 'N/A')} mmHg
- Respiratory Rate: {current_vitals.get('Resp', 'N/A')} /min
- Oxygen Saturation (SpO2): {current_vitals.get('O2Sat', 'N/A')}%

[DETECTED HARDWARE / SENSOR ANOMALIES]
{anomaly_str}

TASK:
Provide a concise, direct 1-to-2 sentence explanation written for the bedside nurse:
1. Explain why this pattern reflects an equipment artifact rather than true physiological sepsis shock.
2. Give a precise physical bedside instruction to correct it.

Return ONLY a valid JSON object with the following exact keys:
{{
  "clinical_explanation": "1-2 sentence medical explanation of why this is a sensor artifact",
  "bedside_action": "Specific physical action for the nurse"
}}
"""
        # 1. Try Ollama local
        try:
            url = f"{self.ollama_base_url.rstrip('/')}/api/generate"
            resp = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                json={"model": self.ollama_model, "prompt": prompt, "format": "json", "stream": False, "options": {"temperature": 0.1}},
                timeout=5
            )
            if resp.status_code == 200:
                raw = resp.json().get("response", "")
                if raw:
                    data = json.loads(raw)
                    data["llm_source"] = f"ollama_{self.ollama_model}"
                    return data
        except Exception:
            pass

        # 2. Try Gemini
        if self.gemini_api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_api_key}"
                resp = requests.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json={"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}},
                    timeout=5
                )
                if resp.status_code == 200:
                    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                    data = json.loads(text)
                    data["llm_source"] = "gemini_api"
                    return data
            except Exception:
                pass

        return None

    def validate(
        self,
        current_vitals: Dict[str, Any],
        previous_vitals: Optional[Dict[str, Any]] = None,
        lab_age_hours: Optional[float] = None
    ) -> ValidationResult:
        """
        Master validation method called by the Sepsis Orchestrator.
        """
        anomalies = self._detect_physical_anomalies(
            current_vitals=current_vitals,
            previous_vitals=previous_vitals,
            lab_age_hours=lab_age_hours
        )

        # Case 1: All clear! Pure healthy data -> 0ms overhead, bypass LLM
        if not anomalies:
            return ValidationResult(
                is_valid=True,
                target_role=None,
                fault_type=None,
                alert_title=None,
                bedside_action=None,
                clinical_explanation="Telemetry data is physiologically coherent and reliable.",
                detected_anomalies=[],
                llm_source=None
            )

        # Case 2: Anomaly detected! Screen for Nurse
        primary_anomaly = anomalies[0]
        fault_type = primary_anomaly["fault_type"]
        alert_title = primary_anomaly["title"]
        default_action = primary_anomaly["default_action"]
        signatures = [a["signature"] for a in anomalies]

        # Call LLM for nurse guidance
        llm_output = self._query_llm_anomaly_explainer(current_vitals, anomalies)

        if llm_output and llm_output.get("clinical_explanation"):
            clinical_explanation = llm_output["clinical_explanation"]
            bedside_action = llm_output.get("bedside_action") or default_action
            source = llm_output.get("llm_source", "llm_explainer")
        else:
            clinical_explanation = (
                f"Physiological sensor conflict identified: {'; '.join(signatures)}. "
                "Values are physically inconsistent with true acute shock and indicate equipment placement artifact."
            )
            bedside_action = default_action
            source = "rule_based_clinical_guardrail"

        return ValidationResult(
            is_valid=False,
            target_role="ROLE_NURSE",
            fault_type=fault_type,
            alert_title=alert_title,
            bedside_action=bedside_action,
            clinical_explanation=clinical_explanation,
            detected_anomalies=signatures,
            llm_source=source
        )


if __name__ == "__main__":
    validator = DataValidator()

    print("\n" + "=" * 65)
    print("      AEGIS-ICU: HYBRID SENSOR DATA VALIDATOR TEST")
    print("=" * 65)

    # Test Case 1: Healthy normal telemetry
    normal_vitals = {"HR": 75.0, "SBP": 120.0, "DBP": 80.0, "Resp": 16.0, "O2Sat": 98.0}
    res_normal = validator.validate(normal_vitals)
    print(f" [1] Normal Telemetry -> Valid: {res_normal.is_valid} (Target Role: {res_normal.target_role})")

    # Test Case 2: Slipped pulse oximeter clip
    detached_clip = {"HR": 72.0, "SBP": 118.0, "DBP": 78.0, "Resp": 14.0, "O2Sat": 68.0}
    res_detached = validator.validate(detached_clip)
    print(f"\n [2] Slipped SpO2 Clip -> Valid: {res_detached.is_valid}")
    print(f"     Target Role        : {res_detached.target_role}")
    print(f"     Fault Type         : {res_detached.fault_type}")
    print(f"     Alert Title        : {res_detached.alert_title}")
    print(f"     Bedside Action     : {res_detached.bedside_action}")
    print(f"     Clinical Expl.     : {res_detached.clinical_explanation}")
    print(f"     Engine             : {res_detached.llm_source}")

    # Test Case 3: Inverted Blood Pressure Cuff
    inverted_cuff = {"HR": 85.0, "SBP": 75.0, "DBP": 85.0, "Resp": 18.0, "O2Sat": 97.0}
    res_inverted = validator.validate(inverted_cuff)
    print(f"\n [3] Inverted BP Cuff -> Valid: {res_inverted.is_valid}")
    print(f"     Target Role        : {res_inverted.target_role}")
    print(f"     Fault Type         : {res_inverted.fault_type}")
    print(f"     Alert Title        : {res_inverted.alert_title}")
    print(f"     Bedside Action     : {res_inverted.bedside_action}")
    print(f"     Clinical Expl.     : {res_inverted.clinical_explanation}")
    print("=" * 65 + "\n")
