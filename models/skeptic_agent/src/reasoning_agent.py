"""
Model 3 (Skeptic Agent): Clinical Reasoning & False Alarm Checker Agent
Takes outputs from Agent 1 (Vitals) and Agent 2 (Labs) along with their SHAP
attributions and Electronic Health Records (EHR).
Queries an LLM (with deterministic Neuro-Symbolic clinical fallback) to evaluate
whether EHR records explain vital spikes (FALSE ALARM) or indicate REAL SEPSIS.
"""

import os
import json
import re
from typing import Dict, List, Any, Optional

try:
    # pyrefly: ignore[missing-import]
    from pydantic import BaseModel, Field
except ImportError:
    # Lightweight fallback if pydantic is not installed
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__
    def Field(default=None, description=""):
        return default

import requests
from models.skeptic_agent.src.feature_engineering import parse_ehr_data, analyze_confounders


class SkepticEvidenceReport(BaseModel):
    is_false_alarm: bool = Field(description="True if deterioration is explained by benign EHR confounders")
    confidence_discount_factor: float = Field(description="Discount factor D between 0.0 (genuine sepsis) and 1.0 (pure false alarm)")
    ehr_risk_modifier: str = Field(description="'DISCOUNT_RISK', 'NEUTRAL', or 'ELEVATE_RISK'")
    classification: str = Field(description="'BENIGN_CONFOUNDER_FALSE_ALARM', 'REAL_SEPSIS_DETERIORATION', or 'EHR_HIGH_RISK_ESCALATION'")
    alarm_suppression_recommended: bool = Field(description="True if alarm should be suppressed to avoid alert fatigue")
    detected_confounders: List[str] = Field(description="Specific drugs or conditions causing the alert")
    shap_attribution_critique: str = Field(description="Clinical critique of Agent 1 & Agent 2 top SHAP drivers")
    clinical_reasoning: str = Field(description="Comprehensive medical justification for the decision")
    recommended_action: str = Field(description="'SUPPRESS_ALERT', 'STAND_ALERT', or 'ESCALATE_ALERT'")
    llm_source: str = Field(description="'gemini_api', 'openai_api', or 'neuro_symbolic_clinical_rules'")


class SkepticReasoningAgent:
    """
    Agent 3: Adversarial Clinical Skeptic & False Alarm Discriminating Agent.
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

    def build_clinical_prompt(
        self,
        vitals_result: Dict[str, Any],
        labs_result: Dict[str, Any],
        ehr_parsed: Dict[str, Any],
        confounder_analysis: Dict[str, Any]
    ) -> str:
        """
        Builds a comprehensive medical prompt presenting EHR context,
        telemetry predictions, and SHAP feature drivers.
        """
        # Format SHAP drivers from Agent 1
        vitals_shap = vitals_result.get("shap_contributions", {})
        top_vitals_shap = [
            f"  * {feat}: {'+' if val > 0 else ''}{val:.4f} ({'↑ Increases Risk' if val > 0 else '↓ Lowers Risk'})"
            for feat, val in list(vitals_shap.items())[:5]
        ]
        top_vitals_shap_str = "\n".join(top_vitals_shap) if top_vitals_shap else "  * (No SHAP data provided)"

        # Format SHAP drivers from Agent 2
        labs_shap = labs_result.get("shap_contributions", {})
        top_labs_shap = [
            f"  * {feat}: {'+' if val > 0 else ''}{val:.4f} ({'↑ Increases Risk' if val > 0 else '↓ Lowers Risk'})"
            for feat, val in list(labs_shap.items())[:5]
        ]
        top_labs_shap_str = "\n".join(top_labs_shap) if top_labs_shap else "  * (No SHAP data provided)"

        meds = ehr_parsed.get("medications", [])
        meds_str = ", ".join(meds) if meds else "None documented"
        conditions = ehr_parsed.get("conditions", [])
        cond_str = ", ".join(conditions) if conditions else "None documented"

        prompt = f"""
You are an expert ICU Intensivist and Clinical AI Auditor (Agent 3: Adversarial Skeptic).
Your job is to protect ICU nurses from fatal ALERT FATIGUE by verifying if an impending Sepsis Alert
is a BENIGN FALSE ALARM (e.g. drug-induced tachycardia, post-op reaction) or REAL SEPSIS DETERIORATION.

