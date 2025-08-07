-- Migration: Add Land Verification System Tables
-- Created: 2025-01-23
-- Description: Adds comprehensive land verification tables for Kenya land ownership verification

-- Create enums for land verification system
CREATE TYPE land_verification_status AS ENUM ('not_started', 'in_progress', 'completed', 'suspended', 'failed');
CREATE TYPE verification_layer_type AS ENUM ('registry', 'physical', 'community', 'government', 'legal', 'expert');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE risk_category AS ENUM ('ownership', 'government', 'legal', 'physical', 'community');
CREATE TYPE government_designation_type AS ENUM ('riparian', 'road_reserve', 'utility_corridor', 'environmental', 'mineral_rights');
CREATE TYPE community_feedback_source AS ENUM ('local_admin', 'neighbor', 'community_leader', 'resident');

-- Land Verification Sessions table
CREATE TABLE land_verification_sessions (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status land_verification_status DEFAULT 'not_started' NOT NULL,
    current_layer verification_layer_type,
    overall_risk_score INTEGER DEFAULT 0,
    risk_level risk_level DEFAULT 'low' NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.00,
    estimated_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    monitoring_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Verification Layers table
CREATE TABLE verification_layers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES land_verification_sessions(id) ON DELETE CASCADE,
    layer_type verification_layer_type NOT NULL,
    status land_verification_status DEFAULT 'not_started' NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_duration INTEGER, -- in hours
    actual_duration INTEGER, -- in hours
    assigned_expert_id INTEGER,
    results JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(session_id, layer_type)
);

