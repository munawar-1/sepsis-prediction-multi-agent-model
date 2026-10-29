"""
Model 3 (Skeptic Agent): Reasoning Agent
Generates an adversarial critique explaining why an alert should be suppressed
or why it cannot be explained away by benign clinical factors.
"""

from pydantic import BaseModel, Field
from typing import List

class SkepticEvidenceReport(BaseModel):
    alarm_suppression_recommended: bool = Field(description="True if alarm is a confirmed benign false positive")
    confidence_discount_factor: float = Field(description="Factor between 0.0 (no discount) and 1.0 (complete discount)")
    detected_confounders: List[str] = Field(description="e.g. ['Albuterol administered 25m ago (Known HR spike of +20 bpm)']")
    discordance_rationale: str = Field(description="Analysis of vital vs lab concordance/discordance")
    alert_fatigue_risk: str = Field(description="'HIGH_FALSE_ALARM_RISK' or 'GENUINE_CRITICAL_EVENT'")

class SkepticReasoningAgent:
    def __init__(self):
        pass

    def explain(self, skeptic_eval: dict) -> SkepticEvidenceReport:
        pass
