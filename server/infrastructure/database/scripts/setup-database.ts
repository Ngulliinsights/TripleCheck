#!/usr/bin/env tsx

/**
 * Database Setup Script
 * 
 * This script sets up the database tables and initial data for the TripleCheck platform.
 * Run this script to initialize your database after setting up the DATABASE_URL.
 */

import { neon } from "@neondatabase/serverless";
import bcrypt from "..\..\..\..\scripts\cleanup-redundancies";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

import { users, properties, reviews } from "..\schemas\core\index";
import type { InsertUser, InsertProperty, User } from "../src/shared/schema";


async function setupDatabase() {
  console.log("🚀 Starting database setup...");

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

    // Run migrations (if any exist)
    try {
      await migrate(db, { migrationsFolder: "./migrations" });
      console.log("✅ Database migrations completed");
    } catch (error) {
      console.log("ℹ️  No migrations found or already applied");
    }

    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("ℹ️  Database already has data, skipping initialization");
      return;
    }

    console.log("📝 Creating initial users...");

    // Create sample users with hashed passwords
    const defaultPassword = process.env.DEFAULT_SETUP_PASSWORD || 'password123';
    const sampleUsers: InsertUser[] = [
      { username: 'demo_user', password: defaultPassword },
      { username: 'property_owner', password: process.env.PROPERTY_OWNER_PASSWORD || 'secure456' },
      { username: 'agent_smith', password: process.env.AGENT_PASSWORD || 'agent789' }
    ];

    // Use explicit typing for the created users array
    const createdUsers: User[] = [];
    
    for (const userData of sampleUsers) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        // Create user with explicit type assertion for the returned array
        const insertedUsers = await db.insert(users).values({
          ...userData,
          password: hashedPassword
        }).returning();
        
        // TypeScript now knows this is a User object
        const user = insertedUsers[0];
        if (user) {
          createdUsers.push(user);
          console.log(`✅ Created user: ${user.username}`);
        }
      } catch (error) {
        console.log(`⚠️  User ${userData.username} might already exist, skipping...`);
      }
    }

    console.log("🏠 Creating sample properties...");

    // Helper function to safely get user ID with fallback
    const getUserId = (index: number): number => {
      return createdUsers[index]?.id ?? index + 1;
    };

    // Create sample properties with improved type safety
    const sampleProperties: InsertProperty[] = [
      {
        ownerId: getUserId(0),
        title: "Modern Apartment in Kilimani",
        description: "Luxurious 3-bedroom apartment with amazing city views and modern amenities. Located in the heart of Kilimani with easy access to shopping centers, restaurants, and public transport.",
        location: "Kilimani, Nairobi",
        price: 25000000,
        imageUrls: [
          "https://images.unsplash.com/photo-1580041065738-e72023775cdc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        ],
        features: {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1500,
          parkingSpaces: 2,
          yearBuilt: 2020,
          amenities: ["Swimming Pool", "Gym", "Security", "Backup Generator"],
          petFriendly: true,
          furnished: true,
          propertyType: "apartment" as const
        }
      },
      {
        ownerId: getUserId(1),
        title: "Family Home in Karen",
        description: "Spacious 4-bedroom house with large garden and staff quarters. Perfect for families looking for a quiet neighborhood with excellent schools nearby.",
        location: "Karen, Nairobi",
        price: 45000000,
        imageUrls: [
          "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        ],
        features: {
          bedrooms: 4,
          bathrooms: 3,
          squareFeet: 3000,
          parkingSpaces: 3,
          yearBuilt: 2019,
          amenities: ["Garden", "Staff Quarters", "Security", "Borehole"],
          petFriendly: false,
          furnished: false,
          propertyType: "house" as const
        }
      },
      {
        ownerId: getUserId(2),
        title: "Executive Office in Westlands",
        description: "Premium office space in the heart of Westlands business district. Ideal for businesses looking for a prestigious address with modern facilities.",
        location: "Westlands, Nairobi",
        price: 35000000,
        imageUrls: [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        ],
        features: {
          bedrooms: 0,
          bathrooms: 2,
          squareFeet: 1200,
          parkingSpaces: 5,
          yearBuilt: 2021,
          amenities: ["High-Speed Internet", "Conference Room", "Reception Area", "Security"],
          petFriendly: false,
          furnished: true,
          propertyType: "condo" as const
        }
      },
      {
        ownerId: getUserId(0),
        title: "Beachfront Villa in Diani",
        description: "Stunning beachfront villa with private beach access. Perfect for vacation rentals or permanent residence by the ocean.",
        location: "Diani Beach, Mombasa",
        price: 65000000,
        imageUrls: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        ],
        features: {
          bedrooms: 5,
          bathrooms: 4,
          squareFeet: 4000,
          parkingSpaces: 4,
          yearBuilt: 2018,
          amenities: ["Private Beach", "Swimming Pool", "Garden", "Security", "Generator"],
          petFriendly: true,
          furnished: true,
          propertyType: "house" as const
        }
      },
      {
        ownerId: getUserId(1),
        title: "Student Accommodation in Nakuru",
        description: "Modern student accommodation near Egerton University. Fully furnished with study areas and high-speed internet.",
        location: "Nakuru, Kenya",
        price: 8000000,
        imageUrls: [
          "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        ],
        features: {
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 800,
          parkingSpaces: 1,
          yearBuilt: 2022,
          amenities: ["High-Speed Internet", "Study Area", "Security", "Laundry"],
          petFriendly: false,
          furnished: true,
          propertyType: "apartment" as const
        }
      }
    ];

    // Track successful property creations
    let propertiesCreated = 0;
    
    for (const propertyData of sampleProperties) {
      try {
        const insertedProperties = await db.insert(properties).values(propertyData).returning();
        const property = insertedProperties[0];
        if (property) {
          propertiesCreated++;
          console.log(`✅ Created property: ${property.title}`);
        }
      } catch (error) {
        console.error(`❌ Error creating property: ${propertyData.title}`, error);
      }
    }

    console.log("🎉 Database setup completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`- Created ${createdUsers.length} users`);
    console.log(`- Created ${propertiesCreated} properties`);
    console.log("\n🔐 Demo Login Credentials:");
    console.log("Username: demo_user, Password: password123");
    console.log("Username: property_owner, Password: secure456");
    console.log("Username: agent_smith, Password: agent789");

  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase };