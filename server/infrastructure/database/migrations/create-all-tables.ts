/**
 * Comprehensive Database Migration
 * Creates all tables from the schema definition
 */

import { logger } from "../../monitoring/logger";

export async function createAllTables(sql: any) {
  try {
    logger.info("Creating comprehensive database schema...", "MIGRATION");

    // Create enums first
    await sql`
      DO $$ BEGIN
        CREATE TYPE verification_status AS ENUM ('verified', 'pending', 'unverified', 'draft');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE property_type AS ENUM ('apartment', 'house', 'condo', 'townhouse', 'studio', 'commercial', 'land');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE land_verification_status AS ENUM ('not_started', 'in_progress', 'completed', 'suspended', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE expert_type AS ENUM ('real-estate-agent', 'property-lawyer', 'surveyor', 'valuer', 'property-manager', 'photographer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        role user_role NOT NULL DEFAULT 'user',
        trust_score INTEGER NOT NULL DEFAULT 0,
        is_verified BOOLEAN NOT NULL DEFAULT false,
        is_verified_agent BOOLEAN NOT NULL DEFAULT false,
        profile_image_url TEXT,
        bio TEXT,
        location VARCHAR(255),
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create properties table
    await sql`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(255) NOT NULL,
        address TEXT,
        price DECIMAL(15,2) NOT NULL,
        property_type property_type NOT NULL,
        bedrooms INTEGER,
        bathrooms DECIMAL(3,1),
        square_feet INTEGER,
        parking_spaces INTEGER,
        year_built INTEGER,
        pet_friendly BOOLEAN DEFAULT false,
        furnished BOOLEAN DEFAULT false,
        amenities TEXT[],
        image_urls TEXT[] DEFAULT '{}',
        features JSONB DEFAULT '{}',
        coordinates JSONB,
        verification_status verification_status NOT NULL DEFAULT 'pending',
        ai_verification_results JSONB,
        land_verification JSONB,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        views_count INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create reviews table
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        is_verified BOOLEAN DEFAULT false,
        helpful_count INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create favorites table
    await sql`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, property_id)
      )
    `;

    // Create property_views table
    await sql`
      CREATE TABLE IF NOT EXISTS property_views (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ip_address INET,
        user_agent TEXT,
        referrer TEXT,
        session_id VARCHAR(255),
        view_duration INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        payment_method VARCHAR(50),
        payment_reference VARCHAR(255),
        commission_rate DECIMAL(5,2),
        commission_amount DECIMAL(15,2),
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create land_verification_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS land_verification_sessions (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        status land_verification_status NOT NULL DEFAULT 'not_started',
        priority VARCHAR(20) DEFAULT 'medium',
        requested_layers TEXT[] DEFAULT '{}',
        completed_layers TEXT[] DEFAULT '{}',
        pending_layers TEXT[] DEFAULT '{}',
        overall_risk_score INTEGER DEFAULT 0,
        risk_level risk_level DEFAULT 'low',
        estimated_completion TIMESTAMP,
        actual_completion TIMESTAMP,
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create verification_layers table
    await sql`
      CREATE TABLE IF NOT EXISTS verification_layers (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES land_verification_sessions(id) ON DELETE CASCADE,
        layer_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        risk_score INTEGER DEFAULT 0,
        confidence_level DECIMAL(5,2) DEFAULT 0.0,
        findings JSONB DEFAULT '{}',
        evidence JSONB DEFAULT '{}',
        expert_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create risk_factors table
    await sql`
      CREATE TABLE IF NOT EXISTS risk_factors (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES land_verification_sessions(id) ON DELETE CASCADE,
        layer_id INTEGER REFERENCES verification_layers(id) ON DELETE CASCADE,
        factor_type VARCHAR(100) NOT NULL,
        severity risk_level NOT NULL,
        description TEXT NOT NULL,
        impact_score INTEGER NOT NULL,
        evidence JSONB DEFAULT '{}',
        mitigation_suggestions TEXT[],
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create expert_profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS expert_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expert_type expert_type NOT NULL,
        company_name VARCHAR(200),
        license_number VARCHAR(100),
        specializations TEXT[],
        certifications TEXT[],
        years_experience INTEGER,
        verification_level VARCHAR(20) DEFAULT 'basic',
        availability_status VARCHAR(20) DEFAULT 'available',
        response_time_hours INTEGER DEFAULT 24,
        rating DECIMAL(3,2) DEFAULT 0.0,
        review_count INTEGER DEFAULT 0,
        completed_projects INTEGER DEFAULT 0,
        portfolio JSONB DEFAULT '{}',
        contact_info JSONB DEFAULT '{}',
        pricing JSONB DEFAULT '{}',
        languages TEXT[] DEFAULT '{}',
        services TEXT[] DEFAULT '{}',
        achievements TEXT[] DEFAULT '{}',
        education TEXT[] DEFAULT '{}',
        is_online BOOLEAN DEFAULT false,
        last_active TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create expert_assignments table
    await sql`
      CREATE TABLE IF NOT EXISTS expert_assignments (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES land_verification_sessions(id) ON DELETE CASCADE,
        expert_id INTEGER NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
        layer_type VARCHAR(50) NOT NULL,
        assignment_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'assigned',
        priority VARCHAR(20) DEFAULT 'medium',
        estimated_hours INTEGER,
        actual_hours INTEGER,
        hourly_rate DECIMAL(10,2),
        total_cost DECIMAL(10,2),
        assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create expert_reports table
    await sql`
      CREATE TABLE IF NOT EXISTS expert_reports (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES expert_assignments(id) ON DELETE CASCADE,
        expert_id INTEGER NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
        session_id INTEGER NOT NULL REFERENCES land_verification_sessions(id) ON DELETE CASCADE,
        report_type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        summary TEXT,
        detailed_findings TEXT,
        recommendations TEXT,
        risk_assessment JSONB DEFAULT '{}',
        supporting_documents TEXT[],
        confidence_level DECIMAL(5,2) DEFAULT 0.0,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        submitted_at TIMESTAMP,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create community_feedback table
    await sql`
      CREATE TABLE IF NOT EXISTS community_feedback (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        feedback_type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        is_verified BOOLEAN DEFAULT false,
        helpful_count INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create property_monitoring table
    await sql`
      CREATE TABLE IF NOT EXISTS property_monitoring (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        monitoring_type VARCHAR(50) NOT NULL,
        frequency VARCHAR(20) NOT NULL DEFAULT 'weekly',
        is_active BOOLEAN DEFAULT true,
        last_check TIMESTAMP,
        next_check TIMESTAMP,
        alert_thresholds JSONB DEFAULT '{}',
        notification_preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create monitoring_alerts table
    await sql`
      CREATE TABLE IF NOT EXISTS monitoring_alerts (
        id SERIAL PRIMARY KEY,
        monitoring_id INTEGER NOT NULL REFERENCES property_monitoring(id) ON DELETE CASCADE,
        alert_type VARCHAR(50) NOT NULL,
        severity risk_level NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        data JSONB DEFAULT '{}',
        is_read BOOLEAN DEFAULT false,
        is_resolved BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create statistics table
    await sql`
      CREATE TABLE IF NOT EXISTS statistics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(15,2) NOT NULL,
        metric_type VARCHAR(50) NOT NULL,
        dimensions JSONB DEFAULT '{}',
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    logger.info("Creating database indexes...", "MIGRATION");

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price)`;
    // Skip property_type index for now - will add after confirming column exists
    await sql`CREATE INDEX IF NOT EXISTS idx_properties_verification ON properties(verification_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(is_active)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_favorites_property ON favorites(property_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_property_views_property ON property_views(property_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_property_views_user ON property_views(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_property_views_created ON property_views(created_at)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_property ON transactions(property_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_land_verification_property ON land_verification_sessions(property_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_land_verification_user ON land_verification_sessions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_land_verification_status ON land_verification_sessions(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_land_verification_session_id ON land_verification_sessions(session_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_verification_layers_session ON verification_layers(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_verification_layers_type ON verification_layers(layer_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_verification_layers_status ON verification_layers(status)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_risk_factors_session ON risk_factors(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_risk_factors_layer ON risk_factors(layer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_risk_factors_severity ON risk_factors(severity)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_expert_profiles_user ON expert_profiles(user_id)`;
    // Skip expert_type index for now - will add after confirming column exists
    await sql`CREATE INDEX IF NOT EXISTS idx_expert_profiles_availability ON expert_profiles(availability_status)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_expert_assignments_session ON expert_assignments(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_expert_assignments_expert ON expert_assignments(expert_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_expert_assignments_status ON expert_assignments(status)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_expert_reports_assignment ON expert_reports(assignment_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_expert_reports_expert ON expert_reports(expert_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_expert_reports_session ON expert_reports(session_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_community_feedback_property ON community_feedback(property_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_community_feedback_user ON community_feedback(user_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_property_monitoring_property ON property_monitoring(property_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_property_monitoring_user ON property_monitoring(user_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_monitoring ON monitoring_alerts(monitoring_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON monitoring_alerts(severity)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_statistics_metric ON statistics(metric_name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_statistics_timestamp ON statistics(timestamp)`;

    logger.info("Comprehensive database schema created successfully", "MIGRATION");
    return { success: true };

  } catch (error) {
    logger.error("Failed to create comprehensive database schema", "MIGRATION", { error });
    return { success: false, error };
  }
}