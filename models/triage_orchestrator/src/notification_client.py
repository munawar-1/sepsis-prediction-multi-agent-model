"""
Notification Adapter Client for Bedside Nurse and Doctor Email/Push Alerts.
Handles integration with the Spring Boot Backend Notification API.
Dispatches real emergency email notifications to assigned attending physicians.
"""

import os
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone


class NotificationClient:
    """
    Dispatches emergency sepsis alerts to the Spring Boot backend
    for live Gmail SMTP transmission to assigned attending doctors.
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
        action_bundle: Optional[list] = None,
        risk_score: Optional[float] = None,
        agent_findings: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Dispatches emergency alert to Spring Boot backend for real Gmail SMTP transmission.
        Captures real delivery status, recipient email, and any SMTP delivery errors.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Serialize action bundle items
        action_names = []
        if action_bundle:
            for item in action_bundle:
                if isinstance(item, dict):
                    action_names.append(item.get("name") or str(item))
                else:
                    action_names.append(str(item))

        payload = {
            "patientId": patient_id,
            "targetRole": target_role,
            "alertTitle": alert_title,
            "urgency": urgency,
            "clinicalMessage": message,
            "recommendedActions": action_names,
            "riskScore": risk_score,
            "agentFindings": agent_findings or [],
            "timestamp": now_iso
        }

        # 1. Real call to Spring Boot backend notification endpoint
        try:
            resp = requests.post(self.backend_url, json=payload, timeout=6.0)
            if resp.status_code in [200, 201, 202]:
                data = resp.json() if resp.text else {}
                delivery_status = data.get("deliveryStatus", "SENT_LIVE")
                recipient_email = data.get("recipientEmail")
                is_delivered = data.get("delivered", False)
                error_msg = data.get("errorMessage")

                print(f"\n[BACKEND LIVE NOTIFICATION DISPATCH]")
                print(f"  * Patient ID      : {patient_id}")
                print(f"  * Delivery Status : {delivery_status} (Delivered: {is_delivered})")
                print(f"  * Recipient Email : {recipient_email}")
                print(f"  * Channel         : {data.get('channel')}")
                if error_msg:
                    print(f"  * SMTP Error      : {error_msg}")

                return {
                    "delivery_status": delivery_status,
                    "delivered": is_delivered,
                    "channel": data.get("channel", "EMAIL_SMTP_DISPATCH"),
                    "target_role": target_role,
                    "recipient": recipient_email,
                    "patient_id": patient_id,
                    "risk_score": risk_score,
                    "timestamp": now_iso,
                    "response": data,
                    "error_message": error_msg
                }
            else:
                return {
                    "delivery_status": "BACKEND_HTTP_ERROR",
                    "delivered": False,
                    "channel": "NONE",
                    "target_role": target_role,
                    "patient_id": patient_id,
                    "timestamp": now_iso,
                    "http_status": resp.status_code,
                    "error_message": f"Backend returned HTTP {resp.status_code}: {resp.text[:200]}"
                }
        except Exception as ex:
            print(f"\n[BACKEND NOTIFICATION CONNECTION ERROR]")
            print(f"  * Error: Could not connect to backend at {self.backend_url}: {ex}")
            return {
                "delivery_status": "FAILED_BACKEND_UNREACHABLE",
                "delivered": False,
                "channel": "NONE",
                "target_role": target_role,
                "patient_id": patient_id,
                "timestamp": now_iso,
                "error_message": str(ex)
            }
