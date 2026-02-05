#!/usr/bin/env tsx
import "dotenv/config";
import * as fs from "./add-b2b-messaging";

import { neon } from "@neondatabase/serverless";
import * as bcrypt from "./add-b2b-messaging";

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

    // Clear existing data
    logger.info("🗑️ Clearing existing data...");
    await sql`DELETE FROM reviews`;
    await sql`DELETE FROM properties`;
    await sql`DELETE FROM users`;
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
    const batchSize = 25;
    let processedUsers = 0;
    const insertedUserIds = [];
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
          password_hash: hashedPassword,
          first_name: user.firstName,
          last_name: user.lastName,
          phone: user.phone || null,
          role: 'user',
          trust_score: user.trustScore || 50,
          is_verified: user.isVerified || false,
          is_verified_agent: user.userType === "agent" || Math.random() > 0.9,
          bio: null,
          location: user.address?.city || null,
          preferences: '{}',
        });
      }

      if (validUsers.length > 0) {
        try {
          // Insert users and get their IDs
          const insertQuery = `
            INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role, trust_score, is_verified, is_verified_agent, bio, location, preferences)
            VALUES ${validUsers.map((_, idx) => `($${idx * 13 + 1}, $${idx * 13 + 2}, $${idx * 13 + 3}, $${idx * 13 + 4}, $${idx * 13 + 5}, $${idx * 13 + 6}, $${idx * 13 + 7}, $${idx * 13 + 8}, $${idx * 13 + 9}, $${idx * 13 + 10}, $${idx * 13 + 11}, $${idx * 13 + 12}, $${idx * 13 + 13})`).join(', ')}
            RETURNING id
          `;
          
          const params = validUsers.flatMap(user => [
            user.username, user.email, user.password_hash, user.first_name, user.last_name,
            user.phone, user.role, user.trust_score, user.is_verified, user.is_verified_agent,
            user.bio, user.location, user.preferences
          ]);

          const result = await sql.unsafe(insertQuery, params);
          const userIds = result.map((row: any) => row.id);
          insertedUserIds.push(...userIds);
          processedUsers += result.length;
          logger.info(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${result.length} users (Total: ${processedUsers})`);
        } catch (error) {
          logger.warn(`   ⚠️  Batch ${Math.floor(i / batchSize) + 1}: Skipped due to constraints - ${error}`);
        }
      }

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    logger.success(`Successfully inserted ${insertedUserIds.length} users`);

    if (insertedUserIds.length === 0) {
      logger.error("No users were inserted. Cannot proceed with properties.");
      return;
    }

    // Load property data
    logger.info("\n🏠 Loading property data...");
    const propertyData = JSON.parse(
      await fs.readFile("scripts/data-generation/fraudulent_property_dataset.json", "utf8")
    );
    
    logger.info(`Found ${propertyData.length} properties in dataset`);

    // Process properties in batches
    let processedProperties = 0;
    const insertedPropertyIds = [];

    for (let i = 0; i < Math.min(propertyData.length, 800); i += batchSize) {
      const batch = propertyData.slice(i, i + batchSize);
      const validProperties = [];

      for (const property of batch) {
        if (!property.title || !property.description || !property.location || !property.price) {
          continue;
        }

        // Select random owner
        const randomOwnerIndex = Math.floor(Math.random() * insertedUserIds.length);
        const ownerId = insertedUserIds[randomOwnerIndex];

        validProperties.push({
          owner_id: ownerId,
          title: property.title.substring(0, 200), // Ensure title fits
          description: property.description,
          location: property.location,
          address: property.address || null,
          price: Math.abs(Number(property.price)),
          property_type: 'apartment',
          bedrooms: property.bedrooms || Math.floor(Math.random() * 4) + 1,
          bathrooms: property.bathrooms || Math.floor(Math.random() * 3) + 1,
          square_feet: property.squareFeet || Math.floor(Math.random() * 2000) + 500,
          parking_spaces: Math.floor(Math.random() * 3),
          year_built: Math.floor(Math.random() * 30) + 1995,
          pet_friendly: Math.random() > 0.5,
          furnished: Math.random() > 0.5,
          amenities: property.amenities || [],
          image_urls: property.imageUrls || [],
          features: JSON.stringify({
            bedrooms: property.bedrooms || Math.floor(Math.random() * 4) + 1,
            bathrooms: property.bathrooms || Math.floor(Math.random() * 3) + 1,
            squareFeet: property.squareFeet || Math.floor(Math.random() * 2000) + 500,
            amenities: property.amenities || [],
            propertyType: "apartment"
          }),
          verification_status: Math.random() > 0.7 ? 'verified' : 'pending',
          is_featured: Math.random() > 0.8,
          is_active: true,
          views_count: Math.floor(Math.random() * 100),
        });
      }

      if (validProperties.length > 0) {
        try {
          const insertQuery = `
            INSERT INTO properties (owner_id, title, description, location, address, price, property_type, bedrooms, bathrooms, square_feet, parking_spaces, year_built, pet_friendly, furnished, amenities, image_urls, features, verification_status, is_featured, is_active, views_count)
            VALUES ${validProperties.map((_, idx) => `($${idx * 21 + 1}, $${idx * 21 + 2}, $${idx * 21 + 3}, $${idx * 21 + 4}, $${idx * 21 + 5}, $${idx * 21 + 6}, $${idx * 21 + 7}, $${idx * 21 + 8}, $${idx * 21 + 9}, $${idx * 21 + 10}, $${idx * 21 + 11}, $${idx * 21 + 12}, $${idx * 21 + 13}, $${idx * 21 + 14}, $${idx * 21 + 15}, $${idx * 21 + 16}, $${idx * 21 + 17}, $${idx * 21 + 18}, $${idx * 21 + 19}, $${idx * 21 + 20}, $${idx * 21 + 21})`).join(', ')}
            RETURNING id
          `;
          
          const params = validProperties.flatMap(prop => [
            prop.owner_id, prop.title, prop.description, prop.location, prop.address,
            prop.price, prop.property_type, prop.bedrooms, prop.bathrooms, prop.square_feet,
            prop.parking_spaces, prop.year_built, prop.pet_friendly, prop.furnished, prop.amenities,
            prop.image_urls, prop.features, prop.verification_status, prop.is_featured, prop.is_active, prop.views_count
          ]);

          const result = await sql.unsafe(insertQuery, params);
          const propertyIds = result.map((row: any) => row.id);
          insertedPropertyIds.push(...propertyIds);
          processedProperties += result.length;
          logger.info(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${result.length} properties (Total: ${processedProperties})`);
        } catch (error) {
          logger.warn(`   ⚠️  Batch ${Math.floor(i / batchSize) + 1}: Skipped due to error - ${error}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    logger.success(`Successfully inserted ${insertedPropertyIds.length} properties`);

    // Generate some reviews
    logger.info("\n⭐ Generating reviews...");
    
    if (insertedPropertyIds.length === 0) {
      logger.warn("No properties available for reviews");
    } else {
      const reviewTemplates = [
        { rating: 5, comment: "Excellent property! Highly recommended. Great location and amenities." },
        { rating: 4, comment: "Very good property with nice features. Would recommend to others." },
        { rating: 4, comment: "Good value for money. Clean and well-maintained property." },
        { rating: 3, comment: "Decent property, meets basic requirements. Average experience." },
        { rating: 2, comment: "Below expectations. Several issues need to be addressed." },
      ];

      const targetReviews = Math.min(200, Math.floor(insertedPropertyIds.length * 0.4));
      let insertedReviews = 0;

      for (let i = 0; i < targetReviews; i += 15) {
        const batchSize = Math.min(15, targetReviews - i);
        const reviewBatch = [];

        for (let j = 0; j < batchSize; j++) {
          const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
          const randomPropertyIndex = Math.floor(Math.random() * insertedPropertyIds.length);
          const randomUserIndex = Math.floor(Math.random() * insertedUserIds.length);

          reviewBatch.push({
            property_id: insertedPropertyIds[randomPropertyIndex],
            user_id: insertedUserIds[randomUserIndex],
            rating: template.rating,
            comment: template.comment,
            verified: Math.random() > 0.7,
            helpful_count: Math.floor(Math.random() * 10),
            report_count: 0,
            is_active: true,
          });
        }

        try {
          const insertQuery = `
            INSERT INTO reviews (property_id, user_id, rating, comment, verified, helpful_count, report_count, is_active)
            VALUES ${reviewBatch.map((_, idx) => `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${idx * 8 + 4}, $${idx * 8 + 5}, $${idx * 8 + 6}, $${idx * 8 + 7}, $${idx * 8 + 8})`).join(', ')}
          `;
          
          const params = reviewBatch.flatMap(review => [
            review.property_id, review.user_id, review.rating, review.comment,
            review.verified, review.helpful_count, review.report_count, review.is_active
          ]);

          await sql.unsafe(insertQuery, params);
          insertedReviews += reviewBatch.length;
          logger.info(`   ✅ Batch ${Math.floor(i / 15) + 1}: Inserted ${reviewBatch.length} reviews (Total: ${insertedReviews})`);
        } catch (error) {
          logger.warn(`   ⚠️  Review batch ${Math.floor(i / 15) + 1}: Some duplicates skipped - ${error}`);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.success(`Successfully inserted ${insertedReviews} reviews`);
    }

    // Final summary
    logger.info("\n🎉 Data loading completed successfully!");
    logger.info("📊 Final counts:");
    logger.info(`   Users: ${insertedUserIds.length}`);
    logger.info(`   Properties: ${insertedPropertyIds.length}`);
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