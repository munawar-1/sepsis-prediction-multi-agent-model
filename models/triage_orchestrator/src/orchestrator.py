"""
Multi-Agent Sepsis Triage Orchestrator (Aegis-ICU)
Coordinates the 3 clinical intelligence agents and the Hybrid Data Validator:
- Tool: DataValidator (Sub-millisecond sensor integrity check & Nurse alert dispatch)
- Model 1: Vitals Agent (Predictor & Neuro-Symbolic LLM Reasoning)
- Model 2: Labs Agent (Predictor & Pathology Reasoning, Martha's Rule)
- Model 3: Skeptic Agent (False Alarm Filter & Medication Confounder Analysis - Gated)
Synthesizes calibrated composite risk and Human-in-the-Loop (HITL) action bundles.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

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

from models.triage_orchestrator.src.data_validator import DataValidator, ValidationResult
from models.vitals_agent.src.predictor import VitalsPredictor
from models.labs_agent.src.predictor import LabsPredictor
from models.skeptic_agent.src.predictor import SkepticPredictor
from models.triage_orchestrator.src.ensemble_model import MetaEnsembleClassifier
from models.triage_orchestrator.src.hitl_recommender import generate_action_bundle


class UnifiedSepsisEvaluation(BaseModel):
    patient_id: str
    hour_index: int
    urgency_level: str = Field(description="'LOW', 'MODERATE', 'CRITICAL_SEPSIS', or 'HARDWARE_SENSOR_FAULT'")
    composite_sepsis_risk: float = Field(description="Calibrated composite probability between 0.0 and 1.0")
    news2_score: int
    shock_index: float
    discrepancy_detected: bool = Field(description="True if AI detects early deterioration while NEWS2 is low")
    target_role: str = Field(default="ROLE_DOCTOR", description="'ROLE_NURSE' for equipment alerts; 'ROLE_DOCTOR' for clinical alerts")
    sensor_valid: bool = Field(default=True, description="True if telemetry passed hardware validation")
    data_quality_evidence: Optional[Dict[str, Any]] = Field(default=None)
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
        self.validator = DataValidator(
            gemini_api_key=gemini_api_key,
            openai_api_key=openai_api_key,
            ollama_base_url=ollama_base_url,
            ollama_model=ollama_model
        )
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
        Executes gated multi-agent triage:
        0. Data Validator Tool screens for physical hardware/sensor faults.
           -> If broken: Early abort, route directly to ROLE_NURSE without false doctor alert.
        1. Agent 1 (Vitals) predicts hemodynamics, shock index, and NEWS2 blindspots.
        2. Agent 2 (Labs) evaluates cellular hypoxia, organ stress, and Martha's rule.
        3. Risk Gate: If either model detects risk -> invoke Agent 3 (Skeptic Filter).
           -> If both models are normal -> bypass Skeptic (saves 50% compute/latency).
        4. Synthesize final clinical composite verdict & HITL action bundle for ROLE_DOCTOR.
        """
        now_iso = datetime.now(timezone.utc).isoformat()

        # -------------------------------------------------------------
        # STEP 0: SENSOR & HARDWARE VALIDATION (Fail-Fast Gate)
        # -------------------------------------------------------------
        val_res: ValidationResult = self.validator.validate(
            current_vitals=vitals_dict,
            previous_vitals=previous_vitals,
            lab_age_hours=lab_age_hours
        )

        if not val_res.is_valid:
            # Immediate fail-fast: Alert Nurse, abort clinical sepsis alarm
            return UnifiedSepsisEvaluation(
                patient_id=patient_id,
                hour_index=hour,
                urgency_level="HARDWARE_SENSOR_FAULT",
                composite_sepsis_risk=0.0,
                news2_score=0,
                shock_index=0.0,
                discrepancy_detected=False,
                target_role="ROLE_NURSE",
                sensor_valid=False,
                data_quality_evidence={
                    "is_valid": False,
                    "fault_type": val_res.fault_type,
                    "alert_title": val_res.alert_title,
                    "bedside_action": val_res.bedside_action,
                    "clinical_explanation": val_res.clinical_explanation,
                    "detected_anomalies": val_res.detected_anomalies
                },
                vitals_evidence={"telemetry_snapshot": vitals_dict, "sensor_fault": val_res.fault_type},
                labs_evidence={"labs_snapshot": labs_dict},
                skeptic_evidence={"alarm_suppression_recommended": True, "recommended_action": "VERIFY_BEDSIDE_HARDWARE"},
                agent_findings=[{
                    "agent_name": "Data Validator Tool",
                    "timestamp": now_iso,
                    "confidence": 0.99,
                    "target_role": "ROLE_NURSE",
                    "fault_type": val_res.fault_type,
                    "alert_title": val_res.alert_title,
                    "bedside_action": val_res.bedside_action,
                    "clinical_explanation": val_res.clinical_explanation
                }],
                agent_disagreements=[],
                recommended_action_bundle=[{
                    "order_id": f"BEDSIDE_{val_res.fault_type}",
                    "name": val_res.bedside_action,
                    "category": "BEDSIDE_HARDWARE",
                    "status": "REQUIRED",
                    "evidence_rationale": val_res.clinical_explanation
                }],
                evidence_chain_narrative=f"[NURSE ALERT - {val_res.alert_title}]: {val_res.clinical_explanation} Bedside Task: {val_res.bedside_action}",
                requires_hitl_action=False
            )

        # -------------------------------------------------------------
        # STEP 1: PARALLEL ASSESSMENT (Vitals & Labs)
        # -------------------------------------------------------------
        # Agent 1: Vitals
        vitals_res = self.vitals_predictor.predict(vitals_dict)
        p_v = vitals_res["vitals_risk_probability"]
        shock_index = vitals_res["shock_index"]
        news2 = vitals_res["news2_score"]
        resp_rate = vitals_dict.get("Resp", 18.0) or 18.0

        # Agent 2: Labs
        labs_res = self.labs_predictor.predict(labs_dict)
        p_l = labs_res["labs_risk_probability"]
        has_fresh_labs = (labs_dict.get("Lactate") is not None) or (labs_dict.get("WBC") is not None)

        # -------------------------------------------------------------
        # STEP 2: GATED RISK CHECK (Call Skeptic only if risk flagged)
        # -------------------------------------------------------------
        has_elevated_risk = (p_v >= 0.30 or p_l >= 0.30 or shock_index >= 0.80 or news2 >= 4)

        if has_elevated_risk:
            combined_ehr = ehr_data if ehr_data else {"medications": meds_list or []}
            skeptic_res = self.skeptic_predictor.evaluate_false_alarm(
                vitals_result=vitals_res,
                labs_result=labs_res,
                ehr_data=combined_ehr
            )
            discount = skeptic_res["confidence_discount_factor"]
        else:
            # Low Risk: Skip heavy Skeptic LLM, saving 50% compute/latency
            skeptic_res = {
                "agent_name": "Skeptic Agent",
                "timestamp": now_iso,
                "confidence": 1.0,
                "classification": "UNCONTESTED_NORMAL",
                "recommended_action": "ROUTINE_MONITORING",
                "alarm_suppression_recommended": False,
                "confidence_discount_factor": 0.0,
                "detected_confounders": [],
                "clinical_reasoning": "Vitals and laboratory parameters reflect baseline physiological stability. False alarm analysis bypassed.",
                "llm_source": "gated_skip"
            }
            discount = 0.0

        # -------------------------------------------------------------
        # STEP 3: AGENT FINDINGS & DISAGREEMENTS
        # -------------------------------------------------------------
        agent_findings = [
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

        disagreements = []

        # Disagreement A: Vitals vs Labs Discordance (Occult Sepsis / Martha's Rule)
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
                    "Sepsis alert remains ACTIVE (STAND_ALERT). Confounder context is transparently displayed to bedside "
                    "clinicians so they are aware of drug-induced tachycardia without missing underlying sepsis."
                ),
                "resolution_strategy": (
                    "Maintain active sepsis monitoring and serial bedside evaluation. Do not discontinue sepsis therapy "
                    "solely due to beta-agonist or chronotropic medication."
                )
            })

        # -------------------------------------------------------------
        # STEP 4: META-ENSEMBLE CONSENSUS & COMPOSITE RISK
        # -------------------------------------------------------------
        raw_composite = self.ensemble.compute_composite_risk(
            p_vitals=p_v,
            p_labs=p_l,
            discount=discount,
            has_fresh_labs=has_fresh_labs,
            shock_index=shock_index,
            resp_rate=resp_rate
        )

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

        if any(d["disagreement_type"] == "VITALS_LABS_DISCORDANCE" for d in disagreements):
            bundle.insert(0, {
                "order_id": "STAT_LAB_OCCULT_SEPSIS",
                "name": "STAT Blood Lactate & Blood Cultures (Martha's Rule)",
                "category": "DIAGNOSTIC",
                "status": "RECOMMENDED",
                "evidence_rationale": "Compensated shock / tachypnea detected while lab results are uncollected or normal."
            })

        # Synthesized Evidence Chain Narrative
        v_reason = vitals_res.get("clinical_reasoning") or vitals_res.get("clinical_explanation") or f"Shock Index: {shock_index:.2f}, NEWS2: {news2}"
        l_reason = labs_res.get("clinical_reasoning") or labs_res.get("pathology_summary") or f"Organ Stress: {labs_res.get('organ_stress_level')}"
        s_reason = skeptic_res.get("clinical_reasoning") or skeptic_res.get("recommended_action") or "Skeptic evaluated alert validity."

        narrative_parts = [
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
        discrepancy = (composite_risk >= 0.40 and news2 < 5)

        return UnifiedSepsisEvaluation(
            patient_id=patient_id,
            hour_index=hour,
            urgency_level=urgency,
            composite_sepsis_risk=composite_risk,
            news2_score=news2,
            shock_index=shock_index,
            discrepancy_detected=discrepancy,
            target_role="ROLE_DOCTOR",
            sensor_valid=True,
            data_quality_evidence={
                "is_valid": True,
                "clinical_explanation": "All core vital signals verified and physically plausible."
            },
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

    # Test 1: Slipped clip -> Nurse alert directly
    slipped_clip_vitals = {"HR": 72.0, "SBP": 118.0, "DBP": 78.0, "Resp": 14.0, "O2Sat": 68.0}
    res_clip = orchestrator.evaluate("p_sensor_fault", 1, slipped_clip_vitals, {}, [])
    print(f"\n[Test 1] Slipped Clip -> Urgency: {res_clip.urgency_level}, Target: {res_clip.target_role}")
    print(f"         Bedside Action: {res_clip.recommended_action_bundle[0]['name']}")

    # Test 2: Sepsis Patient -> Doctor alert with action bundle
    sample_vitals = {"HR": 108.0, "SBP": 122.0, "MAP": 80.0, "Resp": 22.0, "O2Sat": 96.0, "Temp": 37.8}
    sample_labs = {"Lactate": 1.1, "WBC": 7.0, "Creatinine": 0.9, "Platelets": 230.0}
    sample_meds = ["Albuterol 0.83 mg/mL Inhalation Solution"]

    res_sepsis = orchestrator.evaluate("p000011", 2, sample_vitals, sample_labs, sample_meds)
    print(f"\n[Test 2] Sepsis Patient -> Urgency: {res_sepsis.urgency_level}, Target: {res_sepsis.target_role}")
    print(f"         Composite Risk : {res_sepsis.composite_sepsis_risk*100:.1f}%")
    print(f"         Action Orders  : {len(res_sepsis.recommended_action_bundle)}")
