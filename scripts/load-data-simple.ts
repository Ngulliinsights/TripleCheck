#!/usr/bin/env tsx
import "dotenv/config";
import * as fs from "./add-b2b-messaging";

import { neon } from "@neondatabase/serverless";
import * as bcrypt from "./add-b2b-messaging";
import { drizzle } from "drizzle-orm/neon-http";

import { users, properties, reviews } from "../src/shared/schema";

const logger = {
  info: (message: string) => console.log(`ℹ️  ${message}`),
  success: (message: string) => console.log(`✅ ${message}`),
  warn: (message: string) => console.warn(`⚠️  ${message}`),
  error: (message: string) => console.error(`❌ ${message}`),
};

async function loadData() {
  try {
    logger.info("🚀 Starting data loading...");

    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    // Clear existing data
    logger.info("🗑️ Clearing existing data...");
    await db.delete(reviews);
    await db.delete(properties);
    await db.delete(users);
    logger.success("Existing data cleared");

    // Load user data
    logger.info("👥 Loading user data...");
    const userData = JSON.parse(
      await fs.readFile("scripts/data-generation/fraudulent_user_dataset.json", "utf8")
    );
    
    logger.info(`Found ${userData.length} users in dataset`);

    // Hash password for all users
    const hashedPassword = await bcrypt.hash("demo123", 12);

    // Process users in batches
    const batchSize = 50;
    let processedUsers = 0;
    const insertedUsers = [];

    for (let i = 0; i < Math.min(userData.length, 500); i += batchSize) {
      const batch = userData.slice(i, i + batchSize);
      const validUsers = [];

      for (const [index, user] of batch.entries()) {
        if (!user.email || !user.firstName || !user.lastName) continue;

        const username = `${user.firstName.toLowerCase()}_${user.lastName.toLowerCase()}_${Date.now()}_${i + index}`.substring(0, 50);
        
        validUsers.push({
          username,
          email: user.email.toLowerCase(),
          password: hashedPassword,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || null,
          trustScore: Math.floor(Math.random() * 100),
          role: "user" as const,
          isVerifiedAgent: Math.random() > 0.9,
        });
      }

      if (validUsers.length > 0) {
        try {
          const batchInserted = await db.insert(users).values(validUsers).returning();
          insertedUsers.push(...batchInserted);
          processedUsers += batchInserted.length;
          logger.info(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${batchInserted.length} users (Total: ${processedUsers})`);
        } catch (error) {
          logger.warn(`   ⚠️  Batch ${Math.floor(i / batchSize) + 1}: Skipped due to constraints`);
        }
      }

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.success(`Successfully inserted ${insertedUsers.length} users`);

    // Load property data
    logger.info("\n🏠 Loading property data...");
    const propertyData = JSON.parse(
      await fs.readFile("scripts/data-generation/fraudulent_property_dataset.json", "utf8")
    );
    
    logger.info(`Found ${propertyData.length} properties in dataset`);

    // Get user IDs for property assignment
    const userIds = insertedUsers.map(u => u.id).filter(id => id !== undefined);
    
    if (userIds.length === 0) {
      throw new Error("No users available for property assignment");
    }

    // Process properties in batches
    let processedProperties = 0;
    const insertedProperties = [];

    for (let i = 0; i < Math.min(propertyData.length, 1000); i += batchSize) {
      const batch = propertyData.slice(i, i + batchSize);
      const validProperties = [];

      for (const property of batch) {
        if (!property.title || !property.description || !property.location || !property.price) {
          continue;
        }

        // Select random owner
        const randomOwnerIndex = Math.floor(Math.random() * userIds.length);
        const ownerId = userIds[randomOwnerIndex];

        validProperties.push({
          ownerId,
          title: property.title,
          description: property.description,
          location: property.location,
          price: property.price.toString(),
          imageUrls: property.imageUrls || [],
          features: {
            bedrooms: property.bedrooms || Math.floor(Math.random() * 4) + 1,
            bathrooms: property.bathrooms || Math.floor(Math.random() * 3) + 1,
            squareFeet: property.squareFeet || Math.floor(Math.random() * 2000) + 500,
            parkingSpaces: Math.floor(Math.random() * 3),
            yearBuilt: Math.floor(Math.random() * 30) + 1995,
            amenities: property.amenities || [],
            petFriendly: Math.random() > 0.5,
            furnished: Math.random() > 0.5,
            propertyType: "apartment" as const,
          },
          verificationStatus: Math.random() > 0.7 ? "verified" as const : "pending" as const,
        });
      }

      if (validProperties.length > 0) {
        try {
          const batchInserted = await db.insert(properties).values(validProperties).returning();
          insertedProperties.push(...batchInserted);
          processedProperties += batchInserted.length;
          logger.info(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${batchInserted.length} properties (Total: ${processedProperties})`);
        } catch (error) {
          logger.warn(`   ⚠️  Batch ${Math.floor(i / batchSize) + 1}: Skipped due to error`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.success(`Successfully inserted ${insertedProperties.length} properties`);

    // Generate some reviews
    logger.info("\n⭐ Generating reviews...");
    const propertyIds = insertedProperties.map(p => p.id).filter(id => id !== undefined);
    const reviewTemplates = [
      { rating: 5, comment: "Excellent property! Highly recommended. Great location and amenities." },
      { rating: 4, comment: "Very good property with nice features. Would recommend to others." },
      { rating: 4, comment: "Good value for money. Clean and well-maintained property." },
      { rating: 3, comment: "Decent property, meets basic requirements. Average experience." },
      { rating: 2, comment: "Below expectations. Several issues need to be addressed." },
    ];

    const targetReviews = Math.min(300, Math.floor(propertyIds.length * 0.3));
    let insertedReviews = 0;

    for (let i = 0; i < targetReviews; i += 20) {
      const batchSize = Math.min(20, targetReviews - i);
      const reviewBatch = [];

      for (let j = 0; j < batchSize; j++) {
        const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
        const randomPropertyIndex = Math.floor(Math.random() * propertyIds.length);
        const randomUserIndex = Math.floor(Math.random() * userIds.length);

        reviewBatch.push({
          propertyId: propertyIds[randomPropertyIndex],
          userId: userIds[randomUserIndex],
          rating: template.rating,
          comment: template.comment,
        });
      }

      try {
        await db.insert(reviews).values(reviewBatch);
        insertedReviews += reviewBatch.length;
        logger.info(`   ✅ Batch ${Math.floor(i / 20) + 1}: Inserted ${reviewBatch.length} reviews (Total: ${insertedReviews})`);
      } catch (error) {
        logger.warn(`   ⚠️  Review batch ${Math.floor(i / 20) + 1}: Some duplicates skipped`);
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    logger.success(`Successfully inserted ${insertedReviews} reviews`);

    // Final summary
    logger.info("\n🎉 Data loading completed successfully!");
    logger.info("📊 Final counts:");
    logger.info(`   Users: ${insertedUsers.length}`);
    logger.info(`   Properties: ${insertedProperties.length}`);
    logger.info(`   Reviews: ${insertedReviews}`);
    logger.info("\n💡 Database now has substantial realistic data for testing!");
    logger.info("🚀 Ready for deployment!");

  } catch (error) {
    logger.error("❌ Data loading failed:");
    logger.error(error);
    process.exit(1);
  }
}

loadData();