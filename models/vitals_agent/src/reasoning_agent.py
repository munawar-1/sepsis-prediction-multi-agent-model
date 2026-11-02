"""
Model 1 (Vitals Agent): Clinical Reasoning Agent
Translates hemodynamics, Shock Index, NEWS2 blindspots, and SHAP attributions
into clear, intensivist-grade physiological reasoning using an LLM
(with a deterministic Neuro-Symbolic clinical fallback engine).
"""

import os
import json
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__
    def Field(default=None, default_factory=None, description=""):
        if default_factory is not None:
            return default_factory()
        return default

import requests


class VitalsEvidenceReport(BaseModel):
    agent_name: str = "Vitals Agent"
    timestamp: str
    confidence: float = Field(description="Confidence in prediction integrity (0.0 to 1.0) based on telemetry completeness")
    risk_level: str = Field(description="'LOW', 'MODERATE', or 'CRITICAL_SEPSIS'")
    ml_probability: float = Field(description="Predicted Sepsis Risk Probability between 0.0 and 1.0")
    news2_score: int = Field(description="Classical National Early Warning Score 2 (0 to 20)")
    shock_index: float = Field(description="Heart Rate / Systolic Blood Pressure")
    discrepancy_flag: bool = Field(description="True if ML flags high risk while NEWS2 remains low/normal (< 5)")
    hemodynamic_stage: str = Field(description="'HEMODYNAMICALLY_STABLE', 'COMPENSATED_OCCULT_SHOCK', 'UNCOMPENSATED_SEPTIC_SHOCK', or 'BORDERLINE_TACHYCARDIA'")
    primary_drivers: List[str] = Field(description="Primary clinical drivers identified")
    shap_summary: str = Field(description="Clinical synthesis of SHAP contributions")
    discrepancy_rationale: str = Field(description="Medical explanation of why NEWS2 failed or agreed with ML")
    clinical_explanation: str = Field(description="Comprehensive intensivist physiological reasoning")
    shap_contributions: Dict[str, float] = Field(default_factory=dict)
    telemetry_snapshot: Dict[str, Any] = Field(default_factory=dict)
    llm_source: str = Field(default="neuro_symbolic_clinical_rules", description="Engine or model used for reasoning")


class VitalsReasoningAgent:
    """
    Model 1 Reasoning Agent: Translates numeric hemodynamics into structured clinical rationale.
    Synthesizes physiological telemetry, classical NEWS2 scoring, and SHAP attributions.
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

    def build_clinical_prompt(self, vitals_result: Dict[str, Any]) -> str:
        telemetry = vitals_result.get("telemetry_snapshot", {})
        shap_contributions = vitals_result.get("shap_contributions", {})
        top_shap = [
            f"  * {feat}: {'+' if val > 0 else ''}{val:.4f} ({'↑ Increases Risk' if val > 0 else '↓ Lowers Risk'})"
            for feat, val in list(shap_contributions.items())[:5]
        ]
        top_shap_str = "\n".join(top_shap) if top_shap else "  * (No SHAP data provided)"

        prob = vitals_result.get("vitals_risk_probability", 0.0)
        prob_pct = prob * 100.0
        shock_index = vitals_result.get("shock_index", 0.0)
        news2 = vitals_result.get("news2_score", 0)
        discrepancy = vitals_result.get("discrepancy_detected", False)
        drivers = vitals_result.get("risk_drivers", [])

        prompt = f"""
You are an expert ICU Intensivist and Hemodynamics Specialist auditing Model 1 (Vitals Agent).
Explain the exact clinical and pathophysiological reasons for the following telemetry prediction numbers:

[PATIENT TELEMETRY SNAPSHOT]
- Heart Rate (HR): {telemetry.get('HR', 'N/A')} bpm
- Systolic Blood Pressure (SBP): {telemetry.get('SBP', 'N/A')} mmHg
- Mean Arterial Pressure (MAP): {telemetry.get('MAP', 'N/A')} mmHg
- Respiratory Rate (Resp): {telemetry.get('Resp', 'N/A')} /min
- Oxygen Saturation (O2Sat): {telemetry.get('O2Sat', 'N/A')}%
- Body Temperature (Temp): {telemetry.get('Temp', 'N/A')} °C

