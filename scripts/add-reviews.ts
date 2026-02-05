#!/usr/bin/env tsx
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function addReviews() {
  try {
    console.log("⭐ Adding reviews to complete the dataset...");
    
    const sql = neon(process.env.DATABASE_URL!);
    
    // Get some user and property IDs
    const users = await sql`SELECT id FROM users LIMIT 50`;
    const properties = await sql`SELECT id FROM properties LIMIT 100`;
    
    if (users.length === 0 || properties.length === 0) {
      console.log("❌ No users or properties found");
      return;
    }
    
    const reviewTemplates = [
      { rating: 5, comment: "Excellent property! Highly recommended. Great location and amenities." },
      { rating: 5, comment: "Outstanding service and beautiful property. Everything was as described." },
      { rating: 4, comment: "Very good property with nice features. Would recommend to others." },
      { rating: 4, comment: "Good value for money. Clean and well-maintained property." },
      { rating: 4, comment: "Nice location and good facilities. Minor issues but overall satisfied." },
      { rating: 3, comment: "Decent property, meets basic requirements. Average experience." },
      { rating: 3, comment: "Okay property but could use some improvements." },
      { rating: 2, comment: "Below expectations. Several issues need to be addressed." },
      { rating: 1, comment: "Poor condition and overpriced. Would not recommend." },
    ];
    
    let insertedReviews = 0;
    
    // Add 100 reviews
    for (let i = 0; i < 100; i++) {
      const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProperty = properties[Math.floor(Math.random() * properties.length)];
      
      try {
        await sql`
          INSERT INTO reviews (property_id, user_id, rating, comment, is_verified, helpful_count)
          VALUES (
            ${randomProperty.id}, 
            ${randomUser.id}, 
            ${template.rating}, 
            ${template.comment}, 
            ${Math.random() > 0.7}, 
            ${Math.floor(Math.random() * 15)}
          )
        `;
        insertedReviews++;
        
        if (insertedReviews % 25 === 0) {
          console.log(`   ✅ Added ${insertedReviews} reviews...`);
        }
      } catch (error) {
        // Skip duplicates
        continue;
      }
      
      // Small delay
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log(`✅ Successfully added ${insertedReviews} reviews`);
    
    // Show final counts
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const propertyCount = await sql`SELECT COUNT(*) as count FROM properties`;
    const reviewCount = await sql`SELECT COUNT(*) as count FROM reviews`;
    
    console.log("\n📊 Final Database Counts:");
    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Properties: ${propertyCount[0].count}`);
    console.log(`   Reviews: ${reviewCount[0].count}`);
    
  } catch (error) {
    console.error("❌ Failed to add reviews:", error);
  }
}

addReviews();