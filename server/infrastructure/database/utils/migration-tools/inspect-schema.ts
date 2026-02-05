#!/usr/bin/env tsx
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function inspectSchema() {
  try {
    console.log('🔍 Inspecting Database Schema...');
    
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check what tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('\n📋 Tables in database:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Check users table structure if it exists
    if (tables.some(t => t.table_name === 'users')) {
      console.log('\n👥 Users table columns:');
      const userColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      userColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    // Check properties table structure if it exists
    if (tables.some(t => t.table_name === 'properties')) {
      console.log('\n🏠 Properties table columns:');
      const propertyColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'properties' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      propertyColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    // Check reviews table structure if it exists
    if (tables.some(t => t.table_name === 'reviews')) {
      console.log('\n⭐ Reviews table columns:');
      const reviewColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'reviews' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      reviewColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Schema inspection failed:', error);
  }
}

inspectSchema();