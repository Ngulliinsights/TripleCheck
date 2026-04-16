#!/usr/bin/env tsx
/**
 * Complete Database Initialization Script
 * 
 * This script creates all database tables from the schema and then loads data
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

import * as schema from "../../../../../src/shared/schema";

const logger = {
  info: (message: string) => console.log(`ℹ️  ${message}`),
  success: (message: string) => console.log(`✅ ${message}`),
  warn: (message: string) => console.warn(`⚠️  ${message}`),
  error: (message: string) => console.error(`❌ ${message}`),
};

async function createDatabaseTables() {
  try {
    logger.info("Starting database table creation...");

    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql, { schema });

    logger.info("Connected to database successfully");

    // Create tables by executing the schema
    logger.info("Creating database tables from schema...");

    // First, drop existing tables if they exist (in reverse dependency order)
    logger.info("Dropping existing tables if they exist...");
    
    await sql`DROP TABLE IF EXISTS monitoring_alerts CASCADE`;
    await sql`DROP TABLE IF EXISTS property_monitoring CASCADE`;
    await sql`DROP TABLE IF EXISTS expert_reports CASCADE`;
    await sql`DROP TABLE IF EXISTS expert_assignments CASCADE`;
    await sql`DROP TABLE IF EXISTS expert_profiles CASCADE`;
    await sql`DROP TABLE IF EXISTS community_feedback CASCADE`;
    await sql`DROP TABLE IF EXISTS government_designations CASCADE`;
    await sql`DROP TABLE IF EXISTS risk_factors CASCADE`;
    await sql`DROP TABLE IF EXISTS verification_layers CASCADE`;
    await sql`DROP TABLE IF EXISTS land_verification_sessions CASCADE`;
    await sql`DROP TABLE IF EXISTS property_views CASCADE`;
    await sql`DROP TABLE IF EXISTS favorites CASCADE`;
    await sql`DROP TABLE IF EXISTS reviews CASCADE`;
    await sql`DROP TABLE IF EXISTS transactions CASCADE`;
    await sql`DROP TABLE IF EXISTS statistics CASCADE`;
    await sql`DROP TABLE IF EXISTS properties CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    // Drop community resources tables
    await sql`DROP TABLE IF EXISTS content_reports CASCADE`;
    await sql`DROP TABLE IF EXISTS experience_interactions CASCADE`;
    await sql`DROP TABLE IF EXISTS experience_comments CASCADE`;
    await sql`DROP TABLE IF EXISTS community_experiences CASCADE`;
    await sql`DROP TABLE IF EXISTS fraud_subscriptions CASCADE`;
    await sql`DROP TABLE IF EXISTS fraud_trends CASCADE`;
    await sql`DROP TABLE IF EXISTS fraud_alerts CASCADE`;

    // Drop existing enums
    await sql`DROP TYPE IF EXISTS community_feedback_source CASCADE`;
    await sql`DROP TYPE IF EXISTS government_designation_type CASCADE`;
    await sql`DROP TYPE IF EXISTS risk_category CASCADE`;
    await sql`DROP TYPE IF EXISTS risk_level CASCADE`;
    await sql`DROP TYPE IF EXISTS verification_layer_type CASCADE`;
    await sql`DROP TYPE IF EXISTS land_verification_status CASCADE`;
    await sql`DROP TYPE IF EXISTS transaction_type CASCADE`;
    await sql`DROP TYPE IF EXISTS transaction_status CASCADE`;
    await sql`DROP TYPE IF EXISTS property_type CASCADE`;
    await sql`DROP TYPE IF EXISTS user_role CASCADE`;
    await sql`DROP TYPE IF EXISTS verification_status CASCADE`;

    logger.success("Dropped existing tables and types");

    // Create enums first
    logger.info("Creating database enums...");
    
    await sql`CREATE TYPE verification_status AS ENUM ('verified', 'pending', 'unverified', 'draft')`;
    await sql`CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin')`;
    await sql`CREATE TYPE property_type AS ENUM ('apartment', 'house', 'condo', 'townhouse', 'studio', 'commercial', 'land')`;
    await sql`CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled', 'failed')`;
    await sql`CREATE TYPE transaction_type AS ENUM ('buy', 'sell', 'rent', 'lease')`;
    await sql`CREATE TYPE land_verification_status AS ENUM ('not_started', 'in_progress', 'completed', 'suspended', 'failed')`;
    await sql`CREATE TYPE verification_layer_type AS ENUM ('registry', 'physical', 'community', 'government', 'legal', 'expert')`;
    await sql`CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical')`;
    await sql`CREATE TYPE risk_category AS ENUM ('ownership', 'government', 'legal', 'physical', 'community')`;
    await sql`CREATE TYPE government_designation_type AS ENUM ('riparian', 'road_reserve', 'utility_corridor', 'environmental', 'mineral_rights')`;
    await sql`CREATE TYPE community_feedback_source AS ENUM ('local_admin', 'neighbor', 'community_leader', 'resident')`;

    logger.success("Created database enums");

    // Create core tables
    logger.info("Creating users table...");
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role user_role DEFAULT 'user' NOT NULL,
        trust_score INTEGER DEFAULT 50 NOT NULL,
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
      )
    `;

    logger.info("Creating properties table...");
    await sql`
      CREATE TABLE properties (
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
      )
    `;

    logger.info("Creating reviews table...");
    await sql`
      CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        verified BOOLEAN DEFAULT false NOT NULL,
        helpful_count INTEGER DEFAULT 0 NOT NULL,
        report_count INTEGER DEFAULT 0 NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, property_id)
      )
    `;

    logger.info("Creating favorites table...");
    await sql`
      CREATE TABLE favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, property_id)
      )
    `;

    logger.info("Creating property_views table...");
    await sql`
      CREATE TABLE property_views (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        viewed_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    logger.info("Creating transactions table...");
    await sql`
      CREATE TABLE transactions (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(50) UNIQUE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
        transaction_type transaction_type NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        transaction_date TIMESTAMP NOT NULL,
        status transaction_status DEFAULT 'pending' NOT NULL,
        other_parties JSONB DEFAULT '[]' NOT NULL,
        is_suspicious BOOLEAN DEFAULT false NOT NULL,
        fraud_score INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    logger.info("Creating statistics table...");
    await sql`
      CREATE TABLE statistics (
        id SERIAL PRIMARY KEY,
        metric_type VARCHAR(100) NOT NULL,
        metric_key VARCHAR(100) NOT NULL,
        metric_value JSONB NOT NULL,
        period_type VARCHAR(20) DEFAULT 'all_time',
        period_start TIMESTAMP,
        period_end TIMESTAMP,
        calculated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        UNIQUE(metric_type, metric_key, period_type, period_start, period_end)
      )
    `;

    // Create land verification tables
    logger.info("Creating land verification tables...");
    
    await sql`
      CREATE TABLE land_verification_sessions (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        status land_verification_status DEFAULT 'not_started' NOT NULL,
        current_layer verification_layer_type,
        overall_risk_score INTEGER DEFAULT 0,
        risk_level risk_level DEFAULT 'low' NOT NULL,
        confidence DECIMAL(3, 2) DEFAULT 0.00,
        estimated_completion_date TIMESTAMP,
        actual_completion_date TIMESTAMP,
        monitoring_enabled BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await sql`
      CREATE TABLE verification_layers (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
        layer_type verification_layer_type NOT NULL,
        status land_verification_status DEFAULT 'not_started' NOT NULL,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        estimated_duration INTEGER,
        actual_duration INTEGER,
        assigned_expert_id INTEGER,
        results JSONB DEFAULT '{}',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(session_id, layer_type)
      )
    `;

    await sql`
      CREATE TABLE risk_factors (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
        category risk_category NOT NULL,
        severity risk_level NOT NULL,
        confidence DECIMAL(3, 2) NOT NULL,
        description TEXT NOT NULL,
        evidence JSONB DEFAULT '[]',
        impact TEXT NOT NULL,
        likelihood DECIMAL(3, 2) NOT NULL,
        mitigation JSONB DEFAULT '[]',
        source_layer verification_layer_type NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await sql`
      CREATE TABLE government_designations (
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
      )
    `;

    await sql`
      CREATE TABLE community_feedback (
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
        reliability DECIMAL(3, 2) DEFAULT 0.50,
        verified_by VARCHAR(255),
        is_confidential BOOLEAN DEFAULT false NOT NULL,
        recorded_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create expert tables
    logger.info("Creating expert tables...");
    
    await sql`
      CREATE TABLE expert_profiles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        expert_type VARCHAR(50) NOT NULL,
        credentials JSONB DEFAULT '[]',
        specializations JSONB DEFAULT '[]',
        location VARCHAR(255) NOT NULL,
        contact_info JSONB NOT NULL,
        experience JSONB NOT NULL,
        availability JSONB NOT NULL,
        pricing JSONB NOT NULL,
        verification_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        last_active_date TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await sql`
      CREATE TABLE expert_assignments (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
        layer_id INTEGER REFERENCES verification_layers(id) ON DELETE CASCADE,
        expert_type VARCHAR(50) NOT NULL,
        expert_name VARCHAR(255) NOT NULL,
        expert_credentials VARCHAR(500),
        contact_info VARCHAR(255),
        specialization VARCHAR(255),
        assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expected_completion_date TIMESTAMP,
        actual_completion_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'assigned' NOT NULL,
        report_url VARCHAR(500),
        cost DECIMAL(10, 2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await sql`
      CREATE TABLE expert_reports (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES expert_assignments(id) ON DELETE CASCADE NOT NULL,
        expert_id INTEGER REFERENCES expert_profiles(id) ON DELETE CASCADE NOT NULL,
        report_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        findings JSONB DEFAULT '[]',
        recommendations JSONB DEFAULT '[]',
        attachments JSONB DEFAULT '[]',
        submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
        review_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        quality_score INTEGER,
        review_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create monitoring tables
    logger.info("Creating monitoring tables...");
    
    await sql`
      CREATE TABLE property_monitoring (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
        session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        monitoring_type VARCHAR(50) NOT NULL,
        frequency VARCHAR(20) DEFAULT 'monthly' NOT NULL,
        last_checked TIMESTAMP,
        next_check TIMESTAMP,
        alerts_generated INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true NOT NULL,
        configuration JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await sql`
      CREATE TABLE monitoring_alerts (
        id SERIAL PRIMARY KEY,
        monitoring_id INTEGER REFERENCES property_monitoring(id) ON DELETE CASCADE NOT NULL,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        severity risk_level NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        action_required BOOLEAN DEFAULT false NOT NULL,
        action_taken BOOLEAN DEFAULT false NOT NULL,
        action_notes TEXT,
        is_read BOOLEAN DEFAULT false NOT NULL,
        is_dismissed BOOLEAN DEFAULT false NOT NULL,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create fraud intelligence tables
    logger.info("Creating fraud intelligence tables...");
    
    await sql`
      CREATE TABLE fraud_alerts (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'alert_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9),
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
      )
    `;

    await sql`
      CREATE TABLE fraud_trends (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'trend_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9),
        fraud_type VARCHAR(50) NOT NULL,
        location VARCHAR(100) NOT NULL,
        period VARCHAR(20) NOT NULL,
        case_count INTEGER NOT NULL DEFAULT 0,
        average_amount DECIMAL(15, 2),
        change_percentage DECIMAL(5, 2),
        calculated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE fraud_subscriptions (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'sub_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        locations TEXT NOT NULL,
        alert_types TEXT NOT NULL,
        severity TEXT NOT NULL,
        notification_methods TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create community resources tables
    logger.info("Creating community resources tables...");
    
    await sql`
      CREATE TABLE community_experiences (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'exp_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9),
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
      )
    `;

    await sql`
      CREATE TABLE experience_comments (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'comment_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9),
        experience_id VARCHAR(255) NOT NULL REFERENCES community_experiences(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        anonymous BOOLEAN NOT NULL DEFAULT false,
        likes INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE experience_interactions (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'interaction_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        experience_id VARCHAR(255) NOT NULL REFERENCES community_experiences(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, experience_id, type)
      )
    `;

    await sql`
      CREATE TABLE content_reports (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'report_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9),
        content_id VARCHAR(255) NOT NULL,
        content_type VARCHAR(20) NOT NULL,
        reason VARCHAR(50) NOT NULL,
        details TEXT,
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TIMESTAMP,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    logger.success("Created all database tables");

    // Create indexes for better performance
    logger.info("Creating database indexes...");
    
    // Users indexes
    await sql`CREATE INDEX idx_users_email ON users(email)`;
    await sql`CREATE INDEX idx_users_username ON users(username)`;
    await sql`CREATE INDEX idx_users_role ON users(role)`;
    await sql`CREATE INDEX idx_users_trust_score ON users(trust_score)`;
    await sql`CREATE INDEX idx_users_active ON users(is_active)`;
    await sql`CREATE INDEX idx_users_active_role ON users(is_active, role)`;

    // Properties indexes
    await sql`CREATE INDEX idx_properties_owner ON properties(owner_id)`;
    await sql`CREATE INDEX idx_properties_status ON properties(verification_status)`;
    await sql`CREATE INDEX idx_properties_price ON properties(price)`;
    await sql`CREATE INDEX idx_properties_location ON properties(location)`;
    await sql`CREATE INDEX idx_properties_active ON properties(is_active)`;
    await sql`CREATE INDEX idx_properties_featured ON properties(is_featured)`;
    await sql`CREATE INDEX idx_properties_created_at ON properties(created_at)`;
    await sql`CREATE INDEX idx_properties_active_status ON properties(is_active, verification_status)`;
    await sql`CREATE INDEX idx_properties_active_featured ON properties(is_active, is_featured)`;
    await sql`CREATE INDEX idx_properties_location_price ON properties(location, price)`;

    // Reviews indexes
    await sql`CREATE INDEX idx_reviews_property ON reviews(property_id)`;
    await sql`CREATE INDEX idx_reviews_user ON reviews(user_id)`;
    await sql`CREATE INDEX idx_reviews_rating ON reviews(rating)`;
    await sql`CREATE INDEX idx_reviews_verified ON reviews(verified)`;
    await sql`CREATE INDEX idx_reviews_active ON reviews(is_active)`;
    await sql`CREATE INDEX idx_reviews_created_at ON reviews(created_at)`;
    await sql`CREATE INDEX idx_reviews_property_active ON reviews(property_id, is_active)`;
    await sql`CREATE INDEX idx_reviews_property_rating ON reviews(property_id, rating)`;

    // Favorites indexes
    await sql`CREATE INDEX idx_favorites_user ON favorites(user_id)`;
    await sql`CREATE INDEX idx_favorites_property ON favorites(property_id)`;

    // Property views indexes
    await sql`CREATE INDEX idx_property_views_property ON property_views(property_id)`;
    await sql`CREATE INDEX idx_property_views_user ON property_views(user_id)`;
    await sql`CREATE INDEX idx_property_views_viewed_at ON property_views(viewed_at)`;
    await sql`CREATE INDEX idx_property_views_property_date ON property_views(property_id, viewed_at)`;

    // Transactions indexes
    await sql`CREATE INDEX idx_transactions_user ON transactions(user_id)`;
    await sql`CREATE INDEX idx_transactions_property ON transactions(property_id)`;
    await sql`CREATE INDEX idx_transactions_status ON transactions(status)`;
    await sql`CREATE INDEX idx_transactions_type ON transactions(transaction_type)`;
    await sql`CREATE INDEX idx_transactions_date ON transactions(transaction_date)`;
    await sql`CREATE INDEX idx_transactions_suspicious ON transactions(is_suspicious)`;
    await sql`CREATE INDEX idx_transactions_fraud_score ON transactions(fraud_score)`;
    await sql`CREATE INDEX idx_transactions_external_id ON transactions(external_id)`;
    await sql`CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date)`;
    await sql`CREATE INDEX idx_transactions_property_date ON transactions(property_id, transaction_date)`;

    // Land verification indexes
    await sql`CREATE INDEX idx_land_verification_sessions_property ON land_verification_sessions(property_id)`;
    await sql`CREATE INDEX idx_land_verification_sessions_user ON land_verification_sessions(user_id)`;
    await sql`CREATE INDEX idx_land_verification_sessions_status ON land_verification_sessions(status)`;
    await sql`CREATE INDEX idx_land_verification_sessions_risk_level ON land_verification_sessions(risk_level)`;
    await sql`CREATE INDEX idx_land_verification_sessions_created_at ON land_verification_sessions(created_at)`;
    await sql`CREATE INDEX idx_land_verification_sessions_property_status ON land_verification_sessions(property_id, status)`;
    await sql`CREATE INDEX idx_land_verification_sessions_user_status ON land_verification_sessions(user_id, status)`;

    logger.success("Created all database indexes");

    logger.success("Database tables created successfully!");
    return true;

  } catch (error) {
    logger.error(`Failed to create database tables: ${error}`);
    throw error;
  }
}

async function main() {
  try {
    await createDatabaseTables();
    logger.success("Database initialization completed successfully!");
    logger.info("You can now run the data loading script:");
    logger.info("tsx scripts/data-migration/robust-batch-loader.ts");
  } catch (error) {
    logger.error("Database initialization failed");
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createDatabaseTables };