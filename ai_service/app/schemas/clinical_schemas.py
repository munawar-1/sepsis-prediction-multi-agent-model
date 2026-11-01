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

class PatientEvaluationResponse(BaseModel):
    patient_id: str
    hour_index: int
    urgency_level: str
    composite_sepsis_risk: float
    news2_score: int
    shock_index: float
    discrepancy_detected: bool
    vitals_evidence: Dict[str, Any]
    labs_evidence: Dict[str, Any]
    skeptic_evidence: Dict[str, Any]
    recommended_action_bundle: List[Dict[str, Any]]
    evidence_chain_narrative: str
    requires_hitl_action: bool
