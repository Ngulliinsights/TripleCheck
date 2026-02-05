-- Fraud Detection System Tables Migration
-- Creates fraud alerts, cases, patterns, and compliance reporting tables

-- Fraud alert status enum
CREATE TYPE fraud_alert_status AS ENUM (
  'active',
  'investigating',
  'resolved',
  'false_positive',
  'dismissed'
);

-- Fraud severity enum
CREATE TYPE fraud_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Fraud category enum
CREATE TYPE fraud_category AS ENUM (
  'identity_theft',
  'document_forgery',
  'price_manipulation',
  'fake_property',
  'payment_fraud',
  'impersonation',
  'data_manipulation'
);

-- Investigation status enum
CREATE TYPE investigation_status AS ENUM (
  'pending',
  'active',
  'suspended',
  'completed',
  'closed'
);

-- Compliance status enum
CREATE TYPE compliance_status AS ENUM (
  'compliant',
  'non_compliant',
  'under_review',
  'exempted'
);

-- Fraud Alerts table - Real-time fraud detection
CREATE TABLE fraud_alerts (
  id SERIAL PRIMARY KEY,
  alert_id VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
  category fraud_category NOT NULL,
  severity fraud_severity NOT NULL,
  status fraud_alert_status DEFAULT 'active' NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0.00 AND confidence <= 1.00),
  detection_method VARCHAR(100) NOT NULL,
  detection_rules JSONB DEFAULT '[]',
  evidence JSONB DEFAULT '{}',
  affected_entities JSONB DEFAULT '[]',
  investigation_required BOOLEAN DEFAULT true NOT NULL,
  assigned_investigator INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  false_positive_reason TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Fraud Cases table - Investigation case management