[MODEL 1 PREDICTION NUMBERS]
- ML Sepsis Probability: {prob_pct:.1f}% ({prob:.4f})
- Shock Index (HR / SBP): {shock_index:.2f} (Normal baseline < 0.70; >= 0.80 occult hypoperfusion; >= 1.0 critical shock)
- Traditional NEWS2 Score: {news2} / 20
- NEWS2 vs ML Discrepancy Caught: {discrepancy}
- Identified Risk Drivers: {drivers}

[TOP 5 SHAP FEATURE CONTRIBUTIONS]
{top_shap_str}

[CLINICAL OBJECTIVE]
Provide an authoritative medical breakdown explaining:
1. Hemodynamic state: Is the patient in early compensated shock (e.g., maintaining SBP through endogenous catecholamine surge while HR climbs, driving Shock Index up), or uncompensated collapse, or stable?
2. Respiratory & metabolic compensation: Does tachypnea reflect hyperventilation to buffer lactic acidosis?
3. The NEWS2 blindspot: Explain why traditional NEWS2 scored this patient as {news2} (which may falsely appear low-risk) whereas machine learning detects subtle non-linear multi-vital deterioration (the Martha Mills / Rory Staunton early sepsis presentation).
4. SHAP alignment: How do the SHAP features align with physiological compensation mechanisms?

