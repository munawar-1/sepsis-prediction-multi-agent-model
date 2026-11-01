"""
Model 2 (Labs Agent): Clinical Reasoning Agent
Translates lab metrics, cellular hypoxia markers, and STAT test orders into
a structured clinical report adhering to Sepsis-3 guidelines and Martha's Rule.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

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


class LabsEvidenceReport(BaseModel):
    agent_name: str = "Labs Agent"
    timestamp: str
    confidence: float = Field(description="Confidence in laboratory assessment (0.0 to 1.0) based on biomarker availability")
    organ_stress_level: str = Field(description="'NORMAL_HOMEOSTASIS', 'MODERATE_HYPOXIA', 'SEVERE_ORGAN_DYSFUNCTION', or 'UNASSESSED_MISSING_LABS'")
    lab_probability: float = Field(description="Probability of lab-confirmed sepsis/organ failure")
    freshness_status: str = Field(description="'FRESH_EVIDENCE', 'STALE_EVIDENCE', or 'MISSING_CRITICAL_LABS'")
    safety_notice: str = Field(description="Clinical guardrail: Normal or missing labs must never rule out sepsis")
    stat_orders_recommended: List[str] = Field(description="STAT lab escalations required (e.g. STAT Serum Lactate)")
    abnormal_biomarkers: List[str] = Field(description="e.g. ['Severe Lactic Acidosis: 4.2 mmol/L']")
    pathology_summary: str = Field(description="Comprehensive intensivist synthesis of cellular/organ state")
    shap_contributions: Dict[str, float]
    labs_snapshot: Dict[str, Any]


class LabsReasoningAgent:
    """
    Reasoning engine for Labs Agent.
    Enforces Martha's Rule and Surviving Sepsis Campaign diagnostic protocols.
    """
    def __init__(self):
        pass

    def explain(self, prediction_result: dict) -> LabsEvidenceReport:
        prob = float(prediction_result.get("labs_risk_probability", 0.0))
        stress = str(prediction_result.get("organ_stress_level", "NORMAL_HOMEOSTASIS"))
        stat_orders = list(prediction_result.get("stat_lab_draws_required", []))
        abnormal = list(prediction_result.get("abnormal_biomarkers", []))
        shap_contribs = dict(prediction_result.get("shap_contributions", {}))
        snapshot = dict(prediction_result.get("labs_snapshot", {}))
        now_iso = datetime.now(timezone.utc).isoformat()

        lactate = snapshot.get("Lactate")
        wbc = snapshot.get("WBC")
        creat = snapshot.get("Creatinine")
        plat = snapshot.get("Platelets")

        # 1. Freshness & Confidence Calculation
        critical_present = sum(1 for v in [lactate, wbc] if v is not None)
        other_present = sum(1 for v in [creat, plat] if v is not None)

        if critical_present == 2 and other_present == 2:
            freshness = "FRESH_EVIDENCE"
            confidence = 0.95
        elif critical_present >= 1:
            freshness = "FRESH_EVIDENCE"
            confidence = 0.70
        else:
            freshness = "MISSING_CRITICAL_LABS"
            confidence = 0.35

        # 2. Safety Notice (Crucial Rule: Normal/missing labs do NOT rule out sepsis)
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

        # 3. Pathology Narrative Synthesis
        narrative_parts = []
        narrative_parts.append(
            f"Labs Agent assessed Laboratory Sepsis Probability at {prob*100:.1f}% ({stress}) "
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

        if stat_orders:
            narrative_parts.append(f"Recommended diagnostic orders: {'; '.join(stat_orders)}.")

        pathology_summary = " ".join(narrative_parts)

        return LabsEvidenceReport(
            agent_name="Labs Agent",
            timestamp=now_iso,
            confidence=confidence,
            organ_stress_level=stress,
            lab_probability=round(prob, 4),
            freshness_status=freshness,
            safety_notice=safety_notice,
            stat_orders_recommended=stat_orders,
            abnormal_biomarkers=abnormal,
            pathology_summary=pathology_summary,
            shap_contributions=shap_contribs,
            labs_snapshot=snapshot
        )
