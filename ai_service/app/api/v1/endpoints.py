"""
API Endpoints for Aegis-ICU Diagnostic AI Engine
"""

from fastapi import APIRouter
from ai_service.app.schemas.clinical_schemas import TelemetryTickRequest, PatientEvaluationResponse
from models.triage_orchestrator.src.orchestrator import SepsisOrchestrator

router = APIRouter()
orchestrator = SepsisOrchestrator()

@router.post("/evaluate-patient-state", response_model=PatientEvaluationResponse)
def evaluate_patient_state(tick: TelemetryTickRequest):
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
