"""
Model 4 (Triage Orchestrator): Clinical Action Recommender & HITL Bundle Generator
Translates urgency tiers into standard Surviving Sepsis Campaign (Sepsis-3) 1-Hour Bundles
for physician approval on the React Flight Deck.
"""

from typing import List, Dict

SEPSIS_3_ONE_HOUR_BUNDLE = [
    {
        "id": "ACT_LACTATE",
        "action": "Measure STAT Blood Lactate",
        "rationale": "Identify tissue hypoperfusion. Re-measure within 2-4 hours if initial > 2.0 mmol/L.",
        "urgent": True
    },
    {
        "id": "ACT_BLOOD_CULTURES",
        "action": "Obtain Blood Cultures (Aerobic & Anaerobic) prior to antimicrobials",
        "rationale": "Identify causative pathogen from 2 distinct sites (peripheral and central lines).",
        "urgent": True
    },
    {
        "id": "ACT_ANTIBIOTICS",
        "action": "Administer Broad-Spectrum IV Antimicrobials",
        "rationale": "Empiric intravenous antibiotic coverage within 1 hour of recognition.",
        "urgent": True
    },
    {
        "id": "ACT_FLUID_RESUSCITATION",
        "action": "Begin Rapid IV Crystalloid Infusion (30 mL/kg)",
        "rationale": "Indicated for hypotension (MAP < 65) or serum lactate >= 4.0 mmol/L.",
        "urgent": True
    },
    {
        "id": "ACT_VASOPRESSORS",
        "action": "Initiate Vasopressor Infusion (Norepinephrine)",
        "rationale": "Maintain MAP >= 65 mmHg if patient remains hypotensive during or after fluid loading.",
        "urgent": False
    }
]

SUBCLINICAL_DIAGNOSTIC_BUNDLE = [
    {
        "id": "ACT_STAT_LABS",
        "action": "Order STAT Lactate, ABG, and Full Blood Count",
        "rationale": "Corroborate subclinical vitals strain (creeping Shock Index).",
        "urgent": True
    },
    {
        "id": "ACT_VITALS_FREQUENCY",
        "action": "Escalate Telemetry Monitoring to Q15min",
        "rationale": "Monitor for impending blood pressure decompression.",
        "urgent": True
    }
]

def generate_action_bundle(urgency_level: str) -> List[Dict]:
    if urgency_level == "CRITICAL_SEPSIS":
        return SEPSIS_3_ONE_HOUR_BUNDLE
    elif urgency_level == "MODERATE":
        return SUBCLINICAL_DIAGNOSTIC_BUNDLE
    else:
        return [{"id": "ACT_ROUTINE", "action": "Continue Standard ICU Monitoring", "rationale": "Patient stable.", "urgent": False}]
