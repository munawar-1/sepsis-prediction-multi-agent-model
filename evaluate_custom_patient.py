#!/usr/bin/env python3
"""
Aegis-ICU: Custom Patient Multi-Agent Evaluation Tool
Runs Agent 1 (Vitals), Agent 2 (Labs), and Agent 3 (Skeptic False Alarm Filter)
with custom vitals, laboratory biomarkers, and EHR medication/condition records.
"""

import sys
import os
import json
import argparse

# Ensure OpenQuest root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.triage_orchestrator.src.orchestrator import SepsisOrchestrator


def run_evaluation(
    patient_id: str,
    hour: int,
    vitals: dict,
    labs: dict,
    meds: list,
    conditions: list,
    ollama_model: str = "llama3"
):
    print("\n" + "=" * 75)
    print(f"      AEGIS-ICU: MULTI-AGENT EVALUATION ON CUSTOM PATIENT ({patient_id})")
    print("=" * 75)

    print("\n[1] INPUT TELEMETRY & EHR DATA:")
    print(f" [+] Vitals       : {vitals}")
    print(f" [+] Labs         : {labs}")
    print(f" [+] Medications  : {meds if meds else 'None documented'}")
    print(f" [+] Conditions   : {conditions if conditions else 'None documented'}")

    ehr_data = {
        "medications": meds,
        "conditions": conditions
    }

    orchestrator = SepsisOrchestrator(ollama_model=ollama_model)
    eval_result = orchestrator.evaluate(
        patient_id=patient_id,
        hour=hour,
        vitals_dict=vitals,
        labs_dict=labs,
        meds_list=meds,
        ehr_data=ehr_data
    )

    v_ev = eval_result.vitals_evidence
    l_ev = eval_result.labs_evidence
    s_ev = eval_result.skeptic_evidence

    # Display Agent 1 (Vitals)
    print("\n" + "-" * 75)
    print(" [AGENT 1: VITALS AGENT]")
    print(f"  * Engine Used             : {v_ev.get('llm_source')}")
    print(f"  * Sepsis Risk Probability : {v_ev.get('vitals_risk_probability', 0)*100:.1f}%")
    print(f"  * Risk Tier               : {v_ev.get('risk_level')}")
    print(f"  * Hemodynamic Stage       : {v_ev.get('hemodynamic_stage')}")
    print(f"  * Shock Index             : {v_ev.get('shock_index')} (Normal < 0.70)")
    print(f"  * NEWS2 Score             : {v_ev.get('news2_score')}")
    print(f"  * Risk Drivers Identified : {v_ev.get('risk_drivers')}")
    print(f"  * Discrepancy Rationale   : {v_ev.get('discrepancy_rationale')}")
    print("  * Top SHAP Feature Contributions:")
    for feat, val in list(v_ev.get("shap_contributions", {}).items())[:4]:
        direction = "↑ Increases Risk" if val > 0 else "↓ Lowers Risk"
        print(f"    - {feat:<15}: {'+' if val > 0 else ''}{val:.4f} ({direction})")
    print(f"  * Clinical Reasoning:\n    \"{v_ev.get('clinical_explanation')}\"")

    # Display Agent 2 (Labs)
    print("\n" + "-" * 75)
    print(" [AGENT 2: LABS & PATHOLOGY AGENT]")
    print(f"  * Engine Used             : {l_ev.get('llm_source')}")
    print(f"  * Sepsis Risk Probability : {l_ev.get('labs_risk_probability', 0)*100:.1f}%")
    print(f"  * Organ Stress Level      : {l_ev.get('organ_stress_level')}")
    print(f"  * Cellular Hypoxia Grade  : {l_ev.get('cellular_hypoxia_grade')}")
    print(f"  * Freshness Status        : {l_ev.get('freshness_status')}")
    print(f"  * Abnormal Biomarkers     : {l_ev.get('abnormal_biomarkers')}")
    if l_ev.get("stat_lab_draws_required"):
        print(f"  * STAT Escalations        : {l_ev.get('stat_lab_draws_required')}")
    print("  * Top SHAP Feature Contributions:")
    for feat, val in list(l_ev.get("shap_contributions", {}).items())[:4]:
        direction = "↑ Increases Risk" if val > 0 else "↓ Lowers Risk"
        print(f"    - {feat:<15}: {'+' if val > 0 else ''}{val:.4f} ({direction})")
    print(f"  * Clinical Reasoning:\n    \"{l_ev.get('pathology_summary')}\"")

    # Display Agent 3 (Skeptic False Alarm Filter)
    print("\n" + "-" * 75)
    print(" [AGENT 3: SKEPTIC & FALSE ALARM CHECKER]")
    print(f"  * Engine Used             : {s_ev.get('llm_source')}")
    print(f"  * Is False Alarm          : {s_ev.get('is_false_alarm')}")
    print(f"  * Classification          : {s_ev.get('classification')}")
    print(f"  * Confidence Discount (D) : {s_ev.get('confidence_discount_factor'):.2f} (0.0=Genuine Sepsis, 1.0=Pure False Alarm)")
    print(f"  * Alarm Suppression Rec.  : {s_ev.get('alarm_suppression_recommended')}")
    print(f"  * Detected Confounders    : {s_ev.get('detected_confounders')}")
    print(f"  * Action Recommendation   : {s_ev.get('recommended_action')}")
    print(f"  * SHAP Critique           : {s_ev.get('shap_attribution_critique')}")
    print(f"  * Clinical Reasoning:\n    \"{s_ev.get('clinical_reasoning')}\"")

    # Display Final Consensus (Triage Orchestrator)
    print("\n" + "=" * 75)
    print(" [FINAL CONSENSUS: TRIAGE ORCHESTRATOR]")
    print(f"  * Composite Calibrated Risk : {eval_result.composite_sepsis_risk*100:.1f}%")
    print(f"  * Urgency Tier              : {eval_result.urgency_level}")
    print(f"  * Discrepancy Flag          : {eval_result.discrepancy_detected} (AI flags early risk while NEWS2 is low)")
    print(f"  * Requires HITL Review      : {eval_result.requires_hitl_action}")
    print("\n  * Recommended Sepsis-3 Action Bundle:")
    for action in eval_result.recommended_action_bundle:
        print(f"    [{action.get('priority', 'ACTION')}] {action.get('action')}")
        if 'notes' in action:
            print(f"       Notes: {action['notes']}")

    print("=" * 75 + "\n")
    return eval_result


