"""
Data Quality & Telemetry Reliability Agent
Evaluates:
1. Missingness & Completeness (core vitals and critical pathology panels)
2. Freshness & Staleness (lab age, static vitals)
3. Sensor Noise, Disconnects & Artifact Detection (e.g., impossible pulse pressure, probe drops)
4. Overall Data Quality Confidence Score [0.0, 1.0]
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
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


class DataQualityFinding(BaseModel):
    agent_name: str = "Data Quality Agent"
    timestamp: str
    confidence: float = Field(description="Confidence in underlying data integrity between 0.0 and 1.0")
    quality_tier: str = Field(description="'HIGH_INTEGRITY', 'ACCEPTABLE_WITH_GAPS', 'DEGRADED_MISSING_DATA', or 'UNRELIABLE_SENSOR_ARTIFACT'")
    vital_completeness_ratio: float
    lab_completeness_ratio: float
    signal_reliability_score: float
    missing_vitals: List[str]
    missing_labs: List[str]
    stale_features: List[str]
    detected_artifacts: List[str]
    actionable_recommendations: List[str]
    clinical_narrative: str
    evidence: Dict[str, Any]


class DataQualityAgent:
    """
    Evaluates clinical data veracity, sensor reliability, and missingness.
    Ensures predictions are contextualized by the completeness and freshness of inputs.
    """

    CORE_VITALS = ["HR", "SBP", "MAP", "Resp", "O2Sat", "Temp"]
    CRITICAL_LABS = ["Lactate", "WBC", "Creatinine", "Platelets"]

    def __init__(self):
        pass

    def evaluate(
        self,
        vitals_dict: Dict[str, Any],
        labs_dict: Dict[str, Any],
        hour_index: int = 0,
        patient_id: str = "unknown",
        lab_age_hours: Optional[float] = None,
        previous_vitals: Optional[Dict[str, Any]] = None
    ) -> DataQualityFinding:
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Missingness Assessment
        missing_v = [v for v in self.CORE_VITALS if vitals_dict.get(v) is None]
        vital_ratio = (len(self.CORE_VITALS) - len(missing_v)) / float(len(self.CORE_VITALS))

        missing_l = [l for l in self.CRITICAL_LABS if labs_dict.get(l) is None]
        lab_ratio = (len(self.CRITICAL_LABS) - len(missing_l)) / float(len(self.CRITICAL_LABS))

        # 2. Freshness & Staleness Assessment
        stale_features = []
        if lab_age_hours is not None:
            if lab_age_hours > 12.0:
                stale_features.append(f"Severely Stale Labs: Drawn {lab_age_hours:.1f} hours ago (>12h threshold)")
            elif lab_age_hours > 4.0:
                stale_features.append(f"Stale Labs: Drawn {lab_age_hours:.1f} hours ago (>4h warning)")
        elif len(missing_l) == len(self.CRITICAL_LABS):
            stale_features.append("Uncollected Blood Pathology: Zero current laboratory panels on record")

        # Check for static / frozen telemetry (possible monitor lead disconnect)
        if previous_vitals:
            unchanged_count = sum(
                1 for v in self.CORE_VITALS
                if vitals_dict.get(v) is not None and vitals_dict.get(v) == previous_vitals.get(v)
            )
            if unchanged_count >= 5:
                stale_features.append("Static Sensor Signal: Identical vitals across consecutive hours (verify telemetry transmission)")

        # 3. Artifact & Signal Reliability Assessment
        artifacts = []
        reliability_deductions = 0.0

        hr = vitals_dict.get("HR")
        sbp = vitals_dict.get("SBP")
        dbp = vitals_dict.get("DBP")
        resp = vitals_dict.get("Resp")
        o2 = vitals_dict.get("O2Sat")
        temp = vitals_dict.get("Temp")

        # Pulse pressure paradox (SBP <= DBP or SBP - DBP < 10)
        if sbp is not None and dbp is not None:
            if sbp <= dbp:
                artifacts.append(f"Inverted Blood Pressure: SBP ({sbp}) <= DBP ({dbp}) - Cuff placement or calibration failure")
                reliability_deductions += 0.35
            elif (sbp - dbp) < 12:
                artifacts.append(f"Severely Narrow Pulse Pressure ({sbp - dbp} mmHg) - Check arterial line dampening or NIBP cuff")
                reliability_deductions += 0.20

        # Isolated SpO2 drop without respiratory distress (probe detachment signature)
        if o2 is not None and o2 < 80.0:
            if resp is not None and resp < 18.0 and (hr is not None and hr < 90.0):
                artifacts.append(f"Suspected Pulse Oximeter Detachment: SpO2 {o2}% with normal Resp ({resp}) and normal HR ({hr})")
                reliability_deductions += 0.25

        # Sudden impossible vital jump from previous
        if previous_vitals:
            prev_hr = previous_vitals.get("HR")
            if hr is not None and prev_hr is not None:
                hr_delta = abs(hr - prev_hr)
                if hr_delta >= 60.0:
                    artifacts.append(f"Sudden HR Jump (Delta {hr_delta:.0f} bpm in 1h) - Assess electrode motion artifact vs true arrhythmia")
                    reliability_deductions += 0.20

        signal_reliability = max(0.10, min(1.0, 1.0 - reliability_deductions))

        # 4. Overall Confidence & Quality Tier
        # Weighted composite: 40% Vitals Completeness, 35% Signal Reliability, 25% Labs/Freshness
        freshness_score = 0.40 if len(missing_l) == len(self.CRITICAL_LABS) else (0.60 if stale_features else 1.0)
        confidence = round(
            (0.40 * vital_ratio) + (0.35 * signal_reliability) + (0.25 * freshness_score),
            4
        )

        if confidence >= 0.85 and not artifacts:
            tier = "HIGH_INTEGRITY"
        elif confidence >= 0.65 and len(artifacts) <= 1:
            tier = "ACCEPTABLE_WITH_GAPS"
        elif artifacts:
            tier = "UNRELIABLE_SENSOR_ARTIFACT"
        else:
            tier = "DEGRADED_MISSING_DATA"

        # 5. Actionable Recommendations
        recommendations = []
        if "Lactate" in missing_l:
            recommendations.append("Order STAT Blood Lactate to evaluate occult tissue hypoxia")
        if "WBC" in missing_l:
            recommendations.append("Order STAT Complete Blood Count (CBC) with differential")
        if len(missing_v) >= 2:
            recommendations.append(f"Perform manual bedside vitals verification: Missing ({', '.join(missing_v)})")
        if artifacts:
            recommendations.append("Inspect bedside telemetry leads, SpO2 sensor placement, and arterial line zeroing")

        # 6. Clinical Narrative
        narrative = (
            f"Data Quality: Tier {tier} (Confidence: {confidence*100:.1f}%). "
            f"Vitals Completeness: {vital_ratio*100:.0f}%, Labs Completeness: {lab_ratio*100:.0f}%. "
        )
        if artifacts:
            narrative += f"Identified {len(artifacts)} potential artifact(s): {'; '.join(artifacts)}. "
        if stale_features:
            narrative += f"Staleness Notice: {'; '.join(stale_features)}. "
        if not artifacts and not stale_features and vital_ratio == 1.0:
            narrative += "All core vitals continuously streamed with zero signal anomalies."

        return DataQualityFinding(
            agent_name="Data Quality Agent",
            timestamp=now_iso,
            confidence=confidence,
            quality_tier=tier,
            vital_completeness_ratio=round(vital_ratio, 2),
            lab_completeness_ratio=round(lab_ratio, 2),
            signal_reliability_score=round(signal_reliability, 2),
            missing_vitals=missing_v,
            missing_labs=missing_l,
            stale_features=stale_features,
            detected_artifacts=artifacts,
            actionable_recommendations=recommendations,
            clinical_narrative=narrative,
            evidence={
                "hour_index": hour_index,
                "patient_id": patient_id,
                "vital_completeness": f"{vital_ratio*100:.0f}%",
                "lab_completeness": f"{lab_ratio*100:.0f}%",
                "signal_reliability": signal_reliability,
                "missing_vitals_count": len(missing_v),
                "missing_labs_count": len(missing_l)
            }
        )


if __name__ == "__main__":
    agent = DataQualityAgent()

    # Test 1: Complete & Fresh Telemetry
    good_vitals = {"HR": 88.0, "SBP": 120.0, "DBP": 78.0, "MAP": 92.0, "Resp": 18.0, "O2Sat": 98.0, "Temp": 37.0}
    good_labs = {"Lactate": 1.4, "WBC": 8.2, "Creatinine": 0.9, "Platelets": 210.0}
    res1 = agent.evaluate(good_vitals, good_labs, patient_id="p001")

    print("\n" + "=" * 65)
    print("      AEGIS-ICU: DATA QUALITY AGENT INFERENCE")
    print("=" * 65)
    print(" [TEST CASE 1: HIGH INTEGRITY STREAM]")
    print(f" [+] Quality Tier           : {res1.quality_tier}")
    print(f" [+] Quality Confidence     : {res1.confidence * 100:.1f}%")
    print(f" [+] Vitals Completeness    : {res1.vital_completeness_ratio * 100:.0f}%")
    print(f" [+] Labs Completeness      : {res1.lab_completeness_ratio * 100:.0f}%")
    print(f" [+] Signal Reliability     : {res1.signal_reliability_score * 100:.0f}%")
    print(f" [+] Clinical Narrative     : {res1.clinical_narrative}")
    print("-" * 65)

    # Test 2: Inverted Blood Pressure Artifact + Missing Labs
    bad_vitals = {"HR": 105.0, "SBP": 70.0, "DBP": 85.0, "MAP": 75.0, "Resp": 20.0, "O2Sat": 95.0, "Temp": 37.5}
    missing_labs = {}
    res2 = agent.evaluate(bad_vitals, missing_labs, patient_id="p002")
    print("\n [TEST CASE 2: INVERTED BP ARTIFACT + UNCOLLECTED LABS]")
    print(f" [+] Quality Tier           : {res2.quality_tier}")
    print(f" [+] Quality Confidence     : {res2.confidence * 100:.1f}%")
    print(f" [+] Detected Artifacts     : {res2.detected_artifacts}")
    print(f" [+] Recommendations        : {res2.actionable_recommendations}")
    print(f" [+] Clinical Narrative     : {res2.clinical_narrative}")
    print("=" * 65 + "\n")
