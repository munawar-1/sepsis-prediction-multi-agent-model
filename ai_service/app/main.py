"""
Aegis-ICU Diagnostic AI Microservice
Exposes REST endpoints for the LangGraph Neuro-Symbolic Multi-Agent System.
"""

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
except ImportError:
    class FastAPI:
        def __init__(self, *args, **kwargs):
            self.routes = []
        def add_middleware(self, *args, **kwargs):
            pass
        def include_router(self, router, *args, **kwargs):
            pass
        def get(self, path, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
        def post(self, path, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
    class CORSMiddleware:
        pass

from ai_service.app.api.v1.endpoints import router as v1_router
from ai_service.app.services.triage_service import get_triage_service

app = FastAPI(
    title="Aegis-ICU Diagnostic AI Engine",
    description="Multi-Agent Neuro-Symbolic Sepsis Deterioration & Alert Fatigue Suppression API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix="/api/v1")

@app.get("/health")
def root_health_check():
    return get_triage_service().get_system_health()

if __name__ == "__main__":
    try:
        import uvicorn
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except ImportError:
        print("uvicorn is not installed. Run: pip install uvicorn")
