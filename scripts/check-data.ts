#!/usr/bin/env tsx
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function checkData() {
  try {
    console.log("📊 Checking database data...");
    
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check data counts in main tables
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const propertyCount = await sql`SELECT COUNT(*) as count FROM properties`;
    const reviewCount = await sql`SELECT COUNT(*) as count FROM reviews`;
    const sessionCount = await sql`SELECT COUNT(*) as count FROM land_verification_sessions`;
    
    console.log("\n📈 Data Counts:");
    console.log(`  Users: ${userCount[0].count}`);
    console.log(`  Properties: ${propertyCount[0].count}`);
    console.log(`  Reviews: ${reviewCount[0].count}`);
    console.log(`  Land Verification Sessions: ${sessionCount[0].count}`);
    
    // Check if we have sample data
    if (parseInt(userCount[0].count) === 0) {
      console.log("\n⚠️  No data found. Loading sample data...");
      console.log("Run: tsx scripts/data-migration/robust-batch-loader.ts");
    } else {
      console.log("\n✅ Database has data and is ready for use!");
      
      // Show sample users
      const sampleUsers = await sql`SELECT username, email, role, trust_score FROM users LIMIT 5`;
      console.log("\n👥 Sample Users:");
      sampleUsers.forEach((user: any) => {
        console.log(`  - ${user.username} (${user.email}) - Role: ${user.role}, Trust: ${user.trust_score}`);
      });
      
      // Show sample properties
      const sampleProperties = await sql`SELECT title, location, price, verification_status FROM properties LIMIT 5`;
      console.log("\n🏠 Sample Properties:");
      sampleProperties.forEach((property: any) => {
        console.log(`  - ${property.title} in ${property.location} - $${property.price} (${property.verification_status})`);
      });
    }
    
  } catch (error) {
    console.error("❌ Data check failed:");
    console.error(error);
    process.exit(1);
  }
}

checkData();