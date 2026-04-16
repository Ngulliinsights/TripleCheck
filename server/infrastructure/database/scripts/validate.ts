#!/usr/bin/env tsx
/**
 * Database Validation Script
 * 
 * Quick script to validate database connection and data
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../../../../src/shared/schema";

const logger = {
  info: (message: string) => console.log(`ℹ️  ${message}`),
  success: (message: string) => console.log(`✅ ${message}`),
  warn: (message: string) => console.warn(`⚠️  ${message}`),
  error: (message: string) => console.error(`❌ ${message}`),
};

async function validateDatabase() {
  try {
    logger.info("Validating database connection and data...");

    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql, { schema });

    // Test basic connection
    logger.info("Testing database connection...");
    await sql`SELECT 1 as test`;
    logger.success("Database connection successful");

    // Check if tables exist
    logger.info("Checking if tables exist...");
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    logger.info(`Found ${tables.length} tables:`);
    tables.forEach((table: any) => {
      logger.info(`  - ${table.table_name}`);
    });

    // Check data counts
    logger.info("Checking data counts...");
    
    try {
      const userCount = await db.select().from(schema.users);
      logger.info(`Users: ${userCount.length}`);
    } catch (error) {
      logger.warn("Users table not accessible or empty");
    }

    try {
      const propertyCount = await db.select().from(schema.properties);
      logger.info(`Properties: ${propertyCount.length}`);
    } catch (error) {
      logger.warn("Properties table not accessible or empty");
    }

    try {
      const reviewCount = await db.select().from(schema.reviews);
      logger.info(`Reviews: ${reviewCount.length}`);
    } catch (error) {
      logger.warn("Reviews table not accessible or empty");
    }

    // Check land verification tables
    try {
      const sessionCount = await db.select().from(schema.landVerificationSessions);
      logger.info(`Land Verification Sessions: ${sessionCount.length}`);
    } catch (error) {
      logger.warn("Land verification sessions table not accessible or empty");
    }

    logger.success("Database validation completed");
    return true;

  } catch (error) {
    logger.error(`Database validation failed: ${error}`);
    return false;
  }
}

async function main() {
  const success = await validateDatabase();
  process.exit(success ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateDatabase };