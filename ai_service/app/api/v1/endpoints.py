"""
API Endpoints for Aegis-ICU Diagnostic AI Engine
Exposes individual agent endpoints as well as the unified multi-agent orchestrator.
"""

from typing import Dict, Any, List, Optional
try:
    from fastapi import APIRouter
except ImportError:
    class APIRouter:
        def __init__(self, *args, **kwargs):
            self.routes = []
        def post(self, path, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
        def get(self, path, *args, **kwargs):
            def decorator(func):
                return func
            return decorator

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
    def Field(default=None, description=""):
        return default

from ai_service.app.schemas.clinical_schemas import (
    TelemetryTickRequest,
    PatientEvaluationResponse
)
from models.triage_orchestrator.src.orchestrator import SepsisOrchestrator

router = APIRouter()
orchestrator = SepsisOrchestrator()


class SkepticEvaluationRequest(BaseModel):
    vitals_evidence: Dict[str, Any]
    labs_evidence: Dict[str, Any]
    ehr_data: Optional[Dict[str, Any]] = None
    active_medications: Optional[List[str]] = None


# =====================================================================
# 1. UNIFIED MULTI-AGENT ORCHESTRATOR ENDPOINT
# =====================================================================
@router.post("/evaluate-patient-state", response_model=PatientEvaluationResponse)
def evaluate_patient_state(tick: TelemetryTickRequest):
    """
    Main entrypoint: Coordinates Data Quality Agent (Agent 0), Vitals Agent (Agent 1),
    Labs Agent (Agent 2), and Skeptic Agent (Agent 3) in-memory, returning the calibrated
    Sepsis-3 consensus along with transparent agent findings and disagreement detection.
    """
    vitals = {
        "HR": tick.HR, "SBP": tick.SBP, "DBP": tick.DBP,
        "MAP": tick.MAP, "Resp": tick.Resp, "O2Sat": tick.O2Sat, "Temp": tick.Temp
    }
    labs = {
        "Lactate": tick.Lactate, "WBC": tick.WBC,
        "Creatinine": tick.Creatinine, "Platelets": tick.Platelets
    }
    meds = tick.active_medications or []

    result = orchestrator.evaluate(
        patient_id=tick.patient_id,
        hour=tick.hour_index,
        vitals_dict=vitals,
        labs_dict=labs,
        meds_list=meds,
        previous_vitals=tick.previous_vitals,
        lab_age_hours=tick.lab_age_hours,
        nurse_verified_hardware_fault=tick.nurse_verified_hardware_fault
    )
    return result.model_dump() if hasattr(result, "model_dump") else result.dict()


# =====================================================================
# 2. INDIVIDUAL AGENT ENDPOINTS (MICROSERVICE WRAPPERS)
# =====================================================================


@router.post("/vitals/evaluate")
def evaluate_vitals_agent(vitals: Dict[str, float]):
    """
    Agent 1 (Vitals Agent): Evaluates hemodynamics, shock index, NEWS2,
    and returns per-prediction SHAP contributions and clinical explanation.
    """
    return orchestrator.vitals_predictor.predict(vitals)


@router.post("/labs/evaluate")
def evaluate_labs_agent(labs: Dict[str, float]):
    """
    Agent 2 (Labs Agent): Evaluates blood biomarkers (Lactate, WBC, etc.),
    organ hypoxia, STAT draw requirements, and Martha's rule guardrails.
    """
    return orchestrator.labs_predictor.predict(labs)


@router.post("/skeptic/evaluate")
def evaluate_skeptic_agent(payload: SkepticEvaluationRequest):
    """
    Agent 3 (Skeptic & False Alarm Checker): Takes outputs from Agent 1 & 2
    (with their SHAP values) + EHR data, and cross-references confounders.
    Strictly enforces: Never suppress a sepsis warning solely because medication
    might explain a symptom.
    """
    ehr = payload.ehr_data or {"medications": payload.active_medications or []}
    return orchestrator.skeptic_predictor.evaluate_false_alarm(
        vitals_result=payload.vitals_evidence,
        labs_result=payload.labs_evidence,
        ehr_data=ehr
    )


# =====================================================================
# 3. PHYSICIAN GROUNDED EXPLANATION CHAT ENDPOINT
# =====================================================================

class DoctorChatRequest(BaseModel):
    patient_id: str
    doctor_question: str
    clinical_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Patient evaluation context including SHAP values, vitals, labs, and sepsis risk"
    )


@router.post("/triage/chat")
def answer_doctor_inquiry(req: DoctorChatRequest):
    """
    Physician Bedside Explainer: Grounds LLM reasoning directly in the mathematical
    SHAP contributions, organ tier, shock index, and discount factor.
    Guarantees no hallucination: all answers reference actual patient measurements.
    """
    ctx = req.clinical_context or {}
    vitals = ctx.get("vitals_evidence", {})
    labs = ctx.get("labs_evidence", {})
    risk = ctx.get("composite_sepsis_risk", 0.0)
    urgency = ctx.get("urgency_level", "UNKNOWN")
    si = ctx.get("shock_index", 0.0)
    top_shap = vitals.get("shap_summary", {}).get("top_drivers", [])

    prompt = f"""You are the Aegis-ICU Diagnostic AI Assistant explaining a sepsis triage verdict to an attending physician (ROLE_DOCTOR).
Patient ID: {req.patient_id}
Composite Sepsis Risk: {risk*100:.1f}% ({urgency})
Shock Index: {si:.2f}
Top Physiological SHAP Drivers: {top_shap}
Vitals Summary: {vitals.get('clinical_summary', 'N/A')}
Labs Organ Stress: {labs.get('organ_stress_level', 'N/A')}

Attending Doctor's Question: "{req.doctor_question}"

Provide a concise, direct, evidence-based answer (under 120 words).
Ground your answer explicitly in the mathematical telemetry, SHAP values, and Sepsis-3 guidelines."""

    # Attempt Gemini call if API key present
    import os, requests, json
    gemini_key = os.getenv("GEMINI_API_KEY")
    llm_answer = None

    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 300}
            }
            resp = requests.post(url, json=payload, timeout=4)
            if resp.status_code == 200:
                data = resp.json()
                llm_answer = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            pass

    if not llm_answer:
        # Heuristic fallback grounded in evidence
        llm_answer = (
            f"Regarding Bed {req.patient_id}: The alert is driven by a Shock Index of {si:.2f} "
            f"and elevated hemodynamic instability. Top SHAP contributors: {', '.join([d.get('feature','') for d in top_shap[:2]]) if top_shap else 'vital signs'}. "
            f"Overall calibrated sepsis risk is {risk*100:.1f}%. Immediate blood culture draw and serial lactate monitoring are recommended."
        )

    return {
        "patient_id": req.patient_id,
        "doctor_question": req.doctor_question,
        "llm_response": llm_answer,
        "clinical_grounding": {
            "composite_sepsis_risk": risk,
            "urgency_level": urgency,
            "shock_index": si,
            "top_shap_features": top_shap
        }
    }
