"""
Model 1 (Vitals Agent): Clinical Reasoning Agent
Translates hemodynamic features, shock index, NEWS2 score, and SHAP drivers
into an evidence-based clinical reasoning report.
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


class VitalsEvidenceReport(BaseModel):
    agent_name: str = "Vitals Agent"
    timestamp: str
    confidence: float = Field(description="Confidence in prediction integrity (0.0 to 1.0) based on telemetry completeness")
    risk_level: str = Field(description="'LOW', 'MODERATE', or 'CRITICAL_SEPSIS'")
    ml_probability: float
    news2_score: int
    shock_index: float
    discrepancy_flag: bool
    primary_drivers: List[str]
    clinical_explanation: str
    shap_contributions: Dict[str, float]
    telemetry_snapshot: Dict[str, Any]


class VitalsReasoningAgent:
    """
    Reasoning engine for Vitals Agent.
    Synthesizes physiological telemetry, classical NEWS2 scoring, and SHAP attributions.
    """
    def __init__(self):
        pass

    def explain(self, prediction_result: dict) -> VitalsEvidenceReport:
        prob = float(prediction_result.get("vitals_risk_probability", 0.0))
        news2 = int(prediction_result.get("news2_score", 0))
        shock_index = float(prediction_result.get("shock_index", 0.0))
        discrepancy = bool(prediction_result.get("discrepancy_detected", False))
        drivers = list(prediction_result.get("risk_drivers", []))
        shap_contribs = dict(prediction_result.get("shap_contributions", {}))
        snapshot = dict(prediction_result.get("telemetry_snapshot", {}))
        now_iso = datetime.now(timezone.utc).isoformat()

        # Compute confidence based on missingness in snapshot
        core_keys = ["HR", "SBP", "MAP", "Resp", "O2Sat", "Temp"]
        missing_count = sum(1 for k in core_keys if k not in snapshot or snapshot[k] is None)
        confidence = max(0.20, round(1.0 - (missing_count * 0.15), 2))

        # Risk level determination
        if prob >= 0.50 or shock_index >= 1.0:
            risk_level = "CRITICAL_SEPSIS"
        elif prob >= 0.30 or shock_index >= 0.80 or news2 >= 5:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        # Generate Clinical Narrative
        narrative_parts = []
        narrative_parts.append(
            f"Vitals Agent assessed Sepsis Probability at {prob*100:.1f}% ({risk_level}) "
            f"with confidence {confidence*100:.0f}%."
        )

        if shock_index >= 1.0:
            narrative_parts.append(
                f"Severe occult shock identified: Shock Index {shock_index:.2f} (HR/SBP > 1.0), "
                "indicating impending microvascular collapse."
            )
        elif shock_index >= 0.80:
            narrative_parts.append(
                f"Compensated shock pattern: Shock Index {shock_index:.2f} (> 0.70 threshold) reflects systemic stress."
            )

        resp = snapshot.get("Resp")
        if resp and resp >= 22.0:
            narrative_parts.append(
                f"Tachypnea ({resp:.0f} bpm) suggests metabolic acidosis compensation."
            )

        map_val = snapshot.get("MAP")
        if map_val and map_val < 65.0:
            narrative_parts.append(
                f"Hypotension alert: MAP {map_val:.1f} mmHg (< 65 mmHg) compromises end-organ perfusion."
            )

        if discrepancy:
            narrative_parts.append(
                "DISCREPANCY ALERT: AI probability is elevated while classical NEWS2 score is normal/low (<5). "
                "This indicates occult compensated deterioration that traditional score matrices miss."
            )

        clinical_explanation = " ".join(narrative_parts)

        return VitalsEvidenceReport(
            agent_name="Vitals Agent",
            timestamp=now_iso,
            confidence=confidence,
            risk_level=risk_level,
            ml_probability=round(prob, 4),
            news2_score=news2,
            shock_index=round(shock_index, 2),
            discrepancy_flag=discrepancy,
            primary_drivers=drivers,
            clinical_explanation=clinical_explanation,
            shap_contributions=shap_contribs,
            telemetry_snapshot=snapshot
        )
