"""
Pydantic Schemas for Aegis-ICU API
Strict, typed contracts conforming to HL7 FHIR Observation standards.
"""

from typing import Optional, List, Dict, Any

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


# =====================================================================
# 1. CORE TELEMETRY & PATIENT EVALUATION DTOs
# =====================================================================

class TelemetryTickRequest(BaseModel):
    model_config = {"extra": "ignore"}
    patient_id: str = Field(description="De-identified patient token e.g. 'p000011'")
    hour_index: int = Field(default=0, description="ICU hour offset (0, 1, 2, ...)")
    # Vitals (Agent 1)
    HR: Optional[float] = None
    SBP: Optional[float] = None
    DBP: Optional[float] = None
    MAP: Optional[float] = None
    Resp: Optional[float] = None
    O2Sat: Optional[float] = None
    Temp: Optional[float] = None
    # Labs (Agent 2)
    Lactate: Optional[float] = None
    WBC: Optional[float] = None
    Creatinine: Optional[float] = None
    Platelets: Optional[float] = None
    Glucose: Optional[float] = None
    # Context (Agent 3)
    active_medications: Optional[List[str]] = Field(default_factory=list)
    # Data Quality parameters & Nurse Verification
    lab_age_hours: Optional[float] = None
    previous_vitals: Optional[Dict[str, Any]] = None
    nurse_verified_hardware_fault: Optional[bool] = Field(
        default=None,
        description="If True, nurse confirms hardware fault. If False, nurse overrides as true clinical illness."
    )


class PatientEvaluationResponse(BaseModel):
    patient_id: str
    hour_index: int
    urgency_level: str
    composite_sepsis_risk: float
    news2_score: int
    shock_index: float
    discrepancy_detected: bool
    target_role: Optional[str] = Field(default="ROLE_DOCTOR", description="'ROLE_NURSE' or 'ROLE_DOCTOR'")
    sensor_valid: Optional[bool] = Field(default=True, description="True if telemetry passed hardware validation")
    workflow_status: Optional[str] = Field(default="COMPLETED", description="Status code of the LangGraph execution")
    notification_dispatch: Optional[Dict[str, Any]] = Field(default=None, description="Backend notification status")
    data_quality_evidence: Optional[Dict[str, Any]] = Field(default_factory=dict)
    vitals_evidence: Optional[Dict[str, Any]] = Field(default_factory=dict)
    labs_evidence: Optional[Dict[str, Any]] = Field(default_factory=dict)
    skeptic_evidence: Optional[Dict[str, Any]] = Field(default_factory=dict)
    agent_findings: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    agent_disagreements: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    recommended_action_bundle: List[Dict[str, Any]] = Field(default_factory=list)
    evidence_chain_narrative: str = Field(default="")
    requires_hitl_action: bool = Field(default=False)


# =====================================================================
# 2. HUMAN-IN-THE-LOOP NURSE VERIFICATION DTOs
# =====================================================================

class NurseVerificationRequest(BaseModel):
    patient_id: str
    hour_index: int = Field(default=0)
    confirmed_hardware_fault: bool = Field(
        description="True = sensor was displaced/loose (halt workflow); False = patient is truly clinically sick (override & proceed)"
    )
    fault_type: Optional[str] = Field(default=None, description="Sensor fault code e.g. PROBE_DETACHED")
    notes: Optional[str] = Field(default="", description="Bedside nurse assessment notes")
    vitals_dict: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Current or re-checked vital signs")
    labs_dict: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Active laboratory values")
    active_medications: Optional[List[str]] = Field(default_factory=list)


class NurseVerificationResponse(BaseModel):
    patient_id: str
    action_taken: str
    workflow_status: str
    target_role: str
    message: str
    evaluation_result: Optional[PatientEvaluationResponse] = None


# =====================================================================
# 3. PHYSICIAN GROUNDED CHAT DTOs
# =====================================================================

class DoctorChatRequest(BaseModel):
    model_config = {"extra": "ignore"}
    patient_id: str
    doctor_question: str
    clinical_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Patient evaluation context including SHAP values, vitals, labs, and sepsis risk"
    )


class DoctorChatResponse(BaseModel):
    patient_id: str
    doctor_question: str
    llm_response: str
    clinical_grounding: Dict[str, Any]


# =====================================================================
# 4. MODULAR AGENT SANDBOX DTOs
# =====================================================================

class ValidatorEvaluationRequest(BaseModel):
    current_vitals: Dict[str, Any]
    previous_vitals: Optional[Dict[str, Any]] = None
    lab_age_hours: Optional[float] = None


class SkepticEvaluationRequest(BaseModel):
    vitals_evidence: Dict[str, Any]
    labs_evidence: Dict[str, Any]
    ehr_data: Optional[Dict[str, Any]] = None
    active_medications: Optional[List[str]] = None


# =====================================================================
# 5. SYSTEM OBSERVABILITY & TOPOLOGY DTOs
# =====================================================================

class HealthCheckResponse(BaseModel):
    status: str
    service: str
    version: str
    models: Dict[str, str]
    llm_engine: Dict[str, Any]
    notification_adapter: Dict[str, Any]


class GraphTopologyResponse(BaseModel):
    entry_point: str
    nodes: List[Dict[str, Any]]
    conditional_edges: List[Dict[str, Any]]
