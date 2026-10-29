-- V1__init_schema.sql: Aegis-ICU Core Schema & Immutable Audit Trail

CREATE TABLE IF NOT EXISTS patients (
    patient_id VARCHAR(64) PRIMARY KEY,
    masked_identifier VARCHAR(32) NOT NULL,
    age INT,
    gender VARCHAR(10),
    admission_dx VARCHAR(255),
    fhir_context_json JSON
);

CREATE TABLE IF NOT EXISTS telemetry_ticks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    hour_index INT NOT NULL,
    hr DOUBLE, sbp DOUBLE, map_val DOUBLE, resp DOUBLE, o2sat DOUBLE, temp DOUBLE,
    lactate DOUBLE, wbc DOUBLE, creatinine DOUBLE, platelets DOUBLE,
    raw_data JSON,
    INDEX idx_patient_hour (patient_id, hour_index)
);

CREATE TABLE IF NOT EXISTS agent_evaluations (
    evaluation_id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    hour_index INT NOT NULL,
    news2_score INT NOT NULL,
    composite_sepsis_risk DOUBLE NOT NULL,
    urgency_level VARCHAR(32) NOT NULL,
    evidence_chain JSON NOT NULL,
    recommended_actions JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Immutable Append-Only Audit Trail (FHIR AuditEvent compliant)
CREATE TABLE IF NOT EXISTS hitl_audit_log (
    audit_id VARCHAR(64) PRIMARY KEY,
    evaluation_id VARCHAR(64) NOT NULL,
    patient_id VARCHAR(64) NOT NULL,
    clinician_id VARCHAR(64) NOT NULL,
    action_taken VARCHAR(32) NOT NULL, -- 'APPROVED' or 'OVERRIDDEN'
    override_reason TEXT, -- Mandatory if OVERRIDDEN
    actions_authorized JSON,
    signature_hash VARCHAR(256) NOT NULL, -- SHA-256 tamper-evident hash
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
