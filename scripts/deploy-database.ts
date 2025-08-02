#!/usr/bin/env tsx
/**
 * Complete Database Deployment Script
 * 
 * This script handles the complete database setup process:
 * 1. Creates all database tables from schema
 * 2. Loads data using the robust batch loader
 * 3. Validates the deployment
 */

import "dotenv/config";
import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";

const logger = {
  info: (message: string) => console.log(`ℹ️  ${message}`),
  success: (message: string) => console.log(`✅ ${message}`),
  warn: (message: string) => console.warn(`⚠️  ${message}`),
  error: (message: string) => console.error(`❌ ${message}`),
  step: (step: number, message: string) => console.log(`\n🔄 Step ${step}: ${message}`),
};

interface DeploymentResult {
  success: boolean;
  steps: {
    environmentCheck: boolean;
    tableCreation: boolean;
    dataLoading: boolean;
    validation: boolean;
  };
  errors: string[];
  duration: number;
}

async function checkEnvironment(): Promise<boolean> {
  logger.info("Checking environment setup...");

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    logger.error("DATABASE_URL environment variable is required");
    return false;
  }

  // Check if data files exist
  const dataFiles = [
    "scripts/data-generation/fraudulent_user_dataset.json",
    "scripts/data-generation/fraudulent_property_dataset.json"
  ];

  for (const file of dataFiles) {
    if (!existsSync(file)) {
      logger.error(`Required data file not found: ${file}`);
      return false;
    }
  }

  logger.success("Environment check passed");
  return true;
}

async function createDatabaseTables(): Promise<boolean> {
  logger.info("Creating database tables...");
  
  try {
    // Run the database initialization script
    execSync("tsx scripts/database-setup/initialize-database.ts", {
      stdio: "inherit",
      cwd: process.cwd()
    });
    
    logger.success("Database tables created successfully");
    return true;
  } catch (error) {
    logger.error(`Failed to create database tables: ${error}`);
    return false;
  }
}

async function loadData(): Promise<boolean> {
  logger.info("Loading data into database...");
  
  try {
    // Run the robust batch loader
    execSync("tsx scripts/data-migration/robust-batch-loader.ts", {
      stdio: "inherit",
      cwd: process.cwd()
    });
    
    logger.success("Data loaded successfully");
    return true;
  } catch (error) {
    logger.error(`Failed to load data: ${error}`);
    return false;
  }
}

async function validateDeployment(): Promise<boolean> {
  logger.info("Validating database deployment...");
  
  try {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { users, properties, reviews } = await import("../src/shared/schema");
    
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    // Check if tables exist and have data
    const userCount = await db.select().from(users);
    const propertyCount = await db.select().from(properties);
    const reviewCount = await db.select().from(reviews);

    logger.info(`Validation results:`);
    logger.info(`  - Users: ${userCount.length}`);
    logger.info(`  - Properties: ${propertyCount.length}`);
    logger.info(`  - Reviews: ${reviewCount.length}`);

    if (userCount.length === 0 || propertyCount.length === 0) {
      logger.error("Database validation failed: No data found");
      return false;
    }

    logger.success("Database validation passed");
    return true;
  } catch (error) {
    logger.error(`Database validation failed: ${error}`);
    return false;
  }
}

async function deployDatabase(): Promise<DeploymentResult> {
  const startTime = Date.now();
  const result: DeploymentResult = {
    success: true,
    steps: {
      environmentCheck: false,
      tableCreation: false,
      dataLoading: false,
      validation: false
    },
    errors: [],
    duration: 0
  };

  logger.info("🚀 Starting Complete Database Deployment");
  logger.info("=" .repeat(60));

  try {
    // Step 1: Environment Check
    logger.step(1, "Environment Check");
    result.steps.environmentCheck = await checkEnvironment();
    if (!result.steps.environmentCheck) {
      result.errors.push("Environment check failed");
      result.success = false;
      return result;
    }

    // Step 2: Create Database Tables
    logger.step(2, "Create Database Tables");
    result.steps.tableCreation = await createDatabaseTables();
    if (!result.steps.tableCreation) {
      result.errors.push("Database table creation failed");
      result.success = false;
      return result;
    }

    // Step 3: Load Data
    logger.step(3, "Load Data");
    result.steps.dataLoading = await loadData();
    if (!result.steps.dataLoading) {
      result.errors.push("Data loading failed");
      result.success = false;
      return result;
    }

    // Step 4: Validate Deployment
    logger.step(4, "Validate Deployment");
    result.steps.validation = await validateDeployment();
    if (!result.steps.validation) {
      result.errors.push("Deployment validation failed");
      result.success = false;
      return result;
    }

    result.duration = Date.now() - startTime;
    
    // Success summary
    logger.info("\n" + "=" .repeat(60));
    logger.success("🎉 DATABASE DEPLOYMENT COMPLETED SUCCESSFULLY!");
    logger.info("=" .repeat(60));
    logger.info(`Total Duration: ${(result.duration / 1000).toFixed(2)} seconds`);
    logger.info("");
    logger.info("✅ Your database is now ready with:");
    logger.info("   - All required tables created");
    logger.info("   - Sample data loaded");
    logger.info("   - Land verification system ready");
    logger.info("   - Fraud detection system ready");
    logger.info("   - Community resources ready");
    logger.info("");
    logger.info("🔗 You can now:");
    logger.info("   - Start your application server");
    logger.info("   - Test the land verification endpoints");
    logger.info("   - Access the property management features");
    logger.info("   - Use the fraud detection system");
    logger.info("");
    logger.info("🚀 Ready for deployment!");

  } catch (error) {
    result.success = false;
    result.errors.push(`Deployment failed: ${error}`);
    result.duration = Date.now() - startTime;
    
    logger.error("\n" + "=" .repeat(60));
    logger.error("❌ DATABASE DEPLOYMENT FAILED");
    logger.error("=" .repeat(60));
    logger.error(`Duration: ${(result.duration / 1000).toFixed(2)} seconds`);
    logger.error(`Errors: ${result.errors.length}`);
    result.errors.forEach((error, index) => {
      logger.error(`   ${index + 1}. ${error}`);
    });
  }

  return result;
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log("Complete Database Deployment Tool");
    console.log("");
    console.log("Usage: tsx scripts/deploy-database.ts [options]");
    console.log("");
    console.log("This script will:");
    console.log("  1. Check environment setup");
    console.log("  2. Create all database tables");
    console.log("  3. Load sample data");
    console.log("  4. Validate the deployment");
    console.log("");
    console.log("Options:");
    console.log("  --help, -h      Show this help message");
    console.log("");
    console.log("Environment Variables Required:");
    console.log("  DATABASE_URL    PostgreSQL connection string");
    return;
  }

  const result = await deployDatabase();
  process.exit(result.success ? 0 : 1);
}

// Run main if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error(`Deployment failed: ${error}`);
    process.exit(1);
  });
}

export { deployDatabase };