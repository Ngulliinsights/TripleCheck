#!/usr/bin/env tsx
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function checkTableStructure() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    console.log("🔍 Checking users table structure...");
    
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log("\n📋 Users table columns:");
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log("\n🔍 Checking properties table structure...");
    
    const propColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'properties' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log("\n📋 Properties table columns:");
    propColumns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error("❌ Failed to check table structure:", error);
  }
}

checkTableStructure();