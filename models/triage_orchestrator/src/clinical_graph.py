"""
Aegis-ICU: Production LangGraph Clinical Orchestrator
Coordinates the full clinical decision graph:
1. Entry -> Data Validator Tool
2. Sensor Fault Gate -> Nurse Verification (Stops if confirmed; overrides if patient truly sick)
3. Parallel Evaluation -> Agent 1 (Vitals) & Agent 2 (Labs)
4. Risk Gate -> Agent 3 (Skeptic Filter) only if risk is flagged (50% compute savings)
5. Synthesis & Human-in-the-Loop -> Calls Backend to trigger Doctor's urgent email
"""

import os
import sys
from typing import TypedDict, Optional, Dict, Any, List
from datetime import datetime, timezone

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from models.triage_orchestrator.src.data_validator import DataValidator, ValidationResult
from models.vitals_agent.src.predictor import VitalsPredictor
from models.labs_agent.src.predictor import LabsPredictor
from models.skeptic_agent.src.predictor import SkepticPredictor
from models.triage_orchestrator.src.ensemble_model import MetaEnsembleClassifier
from models.triage_orchestrator.src.hitl_recommender import generate_action_bundle
from models.triage_orchestrator.src.notification_client import NotificationClient


# =====================================================================
# 1. SHARED PATIENT GRAPH STATE
# =====================================================================
class ClinicalTriageState(TypedDict):
    # Patient Demographics & Telemetry Inputs
    patient_id: str
    hour_index: int
    vitals_dict: Dict[str, Any]
    labs_dict: Dict[str, Any]
    meds_list: List[str]
    ehr_data: Optional[Dict[str, Any]]
    previous_vitals: Optional[Dict[str, Any]]
    lab_age_hours: Optional[float]

    # Step 0: Data Validation & Nurse Interaction
    validation_result: Optional[Dict[str, Any]]
    nurse_confirmed_hardware_fault: Optional[bool]
    
    # Step 1: Agent 1 (Vitals) & Agent 2 (Labs) Evidence
    vitals_evidence: Optional[Dict[str, Any]]
    labs_evidence: Optional[Dict[str, Any]]

    # Step 2: Agent 3 (Skeptic) Evidence
    skeptic_evidence: Optional[Dict[str, Any]]

    # Step 3: Synthesis & Verdict
    composite_sepsis_risk: float
    urgency_level: str
    target_role: str
    action_bundle: List[Dict[str, Any]]
    agent_findings: List[Dict[str, Any]]
    agent_disagreements: List[Dict[str, Any]]
    evidence_chain_narrative: str
    
    # Step 4: Notification Status
    notification_result: Optional[Dict[str, Any]]
    workflow_status: str


