-- @name: Create Public Projects Monitoring Tables
-- @description: Creates tables for tracking public infrastructure projects and detecting information asymmetry risks
-- @author: system
-- @timestamp: 2024-01-03T00:00:00.000Z
-- @tags: public-projects, information-asymmetry, fraud-prevention
-- @dependencies: core_001_create_comprehensive_tables

-- @up start
-- Public Projects Monitoring System Tables
-- Creates the comprehensive public project tracking and information asymmetry detection system

-- Create enums for public projects
DO $$ BEGIN
    CREATE TYPE project_type AS ENUM (
        'road',
        'water_infrastructure',
        'electrification',
        'rezoning',
        'extractive_industry',
        'school',
        'hospital',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM (
        'proposed',
        'planning',
        'approved',
        'under_construction',
        'completed',
        'cancelled',
        'delayed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE source_credibility AS ENUM (
        'official_gazette',
        'government_website',
        'county_authority',
        'credible_news',
        'community_report',
        'unverified'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE intervention_status AS ENUM (
        'pending',
        'notified',
        'acknowledged',
        'proceeding',
        'blocked',
        'escalated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE information_asymmetry_level AS ENUM (
        'none',
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Public Projects table
CREATE TABLE IF NOT EXISTS public_projects (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    project_type project_type NOT NULL,
    status project_status DEFAULT 'proposed' NOT NULL,
    
    -- Geographic information
    affected_area JSONB NOT NULL,
    county VARCHAR(100) NOT NULL,
    sub_county VARCHAR(100),
    ward VARCHAR(100),
    
    -- Project timeline
    announced_date TIMESTAMP NOT NULL,
    approval_date TIMESTAMP,
    start_date TIMESTAMP,
    completion_date TIMESTAMP,
    
    -- Impact assessment
    expected_impact JSONB,
    value_increase_estimate INTEGER,
    
    -- Source information
    sources JSONB DEFAULT '[]' NOT NULL,
    primary_source_credibility source_credibility NOT NULL,
    
    -- Risk and monitoring
    information_asymmetry_risk information_asymmetry_level DEFAULT 'medium' NOT NULL,
    monitoring_active BOOLEAN DEFAULT true NOT NULL,
    
    -- Metadata
    authority VARCHAR(255),
    budget DECIMAL(15, 2),
    contractor VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_verified TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Property-Project Overlaps table
CREATE TABLE IF NOT EXISTS property_project_overlaps (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    project_id INTEGER REFERENCES public_projects(id) ON DELETE CASCADE NOT NULL,
    
    -- Geographic relationship
    overlap_type VARCHAR(50) NOT NULL,
    distance_meters INTEGER,
    affected_percentage DECIMAL(5, 2),
    
    -- Impact assessment
    value_impact_estimate INTEGER,
    impact_confidence DECIMAL(3, 2) DEFAULT 0.50,
    
    -- Risk assessment
    information_asymmetry_level information_asymmetry_level DEFAULT 'medium' NOT NULL,
    urgency_level VARCHAR(20) DEFAULT 'normal',
    
    -- Monitoring status
    alert_active BOOLEAN DEFAULT true NOT NULL,
    last_risk_assessment TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    UNIQUE(property_id, project_id)
);

-- Information Asymmetry Alerts table
CREATE TABLE IF NOT EXISTS information_asymmetry_alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Related entities
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    project_id INTEGER REFERENCES public_projects(id) ON DELETE CASCADE NOT NULL,
    overlap_id INTEGER REFERENCES property_project_overlaps(id) ON DELETE CASCADE NOT NULL,
    
    -- Alert details
    severity information_asymmetry_level NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Risk assessment
    risk_score INTEGER NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL,
    factors JSONB DEFAULT '[]',
    
    -- Trigger information
    trigger_event VARCHAR(100) NOT NULL,
    trigger_data JSONB DEFAULT '{}',
    
    -- Intervention status
    intervention_status intervention_status DEFAULT 'pending' NOT NULL,
    intervention_required BOOLEAN DEFAULT true NOT NULL,
    
    -- Notification tracking
    seller_notified BOOLEAN DEFAULT false NOT NULL,
    seller_notified_at TIMESTAMP,
    notification_method VARCHAR(50),
    
    -- Resolution
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    false_positive BOOLEAN DEFAULT false NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Disclosure Events table
CREATE TABLE IF NOT EXISTS disclosure_events (
    id SERIAL PRIMARY KEY,
    
    -- Related entities
    alert_id INTEGER REFERENCES information_asymmetry_alerts(id) ON DELETE SET NULL,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    project_id INTEGER REFERENCES public_projects(id) ON DELETE CASCADE NOT NULL,
    
    -- Disclosure details
    disclosed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    disclosed_to VARCHAR(100) NOT NULL,
    disclosed_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Information disclosed
    information_type VARCHAR(100) NOT NULL,
    information_detail TEXT NOT NULL,
    
    -- Disclosure method
    disclosure_method VARCHAR(50) NOT NULL,
    disclosure_channel VARCHAR(50),
    
    -- Evidence and verification
    evidence JSONB DEFAULT '[]',
    acknowledged BOOLEAN DEFAULT false NOT NULL,
    acknowledged_at TIMESTAMP,
    
    -- Impact assessment
    transaction_impact VARCHAR(50),
    price_adjustment INTEGER,
    
    -- Timestamps
    disclosed_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Project Market Impact table
CREATE TABLE IF NOT EXISTS project_market_impact (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES public_projects(id) ON DELETE CASCADE NOT NULL,
    
    -- Time period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    
    -- Aggregate market data
    area VARCHAR(100) NOT NULL,
    property_count INTEGER NOT NULL,
    
    -- Price data (aggregates only)
    average_price_before DECIMAL(12, 2),
    average_price_after DECIMAL(12, 2),
    price_change_percentage DECIMAL(5, 2),
    
    -- Transaction data (aggregates only)
    transaction_count INTEGER DEFAULT 0,
    average_transaction_value DECIMAL(12, 2),
    
    -- Project phase at time of measurement
    project_phase project_status NOT NULL,
    
    -- Data quality
    data_quality VARCHAR(20) DEFAULT 'medium',
    sample_size INTEGER,
    
    -- Timestamps
    calculated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    UNIQUE(project_id, area, period_start, period_end)
);

-- Create indexes for public_projects
CREATE INDEX IF NOT EXISTS public_projects_project_id_idx ON public_projects(project_id);
CREATE INDEX IF NOT EXISTS public_projects_type_idx ON public_projects(project_type);
CREATE INDEX IF NOT EXISTS public_projects_status_idx ON public_projects(status);
CREATE INDEX IF NOT EXISTS public_projects_county_idx ON public_projects(county);
CREATE INDEX IF NOT EXISTS public_projects_credibility_idx ON public_projects(primary_source_credibility);
CREATE INDEX IF NOT EXISTS public_projects_monitoring_idx ON public_projects(monitoring_active);
CREATE INDEX IF NOT EXISTS public_projects_announced_idx ON public_projects(announced_date);
CREATE INDEX IF NOT EXISTS public_projects_approval_idx ON public_projects(approval_date);
CREATE INDEX IF NOT EXISTS public_projects_start_idx ON public_projects(start_date);
CREATE INDEX IF NOT EXISTS public_projects_asymmetry_risk_idx ON public_projects(information_asymmetry_risk);
CREATE INDEX IF NOT EXISTS public_projects_county_status_idx ON public_projects(county, status);
CREATE INDEX IF NOT EXISTS public_projects_county_type_idx ON public_projects(county, project_type);
CREATE INDEX IF NOT EXISTS public_projects_status_monitoring_idx ON public_projects(status, monitoring_active);
CREATE INDEX IF NOT EXISTS public_projects_risk_monitoring_idx ON public_projects(information_asymmetry_risk, monitoring_active);
CREATE INDEX IF NOT EXISTS public_projects_active_timeline_idx ON public_projects(status, monitoring_active, announced_date);

-- Create indexes for property_project_overlaps
CREATE INDEX IF NOT EXISTS property_project_overlaps_property_idx ON property_project_overlaps(property_id);
CREATE INDEX IF NOT EXISTS property_project_overlaps_project_idx ON property_project_overlaps(project_id);
CREATE INDEX IF NOT EXISTS property_project_overlaps_type_idx ON property_project_overlaps(overlap_type);
CREATE INDEX IF NOT EXISTS property_project_overlaps_asymmetry_idx ON property_project_overlaps(information_asymmetry_level);
CREATE INDEX IF NOT EXISTS property_project_overlaps_alert_idx ON property_project_overlaps(alert_active);
CREATE INDEX IF NOT EXISTS property_project_overlaps_property_asymmetry_idx ON property_project_overlaps(property_id, information_asymmetry_level);
CREATE INDEX IF NOT EXISTS property_project_overlaps_project_alert_idx ON property_project_overlaps(project_id, alert_active);
CREATE INDEX IF NOT EXISTS property_project_overlaps_asymmetry_alert_idx ON property_project_overlaps(information_asymmetry_level, alert_active);
CREATE INDEX IF NOT EXISTS property_project_overlaps_unique ON property_project_overlaps(property_id, project_id);

-- Create indexes for information_asymmetry_alerts
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_alert_id_idx ON information_asymmetry_alerts(alert_id);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_property_idx ON information_asymmetry_alerts(property_id);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_project_idx ON information_asymmetry_alerts(project_id);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_severity_idx ON information_asymmetry_alerts(severity);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_type_idx ON information_asymmetry_alerts(alert_type);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_status_idx ON information_asymmetry_alerts(intervention_status);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_risk_idx ON information_asymmetry_alerts(risk_score);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_intervention_idx ON information_asymmetry_alerts(intervention_required);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_notified_idx ON information_asymmetry_alerts(seller_notified);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_property_severity_idx ON information_asymmetry_alerts(property_id, severity);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_project_status_idx ON information_asymmetry_alerts(project_id, intervention_status);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_active_intervention_idx ON information_asymmetry_alerts(intervention_status, intervention_required, seller_notified);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_created_idx ON information_asymmetry_alerts(created_at);
CREATE INDEX IF NOT EXISTS information_asymmetry_alerts_notified_at_idx ON information_asymmetry_alerts(seller_notified_at);

-- Create indexes for disclosure_events
CREATE INDEX IF NOT EXISTS disclosure_events_alert_idx ON disclosure_events(alert_id);
CREATE INDEX IF NOT EXISTS disclosure_events_property_idx ON disclosure_events(property_id);
CREATE INDEX IF NOT EXISTS disclosure_events_project_idx ON disclosure_events(project_id);
CREATE INDEX IF NOT EXISTS disclosure_events_by_idx ON disclosure_events(disclosed_by);
CREATE INDEX IF NOT EXISTS disclosure_events_to_idx ON disclosure_events(disclosed_to);
CREATE INDEX IF NOT EXISTS disclosure_events_type_idx ON disclosure_events(information_type);
CREATE INDEX IF NOT EXISTS disclosure_events_acknowledged_idx ON disclosure_events(acknowledged);
CREATE INDEX IF NOT EXISTS disclosure_events_property_project_idx ON disclosure_events(property_id, project_id);
CREATE INDEX IF NOT EXISTS disclosure_events_property_time_idx ON disclosure_events(property_id, disclosed_at);
CREATE INDEX IF NOT EXISTS disclosure_events_project_time_idx ON disclosure_events(project_id, disclosed_at);
CREATE INDEX IF NOT EXISTS disclosure_events_by_time_idx ON disclosure_events(disclosed_by, disclosed_at);

-- Create indexes for project_market_impact
CREATE INDEX IF NOT EXISTS project_market_impact_project_idx ON project_market_impact(project_id);
CREATE INDEX IF NOT EXISTS project_market_impact_area_idx ON project_market_impact(area);
CREATE INDEX IF NOT EXISTS project_market_impact_phase_idx ON project_market_impact(project_phase);
CREATE INDEX IF NOT EXISTS project_market_impact_period_idx ON project_market_impact(period_start, period_end);
CREATE INDEX IF NOT EXISTS project_market_impact_project_phase_idx ON project_market_impact(project_id, project_phase);
CREATE INDEX IF NOT EXISTS project_market_impact_area_phase_idx ON project_market_impact(area, project_phase);
CREATE INDEX IF NOT EXISTS project_market_impact_calculated_idx ON project_market_impact(calculated_at);
CREATE INDEX IF NOT EXISTS project_market_impact_unique ON project_market_impact(project_id, area, period_start, period_end);

-- Add triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_public_projects_updated_at ON public_projects;
CREATE TRIGGER update_public_projects_updated_at
    BEFORE UPDATE ON public_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_property_project_overlaps_updated_at ON property_project_overlaps;
CREATE TRIGGER update_property_project_overlaps_updated_at
    BEFORE UPDATE ON property_project_overlaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_information_asymmetry_alerts_updated_at ON information_asymmetry_alerts;
CREATE TRIGGER update_information_asymmetry_alerts_updated_at
    BEFORE UPDATE ON information_asymmetry_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW active_public_projects AS
SELECT pp.*, 
       COUNT(DISTINCT ppo.property_id) as affected_property_count,
       COUNT(DISTINCT iaa.id) as active_alert_count
FROM public_projects pp
LEFT JOIN property_project_overlaps ppo ON pp.id = ppo.project_id AND ppo.alert_active = true
LEFT JOIN information_asymmetry_alerts iaa ON pp.id = iaa.project_id AND iaa.intervention_status = 'pending'
WHERE pp.monitoring_active = true 
  AND pp.status IN ('proposed', 'planning', 'approved', 'under_construction')
GROUP BY pp.id;

CREATE OR REPLACE VIEW high_risk_overlaps AS
SELECT ppo.*, p.title as property_title, p.location as property_location,
       pp.title as project_title, pp.project_type, pp.status as project_status
FROM property_project_overlaps ppo
JOIN properties p ON ppo.property_id = p.id
JOIN public_projects pp ON ppo.project_id = pp.id
WHERE ppo.information_asymmetry_level IN ('high', 'critical')
  AND ppo.alert_active = true;

CREATE OR REPLACE VIEW pending_interventions AS
SELECT iaa.*, p.title as property_title, p.location as property_location,
       pp.title as project_title, pp.project_type,
       u.first_name || ' ' || u.last_name as property_owner
FROM information_asymmetry_alerts iaa
JOIN properties p ON iaa.property_id = p.id
JOIN public_projects pp ON iaa.project_id = pp.id
LEFT JOIN users u ON p.owner_id = u.id
WHERE iaa.intervention_status = 'pending'
  AND iaa.intervention_required = true
  AND iaa.false_positive = false;

-- Add comments for documentation
COMMENT ON TABLE public_projects IS 'Public infrastructure projects that may affect property values';
COMMENT ON TABLE property_project_overlaps IS 'Geographic overlap between properties and projects';
COMMENT ON TABLE information_asymmetry_alerts IS 'Real-time alerts for information asymmetry risks';
COMMENT ON TABLE disclosure_events IS 'Audit trail of information disclosures';
COMMENT ON TABLE project_market_impact IS 'Aggregate market impact data for projects';

-- @up end

-- @down start
-- Drop views
DROP VIEW IF EXISTS pending_interventions;
DROP VIEW IF EXISTS high_risk_overlaps;
DROP VIEW IF EXISTS active_public_projects;

-- Drop triggers
DROP TRIGGER IF EXISTS update_information_asymmetry_alerts_updated_at ON information_asymmetry_alerts;
DROP TRIGGER IF EXISTS update_property_project_overlaps_updated_at ON property_project_overlaps;
DROP TRIGGER IF EXISTS update_public_projects_updated_at ON public_projects;

-- Drop indexes for project_market_impact
DROP INDEX IF EXISTS project_market_impact_unique;
DROP INDEX IF EXISTS project_market_impact_calculated_idx;
DROP INDEX IF EXISTS project_market_impact_area_phase_idx;
DROP INDEX IF EXISTS project_market_impact_project_phase_idx;
DROP INDEX IF EXISTS project_market_impact_period_idx;
DROP INDEX IF EXISTS project_market_impact_phase_idx;
DROP INDEX IF EXISTS project_market_impact_area_idx;
DROP INDEX IF EXISTS project_market_impact_project_idx;

-- Drop indexes for disclosure_events
DROP INDEX IF EXISTS disclosure_events_by_time_idx;
DROP INDEX IF EXISTS disclosure_events_project_time_idx;
DROP INDEX IF EXISTS disclosure_events_property_time_idx;
DROP INDEX IF EXISTS disclosure_events_property_project_idx;
DROP INDEX IF EXISTS disclosure_events_acknowledged_idx;
DROP INDEX IF EXISTS disclosure_events_type_idx;
DROP INDEX IF EXISTS disclosure_events_to_idx;
DROP INDEX IF EXISTS disclosure_events_by_idx;
DROP INDEX IF EXISTS disclosure_events_project_idx;
DROP INDEX IF EXISTS disclosure_events_property_idx;
DROP INDEX IF EXISTS disclosure_events_alert_idx;

-- Drop indexes for information_asymmetry_alerts
DROP INDEX IF EXISTS information_asymmetry_alerts_notified_at_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_created_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_active_intervention_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_project_status_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_property_severity_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_notified_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_intervention_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_risk_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_status_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_type_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_severity_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_project_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_property_idx;
DROP INDEX IF EXISTS information_asymmetry_alerts_alert_id_idx;

-- Drop indexes for property_project_overlaps
DROP INDEX IF EXISTS property_project_overlaps_unique;
DROP INDEX IF EXISTS property_project_overlaps_asymmetry_alert_idx;
DROP INDEX IF EXISTS property_project_overlaps_project_alert_idx;
DROP INDEX IF EXISTS property_project_overlaps_property_asymmetry_idx;
DROP INDEX IF EXISTS property_project_overlaps_alert_idx;
DROP INDEX IF EXISTS property_project_overlaps_asymmetry_idx;
DROP INDEX IF EXISTS property_project_overlaps_type_idx;
DROP INDEX IF EXISTS property_project_overlaps_project_idx;
DROP INDEX IF EXISTS property_project_overlaps_property_idx;

-- Drop indexes for public_projects
DROP INDEX IF EXISTS public_projects_active_timeline_idx;
DROP INDEX IF EXISTS public_projects_risk_monitoring_idx;
DROP INDEX IF EXISTS public_projects_status_monitoring_idx;
DROP INDEX IF EXISTS public_projects_county_type_idx;
DROP INDEX IF EXISTS public_projects_county_status_idx;
DROP INDEX IF EXISTS public_projects_asymmetry_risk_idx;
DROP INDEX IF EXISTS public_projects_start_idx;
DROP INDEX IF EXISTS public_projects_approval_idx;
DROP INDEX IF EXISTS public_projects_announced_idx;
DROP INDEX IF EXISTS public_projects_monitoring_idx;
DROP INDEX IF EXISTS public_projects_credibility_idx;
DROP INDEX IF EXISTS public_projects_county_idx;
DROP INDEX IF EXISTS public_projects_status_idx;
DROP INDEX IF EXISTS public_projects_type_idx;
DROP INDEX IF EXISTS public_projects_project_id_idx;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS project_market_impact;
DROP TABLE IF EXISTS disclosure_events;
DROP TABLE IF EXISTS information_asymmetry_alerts;
DROP TABLE IF EXISTS property_project_overlaps;
DROP TABLE IF EXISTS public_projects;

-- Drop enums
DROP TYPE IF EXISTS information_asymmetry_level;
DROP TYPE IF EXISTS intervention_status;
DROP TYPE IF EXISTS source_credibility;
DROP TYPE IF EXISTS project_status;
DROP TYPE IF EXISTS project_type;
-- @down end

-- @validate start
-- Validate that public projects tables exist
SELECT 
    CASE 
        WHEN COUNT(*) = 5 THEN 'PASS'
        ELSE 'FAIL'
    END as validation_result,
    'Public projects tables created' as test_description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('public_projects', 'property_project_overlaps', 'information_asymmetry_alerts', 'disclosure_events', 'project_market_impact');

-- Validate that enums exist
SELECT 
    CASE 
        WHEN COUNT(*) = 5 THEN 'PASS'
        ELSE 'FAIL'
    END as validation_result,
    'Public projects enums created' as test_description
FROM pg_type 
WHERE typtype = 'e' 
AND typname IN ('project_type', 'project_status', 'source_credibility', 'intervention_status', 'information_asymmetry_level');

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
AND table_name IN ('public_projects', 'property_project_overlaps', 'information_asymmetry_alerts', 'disclosure_events', 'project_market_impact');

-- Validate that views exist
SELECT 
    CASE 
        WHEN COUNT(*) = 3 THEN 'PASS'
        ELSE 'FAIL'
    END as validation_result,
    'Public projects views created' as test_description
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('active_public_projects', 'high_risk_overlaps', 'pending_interventions');
-- @validate end