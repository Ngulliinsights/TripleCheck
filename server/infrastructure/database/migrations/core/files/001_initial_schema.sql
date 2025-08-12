-- Initial Database Schema Migration
-- Creates the foundational tables for TripleCheck

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'agent', 'admin')),
  trust_score INTEGER NOT NULL DEFAULT 0,
  is_verified_agent BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  coordinates JSONB, -- {lat: number, lng: number}
  price DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  features JSONB NOT NULL DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (verification_status IN ('pending', 'verified', 'unverified', 'draft', 'rejected')),
  ai_verification_results JSONB,
  view_count INTEGER NOT NULL DEFAULT 0,
  favorite_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  available_from DATE,
  available_until DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(property_id, user_id) -- One review per user per property
);

-- Land Verification Sessions table
CREATE TABLE IF NOT EXISTS land_verification_sessions (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'standard' 
    CHECK (session_type IN ('standard', 'expedited', 'comprehensive')),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  current_layer TEXT,
  overall_risk_score DECIMAL(5,2) DEFAULT 0,
  risk_level TEXT DEFAULT 'unknown' 
    CHECK (risk_level IN ('very_low', 'low', 'medium', 'high', 'very_high', 'unknown')),
  confidence DECIMAL(5,2) DEFAULT 0,
  estimated_completion_date TIMESTAMP,
  actual_completion_date TIMESTAMP,
  monitoring_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Verification Layers table
CREATE TABLE IF NOT EXISTS verification_layers (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES land_verification_sessions(id) ON DELETE CASCADE,
  layer_type TEXT NOT NULL 
    CHECK (layer_type IN ('document_verification', 'physical_inspection', 'community_intelligence', 
                          'expert_review', 'risk_assessment', 'compliance_check')),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')),
  priority INTEGER NOT NULL DEFAULT 1,
  assigned_to INTEGER REFERENCES users(id),
  results JSONB,
  risk_score DECIMAL(5,2) DEFAULT 0,
  confidence DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Community References table
CREATE TABLE IF NOT EXISTS community_references (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL 
    CHECK (reference_type IN ('neighbor', 'colleague', 'church_member', 'family', 'friend', 'business_partner')),
  reference_name TEXT NOT NULL,
  reference_phone TEXT,
  reference_email TEXT,
  relationship TEXT NOT NULL,
  years_known INTEGER NOT NULL CHECK (years_known >= 0),
  trust_rating INTEGER NOT NULL CHECK (trust_rating >= 1 AND trust_rating <= 10),
  verification_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')),
  verification_code TEXT,
  verified_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Trust Scores table
CREATE TABLE IF NOT EXISTS trust_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 1000),
  trust_level TEXT NOT NULL DEFAULT 'newcomer' 
    CHECK (trust_level IN ('newcomer', 'community', 'verified', 'premium', 'champion')),
  community_score INTEGER NOT NULL DEFAULT 0 CHECK (community_score >= 0 AND community_score <= 100),
  behavior_score INTEGER NOT NULL DEFAULT 0 CHECK (behavior_score >= 0 AND behavior_score <= 100),
  social_score INTEGER NOT NULL DEFAULT 0 CHECK (social_score >= 0 AND social_score <= 100),
  location_score INTEGER NOT NULL DEFAULT 0 CHECK (location_score >= 0 AND location_score <= 100),
  endorsement_score INTEGER NOT NULL DEFAULT 0 CHECK (endorsement_score >= 0 AND endorsement_score <= 100),
  transaction_score INTEGER NOT NULL DEFAULT 0 CHECK (transaction_score >= 0 AND transaction_score <= 100),
  risk_level TEXT NOT NULL DEFAULT 'unknown' 
    CHECK (risk_level IN ('very_low', 'low', 'medium', 'high', 'very_high', 'unknown')),
  max_transaction_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  last_calculated TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id) -- One trust score per user
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score);

CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_verification ON properties(verification_status);
CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_active ON reviews(is_active);

CREATE INDEX IF NOT EXISTS idx_verification_sessions_property ON land_verification_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_user ON land_verification_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_status ON land_verification_sessions(status);

CREATE INDEX IF NOT EXISTS idx_verification_layers_session ON verification_layers(session_id);
CREATE INDEX IF NOT EXISTS idx_verification_layers_type ON verification_layers(layer_type);
CREATE INDEX IF NOT EXISTS idx_verification_layers_status ON verification_layers(status);
CREATE INDEX IF NOT EXISTS idx_verification_layers_assigned ON verification_layers(assigned_to);

CREATE INDEX IF NOT EXISTS idx_community_references_user ON community_references(user_id);
CREATE INDEX IF NOT EXISTS idx_community_references_type ON community_references(reference_type);
CREATE INDEX IF NOT EXISTS idx_community_references_status ON community_references(verification_status);

CREATE INDEX IF NOT EXISTS idx_trust_scores_user ON trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_level ON trust_scores(trust_level);
CREATE INDEX IF NOT EXISTS idx_trust_scores_overall ON trust_scores(overall_score);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_sessions_updated_at BEFORE UPDATE ON land_verification_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_layers_updated_at BEFORE UPDATE ON verification_layers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_references_updated_at BEFORE UPDATE ON community_references 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trust_scores_updated_at BEFORE UPDATE ON trust_scores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();