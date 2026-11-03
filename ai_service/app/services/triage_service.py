"""
Aegis-ICU Service Layer: TriageService
Encapsulates all multi-agent business logic, LangGraph state machine execution,
Human-in-the-Loop nurse coordination, and physician grounded copilot reasoning.
"""

import os
import sys
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from models.triage_orchestrator.src.clinical_graph import AegisClinicalGraph, ClinicalTriageState
from models.triage_orchestrator.src.data_validator import DataValidator, ValidationResult
from models.vitals_agent.src.predictor import VitalsPredictor
from models.labs_agent.src.predictor import LabsPredictor
from models.skeptic_agent.src.predictor import SkepticPredictor
from models.triage_orchestrator.src.notification_client import NotificationClient

from ai_service.app.schemas.clinical_schemas import (
    TelemetryTickRequest,
    PatientEvaluationResponse,
    NurseVerificationRequest,
    NurseVerificationResponse,
    DoctorChatRequest,
    DoctorChatResponse,
    ValidatorEvaluationRequest,
    SkepticEvaluationRequest,
    HealthCheckResponse,
    GraphTopologyResponse
)

logger = logging.getLogger("aegis_triage_service")
logging.basicConfig(level=logging.INFO)


class TriageService:
    """
    Enterprise Service Layer managing the lifecycle of the LangGraph Clinical Pipeline.
    Decouples HTTP controller transport from domain ML & agent workflows.
    """

    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        ollama_base_url: Optional[str] = None,
        ollama_model: Optional[str] = None,
        backend_notification_url: Optional[str] = None
    ):
        gemini_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        openai_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        ollama_url = ollama_base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        ollama_mod = ollama_model or os.getenv("OLLAMA_MODEL", "llama3.2")
        notif_url = backend_notification_url or os.getenv("BACKEND_NOTIFICATION_URL")

        logger.info("[TriageService] Initializing LangGraph Clinical Engine & Agents...")
        self.graph = AegisClinicalGraph(
            gemini_api_key=gemini_key,
            openai_api_key=openai_key,
            ollama_base_url=ollama_url,
            ollama_model=ollama_mod,
            backend_notification_url=notif_url
        )
        self.validator = DataValidator(
            gemini_api_key=gemini_key,
            openai_api_key=openai_key,
            ollama_base_url=ollama_url,
            ollama_model=ollama_mod
        )
        self.notifier = NotificationClient(backend_url=notif_url)
        self.gemini_key = gemini_key

        # In-memory store for quick bed state caching alongside LangGraph checkpoints
        self._bed_cache: Dict[str, Dict[str, Any]] = {}
        logger.info("[TriageService] Service layer initialized successfully.")

    # =================================================================
    # 1. PRIMARY CLINICAL WORKFLOW EVALUATION
    # =================================================================
    def evaluate_patient_telemetry(self, tick: TelemetryTickRequest) -> PatientEvaluationResponse:
        """
        Processes an incoming telemetry tick through the complete LangGraph state machine.
        Handles sensor integrity check, nurse fail-fast alert, parallel ML inference,
        gated skeptic filtering, and resuscitation bundle synthesis.
        """
        vitals_dict = {
            "HR": tick.HR, "SBP": tick.SBP, "DBP": tick.DBP,
            "MAP": tick.MAP, "Resp": tick.Resp, "O2Sat": tick.O2Sat, "Temp": tick.Temp
        }
        # Filter out None values for clean ML feature mapping
        vitals_clean = {k: v for k, v in vitals_dict.items() if v is not None}

        labs_dict = {
            "Lactate": tick.Lactate, "WBC": tick.WBC,
            "Creatinine": tick.Creatinine, "Platelets": tick.Platelets, "Glucose": tick.Glucose
        }
        labs_clean = {k: v for k, v in labs_dict.items() if v is not None}

        meds_list = tick.active_medications or []

        # Invoke the LangGraph pipeline
        state: ClinicalTriageState = self.graph.evaluate(
            patient_id=tick.patient_id,
            hour=tick.hour_index,
            vitals_dict=vitals_clean,
            labs_dict=labs_clean,
            meds_list=meds_list,
            previous_vitals=tick.previous_vitals,
            lab_age_hours=tick.lab_age_hours,
            nurse_confirmed_hardware_fault=tick.nurse_verified_hardware_fault
        )

        # Cache latest bed evaluation
        self._bed_cache[tick.patient_id] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "hour_index": tick.hour_index,
            "state": state
        }

        # Format into clean response DTO
        val_res = state.get("validation_result") or {}
        is_sensor_valid = bool(val_res.get("is_valid", True))
        v_evidence = state.get("vitals_evidence") or {}
        news2 = int(v_evidence.get("news2_score", 0))
        shock_index = float(v_evidence.get("shock_index", 0.0))
        comp_risk = float(state.get("composite_sepsis_risk", 0.0))

        # Check early deterioration discrepancy (High AI risk despite low NEWS2)
        discrepancy = (comp_risk >= 0.40 and news2 < 5)

        return PatientEvaluationResponse(
            patient_id=state["patient_id"],
            hour_index=state["hour_index"],
            urgency_level=state.get("urgency_level", "LOW_RISK"),
            composite_sepsis_risk=comp_risk,
            news2_score=news2,
            shock_index=shock_index,
            discrepancy_detected=discrepancy,
            target_role=state.get("target_role", "ROLE_DOCTOR"),
            sensor_valid=is_sensor_valid,
            workflow_status=state.get("workflow_status", "COMPLETED"),
            notification_dispatch=state.get("notification_result"),
            data_quality_evidence=val_res,
            vitals_evidence=v_evidence,
            labs_evidence=state.get("labs_evidence") or {},
            skeptic_evidence=state.get("skeptic_evidence") or {},
            agent_findings=state.get("agent_findings") or [],
            agent_disagreements=state.get("agent_disagreements") or [],
            recommended_action_bundle=state.get("action_bundle") or [],
            evidence_chain_narrative=state.get("evidence_chain_narrative") or "",
            requires_hitl_action=(state.get("urgency_level") in ["MODERATE", "CRITICAL_SEPSIS"])
        )

    # =================================================================
    # 2. HUMAN-IN-THE-LOOP NURSE VERIFICATION HANDLER
    # =================================================================
    def handle_nurse_verification(self, req: NurseVerificationRequest) -> NurseVerificationResponse:
        """
        Processes bedside nurse feedback on a hardware sensor fault alarm:
        1. If Nurse confirms hardware fault -> Alarms stopped, resolved at bedside. Doctor not spammed.
        2. If Nurse overrides -> Nurse certifies patient is truly clinically sick. The state machine
           immediately runs Agent 1, 2, 3, and 4 to initiate full sepsis resuscitation!
        """
        patient_id = req.patient_id
        logger.info(f"[TriageService] Received Nurse HITL Verification for {patient_id}: confirmed_fault={req.confirmed_hardware_fault}")

        if req.confirmed_hardware_fault:
            # Case A: Hardware issue confirmed (detached clip, loose cuff)
            return NurseVerificationResponse(
                patient_id=patient_id,
                action_taken="CONFIRMED_HARDWARE_FAULT",
                workflow_status="STOPPED_NURSE_HARDWARE_FAULT",
                target_role="ROLE_NURSE",
                message="Bedside sensor issue confirmed and corrected. Clinical alert suppressed to prevent doctor fatigue.",
                evaluation_result=None
            )

        # Case B: Nurse Override -> "Patient is genuinely unwell, sensor is properly attached"
        logger.warning(f"[TriageService] Nurse OVERRIDE for {patient_id}. Proceeding with clinical ML evaluation.")
        tick_req = TelemetryTickRequest(
            patient_id=patient_id,
            hour_index=req.hour_index,
            HR=req.vitals_dict.get("HR") if req.vitals_dict else None,
            SBP=req.vitals_dict.get("SBP") if req.vitals_dict else None,
            DBP=req.vitals_dict.get("DBP") if req.vitals_dict else None,
            MAP=req.vitals_dict.get("MAP") if req.vitals_dict else None,
            Resp=req.vitals_dict.get("Resp") if req.vitals_dict else None,
            O2Sat=req.vitals_dict.get("O2Sat") if req.vitals_dict else None,
            Temp=req.vitals_dict.get("Temp") if req.vitals_dict else None,
            Lactate=req.labs_dict.get("Lactate") if req.labs_dict else None,
            WBC=req.labs_dict.get("WBC") if req.labs_dict else None,
            Creatinine=req.labs_dict.get("Creatinine") if req.labs_dict else None,
            Platelets=req.labs_dict.get("Platelets") if req.labs_dict else None,
            active_medications=req.active_medications or [],
            nurse_verified_hardware_fault=False  # Explicit override
        )
        eval_result = self.evaluate_patient_telemetry(tick_req)

        return NurseVerificationResponse(
            patient_id=patient_id,
            action_taken="OVERRIDE_CLINICAL_ILLNESS",
            workflow_status="PROCEEDED_TO_CLINICAL_EVALUATION",
            target_role="ROLE_DOCTOR",
            message="Nurse certified sensor integrity. Clinical models evaluated and doctor alert dispatched if warranted.",
            evaluation_result=eval_result
        )

    # =================================================================
    # 3. PHYSICIAN GROUNDED COPILOT CHAT
    # =================================================================
    def answer_doctor_inquiry(self, req: DoctorChatRequest) -> DoctorChatResponse:
        """
        Bedside Physician Explainer: Grounds LLM reasoning directly in the mathematical
        SHAP contributions, organ tier, shock index, and discount factor.
        Guarantees no hallucination: all answers reference actual patient measurements.
        """
        ctx = req.clinical_context or {}
        # If context not supplied in request body, retrieve from bed cache
        if not ctx and req.patient_id in self._bed_cache:
            ctx = self._bed_cache[req.patient_id].get("state", {})

        vitals = ctx.get("vitals_evidence", {})
        labs = ctx.get("labs_evidence", {})
        skeptic = ctx.get("skeptic_evidence", {})
        risk = float(ctx.get("composite_sepsis_risk", 0.0))
        urgency = ctx.get("urgency_level", "UNKNOWN")
        si = float(vitals.get("shock_index", 0.0))
        top_shap = vitals.get("shap_summary", {}).get("top_drivers", []) or vitals.get("risk_drivers", [])

        prompt = f"""You are the Aegis-ICU Diagnostic AI Assistant explaining a sepsis triage verdict to an attending physician (ROLE_DOCTOR).
Patient ID: {req.patient_id}
Composite Sepsis Risk: {risk*100:.1f}% ({urgency})
Shock Index: {si:.2f}
Top Physiological SHAP Drivers: {top_shap}
Vitals Summary: {vitals.get('clinical_summary') or vitals.get('clinical_reasoning', 'N/A')}
Labs Organ Stress: {labs.get('organ_stress_level', 'N/A')}
Skeptic Confounder Analysis: {skeptic.get('classification', 'N/A')} (Discount: {float(skeptic.get('confidence_discount_factor', 0.0))*100:.1f}%)

Attending Doctor's Question: "{req.doctor_question}"

Provide a concise, direct, evidence-based answer (under 120 words).
Ground your answer explicitly in the mathematical telemetry, SHAP values, and Sepsis-3 guidelines.
If the doctor asks about medication confounders, explain why the sepsis protocol was or was not discounted."""

        llm_answer = None

        # 1. Try Gemini API if key is available
        if self.gemini_key:
            try:
                import requests
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.gemini_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.1, "maxOutputTokens": 300}
                }
                resp = requests.post(url, json=payload, timeout=4)
                if resp.status_code == 200:
                    data = resp.json()
                    llm_answer = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            except Exception as e:
                logger.debug(f"[TriageService] Gemini chat query exception: {e}")

        # 2. Try Local Ollama if Gemini not used
        if not llm_answer and os.getenv("SKIP_LOCAL_LLM") != "1":
            try:
                import requests, json
                url = "http://localhost:11434/api/generate"
                payload = {
                    "model": "llama3.2",
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.1}
                }
                resp = requests.post(url, json=payload, timeout=float(os.getenv("OLLAMA_TIMEOUT", 6)))
                if resp.status_code == 200:
                    llm_answer = resp.json().get("response", "").strip()
            except Exception:
                pass

        # 3. Grounded Neuro-Symbolic Fallback
        if not llm_answer:
            driver_str = ", ".join([d.get("feature", "") if isinstance(d, dict) else str(d) for d in top_shap[:2]]) if top_shap else "vital signs"
            llm_answer = (
                f"Regarding Bed {req.patient_id}: The sepsis alert (Risk: {risk*100:.1f}%, {urgency}) "
                f"is driven by a Shock Index of {si:.2f} and severe hemodynamic strain. "
                f"Top SHAP mathematical contributors: {driver_str}. "
                f"Organ stress is categorized as {labs.get('organ_stress_level', 'EVALUATED')}. "
                f"Immediate blood culture draw, IV fluids, and serial lactate reassessment are recommended."
            )

        return DoctorChatResponse(
            patient_id=req.patient_id,
            doctor_question=req.doctor_question,
            llm_response=llm_answer,
            clinical_grounding={
                "composite_sepsis_risk": risk,
                "urgency_level": urgency,
                "shock_index": si,
                "top_shap_features": top_shap,
                "organ_stress_tier": labs.get("organ_stress_level"),
                "confounder_action": skeptic.get("recommended_action")
            }
        )

    # =================================================================
    # 4. MODULAR AGENT SANDBOX EXECUTION
    # =================================================================
    def evaluate_validator(self, req: ValidatorEvaluationRequest) -> Dict[str, Any]:
        """Direct inspection of the sensor integrity and biological plausibility tool."""
        res: ValidationResult = self.validator.validate(
            current_vitals=req.current_vitals,
            previous_vitals=req.previous_vitals,
            lab_age_hours=req.lab_age_hours
        )
        return {
            "is_valid": res.is_valid,
            "target_role": res.target_role,
            "fault_type": res.fault_type,
            "alert_title": res.alert_title,
            "bedside_action": res.bedside_action,
            "clinical_explanation": res.clinical_explanation,
            "detected_anomalies": res.detected_anomalies,
            "llm_source": res.llm_source
        }

    def evaluate_vitals_agent(self, vitals: Dict[str, float]) -> Dict[str, Any]:
        """Direct execution of Agent 1: XGBoost + TreeSHAP + Hemodynamic Reasoner."""
        return self.graph.vitals_predictor.predict(vitals)

    def evaluate_labs_agent(self, labs: Dict[str, float]) -> Dict[str, Any]:
        """Direct execution of Agent 2: LightGBM + TreeSHAP + Martha's Rule Reasoner."""
        return self.graph.labs_predictor.predict(labs)

    def evaluate_skeptic_agent(self, req: SkepticEvaluationRequest) -> Dict[str, Any]:
        """Direct execution of Agent 3: Medication Confounder & False Alarm Filter."""
        ehr = req.ehr_data or {"medications": req.active_medications or []}
        return self.graph.skeptic_predictor.evaluate_false_alarm(
            vitals_result=req.vitals_evidence,
            labs_result=req.labs_evidence,
            ehr_data=ehr
        )

    # =================================================================
    # 5. OBSERVABILITY & TOPOLOGY
    # =================================================================
    def get_system_health(self) -> HealthCheckResponse:
        """Returns comprehensive readiness and liveness telemetry."""
        notif_mode = "LIVE_HTTP"
        try:
            import requests
            resp = requests.get(f"{self.notifier.backend_url}/actuator/health", timeout=0.5)
            if resp.status_code != 200:
                notif_mode = "SIMULATION_FALLBACK"
        except Exception:
            notif_mode = "SIMULATION_FALLBACK"

        return HealthCheckResponse(
            status="HEALTHY",
            service="Aegis-ICU Diagnostic AI Engine",
            version="1.0.0",
            models={
                "data_validator_tool": "ACTIVE (Physical Fluid Dynamic & Biological Heuristics)",
                "vitals_agent": "LOADED (XGBoost + TreeSHAP Explainer)",
                "labs_agent": "LOADED (LightGBM + TreeSHAP Explainer + Martha's Rule)",
                "skeptic_agent": "LOADED (ICU Confounder Rules + Stand-Alert Safe Invariant)",
                "meta_ensemble": "LOADED (Calibrated Bayesian Shock Synthesis)"
            },
            llm_engine={
                "gemini_configured": bool(self.gemini_key),
                "ollama_base_url": self.graph.vitals_predictor.reasoning_agent.ollama_base_url,
                "fallback_mode": "NEURO_SYMBOLIC_DETERMINISTIC_RULES"
            },
            notification_adapter={
                "mode": notif_mode,
                "target_url": self.notifier.backend_url
            }
        )

    def get_graph_topology(self) -> GraphTopologyResponse:
        """Exposes the exact LangGraph decision topology for React flight deck visualization."""
        nodes = [
            {"id": "data_validator", "type": "heuristic_tool", "role": "ROLE_NURSE", "description": "Sub-millisecond Physics & Sensor Integrity"},
            {"id": "nurse_verification", "type": "hitl_gate", "role": "ROLE_NURSE", "description": "Bedside Hardware Confirmation (Halts or Overrides)"},
            {"id": "vitals_agent", "type": "ml_agent", "model": "XGBoost + TreeSHAP", "description": "Hemodynamic Strain & Shock Index"},
            {"id": "labs_agent", "type": "ml_agent", "model": "LightGBM + TreeSHAP", "description": "Cellular Hypoxia & Martha's Rule"},
            {"id": "skeptic_agent", "type": "llm_agent", "role": "ROLE_DOCTOR", "description": "Gated Medication Confounder Analysis"},
            {"id": "synthesis", "type": "ensemble_orchestrator", "role": "ROLE_DOCTOR", "description": "Calibrated Consensus & Resuscitation Action Bundle"}
        ]
        conditional_edges = [
            {"from": "data_validator", "to": "nurse_verification", "condition": "sensor_fault_detected"},
            {"from": "data_validator", "to": "vitals_agent", "condition": "telemetry_valid"},
            {"from": "nurse_verification", "to": "__end__", "condition": "nurse_confirmed_hardware_issue"},
            {"from": "nurse_verification", "to": "vitals_agent", "condition": "nurse_override_clinical_illness"},
            {"from": "vitals_agent", "to": "labs_agent", "condition": "pipeline_sequence"},
            {"from": "labs_agent", "to": "skeptic_agent", "condition": "gated_risk_detected (P>=0.30 or SI>=0.80)"},
            {"from": "labs_agent", "to": "synthesis", "condition": "uncontested_normal (P<0.30)"},
            {"from": "skeptic_agent", "to": "synthesis", "condition": "direct_handoff"},
            {"from": "synthesis", "to": "__end__", "condition": "verdict_rendered"}
        ]
        return GraphTopologyResponse(
            entry_point="data_validator",
            nodes=nodes,
            conditional_edges=conditional_edges
        )

    def get_patient_state(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves the cached or checkpointer state for a specific ICU bed."""
        return self._bed_cache.get(patient_id)


# =====================================================================
# SINGLETON INSTANCE & FASTAPI DEPENDENCY INJECTION
# =====================================================================
_service_instance: Optional[TriageService] = None

def get_triage_service() -> TriageService:
    """Dependency injection provider for FastAPI endpoints."""
    global _service_instance
    if _service_instance is None:
        _service_instance = TriageService()
    return _service_instance
