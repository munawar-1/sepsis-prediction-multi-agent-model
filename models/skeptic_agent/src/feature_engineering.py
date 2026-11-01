"""
Model 3 (Skeptic Agent): Feature Engineering & Confounder Analysis
Parses Electronic Health Records (EHR) and FHIR resource bundles,
correlates medications and pre-existing conditions with telemetry spikes,
and computes physiological discordance to identify false alarms vs real sepsis.
"""

import os
from typing import Dict, List, Any, Optional

# Known clinical medication classes and physiological confounders
SYMPATHOMIMETIC_MEDS = {
    "albuterol": {"effect": "Sinus Tachycardia (+15 to +30 bpm)", "confounder_type": "DRUG_INDUCED_TACHYCARDIA"},
    "salbutamol": {"effect": "Sinus Tachycardia (+15 to +30 bpm)", "confounder_type": "DRUG_INDUCED_TACHYCARDIA"},
    "epinephrine": {"effect": "Severe Tachycardia & Inotropy", "confounder_type": "VASOPRESSOR_INOTROPE"},
    "dobutamine": {"effect": "Inotropic Tachycardia", "confounder_type": "INOTROPIC_STIMULATION"},
    "dopamine": {"effect": "Dose-dependent Tachycardia", "confounder_type": "INOTROPIC_STIMULATION"},
    "atropine": {"effect": "Vagolytic Tachycardia", "confounder_type": "ANTICHOLINERGIC_TACHYCARDIA"},
    "terbutaline": {"effect": "Bronchodilator Tachycardia", "confounder_type": "DRUG_INDUCED_TACHYCARDIA"},
    "isoproterenol": {"effect": "Beta-1/Beta-2 Tachycardia", "confounder_type": "SYMPATHOMIMETIC"}
}

VASODILATOR_MEDS = {
    "hydralazine": {"effect": "Reflex Tachycardia & Hypotension", "confounder_type": "VASODILATOR_REFLEX"},
    "nitroglycerin": {"effect": "Transient Hypotension & Reflex Tachycardia", "confounder_type": "VASODILATOR_REFLEX"},
    "nitroprusside": {"effect": "Direct Vasodilation", "confounder_type": "VASODILATOR_REFLEX"},
    "amlodipine": {"effect": "Peripheral Vasodilation", "confounder_type": "CALCIUM_CHANNEL_BLOCKER"}
}

BETA_BLOCKERS = {
    "metoprolol": {"effect": "Masks Tachycardia in True Sepsis", "confounder_type": "BETA_BLOCKER_MASKING"},
    "atenolol": {"effect": "Blunts Heart Rate Response", "confounder_type": "BETA_BLOCKER_MASKING"},
    "carvedilol": {"effect": "Alpha/Beta Blocker Blunting", "confounder_type": "BETA_BLOCKER_MASKING"},
    "labetalol": {"effect": "Bradycardia & BP Lowering", "confounder_type": "BETA_BLOCKER_MASKING"}
}

HIGH_RISK_IMMUNOCOMPROMISED_CONDITIONS = [
    "neutropenia", "chemotherapy", "immunosuppressed", "asplenia",
    "organ transplant", "bone marrow transplant", "hiv", "active malignancy",
    "high-dose corticosteroid", "leukemia", "lymphoma"
]

BENIGN_CONDITIONS = [
    "asthma", "copd exacerbation", "post-operative pain", "post-extubation shivering",
    "anxiety", "isolated fever", "sinusitis"
]


def parse_ehr_data(ehr_input: Any) -> Dict[str, Any]:
    """
    Normalizes EHR data from either:
    1. A list of medication strings e.g. ['Albuterol', 'Ceftriaxone']
    2. A dictionary containing 'medications', 'conditions', 'notes'
    3. An HL7 FHIR Bundle JSON object (containing Patient, Condition, MedicationRequest)
    """
    normalized = {
        "medications": [],
        "conditions": [],
        "patient_id": None,
        "raw_notes": []
    }

    if not ehr_input:
        return normalized

    # Case 1: Simple list of strings
    if isinstance(ehr_input, list):
        for item in ehr_input:
            if isinstance(item, str):
                normalized["medications"].append(item.strip())
            elif isinstance(item, dict):
                name = item.get("display") or item.get("name") or item.get("code") or str(item)
                normalized["medications"].append(name)
        return normalized

    # Case 2: Dictionary
    if isinstance(ehr_input, dict):
        # Check if it's a FHIR Bundle
        if ehr_input.get("resourceType") == "Bundle" and "entry" in ehr_input:
            for entry in ehr_input.get("entry", []):
                resource = entry.get("resource", {})
                res_type = resource.get("resourceType")
                
                if res_type == "Patient":
                    normalized["patient_id"] = resource.get("id")
                elif res_type == "Condition":
                    code_obj = resource.get("code", {})
                    for coding in code_obj.get("coding", []):
                        display = coding.get("display")
                        if display:
                            normalized["conditions"].append(display)
                elif res_type in ["MedicationRequest", "MedicationAdministration", "MedicationStatement"]:
                    med_cc = resource.get("medicationCodeableConcept", {})
                    for coding in med_cc.get("coding", []):
                        display = coding.get("display")
                        if display:
                            normalized["medications"].append(display)
            return normalized

        # Generic dictionary with keys
        if "medications" in ehr_input:
            normalized["medications"] = list(ehr_input["medications"])
        if "conditions" in ehr_input:
            normalized["conditions"] = list(ehr_input["conditions"])
        if "patient_id" in ehr_input:
            normalized["patient_id"] = ehr_input["patient_id"]
        if "notes" in ehr_input:
            notes = ehr_input["notes"]
            normalized["raw_notes"] = notes if isinstance(notes, list) else [str(notes)]

    return normalized


