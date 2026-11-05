"""
Aegis-ICU Diagnostic AI Microservice
Exposes REST endpoints for the LangGraph Neuro-Symbolic Multi-Agent System.
Supports standard FastAPI/Uvicorn runtime with automatic built-in multithreaded HTTP server fallback.
"""

import os
import sys
import json
import logging

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

logger = logging.getLogger("aegis_ai_service")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

HAS_FASTAPI = False
try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from ai_service.app.api.v1.endpoints import router as v1_router
    HAS_FASTAPI = True
except ImportError:
    pass

from ai_service.app.schemas.clinical_schemas import (
    TelemetryTickRequest,
    DoctorChatRequest,
    NurseVerificationRequest
)
from ai_service.app.services.triage_service import get_triage_service

if HAS_FASTAPI:
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
    app.include_router(v1_router) # Handle root-relative calls directly

    @app.get("/health")
    def root_health_check():
        return get_triage_service().get_system_health()
else:
    app = None


# =====================================================================
# ZERO-DEPENDENCY MULTI-THREADED STANDALONE HTTP SERVER
# Runs seamlessly on any standard Python 3.10+ runtime without external deps
# =====================================================================
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class AegisClinicalHTTPHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        logger.info("%s - - [%s] %s" % (self.client_address[0], self.log_date_time_string(), format % args))

    def _send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        triage_svc = get_triage_service()

        if path in ["/health", "/api/v1/health", "/api/v1/system/health"]:
            try:
                res = triage_svc.get_system_health()
                data = json.dumps(res.model_dump() if hasattr(res, "model_dump") else res).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._send_cors()
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                self._send_error_json(500, str(e))
        elif path in ["/docs", "/swagger", "/swagger-ui", "/api/v1/docs"]:
            html = """<!DOCTYPE html>
<html>
<head>
  <title>Aegis-ICU Multi-Agent Diagnostic AI - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body style="margin:0; background:#0f172a;">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis],
      layout: 'BaseLayout'
    });
  </script>
</body>
</html>"""
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self._send_cors()
            self.end_headers()
            self.wfile.write(html.encode("utf-8"))
        elif path in ["/openapi.json", "/api/v1/openapi.json"]:
            spec = {
                "openapi": "3.0.0",
                "info": {
                    "title": "Aegis-ICU Diagnostic AI Microservice",
                    "version": "1.0.0",
                    "description": "Multi-Agent Neuro-Symbolic Sepsis Deterioration & Alert Fatigue Suppression API"
                },
                "paths": {
                    "/evaluate-patient-state": {
                        "post": {
                            "summary": "Evaluate Bedside Telemetry Tick (Core Backend Hook)",
                            "responses": {"200": {"description": "Full Multi-Agent Consensus Evaluation"}}
                        }
                    },
                    "/api/v1/triage/evaluate": {
                        "post": {
                            "summary": "Evaluate Bedside Telemetry Tick",
                            "responses": {"200": {"description": "Full Multi-Agent Consensus Evaluation"}}
                        }
                    },
                    "/api/v1/triage/chat": {
                        "post": {
                            "summary": "Physician Grounded Explainer Chat",
                            "responses": {"200": {"description": "Evidence-grounded doctor answer"}}
                        }
                    },
                    "/triage/chat": {
                        "post": {
                            "summary": "Physician Grounded Explainer Chat",
                            "responses": {"200": {"description": "Evidence-grounded doctor answer"}}
                        }
                    },
                    "/health": {
                        "get": {
                            "summary": "Health Check",
                            "responses": {"200": {"description": "System OK"}}
                        }
                    }
                }
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors()
            self.end_headers()
            self.wfile.write(json.dumps(spec).encode("utf-8"))
        else:
            self._send_error_json(404, f"Path not found: {path}")

    def do_POST(self):
        path = self.path.split("?")[0]
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

        triage_svc = get_triage_service()

        try:
            if path in ["/evaluate-patient-state", "/api/v1/evaluate-patient-state", "/triage/evaluate", "/api/v1/triage/evaluate"]:
                req = TelemetryTickRequest.model_validate_json(body)
                res = triage_svc.evaluate_patient_telemetry(req)
                resp_bytes = res.model_dump_json().encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._send_cors()
                self.end_headers()
                self.wfile.write(resp_bytes)
            elif path in ["/triage/chat", "/api/v1/triage/chat"]:
                req = DoctorChatRequest.model_validate_json(body)
                res = triage_svc.answer_doctor_inquiry(req)
                resp_bytes = res.model_dump_json().encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._send_cors()
                self.end_headers()
                self.wfile.write(resp_bytes)
            elif path in ["/triage/nurse-verify", "/api/v1/triage/nurse-verify"]:
                req = NurseVerificationRequest.model_validate_json(body)
                res = triage_svc.handle_nurse_verification(req)
                resp_bytes = res.model_dump_json().encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._send_cors()
                self.end_headers()
                self.wfile.write(resp_bytes)
            else:
                self._send_error_json(404, f"Endpoint not found: {path}")
        except Exception as e:
            logger.error(f"Error handling POST {path}: {e}", exc_info=True)
            self._send_error_json(500, str(e))

    def _send_error_json(self, status_code, message):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self._send_cors()
        self.end_headers()
        self.wfile.write(json.dumps({"detail": message}).encode("utf-8"))


def run_standalone_server(host: str = "0.0.0.0", port: int = 8000):
    server = ThreadingHTTPServer((host, port), AegisClinicalHTTPHandler)
    logger.info(f"============================================================")
    logger.info(f"  Aegis-ICU Multi-Agent AI Engine serving on http://{host}:{port}")
    logger.info(f"  Swagger UI Docs available at: http://localhost:{port}/docs")
    logger.info(f"============================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Stopping Aegis-ICU AI Engine...")
        server.server_close()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    if HAS_FASTAPI:
        try:
            import uvicorn
            uvicorn.run(app, host="0.0.0.0", port=port)
        except ImportError:
            run_standalone_server("0.0.0.0", port)
    else:
        run_standalone_server("0.0.0.0", port)
