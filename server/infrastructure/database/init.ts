/**
 * Database Initialization Script
 * Ensures proper database setup and integration between frontend and backend
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../../src/shared/schema";

// Database connection configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/triplecheck';

// Determine SSL configuration based on the database URL and environment
const shouldUseSSL = () => {
  // If DATABASE_URL contains cloud providers, use SSL
  if (DATABASE_URL.includes('neon.tech') || 
      DATABASE_URL.includes('supabase.co') || 
      DATABASE_URL.includes('amazonaws.com') ||
      DATABASE_URL.includes('railway.app') ||
      process.env.NODE_ENV === 'production') {
    return 'require';
  }
  // For localhost connections, don't use SSL
  if (DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1')) {
    return false;
  }
  // Default to SSL for unknown remote connections
  return 'require';
};

const connectionConfig = {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  prepare: false,
  ssl: shouldUseSSL(),
  // Add additional options for better connection handling
  transform: {
    undefined: null,
  },
  connection: {
    application_name: 'triplecheck_api',
  },
};

let sql: postgres.Sql | undefined;
let db: ReturnType<typeof drizzle> | undefined;

export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database connection...');
    console.log(`📍 Database URL: ${DATABASE_URL.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials
    console.log(`🔒 SSL Mode: ${connectionConfig.ssl}`);
    
    sql = postgres(DATABASE_URL, connectionConfig);
    db = drizzle(sql, { schema });

    // Test connection with timeout
    console.log('🔍 Testing database connection...');
    await Promise.race([
      sql`SELECT 1 as test`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]);
    
    console.log('✅ Database connection established');
    
    // Ensure tables exist
    await ensureTablesExist();
    
    // Seed with basic data if empty
    await seedBasicData();
    
    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    
    // If it's an SSL error and we're in development, try without SSL
    if (error instanceof Error && 
        error.message.includes('insecure') && 
        process.env.NODE_ENV !== 'production') {
      
      console.log('🔄 Retrying without SSL for development...');
      try {
        const noSSLConfig = { ...connectionConfig, ssl: false };
        sql = postgres(DATABASE_URL, noSSLConfig);
        db = drizzle(sql, { schema });
        
        await sql`SELECT 1 as test`;
        console.log('✅ Database connected without SSL');
        
        await ensureTablesExist();
        await seedBasicData();
        
        return { success: true };
      } catch (retryError) {
        console.error('❌ Retry failed:', retryError);
        return { success: false, error: retryError };
      }
    }
    
    return { success: false, error };
  }
}

async function ensureTablesExist() {
  if (!sql) throw new Error('Database not initialized');
  
  try {
    // Check if users table exists
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    if (!tablesExist[0]?.exists) {
      console.log('📋 Creating database tables...');
      
      // Create basic tables if they don't exist
      await sql`
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
      `;
      
      await sql`
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
      `;
      
      await sql`
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
      `;
      
      // Create indexes for better performance
      await sql`CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(verification_status);`;
      
      console.log('✅ Database tables created');
    }
  } catch (error) {
    console.error('❌ Error ensuring tables exist:', error);
    throw error;
  }
}

async function seedBasicData() {
  if (!sql) throw new Error('Database not initialized');
  
  try {
    // Check if we already have data
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    if (Number(userCount[0]?.count) > 0) {
      console.log('📊 Database already has data, skipping seed');
      return;
    }
    
    console.log('🌱 Seeding basic data...');
    
    // Create demo users
    const bcrypt = await import('bcrypt');
    const demoPassword = await bcrypt.hash('demo123', 10);
    
    await sql`
      INSERT INTO users (username, email, password, role, trust_score, is_verified_agent, first_name, last_name)
      VALUES 
        ('demo_user', 'demo@example.com', ${demoPassword}, 'user', 750, false, 'Demo', 'User'),
        ('demo_agent', 'agent@example.com', ${demoPassword}, 'agent', 950, true, 'Demo', 'Agent'),
        ('john_doe', 'john@example.com', ${demoPassword}, 'user', 800, false, 'John', 'Doe')
    `;
    
    // Create sample properties
    await sql`
      INSERT INTO properties (
        owner_id, title, description, price, location, 
        image_urls, verification_status, features
      )
      VALUES 
        (
          2, 
          'Modern 3-Bedroom Apartment in Westlands',
          'Beautiful modern apartment with stunning city views and premium amenities. Features spacious rooms, modern kitchen, and excellent security.',
          15000000,
          'Westlands, Nairobi',
          '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"]',
          'verified',
          '{"bedrooms": 3, "bathrooms": 2, "squareFeet": 1200, "propertyType": "apartment", "amenities": ["Swimming Pool", "Gym", "Security"]}'
        ),
        (
          2,
          'Luxury Villa in Karen', 
          'Spacious family home with beautiful gardens and modern fixtures. Perfect for families seeking comfort and elegance.',
          45000000,
          'Karen, Nairobi',
          '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"]',
          'verified',
          '{"bedrooms": 5, "bathrooms": 4, "squareFeet": 3500, "propertyType": "house", "amenities": ["Swimming Pool", "Garden", "Staff Quarters"]}'
        ),
        (
          3,
          'Cozy 2-Bedroom in Kilimani',
          'Perfect starter home in the heart of Kilimani. Close to amenities and transport links.',
          25000000,
          'Kilimani, Nairobi', 
          '["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800"]',
          'pending',
          '{"bedrooms": 2, "bathrooms": 2, "squareFeet": 900, "propertyType": "apartment", "amenities": ["Security", "Parking"]}'
        )
    `;
    
    console.log('✅ Basic data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding basic data:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Fallback function for when database is not available
export function isDatabaseAvailable(): boolean {
  return db !== undefined && sql !== undefined;
}

export function getSqlInstance() {
  if (!sql) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return sql;
}

export async function closeDatabaseConnection() {
  if (sql) {
    await sql.end();
    sql = undefined;
    db = undefined;
    console.log('🔌 Database connection closed');
  }
}

// Export the database instance for use in repositories
export { db };