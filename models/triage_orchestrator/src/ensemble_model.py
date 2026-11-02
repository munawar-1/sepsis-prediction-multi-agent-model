"""
Model 4 (Triage Orchestrator): Meta-Ensemble Consensus Model
Calibrates and fuses predictions from Model 1 (Vitals), Model 2 (Labs),
and Model 3 (Skeptic) into an explainable composite risk score.

CLINICAL SAFETY MANDATES:
1. Missing or normal lab results must NOT automatically rule out sepsis.
2. Never suppress a sepsis warning solely because medication might explain a symptom.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import numpy as np


class MetaEnsembleClassifier:
    def __init__(self, weights=None):
        # Calibrated clinical weights: Vitals 0.50, Labs 0.35, Skeptic dampening 0.15
        self.weights = weights or {"vitals": 0.50, "labs": 0.35, "skeptic": 0.15}

    def compute_composite_risk(
        self,
        p_vitals: float,
        p_labs: float,
        discount: float,
        has_fresh_labs: bool,
        shock_index: float = 0.0,
        resp_rate: float = 18.0
    ) -> float:
        """
        Dynamically fuses vitals, labs, and skeptic context.
        Adheres strictly to the rule: Missing or normal lab results must NOT automatically rule out sepsis.
        """
        # Constrain discount: discount cannot depress risk if vitals or shock index show overt distress
        safe_discount = discount
        if p_vitals >= 0.40 or shock_index >= 0.75 or resp_rate >= 21.0:
            safe_discount = min(0.05, discount)

        if not has_fresh_labs:
            # When blood pathology is uncollected, vitals risk drives the score directly (no penalizing downscaling)
            raw_score = p_vitals - (safe_discount * self.weights["skeptic"])
        else:
            # When labs are present:
            # If vitals indicate deterioration (p_vitals >= 0.40 or shock_index >= 0.75),
            # normal labs (p_labs < 0.25) must NOT depress composite risk below the vitals warning floor!
            if (p_vitals >= 0.40 or shock_index >= 0.75) and p_labs < 0.25:
                # Early sepsis pattern (Martha's Rule): preserved blood pressure with compensated tachycardia/tachypnea
                # Floor composite risk to at least 85% of vitals risk to preserve alert vigilance
                base_fusion = (p_vitals * 0.65) + (p_labs * 0.35)
                vitals_floor = p_vitals * 0.85
                raw_score = max(base_fusion, vitals_floor) - (safe_discount * self.weights["skeptic"])
            elif p_labs >= 0.50:
                # Severe organ stress or metabolic acidosis elevates composite risk
                raw_score = max(p_vitals, p_labs * 0.90, (p_vitals * self.weights["vitals"]) + (p_labs * self.weights["labs"]))
            else:
                raw_score = (p_vitals * self.weights["vitals"]) + (p_labs * self.weights["labs"]) - (safe_discount * self.weights["skeptic"])

        return float(np.clip(raw_score, 0.0, 1.0))

    def classify_urgency(
        self,
        composite_risk: float,
        shock_index: float,
        news2_score: int,
        p_vitals: float = 0.0,
        p_labs: float = 0.0
    ) -> str:
        """
        Classifies clinical urgency into LOW, MODERATE, or CRITICAL_SEPSIS.
        Ensures shock index >= 1.0 or high risk triggers CRITICAL_SEPSIS.
        """
        if (
            composite_risk >= 0.65 or
            shock_index >= 1.0 or
            (p_vitals >= 0.70 and shock_index >= 0.85) or
            p_labs >= 0.80
        ):
            return "CRITICAL_SEPSIS"
        elif (
            composite_risk >= 0.35 or
            shock_index >= 0.75 or
            news2_score >= 5 or
            p_vitals >= 0.40 or
            p_labs >= 0.40
        ):
            return "MODERATE"
        else:
            return "LOW"