CREATE TABLE fraud_cases (
  id SERIAL PRIMARY KEY,
  case_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category fraud_category NOT NULL,
  severity fraud_severity NOT NULL,
  status investigation_status DEFAULT 'pending' NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' NOT NULL,
  primary_investigator INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  secondary_investigators JSONB DEFAULT '[]',
  suspected_users JSONB DEFAULT '[]',
  affected_users JSONB DEFAULT '[]',
  related_properties JSONB DEFAULT '[]',
  related_transactions JSONB DEFAULT '[]',
  related_alerts JSONB DEFAULT '[]',
  evidence JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '[]',
  estimated_loss DECIMAL(12,2),
  actual_loss DECIMAL(12,2),
  recovered_amount DECIMAL(12,2),
  legal_action BOOLEAN DEFAULT false NOT NULL,
  legal_action_details TEXT,
  compliance_reported BOOLEAN DEFAULT false NOT NULL,
  reported_to_authorities JSONB DEFAULT '[]',
  opened_at TIMESTAMP DEFAULT NOW() NOT NULL,
  closed_at TIMESTAMP,
  resolution TEXT,
  resolution_category VARCHAR(50),
  preventive_measures JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Fraud Patterns table - ML pattern recognition
CREATE TABLE fraud_patterns (
  id SERIAL PRIMARY KEY,
  pattern_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category fraud_category NOT NULL,
  pattern_type VARCHAR(50) NOT NULL,
  detection_rules JSONB NOT NULL,
  ml_model_id VARCHAR(100),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0.00 AND confidence <= 1.00),
  accuracy DECIMAL(3,2) CHECK (accuracy >= 0.00 AND accuracy <= 1.00),
  false_positive_rate DECIMAL(3,2) CHECK (false_positive_rate >= 0.00 AND false_positive_rate <= 1.00),
  detection_count INTEGER DEFAULT 0 NOT NULL,
  confirmed_fraud_count INTEGER DEFAULT 0 NOT NULL,
  false_positive_count INTEGER DEFAULT 0 NOT NULL,
  last_triggered TIMESTAMP,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Compliance Reports table - Regulatory reporting
CREATE TABLE compliance_reports (
  id SERIAL PRIMARY KEY,
  report_id VARCHAR(50) UNIQUE NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  regulatory_body VARCHAR(255) NOT NULL,
  reporting_period VARCHAR(50) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  status compliance_status DEFAULT 'under_review' NOT NULL,
  summary TEXT NOT NULL,
  total_incidents INTEGER DEFAULT 0 NOT NULL,
  confirmed_fraud INTEGER DEFAULT 0 NOT NULL,
  false_positives INTEGER DEFAULT 0 NOT NULL,
  total_loss DECIMAL(12,2),
  recovered_amount DECIMAL(12,2),
  affected_users INTEGER DEFAULT 0 NOT NULL,
  preventive_measures JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  submitted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  approved_at TIMESTAMP,
  due_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for fraud_alerts
CREATE UNIQUE INDEX fraud_alerts_alert_id_idx ON fraud_alerts(alert_id);
CREATE INDEX fraud_alerts_user_idx ON fraud_alerts(user_id);
CREATE INDEX fraud_alerts_property_idx ON fraud_alerts(property_id);
CREATE INDEX fraud_alerts_transaction_idx ON fraud_alerts(transaction_id);
CREATE INDEX fraud_alerts_category_idx ON fraud_alerts(category);
CREATE INDEX fraud_alerts_severity_idx ON fraud_alerts(severity);
CREATE INDEX fraud_alerts_status_idx ON fraud_alerts(status);
CREATE INDEX fraud_alerts_risk_score_idx ON fraud_alerts(risk_score);
CREATE INDEX fraud_alerts_investigator_idx ON fraud_alerts(assigned_investigator);
CREATE INDEX fraud_alerts_active_idx ON fraud_alerts(is_active);
CREATE INDEX fraud_alerts_created_at_idx ON fraud_alerts(created_at);
CREATE INDEX fraud_alerts_status_severity_idx ON fraud_alerts(status, severity);
CREATE INDEX fraud_alerts_category_severity_idx ON fraud_alerts(category, severity);

-- Indexes for fraud_cases
CREATE UNIQUE INDEX fraud_cases_case_number_idx ON fraud_cases(case_number);
CREATE INDEX fraud_cases_category_idx ON fraud_cases(category);
CREATE INDEX fraud_cases_severity_idx ON fraud_cases(severity);
CREATE INDEX fraud_cases_status_idx ON fraud_cases(status);
CREATE INDEX fraud_cases_priority_idx ON fraud_cases(priority);
CREATE INDEX fraud_cases_investigator_idx ON fraud_cases(primary_investigator);
CREATE INDEX fraud_cases_opened_at_idx ON fraud_cases(opened_at);
CREATE INDEX fraud_cases_active_idx ON fraud_cases(is_active);
CREATE INDEX fraud_cases_status_priority_idx ON fraud_cases(status, priority);
CREATE INDEX fraud_cases_category_severity_idx ON fraud_cases(category, severity);

-- Indexes for fraud_patterns
CREATE UNIQUE INDEX fraud_patterns_pattern_id_idx ON fraud_patterns(pattern_id);
CREATE INDEX fraud_patterns_category_idx ON fraud_patterns(category);
CREATE INDEX fraud_patterns_type_idx ON fraud_patterns(pattern_type);
CREATE INDEX fraud_patterns_confidence_idx ON fraud_patterns(confidence);
CREATE INDEX fraud_patterns_active_idx ON fraud_patterns(is_active);
CREATE INDEX fraud_patterns_last_triggered_idx ON fraud_patterns(last_triggered);
CREATE INDEX fraud_patterns_created_by_idx ON fraud_patterns(created_by);

-- Indexes for compliance_reports
CREATE UNIQUE INDEX compliance_reports_report_id_idx ON compliance_reports(report_id);
CREATE INDEX compliance_reports_type_idx ON compliance_reports(report_type);
CREATE INDEX compliance_reports_body_idx ON compliance_reports(regulatory_body);
CREATE INDEX compliance_reports_status_idx ON compliance_reports(status);
CREATE INDEX compliance_reports_period_idx ON compliance_reports(reporting_period);
CREATE INDEX compliance_reports_submitted_by_idx ON compliance_reports(submitted_by);
CREATE INDEX compliance_reports_due_date_idx ON compliance_reports(due_date);
CREATE INDEX compliance_reports_active_idx ON compliance_reports(is_active);
CREATE INDEX compliance_reports_status_due_date_idx ON compliance_reports(status, due_date);
CREATE INDEX compliance_reports_body_period_idx ON compliance_reports(regulatory_body, reporting_period);