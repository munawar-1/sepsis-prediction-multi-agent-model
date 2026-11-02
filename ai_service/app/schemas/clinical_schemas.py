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

class TelemetryTickRequest(BaseModel):
    patient_id: str = Field(description="De-identified patient token e.g. 'p000011'")
    hour_index: int = Field(description="ICU hour offset (0, 1, 2, ...)")
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
    notification_dispatch: Optional[Dict[str, Any]] = Field(default=None, description="Backend notification status")
    data_quality_evidence: Optional[Dict[str, Any]] = Field(default_factory=dict)
    vitals_evidence: Dict[str, Any]
    labs_evidence: Dict[str, Any]
    skeptic_evidence: Dict[str, Any]
    agent_findings: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    agent_disagreements: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    recommended_action_bundle: List[Dict[str, Any]]
    evidence_chain_narrative: str
    requires_hitl_action: bool
