-- V2__create_users_table.sql: Authentication & Role Management for Aegis-ICU

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(128),
    department VARCHAR(128),
    license_number VARCHAR(64),
    role VARCHAR(32) NOT NULL, -- 'DOCTOR' or 'NURSE'
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

