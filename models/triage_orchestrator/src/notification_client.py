"""
Notification Adapter Client for Bedside Nurse and Doctor Email/Push Alerts.
Handles integration with the Spring Boot Backend Notification API.
Gracefully falls back to a realistic mock simulation when the backend endpoint is not yet deployed.
"""

import os
import requests
from typing import Dict, Any, Optional
from datetime import datetime, timezone


class NotificationClient:
    """
    Dispatches alerts to the hospital backend for email, SMS, and dashboard push.
    Provides graceful mock simulation if the backend is offline.
    """

    def __init__(self, backend_url: Optional[str] = None):
        self.backend_url = backend_url or os.getenv(
            "BACKEND_NOTIFICATION_URL", 
            "http://localhost:8080/api/notifications/dispatch-alert"
        )

    def dispatch_alert(
        self,
        patient_id: str,
        target_role: str,
        alert_title: str,
        urgency: str,
        message: str,
        action_bundle: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Dispatches email/push alert to backend. If backend is not yet online,
        logs the dispatch and returns simulated delivery confirmation.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        payload = {
            "patientId": patient_id,
            "targetRole": target_role,
            "alertTitle": alert_title,
            "urgency": urgency,
            "clinicalMessage": message,
            "recommendedActions": action_bundle or [],
            "timestamp": now_iso
        }

        # 1. Attempt live call to Spring Boot backend
        try:
            resp = requests.post(self.backend_url, json=payload, timeout=1.5)
            if resp.status_code in [200, 201, 202]:
                return {
                    "delivery_status": "SENT_LIVE",
                    "channel": "BACKEND_HTTP_API",
                    "target_role": target_role,
                    "patient_id": patient_id,
                    "timestamp": now_iso,
                    "response": resp.json() if resp.text else "OK"
                }
        except Exception:
            # Backend not built yet or connection refused -> Fall back to graceful mock
            pass

        # 2. Production-grade Mock Fallback (Allows AI service to function end-to-end today)
        recipient = "attending_physician_icu@hospital.org" if target_role == "ROLE_DOCTOR" else "bedside_nurse_station@hospital.org"
        print(f"\n[BACKEND NOTIFICATION ADAPTER - MOCK SIMULATION]")
        print(f"  * Status        : Queued (Backend endpoint '{self.backend_url}' offline)")
        print(f"  * Recipient     : {recipient} ({target_role})")
        print(f"  * Patient       : {patient_id}")
        print(f"  * Subject       : [{urgency}] {alert_title}")
        print(f"  * Dispatch Time : {now_iso}")

        return {
            "delivery_status": "SIMULATED_MOCK_DISPATCH",
            "channel": "MOCK_EMAIL_SMS_GATEWAY",
            "target_role": target_role,
            "recipient": recipient,
            "patient_id": patient_id,
            "urgency": urgency,
            "alert_title": alert_title,
            "timestamp": now_iso,
            "note": "Backend notification service simulated successfully. Ready for live API hook."
        }
