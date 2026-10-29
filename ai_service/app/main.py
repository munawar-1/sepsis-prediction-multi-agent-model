"""
Aegis-ICU Diagnostic AI Microservice
Exposes endpoints for the 4-Model Neuro-Symbolic Multi-Agent System.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai_service.app.api.v1.endpoints import router as v1_router

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
def health_check():
    return {"status": "HEALTHY", "service": "Aegis-ICU AI Engine", "models_loaded": 4}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
