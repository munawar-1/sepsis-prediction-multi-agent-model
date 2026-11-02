"""
Model 2 (Labs Agent): Clinical Reasoning Agent
Translates blood pathology, cellular hypoxia markers, and STAT test orders into
an intensivist-level diagnostic report using an LLM
(with a deterministic Neuro-Symbolic clinical fallback engine).
"""

import os
import json
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
    def Field(default=None, description=""):
        return default

import requests


class LabsEvidenceReport(BaseModel):
    organ_stress_level: str = Field(description="'NORMAL_HOMEOSTASIS', 'MODERATE_HYPOXIA', 'SEVERE_ORGAN_DYSFUNCTION', or 'UNASSESSED_MISSING_LABS'")
    lab_probability: float = Field(description="Probability of lab-confirmed sepsis/organ failure between 0.0 and 1.0")
    cellular_hypoxia_grade: str = Field(description="'NORMAL_AEROBIC_RESPIRATION', 'TISSUE_HYPOPERFUSION', 'ANAEROBIC_GLYCOLYSIS_CRISIS', or 'UNASSESSED_MISSING_DATA'")
    freshness_status: str = Field(description="'FRESH_EVIDENCE', 'STALE_EVIDENCE', or 'MISSING_LABS'")
    stat_orders_recommended: List[str] = Field(description="e.g. ['STAT Serum Lactate', 'Blood Cultures x 2', 'ABG']")
    abnormal_biomarkers: List[str] = Field(description="e.g. ['Lactate: 3.4 mmol/L (Severe Hypoxia)', 'WBC: 16.2 (Leukocytosis)']")
    shap_summary: str = Field(description="Clinical synthesis of SHAP contributions")
    pathology_summary: str = Field(description="Comprehensive intensivist synthesis of patient metabolic/organ state")
    clinical_reasoning: str = Field(description="Concise 2-3 sentence intensivist narrative summarizing organ dysfunction and lab imperatives")
    llm_source: str = Field(description="Engine or model used for reasoning")


