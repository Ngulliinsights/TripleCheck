-- Migration: Create Fraud Intelligence and Community Resources Tables
-- Created: 2024-07-28
-- Description: Add tables for fraud intelligence system and community resources

-- Fraud Intelligence Tables
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(100) NOT NULL,
    affected_count INTEGER NOT NULL DEFAULT 0,
    time_detected TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    evidence TEXT,
    recommendations TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fraud_alerts_type_idx ON fraud_alerts(type);
CREATE INDEX IF NOT EXISTS fraud_alerts_severity_idx ON fraud_alerts(severity);
CREATE INDEX IF NOT EXISTS fraud_alerts_location_idx ON fraud_alerts(location);
CREATE INDEX IF NOT EXISTS fraud_alerts_status_idx ON fraud_alerts(status);
CREATE INDEX IF NOT EXISTS fraud_alerts_time_idx ON fraud_alerts(time_detected);

CREATE TABLE IF NOT EXISTS fraud_trends (
    id VARCHAR(255) PRIMARY KEY,
    fraud_type VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    period VARCHAR(20) NOT NULL,
    case_count INTEGER NOT NULL DEFAULT 0,
    average_amount DECIMAL(15,2),
    change_percentage DECIMAL(5,2),
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fraud_trends_type_idx ON fraud_trends(fraud_type);
CREATE INDEX IF NOT EXISTS fraud_trends_location_idx ON fraud_trends(location);
CREATE INDEX IF NOT EXISTS fraud_trends_period_idx ON fraud_trends(period);
CREATE INDEX IF NOT EXISTS fraud_trends_calculated_idx ON fraud_trends(calculated_at);

CREATE TABLE IF NOT EXISTS fraud_subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    locations TEXT NOT NULL,
    alert_types TEXT NOT NULL,
    severity TEXT NOT NULL,
    notification_methods TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fraud_subscriptions_user_idx ON fraud_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS fraud_subscriptions_active_idx ON fraud_subscriptions(active);

-- Community Resources Tables
CREATE TABLE IF NOT EXISTS community_experiences (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    location VARCHAR(100) NOT NULL,
    fraud_type VARCHAR(50) NOT NULL,
    amount_lost VARCHAR(50),
    what_happened TEXT NOT NULL,
    personal_vulnerabilities TEXT,
    systemic_challenges TEXT,
    lessons_learned TEXT,
    resolution_status VARCHAR(20) NOT NULL,
    resolution_details TEXT,
    anonymous BOOLEAN NOT NULL DEFAULT false,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_posted TIMESTAMP NOT NULL DEFAULT NOW(),
    likes INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    helpful INTEGER NOT NULL DEFAULT 0,
    tags TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS community_experiences_user_idx ON community_experiences(user_id);
CREATE INDEX IF NOT EXISTS community_experiences_fraud_type_idx ON community_experiences(fraud_type);
CREATE INDEX IF NOT EXISTS community_experiences_location_idx ON community_experiences(location);
CREATE INDEX IF NOT EXISTS community_experiences_resolution_idx ON community_experiences(resolution_status);
CREATE INDEX IF NOT EXISTS community_experiences_date_idx ON community_experiences(date_posted);
CREATE INDEX IF NOT EXISTS community_experiences_status_idx ON community_experiences(status);

CREATE TABLE IF NOT EXISTS experience_comments (
    id VARCHAR(255) PRIMARY KEY,
    experience_id VARCHAR(255) NOT NULL REFERENCES community_experiences(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    anonymous BOOLEAN NOT NULL DEFAULT false,
    likes INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS experience_comments_experience_idx ON experience_comments(experience_id);
CREATE INDEX IF NOT EXISTS experience_comments_user_idx ON experience_comments(user_id);
CREATE INDEX IF NOT EXISTS experience_comments_created_idx ON experience_comments(created_at);
CREATE INDEX IF NOT EXISTS experience_comments_status_idx ON experience_comments(status);

CREATE TABLE IF NOT EXISTS experience_interactions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    experience_id VARCHAR(255) NOT NULL REFERENCES community_experiences(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS experience_interactions_user_experience_idx ON experience_interactions(user_id, experience_id);
CREATE INDEX IF NOT EXISTS experience_interactions_type_idx ON experience_interactions(type);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_experience_interaction ON experience_interactions(user_id, experience_id, type);

CREATE TABLE IF NOT EXISTS content_reports (
    id VARCHAR(255) PRIMARY KEY,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    reason VARCHAR(50) NOT NULL,
    details TEXT,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_reports_content_idx ON content_reports(content_id, content_type);
CREATE INDEX IF NOT EXISTS content_reports_reporter_idx ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS content_reports_status_idx ON content_reports(status);
CREATE INDEX IF NOT EXISTS content_reports_timestamp_idx ON content_reports(timestamp);

-- Insert some sample fraud alerts for testing
INSERT INTO fraud_alerts (id, type, severity, title, description, location, affected_count, time_detected, status) VALUES
('alert_' || EXTRACT(EPOCH FROM NOW()) || '_1', 'active_threat', 'high', 'Fake Title Deed Ring Operating', 'Multiple reports of fraudulent title deeds being circulated by organized group', 'Kiambu County', 12, NOW() - INTERVAL '2 hours', 'active'),
('alert_' || EXTRACT(EPOCH FROM NOW()) || '_2', 'pattern_detected', 'medium', 'Rental Deposit Scam Surge', 'Increased activity of fake landlords targeting young professionals', 'Nairobi CBD', 8, NOW() - INTERVAL '6 hours', 'active'),
('alert_' || EXTRACT(EPOCH FROM NOW()) || '_3', 'area_warning', 'medium', 'Developer Verification Issues', 'Several unverified developers advertising non-existent projects', 'Machakos', 5, NOW() - INTERVAL '1 day', 'active');

-- Insert sample fraud trends
INSERT INTO fraud_trends (id, fraud_type, location, period, case_count, average_amount, change_percentage, calculated_at) VALUES
('trend_' || EXTRACT(EPOCH FROM NOW()) || '_1', 'title_deed', 'Kiambu', 'month', 15, 2500000.00, -15.0, NOW()),
('trend_' || EXTRACT(EPOCH FROM NOW()) || '_2', 'rental', 'Nairobi', 'month', 23, 180000.00, 23.0, NOW()),
('trend_' || EXTRACT(EPOCH FROM NOW()) || '_3', 'developer', 'Machakos', 'month', 8, 5000000.00, -8.0, NOW());

COMMENT ON TABLE fraud_alerts IS 'Real-time fraud alerts and warnings';
COMMENT ON TABLE fraud_trends IS 'Fraud pattern analysis and trends';
COMMENT ON TABLE fraud_subscriptions IS 'User subscriptions to fraud alerts';
COMMENT ON TABLE community_experiences IS 'User-shared fraud experiences and stories';
COMMENT ON TABLE experience_comments IS 'Comments on community experiences';
COMMENT ON TABLE experience_interactions IS 'User interactions with experiences (likes, helpful)';
COMMENT ON TABLE content_reports IS 'Reports of inappropriate community content';