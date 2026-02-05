#!/usr/bin/env tsx
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function checkReviewsTable() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    console.log("🔍 Checking reviews table structure...");
    
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'reviews' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log("\n📋 Reviews table columns:");
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Try to insert a simple review
    console.log("\n🧪 Testing review insertion...");
    
    const users = await sql`SELECT id FROM users LIMIT 1`;
    const properties = await sql`SELECT id FROM properties LIMIT 1`;
    
    if (users.length > 0 && properties.length > 0) {
      try {
        await sql`
          INSERT INTO reviews (property_id, user_id, rating, comment)
          VALUES (${properties[0].id}, ${users[0].id}, 5, 'Test review')
        `;
        console.log("✅ Test review inserted successfully");
        
        // Clean up test review
        await sql`DELETE FROM reviews WHERE comment = 'Test review'`;
        console.log("✅ Test review cleaned up");
      } catch (error) {
        console.log("❌ Failed to insert test review:", error);
      }
    }
    
  } catch (error) {
    console.error("❌ Failed to check reviews table:", error);
  }
}

checkReviewsTable();