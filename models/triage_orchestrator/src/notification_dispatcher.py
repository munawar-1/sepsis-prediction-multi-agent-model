"""
Backend Notification Dispatcher (Aegis-ICU)
Handles asynchronous alert routing to the Java Spring Boot backend for:
1. ROLE_NURSE: Bedside hardware/sensor correction tasks.
2. ROLE_DOCTOR: Urgent Sepsis-3 clinical treatment bundle emails.

Gracefully falls back to mock/audit logging if the backend mail service is offline.
"""

import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

try:
    import requests
except ImportError:
    requests = None

logger = logging.getLogger("AegisNotificationDispatcher")
logger.setLevel(logging.INFO)


class BackendNotificationDispatcher:
    def __init__(self, backend_base_url: Optional[str] = None):
        self.backend_base_url = (backend_base_url or os.getenv("BACKEND_BASE_URL", "http://localhost:8080/api/v1")).rstrip("/")
        self.dispatch_endpoint = f"{self.backend_base_url}/notifications/dispatch"

    def dispatch_nurse_hardware_alert(
        self,
        patient_id: str,
        hour_index: int,
        fault_type: str,
        alert_title: str,
        bedside_action: str,
        clinical_explanation: str
    ) -> Dict[str, Any]:
        """
        Dispatches hardware fault alert targeted to Bedside Nurse.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        payload = {
            "recipient_role": "ROLE_NURSE",
            "patient_id": patient_id,
            "hour_index": hour_index,
            "channel": "BEDSIDE_POPUP_AND_SMS",
            "subject": f"⚠️ BEDSIDE ALERT: {alert_title} [Patient {patient_id}]",
            "alert_type": "HARDWARE_SENSOR_FAULT",
            "urgency": "HIGH",
            "details": {
                "fault_type": fault_type,
                "bedside_action": bedside_action,
                "clinical_explanation": clinical_explanation,
                "timestamp": now_iso
            }
        }

        return self._send_or_simulate(payload)

    def dispatch_doctor_sepsis_alert(
        self,
        patient_id: str,
        hour_index: int,
        urgency: str,
        composite_risk: float,
        shock_index: float,
        action_bundle: List[Dict[str, Any]],
        evidence_narrative: str
    ) -> Dict[str, Any]:
        """
        Dispatches urgent Sepsis-3 resuscitation email targeted to Attending Physician.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        order_names = [o.get("name", "Action item") for o in action_bundle[:3]]

        payload = {
            "recipient_role": "ROLE_DOCTOR",
            "patient_id": patient_id,
            "hour_index": hour_index,
            "channel": "URGENT_PHYSICIAN_EMAIL",
            "subject": f"🚨 URGENT CODE SEPSIS ({urgency}): Patient {patient_id} (Risk {composite_risk*100:.1f}%)",
            "alert_type": "CLINICAL_SEPSIS_DETERIORATION",
            "urgency": urgency,
            "details": {
                "composite_risk_pct": f"{composite_risk*100:.1f}%",
                "shock_index": f"{shock_index:.2f}",
                "immediate_orders": order_names,
                "clinical_narrative": evidence_narrative,
                "timestamp": now_iso,
                "review_url": f"http://localhost:5173/dashboard?patient={patient_id}"
            }
        }

        return self._send_or_simulate(payload)

    def _send_or_simulate(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Attempts HTTP POST to Spring Boot backend.
        If offline, falls back to structured mock dispatch without blocking the AI engine.
        """
        role = payload["recipient_role"]
        subject = payload["subject"]

        if requests is not None:
            try:
                resp = requests.post(self.dispatch_endpoint, json=payload, timeout=1.0)
                if resp.status_code in [200, 201, 202]:
                    return {
                        "status": "DISPATCHED_TO_BACKEND",
                        "recipient": role,
                        "channel": payload["channel"],
                        "http_code": resp.status_code
                    }
            except Exception:
                pass

        # Graceful fallback: backend is still under development
        print(f"\n[BACKEND DISPATCH HOOK - {role}]")
        print(f"  * Status  : SIMULATED (Backend mail endpoint not yet running)")
        print(f"  * Subject : {subject}")
        print(f"  * Channel : {payload['channel']}")

        return {
            "status": "SIMULATED_PENDING_BACKEND",
            "recipient": role,
            "channel": payload["channel"],
            "mock_payload": payload
        }