class LabsReasoningAgent:
    """
    Model 2 Reasoning Agent: Translates lab metrics, hypoxia, and organ failure criteria into clinical rationale.
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
You are an expert ICU Pathologist and Critical Care Intensivist auditing Model 2 (Labs & Pathology Agent).
Explain the exact clinical and pathophysiological reasons for the following laboratory predictions:

[PATIENT LAB BIOMARKER SNAPSHOT]
- Serum Lactate: {lactate_str} (Normal < 2.0 mmol/L; >= 2.0 cellular dysoxia; >= 4.0 severe lactic acidosis / septic shock)
- White Blood Cell (WBC): {wbc_str} (Normal 4.0 - 11.0; >= 12.0 leukocytosis / systemic infection; <= 4.0 leukopenia / marrow exhaustion)
- Serum Creatinine: {creat_str} (Normal 0.6 - 1.2 mg/dL; >= 1.6 acute kidney injury)
- Platelet Count: {plat_str} (Normal 150 - 400; < 100 thrombocytopenia / microvascular consumption)

[MODEL 2 PREDICTION NUMBERS]
- Lab-Confirmed Sepsis Probability: {prob_pct:.1f}% ({prob:.4f})
- Organ Stress Level: {stress_level}
- Identified Abnormal Biomarkers: {abnormal if abnormal else 'None (All in normal reference range)'}
- Immediate STAT Lab Draw Escalations: {stat_orders if stat_orders else 'None currently required'}

[TOP SHAP FEATURE CONTRIBUTIONS]
{top_shap_str}

[CLINICAL OBJECTIVE]
Provide an authoritative medical evaluation explaining:
1. Cellular Hypoxia & Metabolic Dysoxia: If lactate is elevated, explain the shift to anaerobic glycolysis due to microvascular hypoperfusion. If missing, emphasize Martha's Rule (uncorroborated telemetry demands immediate blood lactate test).
2. End-Organ Dysfunction (SOFA criteria): Explain renal hypoperfusion (creatinine) and consumptive coagulopathy (platelet depletion).
3. Systemic Immune Response: Explain bone marrow response (leukocytosis vs leukopenia).
4. STAT Diagnostic Orders: Provide rationale for urgent blood draws or repeat testing.

Return ONLY a valid JSON object with the following exact keys:
{{
  "organ_stress_level": "NORMAL_HOMEOSTASIS" | "MODERATE_HYPOXIA" | "SEVERE_ORGAN_DYSFUNCTION" | "UNASSESSED_MISSING_LABS",
  "cellular_hypoxia_grade": "NORMAL_AEROBIC_RESPIRATION" | "TISSUE_HYPOPERFUSION" | "ANAEROBIC_GLYCOLYSIS_CRISIS" | "UNASSESSED_MISSING_DATA",
  "freshness_status": "FRESH_EVIDENCE" | "STALE_EVIDENCE" | "MISSING_LABS",
  "stat_orders_recommended": ["list of STAT diagnostic orders"],
  "abnormal_biomarkers": ["list of abnormal flags"],
  "shap_summary": "1-2 sentence clinical interpretation of which lab features contributed most to the score",
  "pathology_summary": "Comprehensive 2-3 sentence intensivist narrative explaining cellular respiration, organ dysfunction status, and clinical implications",
  "clinical_reasoning": "Concise summary of metabolic and diagnostic status"
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
                {"role": "system", "content": "You are a clinical pathologist answering in strict JSON."},
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
        Deterministic, rule-based clinical engine modeling Surviving Sepsis Campaign,
        SOFA score organ dysfunction thresholds, and Martha's Rule diagnostic escalations.
        """
        prob = labs_result.get("labs_risk_probability", 0.0)
        stress_level = labs_result.get("organ_stress_level", "NORMAL_HOMEOSTASIS")
        abnormal = labs_result.get("abnormal_biomarkers", [])
        stat_orders = labs_result.get("stat_lab_draws_required", [])
        shap_contributions = labs_result.get("shap_contributions", {})
        labs = labs_result.get("labs_snapshot", {})

        lactate = labs.get("Lactate")
        wbc = labs.get("WBC")
        creatinine = labs.get("Creatinine")
        platelets = labs.get("Platelets")

        missing_count = sum(1 for val in [lactate, wbc, creatinine, platelets] if val is None)

        # 1. Freshness & missingness
        if missing_count >= 3:
            freshness = "MISSING_LABS"
        elif missing_count >= 1:
            freshness = "STALE_EVIDENCE"
        else:
            freshness = "FRESH_EVIDENCE"

        # 2. Cellular Hypoxia Grade
        if lactate is None:
            hypoxia_grade = "UNASSESSED_MISSING_DATA"
        elif lactate >= 4.0:
            hypoxia_grade = "ANAEROBIC_GLYCOLYSIS_CRISIS"
        elif lactate >= 2.0:
            hypoxia_grade = "TISSUE_HYPOPERFUSION"
        else:
            hypoxia_grade = "NORMAL_AEROBIC_RESPIRATION"

        # 3. STAT orders escalation
        orders = list(stat_orders)
        if lactate is None and "STAT Blood Lactate (Martha's Rule: Uncorroborated Vitals Strain)" not in orders:
            orders.append("STAT Blood Lactate (Martha's Rule: Uncorroborated Vitals Strain)")
        if lactate is not None and lactate >= 2.0 and "Repeat Serum Lactate in 2-4 hours" not in orders:
            orders.append("Repeat Serum Lactate in 2-4 hours to assess clearance")
        if wbc is not None and (wbc >= 15.0 or wbc <= 4.0) and "Blood Cultures x 2 prior to antibiotics" not in orders:
            orders.append("Blood Cultures x 2 prior to antibiotics")

        # 4. SHAP summary
        if shap_contributions:
            top_drivers = list(shap_contributions.items())[:3]
            pos_drivers = [f"{k} (+{v:.2f})" for k, v in top_drivers if v > 0]
            if pos_drivers:
                shap_summary = f"Lab risk elevated primarily by {', '.join(pos_drivers)}."
            else:
                shap_summary = "Lab biomarkers are within normal limits, driving risk downward."
        else:
            shap_summary = f"Risk aligned with organ stress level ({stress_level})."

        # 5. Comprehensive Pathology Summary
        narrative_parts = []
        if hypoxia_grade == "ANAEROBIC_GLYCOLYSIS_CRISIS":
            narrative_parts.append(
                f"Severe lactic acidosis ({lactate:.1f} mmol/L) demonstrates systemic cellular dysoxia "
                f"and widespread tissue hypoperfusion indicative of septic shock."
            )
        elif hypoxia_grade == "TISSUE_HYPOPERFUSION":
            narrative_parts.append(
                f"Elevated lactate ({lactate:.1f} mmol/L) indicates early occult anaerobic metabolism "
                f"prior to gross circulatory collapse."
            )
        elif hypoxia_grade == "UNASSESSED_MISSING_DATA":
            narrative_parts.append(
                "Critical diagnostic gap: Serum lactate is absent. In accordance with Martha's Rule, "
                "vital signs strain must be corroborated immediately with STAT blood draws."
            )
        else:
            narrative_parts.append(
                f"Serum lactate ({lactate:.1f} mmol/L) is normal, reflecting intact cellular aerobic respiration."
            )

        if creatinine is not None and creatinine >= 1.6:
            narrative_parts.append(f"Elevated creatinine ({creatinine:.2f} mg/dL) corroborates acute kidney injury (AKI).")
        if platelets is not None and platelets < 100.0:
            narrative_parts.append(f"Thrombocytopenia ({platelets:.0f} x10^3/uL) indicates consumptive microvascular coagulopathy.")
        if wbc is not None and wbc >= 12.0:
            narrative_parts.append(f"Leukocytosis (WBC {wbc:.1f} x10^3/uL) reflects active systemic inflammatory mobilization.")

        pathology_summary = " ".join(narrative_parts)

        first_sentence = narrative_parts[0] if narrative_parts else "Biomarkers reflect stable organ homeostasis."
        clinical_reasoning = (
            f"Organ stress classified as {stress_level.replace('_', ' ').title()} "
            f"(Lab Risk: {prob*100:.1f}%). {first_sentence}"
        )

        return {
            "organ_stress_level": stress_level,
            "cellular_hypoxia_grade": hypoxia_grade,
            "freshness_status": freshness,
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

        # 4. Deterministic Clinical Fallback
        if not llm_response:
            llm_response = self._neuro_symbolic_fallback(labs_result)
            source = "neuro_symbolic_clinical_rules"

        llm_response["llm_source"] = source

        return LabsEvidenceReport(
            organ_stress_level=str(llm_response.get("organ_stress_level", stress)),
            lab_probability=round(prob, 4),
            cellular_hypoxia_grade=str(llm_response.get("cellular_hypoxia_grade", "NORMAL_AEROBIC_RESPIRATION")),
            freshness_status=str(llm_response.get("freshness_status", "FRESH_EVIDENCE")),
            stat_orders_recommended=list(llm_response.get("stat_orders_recommended", labs_result.get("stat_lab_draws_required", []))),
            abnormal_biomarkers=list(llm_response.get("abnormal_biomarkers", labs_result.get("abnormal_biomarkers", []))),
            shap_summary=str(llm_response.get("shap_summary", "")),
            pathology_summary=str(llm_response.get("pathology_summary", "")),
            clinical_reasoning=str(llm_response.get("clinical_reasoning", "")),
            llm_source=source
        )