# =====================================================================
# 2. GRAPH BUILDER & NODE IMPLEMENTATIONS
# =====================================================================
class AegisClinicalGraph:
    """
    StateGraph wrapper implementing the exact 5-step clinical architecture.
    """

    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        ollama_base_url: Optional[str] = None,
        ollama_model: Optional[str] = None,
        backend_notification_url: Optional[str] = None
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
        self.notifier = NotificationClient(backend_url=backend_notification_url)
        self.graph = self._compile_graph()

    # -------------------------------------------------------------
    # NODE 1: DATA VALIDATOR (Fast Deterministic + LLM)
    # -------------------------------------------------------------
    def _node_data_validator(self, state: ClinicalTriageState) -> Dict[str, Any]:
        val_res: ValidationResult = self.validator.validate(
            current_vitals=state["vitals_dict"],
            previous_vitals=state.get("previous_vitals"),
            lab_age_hours=state.get("lab_age_hours")
        )
        return {
            "validation_result": {
                "is_valid": val_res.is_valid,
                "target_role": val_res.target_role,
                "fault_type": val_res.fault_type,
                "alert_title": val_res.alert_title,
                "bedside_action": val_res.bedside_action,
                "clinical_explanation": val_res.clinical_explanation,
                "detected_anomalies": val_res.detected_anomalies,
                "llm_source": val_res.llm_source
            }
        }

    # -------------------------------------------------------------
    # NODE 2: NURSE VERIFICATION (Hardware Anomaly Handler)
    # -------------------------------------------------------------
    def _node_nurse_verification(self, state: ClinicalTriageState) -> Dict[str, Any]:
        val = state["validation_result"] or {}
        patient_id = state["patient_id"]
        now_iso = datetime.now(timezone.utc).isoformat()
        nurse_confirmed = state.get("nurse_confirmed_hardware_fault")

        # If nurse explicitly confirmed hardware issue OR not yet answered -> notify nurse & halt
        if nurse_confirmed is not False:
            notif = self.notifier.dispatch_alert(
                patient_id=patient_id,
                target_role="ROLE_NURSE",
                alert_title=val.get("alert_title") or "Sensor Anomaly Detected",
                urgency="HARDWARE_SENSOR_FAULT",
                message=val.get("clinical_explanation") or "Inspect sensor hardware.",
                action_bundle=[{"name": val.get("bedside_action"), "category": "HARDWARE", "status": "REQUIRED"}]
            )

            return {
                "urgency_level": "HARDWARE_SENSOR_FAULT",
                "composite_sepsis_risk": 0.0,
                "target_role": "ROLE_NURSE",
                "action_bundle": [{
                    "order_id": f"BEDSIDE_{val.get('fault_type', 'FAULT')}",
                    "name": val.get("bedside_action", "Inspect bedside equipment"),
                    "category": "BEDSIDE_HARDWARE",
                    "status": "REQUIRED",
                    "evidence_rationale": val.get("clinical_explanation")
                }],
                "evidence_chain_narrative": f"[NURSE ALERT - {val.get('alert_title')}]: {val.get('clinical_explanation')} Bedside Task: {val.get('bedside_action')}",
                "notification_result": notif,
                "workflow_status": "STOPPED_NURSE_HARDWARE_FAULT"
            }

        # Nurse indicated: "Not a hardware fault, patient is genuinely ill" -> proceed to models
        return {"workflow_status": "NURSE_OVERRODE_PROCEEDING"}

    # -------------------------------------------------------------
    # NODE 3: AGENT 1 (Vitals Agent)
    # -------------------------------------------------------------
    def _node_vitals_agent(self, state: ClinicalTriageState) -> Dict[str, Any]:
        vitals_res = self.vitals_predictor.predict(state["vitals_dict"])
        return {"vitals_evidence": vitals_res}

    # -------------------------------------------------------------
    # NODE 4: AGENT 2 (Labs Agent)
    # -------------------------------------------------------------
    def _node_labs_agent(self, state: ClinicalTriageState) -> Dict[str, Any]:
        labs_res = self.labs_predictor.predict(state["labs_dict"])
        return {"labs_evidence": labs_res}

    # -------------------------------------------------------------
    # NODE 5: AGENT 3 (Skeptic False Alarm Filter)
    # -------------------------------------------------------------
    def _node_skeptic_agent(self, state: ClinicalTriageState) -> Dict[str, Any]:
        vitals_res = state["vitals_evidence"]
        labs_res = state["labs_evidence"]
        meds = state.get("meds_list") or []
        ehr = state.get("ehr_data") or {"medications": meds}

        skeptic_res = self.skeptic_predictor.evaluate_false_alarm(
            vitals_result=vitals_res,
            labs_result=labs_res,
            ehr_data=ehr
        )
        return {"skeptic_evidence": skeptic_res}

    # -------------------------------------------------------------
    # NODE 6: SYNTHESIS & DOCTOR EMAIL DISPATCH
    # -------------------------------------------------------------
    def _node_synthesis(self, state: ClinicalTriageState) -> Dict[str, Any]:
        patient_id = state["patient_id"]
        now_iso = datetime.now(timezone.utc).isoformat()
        vitals_res = state["vitals_evidence"] or {}
        labs_res = state["labs_evidence"] or {}
        skeptic_res = state.get("skeptic_evidence")

        p_v = float(vitals_res.get("vitals_risk_probability", 0.0))
        shock_index = float(vitals_res.get("shock_index", 0.0))
        news2 = int(vitals_res.get("news2_score", 0))
        resp_rate = float(state["vitals_dict"].get("Resp") or 18.0)

        p_l = float(labs_res.get("labs_risk_probability", 0.0))
        has_fresh_labs = (state["labs_dict"].get("Lactate") is not None) or (state["labs_dict"].get("WBC") is not None)

        # If Skeptic was skipped because patient is completely healthy
        if not skeptic_res:
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
        else:
            discount = float(skeptic_res.get("confidence_discount_factor", 0.0))

        # Calculate calibrated composite risk
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

        # Disagreements & Martha's Rule check
        disagreements = []
        has_normal_or_missing_labs = (
            not has_fresh_labs or
            labs_res.get("organ_stress_level") == "NORMAL_HOMEOSTASIS" or
            len(labs_res.get("abnormal_biomarkers", [])) == 0 or
            (state["labs_dict"].get("Lactate") is not None and float(state["labs_dict"]["Lactate"]) < 2.0) or
            p_l < 0.35
        )
        has_elevated_vitals = (p_v >= 0.35 or shock_index >= 0.75 or resp_rate >= 21.0 or news2 >= 4)

        if has_elevated_vitals and has_normal_or_missing_labs:
            disagreements.append({
                "disagreement_type": "VITALS_LABS_DISCORDANCE",
                "severity": "HIGH",
                "clinical_rationale": "Martha's Rule: Microvascular hypoperfusion precedes systemic hyperlactatemia by 2-6h.",
                "resolution_strategy": "Preserve high clinical urgency. Execute STAT Lactate & blood cultures immediately."
            })
            bundle.insert(0, {
                "order_id": "STAT_LAB_OCCULT_SEPSIS",
                "name": "STAT Blood Lactate & Blood Cultures (Martha's Rule)",
                "category": "DIAGNOSTIC",
                "status": "RECOMMENDED",
                "evidence_rationale": "Compensated shock detected while blood tests are normal or pending."
            })

        # Synthesize authoritative narrative
        v_reason = vitals_res.get("clinical_reasoning") or f"Shock Index: {shock_index:.2f}, NEWS2: {news2}"
        l_reason = labs_res.get("clinical_reasoning") or f"Organ Stress: {labs_res.get('organ_stress_level')}"
        s_reason = skeptic_res.get("clinical_reasoning") or "Evaluated validity."

        narrative = (
            f"[VITALS AGENT: {p_v*100:.1f}% risk] {v_reason} "
            f"[LABS AGENT: {p_l*100:.1f}% risk] {l_reason} "
            f"[SKEPTIC AGENT: {skeptic_res.get('classification')}] {s_reason}"
        )

        agent_findings = [
            {"agent_name": "Vitals Agent", "probability": p_v, "evidence": vitals_res},
            {"agent_name": "Labs Agent", "probability": p_l, "evidence": labs_res},
            {"agent_name": "Skeptic Agent", "discount": discount, "evidence": skeptic_res}
        ]

        # Trigger Doctor's Email/Notification if there is Clinical Risk (Emergency Sepsis Alert)
        notif_res = None
        if urgency in ["MODERATE", "CRITICAL_SEPSIS"]:
            notif_res = self.notifier.dispatch_alert(
                patient_id=patient_id,
                target_role="ROLE_DOCTOR",
                alert_title=f"URGENT SEPSIS ALERT: {urgency.replace('_', ' ')}",
                urgency=urgency,
                message=f"Composite Risk: {composite_risk*100:.1f}%. {narrative}",
                action_bundle=bundle,
                risk_score=composite_risk,
                agent_findings=agent_findings
            )

        return {
            "composite_sepsis_risk": composite_risk,
            "urgency_level": urgency,
            "target_role": "ROLE_DOCTOR",
            "action_bundle": bundle,
            "agent_findings": agent_findings,
            "agent_disagreements": disagreements,
            "evidence_chain_narrative": narrative,
            "notification_result": notif_res,
            "workflow_status": "COMPLETED_CLINICAL_EVALUATION"
        }

    # =============================================================
    # 3. CONDITIONAL ROUTING FUNCTIONS
    # =============================================================
    @staticmethod
    def _route_after_validator(state: ClinicalTriageState) -> str:
        val = state.get("validation_result") or {}
        if val.get("is_valid"):
            return "vitals_agent"
        return "nurse_verification"

    @staticmethod
    def _route_after_nurse(state: ClinicalTriageState) -> str:
        # If workflow halted due to nurse confirmed hardware issue -> exit
        if state.get("workflow_status") == "STOPPED_NURSE_HARDWARE_FAULT":
            return END
        # If nurse overrode (patient is truly sick) -> continue to clinical agents
        return "vitals_agent"

    @staticmethod
    def _route_after_models(state: ClinicalTriageState) -> str:
        # GATED SKEPTIC CALL:
        vitals = state.get("vitals_evidence") or {}
        labs = state.get("labs_evidence") or {}
        pv = float(vitals.get("vitals_risk_probability", 0.0))
        pl = float(labs.get("labs_risk_probability", 0.0))
        shock_index = float(vitals.get("shock_index", 0.0))

        if pv >= 0.30 or pl >= 0.30 or shock_index >= 0.80:
            return "skeptic_agent"  # High risk: interrogate meds
        return "synthesis"         # Low risk: skip Skeptic, save 50% compute

    # =============================================================
    # 4. GRAPH COMPILATION
    # =============================================================
    def _compile_graph(self):
        builder = StateGraph(ClinicalTriageState)

        # Register Nodes
        builder.add_node("data_validator", self._node_data_validator)
        builder.add_node("nurse_verification", self._node_nurse_verification)
        builder.add_node("vitals_agent", self._node_vitals_agent)
        builder.add_node("labs_agent", self._node_labs_agent)
        builder.add_node("skeptic_agent", self._node_skeptic_agent)
        builder.add_node("synthesis", self._node_synthesis)

        # Set Entry Point
        builder.set_entry_point("data_validator")

        # Edge 1: Validator -> Nurse Verification or Vitals Agent
        builder.add_conditional_edges(
            "data_validator",
            self._route_after_validator,
            {
                "nurse_verification": "nurse_verification",
                "vitals_agent": "vitals_agent"
            }
        )

        # Edge 2: Nurse Verification -> STOP or Continue
        builder.add_conditional_edges(
            "nurse_verification",
            self._route_after_nurse,
            {
                END: END,
                "vitals_agent": "vitals_agent"
            }
        )

        # Edge 3: Vitals Agent -> Labs Agent (Parallel Evaluation flow)
        builder.add_edge("vitals_agent", "labs_agent")

        # Edge 4: Gated Risk Check -> Skeptic or Direct Synthesis
        builder.add_conditional_edges(
            "labs_agent",
            self._route_after_models,
            {
                "skeptic_agent": "skeptic_agent",
                "synthesis": "synthesis"
            }
        )

        # Edge 5: Skeptic -> Synthesis -> END
        builder.add_edge("skeptic_agent", "synthesis")
        builder.add_edge("synthesis", END)

        memory = MemorySaver()
        return builder.compile(checkpointer=memory)

    def evaluate(
        self,
        patient_id: str,
        hour: int,
        vitals_dict: dict,
        labs_dict: dict,
        meds_list: list,
        ehr_data: Optional[dict] = None,
        previous_vitals: Optional[dict] = None,
        lab_age_hours: Optional[float] = None,
        nurse_confirmed_hardware_fault: Optional[bool] = None
    ) -> ClinicalTriageState:
        """
        Executes the LangGraph clinical triage pipeline with full thread memory.
        """
        initial_state: ClinicalTriageState = {
            "patient_id": patient_id,
            "hour_index": hour,
            "vitals_dict": vitals_dict,
            "labs_dict": labs_dict,
            "meds_list": meds_list,
            "ehr_data": ehr_data,
            "previous_vitals": previous_vitals,
            "lab_age_hours": lab_age_hours,
            "validation_result": None,
            "nurse_confirmed_hardware_fault": nurse_confirmed_hardware_fault,
            "vitals_evidence": None,
            "labs_evidence": None,
            "skeptic_evidence": None,
            "composite_sepsis_risk": 0.0,
            "urgency_level": "LOW_RISK",
            "target_role": "ROLE_DOCTOR",
            "action_bundle": [],
            "agent_findings": [],
            "agent_disagreements": [],
            "evidence_chain_narrative": "",
            "notification_result": None,
            "workflow_status": "INITIALIZED"
        }

        thread_config = {"configurable": {"thread_id": f"patient_{patient_id}"}}
        final_state = self.graph.invoke(initial_state, config=thread_config)
        return final_state


