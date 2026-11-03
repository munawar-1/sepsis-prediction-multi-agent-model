"""
API Controller Endpoints for Aegis-ICU Diagnostic AI Engine
Thin REST controller delegating all domain and agent business logic to TriageService.
"""

from typing import Dict, Any, Optional

try:
    from fastapi import APIRouter, Depends, HTTPException, status
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
    def Depends(dep):
        return dep()
    class HTTPException(Exception):
        def __init__(self, status_code, detail):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail
    class status:
        HTTP_200_OK = 200
        HTTP_404_NOT_FOUND = 404
        HTTP_500_INTERNAL_SERVER_ERROR = 500

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
from ai_service.app.services.triage_service import TriageService, get_triage_service

router = APIRouter()


# =====================================================================
# GROUP A: CORE CLINICAL WORKFLOW ORCHESTRATION (LANGGRAPH ENGINE)
# =====================================================================

@router.post(
    "/triage/evaluate",
    response_model=PatientEvaluationResponse,
    summary="Evaluate Bedside Telemetry Tick",
    description="Main entrypoint: runs the LangGraph state machine across sensor validation, ML vitals/labs, and gated skeptic analysis."
)
@router.post("/evaluate-patient-state", response_model=PatientEvaluationResponse, include_in_schema=False)
def evaluate_patient_state(
    tick: TelemetryTickRequest,
    service: TriageService = Depends(get_triage_service)
):
    try:
        return service.evaluate_patient_telemetry(tick)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error in LangGraph clinical pipeline: {str(e)}")


@router.post(
    "/triage/nurse-verify",
    response_model=NurseVerificationResponse,
    summary="Bedside Nurse Hardware Verification (HITL)",
    description="Bedside nurse confirms sensor displacement (halting workflow) or overrides as true clinical illness (triggering full resuscitation)."
)
def verify_nurse_action(
    req: NurseVerificationRequest,
    service: TriageService = Depends(get_triage_service)
):
    try:
        return service.handle_nurse_verification(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing nurse verification: {str(e)}")


# =====================================================================
# GROUP B: ATTENDING PHYSICIAN GROUNDED COPILOT
# =====================================================================

@router.post(
    "/triage/chat",
    response_model=DoctorChatResponse,
    summary="Physician Bedside Explainer Chat",
    description="Q&A assistant strictly grounded in the mathematical Shock Index, TreeSHAP drivers, and Sepsis-3 guidelines (zero hallucination)."
)
def answer_doctor_inquiry(
    req: DoctorChatRequest,
    service: TriageService = Depends(get_triage_service)
):
    try:
        return service.answer_doctor_inquiry(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating doctor explanation: {str(e)}")


# =====================================================================
# GROUP C: MODULAR AGENT SANDBOX ENDPOINTS
# =====================================================================

@router.post(
    "/agents/validator",
    summary="Execute Sensor Integrity Tool",
    description="Sub-millisecond biological and fluid dynamic plausibility checks."
)
def evaluate_sensor_validator(
    req: ValidatorEvaluationRequest,
    service: TriageService = Depends(get_triage_service)
):
    return service.evaluate_validator(req)


@router.post(
    "/agents/vitals",
    summary="Execute Agent 1 (Vitals Agent)",
    description="Evaluates hemodynamics, shock index, NEWS2, and TreeSHAP feature attributions."
)
@router.post("/vitals/evaluate", include_in_schema=False)
def evaluate_vitals_agent(
    vitals: Dict[str, float],
    service: TriageService = Depends(get_triage_service)
):
    return service.evaluate_vitals_agent(vitals)


@router.post(
    "/agents/labs",
    summary="Execute Agent 2 (Labs Agent)",
    description="Evaluates cellular hypoxia, organ stress tier, and Martha's Rule guardrails."
)
@router.post("/labs/evaluate", include_in_schema=False)
def evaluate_labs_agent(
    labs: Dict[str, float],
    service: TriageService = Depends(get_triage_service)
):
    return service.evaluate_labs_agent(labs)


@router.post(
    "/agents/skeptic",
    summary="Execute Agent 3 (Skeptic Filter)",
    description="Interrogates EHR medication confounders to suppress false alarms while strictly maintaining patient safety."
)
@router.post("/skeptic/evaluate", include_in_schema=False)
def evaluate_skeptic_agent(
    payload: SkepticEvaluationRequest,
    service: TriageService = Depends(get_triage_service)
):
    return service.evaluate_skeptic_agent(payload)


# =====================================================================
# GROUP D: SYSTEM OBSERVABILITY & GRAPH TOPOLOGY
# =====================================================================

@router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Engine Readiness & Health Probe",
    description="Verifies loaded ML weights, LLM connectivity, and backend notification adapter mode."
)
def health_check(service: TriageService = Depends(get_triage_service)):
    return service.get_system_health()


@router.get(
    "/triage/graph/topology",
    response_model=GraphTopologyResponse,
    summary="LangGraph State Machine Topology",
    description="Provides the node and conditional edge metadata for React dashboard visualization."
)
def get_graph_topology(service: TriageService = Depends(get_triage_service)):
    return service.get_graph_topology()


@router.get(
    "/triage/patient/{patient_id}/state",
    summary="Get Bed Checkpoint State",
    description="Retrieves the latest execution state and evidence for a specific patient."
)
def get_patient_state(
    patient_id: str,
    service: TriageService = Depends(get_triage_service)
):
    state = service.get_patient_state(patient_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"No telemetry state found for patient {patient_id}")
    return state
