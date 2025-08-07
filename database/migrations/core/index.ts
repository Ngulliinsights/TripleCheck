/**
 * Core Database Migrations
 * 
 * Contains migrations for core entities: users, properties, reviews, etc.
 */

import { Migration } from '../index';

export const migrations: Migration[] = [
  {
    id: '001_initial_schema',
    name: 'Create initial schema',
    version: '1.0.0',
    dependencies: [],
    createdAt: new Date('2024-01-01'),
    checksum: 'initial_schema_checksum',
    up: `
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        trust_score INTEGER DEFAULT 50,
        is_verified_agent BOOLEAN DEFAULT false,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        profile_image_url VARCHAR(500),
        bio TEXT,
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP,
        email_verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create properties table
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        location VARCHAR(255) NOT NULL,
        address TEXT,
        coordinates JSONB,
        image_urls JSONB DEFAULT '[]',
        verification_status VARCHAR(20) DEFAULT 'pending',
        features JSONB,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ai_verification_results JSONB,
        view_count INTEGER DEFAULT 0,
        favorite_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        available_from TIMESTAMP,
        available_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create reviews table
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        verified BOOLEAN DEFAULT false,
        helpful_count INTEGER DEFAULT 0,
        report_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, property_id)
      );

      -- Create favorites table
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, property_id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
      CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
      CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
      CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(verification_status);
      CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_property ON favorites(property_id);
    `,
    down: `
      -- Drop tables in reverse order
      DROP TABLE IF EXISTS favorites;
      DROP TABLE IF EXISTS reviews;
      DROP TABLE IF EXISTS properties;
      DROP TABLE IF EXISTS users;
    `
  }
];