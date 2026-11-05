/**
 * Aegis-ICU Central Clinical API Client
 * Typed, resilient HTTP client binding the dashboard directly to the Spring Boot REST backend.
 * Zero mock/placeholder data layer.
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : '/api/v1';

const TOKEN_KEY = 'aegis_jwt_token';
const USER_KEY = 'aegis_user_profile';

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function handleUnauthorized() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Only redirect if not already on login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

/**
 * Standardized fetch client with Bearer auth injection, 401 handling, and structured response
 * @param {string} endpoint e.g. '/patients/roster'
 * @param {RequestInit} options
 * @returns {Promise<{ data: any, error: string|null, status: number }>}
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    if (res.status === 401) {
      handleUnauthorized();
      return {
        data: null,
        error: 'Session expired or unauthenticated. Please sign in again.',
        status: 401
      };
    }

    let parsedData = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      parsedData = await res.json();
    } else {
      parsedData = await res.text();
    }

    if (!res.ok) {
      const errorMsg = (parsedData && parsedData.message)
        || (parsedData && parsedData.error)
        || `Request failed with status ${res.status}`;
      return {
        data: null,
        error: errorMsg,
        status: res.status
      };
    }

    return {
      data: parsedData,
      error: null,
      status: res.status
    };
  } catch (err) {
    return {
      data: null,
      error: err.message || 'Network connection failed. Verify Spring Boot backend is active.',
      status: 0
    };
  }
}

// =========================================================================
// CLINICAL API ENDPOINT WRAPPERS
// =========================================================================

export const clinicalApi = {
  /**
   * ICU Bed Heatmap Grid Roster: Returns all 8 beds with real triage colors & risk
   * GET /api/v1/patients/roster
   */
  async fetchBedRoster() {
    return apiRequest('/patients/roster', { method: 'GET' });
  },

  /**
   * Single patient profile (demographics, medications, diagnosis, assigned doctor/nurse)
   * GET /api/v1/patients/{patientId}
   */
  async fetchPatientProfile(patientId) {
    return apiRequest(`/patients/${encodeURIComponent(patientId)}`, { method: 'GET' });
  },

  /**
   * Patient longitudinal telemetry timeline (hourly vitals, labs, shock index, risk history)
   * GET /api/v1/patients/{patientId}/history
   */
  async fetchPatientHistory(patientId) {
    return apiRequest(`/patients/${encodeURIComponent(patientId)}/history`, { method: 'GET' });
  },

  /**
   * Nurse Bedside Logging / Telemetry Ticker
   * Ingests hourly vitals and labs, runs multi-agent AI evaluation, auto-generates sepsis orders.
   * POST /api/v1/patients/{patientId}/telemetry
   */
  async logPatientTelemetry(patientId, telemetryData) {
    return apiRequest(`/patients/${encodeURIComponent(patientId)}/telemetry`, {
      method: 'POST',
      body: JSON.stringify(telemetryData)
    });
  },

  /**
   * Standalone Medication, Fluid Bolus, or Point-of-Care Glucose Entry
   * Logs medications/fluids at any time (outside hourly telemetry rounds).
   * Persisted and included in all subsequent AI evaluations.
   * POST /api/v1/patients/{patientId}/medications
   */
  async logStandaloneMedication(patientId, medicationData) {
    return apiRequest(`/patients/${encodeURIComponent(patientId)}/medications`, {
      method: 'POST',
      body: JSON.stringify(medicationData)
    });
  },

  /**
   * Primary Evaluation Endpoint: POST /api/v1/evaluate-patient-state
   * Called when clinician clicks a patient card to run full multi-agent consensus.
   */
  async evaluatePatientState(telemetryData) {
    try {
      const res = await fetch('http://localhost:8000/api/v1/evaluate-patient-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetryData)
      });
      if (res.ok) {
        const data = await res.json();
        return { data, error: null, status: res.status };
      }
    } catch (e) {
      console.warn('Direct port 8000 evaluate call failed, trying /ai-api proxy:', e.message);
    }

    try {
      const res = await fetch('/ai-api/evaluate-patient-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetryData)
      });
      if (res.ok) {
        const data = await res.json();
        return { data, error: null, status: res.status };
      }
    } catch (e) {
      console.warn('Proxy evaluate call failed, trying Spring Boot:', e.message);
    }

    return apiRequest('/clinical/evaluate', {
      method: 'POST',
      body: JSON.stringify(telemetryData)
    });
  },

  /**
   * Subsequent Conversational Inquiries: POST /api/v1/triage/chat
   * Called for doctor chat inquiries grounded in patient evaluation context.
   */
  async chatWithTriageOrchestrator(patientId, doctorQuestion, clinicalContext = {}) {
    const payload = {
      patient_id: patientId,
      doctor_question: doctorQuestion,
      clinical_context: clinicalContext
    };

    try {
      const res = await fetch('http://localhost:8000/api/v1/triage/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return {
          data: {
            answer: data.llm_response,
            clinicalGrounding: data.clinical_grounding,
            agentContributions: data.clinical_grounding?.top_shap_features || {}
          },
          error: null,
          status: res.status
        };
      }
    } catch (e) {
      console.warn('Direct port 8000 triage chat call failed, trying /ai-api proxy:', e.message);
    }

    try {
      const res = await fetch('/ai-api/triage/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return {
          data: {
            answer: data.llm_response,
            clinicalGrounding: data.clinical_grounding,
            agentContributions: data.clinical_grounding?.top_shap_features || {}
          },
          error: null,
          status: res.status
        };
      }
    } catch (e) {
      console.warn('Proxy triage chat call failed, trying Spring Boot explain:', e.message);
    }

    return this.explainAlert(patientId, doctorQuestion);
  },

  /**
   * Stateless multi-agent evaluation
   * POST /api/v1/clinical/evaluate
   */
  async evaluateTelemetry(telemetryData) {
    return apiRequest('/clinical/evaluate', {
      method: 'POST',
      body: JSON.stringify(telemetryData)
    });
  },

  /**
   * Get latest active alert, TreeSHAP values, and consensus evidence for a patient
   * GET /api/v1/alerts/patient/{patientId}
   */
  async fetchPatientAlert(patientId) {
    return apiRequest(`/alerts/patient/${encodeURIComponent(patientId)}`, { method: 'GET' });
  },

  /**
   * Natural language clinical explanation of an alert via AI service
   * POST /api/v1/alerts/explain
   */
  async explainAlert(patientId, question, alertId = null) {
    return apiRequest('/alerts/explain', {
      method: 'POST',
      body: JSON.stringify({
        patientId,
        question,
        alertId
      })
    });
  },

  /**
   * Get active and recommended Sepsis-3 orders for a patient
   * GET /api/v1/orders/patient/{patientId}
   */
  async fetchPatientOrders(patientId) {
    return apiRequest(`/orders/patient/${encodeURIComponent(patientId)}`, { method: 'GET' });
  },

  /**
   * Attending Doctor signs and authorizes recommended sepsis order (Role: DOCTOR required)
   * POST /api/v1/orders/{orderId}/sign
   */
  async signOrder(orderId, requestPayload = {}) {
    return apiRequest(`/orders/${orderId}/sign`, {
      method: 'POST',
      body: JSON.stringify(requestPayload)
    });
  },

  /**
   * Bedside Nurse Actionable Task List:
   * Returns all orders that have been signed & APPROVED by Attending Doctors across the ICU
   * awaiting bedside administration.
   * GET /api/v1/orders/nurse/tasks
   */
  async fetchNurseTasks() {
    return apiRequest('/orders/nurse/tasks', { method: 'GET' });
  },

  /**
   * Attending Doctor creates/assigns a medication change or therapy task to bedside nurse
   * POST /api/v1/orders/assign
   */
  async assignDoctorOrder(orderPayload) {
    return apiRequest('/orders/assign', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });
  },

  /**
   * Bedside Nurse administers signed order (Role: NURSE required)
   * POST /api/v1/orders/{orderId}/administer
   */
  async administerOrder(orderId, requestPayload = {}) {
    return apiRequest(`/orders/${orderId}/administer`, {
      method: 'POST',
      body: JSON.stringify(requestPayload)
    });
  },

  /**
   * Doctor approves sepsis bundle (Role: DOCTOR required)
   * POST /api/v1/clinical/actions/sign
   */
  async signClinicalActions(payload = {}) {
    return apiRequest('/clinical/actions/sign', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Immutable Human-in-the-Loop decision sign-off with SHA-256 digital signature
   * Doctor/Nurse: APPROVED, Doctor-only: OVERRIDDEN with mandatory overrideReason
   * POST /api/v1/hitl/decision
   */
  async recordHitlDecision(payload) {
    return apiRequest('/hitl/decision', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Retrieve immutable audit trail: specific patient or global ICU ward
   * GET /api/v1/hitl/patient/{patientId} or GET /api/v1/hitl/audit-trail
   */
  async fetchAuditTrail(patientId = null) {
    if (patientId) {
      return apiRequest(`/hitl/patient/${encodeURIComponent(patientId)}`, { method: 'GET' });
    }
    return apiRequest('/hitl/audit-trail', { method: 'GET' });
  },

  /**
   * Backend check of FastAPI AI microservice health
   * GET /api/v1/clinical/ai-health
   */
  async fetchAiHealth() {
    return apiRequest('/clinical/ai-health', { method: 'GET' });
  },

  /**
   * Admit a new patient into an empty ICU bed
   * POST /api/v1/patients/admit
   */
  async admitPatient(admitPayload) {
    return apiRequest('/patients/admit', {
      method: 'POST',
      body: JSON.stringify(admitPayload)
    });
  },

  /**
   * Discharge patient and free ICU bed
   * PATCH /api/v1/patients/{patientId}/discharge
   */
  async dischargePatient(patientId) {
    return apiRequest(`/patients/${encodeURIComponent(patientId)}/discharge`, {
      method: 'PATCH'
    });
  },

  /**
   * Reset ICU ward beds to standard initial demo state
   * POST /api/v1/patients/reset-demo
   */
  async resetWardDemo() {
    return apiRequest('/patients/reset-demo', {
      method: 'POST'
    });
  }
};

export default clinicalApi;

