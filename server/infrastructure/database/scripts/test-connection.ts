#!/usr/bin/env tsx
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function testConnection() {
  try {
    console.log("🔍 Testing database connection...");
    console.log(`Database URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
    
    const sql = neon(process.env.DATABASE_URL!);
    
    // Test basic connection
    const result = await sql`SELECT 1 as test, NOW() as current_time`;
    console.log("✅ Database connection successful!");
    console.log(`Current time: ${result[0].current_time}`);
    
    // Check existing tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`\n📋 Found ${tables.length} existing tables:`);
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    
    if (tables.length === 0) {
      console.log("\n⚠️  No tables found. Database needs to be initialized.");
      console.log("Run: tsx scripts/database-setup/initialize-database.ts");
    }
    
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
    process.exit(1);
  }
}

testConnection();