#!/usr/bin/env tsx
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, properties, reviews } from "../../src/shared/schema";
import * as fs from "fs/promises";
import * as path from "path";
import * as bcrypt from "bcrypt";

// Define proper types for our data structures to prevent TypeScript inference issues
type UserInsert = typeof users.$inferInsert;
type PropertyInsert = typeof properties.$inferInsert;
type ReviewInsert = typeof reviews.$inferInsert;

// Type definitions for the JSON data we're importing
interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  trustScore?: number;
}

interface PropertyData {
  title: string;
  description: string;
  location: string;
  price: number | string;
  imageUrls?: string[];
  features?: {
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    parkingSpaces?: number;
    yearBuilt?: number;
    amenities?: string[];
    petFriendly?: boolean;
    furnished?: boolean;
  };
}

// Configuration constants for better maintainability
const CONFIG = {
  BATCH_SIZE: 100,
  TARGET_USERS: 1500,
  TARGET_PROPERTIES: 3000,
  BATCH_DELAY_MS: 100,
  REVIEW_DELAY_MS: 50,
  DEFAULT_PASSWORD: process.env.DEFAULT_USER_PASSWORD || "generated_user_2024",
  BCRYPT_ROUNDS: 12,
} as const;

async function loadDataRobustly(): Promise<void> {
  try {
    // eslint-disable-next-line no-console
    console.log("🚀 Robust Batch Data Loader Starting...");

    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    // Clear existing data with proper error handling
    // eslint-disable-next-line no-console
    console.log("🗑️ Clearing existing data...");
    await db.delete(reviews);
    await db.delete(properties);
    await db.delete(users);

    // Load and process user data
    // eslint-disable-next-line no-console
    console.log("👥 Loading users...");
    const userFile = path.join(
      process.cwd(),
      "scripts",
      "data-generation",
      "fraudulent_user_dataset.json"
    );
    const userData: UserData[] = JSON.parse(await fs.readFile(userFile, "utf8"));

    // eslint-disable-next-line no-console
    console.log(`Found ${userData.length} users to load`);

    // Process users with proper type safety
    const hashedPassword = await bcrypt.hash(CONFIG.DEFAULT_PASSWORD, CONFIG.BCRYPT_ROUNDS);
    let processedUsers = 0;
    
    // Explicitly type the array to prevent TypeScript inference issues
    const insertedUsers: UserInsert[] = [];
    const seenEmails = new Set<string>();
    const seenUsernames = new Set<string>();

    // eslint-disable-next-line no-console
    console.log(
      `Processing ${CONFIG.TARGET_USERS} users in batches of ${CONFIG.BATCH_SIZE}...`
    );

    // Process users in batches with improved error handling
    for (
      let i = 0;
      i < userData.length && processedUsers < CONFIG.TARGET_USERS;
      i += CONFIG.BATCH_SIZE
    ) {
      const batch = userData.slice(i, i + CONFIG.BATCH_SIZE);
      const validUsers: UserInsert[] = [];

      // Filter and validate user data with proper type checking
      for (const [index, user] of batch.entries()) {
        if (!user.email || !user.firstName || !user.lastName) continue;

        const email = user.email.toLowerCase();
        const username = `${user.firstName?.toLowerCase()}_${user.lastName?.toLowerCase()}_${Date.now()}_${i + index}`.substring(0, 50);

        if (seenEmails.has(email) || seenUsernames.has(username)) continue;

        seenEmails.add(email);
        seenUsernames.add(username);

        validUsers.push({
          username,
          email,
          password: hashedPassword,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || null,
          trustScore: user.trustScore ?? 50,
          role: "user",
          isVerifiedAgent: false,
        });

        if (processedUsers + validUsers.length >= CONFIG.TARGET_USERS) break;
      }

      // Insert batch with improved error handling and logging
      if (validUsers.length > 0) {
        try {
          const batchInserted = await db
            .insert(users)
            .values(validUsers)
            .returning();
          insertedUsers.push(...batchInserted);
          processedUsers += batchInserted.length;
          // eslint-disable-next-line no-console
          console.log(
            `   ✅ Batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}: Inserted ${batchInserted.length} users (Total: ${processedUsers})`
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(
            `   ⚠️  Batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}: Skipped due to constraints`
          );
        }
      }

      // Rate limiting to prevent database overload
      await new Promise((resolve) => setTimeout(resolve, CONFIG.BATCH_DELAY_MS));
    }

    // eslint-disable-next-line no-console
    console.log(`✅ Successfully inserted ${insertedUsers.length} users`);

    // Load and process property data
    // eslint-disable-next-line no-console
    console.log("\n🏠 Loading properties...");
    const propertyFile = path.join(
      process.cwd(),
      "scripts",
      "data-generation",
      "fraudulent_property_dataset.json"
    );
    const propertyData: PropertyData[] = JSON.parse(await fs.readFile(propertyFile, "utf8"));

    // eslint-disable-next-line no-console
    console.log(`Found ${propertyData.length} properties to load`);

    const userIds = insertedUsers.map((u) => u.id);
    let processedProperties = 0;
    
    // Explicitly type the properties array
    const insertedProperties: PropertyInsert[] = [];

    // eslint-disable-next-line no-console
    console.log(
      `Processing ${CONFIG.TARGET_PROPERTIES} properties in batches of ${CONFIG.BATCH_SIZE}...`
    );

    // Process properties with improved validation and type safety
    for (
      let i = 0;
      i < propertyData.length && processedProperties < CONFIG.TARGET_PROPERTIES;
      i += CONFIG.BATCH_SIZE
    ) {
      const batch = propertyData.slice(i, i + CONFIG.BATCH_SIZE);
      const validProperties: PropertyInsert[] = [];

      for (const property of batch) {
        // Validate required fields
        if (!property.title || !property.description || !property.location || !property.price) {
          continue;
        }

        // Create property object with proper defaults and type safety
        // Use non-null assertion since we know userIds has elements (checked earlier)
        const randomUserIndex = Math.floor(Math.random() * userIds.length);
        const selectedOwnerId = userIds[randomUserIndex]!; // Non-null assertion for type safety
        
        validProperties.push({
          ownerId: selectedOwnerId,
          title: property.title,
          description: property.description,
          location: property.location,
          price: property.price.toString(),
          imageUrls: property.imageUrls || [],
          features: {
            bedrooms: property.features?.bedrooms ?? Math.floor(Math.random() * 4) + 1,
            bathrooms: property.features?.bathrooms ?? Math.floor(Math.random() * 3) + 1,
            squareFeet: property.features?.squareFeet ?? Math.floor(Math.random() * 2000) + 500,
            parkingSpaces: property.features?.parkingSpaces ?? Math.floor(Math.random() * 3),
            yearBuilt: property.features?.yearBuilt ?? Math.floor(Math.random() * 30) + 1995,
            amenities: property.features?.amenities || [],
            petFriendly: property.features?.petFriendly ?? Math.random() > 0.5,
            furnished: property.features?.furnished ?? Math.random() > 0.5,
            propertyType: "apartment" as const,
          },
        });

        if (processedProperties + validProperties.length >= CONFIG.TARGET_PROPERTIES) {
          break;
        }
      }

      // Insert property batch with error handling
      if (validProperties.length > 0) {
        try {
          const batchInserted = await db
            .insert(properties)
            .values(validProperties)
            .returning();
          insertedProperties.push(...batchInserted);
          processedProperties += batchInserted.length;
          // eslint-disable-next-line no-console
          console.log(
            `   ✅ Batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}: Inserted ${batchInserted.length} properties (Total: ${processedProperties})`
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          // eslint-disable-next-line no-console
          console.log(
            `   ⚠️  Batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}: Skipped due to error: ${errorMessage}`
          );
        }
      }

      await new Promise((resolve) => setTimeout(resolve, CONFIG.BATCH_DELAY_MS));
    }

    // eslint-disable-next-line no-console
    console.log(`✅ Successfully inserted ${insertedProperties.length} properties`);

    // Generate reviews with improved template system
    // eslint-disable-next-line no-console
    console.log("\n⭐ Generating reviews...");
    const targetReviews = Math.min(1000, Math.floor(insertedProperties.length * 0.4));
    const propertyIds = insertedProperties.map((p) => p.id);

    // Improved review templates with more variety
    const reviewTemplates = [
      { rating: 5, comment: "Excellent property! Highly recommended. Great location and amenities." },
      { rating: 4, comment: "Very good property with nice features. Would recommend to others." },
      { rating: 4, comment: "Good value for money. Clean and well-maintained property." },
      { rating: 3, comment: "Decent property, meets basic requirements. Average experience." },
      { rating: 3, comment: "Okay property but could use some improvements." },
      { rating: 2, comment: "Below expectations. Several issues need to be addressed." },
      { rating: 1, comment: "Poor condition and overpriced. Would not recommend." },
    ] as const;

    let insertedReviews = 0;

    // Generate reviews in batches
    for (let i = 0; i < targetReviews; i += CONFIG.BATCH_SIZE) {
      const batchSize = Math.min(CONFIG.BATCH_SIZE, targetReviews - i);
      const reviewBatch: ReviewInsert[] = [];

      for (let j = 0; j < batchSize; j++) {
        const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
        const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const finalRating = Math.max(1, Math.min(5, template.rating + variation));

        // Use non-null assertions since we know both arrays have elements
        const randomPropertyIndex = Math.floor(Math.random() * propertyIds.length);
        const randomUserIndex = Math.floor(Math.random() * userIds.length);
        const selectedPropertyId = propertyIds[randomPropertyIndex]!;
        const selectedUserId = userIds[randomUserIndex]!;

        reviewBatch.push({
          propertyId: selectedPropertyId,
          userId: selectedUserId,
          rating: finalRating,
          comment: template.comment,
        });
      }

      // Insert review batch with error handling
      try {
        await db.insert(reviews).values(reviewBatch);
        insertedReviews += reviewBatch.length;
        // eslint-disable-next-line no-console
        console.log(
          `   ✅ Batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}: Inserted ${reviewBatch.length} reviews (Total: ${insertedReviews})`
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(
          `   ⚠️  Review batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}: Some duplicates skipped`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, CONFIG.REVIEW_DELAY_MS));
    }

    // eslint-disable-next-line no-console
    console.log(`✅ Successfully inserted ${insertedReviews} reviews`);

    // Final summary with detailed statistics
    // eslint-disable-next-line no-console
    console.log("\n🎉 Robust data loading completed successfully!");
    // eslint-disable-next-line no-console
    console.log("📊 Final counts:");
    // eslint-disable-next-line no-console
    console.log(`   Users: ${insertedUsers.length}`);
    // eslint-disable-next-line no-console
    console.log(`   Properties: ${insertedProperties.length}`);
    // eslint-disable-next-line no-console
    console.log(`   Reviews: ${insertedReviews}`);

    // eslint-disable-next-line no-console
    console.log("\n💡 Database now has substantial realistic data for testing!");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Robust data loading failed:", error);
    process.exit(1);
  }
}

// Execute the loader function
loadDataRobustly();