[PATIENT EHR DATA]
- Active Medications: {meds_str}
- Pre-existing Conditions / Diagnoses: {cond_str}
- Sympathomimetic/Chronotropic Meds Identified: {confounder_analysis.get('matched_sympathomimetics') or 'None'}
- Immunocompromised / High-Risk History: {confounder_analysis.get('matched_immunocompromised') or 'None'}

[AGENT 1: VITALS TELEMETRY PREDICTION]
- Sepsis Risk Probability: {vitals_result.get('vitals_risk_probability', 0.0) * 100:.1f}%
- Shock Index: {vitals_result.get('shock_index', 0.0)} (Normal < 0.70)
- Traditional NEWS2 Score: {vitals_result.get('news2_score', 0)}
- Top Clinical Risk Drivers: {vitals_result.get('risk_drivers', [])}
- Top 5 SHAP Feature Contributions:
{top_vitals_shap_str}

[AGENT 2: LABS & PATHOLOGY PREDICTION]
- Sepsis Risk Probability: {labs_result.get('labs_risk_probability', 0.0) * 100:.1f}%
- Organ Stress Level: {labs_result.get('organ_stress_level', 'UNKNOWN')}
- Abnormal Biomarkers: {labs_result.get('abnormal_biomarkers', [])}
- STAT Lab Escalations Required: {labs_result.get('stat_lab_draws_required', [])}
- Top 5 SHAP Feature Contributions:
{top_labs_shap_str}

[PHYSIOLOGICAL CONTEXT]
- Isolated Tachycardia: {confounder_analysis.get('isolated_tachycardia')}
- Benign Cellular Metabolism: {confounder_analysis.get('benign_metabolism')}
- Overt Septic Markers Present: {confounder_analysis.get('has_septic_biomarkers')}

[TASK]
Carefully evaluate whether the vital/lab anomalies flagged by Agent 1 and Agent 2:
1. Are explained by the EHR records (e.g. Albuterol given for asthma causes sinus tachycardia, but lactate is normal -> FALSE ALARM).
2. Represent REAL SEPSIS (e.g. tachycardia accompanied by elevated lactate, dropping platelets, leukocytosis, or rising shock index).
3. Or if high-risk EHR history (e.g. neutropenia, chemotherapy, recent surgery) INCREASES the risk prediction.

