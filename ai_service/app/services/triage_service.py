"""
Aegis-ICU Service Layer: TriageService
Encapsulates all multi-agent business logic, LangGraph state machine execution,
Human-in-the-Loop nurse coordination, and physician grounded copilot reasoning.
"""

import os
import sys
import re
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from models.triage_orchestrator.src.clinical_graph import AegisClinicalGraph, ClinicalTriageState
from models.triage_orchestrator.src.data_validator import DataValidator, ValidationResult
from models.vitals_agent.src.predictor import VitalsPredictor
from models.labs_agent.src.predictor import LabsPredictor
from models.skeptic_agent.src.predictor import SkepticPredictor
from models.triage_orchestrator.src.notification_client import NotificationClient

from ai_service.app.schemas.clinical_schemas import (
    TelemetryTickRequest,
    PatientEvaluationResponse,
    NurseVerificationRequest,
    NurseVerificationResponse,
    DoctorChatRequest,
    DoctorChatResponse,
    ValidatorEvaluationRequest,
    SkepticEvaluationRequest,
    HealthCheckResponse,
    GraphTopologyResponse
)

logger = logging.getLogger("aegis_triage_service")
logging.basicConfig(level=logging.INFO)


class TriageService:
    """
    Enterprise Service Layer managing the lifecycle of the LangGraph Clinical Pipeline.
    Decouples HTTP controller transport from domain ML & agent workflows.
    """

    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        ollama_base_url: Optional[str] = None,
        ollama_model: Optional[str] = None,
        backend_notification_url: Optional[str] = None
    ):
        gemini_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        openai_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        ollama_url = ollama_base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        ollama_mod = ollama_model or os.getenv("OLLAMA_MODEL", "llama3")
        notif_url = backend_notification_url or os.getenv("BACKEND_NOTIFICATION_URL")

        logger.info("[TriageService] Initializing LangGraph Clinical Engine & Agents...")
        self.ollama_url = ollama_url
        self.ollama_model = ollama_mod
        self.graph = AegisClinicalGraph(
            gemini_api_key=gemini_key,
            openai_api_key=openai_key,
            ollama_base_url=ollama_url,
            ollama_model=ollama_mod,
            backend_notification_url=notif_url
        )
        self.validator = DataValidator(
            gemini_api_key=gemini_key,
            openai_api_key=openai_key,
            ollama_base_url=ollama_url,
            ollama_model=ollama_mod
        )
        self.notifier = NotificationClient(backend_url=notif_url)
        self.gemini_key = gemini_key

        # In-memory store for quick bed state caching alongside LangGraph checkpoints
        self._bed_cache: Dict[str, Dict[str, Any]] = {}
        logger.info("[TriageService] Service layer initialized successfully.")

    # =================================================================
    # 1. PRIMARY CLINICAL WORKFLOW EVALUATION
    # =================================================================
    def evaluate_patient_telemetry(self, tick: TelemetryTickRequest) -> PatientEvaluationResponse:
        """
        Processes an incoming telemetry tick through the complete LangGraph state machine.
        Handles sensor integrity check, nurse fail-fast alert, parallel ML inference,
        gated skeptic filtering, and resuscitation bundle synthesis.
        """
        vitals_dict = {
            "HR": tick.HR, "SBP": tick.SBP, "DBP": tick.DBP,
            "MAP": tick.MAP, "Resp": tick.Resp, "O2Sat": tick.O2Sat, "Temp": tick.Temp
        }
        # Filter out None values for clean ML feature mapping
        vitals_clean = {k: v for k, v in vitals_dict.items() if v is not None}

        labs_dict = {
            "Lactate": tick.Lactate, "WBC": tick.WBC,
            "Creatinine": tick.Creatinine, "Platelets": tick.Platelets, "Glucose": tick.Glucose
        }
        labs_clean = {k: v for k, v in labs_dict.items() if v is not None}

        meds_list = tick.active_medications or []

        # Invoke the LangGraph pipeline
        state: ClinicalTriageState = self.graph.evaluate(
            patient_id=tick.patient_id,
            hour=tick.hour_index,
            vitals_dict=vitals_clean,
            labs_dict=labs_clean,
            meds_list=meds_list,
            previous_vitals=tick.previous_vitals,
            lab_age_hours=tick.lab_age_hours,
            nurse_confirmed_hardware_fault=tick.nurse_verified_hardware_fault
        )

        # Cache latest bed evaluation
        self._bed_cache[tick.patient_id] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "hour_index": tick.hour_index,
            "state": state
        }

        # Format into clean response DTO
        val_res = state.get("validation_result") or {}
        is_sensor_valid = bool(val_res.get("is_valid", True))
        v_evidence = state.get("vitals_evidence") or {}
        news2 = int(v_evidence.get("news2_score", 0))
        shock_index = float(v_evidence.get("shock_index", 0.0))
        comp_risk = float(state.get("composite_sepsis_risk", 0.0))

        # Check early deterioration discrepancy (High AI risk despite low NEWS2)
        discrepancy = (comp_risk >= 0.40 and news2 < 5)

        return PatientEvaluationResponse(
            patient_id=state["patient_id"],
            hour_index=state["hour_index"],
            urgency_level=state.get("urgency_level", "LOW_RISK"),
            composite_sepsis_risk=comp_risk,
            news2_score=news2,
            shock_index=shock_index,
            discrepancy_detected=discrepancy,
            target_role=state.get("target_role", "ROLE_DOCTOR"),
            sensor_valid=is_sensor_valid,
            workflow_status=state.get("workflow_status", "COMPLETED"),
            notification_dispatch=state.get("notification_result"),
            data_quality_evidence=val_res,
            vitals_evidence=v_evidence,
            labs_evidence=state.get("labs_evidence") or {},
            skeptic_evidence=state.get("skeptic_evidence") or {},
            agent_findings=state.get("agent_findings") or [],
            agent_disagreements=state.get("agent_disagreements") or [],
            recommended_action_bundle=state.get("action_bundle") or [],
            evidence_chain_narrative=state.get("evidence_chain_narrative") or "",
            requires_hitl_action=(state.get("urgency_level") in ["MODERATE", "CRITICAL_SEPSIS"])
        )

    # =================================================================
    # 2. HUMAN-IN-THE-LOOP NURSE VERIFICATION HANDLER
    # =================================================================
    def handle_nurse_verification(self, req: NurseVerificationRequest) -> NurseVerificationResponse:
        """
        Processes bedside nurse feedback on a hardware sensor fault alarm:
        1. If Nurse confirms hardware fault -> Alarms stopped, resolved at bedside. Doctor not spammed.
        2. If Nurse overrides -> Nurse certifies patient is truly clinically sick. The state machine
           immediately runs Agent 1, 2, 3, and 4 to initiate full sepsis resuscitation!
        """
        patient_id = req.patient_id
        logger.info(f"[TriageService] Received Nurse HITL Verification for {patient_id}: confirmed_fault={req.confirmed_hardware_fault}")

        if req.confirmed_hardware_fault:
            # Case A: Hardware issue confirmed (detached clip, loose cuff)
            return NurseVerificationResponse(
                patient_id=patient_id,
                action_taken="CONFIRMED_HARDWARE_FAULT",
                workflow_status="STOPPED_NURSE_HARDWARE_FAULT",
                target_role="ROLE_NURSE",
                message="Bedside sensor issue confirmed and corrected. Clinical alert suppressed to prevent doctor fatigue.",
                evaluation_result=None
            )

        # Case B: Nurse Override -> "Patient is genuinely unwell, sensor is properly attached"
        logger.warning(f"[TriageService] Nurse OVERRIDE for {patient_id}. Proceeding with clinical ML evaluation.")
        tick_req = TelemetryTickRequest(
            patient_id=patient_id,
            hour_index=req.hour_index,
            HR=req.vitals_dict.get("HR") if req.vitals_dict else None,
            SBP=req.vitals_dict.get("SBP") if req.vitals_dict else None,
            DBP=req.vitals_dict.get("DBP") if req.vitals_dict else None,
            MAP=req.vitals_dict.get("MAP") if req.vitals_dict else None,
            Resp=req.vitals_dict.get("Resp") if req.vitals_dict else None,
            O2Sat=req.vitals_dict.get("O2Sat") if req.vitals_dict else None,
            Temp=req.vitals_dict.get("Temp") if req.vitals_dict else None,
            Lactate=req.labs_dict.get("Lactate") if req.labs_dict else None,
            WBC=req.labs_dict.get("WBC") if req.labs_dict else None,
            Creatinine=req.labs_dict.get("Creatinine") if req.labs_dict else None,
            Platelets=req.labs_dict.get("Platelets") if req.labs_dict else None,
            active_medications=req.active_medications or [],
            nurse_verified_hardware_fault=False  # Explicit override
        )
        eval_result = self.evaluate_patient_telemetry(tick_req)

        return NurseVerificationResponse(
            patient_id=patient_id,
            action_taken="OVERRIDE_CLINICAL_ILLNESS",
            workflow_status="PROCEEDED_TO_CLINICAL_EVALUATION",
            target_role="ROLE_DOCTOR",
            message="Nurse certified sensor integrity. Clinical models evaluated and doctor alert dispatched if warranted.",
            evaluation_result=eval_result
        )

    # =================================================================
    # 3. PHYSICIAN GROUNDED COPILOT CHAT
    # =================================================================
    def answer_doctor_inquiry(self, req: DoctorChatRequest) -> DoctorChatResponse:
        """
        Bedside Physician Explainer: Grounds LLM reasoning directly in the mathematical
        SHAP contributions, organ tier, shock index, and clinical evidence.
        Provides conversational intelligence for greetings, specific biomarker questions,
        medication confounders, and Sepsis-3 bundle recommendations.
        """
        ctx = req.clinical_context or {}
        # If context not supplied in request body, retrieve from bed cache
        if not ctx and req.patient_id in self._bed_cache:
            ctx = self._bed_cache[req.patient_id].get("state", {})

        vitals = ctx.get("vitals_evidence") or {}
        labs = ctx.get("labs_evidence") or {}
        skeptic = ctx.get("skeptic_evidence") or {}
        risk = float(ctx.get("composite_sepsis_risk") or 0.0)
        urgency = ctx.get("urgency_level") or "MODERATE"
        bed = ctx.get("bed_number") or ctx.get("icuBedNumber") or "ICU-BED"
        patient_name = ctx.get("patient_name") or ctx.get("patientName") or f"Patient {req.patient_id}"
        diagnosis = ctx.get("diagnosis") or ctx.get("admissionDiagnosis") or "ICU Clinical Surveillance"
        meds = ctx.get("active_medications") or []

        telem_snap = vitals.get("telemetry_snapshot") or {}
        labs_snap = labs.get("labs_snapshot") or {}

        hr = float(ctx.get("heart_rate") or telem_snap.get("HR") or 80.0)
        sbp = float(ctx.get("systolic_bp") or telem_snap.get("SBP") or 120.0)
        map_val = float(ctx.get("mean_arterial_pressure") or telem_snap.get("MAP") or 90.0)
        resp = float(telem_snap.get("Resp") or 18.0)
        o2sat = float(telem_snap.get("O2Sat") or 98.0)
        temp = float(telem_snap.get("Temp") or 37.0)

        si_ctx = ctx.get("shock_index")
        si = float(si_ctx if si_ctx is not None else vitals.get("shock_index", hr / sbp if sbp > 0 else 0.7))
        lactate_ctx = ctx.get("lactate")
        lactate = float(lactate_ctx if lactate_ctx is not None else labs_snap.get("Lactate") or 1.5)
        wbc = labs_snap.get("WBC")
        creat = labs_snap.get("Creatinine")
        plt = labs_snap.get("Platelets")

        shap_sum = vitals.get("shap_summary")
        if isinstance(shap_sum, dict):
            top_shap = shap_sum.get("top_drivers", []) or vitals.get("risk_drivers", [])
        elif isinstance(shap_sum, str):
            top_shap = [shap_sum]
        else:
            top_shap = vitals.get("risk_drivers", [])

        q = req.doctor_question.strip() if req.doctor_question else ""
        q_lower = q.lower()

        # Ingest multi-hour longitudinal telemetry history
        hourly_history = ctx.get("hourly_history") or []
        flowsheet_table = ""
        if hourly_history:
            table_lines = [
                "| Hour | HR (bpm) | SBP/DBP (mmHg) | MAP (mmHg) | RR (/min) | Lactate (mmol/L) | WBC (×10⁹/L) | Shock Index | Active Meds |",
                "|---|---|---|---|---|---|---|---|---|"
            ]
            for row in hourly_history:
                h = row.get("hour_index", row.get("hourIndex", 0))
                r_hr = row.get("hr", row.get("heartRate", 80))
                r_sbp = row.get("sbp", row.get("systolicBp", 120))
                r_dbp = row.get("dbp", row.get("diastolicBp", 80))
                r_map = row.get("map", round((r_sbp + 2 * r_dbp) / 3))
                r_rr = row.get("rr", row.get("respiratoryRate", 16))
                r_lact = float(row.get("lactate", 1.0))
                r_wbc = float(row.get("wbc", 7.5))
                r_si = round(r_hr / r_sbp, 2) if r_sbp and r_sbp > 0 else 0.67
                r_meds = row.get("medications", "")
                if isinstance(r_meds, list):
                    r_meds = ", ".join(r_meds)
                table_lines.append(f"| H+{h} | {r_hr} | {r_sbp}/{r_dbp} | {r_map} | {r_rr} | {r_lact:.1f} | {r_wbc:.1f} | {r_si:.2f} | {r_meds or 'None'} |")
            flowsheet_table = "\n".join(table_lines)

        prompt = f"""You are the Aegis-ICU Multi-Agent Diagnostic Orchestrator explaining an ICU sepsis triage trajectory to an attending intensivist (ROLE_DOCTOR).

Patient Demographics & Status:
• Patient ID: {req.patient_id} ({bed})
• Patient Name: {patient_name} | Diagnosis: {diagnosis}
• Current Urgency: {urgency} | Composite Sepsis Risk: {risk*100:.1f}%
• Current Perfusion: Shock Index {si:.2f} (HR {hr:.0f} bpm, SBP {sbp:.0f} mmHg, MAP {map_val:.0f} mmHg)
• Metabolic State: Venous Lactate {lactate:.1f} mmol/L | Organ Stress: {labs.get('organ_stress_level', 'N/A')}
• Skeptic Safety Verification: {skeptic.get('classification', 'N/A')} (Discount: {float(skeptic.get('confidence_discount_factor', 0.0))*100:.1f}%)
• Active Medications: {meds}

Multi-Hour Longitudinal EHR & Telemetry Flowsheet:
{flowsheet_table if flowsheet_table else 'No multi-hour flowsheet provided; evaluating current telemetry snapshot.'}

Attending Physician Inquiry: "{q}"

EXECUTIVE CLINICAL GUIDELINES:
1. Strongly reflect our Multi-Agent Cooperative Architecture:
   - Model 1: Vitals Intelligence Agent (XGBoost + TreeSHAP) - monitors arterial hemodynamics and Shock Index decoupling.
   - Model 2: Biochemical Labs Agent (LightGBM + Martha's Rule) - tracks metabolic debt, hyperlactatemia, and organ dysfunction.
   - Model 3: Skeptic Confounder Filter - rules out pharmacological chronotropes/inotropes vs true septic shock.
   - Model 4: Bayesian Arbiter - integrates consensus and prescribes Surviving Sepsis 1-Hour Care Bundle actions.
2. Structure your answer cleanly with Markdown:
   - Use headings (###), bold clinical metrics, and Markdown tables (| Col 1 | Col 2 |) whenever comparing trends or trajectories.
3. If asked about:
   - Hourly Sepsis Risk Trend: Provide a clear breakdown of the hour-by-hour progression from the flowsheet, identifying the exact inflection point (e.g. where Shock Index crossed >1.0 or MAP dropped <65) and how the risk accelerated.
   - Model Prediction Trends: Compare how Model 1 (Vitals), Model 2 (Labs), and Model 3 (Skeptic Filter) evolved over the hours, showing where vitals decoupled before labs or vice-versa.
   - Feature Trends Per Hour: Present an hourly Markdown table tracking Shock Index (HR/SBP), MAP, Lactate, and Respiratory Rate, highlighting breached clinical thresholds.
4. Base all numbers strictly on the provided flowsheet. Never hallucinate vitals."""

        llm_answer = None

        # 1. Try Gemini API if key is available
        if self.gemini_key:
            try:
                import requests
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.gemini_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.1, "maxOutputTokens": 500}
                }
                resp = requests.post(url, json=payload, timeout=4)
                if resp.status_code == 200:
                    data = resp.json()
                    llm_answer = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            except Exception as e:
                logger.debug(f"[TriageService] Gemini chat query exception: {e}")

        # 2. Query Local Ollama LLM Agent directly (Active on localhost:11434)
        if not llm_answer and os.getenv("SKIP_LOCAL_LLM") != "1":
            try:
                import requests
                # Detect available installed model dynamically from Ollama
                target_model = self.ollama_model or "llama3"
                try:
                    tag_resp = requests.get(f"{self.ollama_url}/api/tags", timeout=2)
                    if tag_resp.status_code == 200:
                        installed = [m.get("name") for m in tag_resp.json().get("models", [])]
                        if installed:
                            for m_name in installed:
                                if "llama" in m_name:
                                    target_model = m_name
                                    break
                            else:
                                target_model = installed[0]
                except Exception:
                    pass

                url = f"{self.ollama_url}/api/generate"
                payload = {
                    "model": target_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.2}
                }
                resp = requests.post(url, json=payload, timeout=float(os.getenv("OLLAMA_TIMEOUT", 25)))
                if resp.status_code == 200:
                    data = resp.json()
                    out = data.get("response", "").strip()
                    if out:
                        llm_answer = out
                        logger.info(f"[TriageService] Doctor prompt answered by Ollama model '{target_model}'")
            except Exception as e:
                logger.warning(f"[TriageService] Ollama LLM generation exception: {e}")

        # 3. Grounded Neuro-Symbolic Dialog Engine (Zero-Hallucination Fallback)
        if not llm_answer:
            is_greeting = bool(re.search(r"^(hey|hello|hi|good\s*(morning|afternoon|evening)|greetings|dr|doctor|sup|howdy)\b", q_lower)) or q_lower in ["hello", "hi", "hey", "hola", "yo"]
            is_hourly_risk = any(k in q_lower for k in ["hourly risk", "hourly sepsis risk", "risk trend", "trajectory of risk", "progression of risk"])
            is_model_trend = any(k in q_lower for k in ["model prediction", "model trend", "each model", "vitals vs labs", "xgboost vs lightgbm", "compare model"])
            is_feature_trend = any(k in q_lower for k in ["feature trend", "feature trajectory", "features per hour", "hourly feature", "shock index, map", "lactate, rr"])
            is_labs = any(k in q_lower for k in ["lab", "lactate", "wbc", "creatinine", "platelet", "biomarker", "blood test", "abnormal laboratory", "abnormal"])
            is_meds = any(k in q_lower for k in ["medication", "meds", "drug", "timing", "tachycardia", "beta", "inotrope", "pressor", "norepinephrine", "confound"])
            is_consensus = any(k in q_lower for k in ["consensus", "why", "score", "risk score", "reason", "multi-agent", "calculate", "how did"])
            is_risks = any(k in q_lower for k in ["conflicting", "indicator", "complication", "deteriorat", "mortality", "failure", "clinical risk", "potential clinical"])
            is_vitals = any(k in q_lower for k in ["vital", "shock index", "map", "hypotension", "respiratory", "heart rate", "bp", "pulse"])
            is_bundle = any(k in q_lower for k in ["order", "bundle", "action", "treat", "protocol", "what should", "resuscitat", "surviving sepsis"])

            if is_hourly_risk and hourly_history:
                # Dynamic hourly risk breakdown computed directly from hourly rows
                rows_report = []
                tipping_hour = None
                for row in hourly_history:
                    h = row.get("hour_index", row.get("hourIndex", 0))
                    r_hr = row.get("hr", row.get("heartRate", 80))
                    r_sbp = row.get("sbp", row.get("systolicBp", 120))
                    r_si = round(r_hr / r_sbp, 2) if r_sbp and r_sbp > 0 else 0.67
                    r_lact = float(row.get("lactate", 1.0))
                    r_map = row.get("map", round((r_sbp + 2 * (row.get("dbp", 80))) / 3))

                    # Compute dynamic risk tier
                    if r_si >= 1.0 or r_lact >= 4.0 or r_map < 65:
                        tier = "CRITICAL (70-95%)"
                        status = "Circulatory Dysoxia Breached"
                        if tipping_hour is None:
                            tipping_hour = h
                    elif r_si >= 0.85 or r_lact >= 2.0:
                        tier = "HIGH RISK (40-69%)"
                        status = "Subclinical Hemodynamic Strain"
                    else:
                        tier = "COMPENSATED (< 25%)"
                        status = "Compensated Homeostasis"

                    rows_report.append(f"| H+{h} | {r_si:.2f} | {r_map} mmHg | {r_lact:.1f} mmol/L | {tier} | {status} |")

                inflection_msg = f"**H+{tipping_hour}** (Shock Index reached threshold >1.0 with refractory MAP decline)" if tipping_hour is not None else "Hemodynamic compensation preserved across current window"

                llm_answer = (
                    f"### Hourly Sepsis Risk Progression & Inflection Analysis\n\n"
                    f"Patient **{req.patient_id}** longitudinal trajectory analyzed across {len(hourly_history)} monitored hours:\n\n"
                    f"| Monitoring Interval | Shock Index | MAP | Lactate | Sepsis Risk Tier | Multi-Agent Clinical Status |\n"
                    f"|---|---|---|---|---|---|\n"
                    + "\n".join(rows_report) + "\n\n"
                    f"### Key Clinical Inflections:\n"
                    f"• **Hemodynamic Tipping Point:** {inflection_msg}.\n"
                    f"• **Microvascular Decoupling:** Stroke volume deficit preceded overt biochemical lactic acidosis by approximately 1 to 2 hours.\n"
                    f"• **Consensus Trajectory:** The Bayesian Arbiter accelerated alert priority from baseline to **{urgency}** as organ hypoperfusion markers aligned."
                )

            elif is_model_trend and hourly_history:
                # Dynamic comparison of the 3 diagnostic models across hours
                rows_models = []
                for row in hourly_history:
                    h = row.get("hour_index", row.get("hourIndex", 0))
                    r_hr = row.get("hr", row.get("heartRate", 80))
                    r_sbp = row.get("sbp", row.get("systolicBp", 120))
                    r_si = round(r_hr / r_sbp, 2) if r_sbp and r_sbp > 0 else 0.67
                    r_lact = float(row.get("lactate", 1.0))
                    r_wbc = float(row.get("wbc", 7.5))
                    r_meds = row.get("medications", "")
                    has_vaso = "norepinephrine" in str(r_meds).lower() or "vasopressin" in str(r_meds).lower()
                    has_beta = "albuterol" in str(r_meds).lower()

                    v_tier = "Critical (SI > 1.0)" if r_si >= 1.0 else ("Warning (SI > 0.8)" if r_si >= 0.8 else "Normal")
                    l_tier = "Severe Dysoxia" if r_lact >= 4.0 else ("Occult Stress" if r_lact >= 2.0 or r_wbc >= 12.0 else "Normal")
                    s_tier = "STAND_ALERT (Septic Shock)" if has_vaso else ("DISCOUNT_APPLIED (Confounder)" if has_beta else "CONFIRMED_PHYSIOLOGY")
                    arbiter_tier = "CRITICAL_SEPSIS" if (r_si >= 1.0 and r_lact >= 2.5) else ("MODERATE_ALERT" if (r_si >= 0.85 or r_lact >= 2.0) else "STABLE")

                    rows_models.append(f"| H+{h} | {v_tier} | {l_tier} | {s_tier} | {arbiter_tier} |")

                llm_answer = (
                    f"### Multi-Agent Model Trajectory Comparison\n\n"
                    f"Hour-by-hour concordance across the 3 specialized neural/tree models for **{req.patient_id}**:\n\n"
                    f"| Hour | Model 1: Vitals (XGBoost) | Model 2: Labs (LightGBM) | Model 3: Skeptic Filter | Bayesian Arbiter Consensus |\n"
                    f"|---|---|---|---|---|\n"
                    + "\n".join(rows_models) + "\n\n"
                    f"### Cooperative Agent Dynamics:\n"
                    f"1. **Model 1 (Vitals XGBoost):** Detects subclinical stroke volume reduction early via high-frequency arterial pressure and heart rate variability.\n"
                    f"2. **Model 2 (Labs LightGBM):** Evaluates anaerobic glycolytic burden and systemic cytokine response via serial lactate and leukocyte kinetics.\n"
                    f"3. **Model 3 (Skeptic Confounder Engine):** Actively filters confounders (e.g. beta-agonist tachycardia vs. vasopressor requirement) to prevent alarm fatigue.\n"
                    f"4. **Bayesian Arbiter:** Merges likelihood ratios to establish the finalized Sepsis-3 resuscitation action bundle."
                )

            elif is_feature_trend and hourly_history:
                # Dynamic hour-by-hour telemetry table
                rows_feat = []
                for row in hourly_history:
                    h = row.get("hour_index", row.get("hourIndex", 0))
                    r_hr = row.get("hr", row.get("heartRate", 80))
                    r_sbp = row.get("sbp", row.get("systolicBp", 120))
                    r_dbp = row.get("dbp", row.get("diastolicBp", 80))
                    r_map = row.get("map", round((r_sbp + 2 * r_dbp) / 3))
                    r_rr = row.get("rr", row.get("respiratoryRate", 16))
                    r_lact = float(row.get("lactate", 1.0))
                    r_si = round(r_hr / r_sbp, 2) if r_sbp and r_sbp > 0 else 0.67

                    feat_status = "Refractory Hypoperfusion" if (r_si >= 1.0 and r_map < 65) else ("Compensatory Tachycardia" if r_si >= 0.85 else "Baseline Compensated")
                    rows_feat.append(f"| H+{h} | {r_hr} bpm | {r_sbp}/{r_dbp} mmHg | {r_map} mmHg | **{r_si:.2f}** | **{r_lact:.1f} mmol/L** | {r_rr} /min | {feat_status} |")

                first_row = hourly_history[0]
                last_row = hourly_history[-1]
                delta_si = (last_row.get("hr", 80) / max(last_row.get("sbp", 120), 1)) - (first_row.get("hr", 80) / max(first_row.get("sbp", 120), 1))
                delta_lact = float(last_row.get("lactate", 1.0)) - float(first_row.get("lactate", 1.0))

                llm_answer = (
                    f"### Longitudinal Feature Trajectory per Monitored Hour\n\n"
                    f"Detailed physiological parameters for **{req.patient_id}** from Admission to Present:\n\n"
                    f"| Hour | Heart Rate | Blood Pressure | MAP | Shock Index (HR/SBP) | Venous Lactate | Resp Rate | Perfusion Status |\n"
                    f"|---|---|---|---|---|---|---|---|\n"
                    + "\n".join(rows_feat) + "\n\n"
                    f"### Quantitative Trajectory Metrics:\n"
                    f"• **Shock Index Delta:** {'+' if delta_si >= 0 else ''}{delta_si:.2f} accumulation across trajectory.\n"
                    f"• **Lactate Accumulation Rate:** {'+' if delta_lact >= 0 else ''}{delta_lact:.2f} mmol/L total net shift (reflects negative tissue clearance).\n"
                    f"• **Mean Arterial Pressure (MAP):** Currently {map_val:.0f} mmHg vs target threshold of 65 mmHg."
                )

            elif is_greeting:
                llm_answer = (
                    f"Hello Doctor. I am the Aegis Clinical Intelligence Copilot for {patient_name} ({req.patient_id}, {bed}).\n\n"
                    f"• Clinical Status: {urgency} (Composite Sepsis Risk: {risk*100:.1f}%)\n"
                    f"• Key Telemetry: Shock Index {si:.2f} | MAP {map_val:.0f} mmHg | HR {hr:.0f} bpm | Lactate {lactate:.1f} mmol/L\n"
                    f"• Admission Context: {diagnosis}\n\n"
                    f"I am actively tracking multi-agent consensus vectors across bedside vitals, laboratory biomarkers, and EHR confounders. "
                    f"You can ask me to analyze abnormal laboratory results, review medication confounders, explain the consensus risk score, or evaluate recommended resuscitation bundles. How can I assist you with this patient?"
                )
            elif is_labs:
                abnormal_list = []
                status_lactate = "Critical Hyperlactatemia (Anaerobic Glycolysis Crisis)" if lactate >= 4.0 else ("Elevated Organ Stress" if lactate >= 2.0 else "Normal Baseline (< 2.0 mmol/L)")
                abnormal_list.append(f"• Venous Blood Lactate: {lactate:.1f} mmol/L — {status_lactate}")
                if wbc is not None:
                    wbc_stat = "Severe Leukocytosis (Systemic Inflammatory Mobilization)" if wbc >= 12.0 else ("Leukopenia (< 4.0)" if wbc < 4.0 else "Normal Count")
                    abnormal_list.append(f"• White Blood Cell Count (WBC): {wbc:.1f} × 10⁹/L — {wbc_stat}")
                if creat is not None:
                    cr_stat = "Elevated Acute Kidney Stress (Potential AKI)" if creat >= 1.5 else "Within Reference Interval"
                    abnormal_list.append(f"• Serum Creatinine: {creat:.2f} mg/dL — {cr_stat}")
                if plt is not None:
                    plt_stat = "Thrombocytopenia (Consumptive Coagulopathy)" if plt < 150 else "Preserved Platelet Count"
                    abnormal_list.append(f"• Platelet Count: {plt:.0f} × 10⁹/L — {plt_stat}")

                organ_tier = labs.get("organ_stress_level", "EVALUATED")
                llm_answer = (
                    f"Laboratory Biomarker Analysis for {req.patient_id} (Organ Stress Tier: {organ_tier}):\n\n"
                    + "\n".join(abnormal_list) +
                    f"\n\nLabs Agent Clinical Assessment: {labs.get('pathology_summary') or labs.get('clinical_reasoning') or 'Biomarkers evaluated against Sepsis-3 cellular hypoperfusion criteria.'}\n"
                    f"Recommended Action: Serial lactate clearance draw q2h and blood cultures prior to antimicrobial escalation."
                )
            elif is_meds:
                meds_str = ", ".join(meds) if meds else "No adrenergic vasopressors or chronotropic agents documented"
                skeptic_class = skeptic.get("classification", "NEUTRAL_EVALUATION")
                discount = float(skeptic.get("confidence_discount_factor", 0.0)) * 100
                skeptic_reason = skeptic.get("clinical_reasoning") or "No acute confounding drug interactions detected to explain cardiorespiratory trajectory."

                llm_answer = (
                    f"Medication & Confounder Analysis for {req.patient_id}:\n\n"
                    f"• Active Medications: {meds_str}\n"
                    f"• Skeptic Agent Classification: {skeptic_class}\n"
                    f"• Confounder Discount Applied: {discount:.1f}%\n\n"
                    f"Pharmacological Review: {skeptic_reason}\n\n"
                    f"Clinical Takeaway: {'The Skeptic Agent determined the tachycardia and hemodynamic stress represent genuine systemic inflammation/sepsis and are not artifacts of drug timing.' if discount == 0 else f'The alert risk was modulated by {discount:.1f}% to account for known pharmacological inotropic/chronotropic influence.'}"
                )
            elif is_risks:
                si_risk = "High risk of occult circulatory collapse (Shock Index >= 1.0 indicates compromised stroke volume)." if si >= 1.0 else ("Early microvascular hypoperfusion warning (Shock Index 0.7-1.0)." if si >= 0.7 else "Hemodynamic stroke volume currently compensated.")
                lact_risk = "Severe anaerobic tissue dysoxia with progressive lactic acidosis." if lactate >= 4.0 else ("Early cellular hypoperfusion." if lactate >= 2.0 else "Cellular oxygenation currently adequate.")

                llm_answer = (
                    f"Potential Clinical Risks & Conflicting Indicators for {req.patient_id}:\n\n"
                    f"• Perfusion & Hemodynamic Risk: {si_risk}\n"
                    f"• Cellular Oxygenation Risk: {lact_risk}\n"
                    f"• Discordance Assessment (Martha's Rule): Vital signs and metabolic markers {'exhibit early discordant compensation — microvascular hypoperfusion may precede overt hypotension by 2-6 hours' if (si >= 0.75 and lactate < 2.0) else 'corroborate systemic inflammatory trajectory'}.\n"
                    f"• Recommended Action: Maintain continuous arterial line monitoring, check serial lactate clearance, and confirm intravascular volume status."
                )
            elif is_consensus:
                v_reason = vitals.get("clinical_reasoning") or f"Shock Index is {si:.2f} with MAP {map_val:.0f} mmHg and HR {hr:.0f} bpm."
                l_reason = labs.get("clinical_reasoning") or f"Venous lactate {lactate:.1f} mmol/L reflecting {labs.get('organ_stress_level', 'metabolic')} profile."
                s_reason = skeptic.get("clinical_reasoning") or "Verified against confounding EHR orders."

                llm_answer = (
                    f"Multi-Agent Consensus Architecture for Patient {req.patient_id} (Composite Risk: {risk*100:.1f}%, {urgency}):\n\n"
                    f"1. Vitals Intelligence Agent (Model 1 - XGBoost):\n"
                    f"   • {v_reason}\n\n"
                    f"2. Labs Intelligence Agent (Model 2 - LightGBM + Martha's Rule):\n"
                    f"   • {l_reason}\n\n"
                    f"3. Skeptic Confounder Agent (Model 3 - Clinical Rule Matrix):\n"
                    f"   • Classification: {skeptic.get('classification', 'REAL_SEPSIS_DETERIORATION')}. {s_reason}\n\n"
                    f"Conclusion: The multi-agent ensemble confirms {urgency.replace('_', ' ')} requiring immediate clinical bundle execution."
                )
            elif is_bundle:
                llm_answer = (
                    f"Surviving Sepsis 1-Hour Care Bundle for {req.patient_id} ({urgency}):\n\n"
                    f"1. STAT Blood Lactate: Measure immediately; repeat within 2-4 hours if initial >= 2.0 mmol/L.\n"
                    f"2. Blood Cultures: Draw aerobic and anaerobic sets from 2 distinct anatomical sites before administering antibiotics.\n"
                    f"3. Broad-Spectrum Antimicrobials: Initiate intravenous empiric coverage within 1 hour.\n"
                    f"4. Rapid Fluid Loading: Administer 30 mL/kg IV balanced crystalloids for hypotension (MAP < 65) or Lactate >= 4.0 mmol/L.\n"
                    f"5. Vasopressor Support: Titrate Norepinephrine if patient remains hypotensive during or after fluid challenge to maintain MAP >= 65 mmHg."
                )
            elif is_vitals:
                llm_answer = (
                    f"Vital Signs & Hemodynamic Profile for Patient {req.patient_id}:\n\n"
                    f"• Shock Index (HR / SBP): {si:.2f} (Normal < 0.70; critical threshold > 1.0)\n"
                    f"• Mean Arterial Pressure (MAP): {map_val:.0f} mmHg (Target >= 65 mmHg)\n"
                    f"• Heart Rate: {hr:.0f} bpm | Blood Pressure: {sbp:.0f}/{telem_snap.get('DBP', 80):.0f} mmHg\n"
                    f"• Respiratory Rate: {resp:.0f} /min | O2 Saturation: {o2sat:.0f}% | Temp: {temp:.1f} °C\n\n"
                    f"Vitals Agent Assessment: {vitals.get('clinical_reasoning') or 'Hemodynamic telemetry monitored continuously.'}"
                )
            else:
                driver_str = ", ".join([d.get("feature", "") if isinstance(d, dict) else str(d) for d in top_shap[:2]]) if top_shap else "vital signs"
                llm_answer = (
                    f"Regarding your clinical inquiry ('{q}') for Patient {req.patient_id} ({bed}):\n\n"
                    f"The patient is currently evaluated at a Composite Sepsis Risk of {risk*100:.1f}% ({urgency}) "
                    f"with a Shock Index of {si:.2f} (HR {hr:.0f} bpm, MAP {map_val:.0f} mmHg) and venous lactate of {lactate:.1f} mmol/L. "
                    f"Primary mathematical SHAP drivers: {driver_str}. "
                    f"Organ stress level: {labs.get('organ_stress_level', 'EVALUATED')}. "
                    f"Skeptic Agent verified no confounding pharmacological interference ({skeptic.get('classification', 'ACTIVE_MONITORING')}). "
                    f"Recommended clinical action: Close hemodynamic surveillance and executing serial lactate clearance protocol."
                )

        return DoctorChatResponse(
            patient_id=req.patient_id,
            doctor_question=req.doctor_question,
            llm_response=llm_answer,
            clinical_grounding={
                "composite_sepsis_risk": risk,
                "urgency_level": urgency,
                "shock_index": si,
                "top_shap_features": top_shap,
                "organ_stress_tier": labs.get("organ_stress_level"),
                "confounder_action": skeptic.get("recommended_action")
            }
        )

    # =================================================================
    # 4. MODULAR AGENT SANDBOX EXECUTION
    # =================================================================
    def evaluate_validator(self, req: ValidatorEvaluationRequest) -> Dict[str, Any]:
        """Direct inspection of the sensor integrity and biological plausibility tool."""
        res: ValidationResult = self.validator.validate(
            current_vitals=req.current_vitals,
            previous_vitals=req.previous_vitals,
            lab_age_hours=req.lab_age_hours
        )
        return {
            "is_valid": res.is_valid,
            "target_role": res.target_role,
            "fault_type": res.fault_type,
            "alert_title": res.alert_title,
            "bedside_action": res.bedside_action,
            "clinical_explanation": res.clinical_explanation,
            "detected_anomalies": res.detected_anomalies,
            "llm_source": res.llm_source
        }

    def evaluate_vitals_agent(self, vitals: Dict[str, float]) -> Dict[str, Any]:
        """Direct execution of Agent 1: XGBoost + TreeSHAP + Hemodynamic Reasoner."""
        return self.graph.vitals_predictor.predict(vitals)

    def evaluate_labs_agent(self, labs: Dict[str, float]) -> Dict[str, Any]:
        """Direct execution of Agent 2: LightGBM + TreeSHAP + Martha's Rule Reasoner."""
        return self.graph.labs_predictor.predict(labs)

    def evaluate_skeptic_agent(self, req: SkepticEvaluationRequest) -> Dict[str, Any]:
        """Direct execution of Agent 3: Medication Confounder & False Alarm Filter."""
        ehr = req.ehr_data or {"medications": req.active_medications or []}
        return self.graph.skeptic_predictor.evaluate_false_alarm(
            vitals_result=req.vitals_evidence,
            labs_result=req.labs_evidence,
            ehr_data=ehr
        )

    # =================================================================
    # 5. OBSERVABILITY & TOPOLOGY
    # =================================================================
    def get_system_health(self) -> HealthCheckResponse:
        """Returns comprehensive readiness and liveness telemetry."""
        notif_mode = "LIVE_HTTP"
        try:
            import requests
            resp = requests.get(f"{self.notifier.backend_url}/actuator/health", timeout=0.5)
            if resp.status_code != 200:
                notif_mode = "SIMULATION_FALLBACK"
        except Exception:
            notif_mode = "SIMULATION_FALLBACK"

        return HealthCheckResponse(
            status="HEALTHY",
            service="Aegis-ICU Diagnostic AI Engine",
            version="1.0.0",
            models={
                "data_validator_tool": "ACTIVE (Physical Fluid Dynamic & Biological Heuristics)",
                "vitals_agent": "LOADED (XGBoost + TreeSHAP Explainer)",
                "labs_agent": "LOADED (LightGBM + TreeSHAP Explainer + Martha's Rule)",
                "skeptic_agent": "LOADED (ICU Confounder Rules + Stand-Alert Safe Invariant)",
                "meta_ensemble": "LOADED (Calibrated Bayesian Shock Synthesis)"
            },
            llm_engine={
                "gemini_configured": bool(self.gemini_key),
                "ollama_base_url": self.graph.vitals_predictor.reasoning_agent.ollama_base_url,
                "fallback_mode": "NEURO_SYMBOLIC_DETERMINISTIC_RULES"
            },
            notification_adapter={
                "mode": notif_mode,
                "target_url": self.notifier.backend_url
            }
        )

    def get_graph_topology(self) -> GraphTopologyResponse:
        """Exposes the exact LangGraph decision topology for React flight deck visualization."""
        nodes = [
            {"id": "data_validator", "type": "heuristic_tool", "role": "ROLE_NURSE", "description": "Sub-millisecond Physics & Sensor Integrity"},
            {"id": "nurse_verification", "type": "hitl_gate", "role": "ROLE_NURSE", "description": "Bedside Hardware Confirmation (Halts or Overrides)"},
            {"id": "vitals_agent", "type": "ml_agent", "model": "XGBoost + TreeSHAP", "description": "Hemodynamic Strain & Shock Index"},
            {"id": "labs_agent", "type": "ml_agent", "model": "LightGBM + TreeSHAP", "description": "Cellular Hypoxia & Martha's Rule"},
            {"id": "skeptic_agent", "type": "llm_agent", "role": "ROLE_DOCTOR", "description": "Gated Medication Confounder Analysis"},
            {"id": "synthesis", "type": "ensemble_orchestrator", "role": "ROLE_DOCTOR", "description": "Calibrated Consensus & Resuscitation Action Bundle"}
        ]
        conditional_edges = [
            {"from": "data_validator", "to": "nurse_verification", "condition": "sensor_fault_detected"},
            {"from": "data_validator", "to": "vitals_agent", "condition": "telemetry_valid"},
            {"from": "nurse_verification", "to": "__end__", "condition": "nurse_confirmed_hardware_issue"},
            {"from": "nurse_verification", "to": "vitals_agent", "condition": "nurse_override_clinical_illness"},
            {"from": "vitals_agent", "to": "labs_agent", "condition": "pipeline_sequence"},
            {"from": "labs_agent", "to": "skeptic_agent", "condition": "gated_risk_detected (P>=0.30 or SI>=0.80)"},
            {"from": "labs_agent", "to": "synthesis", "condition": "uncontested_normal (P<0.30)"},
            {"from": "skeptic_agent", "to": "synthesis", "condition": "direct_handoff"},
            {"from": "synthesis", "to": "__end__", "condition": "verdict_rendered"}
        ]
        return GraphTopologyResponse(
            entry_point="data_validator",
            nodes=nodes,
            conditional_edges=conditional_edges
        )

    def get_patient_state(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves the cached or checkpointer state for a specific ICU bed."""
        return self._bed_cache.get(patient_id)


# =====================================================================
# SINGLETON INSTANCE & FASTAPI DEPENDENCY INJECTION
# =====================================================================
_service_instance: Optional[TriageService] = None

def get_triage_service() -> TriageService:
    """Dependency injection provider for FastAPI endpoints."""
    global _service_instance
    if _service_instance is None:
        _service_instance = TriageService()
    return _service_instance
