-- Trust System Tables Migration
-- Creates trust scoring, reputation, and community reference tables

-- Trust event type enum
CREATE TYPE trust_event_type AS ENUM (
  'successful_transaction',
  'verified_property',
  'community_endorsement',
  'expert_verification',
  'dispute_resolution',
  'fraud_report',
  'system_penalty'
);

-- Trust score reason enum
CREATE TYPE trust_score_reason AS ENUM (
  'initial_registration',
  'transaction_completion',
  'property_verification',
  'community_feedback',
  'expert_endorsement',
  'dispute_filed',
  'fraud_detected',
  'manual_adjustment'
);

-- Reference status enum
CREATE TYPE reference_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired'
);

-- Trust Scores table - Historical trust score tracking
CREATE TABLE trust_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_score INTEGER NOT NULL CHECK (previous_score >= 0 AND previous_score <= 100),
  new_score INTEGER NOT NULL CHECK (new_score >= 0 AND new_score <= 100),
  score_delta INTEGER NOT NULL CHECK (score_delta >= -100 AND score_delta <= 100),
  reason trust_score_reason NOT NULL,
  event_type trust_event_type NOT NULL,
  related_entity_id INTEGER,
  related_entity_type VARCHAR(50),
  description TEXT,
  evidence JSONB DEFAULT '{}',
  calculated_by VARCHAR(50) DEFAULT 'system' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Reputation Events table - Events that affect user reputation
CREATE TABLE reputation_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type trust_event_type NOT NULL,
  impact INTEGER NOT NULL CHECK (impact >= -100 AND impact <= 100),
  severity VARCHAR(20) DEFAULT 'medium' NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '[]',
  source_user_id INTEGER REFERENCES users(id),
  related_property_id INTEGER REFERENCES properties(id),
  related_transaction_id INTEGER REFERENCES transactions(id),
  verification_required BOOLEAN DEFAULT false NOT NULL,
  verified_at TIMESTAMP,
  verified_by INTEGER REFERENCES users(id),
  is_public BOOLEAN DEFAULT true NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Community References table - Peer reference system
CREATE TABLE community_references (
  id SERIAL PRIMARY KEY,
  referee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referencer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference_type VARCHAR(50) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  relationship_type VARCHAR(100),
  relationship_duration INTEGER,
  specific_skills JSONB DEFAULT '[]',
  would_recommend BOOLEAN DEFAULT true NOT NULL,
  status reference_status DEFAULT 'pending' NOT NULL,
  verification_notes TEXT,
  verified_at TIMESTAMP,
  verified_by INTEGER REFERENCES users(id),
  is_public BOOLEAN DEFAULT true NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(referee_id, referencer_id, reference_type)
);

-- Trust Disputes table - Disputes about trust scores or reputation
CREATE TABLE trust_disputes (
  id SERIAL PRIMARY KEY,
  disputant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dispute_type VARCHAR(50) NOT NULL,
  related_entity_id INTEGER,
  related_entity_type VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '[]',
  requested_action VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' NOT NULL,
  assigned_to INTEGER REFERENCES users(id),
  resolution TEXT,
  resolution_action VARCHAR(100),
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for trust_scores
CREATE INDEX trust_scores_user_idx ON trust_scores(user_id);
CREATE INDEX trust_scores_reason_idx ON trust_scores(reason);
CREATE INDEX trust_scores_event_type_idx ON trust_scores(event_type);
CREATE INDEX trust_scores_created_at_idx ON trust_scores(created_at);
CREATE INDEX trust_scores_active_idx ON trust_scores(is_active);
CREATE INDEX trust_scores_user_reason_idx ON trust_scores(user_id, reason);
CREATE INDEX trust_scores_user_date_idx ON trust_scores(user_id, created_at);

-- Indexes for reputation_events
CREATE INDEX reputation_events_user_idx ON reputation_events(user_id);
CREATE INDEX reputation_events_event_type_idx ON reputation_events(event_type);
CREATE INDEX reputation_events_severity_idx ON reputation_events(severity);
CREATE INDEX reputation_events_source_user_idx ON reputation_events(source_user_id);
CREATE INDEX reputation_events_property_idx ON reputation_events(related_property_id);
CREATE INDEX reputation_events_transaction_idx ON reputation_events(related_transaction_id);
CREATE INDEX reputation_events_public_idx ON reputation_events(is_public);
CREATE INDEX reputation_events_active_idx ON reputation_events(is_active);
CREATE INDEX reputation_events_created_at_idx ON reputation_events(created_at);
CREATE INDEX reputation_events_user_event_type_idx ON reputation_events(user_id, event_type);
CREATE INDEX reputation_events_user_public_idx ON reputation_events(user_id, is_public);

-- Indexes for community_references
CREATE INDEX community_references_referee_idx ON community_references(referee_id);
CREATE INDEX community_references_referencer_idx ON community_references(referencer_id);
CREATE INDEX community_references_type_idx ON community_references(reference_type);
CREATE INDEX community_references_rating_idx ON community_references(rating);
CREATE INDEX community_references_status_idx ON community_references(status);
CREATE INDEX community_references_public_idx ON community_references(is_public);
CREATE INDEX community_references_active_idx ON community_references(is_active);
CREATE INDEX community_references_created_at_idx ON community_references(created_at);
CREATE INDEX community_references_referee_status_idx ON community_references(referee_id, status);
CREATE INDEX community_references_referee_public_idx ON community_references(referee_id, is_public);

-- Indexes for trust_disputes
CREATE INDEX trust_disputes_disputant_idx ON trust_disputes(disputant_id);
CREATE INDEX trust_disputes_target_user_idx ON trust_disputes(target_user_id);
CREATE INDEX trust_disputes_type_idx ON trust_disputes(dispute_type);
CREATE INDEX trust_disputes_status_idx ON trust_disputes(status);
CREATE INDEX trust_disputes_priority_idx ON trust_disputes(priority);
CREATE INDEX trust_disputes_assigned_to_idx ON trust_disputes(assigned_to);
CREATE INDEX trust_disputes_active_idx ON trust_disputes(is_active);
CREATE INDEX trust_disputes_created_at_idx ON trust_disputes(created_at);
CREATE INDEX trust_disputes_status_priority_idx ON trust_disputes(status, priority);
CREATE INDEX trust_disputes_assigned_status_idx ON trust_disputes(assigned_to, status);