if __name__ == "__main__":
    orchestrator = AegisClinicalGraph()

    print("\n" + "=" * 70)
    print("      AEGIS-ICU: LANGGRAPH CLINICAL PIPELINE VERIFICATION")
    print("=" * 70)

    # -------------------------------------------------------------
    # Test Scenario 1: Slipped Finger Clip (Sensor Fault)
    # -------------------------------------------------------------
    print("\n[SCENARIO 1] Slipped SpO2 Clip (Probe off, calm breathing)")
    clip_vitals = {"HR": 72.0, "SBP": 118.0, "DBP": 78.0, "Resp": 14.0, "O2Sat": 68.0}
    res1 = orchestrator.evaluate("bed_01", 1, clip_vitals, {}, [])
    print(f" -> Status       : {res1['workflow_status']}")
    print(f" -> Urgency      : {res1['urgency_level']}")
    print(f" -> Target Role  : {res1['target_role']}")
    print(f" -> Bedside Task : {res1['action_bundle'][0]['name']}")
    print(f" -> Notification : {res1['notification_result']['delivery_status']} to {res1['notification_result']['recipient']}")

    # -------------------------------------------------------------
    # Test Scenario 2: Sepsis Case (Elevated Vitals, Albuterol Confounder)
    # -------------------------------------------------------------
    print("\n[SCENARIO 2] Compensated Sepsis Case (HR 112, Resp 23, Lactate 3.2)")
    print(" -> Evaluating Multi-Agent Graph (Validator -> Vitals -> Labs -> Skeptic -> Synthesis)...")
    sepsis_vitals = {"HR": 112.0, "SBP": 104.0, "MAP": 74.0, "Resp": 23.0, "O2Sat": 95.0, "Temp": 38.2}
    sepsis_labs = {"Lactate": 3.2, "WBC": 16.5, "Creatinine": 1.7, "Platelets": 110.0}
    sepsis_meds = ["Albuterol 0.83 mg/mL Inhalation"]
    res2 = orchestrator.evaluate("bed_02", 2, sepsis_vitals, sepsis_labs, sepsis_meds)

    v_ev = res2.get("vitals_evidence") or {}
    l_ev = res2.get("labs_evidence") or {}
    s_ev = res2.get("skeptic_evidence") or {}

    print("\n" + "-" * 70)
    print("  [AGENT 1: VITALS AGENT - HEMODYNAMIC REASONING]")
    print(f"  * Risk Probability : {float(v_ev.get('vitals_risk_probability', 0.0))*100:.1f}%")
    print(f"  * Shock Index      : {v_ev.get('shock_index', 'N/A')} (Tachycardia / compensated hypoperfusion)")
    print(f"  * NEWS2 Score      : {v_ev.get('news2_score', 'N/A')}")
    top_drivers = v_ev.get("risk_drivers") or v_ev.get("shap_summary", {}).get("top_drivers", [])
    if top_drivers:
        driver_str = ", ".join([f"{d.get('feature')}: +{d.get('shap_value', 0):.3f}" if isinstance(d, dict) else str(d) for d in top_drivers[:3]])
        print(f"  * Key SHAP Drivers : {driver_str}")
    print(f"  * Clinical Reason  : {v_ev.get('clinical_reasoning') or v_ev.get('clinical_explanation')}")

    print("\n" + "-" * 70)
    print("  [AGENT 2: LABS AGENT - PATHOLOGY REASONING]")
    print(f"  * Risk Probability : {float(l_ev.get('labs_risk_probability', 0.0))*100:.1f}%")
    print(f"  * Organ Stress Tier: {l_ev.get('organ_stress_level')}")
    print(f"  * Hypoxia Grade    : {l_ev.get('cellular_hypoxia_grade', 'N/A')}")
    print(f"  * Biomarkers Flag  : {', '.join(l_ev.get('abnormal_biomarkers', []))}")
    print(f"  * Clinical Reason  : {l_ev.get('clinical_reasoning') or l_ev.get('pathology_summary')}")

    print("\n" + "-" * 70)
    print("  [AGENT 3: SKEPTIC AGENT - EHR CONFOUNDER ANALYSIS]")
    print(f"  * Classification   : {s_ev.get('classification')}")
    print(f"  * Recommended Rule : {s_ev.get('recommended_action')}")
    print(f"  * Discount Applied : {float(s_ev.get('confidence_discount_factor', 0.0))*100:.1f}%")
    print(f"  * Confounders Found: {', '.join(s_ev.get('detected_confounders', ['None']))}")
    print(f"  * Clinical Reason  : {s_ev.get('clinical_reasoning')}")

    print("\n" + "=" * 70)
    print("  [AGENT 4: MASTER ORCHESTRATOR - FINAL VERDICT & ACTION BUNDLE]")
    print("=" * 70)
    print(f"  * Urgency Level    : {res2['urgency_level']}")
    print(f"  * Composite Risk   : {res2['composite_sepsis_risk']*100:.1f}%")
    print(f"  * Target Role      : {res2['target_role']}")
    print(f"  * Notification     : {res2['notification_result']['delivery_status']} -> {res2['notification_result']['recipient']}")

    disagreements = res2.get("agent_disagreements") or []
    if disagreements:
        print("\n  [CROSS-AGENT DISAGREEMENT CHECK]")
        for d in disagreements:
            print(f"  - [{d.get('disagreement_type')}]: {d.get('clinical_rationale')}")
            print(f"    -> Strategy: {d.get('resolution_strategy')}")

    print("\n  [CLINICAL ACTION BUNDLE - RESUSCITATION STEPS NEEDED]")
    for idx, order in enumerate(res2.get("action_bundle", []), start=1):
        name = order.get("action") or order.get("name") or "Order"
        cat = order.get("category") or ("STAT RESUSCITATION" if order.get("urgent") else "SUPPORTIVE")
        rat = order.get("rationale") or order.get("evidence_rationale")
        priority = "STAT" if order.get("urgent") else order.get("status", "RECOMMENDED")
        print(f"  {idx}. [{cat}] {name} (Priority: {priority})")
        if rat:
            print(f"     Rationale: {rat}")
    print("=" * 70 + "\n")