Return ONLY a valid JSON object with the following exact keys:
{{
  "is_false_alarm": true/false,
  "confidence_discount_factor": float between 0.0 (no discount / true sepsis) and 1.0 (complete discount / pure false alarm),
  "ehr_risk_modifier": "DISCOUNT_RISK" | "NEUTRAL" | "ELEVATE_RISK",
  "classification": "BENIGN_CONFOUNDER_FALSE_ALARM" | "REAL_SEPSIS_DETERIORATION" | "EHR_HIGH_RISK_ESCALATION",
  "alarm_suppression_recommended": true/false,
  "detected_confounders": ["list of identified confounders or 'None'"],
  "shap_attribution_critique": "analysis of how Agent 1 & Agent 2 SHAP drivers relate to EHR",
  "clinical_reasoning": "concise 2-3 sentence intensivist narrative explaining the decision",
  "recommended_action": "SUPPRESS_ALERT" | "STAND_ALERT" | "ESCALATE_ALERT"
}}
"""
        return prompt.strip()

    def _query_gemini(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Queries Google Gemini API via REST if API key is provided."""
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
        """Queries OpenAI API via REST if API key is provided."""
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
                {"role": "system", "content": "You are a clinical decision support AI answering in strict JSON."},
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
        """Queries local Ollama instance via /api/generate or OpenAI-compatible endpoint."""
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


    def _neuro_symbolic_fallback(
        self,
        vitals_result: Dict[str, Any],
        labs_result: Dict[str, Any],
        ehr_parsed: Dict[str, Any],
        confounder_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Clinical Neuro-Symbolic Rule Engine:
        Executes deterministic ICU decision trees when an LLM endpoint is unreachable.
        Adheres to SSC (Surviving Sepsis Campaign) and MGH Alert Fatigue guidelines.
        """
        matched_sympatho = confounder_analysis.get("matched_sympathomimetics", [])
        matched_immuno = confounder_analysis.get("matched_immunocompromised", [])
        isolated_tach = confounder_analysis.get("isolated_tachycardia", False)
        benign_metabolism = confounder_analysis.get("benign_metabolism", False)
        has_septic_bio = confounder_analysis.get("has_septic_biomarkers", False)

        v_prob = vitals_result.get("vitals_risk_probability", 0.0)
        l_prob = labs_result.get("labs_risk_probability", 0.0)
        shock_idx = vitals_result.get("shock_index", 0.0)
        vitals_shap = vitals_result.get("shap_contributions", {})

        hr_is_top_driver = False
        if vitals_shap:
            top_feature = next(iter(vitals_shap))
            if top_feature in ["HR", "Shock_Index"]:
                hr_is_top_driver = True

        # SCENARIO A: Immunocompromised / High-Risk EHR (Increases Risk!)
        if matched_immuno:
            confounders = [f"High-Risk Host State: {c}" for c in matched_immuno]
            return {
                "is_false_alarm": False,
                "confidence_discount_factor": 0.0,
                "ehr_risk_modifier": "ELEVATE_RISK",
                "classification": "EHR_HIGH_RISK_ESCALATION",
                "alarm_suppression_recommended": False,
                "detected_confounders": confounders,
                "shap_attribution_critique": (
                    f"Patient has documented {', '.join(matched_immuno)}. Even moderate vital SHAP drivers "
                    f"require hyper-vigilance due to compromised host immune defenses."
                ),
                "clinical_reasoning": (
                    f"EHR documentation of immunocompromised status ({', '.join(matched_immuno)}) significantly "
                    "heightens the risk of catastrophic septic progression. No alarm discount applied."
                ),
                "recommended_action": "ESCALATE_ALERT",
                "llm_source": "neuro_symbolic_clinical_rules"
            }

        # SCENARIO B: Benign Drug Confounder (False Alarm)
        # e.g., Patient administered Albuterol -> HR spiked (top SHAP driver), but Lactate is normal (< 2.0) and Resp is stable
        if matched_sympatho and (isolated_tach or benign_metabolism) and not has_septic_bio:
            confounders = [f"Pharmacological Confounder: {m}" for m in matched_sympatho]
            return {
                "is_false_alarm": True,
                "confidence_discount_factor": 0.85,
                "ehr_risk_modifier": "DISCOUNT_RISK",
                "classification": "BENIGN_CONFOUNDER_FALSE_ALARM",
                "alarm_suppression_recommended": True,
                "detected_confounders": confounders,
                "shap_attribution_critique": (
                    f"Agent 1 elevation was driven by HR/Shock Index, but this directly correlates with recent "
                    f"sympathomimetic administration ({matched_sympatho[0]}). Agent 2 confirms normal lactate "
                    "and absence of cellular hypoxia."
                ),
                "clinical_reasoning": (
                    f"Patient's tachycardia is clinically accounted for by recent {matched_sympatho[0]}. "
                    "Normal cellular metabolism (Lactate < 2.0 mmol/L) and stable respiration confirm this is a "
                    "benign pharmacological side effect rather than systemic sepsis. Alarm discounted to prevent alert fatigue."
                ),
                "recommended_action": "SUPPRESS_ALERT",
                "llm_source": "neuro_symbolic_clinical_rules"
            }

        # SCENARIO C: True Sepsis Co-Occurring with Confounder (Real Sepsis!)
        # e.g., Albuterol given, BUT accompanied by elevated lactate, leukocytosis, or rising shock index
        if matched_sympatho and has_septic_bio:
            confounders = [f"Non-exclusive medication: {m}" for m in matched_sympatho]
            return {
                "is_false_alarm": False,
                "confidence_discount_factor": 0.05,
                "ehr_risk_modifier": "NEUTRAL",
                "classification": "REAL_SEPSIS_DETERIORATION",
                "alarm_suppression_recommended": False,
                "detected_confounders": confounders,
                "shap_attribution_critique": (
                    "Although sympathomimetic medication is active, Agent 2 reveals positive SHAP drivers for "
                    "hyperlactatemia / organ hypoxia that cannot be explained by bronchodilators alone."
                ),
                "clinical_reasoning": (
                    "Active medication accounts for tachycardia, but severe metabolic markers (elevated lactate/leukocytosis) "
                    "and hemodynamic instability confirm TRUE SYSTEMIC SEPSIS. Sepsis bundle must proceed immediately."
                ),
                "recommended_action": "STAND_ALERT",
                "llm_source": "neuro_symbolic_clinical_rules"
            }

        # SCENARIO D: Genuine Deterioration without Confounders
        if v_prob >= 0.50 or l_prob >= 0.50 or has_septic_bio:
            return {
                "is_false_alarm": False,
                "confidence_discount_factor": 0.0,
                "ehr_risk_modifier": "NEUTRAL",
                "classification": "REAL_SEPSIS_DETERIORATION",
                "alarm_suppression_recommended": False,
                "detected_confounders": ["None"],
                "shap_attribution_critique": (
                    "No benign pharmacological confounders or artifacts detected in EHR to account for "
                    "elevated SHAP drivers across Vitals and Labs models."
                ),
                "clinical_reasoning": (
                    "Hemodynamic and metabolic deterioration is unmitigated by EHR review. Patient exhibits genuine "
                    "subclinical or clinical sepsis features. Full Sepsis-3 bundle execution advised."
                ),
                "recommended_action": "STAND_ALERT",
                "llm_source": "neuro_symbolic_clinical_rules"
            }

        # SCENARIO E: Baseline Normal / Low Risk
        return {
            "is_false_alarm": False,
            "confidence_discount_factor": 0.0,
            "ehr_risk_modifier": "NEUTRAL",
            "classification": "REAL_SEPSIS_DETERIORATION",
            "alarm_suppression_recommended": False,
            "detected_confounders": ["None"],
            "shap_attribution_critique": "Telemetry within acceptable clinical boundaries; no alarm triggered.",
            "clinical_reasoning": "Patient parameters are physiologically compensated. No acute sepsis risk identified.",
            "recommended_action": "STAND_ALERT",
            "llm_source": "neuro_symbolic_clinical_rules"
        }

    def explain(
        self,
        vitals_result: Dict[str, Any],
        labs_result: Dict[str, Any],
        ehr_data: Any
    ) -> SkepticEvidenceReport:
        """
        Main entrypoint for Agent 3:
        Synthesizes inputs from Agent 1, Agent 2, SHAP values, and EHR data.
        Returns a typed SkepticEvidenceReport.
        """
        ehr_parsed = parse_ehr_data(ehr_data)
        vitals_telemetry = vitals_result.get("telemetry_snapshot", {})
        labs_telemetry = labs_result.get("labs_snapshot", {})

        confounder_analysis = analyze_confounders(vitals_telemetry, labs_telemetry, ehr_parsed)

        prompt = self.build_clinical_prompt(
            vitals_result=vitals_result,
            labs_result=labs_result,
            ehr_parsed=ehr_parsed,
            confounder_analysis=confounder_analysis
        )

        llm_response = None
        source = "neuro_symbolic_clinical_rules"

        # 1. Try Local Ollama if configured or available
        llm_response = self._query_ollama(prompt)
        if llm_response:
            source = f"ollama_{self.ollama_model}"

        # 2. Try Gemini API if Ollama was not active and key available
        if not llm_response and self.gemini_api_key:
            llm_response = self._query_gemini(prompt)
            if llm_response:
                source = "gemini_api"

        # 3. Try OpenAI API if preceding options were unavailable
        if not llm_response and self.openai_api_key:
            llm_response = self._query_openai(prompt)
            if llm_response:
                source = "openai_api"

        # 4. Fallback to robust deterministic clinical rule engine
        if not llm_response:
            llm_response = self._neuro_symbolic_fallback(
                vitals_result=vitals_result,
                labs_result=labs_result,
                ehr_parsed=ehr_parsed,
                confounder_analysis=confounder_analysis
            )
            source = "neuro_symbolic_clinical_rules"


        llm_response["llm_source"] = source

        # Ensure all expected fields are present
        return SkepticEvidenceReport(
            is_false_alarm=bool(llm_response.get("is_false_alarm", False)),
            confidence_discount_factor=float(llm_response.get("confidence_discount_factor", 0.0)),
            ehr_risk_modifier=str(llm_response.get("ehr_risk_modifier", "NEUTRAL")),
            classification=str(llm_response.get("classification", "REAL_SEPSIS_DETERIORATION")),
            alarm_suppression_recommended=bool(llm_response.get("alarm_suppression_recommended", False)),
            detected_confounders=list(llm_response.get("detected_confounders", [])),
            shap_attribution_critique=str(llm_response.get("shap_attribution_critique", "")),
            clinical_reasoning=str(llm_response.get("clinical_reasoning", "")),
            recommended_action=str(llm_response.get("recommended_action", "STAND_ALERT")),
            llm_source=source
        )
