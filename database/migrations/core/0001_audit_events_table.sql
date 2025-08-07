-- Migration: Create audit_events table for comprehensive audit logging
-- This table stores all audit events for the Kenya Land Verification System

CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(255) PRIMARY KEY,
    correlation_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    property_id VARCHAR(255),
    service VARCHAR(100) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    duration INTEGER,
    details TEXT,
    error_code VARCHAR(100),
    error_message TEXT,
    error_stack TEXT,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_events_correlation_id ON audit_events(correlation_id);
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_category ON audit_events(category);
CREATE INDEX idx_audit_events_severity ON audit_events(severity);
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_events_session_id ON audit_events(session_id);
CREATE INDEX idx_audit_events_property_id ON audit_events(property_id);
CREATE INDEX idx_audit_events_service ON audit_events(service);
CREATE INDEX idx_audit_events_status ON audit_events(status);
CREATE INDEX idx_audit_events_error_code ON audit_events(error_code);

-- Composite indexes for common query patterns
CREATE INDEX idx_audit_events_service_operation ON audit_events(service, operation);
CREATE INDEX idx_audit_events_timestamp_severity ON audit_events(timestamp, severity);
CREATE INDEX idx_audit_events_user_session ON audit_events(user_id, session_id);
CREATE INDEX idx_audit_events_property_timestamp ON audit_events(property_id, timestamp);