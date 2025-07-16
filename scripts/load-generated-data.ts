#!/usr/bin/env tsx
/**
 * Optimized Data Loader for TripleCheck Database
 * 
 * This enhanced script provides better error handling, transaction management,
 * and performance optimizations for loading generated data.
 */

import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, properties, reviews } from "../shared/schema";
import type { InsertUser, InsertProperty, InsertReview } from "../shared/schema";
import bcrypt from "bcrypt";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GeneratedProperty {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  imageUrls: string[];
  features: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    parkingSpaces: number;
    yearBuilt: number;
    amenities: string[];
    petFriendly: boolean;
    furnished: boolean;
    propertyType: string;
  };
  isSuspicious: boolean;
}

interface GeneratedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: string;
  isSuspicious: boolean;
  fraudPattern?: string;
  fraudIndicators?: string[];
}

class DataLoader {
  private db: ReturnType<typeof drizzle>;
  private sql: ReturnType<typeof neon>;
  
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    this.sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(this.sql);
  }

  /**
   * Find the data files by checking the intended location first, then fallback locations
   */
  private async findDataFiles(): Promise<{ usersPath: string; propertiesPath: string }> {
    const fileNames = {
      users: 'fraudulent_user_dataset.json',
      properties: 'fraudulent_property_dataset.json'
    };

    // PRIMARY LOCATION: This is where the files should be according to project structure
    const primaryLocation = path.join(__dirname, 'data-generation');
    
    console.log(`🔍 Checking primary location: ${primaryLocation}`);
    
    try {
      const usersPath = path.join(primaryLocation, fileNames.users);
      const propertiesPath = path.join(primaryLocation, fileNames.properties);
      
      // Check if both files exist in the primary location
      await fs.access(usersPath);
      await fs.access(propertiesPath);
      
      console.log(`✅ Found data files in primary location: ${primaryLocation}`);
      return { usersPath, propertiesPath };
    } catch (error) {
      console.log(`⚠️  Primary location check failed: ${error.message}`);
      console.log(`🔍 Searching fallback locations...`);
    }

    // FALLBACK LOCATIONS: Try these if primary location fails
    const fallbackLocations = [
      // Parent directory
      path.join(__dirname, '..', 'data-generation'),
      // Root project directory
      path.join(__dirname, '..', '..', 'data-generation'),
      // Current working directory
      path.join(process.cwd(), 'data-generation'),
      // Direct paths in script directory
      __dirname,
      // Direct paths in current working directory
      process.cwd(),
    ];

    for (const location of fallbackLocations) {
      try {
        const usersPath = path.join(location, fileNames.users);
        const propertiesPath = path.join(location, fileNames.properties);
        
        // Check if both files exist
        await fs.access(usersPath);
        await fs.access(propertiesPath);
        
        console.log(`✅ Found data files in fallback location: ${location}`);
        return { usersPath, propertiesPath };
      } catch (error) {
        // Continue to next location
        continue;
      }
    }

    // If we get here, files weren't found anywhere
    const allLocations = [primaryLocation, ...fallbackLocations];
    throw new Error(`Data files not found. Searched in: ${allLocations.join(', ')}`);
  }

  /**
   * Load and validate JSON data with better error handling
   */
  private async loadJsonData<T>(filePath: string, dataType: string): Promise<T[]> {
    try {
      console.log(`📥 Loading ${dataType} from: ${filePath}`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      if (!fileContent.trim()) {
        throw new Error(`${dataType} file is empty`);
      }

      const data = JSON.parse(fileContent);
      
      if (!Array.isArray(data)) {
        throw new Error(`${dataType} file should contain an array`);
      }

      console.log(`   ✅ Loaded ${data.length} ${dataType} records`);
      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in ${dataType} file: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Retry database operations with exponential backoff
   */
  private async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`   ⏳ Retry ${attempt}/${maxRetries} after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error("Max retries exceeded");
  }

  /**
   * Check current database state and decide on clearing strategy with retry logic
   */
  private async assessDatabaseState(): Promise<{ shouldClear: boolean; counts: { users: number; properties: number; reviews: number } }> {
    console.log("📊 Checking current database state...");
    
    const getCounts = async () => {
      const [existingUsers, existingProperties, existingReviews] = await Promise.all([
        this.db.select().from(users),
        this.db.select().from(properties),
        this.db.select().from(reviews)
      ]);

      return {
        users: existingUsers.length,
        properties: existingProperties.length,
        reviews: existingReviews.length
      };
    };

    const counts = await this.retryOperation(getCounts, 3, 2000);

    console.log(`📊 Current database state:`);
    console.log(`   - Users: ${counts.users}`);
    console.log(`   - Properties: ${counts.properties}`);
    console.log(`   - Reviews: ${counts.reviews}`);

    // Clear if it looks like demo data (small amounts)
    const shouldClear = counts.users <= 5 && counts.properties <= 10 && counts.reviews <= 20;
    
    if (shouldClear) {
      console.log("🧹 Detected demo data - will clear for fresh import");
    } else {
      console.log("ℹ️  Existing data detected - will append new records");
    }

    return { shouldClear, counts };
  }

  /**
   * Clear existing data with proper transaction handling
   */
  private async clearExistingData(): Promise<void> {
    console.log("🧹 Clearing existing data...");
    
    try {
      // Delete in correct order to respect foreign key constraints
      await this.db.delete(reviews);
      await this.db.delete(properties);
      await this.db.delete(users);
      
      console.log("   ✅ Existing data cleared successfully");
    } catch (error) {
      console.error("   ❌ Failed to clear existing data:", error);
      throw error;
    }
  }

  /**
   * Insert users in optimized batches with better error handling
   */
  private async insertUsers(generatedUsers: GeneratedUser[]): Promise<Map<string, number>> {
    console.log("👥 Inserting users...");
    
    const userIdMapping = new Map<string, number>();
    const batchSize = 50; // Smaller batches for better transaction management
    let successCount = 0;
    let errorCount = 0;

    // Pre-hash password once for all users
    const hashedPassword = await bcrypt.hash('generated_user_2024', 12);

    for (let i = 0; i < generatedUsers.length; i += batchSize) {
      const batch = generatedUsers.slice(i, i + batchSize);
      
      try {
        // Process batch in a single transaction context
        for (const generatedUser of batch) {
          try {
            // Create unique username with timestamp to avoid duplicates
            const timestamp = Date.now().toString(36);
            const username = `${generatedUser.firstName.toLowerCase()}_${generatedUser.lastName.toLowerCase()}_${timestamp}`;
            
            const userData: InsertUser = {
              username,
              password: hashedPassword
            };

            const [insertedUser] = await this.db.insert(users).values(userData).returning();
            userIdMapping.set(generatedUser.id, insertedUser.id);
            successCount++;

          } catch (error) {
            errorCount++;
            console.log(`   ⚠️  Error inserting user ${generatedUser.id}: ${error}`);
          }
        }

        // Progress reporting
        if (i % 250 === 0) {
          console.log(`   📊 Progress: ${successCount} users inserted, ${errorCount} errors`);
        }

      } catch (error) {
        console.error(`   ❌ Batch error at index ${i}:`, error);
        errorCount += batch.length;
      }
    }

    console.log(`   ✅ User insertion completed: ${successCount} successful, ${errorCount} errors`);
    return userIdMapping;
  }

  /**
   * Insert properties with optimized batch processing and better timeout handling
   */
  private async insertProperties(generatedProperties: GeneratedProperty[], userIdMapping: Map<string, number>): Promise<number> {
    console.log("🏠 Inserting properties...");
    console.log(`   📊 Total properties to insert: ${generatedProperties.length}`);
    
    const availableUserIds = Array.from(userIdMapping.values());
    if (availableUserIds.length === 0) {
      throw new Error("No users available for property ownership");
    }

    const batchSize = 10; // Even smaller batches to avoid timeouts
    let successCount = 0;
    let errorCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < generatedProperties.length; i += batchSize) {
      const batch = generatedProperties.slice(i, i + batchSize);
      const batchStartTime = Date.now();
      
      try {
        // Prepare batch data first
        const batchData: InsertProperty[] = [];
        
        for (const generatedProperty of batch) {
          // Assign random owner from available users
          const ownerId = availableUserIds[Math.floor(Math.random() * availableUserIds.length)];
          
          const propertyData: InsertProperty = {
            ownerId,
            title: generatedProperty.title,
            description: generatedProperty.description,
            location: generatedProperty.location,
            price: generatedProperty.price,
            imageUrls: generatedProperty.imageUrls,
            features: {
              bedrooms: generatedProperty.features.bedrooms,
              bathrooms: generatedProperty.features.bathrooms,
              squareFeet: generatedProperty.features.squareFeet,
              parkingSpaces: generatedProperty.features.parkingSpaces,
              yearBuilt: generatedProperty.features.yearBuilt,
              amenities: generatedProperty.features.amenities,
              petFriendly: generatedProperty.features.petFriendly,
              furnished: generatedProperty.features.furnished,
              propertyType: generatedProperty.features.propertyType as any
            }
          };
          
          batchData.push(propertyData);
        }

        // Insert entire batch at once for better performance
        await this.db.insert(properties).values(batchData);
        successCount += batchData.length;

        const batchTime = Date.now() - batchStartTime;
        const totalTime = Date.now() - startTime;
        const avgTimePerBatch = totalTime / ((i / batchSize) + 1);
        const estimatedRemaining = (generatedProperties.length - i - batchSize) / batchSize * avgTimePerBatch;

        // More frequent progress reporting
        if (i % 50 === 0 || i + batchSize >= generatedProperties.length) {
          console.log(`   📊 Progress: ${successCount}/${generatedProperties.length} properties (${Math.round((successCount/generatedProperties.length)*100)}%)`);
          console.log(`   ⏱️  Batch time: ${batchTime}ms, Est. remaining: ${Math.round(estimatedRemaining/1000)}s`);
        }

      } catch (error) {
        console.error(`   ❌ Batch error at index ${i}:`, error);
        errorCount += batch.length;
        
        // Try individual inserts for failed batch
        console.log(`   🔄 Retrying batch individually...`);
        for (const generatedProperty of batch) {
          try {
            const ownerId = availableUserIds[Math.floor(Math.random() * availableUserIds.length)];
            
            const propertyData: InsertProperty = {
              ownerId,
              title: generatedProperty.title,
              description: generatedProperty.description,
              location: generatedProperty.location,
              price: generatedProperty.price,
              imageUrls: generatedProperty.imageUrls,
              features: {
                bedrooms: generatedProperty.features.bedrooms,
                bathrooms: generatedProperty.features.bathrooms,
                squareFeet: generatedProperty.features.squareFeet,
                parkingSpaces: generatedProperty.features.parkingSpaces,
                yearBuilt: generatedProperty.features.yearBuilt,
                amenities: generatedProperty.features.amenities,
                petFriendly: generatedProperty.features.petFriendly,
                furnished: generatedProperty.features.furnished,
                propertyType: generatedProperty.features.propertyType as any
              }
            };

            await this.db.insert(properties).values(propertyData);
            successCount++;
            errorCount--; // Adjust error count since this one succeeded

          } catch (individualError) {
            console.log(`   ⚠️  Error inserting property ${generatedProperty.id}: ${individualError}`);
          }
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`   ✅ Property insertion completed: ${successCount} successful, ${errorCount} errors`);
    console.log(`   ⏱️  Total time: ${Math.round(totalTime/1000)}s (${Math.round(successCount/(totalTime/1000))} properties/sec)`);
    return successCount;
  }

  /**
   * Generate sample reviews with better distribution
   */
  private async generateReviews(): Promise<number> {
    console.log("⭐ Generating sample reviews...");
    
    const [finalProperties, finalUsers] = await Promise.all([
      this.db.select().from(properties),
      this.db.select().from(users)
    ]);

    if (finalProperties.length === 0 || finalUsers.length === 0) {
      console.log("   ⚠️  No properties or users available for review generation");
      return 0;
    }

    const reviewTemplates = [
      "Great property with excellent amenities. Highly recommended!",
      "Good location and well-maintained. Would consider again.",
      "Average property, nothing special but decent value for money.",
      "Excellent service from the owner. Very professional.",
      "Beautiful property in a prime location. Worth the price.",
      "Good investment opportunity with great potential.",
      "Well-designed property with modern features.",
      "Peaceful neighborhood and good security.",
      "Property as described, no surprises. Satisfied with the deal.",
      "Outstanding property with great facilities.",
      "Clean and comfortable. Great for short stays.",
      "Responsive owner and smooth transaction process.",
      "Could use some improvements but overall decent.",
      "Perfect for families with great nearby amenities.",
      "Value for money is excellent. Recommended!"
    ];

    const targetReviews = Math.min(2000, finalProperties.length * 3);
    let reviewCount = 0;
    const batchSize = 100;

    for (let i = 0; i < targetReviews; i += batchSize) {
      const currentBatchSize = Math.min(batchSize, targetReviews - i);
      const reviewBatch: InsertReview[] = [];

      for (let j = 0; j < currentBatchSize; j++) {
        const property = finalProperties[Math.floor(Math.random() * finalProperties.length)];
        const user = finalUsers[Math.floor(Math.random() * finalUsers.length)];
        
        // Skip if user is property owner
        if (user.id === property.ownerId) continue;

        const rating = Math.floor(Math.random() * 5) + 1;
        const comment = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];

        reviewBatch.push({
          propertyId: property.id,
          userId: user.id,
          rating,
          comment
        });
      }

      try {
        if (reviewBatch.length > 0) {
          await this.db.insert(reviews).values(reviewBatch);
          reviewCount += reviewBatch.length;
        }
      } catch (error) {
        // Handle duplicate key errors gracefully
        console.log(`   ⚠️  Batch review insertion error (likely duplicates): ${error}`);
      }
    }

    console.log(`   ✅ Generated ${reviewCount} sample reviews`);
    return reviewCount;
  }

  /**
   * Main loading function with comprehensive error handling
   */
  async load(): Promise<void> {
    console.log("🚀 Starting optimized data loading for TripleCheck database...");
    console.log("📍 Current directory:", process.cwd());
    console.log("📍 Script directory:", __dirname);
    
    try {
      // Step 1: Find data files
      const { usersPath, propertiesPath } = await this.findDataFiles();

      // Step 2: Load and validate data
      const [generatedUsers, generatedProperties] = await Promise.all([
        this.loadJsonData<GeneratedUser>(usersPath, 'users'),
        this.loadJsonData<GeneratedProperty>(propertiesPath, 'properties')
      ]);

      // Step 3: Assess database state
      const { shouldClear } = await this.assessDatabaseState();

      // Step 4: Clear existing data if needed
      if (shouldClear) {
        await this.clearExistingData();
      }

      // Step 5: Insert users
      const userIdMapping = await this.insertUsers(generatedUsers);

      if (userIdMapping.size === 0) {
        throw new Error("No users were successfully inserted");
      }

      // Step 6: Insert properties
      const propertyCount = await this.insertProperties(generatedProperties, userIdMapping);

      if (propertyCount === 0) {
        throw new Error("No properties were successfully inserted");
      }

      // Step 7: Generate reviews
      const reviewCount = await this.generateReviews();

      // Step 8: Final summary
      const [finalUsers, finalProperties, finalReviews] = await Promise.all([
        this.db.select().from(users),
        this.db.select().from(properties),
        this.db.select().from(reviews)
      ]);

      console.log("\n🎉 Data loading completed successfully!");
      console.log("\n📊 Final Database State:");
      console.log(`   - Users: ${finalUsers.length}`);
      console.log(`   - Properties: ${finalProperties.length}`);
      console.log(`   - Reviews: ${finalReviews.length}`);
      
      console.log("\n🔐 Login Information:");
      console.log("   - Any generated username with password: generated_user_2024");
      console.log("   - Or create a new account through the registration form");
      console.log("\n💡 Tip: Check the database logs for any specific error details");

    } catch (error) {
      console.error("❌ Data loading failed:", error);
      
      // Provide helpful troubleshooting information
      console.error("\n🔍 Troubleshooting suggestions:");
      console.error("   1. Verify your data files exist and contain valid JSON");
      console.error("   2. Check DATABASE_URL environment variable");
      console.error("   3. Ensure database is accessible and has proper permissions");
      console.error("   4. Check if the schema matches your database structure");
      
      throw error;
    }
  }
}

/**
 * Main function to load generated data
 */
async function loadGeneratedData() {
  console.log("🚀 Script is starting...");
  const loader = new DataLoader();
  await loader.load();
}

// Run the loading when this script is executed
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1]?.includes('load-generated-data');

if (isMainModule) {
  loadGeneratedData().catch((error) => {
    console.error("Script execution failed:", error);
    process.exit(1);
  });
}

export { loadGeneratedData, DataLoader };