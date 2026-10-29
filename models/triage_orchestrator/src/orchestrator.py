"""
Model 4 (Triage Orchestrator): Multi-Agent Execution Pipeline
Executes Model 1 (Vitals), Model 2 (Labs), Model 3 (Skeptic), and synthesizes
an auditable Evidence Chain and Action Bundle.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any

from models.triage_orchestrator.src.ensemble_model import MetaEnsembleClassifier
from models.triage_orchestrator.src.hitl_recommender import generate_action_bundle

class UnifiedSepsisEvaluation(BaseModel):
    patient_id: str
    hour_index: int
    urgency_level: str = Field(description="'LOW', 'MODERATE', or 'CRITICAL_SEPSIS'")
    composite_sepsis_risk: float = Field(description="Calibrated composite probability between 0.0 and 1.0")
    news2_score: int
    shock_index: float
    discrepancy_detected: bool = Field(description="True if AI detects early deterioration while NEWS2 is low")
    vitals_evidence: Dict[str, Any]
    labs_evidence: Dict[str, Any]
    skeptic_evidence: Dict[str, Any]
    recommended_action_bundle: List[Dict[str, Any]]
    evidence_chain_narrative: str
    requires_hitl_action: bool

class SepsisOrchestrator:
    def __init__(self):
        self.ensemble = MetaEnsembleClassifier()

    def evaluate(self, patient_id: str, hour: int, vitals_dict: dict, labs_dict: dict, meds_list: list) -> UnifiedSepsisEvaluation:
        # Mock / Skeleton evaluation demonstrating multi-agent synthesis
        shock_index = vitals_dict.get("HR", 80) / max(vitals_dict.get("SBP", 120), 1.0)
        news2 = 3
        p_v = 0.78
        p_l = 0.65
        discount = 0.10
        has_fresh_labs = labs_dict.get("Lactate") is not None
        
        composite_risk = self.ensemble.compute_composite_risk(p_v, p_l, discount, has_fresh_labs)
        urgency = self.ensemble.classify_urgency(composite_risk, shock_index, news2)
        bundle = generate_action_bundle(urgency)

        return UnifiedSepsisEvaluation(
            patient_id=patient_id,
            hour_index=hour,
            urgency_level=urgency,
            composite_sepsis_risk=composite_risk,
            news2_score=news2,
            shock_index=round(shock_index, 2),
            discrepancy_detected=(composite_risk > 0.60 and news2 < 5),
            vitals_evidence={"p_vitals": p_v, "shock_index": shock_index},
            labs_evidence={"p_labs": p_l, "has_fresh_labs": has_fresh_labs},
            skeptic_evidence={"discount": discount, "confounders": []},
            recommended_action_bundle=bundle,
            evidence_chain_narrative="Vitals Agent detected creeping shock index. Labs corroborate metabolic strain. Skeptic found no confounding medications.",
            requires_hitl_action=(urgency in ["MODERATE", "CRITICAL_SEPSIS"])
        )
