"""
Model 2 (Labs Agent): Clinical Reasoning Agent
Translates blood pathology, cellular hypoxia markers, and STAT test orders into
an intensivist-level diagnostic report adhering to Sepsis-3 guidelines and Martha's Rule.
Supports multi-tier LLM reasoning (Ollama -> Gemini -> OpenAI -> deterministic fallback).
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


class LabsEvidenceReport(BaseModel):
    agent_name: str = "Labs Agent"
    timestamp: str
    confidence: float = Field(description="Confidence in laboratory assessment (0.0 to 1.0) based on biomarker availability")
    organ_stress_level: str = Field(description="'NORMAL_HOMEOSTASIS', 'MODERATE_HYPOXIA', 'SEVERE_ORGAN_DYSFUNCTION', or 'UNASSESSED_MISSING_LABS'")
    lab_probability: float = Field(description="Probability of lab-confirmed sepsis/organ failure between 0.0 and 1.0")
    freshness_status: str = Field(description="'FRESH_EVIDENCE', 'STALE_EVIDENCE', or 'MISSING_CRITICAL_LABS'")
    safety_notice: str = Field(description="Clinical guardrail: Normal or missing labs must never rule out sepsis")
    stat_orders_recommended: List[str] = Field(description="STAT lab escalations required (e.g. STAT Serum Lactate)")
    abnormal_biomarkers: List[str] = Field(description="e.g. ['Severe Lactic Acidosis: 4.2 mmol/L']")
    cellular_hypoxia_grade: str = Field(default="NORMAL_AEROBIC_RESPIRATION", description="'NORMAL_AEROBIC_RESPIRATION', 'TISSUE_HYPOPERFUSION', 'ANAEROBIC_GLYCOLYSIS_CRISIS', or 'UNASSESSED_MISSING_DATA'")
    shap_summary: str = Field(default="", description="Clinical synthesis of SHAP contributions")
    pathology_summary: str = Field(description="Comprehensive intensivist synthesis of patient metabolic/organ state")
    clinical_reasoning: str = Field(default="", description="Concise 2-3 sentence intensivist narrative summarizing organ dysfunction and lab imperatives")
    shap_contributions: Dict[str, float] = Field(default_factory=dict)
    labs_snapshot: Dict[str, Any] = Field(default_factory=dict)
    llm_source: str = Field(default="neuro_symbolic_clinical_rules", description="Engine or model used for reasoning")


class LabsReasoningAgent:
    """
    Model 2 Reasoning Agent: Translates lab metrics, hypoxia, and organ failure criteria into clinical rationale.
    Enforces Martha's Rule and Surviving Sepsis Campaign diagnostic protocols.
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

    def build_clinical_prompt(self, labs_result: Dict[str, Any]) -> str:
        labs = labs_result.get("labs_snapshot", {})
        shap_contributions = labs_result.get("shap_contributions", {})
        top_shap = [
            f"  * {feat}: {'+' if val > 0 else ''}{val:.4f} ({'↑ Increases Risk' if val > 0 else '↓ Lowers Risk'})"
            for feat, val in list(shap_contributions.items())[:5]
        ]
        top_shap_str = "\n".join(top_shap) if top_shap else "  * (No SHAP data provided)"

        prob = labs_result.get("labs_risk_probability", 0.0)
        prob_pct = prob * 100.0
        stress_level = labs_result.get("organ_stress_level", "NORMAL_HOMEOSTASIS")
        abnormal = labs_result.get("abnormal_biomarkers", [])
        stat_orders = labs_result.get("stat_lab_draws_required", [])

        lactate_val = labs.get("Lactate")
        lactate_str = f"{lactate_val} mmol/L" if lactate_val is not None else "NOT TESTED (MISSING)"
        wbc_val = labs.get("WBC")
        wbc_str = f"{wbc_val} x10^3/uL" if wbc_val is not None else "NOT TESTED (MISSING)"
        creat_val = labs.get("Creatinine")
        creat_str = f"{creat_val} mg/dL" if creat_val is not None else "NOT TESTED (MISSING)"
        plat_val = labs.get("Platelets")
        plat_str = f"{plat_val} x10^3/uL" if plat_val is not None else "NOT TESTED (MISSING)"

        prompt = f"""
You are an expert ICU Pathologist and Sepsis Specialist evaluating Model 2 (Labs & Pathology Agent).
Explain the cellular, metabolic, and organ function findings for this patient:

[LABORATORY BIOMARKER SNAPSHOT]
- Serum Lactate: {lactate_str} (Normal < 2.0; Hypoperfusion >= 2.0; Severe Crisis >= 4.0 mmol/L)
- White Blood Cell (WBC): {wbc_str} (Normal 4.0 - 11.0; Leukocytosis >= 12.0)
- Serum Creatinine: {creat_str} (Normal 0.6 - 1.2 mg/dL; Acute Kidney Injury >= 1.6)
- Platelet Count: {plat_str} (Normal 150 - 400; Thrombocytopenia < 100)

[MODEL 2 LABS PREDICTION NUMBERS]
- ML Laboratory Sepsis Probability: {prob_pct:.1f}% ({prob:.4f})
- Organ Stress Classification: {stress_level}
- Acute Abnormal Biomarkers Identified: {abnormal}
- STAT Lab Orders Pending/Recommended: {stat_orders}

[TOP 5 SHAP FEATURE CONTRIBUTIONS]
{top_shap_str}

[CLINICAL & SAFETY RULES]
1. MARTHA'S RULE / SEPSIS-3 MANDATE: Normal or uncollected laboratory results must NEVER be used to rule out sepsis! Cellular biochemical markers frequently lag clinical microvascular deterioration by 2-6 hours.
2. If Serum Lactate is missing, immediately flag an imperative order for STAT Lactate.
3. If Lactate is >= 2.0, identify cellular hypoxia and anaerobic glycolysis.
4. Assess end-organ function: Renal (Creatinine), Hematologic (Platelets/DIC risk), Immune (WBC).

Return ONLY a valid JSON object with the following exact keys:
{{
  "organ_stress_level": "NORMAL_HOMEOSTASIS" | "MODERATE_HYPOXIA" | "SEVERE_ORGAN_DYSFUNCTION" | "UNASSESSED_MISSING_LABS",
  "cellular_hypoxia_grade": "NORMAL_AEROBIC_RESPIRATION" | "TISSUE_HYPOPERFUSION" | "ANAEROBIC_GLYCOLYSIS_CRISIS" | "UNASSESSED_MISSING_DATA",
  "freshness_status": "FRESH_EVIDENCE" | "STALE_EVIDENCE" | "MISSING_CRITICAL_LABS",
  "safety_notice": "Clear Martha's Rule statement regarding lab timing lag or missing critical biomarkers",
  "stat_orders_recommended": ["list of STAT diagnostic lab orders needed"],
  "abnormal_biomarkers": ["list of abnormal flags with units"],
  "shap_summary": "1-2 sentence clinical interpretation of which lab features contributed most to the risk calculation",
  "pathology_summary": "2-3 sentence intensivist synthesis detailing metabolic status, organ stress, and cellular oxygen debt",
  "clinical_reasoning": "2-3 sentence narrative summarizing clinical imperatives for bedside staff"
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
                {"role": "system", "content": "You are a clinical pathology specialist answering in strict JSON."},
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

    def _neuro_symbolic_fallback(self, labs_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deterministic, rule-based clinical engine adhering to Sepsis-3 definitions,
        metabolic cellular hypoxia, and Martha's Rule diagnostic safety protocols.
        """
        prob = float(labs_result.get("labs_risk_probability", 0.0))
        labs = labs_result.get("labs_snapshot", {})
        shap_contributions = labs_result.get("shap_contributions", {})

        lactate = labs.get("Lactate")
        wbc = labs.get("WBC")
        creatinine = labs.get("Creatinine")
        platelets = labs.get("Platelets")

        orders = list(labs_result.get("stat_lab_draws_required", []))
        abnormal = list(labs_result.get("abnormal_biomarkers", []))

        # 1. Freshness & Confidence
        critical_present = sum(1 for v in [lactate, wbc] if v is not None)
        other_present = sum(1 for v in [creatinine, platelets] if v is not None)

        if critical_present == 2 and other_present == 2:
            freshness = "FRESH_EVIDENCE"
            confidence = 0.95
        elif critical_present >= 1:
            freshness = "FRESH_EVIDENCE"
            confidence = 0.70
        else:
            freshness = "MISSING_CRITICAL_LABS"
            confidence = 0.35

        # 2. Cellular Hypoxia Staging
        if lactate is None:
            hypoxia_grade = "UNASSESSED_MISSING_DATA"
            if not any("Lactate" in o for o in orders):
                orders.insert(0, "STAT Blood Lactate (Martha's Rule)")
        elif lactate >= 4.0:
            hypoxia_grade = "ANAEROBIC_GLYCOLYSIS_CRISIS"
            if not any("Lactate" in o for o in orders):
                orders.insert(0, "Serial Blood Lactate q2h (Resuscitation Clearance Protocol)")
        elif lactate >= 2.0:
            hypoxia_grade = "TISSUE_HYPOPERFUSION"
            if not any("Lactate" in o for o in orders):
                orders.append("Repeat Lactate in 2-4 Hours")
        else:
            hypoxia_grade = "NORMAL_AEROBIC_RESPIRATION"

        # 3. Organ Stress Level
        if prob >= 0.60 or (lactate and lactate >= 4.0) or (creatinine and creatinine >= 2.0) or (platelets and platelets < 100.0):
            stress_level = "SEVERE_ORGAN_DYSFUNCTION"
        elif prob >= 0.30 or (lactate and lactate >= 2.0) or (wbc and wbc >= 12.0):
            stress_level = "MODERATE_HYPOXIA"
        elif lactate is None and wbc is None:
            stress_level = "UNASSESSED_MISSING_LABS"
        else:
            stress_level = "NORMAL_HOMEOSTASIS"

        # 4. Safety Notice (Crucial Rule: Normal/missing labs do NOT rule out sepsis)
        if lactate is None:
            safety_notice = (
                "MARTHA'S RULE SAFETY NOTICE: Serum lactate has NOT been drawn. "
                "Normal or missing laboratory results must NEVER be interpreted as absence of sepsis. "
                "Immediate STAT lactate draw is mandatory if vitals reflect physiological strain."
            )
        elif lactate < 2.0 and not abnormal:
            safety_notice = (
                "MARTHA'S RULE SAFETY NOTICE: Current biomarkers are within normal range (Lactate < 2.0 mmol/L). "
                "However, biochemical cellular markers can lag behind microvascular hypoperfusion by 2 to 6 hours. "
                "Normal labs must NOT automatically rule out occult evolving sepsis."
            )
        else:
            safety_notice = (
                "Biomarker evidence active: Sepsis-3 cellular hypoperfusion / organ dysfunction markers identified."
            )

        # 5. SHAP summary
        if shap_contributions:
            top_drivers = list(shap_contributions.items())[:3]
            pos_drivers = [f"{k} (+{v:.2f})" for k, v in top_drivers if v > 0]
            if pos_drivers:
                shap_summary = f"Biomarker risk heavily driven by: {', '.join(pos_drivers)}."
            else:
                shap_summary = "Laboratory values remain primarily within reference boundaries, exerting downward risk weight."
        else:
            shap_summary = f"Risk driven primarily by Lactate ({lactate if lactate is not None else 'Missing'}) and WBC."

        # 6. Pathology Narrative Synthesis
        narrative_parts = []
        narrative_parts.append(
            f"Labs Agent assessed Laboratory Sepsis Probability at {prob*100:.1f}% ({stress_level}) "
            f"with confidence {confidence*100:.0f}% ({freshness})."
        )

        if abnormal:
            narrative_parts.append(f"Identified {len(abnormal)} acute biomarker warning(s): {'; '.join(abnormal)}.")
        elif freshness == "MISSING_CRITICAL_LABS":
            narrative_parts.append(
                "Diagnostic Blind Spot: Critical blood pathology (Lactate / WBC) is uncollected. "
                "Relying solely on existing lab records introduces severe clinical false-negative risk."
            )
        else:
            narrative_parts.append(
                "Blood pathology panel shows preserved homeostasis. "
                "Note: Early septic shock may maintain normal lactate prior to microcirculatory uncoupling."
            )

        if creatinine is not None and creatinine >= 1.6:
            narrative_parts.append(f"Elevated creatinine ({creatinine:.2f} mg/dL) corroborates acute kidney injury (AKI).")
        if platelets is not None and platelets < 100.0:
            narrative_parts.append(f"Thrombocytopenia ({platelets:.0f} x10^3/uL) indicates consumptive microvascular coagulopathy.")
        if wbc is not None and wbc >= 12.0:
            narrative_parts.append(f"Leukocytosis (WBC {wbc:.1f} x10^3/uL) reflects active systemic inflammatory mobilization.")

        if orders:
            narrative_parts.append(f"Recommended diagnostic orders: {'; '.join(orders)}.")

        pathology_summary = " ".join(narrative_parts)
        clinical_reasoning = f"Organ stress classified as {stress_level.replace('_', ' ').title()} (Lab Risk: {prob*100:.1f}%). {pathology_summary}"

        return {
            "confidence": confidence,
            "organ_stress_level": stress_level,
            "cellular_hypoxia_grade": hypoxia_grade,
            "freshness_status": freshness,
            "safety_notice": safety_notice,
            "stat_orders_recommended": orders,
            "abnormal_biomarkers": abnormal,
            "shap_summary": shap_summary,
            "pathology_summary": pathology_summary,
            "clinical_reasoning": clinical_reasoning
        }

    def explain(self, labs_result: Dict[str, Any]) -> LabsEvidenceReport:
        """
        Synthesizes Model 2 predictions into an authoritative LabsEvidenceReport.
        """
        prob = float(labs_result.get("labs_risk_probability", 0.0))
        stress = str(labs_result.get("organ_stress_level", "NORMAL_HOMEOSTASIS"))
        shap_contribs = dict(labs_result.get("shap_contributions", {}))
        snapshot = dict(labs_result.get("labs_snapshot", {}))
        now_iso = datetime.now(timezone.utc).isoformat()

        prompt = self.build_clinical_prompt(labs_result)
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

        fallback = self._neuro_symbolic_fallback(labs_result)
        if not llm_response:
            llm_response = fallback
            source = "neuro_symbolic_clinical_rules"

        # Merge fallback safety-critical values if not provided by LLM
        confidence = float(llm_response.get("confidence", fallback["confidence"]))
        safety_notice = str(llm_response.get("safety_notice", fallback["safety_notice"]))
        freshness_status = str(llm_response.get("freshness_status", fallback["freshness_status"]))
        stat_orders = list(llm_response.get("stat_orders_recommended", fallback["stat_orders_recommended"]))

        # Enforce Martha's rule in stat orders
        lactate = snapshot.get("Lactate")
        if lactate is None and not any("Lactate" in o for o in stat_orders):
            stat_orders.insert(0, "STAT Blood Lactate (Martha's Rule)")

        return LabsEvidenceReport(
            agent_name="Labs Agent",
            timestamp=now_iso,
            confidence=confidence,
            organ_stress_level=str(llm_response.get("organ_stress_level", stress)),
            lab_probability=round(prob, 4),
            cellular_hypoxia_grade=str(llm_response.get("cellular_hypoxia_grade", fallback["cellular_hypoxia_grade"])),
            freshness_status=freshness_status,
            safety_notice=safety_notice,
            stat_orders_recommended=stat_orders,
            abnormal_biomarkers=list(llm_response.get("abnormal_biomarkers", labs_result.get("abnormal_biomarkers", []))),
            shap_summary=str(llm_response.get("shap_summary", fallback["shap_summary"])),
            pathology_summary=str(llm_response.get("pathology_summary", fallback["pathology_summary"])),
            clinical_reasoning=str(llm_response.get("clinical_reasoning", fallback["clinical_reasoning"])),
            shap_contributions=shap_contribs,
            labs_snapshot=snapshot,
            llm_source=source
        )
