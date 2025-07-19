#!/usr/bin/env tsx

/**
 * Database Fix Script
 * 
 * This script fixes database connection issues and sets up test data
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, properties, reviews } from "../shared/schema";
import type { InsertUser, InsertProperty, User } from "../shared/schema";
import bcrypt from "bcrypt";

async function fixDatabase() {
  console.log("🔧 Fixing database connection and setup...");

  // Use a local SQLite database for testing if Neon fails
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  try {
    console.log("🔗 Testing database connection...");
    const sql = neon(databaseUrl);
    const db = drizzle(sql);

    // Test connection with a simple query
    await sql`SELECT 1 as test`;
    console.log("✅ Database connection successful");

    // Clear existing data for fresh start
    try {
      await db.delete(reviews);
      await db.delete(properties);  
      await db.delete(users);
      console.log("🧹 Cleared existing data");
    } catch (error) {
      console.log("ℹ️  No existing data to clear or tables don't exist yet");
    }

    // Create test users with known credentials
    console.log("👥 Creating test users...");
    
    const testUsers = [
      { username: 'demo_user', password: 'password123' },
      { username: 'test_user', password: 'test123' },
      { username: 'admin', password: 'admin123' }
    ];

    const createdUsers: User[] = [];

    for (const userData of testUsers) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const insertedUsers = await db.insert(users).values({
          username: userData.username,
          password: hashedPassword,
          trustScore: 85,
          isVerifiedAgent: userData.username === 'admin'
        }).returning();
        
        const user = insertedUsers[0];
        if (user) {
          createdUsers.push(user);
          console.log(`✅ Created user: ${user.username}`);
        }
      } catch (error) {
        console.error(`❌ Error creating user ${userData.username}:`, error);
      }
    }

    // Create test properties
    console.log("🏠 Creating test properties...");
    
    if (createdUsers.length > 0) {
      const testProperty: InsertProperty = {
        ownerId: createdUsers[0].id,
        title: "Test Property for Upload",
        description: "This is a test property for testing document upload functionality. It has all required fields and proper validation.",
        location: "Test Location, Nairobi",
        price: 1000000,
        imageUrls: ["https://via.placeholder.com/400x300"],
        features: {
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 1000,
          parkingSpaces: 1,
          yearBuilt: 2020,
          amenities: ["Security", "Parking"],
          petFriendly: false,
          furnished: true,
          propertyType: "apartment" as const
        }
      };

      const insertedProperties = await db.insert(properties).values(testProperty).returning();
      const property = insertedProperties[0];
      
      if (property) {
        console.log(`✅ Created test property: ${property.title} (ID: ${property.id})`);
      }
    }

    console.log("\n🎉 Database setup completed successfully!");
    console.log("\n🔐 Test Login Credentials:");
    console.log("Username: demo_user, Password: password123");
    console.log("Username: test_user, Password: test123");
    console.log("Username: admin, Password: admin123");
    console.log("\n🧪 Test these credentials at: http://localhost:5000/auth/login");

  } catch (error) {
    console.error("❌ Database setup failed:", error);
    
    if (error instanceof Error && error.message.includes('fetch failed')) {
      console.log("\n💡 Database connection failed. This could be due to:");
      console.log("1. Network connectivity issues");
      console.log("2. Invalid DATABASE_URL");
      console.log("3. Database server is down");
      console.log("\nTry running the app anyway - it may work with mock data.");
    }
    
    process.exit(1);
  }
}

// Run the fix
fixDatabase().catch(console.error);