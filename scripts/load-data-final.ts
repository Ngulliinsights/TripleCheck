#!/usr/bin/env tsx
import "dotenv/config";
import * as fs from "fs/promises";
import { neon } from "@neondatabase/serverless";
import * as bcrypt from "bcrypt";

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

    // Process users one by one to avoid batch issues
    let processedUsers = 0;
    const insertedUserIds = [];
    const seenEmails = new Set();
    const seenUsernames = new Set();

    for (let i = 0; i < Math.min(userData.length, 300); i++) {
      const user = userData[i];
      
      // Skip if missing required fields
      if (!user.email || !user.firstName || !user.lastName) continue;

      const email = user.email.toLowerCase();
      
      // Skip if email already seen
      if (seenEmails.has(email)) continue;

      // Generate unique username
      const baseUsername = `${user.firstName.toLowerCase()}_${user.lastName.toLowerCase()}`;
      let username = `${baseUsername}_${i}`;
      let attempt = 0;
      
      while (seenUsernames.has(username) && attempt < 10) {
        username = `${baseUsername}_${i}_${attempt}`;
        attempt++;
      }
      
      // Ensure username is not too long
      username = username.substring(0, 50);
      
      // Skip if still duplicate
      if (seenUsernames.has(username)) continue;

      seenEmails.add(email);
      seenUsernames.add(username);

      try {
        const result = await sql`
          INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role, trust_score, is_verified, is_verified_agent, bio, location, preferences)
          VALUES (${username}, ${email}, ${hashedPassword}, ${user.firstName}, ${user.lastName}, ${user.phone || null}, 'user', ${user.trustScore || 50}, ${user.isVerified || false}, ${user.userType === "agent" || Math.random() > 0.9}, ${null}, ${user.address?.city || null}, ${'{}'})
          RETURNING id
        `;
        
        if (result.length > 0) {
          insertedUserIds.push(result[0].id);
          processedUsers++;
          
          if (processedUsers % 25 === 0) {
            logger.info(`   ✅ Inserted ${processedUsers} users so far...`);
          }
        }
      } catch (error) {
        // Skip this user and continue
        continue;
      }

      // Small delay every 10 users
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
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

    // Process properties one by one
    let processedProperties = 0;
    const insertedPropertyIds = [];

    for (let i = 0; i < Math.min(propertyData.length, 500); i++) {
      const property = propertyData[i];
      
      if (!property.title || !property.description || !property.location || !property.price) {
        continue;
      }

      // Select random owner
      const randomOwnerIndex = Math.floor(Math.random() * insertedUserIds.length);
      const ownerId = insertedUserIds[randomOwnerIndex];

      try {
        const result = await sql`
          INSERT INTO properties (
            owner_id, title, description, location, address, price, property_type, 
            bedrooms, bathrooms, square_feet, parking_spaces, year_built, 
            pet_friendly, furnished, amenities, image_urls, features, 
            verification_status, is_featured, is_active, views_count
          )
          VALUES (
            ${ownerId}, 
            ${property.title.substring(0, 200)}, 
            ${property.description}, 
            ${property.location}, 
            ${property.address || null}, 
            ${Math.abs(Number(property.price))}, 
            'apartment', 
            ${property.bedrooms || Math.floor(Math.random() * 4) + 1}, 
            ${property.bathrooms || Math.floor(Math.random() * 3) + 1}, 
            ${property.squareFeet || Math.floor(Math.random() * 2000) + 500}, 
            ${Math.floor(Math.random() * 3)}, 
            ${Math.floor(Math.random() * 30) + 1995}, 
            ${Math.random() > 0.5}, 
            ${Math.random() > 0.5}, 
            ${property.amenities || []}, 
            ${property.imageUrls || []}, 
            ${JSON.stringify({
              bedrooms: property.bedrooms || Math.floor(Math.random() * 4) + 1,
              bathrooms: property.bathrooms || Math.floor(Math.random() * 3) + 1,
              squareFeet: property.squareFeet || Math.floor(Math.random() * 2000) + 500,
              amenities: property.amenities || [],
              propertyType: "apartment"
            })}, 
            ${Math.random() > 0.7 ? 'verified' : 'pending'}, 
            ${Math.random() > 0.8}, 
            ${true}, 
            ${Math.floor(Math.random() * 100)}
          )
          RETURNING id
        `;
        
        if (result.length > 0) {
          insertedPropertyIds.push(result[0].id);
          processedProperties++;
          
          if (processedProperties % 25 === 0) {
            logger.info(`   ✅ Inserted ${processedProperties} properties so far...`);
          }
        }
      } catch (error) {
        // Skip this property and continue
        continue;
      }

      // Small delay every 10 properties
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
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

      const targetReviews = Math.min(150, Math.floor(insertedPropertyIds.length * 0.4));
      let insertedReviews = 0;

      for (let i = 0; i < targetReviews; i++) {
        const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
        const randomPropertyIndex = Math.floor(Math.random() * insertedPropertyIds.length);
        const randomUserIndex = Math.floor(Math.random() * insertedUserIds.length);

        try {
          await sql`
            INSERT INTO reviews (property_id, user_id, rating, comment, verified, helpful_count, report_count, is_active)
            VALUES (
              ${insertedPropertyIds[randomPropertyIndex]}, 
              ${insertedUserIds[randomUserIndex]}, 
              ${template.rating}, 
              ${template.comment}, 
              ${Math.random() > 0.7}, 
              ${Math.floor(Math.random() * 10)}, 
              ${0}, 
              ${true}
            )
          `;
          
          insertedReviews++;
          
          if (insertedReviews % 25 === 0) {
            logger.info(`   ✅ Inserted ${insertedReviews} reviews so far...`);
          }
        } catch (error) {
          // Skip duplicate reviews
          continue;
        }

        // Small delay every 10 reviews
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 30));
        }
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