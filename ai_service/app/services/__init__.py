"""
Service Layer for Aegis-ICU AI Microservice
"""
from ai_service.app.services.triage_service import TriageService, get_triage_service

__all__ = ["TriageService", "get_triage_service"]
