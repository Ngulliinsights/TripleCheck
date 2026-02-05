/**
 * Reset and Create Database Migration
 * Drops existing tables and creates fresh schema
 */

import { logger } from "..\..\..\monitoring\logger";

export async function resetAndCreateTables(sql: any) {
  try {
    logger.info("Resetting and creating database tables...", "MIGRATION");

    // Drop existing tables in correct order (reverse dependency order)
    await sql`DROP TABLE IF EXISTS verification_layers CASCADE`;
    await sql`DROP TABLE IF EXISTS land_verification_sessions CASCADE`;
    await sql`DROP TABLE IF EXISTS favorites CASCADE`;
    await sql`DROP TABLE IF EXISTS reviews CASCADE`;
    await sql`DROP TABLE IF EXISTS properties CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    // Drop existing types
    await sql`DROP TYPE IF EXISTS risk_level CASCADE`;
    await sql`DROP TYPE IF EXISTS land_verification_status CASCADE`;
    await sql`DROP TYPE IF EXISTS property_type CASCADE`;
    await sql`DROP TYPE IF EXISTS user_role CASCADE`;
    await sql`DROP TYPE IF EXISTS verification_status CASCADE`;

    logger.info("Dropped existing tables and types", "MIGRATION");

    // Create enums
    await sql`CREATE TYPE verification_status AS ENUM ('verified', 'pending', 'unverified', 'draft')`;
    await sql`CREATE TYPE user_role AS ENUM ('user', 'agent', 'admin')`;
    await sql`CREATE TYPE property_type AS ENUM ('apartment', 'house', 'condo', 'townhouse', 'studio', 'commercial', 'land')`;
    await sql`CREATE TYPE land_verification_status AS ENUM ('not_started', 'in_progress', 'completed', 'suspended', 'failed')`;
    await sql`CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical')`;

    logger.info("Created database enums", "MIGRATION");

    // Create users table
    await sql`
      CREATE TABLE users (
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
      CREATE TABLE properties (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(255) NOT NULL,
        address TEXT,
        price DECIMAL(15,2) NOT NULL,
        property_type property_type NOT NULL DEFAULT 'apartment',
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
      CREATE TABLE reviews (
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
      CREATE TABLE favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, property_id)
      )
    `;

    // Create land_verification_sessions table
    await sql`
      CREATE TABLE land_verification_sessions (
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
        confidence DECIMAL(5,2) DEFAULT 0.0,
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
      CREATE TABLE verification_layers (
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

    logger.info("Created database tables", "MIGRATION");

    // Create indexes
    await sql`CREATE INDEX idx_users_email ON users(email)`;
    await sql`CREATE INDEX idx_users_username ON users(username)`;
    await sql`CREATE INDEX idx_users_role ON users(role)`;
    
    await sql`CREATE INDEX idx_properties_owner ON properties(owner_id)`;
    await sql`CREATE INDEX idx_properties_location ON properties(location)`;
    await sql`CREATE INDEX idx_properties_price ON properties(price)`;
    await sql`CREATE INDEX idx_properties_type ON properties(property_type)`;
    await sql`CREATE INDEX idx_properties_verification ON properties(verification_status)`;
    await sql`CREATE INDEX idx_properties_active ON properties(is_active)`;
    await sql`CREATE INDEX idx_properties_created ON properties(created_at)`;
    
    await sql`CREATE INDEX idx_reviews_property ON reviews(property_id)`;
    await sql`CREATE INDEX idx_reviews_user ON reviews(user_id)`;
    await sql`CREATE INDEX idx_reviews_rating ON reviews(rating)`;
    await sql`CREATE INDEX idx_reviews_created ON reviews(created_at)`;
    
    await sql`CREATE INDEX idx_favorites_user ON favorites(user_id)`;
    await sql`CREATE INDEX idx_favorites_property ON favorites(property_id)`;
    
    await sql`CREATE INDEX idx_land_verification_property ON land_verification_sessions(property_id)`;
    await sql`CREATE INDEX idx_land_verification_user ON land_verification_sessions(user_id)`;
    await sql`CREATE INDEX idx_land_verification_status ON land_verification_sessions(status)`;
    await sql`CREATE INDEX idx_land_verification_session_id ON land_verification_sessions(session_id)`;
    
    await sql`CREATE INDEX idx_verification_layers_session ON verification_layers(session_id)`;
    await sql`CREATE INDEX idx_verification_layers_type ON verification_layers(layer_type)`;
    await sql`CREATE INDEX idx_verification_layers_status ON verification_layers(status)`;

    logger.info("Created database indexes", "MIGRATION");

    logger.info("Database reset and creation completed successfully", "MIGRATION");
    return { success: true };

  } catch (error) {
    logger.error("Failed to reset and create database", "MIGRATION", { error });
    return { success: false, error };
  }
}