#!/usr/bin/env tsx
import "dotenv/config";
import * as fs from "fs/promises";

import { neon } from "@neondatabase/serverless";
import * as bcrypt from "bcrypt";
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
    const batchSize = 25; // Smaller batch size
    let processedUsers = 0;
    const insertedUsers = [];
    const seenEmails = new Set();
    const seenUsernames = new Set();

    for (let i = 0; i < Math.min(userData.length, 500); i += batchSize) {
      const batch = userData.slice(i, i + batchSize);
      const validUsers = [];

      for (const [index, user] of batch.entries()) {
        // Skip if missing required fields
        if (!user.email || !user.firstName || !user.lastName) continue;

        const email = user.email.toLowerCase();
        
        // Skip if email already seen
        if (seenEmails.has(email)) continue;

        // Generate unique username
        const baseUsername = `${user.firstName.toLowerCase()}_${user.lastName.toLowerCase()}`;
        let username = `${baseUsername}_${i + index}`;
        let attempt = 0;
        
        while (seenUsernames.has(username) && attempt < 10) {
          username = `${baseUsername}_${i + index}_${attempt}`;
          attempt++;
        }
        
        // Ensure username is not too long
        username = username.substring(0, 50);
        
        // Skip if still duplicate
        if (seenUsernames.has(username)) continue;

        seenEmails.add(email);
        seenUsernames.add(username);

        validUsers.push({
          username,
          email,
          password: hashedPassword,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || null,
          trustScore: user.trustScore || 50,
          role: "user" as const,
          isVerifiedAgent: user.userType === "agent" || Math.random() > 0.9,
        });
      }

      if (validUsers.length > 0) {
        try {
          const batchInserted = await db.insert(users).values(validUsers).returning();
          insertedUsers.push(...batchInserted);
          processedUsers += batchInserted.length;
          logger.info(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${batchInserted.length} users (Total: ${processedUsers})`);
        } catch (error) {
          logger.warn(`   ⚠️  Batch ${Math.floor(i / batchSize) + 1}: Skipped due to constraints - ${error}`);
        }
      }

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    logger.success(`Successfully inserted ${insertedUsers.length} users`);

    if (insertedUsers.length === 0) {
      logger.error("No users were inserted. Cannot proceed with properties.");
      return;
    }

    // Load property data
    logger.info("\n🏠 Loading property data...");
    const propertyData = JSON.parse(
      await fs.readFile("scripts/data-generation/fraudulent_property_dataset.json", "utf8")
    );
    
    logger.info(`Found ${propertyData.length} properties in dataset`);

    // Get user IDs for property assignment
    const userIds = insertedUsers.map(u => u.id).filter(id => id !== undefined);
    
    // Process properties in batches
    let processedProperties = 0;
    const insertedProperties = [];

    for (let i = 0; i < Math.min(propertyData.length, 800); i += batchSize) {
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
          title: property.title.substring(0, 255), // Ensure title fits
          description: property.description,
          location: property.location,
          price: Math.abs(Number(property.price)).toString(), // Ensure positive price
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
          logger.warn(`   ⚠️  Batch ${Math.floor(i / batchSize) + 1}: Skipped due to error - ${error}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    logger.success(`Successfully inserted ${insertedProperties.length} properties`);

    // Generate some reviews
    logger.info("\n⭐ Generating reviews...");
    const propertyIds = insertedProperties.map(p => p.id).filter(id => id !== undefined);
    
    if (propertyIds.length === 0) {
      logger.warn("No properties available for reviews");
    } else {
      const reviewTemplates = [
        { rating: 5, comment: "Excellent property! Highly recommended. Great location and amenities." },
        { rating: 4, comment: "Very good property with nice features. Would recommend to others." },
        { rating: 4, comment: "Good value for money. Clean and well-maintained property." },
        { rating: 3, comment: "Decent property, meets basic requirements. Average experience." },
        { rating: 2, comment: "Below expectations. Several issues need to be addressed." },
      ];

      const targetReviews = Math.min(200, Math.floor(propertyIds.length * 0.4));
      let insertedReviews = 0;

      for (let i = 0; i < targetReviews; i += 15) {
        const batchSize = Math.min(15, targetReviews - i);
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
          logger.info(`   ✅ Batch ${Math.floor(i / 15) + 1}: Inserted ${reviewBatch.length} reviews (Total: ${insertedReviews})`);
        } catch (error) {
          logger.warn(`   ⚠️  Review batch ${Math.floor(i / 15) + 1}: Some duplicates skipped`);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.success(`Successfully inserted ${insertedReviews} reviews`);
    }

    // Final summary
    logger.info("\n🎉 Data loading completed successfully!");
    logger.info("📊 Final counts:");
    logger.info(`   Users: ${insertedUsers.length}`);
    logger.info(`   Properties: ${insertedProperties.length}`);
    logger.info(`   Reviews: ${insertedReviews || 0}`);
    logger.info("\n💡 Database now has substantial realistic data for testing!");
    logger.info("🚀 Ready for deployment!");

  } catch (error) {
    logger.error("❌ Data loading failed:");
    logger.error(error);
    process.exit(1);
  }
}

loadData();