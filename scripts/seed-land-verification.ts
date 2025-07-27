#!/usr/bin/env tsx
// Land Verification System Seeding Script
// This script populates the land verification tables with test data

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// Load environment variables from .env file
config();

async function seedLandVerificationData() {
  console.log("🌱 Starting Land Verification System seeding...");

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    console.log("Please set your DATABASE_URL in the .env file");
    process.exit(1);
  }

  try {
    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    console.log("✅ Database connection established");

    // First, let's check if we have the basic tables (users and properties)
    console.log("📋 Checking existing data...");
    
    try {
      const existingUsers = await sql`SELECT COUNT(*) as count FROM users`;
      const existingProperties = await sql`SELECT COUNT(*) as count FROM properties`;
      
      console.log(`ℹ️  Found ${existingUsers[0].count} users and ${existingProperties[0].count} properties`);
      
      if (existingUsers[0].count === 0 || existingProperties[0].count === 0) {
        console.log("⚠️  No users or properties found. Running basic setup first...");
        
        // Create some basic users and properties if they don't exist
        await sql`
          INSERT INTO users (username, email, password, role, trust_score, first_name, last_name)
          VALUES 
            ('demo_user', 'demo@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'user', 75, 'Demo', 'User'),
            ('property_owner', 'owner@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'user', 85, 'Property', 'Owner'),
            ('agent_smith', 'agent@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'agent', 90, 'Agent', 'Smith')
          ON CONFLICT (username) DO NOTHING
        `;
        
        await sql`
          INSERT INTO properties (title, description, price, location, owner_id, verification_status, features, image_urls)
          VALUES 
            ('Modern Apartment in Kilimani', 'Luxurious 3-bedroom apartment with amazing city views', 25000000, 'Kilimani, Nairobi', 1, 'pending', '{"bedrooms": 3, "bathrooms": 2, "propertyType": "apartment"}', '["https://images.unsplash.com/photo-1580041065738-e72023775cdc"]'),
            ('Family Home in Karen', 'Spacious 4-bedroom house with large garden', 45000000, 'Karen, Nairobi', 2, 'verified', '{"bedrooms": 4, "bathrooms": 3, "propertyType": "house"}', '["https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83"]'),
            ('Executive Office in Westlands', 'Premium office space in business district', 35000000, 'Westlands, Nairobi', 1, 'pending', '{"bedrooms": 0, "bathrooms": 2, "propertyType": "commercial"}', '["https://images.unsplash.com/photo-1497366216548-37526070297c"]')
          ON CONFLICT DO NOTHING
        `;
        
        console.log("✅ Created basic users and properties");
      }
    } catch (error) {
      console.log("ℹ️  Basic tables might not exist yet, continuing with land verification setup...");
    }

    // Now let's check if land verification tables exist and create sample data
    console.log("📝 Checking land verification tables...");
    
    try {
      // Check if land verification tables exist
      const tableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('land_verification_sessions', 'verification_layers', 'risk_factors')
      `;
      
      if (tableCheck.length === 0) {
        console.log("⚠️  Land verification tables don't exist. Please run the migration first.");
        console.log("Run: tsx scripts/migrate-land-verification.ts");
        return;
      }
      
      console.log(`✅ Found ${tableCheck.length} land verification tables`);
      
      // Check if we already have land verification data
      const existingSessions = await sql`SELECT COUNT(*) as count FROM land_verification_sessions`;
      
      if (existingSessions[0].count > 0) {
        console.log("ℹ️  Land verification data already exists, skipping seeding");
        return;
      }
      
      console.log("🌱 Creating sample land verification data...");
      
      // Get actual property and user IDs from the database
      const properties = await sql`SELECT id FROM properties LIMIT 3`;
      const users = await sql`SELECT id FROM users LIMIT 3`;
      
      if (properties.length < 3 || users.length < 3) {
        console.log("⚠️  Not enough properties or users found. Need at least 3 of each.");
        return;
      }
      
      console.log(`ℹ️  Using properties: ${properties.map(p => p.id).join(', ')}`);
      console.log(`ℹ️  Using users: ${users.map(u => u.id).join(', ')}`);
      
      // Create sample verification sessions
      const sessions = await sql`
        INSERT INTO land_verification_sessions (property_id, user_id, status, current_layer, overall_risk_score, risk_level, confidence, monitoring_enabled)
        VALUES 
          (${properties[0].id}, ${users[0].id}, 'in_progress', 'registry', 35, 'medium', 0.75, true),
          (${properties[1].id}, ${users[1].id}, 'completed', NULL, 15, 'low', 0.92, true),
          (${properties[2].id}, ${users[0].id}, 'in_progress', 'community', 65, 'high', 0.68, false)
        RETURNING id
      `;
      
      console.log(`✅ Created ${sessions.length} verification sessions`);
      
      // Create sample verification layers
      await sql`
        INSERT INTO verification_layers (session_id, layer_type, status, estimated_duration, results, notes)
        VALUES 
          (${sessions[0].id}, 'registry', 'completed', 8, '{"titleVerified": true, "ownershipChainComplete": true}', 'Registry search completed successfully'),
          (${sessions[0].id}, 'physical', 'in_progress', 12, '{"boundariesSurveyed": 75, "beaconsVerified": 8}', 'Physical survey in progress'),
          (${sessions[1].id}, 'registry', 'completed', 8, '{"titleVerified": true, "ownershipChainComplete": true}', 'Clean title verification'),
          (${sessions[1].id}, 'physical', 'completed', 10, '{"boundariesSurveyed": 100, "beaconsVerified": 12}', 'All boundaries verified'),
          (${sessions[1].id}, 'community', 'completed', 12, '{"interviewsCompleted": 8, "consensusLevel": 95}', 'Strong community consensus')
      `;
      
      console.log("✅ Created verification layers");
      
      // Create sample risk factors
      await sql`
        INSERT INTO risk_factors (session_id, category, severity, confidence, description, evidence, impact, likelihood, mitigation, source_layer, is_active)
        VALUES 
          (${sessions[0].id}, 'physical', 'medium', 0.80, 'Minor boundary discrepancy on eastern border', '["Survey measurements show 2.3m difference"]', 'Could affect property size calculation', 0.65, '["Conduct detailed resurvey"]', 'physical', true),
          (${sessions[0].id}, 'ownership', 'low', 0.70, 'Outstanding mortgage registered against property', '["Mortgage instrument registered"]', 'Must be cleared before transfer', 0.90, '["Verify mortgage balance"]', 'registry', true),
          (${sessions[2].id}, 'ownership', 'high', 0.85, 'Rapid ownership transfers raise suspicion', '["Property sold 3 times in 18 months"]', 'Potential land grabbing scheme', 0.75, '["Investigate each transfer"]', 'registry', true)
      `;
      
      console.log("✅ Created risk factors");
      
      // Create sample expert assignments
      await sql`
        INSERT INTO expert_assignments (session_id, expert_type, expert_name, expert_credentials, contact_info, specialization, status, cost)
        VALUES 
          (${sessions[0].id}, 'surveyor', 'David Mutua', 'Licensed Land Surveyor (LSK/2018/0234)', '+254 722 123 456', 'Boundary surveys', 'in_progress', 45000.00),
          (${sessions[1].id}, 'surveyor', 'Sarah Wanjiku', 'Licensed Land Surveyor (LSK/2020/0156)', '+254 733 987 654', 'Residential surveys', 'completed', 38000.00),
          (${sessions[2].id}, 'lawyer', 'Advocate Peter Ochieng', 'Advocate of the High Court (LSK/A/2015/0892)', '+254 711 555 777', 'Property law', 'assigned', 75000.00)
      `;
      
      console.log("✅ Created expert assignments");
      
      // Create sample property monitoring
      await sql`
        INSERT INTO property_monitoring (property_id, session_id, user_id, monitoring_type, frequency, alerts_generated, is_active, configuration)
        VALUES 
          (${properties[0].id}, ${sessions[0].id}, ${users[0].id}, 'government_changes', 'monthly', 1, true, '{"checkRoadPlans": true, "alertThreshold": "medium"}'),
          (${properties[1].id}, ${sessions[1].id}, ${users[1].id}, 'legal_disputes', 'weekly', 0, true, '{"checkCourtFilings": true, "alertThreshold": "low"}')
      `;
      
      console.log("✅ Created property monitoring");
      
      console.log("🎉 Land verification seeding completed successfully!");
      console.log("\n📊 Summary:");
      console.log(`- Created ${sessions.length} verification sessions`);
      console.log("- Created 5 verification layers");
      console.log("- Created 3 risk factors");
      console.log("- Created 3 expert assignments");
      console.log("- Created 2 monitoring configurations");
      console.log("\n✅ Sample data is ready for testing!");
      
    } catch (error) {
      console.error("❌ Error during seeding:", error);
      throw error;
    }

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run the seeding
seedLandVerificationData()
  .then(() => {
    console.log('✨ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });