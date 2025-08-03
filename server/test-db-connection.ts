#!/usr/bin/env tsx

/**
 * Simple database connection test
 * Run this to verify database connectivity before starting the app
 */

import 'dotenv/config';
import postgres from 'postgres';

async function testDatabaseConnection() {
  const {DATABASE_URL} = process.env;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔍 Testing database connection...');
  console.log('Database URL:', DATABASE_URL.replace(/:[^:@]*@/, ':***@')); // Hide password

  let sql: postgres.Sql | undefined;

  try {
    // Create connection with minimal config
    sql = postgres(DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });

    // Test basic connectivity
    const result = await sql`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Database connection successful!');
    console.log('Test result:', result[0]);

    // Test if basic tables exist
    try {
      const tableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'properties', 'reviews')
      `;
      
      if (tableCheck.length > 0) {
        console.log('✅ Found existing tables:', tableCheck.map(t => t.table_name).join(', '));
      } else {
        console.log('⚠️  No application tables found - database may need migration');
      }
    } catch (error) {
      console.log('⚠️  Could not check for tables (this is normal for new databases)');
    }

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

// Run the test
testDatabaseConnection().catch(console.error);