Return ONLY a valid JSON object with the following exact keys:
{{
  "risk_level": "LOW" | "MODERATE" | "CRITICAL_SEPSIS",
  "hemodynamic_stage": "HEMODYNAMICALLY_STABLE" | "BORDERLINE_TACHYCARDIA" | "COMPENSATED_OCCULT_SHOCK" | "UNCOMPENSATED_SEPTIC_SHOCK",
  "primary_drivers": ["list of top physiological drivers"],
  "shap_summary": "1-2 sentence clinical interpretation of which vital features contributed most to the score",
  "discrepancy_rationale": "Clear medical explanation of why NEWS2 is low while ML probability is elevated (or why they agree)",
  "clinical_explanation": "2-3 sentence intensivist narrative summarizing physiological compensation, perfusion status, and immediate bed-side significance"
}}
"""
        return prompt.strip()

    def _query_gemini(self, prompt: str) -> Optional[Dict[str, Any]]:
        if not self.gemini_api_key:
            return None
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
        }
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text)
        except Exception:
            pass
        return None

    def _query_openai(self, prompt: str) -> Optional[Dict[str, Any]]:
        if not self.openai_api_key:
            return None
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.openai_api_key}"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are a clinical intensivist answering in strict JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception:
            pass
        return None

    def _query_ollama(self, prompt: str) -> Optional[Dict[str, Any]]:
        url = f"{self.ollama_base_url.rstrip('/')}/api/generate"
        headers = {"Content-Type": "application/json"}
        payload = {
            "model": self.ollama_model,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {"temperature": 0.1}
        }
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=25)
            if resp.status_code == 200:
                data = resp.json()
                raw_response = data.get("response", "")
                if raw_response:
                    return json.loads(raw_response)
        except Exception:
            pass
        return None

    def _neuro_symbolic_fallback(self, vitals_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deterministic, rule-based clinical engine modeling Surviving Sepsis Campaign,
        Shock Index occult hypoperfusion physiology, and NEWS2 blindspot analysis.
        """
        prob = float(vitals_result.get("vitals_risk_probability", 0.0))
        shock_index = float(vitals_result.get("shock_index", 0.0))
        news2 = int(vitals_result.get("news2_score", 0))
        discrepancy = bool(vitals_result.get("discrepancy_detected", False))
        telemetry = vitals_result.get("telemetry_snapshot", {})
        shap_contributions = vitals_result.get("shap_contributions", {})

        hr = float(telemetry.get("HR") or 84.0)
        sbp = float(telemetry.get("SBP") or 118.0)
        map_val = float(telemetry.get("MAP") or 77.0)
        resp = float(telemetry.get("Resp") or 18.0)

        # 1. Determine risk tier
        if prob >= 0.50 or shock_index >= 1.0:
            risk_level = "CRITICAL_SEPSIS"
        elif prob >= 0.25 or shock_index >= 0.80 or news2 >= 5:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        # 2. Determine Hemodynamic Stage
        if shock_index >= 1.0 or (map_val < 65 and hr >= 100):
            stage = "UNCOMPENSATED_SEPTIC_SHOCK"
        elif shock_index >= 0.80 or (hr >= 100 and sbp >= 100):
            stage = "COMPENSATED_OCCULT_SHOCK"
        elif hr >= 95 or resp >= 20:
            stage = "BORDERLINE_TACHYCARDIA"
        else:
            stage = "HEMODYNAMICALLY_STABLE"

        # 3. Discrepancy Rationale
        if discrepancy:
            discrepancy_rationale = (
                f"Classic early sepsis presentation (Martha Mills effect): NEWS2 scored low ({news2}/20) "
                f"because individual vitals (HR {hr:.0f}, SBP {sbp:.0f}) are borderline, but the ML model catches "
                f"elevated Shock Index ({shock_index:.2f}) and subtle multi-vital correlation indicating occult hypoperfusion."
            )
        elif prob >= 0.50 and news2 >= 5:
            discrepancy_rationale = (
                f"Both ML model ({prob*100:.1f}%) and NEWS2 ({news2}/20) corroborate high-grade systemic deterioration "
                f"with overt physiological decompensation."
            )
        else:
            discrepancy_rationale = (
                f"ML model ({prob*100:.1f}%) and NEWS2 ({news2}/20) concur within acceptable physiological bounds "
                f"without acute vital sign discrepancy."
            )

        # 4. SHAP summary
        if shap_contributions:
            top_drivers = list(shap_contributions.items())[:3]
            pos_drivers = [f"{k} (+{v:.2f})" for k, v in top_drivers if v > 0]
            if pos_drivers:
                shap_summary = f"Primary mathematical drivers elevating risk are: {', '.join(pos_drivers)}."
            else:
                shap_summary = "Vital parameters remain predominantly within normal physiological ranges, lowering risk."
        else:
            shap_summary = f"Risk driven primarily by Heart Rate ({hr:.0f} bpm) and Shock Index ({shock_index:.2f})."

        # 5. Comprehensive Clinical Explanation
        if stage in ["COMPENSATED_OCCULT_SHOCK", "UNCOMPENSATED_SEPTIC_SHOCK"]:
            explanation = (
                f"Patient exhibits {stage.replace('_', ' ').title()} with Shock Index {shock_index:.2f} "
                f"(HR {hr:.0f} bpm / SBP {sbp:.0f} mmHg). Sympathetic vasoconstriction is preserving systemic blood pressure "
                f"despite compromised stroke volume. "
                f"{'Concurrent tachypnea (' + str(int(resp)) + '/min) suggests respiratory compensation for metabolic acidosis. ' if resp >= 20 else ''}"
                f"Immediate fluid resuscitation and serial perfusion monitoring warranted."
            )
        elif stage == "BORDERLINE_TACHYCARDIA":
            explanation = (
                f"Borderline hemodynamic instability noted (HR {hr:.0f} bpm, MAP {map_val:.0f} mmHg). "
                f"Mild physiological stress without overt hypoperfusion; continuous telemetry surveillance indicated."
            )
        else:
            explanation = (
                f"Hemodynamic profile is stable (Shock Index {shock_index:.2f}, MAP {map_val:.0f} mmHg). "
                f"Vitals telemetry does not show acute circulatory failure or systemic inflammatory deterioration."
            )

        drivers = list(vitals_result.get("risk_drivers", []))
        if not drivers:
            drivers = [f"Shock Index: {shock_index:.2f}", f"Heart Rate: {hr:.0f} bpm"]
        if shock_index >= 1.0 and not any("Critical Occult Shock" in d for d in drivers):
            drivers.insert(0, f"Critical Occult Shock (Shock Index {shock_index:.2f} >= 1.0)")

        return {
            "risk_level": risk_level,
            "hemodynamic_stage": stage,
            "primary_drivers": drivers,
            "shap_summary": shap_summary,
            "discrepancy_rationale": discrepancy_rationale,
            "clinical_explanation": explanation
        }

    def explain(self, vitals_result: Dict[str, Any]) -> VitalsEvidenceReport:
        """
        Synthesizes Model 1 predictions into an authoritative VitalsEvidenceReport.
        """
        prob = float(vitals_result.get("vitals_risk_probability", 0.0))
        news2 = int(vitals_result.get("news2_score", 0))
        shock_index = float(vitals_result.get("shock_index", 0.0))
        discrepancy = bool(vitals_result.get("discrepancy_detected", False))
        snapshot = dict(vitals_result.get("telemetry_snapshot", {}))
        shap_contribs = dict(vitals_result.get("shap_contributions", {}))
        now_iso = datetime.now(timezone.utc).isoformat()

        # Compute confidence based on missingness in snapshot
        core_keys = ["HR", "SBP", "MAP", "Resp", "O2Sat", "Temp"]
        missing_count = sum(1 for k in core_keys if k not in snapshot or snapshot.get(k) is None)
        confidence = max(0.20, round(1.0 - (missing_count * 0.15), 2))

        prompt = self.build_clinical_prompt(vitals_result)
        llm_response = None
        source = "neuro_symbolic_clinical_rules"

        # 1. Try Ollama local
        llm_response = self._query_ollama(prompt)
        if llm_response:
            source = f"ollama_{self.ollama_model}"

        # 2. Try Gemini API
        if not llm_response and self.gemini_api_key:
            llm_response = self._query_gemini(prompt)
            if llm_response:
                source = "gemini_api"

        # 3. Try OpenAI API
        if not llm_response and self.openai_api_key:
            llm_response = self._query_openai(prompt)
            if llm_response:
                source = "openai_api"

        # 4. Deterministic Clinical Fallback
        if not llm_response:
            llm_response = self._neuro_symbolic_fallback(vitals_result)
            source = "neuro_symbolic_clinical_rules"

        # Ensure risk level consistency
        risk_level = str(llm_response.get("risk_level", "LOW"))
        if shock_index >= 1.0 or prob >= 0.50:
            risk_level = "CRITICAL_SEPSIS"
        elif risk_level == "LOW" and (prob >= 0.25 or shock_index >= 0.80 or news2 >= 5):
            risk_level = "MODERATE"

        primary_drivers = list(llm_response.get("primary_drivers", vitals_result.get("risk_drivers", [])))
        if shock_index >= 1.0 and not any("Critical Occult Shock" in d for d in primary_drivers):
            primary_drivers.insert(0, f"Critical Occult Shock (Shock Index {shock_index:.2f} >= 1.0)")

        return VitalsEvidenceReport(
            agent_name="Vitals Agent",
            timestamp=now_iso,
            confidence=confidence,
            risk_level=risk_level,
            ml_probability=round(prob, 4),
            news2_score=news2,
            shock_index=round(shock_index, 2),
            discrepancy_flag=discrepancy,
            hemodynamic_stage=str(llm_response.get("hemodynamic_stage", "HEMODYNAMICALLY_STABLE")),
            primary_drivers=primary_drivers,
            shap_summary=str(llm_response.get("shap_summary", "")),
            discrepancy_rationale=str(llm_response.get("discrepancy_rationale", "")),
            clinical_explanation=str(llm_response.get("clinical_explanation", "")),
            shap_contributions=shap_contribs,
            telemetry_snapshot=snapshot,
            llm_source=source
        )
