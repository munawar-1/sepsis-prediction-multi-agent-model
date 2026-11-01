"""
Model 4 (Triage Orchestrator): Multi-Agent Execution Pipeline
Executes Model 1 (Vitals), Model 2 (Labs), Model 3 (Skeptic False Alarm Filter),
and synthesizes an auditable Evidence Chain and Action Bundle.
"""

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

from models.vitals_agent.src.predictor import VitalsPredictor
from models.labs_agent.src.predictor import LabsPredictor
from models.skeptic_agent.src.predictor import SkepticPredictor
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
    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        ollama_base_url: Optional[str] = None,
        ollama_model: Optional[str] = None
    ):
        self.vitals_predictor = VitalsPredictor()
        self.labs_predictor = LabsPredictor()
        self.skeptic_predictor = SkepticPredictor(
            gemini_api_key=gemini_api_key,
            openai_api_key=openai_api_key,
            ollama_base_url=ollama_base_url,
            ollama_model=ollama_model
        )
        self.ensemble = MetaEnsembleClassifier()


    def evaluate(
        self,
        patient_id: str,
        hour: int,
        vitals_dict: dict,
        labs_dict: dict,
        meds_list: list,
        ehr_data: Optional[Any] = None
    ) -> UnifiedSepsisEvaluation:
        """
        Executes end-to-end multi-agent evaluation:
        1. Agent 1 (Vitals) predicts risk + NEWS2 + SHAP attributions.
        2. Agent 2 (Labs) evaluates organ dysfunction + SHAP attributions + STAT orders.
        3. Agent 3 (Skeptic) cross-references EHR with Agent 1 & 2 SHAP drivers
           to detect false alarms (e.g. Albuterol-induced tachycardia) vs real sepsis.
        4. Model 4 (Orchestrator) combines inputs into calibrated composite risk & Sepsis-3 bundle.
        """
        # 1. Agent 1: Vitals
        vitals_res = self.vitals_predictor.predict(vitals_dict)
        p_v = vitals_res["vitals_risk_probability"]
        shock_index = vitals_res["shock_index"]
        news2 = vitals_res["news2_score"]

        # 2. Agent 2: Labs
        labs_res = self.labs_predictor.predict(labs_dict)
        p_l = labs_res["labs_risk_probability"]
        has_fresh_labs = (labs_dict.get("Lactate") is not None) or (labs_dict.get("WBC") is not None)

        # 3. Agent 3: Skeptic & False Alarm Checker
        # Consolidate EHR data (support meds_list or full ehr_data)
        combined_ehr = ehr_data if ehr_data else {"medications": meds_list or []}
        skeptic_res = self.skeptic_predictor.evaluate_false_alarm(
            vitals_result=vitals_res,
            labs_result=labs_res,
            ehr_data=combined_ehr
        )
        discount = skeptic_res["confidence_discount_factor"]

        # 4. Meta-Ensemble Consensus & Composite Risk
        raw_composite = self.ensemble.compute_composite_risk(p_v, p_l, discount, has_fresh_labs)
        
        # If EHR indicates immunocompromised state, escalate vigilance
        if skeptic_res.get("ehr_risk_modifier") == "ELEVATE_RISK":
            raw_composite = min(1.0, raw_composite + 0.15)

        composite_risk = round(raw_composite, 4)
        urgency = self.ensemble.classify_urgency(composite_risk, shock_index, news2)
        bundle = generate_action_bundle(urgency)

        # Build synthesized evidence chain narrative
        narrative = (
            f"Vitals Agent assessed {p_v*100:.1f}% risk (Shock Index: {shock_index:.2f}, NEWS2: {news2}). "
            f"Labs Agent assessed {p_l*100:.1f}% risk ({labs_res['organ_stress_level']}). "
            f"Skeptic Agent: {skeptic_res['clinical_reasoning']}"
        )

        # Discrepancy detection: AI detects early deterioration while NEWS2 is low
        discrepancy = (composite_risk >= 0.50 and news2 < 5)

        return UnifiedSepsisEvaluation(
            patient_id=patient_id,
            hour_index=hour,
            urgency_level=urgency,
            composite_sepsis_risk=composite_risk,
            news2_score=news2,
            shock_index=shock_index,
            discrepancy_detected=discrepancy,
            vitals_evidence=vitals_res,
            labs_evidence=labs_res,
            skeptic_evidence=skeptic_res,
            recommended_action_bundle=bundle,
            evidence_chain_narrative=narrative,
            requires_hitl_action=(urgency in ["MODERATE", "CRITICAL_SEPSIS"])
        )


if __name__ == "__main__":
    orchestrator = SepsisOrchestrator()

    # Scenario: Patient p000011 received Albuterol for asthma, has tachycardia (HR 108), but normal lactate
    sample_vitals = {"HR": 108.0, "SBP": 120.0, "MAP": 80.0, "Resp": 18.0, "O2Sat": 98.0, "Temp": 36.9}
    sample_labs = {"Lactate": 1.1, "WBC": 7.0, "Creatinine": 0.9, "Platelets": 230.0}
    sample_meds = ["Albuterol 0.83 mg/mL Inhalation Solution"]

    res = orchestrator.evaluate(
        patient_id="p000011",
        hour=2,
        vitals_dict=sample_vitals,
        labs_dict=sample_labs,
        meds_list=sample_meds
    )

    print("\n" + "=" * 65)
    print("      AEGIS-ICU: FULL 4-AGENT ORCHESTRATION PIPELINE")
    print("=" * 65)
    print(f" [+] Patient ID               : {res.patient_id}")
    print(f" [+] Composite Sepsis Risk    : {res.composite_sepsis_risk * 100:.1f}%")
    print(f" [+] Urgency Tier             : {res.urgency_level}")
    print(f" [+] Discrepancy Detected     : {res.discrepancy_detected}")
    print(f" [+] Skeptic Discount (D)     : {res.skeptic_evidence['confidence_discount_factor']}")
    print(f" [+] Skeptic Action           : {res.skeptic_evidence['recommended_action']}")
    print(f" [+] Skeptic Confounders      : {res.skeptic_evidence['detected_confounders']}")
    print("-" * 65)
    print(f" [+] Narrative Synthesis:\n     {res.evidence_chain_narrative}")
    print("=" * 65 + "\n")
