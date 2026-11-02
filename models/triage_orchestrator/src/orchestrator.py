"""
Model 4 (Triage Orchestrator): Multi-Agent Execution Pipeline
Executes Model 1 (Vitals), Model 2 (Labs), Model 3 (Skeptic False Alarm Filter),
and Model 0 (Data Quality Agent).
Synthesizes structured findings, detects transparent disagreements, and generates
an auditable Evidence Chain and Action Bundle adhering strictly to clinical safety rules:
1. Never suppress a sepsis warning solely because medication might explain a symptom.
2. Missing or normal lab results must not automatically rule out sepsis (Martha's Rule).
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

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
        def model_dump(self):
            return self.__dict__
    def Field(default=None, default_factory=None, description=""):
        if default_factory is not None:
            return default_factory()
        return default

import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from models.data_quality_agent.src.quality_checker import DataQualityAgent
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
    data_quality_evidence: Dict[str, Any]
    vitals_evidence: Dict[str, Any]
    labs_evidence: Dict[str, Any]
    skeptic_evidence: Dict[str, Any]
    agent_findings: List[Dict[str, Any]]
    agent_disagreements: List[Dict[str, Any]]
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
        self.data_quality_agent = DataQualityAgent()
        self.vitals_predictor = VitalsPredictor(
            gemini_api_key=gemini_api_key,
            openai_api_key=openai_api_key,
            ollama_base_url=ollama_base_url,
            ollama_model=ollama_model
        )
        self.labs_predictor = LabsPredictor(
            gemini_api_key=gemini_api_key,
            openai_api_key=openai_api_key,
            ollama_base_url=ollama_base_url,
            ollama_model=ollama_model
        )
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
        ehr_data: Optional[Any] = None,
        previous_vitals: Optional[dict] = None,
        lab_age_hours: Optional[float] = None
    ) -> UnifiedSepsisEvaluation:
        """
        Executes end-to-end multi-agent evaluation:
        1. Agent 0 (Data Quality) checks sensor artifacts, missingness, and freshness.
        2. Agent 1 (Vitals) predicts risk + NEWS2 + SHAP attributions + structured findings.
        3. Agent 2 (Labs) evaluates organ dysfunction + SHAP + STAT orders + Martha's rule.
        4. Agent 3 (Skeptic) evaluates EHR confounders while ensuring sepsis warnings are never suppressed.
        5. Orchestrator detects transparent disagreements between agents and resolves them safely.
        6. Synthesizes calibrated composite risk & HITL action bundle.
        """
        # 1. Agent 0: Data Quality & Reliability
        dq_finding = self.data_quality_agent.evaluate(
            vitals_dict=vitals_dict,
            labs_dict=labs_dict,
            hour_index=hour,
            patient_id=patient_id,
            lab_age_hours=lab_age_hours,
            previous_vitals=previous_vitals
        )
        dq_res = dq_finding.model_dump() if hasattr(dq_finding, "model_dump") else dq_finding.dict()

        # 2. Agent 1: Vitals
        vitals_res = self.vitals_predictor.predict(vitals_dict)
        p_v = vitals_res["vitals_risk_probability"]
        shock_index = vitals_res["shock_index"]
        news2 = vitals_res["news2_score"]
        resp_rate = vitals_dict.get("Resp", 18.0) or 18.0

        # 3. Agent 2: Labs
        labs_res = self.labs_predictor.predict(labs_dict)
        p_l = labs_res["labs_risk_probability"]
        has_fresh_labs = (labs_dict.get("Lactate") is not None) or (labs_dict.get("WBC") is not None)

        # 4. Agent 3: Skeptic & False Alarm Checker
        combined_ehr = ehr_data if ehr_data else {"medications": meds_list or []}
        skeptic_res = self.skeptic_predictor.evaluate_false_alarm(
            vitals_result=vitals_res,
            labs_result=labs_res,
            ehr_data=combined_ehr
        )
        discount = skeptic_res["confidence_discount_factor"]

        # 5. Compile Structured Agent Findings with Evidence, Timestamps, and Confidence
        agent_findings = [
            {
                "agent_name": "Data Quality Agent",
                "timestamp": dq_res["timestamp"],
                "confidence": dq_res["confidence"],
                "quality_tier": dq_res["quality_tier"],
                "clinical_narrative": dq_res["clinical_narrative"],
                "evidence": dq_res["evidence"]
            },
            {
                "agent_name": "Vitals Agent",
                "timestamp": vitals_res["timestamp"],
                "confidence": vitals_res["confidence"],
                "risk_level": vitals_res["risk_level"],
                "vitals_risk_probability": vitals_res["vitals_risk_probability"],
                "clinical_explanation": vitals_res["clinical_explanation"],
                "evidence": {
                    "shock_index": vitals_res["shock_index"],
                    "news2_score": vitals_res["news2_score"],
                    "risk_drivers": vitals_res["risk_drivers"]
                }
            },
            {
                "agent_name": "Labs Agent",
                "timestamp": labs_res["timestamp"],
                "confidence": labs_res["confidence"],
                "organ_stress_level": labs_res["organ_stress_level"],
                "labs_risk_probability": labs_res["labs_risk_probability"],
                "safety_notice": labs_res["safety_notice"],
                "pathology_summary": labs_res["pathology_summary"],
                "evidence": {
                    "abnormal_biomarkers": labs_res["abnormal_biomarkers"],
                    "stat_orders": labs_res["stat_lab_draws_required"]
                }
            },
            {
                "agent_name": "Skeptic Agent",
                "timestamp": skeptic_res["timestamp"],
                "confidence": skeptic_res["confidence"],
                "classification": skeptic_res["classification"],
                "recommended_action": skeptic_res["recommended_action"],
                "alarm_suppression_recommended": skeptic_res["alarm_suppression_recommended"],
                "clinical_reasoning": skeptic_res["clinical_reasoning"],
                "evidence": {
                    "detected_confounders": skeptic_res["detected_confounders"],
                    "confidence_discount_factor": skeptic_res["confidence_discount_factor"]
                }
            }
        ]

        # 6. Transparent Disagreement Detection & Resolution
        disagreements = []

        # Disagreement A: Vitals vs Labs Discordance (Occult Sepsis / Martha's Rule)
        # Vitals show deterioration (prob >= 0.40 or shock_index >= 0.75 or Resp >= 22),
        # but Labs biomarkers are normal (NORMAL_HOMEOSTASIS, lactate < 2.0, or zero abnormal biomarkers) or uncollected
        has_normal_or_missing_labs = (
            not has_fresh_labs or
            labs_res.get("organ_stress_level") == "NORMAL_HOMEOSTASIS" or
            len(labs_res.get("abnormal_biomarkers", [])) == 0 or
            (labs_dict.get("Lactate") is not None and float(labs_dict["Lactate"]) < 2.0) or
            p_l < 0.35
        )
        has_elevated_vitals = (p_v >= 0.35 or shock_index >= 0.75 or resp_rate >= 21.0 or news2 >= 4)

        if has_elevated_vitals and has_normal_or_missing_labs:
            disagreements.append({
                "disagreement_type": "VITALS_LABS_DISCORDANCE",
                "agents_involved": ["Vitals Agent", "Labs Agent"],
                "severity": "HIGH",
                "description": (
                    f"Vitals Agent indicates occult hemodynamic deterioration (Risk: {p_v*100:.1f}%, "
                    f"Shock Index: {shock_index:.2f}, Resp: {resp_rate:.0f}/min), whereas Labs Agent reports "
                    f"{'uncollected blood pathology' if not has_fresh_labs else 'normal/compensated biomarkers'} (Tier: {labs_res['organ_stress_level']})."
                ),
                "clinical_rationale": (
                    "Martha's Rule: Microvascular hypoperfusion, tachypnea, and compensated shock precede systemic "
                    "hyperlactatemia by 2 to 6 hours. Normal or missing lab results must NOT automatically rule out sepsis."
                ),
                "resolution_strategy": (
                    "Preserve HIGH/MODERATE urgency derived from vitals. Immediately execute STAT Blood Lactate, "
                    "CBC with differential, and blood cultures while initiating protocolized hemodynamic monitoring."
                )
            })

        # Disagreement B: Vitals vs Skeptic Confounder Conflict
        # Vitals flag risk, but Skeptic identifies a medication confounder (e.g. Albuterol)
        confounders = skeptic_res.get("detected_confounders", [])
        has_drug_confounder = any("Pharmacological" in c or "Confounder" in c for c in confounders)
        if p_v >= 0.40 and has_drug_confounder:
            disagreements.append({
                "disagreement_type": "VITALS_SKEPTIC_DISCORDANCE",
                "agents_involved": ["Vitals Agent", "Skeptic Agent"],
                "severity": "MODERATE",
                "description": (
                    f"Skeptic Agent identified medication confounder ({', '.join(confounders)}), "
                    f"while Vitals Agent flagged significant overall sepsis probability ({p_v*100:.1f}%)."
                ),
                "clinical_rationale": (
                    "Clinical Safety Rule: Never suppress a sepsis warning solely because medication might explain a symptom. "
                    "Non-cardiac vitals (tachypnea, fever, shock index) cannot be attributed to medication alone."
                ),
                "resolution_strategy": (
                    "Sepsis alert remains ACTIVE (STAND_ALERT). Confounder context is transparently displayed to bedside "
                    "clinicians so they are aware of drug-induced tachycardia without missing underlying sepsis."
                )
            })

        # Disagreement C: Data Quality Degradation vs Predictive Scoring
        if dq_res["quality_tier"] in ["UNRELIABLE_SENSOR_ARTIFACT", "DEGRADED_MISSING_DATA"] or dq_res["detected_artifacts"]:
            disagreements.append({
                "disagreement_type": "DATA_QUALITY_DEGRADED_DISCORDANCE",
                "agents_involved": ["Data Quality Agent", "Vitals Agent", "Labs Agent"],
                "severity": "HIGH" if dq_res["detected_artifacts"] else "MODERATE",
                "description": (
                    f"Data Quality Agent flagged telemetry degradation ({dq_res['quality_tier']}): "
                    f"{'; '.join(dq_res['detected_artifacts'] or dq_res['stale_features'])}."
                ),
                "clinical_rationale": (
                    "Algorithmic predictive confidence is diminished when sensor artifacts or missing telemetry "
                    "jeopardize feature reliability."
                ),
                "resolution_strategy": (
                    "Require manual bedside physical vitals check and telemetry lead inspection prior to invasive "
                    "escalation, while proceeding with non-invasive sepsis evaluation."
                )
            })

        # 7. Meta-Ensemble Consensus & Composite Risk
        raw_composite = self.ensemble.compute_composite_risk(
            p_vitals=p_v,
            p_labs=p_l,
            discount=discount,
            has_fresh_labs=has_fresh_labs,
            shock_index=shock_index,
            resp_rate=resp_rate
        )

        # Elevate vigilance if patient is immunocompromised
        if skeptic_res.get("ehr_risk_modifier") == "ELEVATE_RISK":
            raw_composite = min(1.0, raw_composite + 0.15)

        composite_risk = round(raw_composite, 4)
        urgency = self.ensemble.classify_urgency(
            composite_risk=composite_risk,
            shock_index=shock_index,
            news2_score=news2,
            p_vitals=p_v,
            p_labs=p_l
        )
        bundle = generate_action_bundle(urgency)

        # Append STAT lab escalation to action bundle if indicated by disagreements or labs
        if any(d["disagreement_type"] == "VITALS_LABS_DISCORDANCE" for d in disagreements):
            bundle.insert(0, {
                "order_id": "STAT_LAB_OCCULT_SEPSIS",
                "name": "STAT Blood Lactate & Blood Cultures (Martha's Rule)",
                "category": "DIAGNOSTIC",
                "status": "RECOMMENDED",
                "evidence_rationale": "Compensated shock / tachypnea detected while lab results are uncollected or normal."
            })

        # 8. Synthesized Evidence Chain Narrative
        v_reason = vitals_res.get("clinical_reasoning") or vitals_res.get("clinical_explanation") or f"Shock Index: {shock_index:.2f}, NEWS2: {news2}"
        l_reason = labs_res.get("clinical_reasoning") or labs_res.get("pathology_summary") or f"Organ Stress: {labs_res.get('organ_stress_level')}"
        s_reason = skeptic_res.get("clinical_reasoning") or skeptic_res.get("recommended_action") or "Skeptic evaluated alert validity."

        narrative_parts = [
            f"[DATA QUALITY: {dq_res['quality_tier']} ({dq_res['confidence']*100:.0f}% confidence)] {dq_res['clinical_narrative']}",
            f"[VITALS AGENT: {p_v*100:.1f}% risk] Shock Index: {shock_index:.2f}, NEWS2: {news2}. {v_reason}",
            f"[LABS AGENT: {p_l*100:.1f}% risk] Tier: {labs_res.get('organ_stress_level', 'UNKNOWN')}. {l_reason}",
            f"[SKEPTIC AGENT: {skeptic_res.get('classification', 'ANALYZED')}] Action: {skeptic_res.get('recommended_action', 'EVALUATED')}. {s_reason}"
        ]

        if disagreements:
            narrative_parts.append(
                f"[AGENT DISAGREEMENTS ({len(disagreements)})] " +
                " | ".join(f"{d['disagreement_type']}: {d['resolution_strategy']}" for d in disagreements)
            )

        narrative = " ".join(narrative_parts)

        # Discrepancy detection: AI detects early deterioration while NEWS2 is low
        discrepancy = (composite_risk >= 0.40 and news2 < 5)

        return UnifiedSepsisEvaluation(
            patient_id=patient_id,
            hour_index=hour,
            urgency_level=urgency,
            composite_sepsis_risk=composite_risk,
            news2_score=news2,
            shock_index=shock_index,
            discrepancy_detected=discrepancy,
            data_quality_evidence=dq_res,
            vitals_evidence=vitals_res,
            labs_evidence=labs_res,
            skeptic_evidence=skeptic_res,
            agent_findings=agent_findings,
            agent_disagreements=disagreements,
            recommended_action_bundle=bundle,
            evidence_chain_narrative=narrative,
            requires_hitl_action=(urgency in ["MODERATE", "CRITICAL_SEPSIS"])
        )


if __name__ == "__main__":
    orchestrator = SepsisOrchestrator()

    # Scenario: Albuterol given, HR 108, Resp 22 (tachypneic), Shock Index 0.88, Lactate 1.1 (normal)
    # Must NOT suppress alert! Must report VITALS_LABS_DISCORDANCE and VITALS_SKEPTIC_DISCORDANCE.
    sample_vitals = {"HR": 108.0, "SBP": 122.0, "MAP": 80.0, "Resp": 22.0, "O2Sat": 96.0, "Temp": 37.8}
    sample_labs = {"Lactate": 1.1, "WBC": 7.0, "Creatinine": 0.9, "Platelets": 230.0}
    sample_meds = ["Albuterol 0.83 mg/mL Inhalation Solution"]

    res = orchestrator.evaluate(
        patient_id="p000011",
        hour=2,
        vitals_dict=sample_vitals,
        labs_dict=sample_labs,
        meds_list=sample_meds
    )

    print("\n" + "=" * 70)
    print("      AEGIS-ICU: FULL MULTI-AGENT ORCHESTRATION PIPELINE")
    print("=" * 70)
    print(f" [+] Patient ID               : {res.patient_id}")
    print(f" [+] Composite Sepsis Risk    : {res.composite_sepsis_risk * 100:.1f}%")
    print(f" [+] Urgency Tier             : {res.urgency_level}")
    print(f" [+] Discrepancy Detected     : {res.discrepancy_detected}")
    print(f" [+] Data Quality Tier        : {res.data_quality_evidence['quality_tier']}")
    print(f" [+] Skeptic Action           : {res.skeptic_evidence['recommended_action']}")
    print(f" [+] Alarm Suppressed?        : {res.skeptic_evidence['alarm_suppression_recommended']}")
    print("-" * 70)
    print(f" [+] Agent Findings Collected : {len(res.agent_findings)}")
    for f in res.agent_findings:
        print(f"     * {f['agent_name']}: Confidence {f['confidence']*100:.0f}%")
    print("-" * 70)
    print(f" [+] Disagreements Caught     : {len(res.agent_disagreements)}")
    for d in res.agent_disagreements:
        print(f"     ! [{d['disagreement_type']}] Severity: {d['severity']}")
        print(f"       Rationale : {d['clinical_rationale']}")
        print(f"       Resolution: {d['resolution_strategy']}")
    print("-" * 70)
    print(f" [+] Synthesized Narrative:\n     {res.evidence_chain_narrative}")
    print("=" * 70 + "\n")