def main():
    parser = argparse.ArgumentParser(description="Aegis-ICU Custom Patient Evaluation")
    parser.add_argument("--patient-id", default="p_custom_01", help="Patient Identifier")
    parser.add_argument("--hour", type=int, default=1, help="ICU Hour Index")
    
    # Vitals
    parser.add_argument("--hr", type=float, default=None, help="Heart Rate (bpm)")
    parser.add_argument("--sbp", type=float, default=None, help="Systolic Blood Pressure (mmHg)")
    parser.add_argument("--dbp", type=float, default=None, help="Diastolic Blood Pressure (mmHg)")
    parser.add_argument("--map", type=float, default=None, help="Mean Arterial Pressure (mmHg)")
    parser.add_argument("--resp", type=float, default=None, help="Respiratory Rate (/min)")
    parser.add_argument("--temp", type=float, default=None, help="Body Temperature (°C)")
    parser.add_argument("--o2", type=float, default=None, help="Oxygen Saturation SpO2 (percentage)")

    # Labs
    parser.add_argument("--lactate", type=float, default=None, help="Serum Lactate (mmol/L)")
    parser.add_argument("--wbc", type=float, default=None, help="White Blood Cell count (x10^3/uL)")
    parser.add_argument("--creatinine", type=float, default=None, help="Creatinine (mg/dL)")
    parser.add_argument("--platelets", type=float, default=None, help="Platelets (x10^3/uL)")

    # EHR
    parser.add_argument("--meds", type=str, default="", help="Comma-separated active medications")
    parser.add_argument("--conditions", type=str, default="", help="Comma-separated pre-existing conditions")
    parser.add_argument("--ollama-model", type=str, default="llama3", help="Ollama model name (default: llama3)")
    parser.add_argument("--json-file", type=str, default=None, help="Path to JSON file with patient input")

    args = parser.parse_args()

    if args.json_file and os.path.exists(args.json_file):
        with open(args.json_file, "r") as f:
            data = json.load(f)
            vitals = data.get("vitals", {})
            labs = data.get("labs", {})
            meds = data.get("medications", [])
            conditions = data.get("conditions", [])
            patient_id = data.get("patient_id", args.patient_id)
            hour = data.get("hour", args.hour)
    else:
        # Default scenario if no CLI flags provided
        hr = args.hr if args.hr is not None else 112.0
        sbp = args.sbp if args.sbp is not None else 118.0
        resp = args.resp if args.resp is not None else 18.0
        lactate = args.lactate if args.lactate is not None else 1.2
        wbc = args.wbc if args.wbc is not None else 7.5

        vitals = {
            "HR": hr,
            "SBP": sbp,
            "MAP": args.map or (sbp * 0.33 + 70.0 * 0.67),
            "Resp": resp,
            "O2Sat": args.o2 or 98.0,
            "Temp": args.temp or 37.0
        }
        labs = {
            "Lactate": lactate,
            "WBC": wbc,
            "Creatinine": args.creatinine or 0.9,
            "Platelets": args.platelets or 220.0
        }
        meds = [m.strip() for m in args.meds.split(",") if m.strip()] if args.meds else ["Albuterol 0.83 mg/mL Inhalation Solution"]
        conditions = [c.strip() for c in args.conditions.split(",") if c.strip()] if args.conditions else ["Asthma, unspecified"]
        patient_id = args.patient_id
        hour = args.hour

    run_evaluation(
        patient_id=patient_id,
        hour=hour,
        vitals=vitals,
        labs=labs,
        meds=meds,
        conditions=conditions,
        ollama_model=args.ollama_model
    )


if __name__ == "__main__":
    main()