def analyze_confounders(
    vitals_telemetry: Dict[str, Any],
    labs_telemetry: Dict[str, Any],
    ehr_parsed: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluates whether elevated vitals/labs are explained by benign EHR confounders
    (e.g., Albuterol causing tachycardia) or represent true septic shock.
    """
    medications = ehr_parsed.get("medications", [])
    conditions = ehr_parsed.get("conditions", [])

    matched_sympathomimetics = []
    matched_vasodilators = []
    matched_beta_blockers = []
    matched_immunocompromised = []

    # Check medications
    for med in medications:
        med_lower = med.lower()
        for sym_name, sym_info in SYMPATHOMIMETIC_MEDS.items():
            if sym_name in med_lower:
                matched_sympathomimetics.append(f"{med} ({sym_info['effect']})")
        for vas_name, vas_info in VASODILATOR_MEDS.items():
            if vas_name in med_lower:
                matched_vasodilators.append(f"{med} ({vas_info['effect']})")
        for bb_name, bb_info in BETA_BLOCKERS.items():
            if bb_name in med_lower:
                matched_beta_blockers.append(f"{med} ({bb_info['effect']})")

    # Check conditions
    for cond in conditions:
        cond_lower = cond.lower()
        for immuno in HIGH_RISK_IMMUNOCOMPROMISED_CONDITIONS:
            if immuno in cond_lower:
                matched_immunocompromised.append(cond)
                break

    # Extract physiology
    hr = float(vitals_telemetry.get("HR") or 80.0)
    sbp = float(vitals_telemetry.get("SBP") or 120.0)
    resp = float(vitals_telemetry.get("Resp") or 18.0)
    shock_index = hr / max(sbp, 1.0)

    lactate = labs_telemetry.get("Lactate")
    wbc = labs_telemetry.get("WBC")
    platelets = labs_telemetry.get("Platelets")

    lactate_val = float(lactate) if lactate is not None else None
    wbc_val = float(wbc) if wbc is not None else None
    platelets_val = float(platelets) if platelets is not None else None

    # Physiological discordance calculations
    # 1. Isolated tachycardia: HR > 95 but Resp <= 20 and Shock Index < 0.85
    isolated_tachycardia = (hr >= 95.0 and resp <= 20.0 and shock_index < 0.85)

    # 2. Benign metabolic profile: Lactate < 2.0 (no cellular hypoxia) and WBC in normal range
    benign_metabolism = (
        (lactate_val is not None and lactate_val < 2.0) and
        (wbc_val is None or (4.0 <= wbc_val <= 11.5)) and
        (platelets_val is None or platelets_val >= 150.0)
    )

    # 3. Severe septic markers present: Lactate >= 2.5, WBC abnormal, platelets < 100
    has_septic_biomarkers = (
        (lactate_val is not None and lactate_val >= 2.5) or
        (wbc_val is not None and (wbc_val > 14.0 or wbc_val < 4.0)) or
        (platelets_val is not None and platelets_val < 100.0) or
        (resp >= 24.0) or
        (shock_index >= 1.0)
    )

    return {
        "matched_sympathomimetics": matched_sympathomimetics,
        "matched_vasodilators": matched_vasodilators,
        "matched_beta_blockers": matched_beta_blockers,
        "matched_immunocompromised": matched_immunocompromised,
        "isolated_tachycardia": isolated_tachycardia,
        "benign_metabolism": benign_metabolism,
        "has_septic_biomarkers": has_septic_biomarkers,
        "shock_index": round(shock_index, 2),
        "hr": hr,
        "resp": resp,
        "lactate": lactate_val,
        "wbc": wbc_val
    }
