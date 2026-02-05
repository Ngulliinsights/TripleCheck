-- @name: Create Land Verification System Tables
-- @description: Creates tables for the multi-layer land verification system with risk assessment
-- @author: system
-- @timestamp: 2024-01-02T00:00:00.000Z
-- @tags: verification, land, risk-assessment
-- @dependencies: core_001_create_comprehensive_tables

-- @up start
-- Land Verification System Tables
-- Creates the comprehensive land verification workflow tables

-- Land Verification Sessions table
CREATE TABLE IF NOT EXISTS land_verification_sessions (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status land_verification_status DEFAULT 'not_started' NOT NULL,
    current_layer verification_layer_type,
    overall_risk_score INTEGER DEFAULT 0 CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
    risk_level risk_level DEFAULT 'low' NOT NULL,
    confidence DECIMAL(3, 2) DEFAULT 0.00 CHECK (confidence >= 0 AND confidence <= 1),
    estimated_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    monitoring_enabled BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Verification Layers table
CREATE TABLE IF NOT EXISTS verification_layers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
    layer_type verification_layer_type NOT NULL,
    status land_verification_status DEFAULT 'not_started' NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    assigned_expert_id INTEGER REFERENCES professionals(id),
    results JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(session_id, layer_type)
);

-- Risk Factors table
CREATE TABLE IF NOT EXISTS risk_factors (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
    category risk_category NOT NULL,
    severity risk_level NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '[]',
    impact TEXT NOT NULL,
    likelihood DECIMAL(3, 2) NOT NULL CHECK (likelihood >= 0 AND likelihood <= 1),
    mitigation JSONB DEFAULT '[]',
    source_layer verification_layer_type NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Government Designations table
CREATE TABLE IF NOT EXISTS government_designations (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
    designation_type government_designation_type NOT NULL,
    authority VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    restrictions JSONB DEFAULT '[]',
    buffer_zone INTEGER,
    risk_level risk_level NOT NULL,
    affected_area JSONB,
    planned_changes JSONB DEFAULT '[]',
    last_verified TIMESTAMP DEFAULT NOW() NOT NULL,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Community Feedback table
CREATE TABLE IF NOT EXISTS community_feedback (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
    source community_feedback_source NOT NULL,
    source_name VARCHAR(255),
    source_position VARCHAR(255),
    contact_info VARCHAR(255),
    years_in_area INTEGER,
    ownership_history TEXT,
    known_disputes JSONB DEFAULT '[]',
    land_use_patterns JSONB DEFAULT '[]',
    recent_changes JSONB DEFAULT '[]',
    concerns JSONB DEFAULT '[]',
    reliability DECIMAL(3, 2) DEFAULT 0.50 CHECK (reliability >= 0 AND reliability <= 1),
    verified_by VARCHAR(255),
    is_confidential BOOLEAN DEFAULT false NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Expert Assignments table
CREATE TABLE IF NOT EXISTS expert_assignments (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
    layer_id INTEGER REFERENCES verification_layers(id) ON DELETE CASCADE,
    professional_id INTEGER REFERENCES professionals(id) ON DELETE CASCADE NOT NULL,
    expert_type VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
    expected_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'assigned' NOT NULL,
    report_url VARCHAR(500),
    cost DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for land verification tables

-- Land verification sessions indexes
CREATE INDEX IF NOT EXISTS land_verification_sessions_property_idx ON land_verification_sessions(property_id);
CREATE INDEX IF NOT EXISTS land_verification_sessions_user_idx ON land_verification_sessions(user_id);
CREATE INDEX IF NOT EXISTS land_verification_sessions_status_idx ON land_verification_sessions(status);
CREATE INDEX IF NOT EXISTS land_verification_sessions_risk_level_idx ON land_verification_sessions(risk_level);
CREATE INDEX IF NOT EXISTS land_verification_sessions_created_at_idx ON land_verification_sessions(created_at);
CREATE INDEX IF NOT EXISTS land_verification_sessions_property_status_idx ON land_verification_sessions(property_id, status);

-- Verification layers indexes
CREATE INDEX IF NOT EXISTS verification_layers_session_idx ON verification_layers(session_id);
CREATE INDEX IF NOT EXISTS verification_layers_layer_type_idx ON verification_layers(layer_type);
CREATE INDEX IF NOT EXISTS verification_layers_status_idx ON verification_layers(status);
CREATE INDEX IF NOT EXISTS verification_layers_expert_idx ON verification_layers(assigned_expert_id);
CREATE INDEX IF NOT EXISTS verification_layers_session_layer_idx ON verification_layers(session_id, layer_type);

-- Risk factors indexes
CREATE INDEX IF NOT EXISTS risk_factors_session_idx ON risk_factors(session_id);
CREATE INDEX IF NOT EXISTS risk_factors_category_idx ON risk_factors(category);
CREATE INDEX IF NOT EXISTS risk_factors_severity_idx ON risk_factors(severity);
CREATE INDEX IF NOT EXISTS risk_factors_source_layer_idx ON risk_factors(source_layer);
CREATE INDEX IF NOT EXISTS risk_factors_active_idx ON risk_factors(is_active);

-- Government designations indexes
CREATE INDEX IF NOT EXISTS government_designations_session_idx ON government_designations(session_id);
CREATE INDEX IF NOT EXISTS government_designations_type_idx ON government_designations(designation_type);
CREATE INDEX IF NOT EXISTS government_designations_authority_idx ON government_designations(authority);
CREATE INDEX IF NOT EXISTS government_designations_risk_level_idx ON government_designations(risk_level);

-- Community feedback indexes
CREATE INDEX IF NOT EXISTS community_feedback_session_idx ON community_feedback(session_id);
CREATE INDEX IF NOT EXISTS community_feedback_source_idx ON community_feedback(source);
CREATE INDEX IF NOT EXISTS community_feedback_reliability_idx ON community_feedback(reliability);
CREATE INDEX IF NOT EXISTS community_feedback_recorded_at_idx ON community_feedback(recorded_at);

-- Expert assignments indexes
CREATE INDEX IF NOT EXISTS expert_assignments_session_idx ON expert_assignments(session_id);
CREATE INDEX IF NOT EXISTS expert_assignments_layer_idx ON expert_assignments(layer_id);
CREATE INDEX IF NOT EXISTS expert_assignments_professional_idx ON expert_assignments(professional_id);
CREATE INDEX IF NOT EXISTS expert_assignments_expert_type_idx ON expert_assignments(expert_type);
CREATE INDEX IF NOT EXISTS expert_assignments_status_idx ON expert_assignments(status);

-- Add triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_land_verification_sessions_updated_at ON land_verification_sessions;
CREATE TRIGGER update_land_verification_sessions_updated_at
    BEFORE UPDATE ON land_verification_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_verification_layers_updated_at ON verification_layers;
CREATE TRIGGER update_verification_layers_updated_at
    BEFORE UPDATE ON verification_layers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_risk_factors_updated_at ON risk_factors;
CREATE TRIGGER update_risk_factors_updated_at
    BEFORE UPDATE ON risk_factors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_government_designations_updated_at ON government_designations;
CREATE TRIGGER update_government_designations_updated_at
    BEFORE UPDATE ON government_designations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_feedback_updated_at ON community_feedback;
CREATE TRIGGER update_community_feedback_updated_at
    BEFORE UPDATE ON community_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expert_assignments_updated_at ON expert_assignments;
CREATE TRIGGER update_expert_assignments_updated_at
    BEFORE UPDATE ON expert_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for common verification queries
CREATE OR REPLACE VIEW active_verification_sessions AS
SELECT lvs.*, p.title as property_title, p.location as property_location,
       u.username as user_username
FROM land_verification_sessions lvs
JOIN properties p ON lvs.property_id = p.id
JOIN users u ON lvs.user_id = u.id
WHERE lvs.status IN ('not_started', 'in_progress');

CREATE OR REPLACE VIEW high_risk_sessions AS
SELECT lvs.*, p.title as property_title, p.location as property_location
FROM land_verification_sessions lvs
JOIN properties p ON lvs.property_id = p.id
WHERE lvs.risk_level IN ('high', 'critical');

-- Add comments for documentation
COMMENT ON TABLE land_verification_sessions IS 'Land verification workflow sessions';
COMMENT ON TABLE verification_layers IS 'Multi-layer verification process tracking';
COMMENT ON TABLE risk_factors IS 'Risk assessment factors for properties';
COMMENT ON TABLE government_designations IS 'Government land designations and restrictions';
COMMENT ON TABLE community_feedback IS 'Community intelligence and feedback';
COMMENT ON TABLE expert_assignments IS 'Professional expert assignments';
-- @up end

-- @down start
-- Drop views
DROP VIEW IF EXISTS high_risk_sessions;
DROP VIEW IF EXISTS active_verification_sessions;

-- Drop triggers
DROP TRIGGER IF EXISTS update_expert_assignments_updated_at ON expert_assignments;
DROP TRIGGER IF EXISTS update_community_feedback_updated_at ON community_feedback;
DROP TRIGGER IF EXISTS update_government_designations_updated_at ON government_designations;
DROP TRIGGER IF EXISTS update_risk_factors_updated_at ON risk_factors;
DROP TRIGGER IF EXISTS update_verification_layers_updated_at ON verification_layers;
DROP TRIGGER IF EXISTS update_land_verification_sessions_updated_at ON land_verification_sessions;

-- Drop indexes
DROP INDEX IF EXISTS expert_assignments_status_idx;
DROP INDEX IF EXISTS expert_assignments_expert_type_idx;
DROP INDEX IF EXISTS expert_assignments_professional_idx;
DROP INDEX IF EXISTS expert_assignments_layer_idx;
DROP INDEX IF EXISTS expert_assignments_session_idx;

DROP INDEX IF EXISTS community_feedback_recorded_at_idx;
DROP INDEX IF EXISTS community_feedback_reliability_idx;
DROP INDEX IF EXISTS community_feedback_source_idx;
DROP INDEX IF EXISTS community_feedback_session_idx;

DROP INDEX IF EXISTS government_designations_risk_level_idx;
DROP INDEX IF EXISTS government_designations_authority_idx;
DROP INDEX IF EXISTS government_designations_type_idx;
DROP INDEX IF EXISTS government_designations_session_idx;

DROP INDEX IF EXISTS risk_factors_active_idx;
DROP INDEX IF EXISTS risk_factors_source_layer_idx;
DROP INDEX IF EXISTS risk_factors_severity_idx;
DROP INDEX IF EXISTS risk_factors_category_idx;
DROP INDEX IF EXISTS risk_factors_session_idx;

DROP INDEX IF EXISTS verification_layers_session_layer_idx;
DROP INDEX IF EXISTS verification_layers_expert_idx;
DROP INDEX IF EXISTS verification_layers_status_idx;
DROP INDEX IF EXISTS verification_layers_layer_type_idx;
DROP INDEX IF EXISTS verification_layers_session_idx;

DROP INDEX IF EXISTS land_verification_sessions_property_status_idx;
DROP INDEX IF EXISTS land_verification_sessions_created_at_idx;
DROP INDEX IF EXISTS land_verification_sessions_risk_level_idx;
DROP INDEX IF EXISTS land_verification_sessions_status_idx;
DROP INDEX IF EXISTS land_verification_sessions_user_idx;
DROP INDEX IF EXISTS land_verification_sessions_property_idx;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS expert_assignments;
DROP TABLE IF EXISTS community_feedback;
DROP TABLE IF EXISTS government_designations;
DROP TABLE IF EXISTS risk_factors;
DROP TABLE IF EXISTS verification_layers;
DROP TABLE IF EXISTS land_verification_sessions;
-- @down end

-- @validate start
-- Validate that verification tables exist
SELECT 
    CASE 
        WHEN COUNT(*) = 6 THEN 'PASS'
        ELSE 'FAIL'
    END as validation_result,
    'Land verification tables created' as test_description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('land_verification_sessions', 'verification_layers', 'risk_factors', 'government_designations', 'community_feedback', 'expert_assignments');

-- Validate that foreign key constraints exist
SELECT 
    CASE 
        WHEN COUNT(*) >= 8 THEN 'PASS'
        ELSE 'FAIL'
    END as validation_result,
    'Foreign key constraints created' as test_description
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_schema = 'public'
AND table_name IN ('land_verification_sessions', 'verification_layers', 'risk_factors', 'government_designations', 'community_feedback', 'expert_assignments');

-- Validate that views exist
SELECT 
    CASE 
        WHEN COUNT(*) = 2 THEN 'PASS'
        ELSE 'FAIL'
    END as validation_result,
    'Verification views created' as test_description
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('active_verification_sessions', 'high_risk_sessions');
-- @validate end