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
    def Field(default=None, description=""):
        return default

from ai_service.app.schemas.clinical_schemas import TelemetryTickRequest, PatientEvaluationResponse
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
    Main entrypoint: Coordinates Agent 1 (Vitals), Agent 2 (Labs),
    and Agent 3 (Skeptic) in-memory, returning the calibrated Sepsis-3 consensus.
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
        meds_list=meds
    )
    return result.dict()


# =====================================================================
# 2. INDIVIDUAL AGENT ENDPOINTS (MICROSERVICE WRAPPERS)
# =====================================================================
@router.post("/vitals/evaluate")
def evaluate_vitals_agent(vitals: Dict[str, float]):
    """
    Agent 1 (Vitals Agent): Evaluates hemodynamics, shock index, NEWS2,
    and returns per-prediction SHAP contributions.
    """
    return orchestrator.vitals_predictor.predict(vitals)


@router.post("/labs/evaluate")
def evaluate_labs_agent(labs: Dict[str, float]):
    """
    Agent 2 (Labs Agent): Evaluates blood biomarkers (Lactate, WBC, etc.),
    organ hypoxia, STAT draw requirements, and SHAP contributions.
    """
    return orchestrator.labs_predictor.predict(labs)


@router.post("/skeptic/evaluate")
def evaluate_skeptic_agent(payload: SkepticEvaluationRequest):
    """
    Agent 3 (Skeptic & False Alarm Checker): Takes outputs from Agent 1 & 2
    (with their SHAP values) + EHR data, and queries Ollama / LLM to evaluate
    if the alert is a false alarm or true sepsis deterioration.
    """
    ehr = payload.ehr_data or {"medications": payload.active_medications or []}
    return orchestrator.skeptic_predictor.evaluate_false_alarm(
        vitals_result=payload.vitals_evidence,
        labs_result=payload.labs_evidence,
        ehr_data=ehr
    )
