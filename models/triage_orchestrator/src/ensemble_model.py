"""
Model 4 (Triage Orchestrator): Meta-Ensemble Consensus Model
Calibrates and fuses predictions from Model 1 (Vitals), Model 2 (Labs),
and Model 3 (Skeptic) into an explainable composite risk score.
"""

import os
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "artifacts", "meta_ensemble.pkl")

class MetaEnsembleClassifier:
    def __init__(self, weights=None):
        # Default calibrated clinical weights
        # Vitals: 0.45, Labs: 0.35, Skeptic discount: -0.20
        self.weights = weights or {"vitals": 0.45, "labs": 0.35, "skeptic": 0.20}

    def compute_composite_risk(self, p_vitals: float, p_labs: float, discount: float, has_fresh_labs: bool) -> float:
        """
        Dynamically shifts weighting based on lab availability.
        """
        if not has_fresh_labs:
            # Shift weight to vitals when blood pathology is uncollected
            effective_vitals = p_vitals * 0.70
            effective_skeptic = discount * 0.20
            raw_score = effective_vitals - effective_skeptic
        else:
            raw_score = (p_vitals * self.weights["vitals"]) + (p_labs * self.weights["labs"]) - (discount * self.weights["skeptic"])
            
        return float(np.clip(raw_score, 0.0, 1.0))

    def classify_urgency(self, composite_risk: float, shock_index: float, news2_score: int) -> str:
        if composite_risk >= 0.70 or shock_index >= 1.0:
            return "CRITICAL_SEPSIS"
        elif composite_risk >= 0.40 or shock_index >= 0.85 or news2_score >= 5:
            return "MODERATE"
        else:
            return "LOW"
