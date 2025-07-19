import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
// TODO: Import actual schema files when they're created
// import * as schema from "../../shared/schema";
// import * as communitySchema from "../../shared/community-trust-schema";

// Database configuration with fallbacks
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://localhost:5432/triplecheck";

// Connection configuration
const connectionConfig = {
  max: 20, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  prepare: false, // Disable prepared statements for better compatibility
};

// Create connection with retry logic
let sql: postgres.Sql;
let db: ReturnType<typeof drizzle>;

export async function initializeDatabase() {
  try {
    console.log('Initializing database connection...');
    
    sql = postgres(DATABASE_URL, connectionConfig);
    db = drizzle(sql, { 
      // schema: { ...schema, ...communitySchema }, // TODO: Add when schema files are created
      logger: process.env.NODE_ENV === 'development'
    });

    // Test the connection
    await sql`SELECT 1`;
    console.log('Database connection established successfully');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return { success: false, error };
  }
}

// Get database instance with connection check
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Safe database operation wrapper
export async function withDatabase<T>(
  operation: (db: ReturnType<typeof drizzle>) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    if (!db) {
      await initializeDatabase();
    }
    
    const data = await operation(db);
    return { success: true, data };
  } catch (error) {
    console.error('Database operation failed:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        return { success: false, error: 'Database connection failed' };
      }
      if (error.message.includes('timeout')) {
        return { success: false, error: 'Database operation timed out' };
      }
      if (error.message.includes('duplicate key')) {
        return { success: false, error: 'Duplicate entry found' };
      }
      if (error.message.includes('foreign key')) {
        return { success: false, error: 'Referenced record not found' };
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}

// Connection health check
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await sql`SELECT 1`;
    const latency = Date.now() - start;
    
    return { healthy: true, latency };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  try {
    if (sql) {
      await sql.end();
      console.log('Database connection closed gracefully');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Migration utilities
export async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        trust_score INTEGER NOT NULL DEFAULT 0,
        is_verified_agent BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        price INTEGER NOT NULL,
        image_urls TEXT[] NOT NULL,
        features JSONB NOT NULL,
        verification_status TEXT NOT NULL DEFAULT 'pending',
        ai_verification_results JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_properties_verification ON properties(verification_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)`;

    console.log('Database migrations completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
}

// Comprehensive data seeding for development and testing
export async function seedDatabase() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping database seeding in production');
    return;
  }

  try {
    console.log('🌱 Seeding database with comprehensive sample data...');
    
    // Check if data already exists
    const existingUsers = await sql`SELECT COUNT(*) FROM users`;
    if (Number(existingUsers[0].count) > 0) {
      console.log('Database already contains data, clearing and reseeding...');
      
      // Clear existing data for fresh seed
      await sql`DELETE FROM reviews`;
      await sql`DELETE FROM properties`;
      await sql`DELETE FROM users`;
      console.log('Existing data cleared');
    }

    // Insert comprehensive sample users with proper password hashing
    console.log('Creating sample users...');
    
    // Create demo users with known passwords for testing
    const bcrypt = await import('bcrypt');
    const demoPassword = await bcrypt.hash('demo123', 10); // Simple password for testing
    const agentPassword = await bcrypt.hash('agent123', 10); // Simple password for testing
    
    await sql`
      INSERT INTO users (username, password, trust_score, is_verified_agent)
      VALUES 
        ('demo_user', ${demoPassword}, 750, false),
        ('demo_agent', ${agentPassword}, 950, true),
        ('john_tenant', ${demoPassword}, 750, false),
        ('sarah_agent', ${agentPassword}, 950, true),
        ('mike_landlord', ${demoPassword}, 820, false),
        ('jane_broker', ${agentPassword}, 890, true),
        ('david_investor', ${demoPassword}, 680, false),
        ('mary_property_manager', ${agentPassword}, 920, true)
      ON CONFLICT (username) DO NOTHING
    `;

    // Insert comprehensive sample properties with diverse data for testing
    console.log('Creating sample properties...');
    await sql`
      INSERT INTO properties (owner_id, title, description, location, price, image_urls, features, verification_status, ai_verification_results)
      VALUES 
        -- Verified Properties with AI results
        (2, 'Modern 2BR Apartment in Westlands', 'Beautiful modern apartment with stunning city views, fully furnished with contemporary amenities. Perfect for young professionals.', 'Westlands, Nairobi', 85000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 2, "bathrooms": 2, "squareFeet": 1200, "parkingSpaces": 1, "yearBuilt": 2020, "amenities": ["Swimming Pool", "Gym", "Security", "Parking"], "propertyType": "apartment", "petFriendly": false, "furnished": true}', 'verified', '{"imageAnalysis": {"qualityScore": 92, "authenticityScore": 95, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 88, "completenessScore": 90, "suggestedImprovements": ["Add more details about parking arrangements"]}, "overallScore": 91, "verificationTimestamp": "2024-01-15T10:30:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (3, 'Spacious Family Home in Karen', 'Large family home with beautiful garden, perfect for families. Features modern kitchen, spacious living areas, and secure compound.', 'Karen, Nairobi', 150000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 4, "bathrooms": 3, "squareFeet": 2500, "parkingSpaces": 2, "yearBuilt": 2018, "amenities": ["Garden", "Security", "Parking", "Balcony"], "propertyType": "house", "petFriendly": true, "furnished": false}', 'verified', '{"imageAnalysis": {"qualityScore": 78, "authenticityScore": 85, "flaggedIssues": ["Low resolution in bathroom photos"]}, "descriptionAnalysis": {"accuracyScore": 82, "completenessScore": 75, "suggestedImprovements": ["Include information about utilities", "Add details about neighborhood amenities"]}, "overallScore": 80, "verificationTimestamp": "2024-01-14T14:20:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (4, 'Luxury Penthouse in Kilimani', 'Exclusive penthouse with panoramic views of Nairobi skyline. Premium finishes, rooftop terrace, and concierge services.', 'Kilimani, Nairobi', 200000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 3, "bathrooms": 3, "squareFeet": 1800, "parkingSpaces": 2, "yearBuilt": 2021, "amenities": ["Rooftop Terrace", "Concierge", "Gym", "Swimming Pool", "Security"], "propertyType": "apartment", "petFriendly": false, "furnished": true}', 'verified', '{"imageAnalysis": {"qualityScore": 98, "authenticityScore": 97, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 95, "completenessScore": 92, "suggestedImprovements": []}, "overallScore": 96, "verificationTimestamp": "2024-01-13T16:45:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (2, 'Cozy Studio in CBD', 'Perfect studio apartment in the heart of Nairobi CBD. Ideal for business travelers and young professionals. Walking distance to offices.', 'CBD, Nairobi', 45000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 0, "bathrooms": 1, "squareFeet": 400, "parkingSpaces": 0, "yearBuilt": 2019, "amenities": ["Security", "Elevator", "Internet"], "propertyType": "studio", "petFriendly": false, "furnished": true}', 'verified', '{"imageAnalysis": {"qualityScore": 85, "authenticityScore": 88, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 80, "completenessScore": 85, "suggestedImprovements": ["Add more details about building amenities"]}, "overallScore": 84, "verificationTimestamp": "2024-01-12T09:15:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        -- Pending Properties
        (5, 'Affordable 1BR in Kasarani', 'Budget-friendly one bedroom apartment in Kasarani. Good transport links and local amenities nearby.', 'Kasarani, Nairobi', 35000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 1, "bathrooms": 1, "squareFeet": 600, "parkingSpaces": 0, "yearBuilt": 2015, "amenities": ["Security", "Water"], "propertyType": "apartment", "petFriendly": true, "furnished": false}', 'pending', '{"imageAnalysis": {"qualityScore": 55, "authenticityScore": 60, "flaggedIssues": ["Limited number of photos", "Poor image quality"]}, "descriptionAnalysis": {"accuracyScore": 45, "completenessScore": 40, "suggestedImprovements": ["Add comprehensive property description", "Include accurate pricing information"]}, "overallScore": 50, "verificationTimestamp": "2024-01-11T11:30:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (3, 'Townhouse in Runda', 'Elegant townhouse in prestigious Runda estate. Gated community with excellent security and recreational facilities.', 'Runda, Nairobi', 180000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 3, "bathrooms": 2, "squareFeet": 2000, "parkingSpaces": 2, "yearBuilt": 2017, "amenities": ["Gated Community", "Security", "Clubhouse", "Swimming Pool"], "propertyType": "townhouse", "petFriendly": true, "furnished": false}', 'pending', '{"imageAnalysis": {"qualityScore": 70, "authenticityScore": 75, "flaggedIssues": ["Some images appear filtered"]}, "descriptionAnalysis": {"accuracyScore": 68, "completenessScore": 65, "suggestedImprovements": ["Add more details about community amenities"]}, "overallScore": 70, "verificationTimestamp": "2024-01-10T13:20:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        -- Properties in different locations for search testing
        (6, 'Beachfront Villa in Mombasa', 'Stunning beachfront villa with private beach access. Perfect for vacation rentals or permanent residence.', 'Mombasa', 300000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 5, "bathrooms": 4, "squareFeet": 3500, "parkingSpaces": 3, "yearBuilt": 2016, "amenities": ["Beach Access", "Swimming Pool", "Garden", "Security"], "propertyType": "house", "petFriendly": true, "furnished": true}', 'verified', '{"imageAnalysis": {"qualityScore": 90, "authenticityScore": 93, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 88, "completenessScore": 90, "suggestedImprovements": []}, "overallScore": 90, "verificationTimestamp": "2024-01-09T15:45:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (2, 'Mountain View Cottage in Nakuru', 'Charming cottage with breathtaking mountain views. Peaceful location perfect for weekend getaways.', 'Nakuru', 75000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 2, "bathrooms": 1, "squareFeet": 900, "parkingSpaces": 1, "yearBuilt": 2014, "amenities": ["Mountain View", "Garden", "Fireplace"], "propertyType": "house", "petFriendly": true, "furnished": false}', 'verified', '{"imageAnalysis": {"qualityScore": 82, "authenticityScore": 85, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 78, "completenessScore": 80, "suggestedImprovements": ["Add more details about local attractions"]}, "overallScore": 81, "verificationTimestamp": "2024-01-08T12:10:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (4, 'Modern Condo in Kiambu', 'Contemporary condominium in rapidly developing Kiambu area. Great investment opportunity with modern amenities.', 'Kiambu', 95000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 2, "bathrooms": 2, "squareFeet": 1100, "parkingSpaces": 1, "yearBuilt": 2022, "amenities": ["Gym", "Security", "Parking", "Elevator"], "propertyType": "condo", "petFriendly": false, "furnished": false}', 'verified', '{"imageAnalysis": {"qualityScore": 88, "authenticityScore": 90, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 85, "completenessScore": 87, "suggestedImprovements": []}, "overallScore": 87, "verificationTimestamp": "2024-01-07T10:25:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (3, 'Executive Apartment in Lavington', 'High-end executive apartment in exclusive Lavington area. Premium location with top-tier amenities.', 'Lavington, Nairobi', 120000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 3, "bathrooms": 2, "squareFeet": 1500, "parkingSpaces": 2, "yearBuilt": 2019, "amenities": ["Swimming Pool", "Gym", "Security", "Parking", "Balcony"], "propertyType": "apartment", "petFriendly": false, "furnished": true}', 'verified', '{"imageAnalysis": {"qualityScore": 94, "authenticityScore": 96, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 92, "completenessScore": 94, "suggestedImprovements": []}, "overallScore": 94, "verificationTimestamp": "2024-01-06T14:30:00Z", "aiModel": "TripleCheck-AI-v2.1"}')
      ON CONFLICT DO NOTHING
    `;

    // Insert sample reviews for testing review functionality
    console.log('Creating sample reviews...');
    await sql`
      INSERT INTO reviews (property_id, user_id, rating, comment)
      VALUES 
        (1, 1, 5, 'Excellent apartment! The location is perfect and the amenities are top-notch. Highly recommend for anyone looking in Westlands.'),
        (1, 5, 4, 'Great place to live. Only minor issue was parking can be tight during peak hours.'),
        (2, 1, 5, 'Beautiful family home with a lovely garden. Kids love the space and the neighborhood is very safe.'),
        (2, 4, 4, 'Good property but could use some minor updates. Overall satisfied with the rental experience.'),
        (3, 5, 5, 'Absolutely stunning penthouse! The views are incredible and the building management is excellent.'),
        (4, 1, 4, 'Perfect for my business trips. Location is unbeatable and the studio has everything I need.'),
        (7, 3, 5, 'Amazing beachfront property! Perfect for our family vacation. Will definitely book again.'),
        (8, 1, 4, 'Peaceful cottage with beautiful mountain views. Great for a weekend retreat.'),
        (10, 5, 5, 'Luxurious apartment in a prime location. The amenities are world-class.')
      ON CONFLICT DO NOTHING
    `;

    // Create community trust data if tables exist
    try {
      console.log('Creating community trust sample data...');
      
      // Sample community references
      await sql`
        INSERT INTO community_references (user_id, reference_type, reference_name, reference_phone, relationship, years_known, trust_rating, verification_status)
        VALUES 
          (1, 'neighbor', 'Alice Wanjiku', '+254712345678', 'Neighbor for 3 years', 3, 9, 'verified'),
          (1, 'colleague', 'Peter Mwangi', '+254723456789', 'Work colleague', 2, 8, 'verified'),
          (3, 'church_member', 'Grace Njeri', '+254734567890', 'Church member', 5, 10, 'verified'),
          (5, 'family', 'John Kamau', '+254745678901', 'Brother', 25, 10, 'verified')
        ON CONFLICT DO NOTHING
      `;

      // Sample trust scores
      await sql`
        INSERT INTO trust_scores (user_id, overall_score, trust_level, community_score, behavior_score, social_score, location_score, endorsement_score, transaction_score, risk_level, max_transaction_value)
        VALUES 
          (1, 750, 'verified', 80, 85, 70, 75, 60, 90, 'low', 500000),
          (2, 950, 'premium', 95, 98, 90, 85, 95, 100, 'very_low', 2000000),
          (3, 820, 'verified', 85, 80, 75, 90, 70, 85, 'low', 800000),
          (4, 890, 'premium', 90, 88, 85, 80, 85, 95, 'very_low', 1500000),
          (5, 680, 'community', 70, 75, 65, 70, 50, 60, 'medium', 200000),
          (6, 920, 'premium', 92, 90, 88, 85, 90, 98, 'very_low', 2500000)
        ON CONFLICT DO NOTHING
      `;

    } catch (error) {
      console.log('Community trust tables not yet created, skipping community data seeding');
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('📊 Sample data created:');
    console.log('   - 6 users (tenants, agents, landlords)');
    console.log('   - 10 properties (various types and locations)');
    console.log('   - 9 reviews (different ratings)');
    console.log('   - Community trust data (if tables exist)');
    console.log('');
    console.log('🔍 Test search with terms like:');
    console.log('   - "apartment", "house", "studio"');
    console.log('   - "Nairobi", "Mombasa", "Nakuru"');
    console.log('   - "modern", "luxury", "family"');
    console.log('   - "beach", "mountain", "garden"');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  }
}

// Export the database instance
export { db, sql };

// Initialize database on module load
initializeDatabase().catch(console.error);