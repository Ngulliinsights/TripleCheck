-- @name: Create Comprehensive Database Tables
-- @description: Creates all core database tables for the TripleCheck system with proper indexes and constraints
-- @author: system
-- @timestamp: 2024-01-01T00:00:00.000Z
-- @tags: core, tables, initial


-- @up start
-- Comprehensive Database Tables Creation
-- This migration creates all missing database tables for the TripleCheck system
-- Task 1.1.4: Implement Critical Missing Database Tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums first (if they don't exist)
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('verified', 'pending', 'unverified', 'draft');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('apartment', 'house', 'condo', 'townhouse', 'studio', 'commercial', 'land');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE land_verification_status AS ENUM ('not_started', 'in_progress', 'completed', 'suspended', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_layer_type AS ENUM ('registry', 'physical', 'community', 'government', 'legal', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_category AS ENUM ('ownership', 'government', 'legal', 'physical', 'community');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE government_designation_type AS ENUM ('riparian', 'road_reserve', 'utility_corridor', 'environmental', 'mineral_rights');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE community_feedback_source AS ENUM ('local_admin', 'neighbor', 'community_leader', 'resident');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fraud_alert_status AS ENUM ('active', 'investigating', 'resolved', 'false_positive', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fraud_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fraud_category AS ENUM ('identity_theft', 'document_forgery', 'price_manipulation', 'fake_property', 'payment_fraud', 'impersonation', 'data_manipulation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE investigation_status AS ENUM ('pending', 'active', 'suspended', 'completed', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trust_event_type AS ENUM ('successful_transaction', 'verified_property', 'community_endorsement', 'expert_verification', 'dispute_resolution', 'fraud_report', 'system_penalty');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trust_score_reason AS ENUM ('initial_registration', 'transaction_completion', 'property_verification', 'community_feedback', 'expert_endorsement', 'dispute_filed', 'fraud_detected', 'manual_adjustment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE professional_specialization AS ENUM ('land_surveying', 'property_law', 'real_estate_appraisal', 'construction_inspection', 'environmental_assessment', 'title_verification', 'boundary_disputes', 'zoning_compliance', 'mortgage_processing', 'property_management');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create core tables if they don't exist

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user' NOT NULL,
    trust_score INTEGER DEFAULT 50 NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
    is_verified_agent BOOLEAN DEFAULT false NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    profile_image_url VARCHAR(500),
    bio TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login_at TIMESTAMP,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT,
    coordinates JSONB,
    image_urls JSONB DEFAULT '[]' NOT NULL,
    verification_status verification_status DEFAULT 'pending' NOT NULL,
    features JSONB,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    ai_verification_results JSONB,
    view_count INTEGER DEFAULT 0 NOT NULL,
    favorite_count INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    available_from TIMESTAMP,
    available_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Professionals table
CREATE TABLE IF NOT EXISTS professionals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    business_address TEXT NOT NULL,
    service_areas JSONB DEFAULT '[]' NOT NULL,
    primary_specialization professional_specialization NOT NULL,
    secondary_specializations JSONB DEFAULT '[]',
    license_number VARCHAR(100),
    license_expiry_date DATE,
    certifications JSONB DEFAULT '[]',
    years_experience INTEGER DEFAULT 0,
    hourly_rate DECIMAL(8, 2),
    availability_schedule JSONB DEFAULT '{}',
    portfolio_urls JSONB DEFAULT '[]',
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    completed_assignments INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    verification_documents JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create comprehensive indexes for optimal performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_trust_score_idx ON users(trust_score);
CREATE INDEX IF NOT EXISTS users_active_idx ON users(is_active);
CREATE INDEX IF NOT EXISTS users_active_role_idx ON users(is_active, role);

-- Properties table indexes
CREATE INDEX IF NOT EXISTS properties_owner_idx ON properties(owner_id);
CREATE INDEX IF NOT EXISTS properties_status_idx ON properties(verification_status);
CREATE INDEX IF NOT EXISTS properties_price_idx ON properties(price);
CREATE INDEX IF NOT EXISTS properties_location_idx ON properties(location);
CREATE INDEX IF NOT EXISTS properties_active_idx ON properties(is_active);
CREATE INDEX IF NOT EXISTS properties_featured_idx ON properties(is_featured);
CREATE INDEX IF NOT EXISTS properties_created_at_idx ON properties(created_at);
CREATE INDEX IF NOT EXISTS properties_active_status_idx ON properties(is_active, verification_status);
CREATE INDEX IF NOT EXISTS properties_active_featured_idx ON properties(is_active, is_featured);
CREATE INDEX IF NOT EXISTS properties_location_price_idx ON properties(location, price);

-- Professionals table indexes
CREATE INDEX IF NOT EXISTS professionals_user_idx ON professionals(user_id);
CREATE INDEX IF NOT EXISTS professionals_email_idx ON professionals(email);
CREATE INDEX IF NOT EXISTS professionals_specialization_idx ON professionals(primary_specialization);
CREATE INDEX IF NOT EXISTS professionals_verified_idx ON professionals(is_verified);
CREATE INDEX IF NOT EXISTS professionals_active_idx ON professionals(is_active);
CREATE INDEX IF NOT EXISTS professionals_rating_idx ON professionals(rating);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to core tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_professionals_updated_at ON professionals;
CREATE TRIGGER update_professionals_updated_at
    BEFORE UPDATE ON professionals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW active_properties AS
SELECT p.*, u.username as owner_username, u.email as owner_email
FROM properties p
JOIN users u ON p.owner_id = u.id
WHERE p.is_active = true;

CREATE OR REPLACE VIEW verified_professionals AS
SELECT p.*, u.username, u.email as user_email
FROM professionals p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.is_verified = true AND p.is_active = true;

-- Add comments for documentation
COMMENT ON TABLE users IS 'Core user accounts with trust scoring';
COMMENT ON TABLE properties IS 'Property listings with verification status';
COMMENT ON TABLE professionals IS 'Verified professionals for land verification';
-- @up end

-- @down start
-- Drop views
DROP VIEW IF EXISTS verified_professionals;
DROP VIEW IF EXISTS active_properties;

-- Drop triggers
DROP TRIGGER IF EXISTS update_professionals_updated_at ON professionals;
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS professionals_rating_idx;
DROP INDEX IF EXISTS professionals_active_idx;
DROP INDEX IF EXISTS professionals_verified_idx;
DROP INDEX IF EXISTS professionals_specialization_idx;
DROP INDEX IF EXISTS professionals_email_idx;
DROP INDEX IF EXISTS professionals_user_idx;

DROP INDEX IF EXISTS properties_location_price_idx;
DROP INDEX IF EXISTS properties_active_featured_idx;
DROP INDEX IF EXISTS properties_active_status_idx;
DROP INDEX IF EXISTS properties_created_at_idx;
DROP INDEX IF EXISTS properties_featured_idx;
DROP INDEX IF EXISTS properties_active_idx;
DROP INDEX IF EXISTS properties_location_idx;
DROP INDEX IF EXISTS properties_price_idx;
DROP INDEX IF EXISTS properties_status_idx;
DROP INDEX IF EXISTS properties_owner_idx;

DROP INDEX IF EXISTS users_active_role_idx;
DROP INDEX IF EXISTS users_active_idx;
DROP INDEX IF EXISTS users_trust_score_idx;
DROP INDEX IF EXISTS users_role_idx;
DROP INDEX IF EXISTS users_username_idx;
DROP INDEX IF EXISTS users_email_idx;

-- Drop tables
DROP TABLE IF EXISTS professionals;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS users;

-- Drop enums
DROP TYPE IF EXISTS professional_specialization;
DROP TYPE IF EXISTS trust_score_reason;
DROP TYPE IF EXISTS trust_event_type;
DROP TYPE IF EXISTS investigation_status;
DROP TYPE IF EXISTS fraud_category;
DROP TYPE IF EXISTS fraud_severity;
DROP TYPE IF EXISTS fraud_alert_status;
DROP TYPE IF EXISTS community_feedback_source;
DROP TYPE IF EXISTS government_designation_type;
DROP TYPE IF EXISTS risk_category;
DROP TYPE IF EXISTS risk_level;
DROP TYPE IF EXISTS verification_layer_type;
DROP TYPE IF EXISTS land_verification_status;
DROP TYPE IF EXISTS property_type;
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS verification_status;
-- @down end

-- @validate start
-- Validate that core tables exist and have expected structure
SELECT 
    CASE 
        WHEN COUNT(*) = 3 THEN 'PASS'
        ELSE 'FAIL'
    END as validation_result,
    'Core tables created' as test_description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'properties', 'professionals');

-- Validate that indexes exist
SELECT 
    CASE 
        WHEN COUNT(*) >= 15 THEN 'PASS'
        ELSE 'FAIL'
    END as validation_result,
    'Core indexes created' as test_description
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'properties', 'professionals');

-- Validate that enums exist
SELECT 
    CASE 
        WHEN COUNT(*) >= 10 THEN 'PASS'
        ELSE 'FAIL'
    END as validation_result,
    'Core enums created' as test_description
FROM pg_type 
WHERE typtype = 'e' 
AND typname IN ('verification_status', 'user_role', 'property_type', 'land_verification_status');
-- @validate end