-- Risk Factors table
CREATE TABLE risk_factors (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES land_verification_sessions(id) ON DELETE CASCADE,
    category risk_category NOT NULL,
    severity risk_level NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '[]',
    impact TEXT NOT NULL,
    likelihood DECIMAL(3,2) NOT NULL,
    mitigation JSONB DEFAULT '[]',
    source_layer verification_layer_type NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Government Designations table
CREATE TABLE government_designations (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES land_verification_sessions(id) ON DELETE CASCADE,
    designation_type government_designation_type NOT NULL,
    authority VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    restrictions JSONB DEFAULT '[]',
    buffer_zone INTEGER, -- in meters
    risk_level risk_level NOT NULL,
    affected_area JSONB, -- GeoJSON or coordinate data
    planned_changes JSONB DEFAULT '[]',
    last_verified TIMESTAMP DEFAULT NOW() NOT NULL,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Community Feedback table
CREATE TABLE community_feedback (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES land_verification_sessions(id) ON DELETE CASCADE,
    source community_feedback_source NOT NULL,
    source_name VARCHAR(255),
    source_position VARCHAR(255),
    contact_info VARCHAR(255), -- Should be encrypted in production
    years_in_area INTEGER,
    ownership_history TEXT,
    known_disputes JSONB DEFAULT '[]',
    land_use_patterns JSONB DEFAULT '[]',
    recent_changes JSONB DEFAULT '[]',
    concerns JSONB DEFAULT '[]',
    reliability DECIMAL(3,2) DEFAULT 0.50,
    verified_by VARCHAR(255),
    is_confidential BOOLEAN DEFAULT FALSE NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Expert Assignments table
CREATE TABLE expert_assignments (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES land_verification_sessions(id) ON DELETE CASCADE,
    layer_id INTEGER REFERENCES verification_layers(id) ON DELETE CASCADE,
    expert_type VARCHAR(50) NOT NULL, -- 'surveyor', 'lawyer', 'appraiser'
    expert_name VARCHAR(255) NOT NULL,
    expert_credentials VARCHAR(500),
    contact_info VARCHAR(255),
    specialization VARCHAR(255),
    assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
    expected_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'assigned' NOT NULL,
    report_url VARCHAR(500),
    cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Property Monitoring table
CREATE TABLE property_monitoring (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    monitoring_type VARCHAR(50) NOT NULL, -- 'government_changes', 'legal_disputes', 'market_changes'
    frequency VARCHAR(20) DEFAULT 'monthly' NOT NULL, -- 'daily', 'weekly', 'monthly'
    last_checked TIMESTAMP,
    next_check TIMESTAMP,
    alerts_generated INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Monitoring Alerts table
CREATE TABLE monitoring_alerts (
    id SERIAL PRIMARY KEY,
    monitoring_id INTEGER NOT NULL REFERENCES property_monitoring(id) ON DELETE CASCADE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity risk_level NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    action_required BOOLEAN DEFAULT FALSE NOT NULL,
    action_taken BOOLEAN DEFAULT FALSE NOT NULL,
    action_notes TEXT,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    is_dismissed BOOLEAN DEFAULT FALSE NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for optimal query performance

-- Land Verification Sessions indexes
CREATE INDEX land_verification_sessions_property_idx ON land_verification_sessions(property_id);
CREATE INDEX land_verification_sessions_user_idx ON land_verification_sessions(user_id);
CREATE INDEX land_verification_sessions_status_idx ON land_verification_sessions(status);
CREATE INDEX land_verification_sessions_risk_level_idx ON land_verification_sessions(risk_level);
CREATE INDEX land_verification_sessions_created_at_idx ON land_verification_sessions(created_at);
CREATE INDEX land_verification_sessions_property_status_idx ON land_verification_sessions(property_id, status);
CREATE INDEX land_verification_sessions_user_status_idx ON land_verification_sessions(user_id, status);

-- Verification Layers indexes
CREATE INDEX verification_layers_session_idx ON verification_layers(session_id);
CREATE INDEX verification_layers_layer_type_idx ON verification_layers(layer_type);
CREATE INDEX verification_layers_status_idx ON verification_layers(status);
CREATE INDEX verification_layers_expert_idx ON verification_layers(assigned_expert_id);
CREATE INDEX verification_layers_session_layer_idx ON verification_layers(session_id, layer_type);
CREATE INDEX verification_layers_session_status_idx ON verification_layers(session_id, status);

-- Risk Factors indexes
CREATE INDEX risk_factors_session_idx ON risk_factors(session_id);
CREATE INDEX risk_factors_category_idx ON risk_factors(category);
CREATE INDEX risk_factors_severity_idx ON risk_factors(severity);
CREATE INDEX risk_factors_source_layer_idx ON risk_factors(source_layer);
CREATE INDEX risk_factors_active_idx ON risk_factors(is_active);
CREATE INDEX risk_factors_session_category_idx ON risk_factors(session_id, category);
CREATE INDEX risk_factors_session_severity_idx ON risk_factors(session_id, severity);

-- Government Designations indexes
CREATE INDEX government_designations_session_idx ON government_designations(session_id);
CREATE INDEX government_designations_type_idx ON government_designations(designation_type);
CREATE INDEX government_designations_authority_idx ON government_designations(authority);
CREATE INDEX government_designations_risk_level_idx ON government_designations(risk_level);
CREATE INDEX government_designations_last_verified_idx ON government_designations(last_verified);
CREATE INDEX government_designations_active_idx ON government_designations(is_active);
CREATE INDEX government_designations_session_type_idx ON government_designations(session_id, designation_type);

-- Community Feedback indexes
CREATE INDEX community_feedback_session_idx ON community_feedback(session_id);
CREATE INDEX community_feedback_source_idx ON community_feedback(source);
CREATE INDEX community_feedback_reliability_idx ON community_feedback(reliability);
CREATE INDEX community_feedback_recorded_at_idx ON community_feedback(recorded_at);
CREATE INDEX community_feedback_confidential_idx ON community_feedback(is_confidential);

-- Expert Assignments indexes
CREATE INDEX expert_assignments_session_idx ON expert_assignments(session_id);
CREATE INDEX expert_assignments_layer_idx ON expert_assignments(layer_id);
CREATE INDEX expert_assignments_expert_type_idx ON expert_assignments(expert_type);
CREATE INDEX expert_assignments_status_idx ON expert_assignments(status);
CREATE INDEX expert_assignments_assigned_at_idx ON expert_assignments(assigned_at);
CREATE INDEX expert_assignments_session_expert_type_idx ON expert_assignments(session_id, expert_type);

-- Property Monitoring indexes
CREATE INDEX property_monitoring_property_idx ON property_monitoring(property_id);
CREATE INDEX property_monitoring_session_idx ON property_monitoring(session_id);
CREATE INDEX property_monitoring_user_idx ON property_monitoring(user_id);
CREATE INDEX property_monitoring_type_idx ON property_monitoring(monitoring_type);
CREATE INDEX property_monitoring_next_check_idx ON property_monitoring(next_check);
CREATE INDEX property_monitoring_active_idx ON property_monitoring(is_active);
CREATE INDEX property_monitoring_property_active_idx ON property_monitoring(property_id, is_active);

-- Monitoring Alerts indexes
CREATE INDEX monitoring_alerts_monitoring_idx ON monitoring_alerts(monitoring_id);
CREATE INDEX monitoring_alerts_property_idx ON monitoring_alerts(property_id);
CREATE INDEX monitoring_alerts_user_idx ON monitoring_alerts(user_id);
CREATE INDEX monitoring_alerts_alert_type_idx ON monitoring_alerts(alert_type);
CREATE INDEX monitoring_alerts_severity_idx ON monitoring_alerts(severity);
CREATE INDEX monitoring_alerts_is_read_idx ON monitoring_alerts(is_read);
CREATE INDEX monitoring_alerts_action_required_idx ON monitoring_alerts(action_required);
CREATE INDEX monitoring_alerts_created_at_idx ON monitoring_alerts(created_at);
CREATE INDEX monitoring_alerts_user_unread_idx ON monitoring_alerts(user_id, is_read);
CREATE INDEX monitoring_alerts_property_active_idx ON monitoring_alerts(property_id, is_dismissed);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_land_verification_sessions_updated_at BEFORE UPDATE ON land_verification_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_layers_updated_at BEFORE UPDATE ON verification_layers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_factors_updated_at BEFORE UPDATE ON risk_factors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_government_designations_updated_at BEFORE UPDATE ON government_designations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_feedback_updated_at BEFORE UPDATE ON community_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expert_assignments_updated_at BEFORE UPDATE ON expert_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_monitoring_updated_at BEFORE UPDATE ON property_monitoring FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monitoring_alerts_updated_at BEFORE UPDATE ON monitoring_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE land_verification_sessions IS 'Main table for tracking land verification processes';
COMMENT ON TABLE verification_layers IS 'Individual verification layers within a session';
COMMENT ON TABLE risk_factors IS 'Risk factors identified during verification';
COMMENT ON TABLE government_designations IS 'Government claims and designations affecting properties';
COMMENT ON TABLE community_feedback IS 'Community intelligence gathered during verification';
COMMENT ON TABLE expert_assignments IS 'Professional experts assigned to verification tasks';
COMMENT ON TABLE property_monitoring IS 'Ongoing monitoring configuration for verified properties';
COMMENT ON TABLE monitoring_alerts IS 'Alerts generated by property monitoring system';

-- Add constraints for data integrity
ALTER TABLE land_verification_sessions ADD CONSTRAINT check_risk_score_range CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100);
ALTER TABLE land_verification_sessions ADD CONSTRAINT check_confidence_range CHECK (confidence >= 0.00 AND confidence <= 1.00);
ALTER TABLE risk_factors ADD CONSTRAINT check_confidence_range CHECK (confidence >= 0.00 AND confidence <= 1.00);
ALTER TABLE risk_factors ADD CONSTRAINT check_likelihood_range CHECK (likelihood >= 0.00 AND likelihood <= 1.00);
ALTER TABLE community_feedback ADD CONSTRAINT check_reliability_range CHECK (reliability >= 0.00 AND reliability <= 1.00);
ALTER TABLE community_feedback ADD CONSTRAINT check_years_in_area_range CHECK (years_in_area >= 0 AND years_in_area <= 100);
ALTER TABLE government_designations ADD CONSTRAINT check_buffer_zone_positive CHECK (buffer_zone >= 0);
ALTER TABLE property_monitoring ADD CONSTRAINT check_alerts_generated_positive CHECK (alerts_generated >= 0);