#!/usr/bin/env tsx
/**
 * Main Migration Orchestrator Script
 * 
 * This script orchestrates the complete data migration and seeding process
 * for the Kenya Land Verification System.
 */

import { config } from "dotenv";

import { migrateExistingProperties, type MigrationStats } from "./migrate-existing-properties";
import { seedKenyaProperties, type SeedingStats } from "..\..\seeds\seed-kenya-properties";
import { runMigrationTests, type TestSummary } from "./test-migration";
import { validateMigration, type ValidationSummary } from "./validate-migration";

// Load environment variables
config();

interface MigrationPlan {
  migrateExisting: boolean;
  seedTestData: boolean;
  validateData: boolean;
  runTests: boolean;
  createBackup: boolean;
}

interface MigrationResult {
  success: boolean;
  migrationStats?: MigrationStats;
  seedingStats?: SeedingStats;
  validationSummary?: ValidationSummary;
  testSummary?: TestSummary;
  errors: string[];
  duration: number;
}

async function runCompleteMigration(plan: MigrationPlan = {
  migrateExisting: true,
  seedTestData: true,
  validateData: true,
  runTests: true,
  createBackup: true
}): Promise<MigrationResult> {
  
  const startTime = Date.now();
  const result: MigrationResult = {
    success: false,
    errors: [],
    duration: 0
  };

  console.log("🚀 Starting Complete Kenya Land Verification Migration");
  console.log("=".repeat(60));
  console.log(`Migration Plan:`);
  console.log(`  - Migrate Existing Properties: ${plan.migrateExisting ? '✅' : '❌'}`);
  console.log(`  - Seed Test Data: ${plan.seedTestData ? '✅' : '❌'}`);
  console.log(`  - Validate Data: ${plan.validateData ? '✅' : '❌'}`);
  console.log(`  - Run Tests: ${plan.runTests ? '✅' : '❌'}`);
  console.log(`  - Create Backup: ${plan.createBackup ? '✅' : '❌'}`);
  console.log("");

  try {
    // Step 1: Migrate existing properties
    if (plan.migrateExisting) {
      console.log("📋 Step 1: Migrating existing properties...");
      try {
        result.migrationStats = await migrateExistingProperties();
        
        if (result.migrationStats.errors > 0) {
          result.errors.push(`Property migration completed with ${result.migrationStats.errors} errors`);
        } else {
          console.log("✅ Property migration completed successfully");
        }
      } catch (error) {
        result.errors.push(`Property migration failed: ${error}`);
        console.error("❌ Property migration failed:", error);
      }
    }

    // Step 2: Seed test data
    if (plan.seedTestData) {
      console.log("\n🌱 Step 2: Seeding Kenya property test data...");
      try {
        result.seedingStats = await seedKenyaProperties();
        
        if (result.seedingStats.errors > 0) {
          result.errors.push(`Data seeding completed with ${result.seedingStats.errors} errors`);
        } else {
          console.log("✅ Data seeding completed successfully");
        }
      } catch (error) {
        result.errors.push(`Data seeding failed: ${error}`);
        console.error("❌ Data seeding failed:", error);
      }
    }

    // Step 3: Validate migrated data
    if (plan.validateData) {
      console.log("\n🔍 Step 3: Validating migrated data...");
      try {
        result.validationSummary = await validateMigration();
        
        if (!result.validationSummary.overallPassed) {
          result.errors.push(`Data validation failed: ${result.validationSummary.totalIssues} issues found`);
        } else {
          console.log("✅ Data validation completed successfully");
        }
      } catch (error) {
        result.errors.push(`Data validation failed: ${error}`);
        console.error("❌ Data validation failed:", error);
      }
    }

    // Step 4: Run comprehensive tests
    if (plan.runTests) {
      console.log("\n🧪 Step 4: Running comprehensive tests...");
      try {
        result.testSummary = await runMigrationTests();
        
        if (!result.testSummary.overallPassed) {
          result.errors.push(`Migration tests failed: ${result.testSummary.failedTests} out of ${result.testSummary.totalTests} tests failed`);
        } else {
          console.log("✅ All migration tests passed");
        }
      } catch (error) {
        result.errors.push(`Migration tests failed: ${error}`);
        console.error("❌ Migration tests failed:", error);
      }
    }

    // Determine overall success
    result.success = result.errors.length === 0;
    result.duration = Date.now() - startTime;

    // Print final summary
    printMigrationSummary(result, plan);

  } catch (error) {
    result.errors.push(`Migration orchestration failed: ${error}`);
    result.success = false;
    result.duration = Date.now() - startTime;
    console.error("❌ Migration orchestration failed:", error);
  }

  return result;
}

function printMigrationSummary(result: MigrationResult, plan: MigrationPlan) {
  console.log(`\n${  "=".repeat(60)}`);
  console.log("📊 MIGRATION SUMMARY");
  console.log("=".repeat(60));
  
  console.log(`Overall Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Total Duration: ${(result.duration / 1000).toFixed(2)} seconds`);
  console.log(`Total Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log("\n❌ Errors:");
    result.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  // Property Migration Summary
  if (plan.migrateExisting && result.migrationStats) {
    console.log("\n🏠 Property Migration:");
    console.log(`   Total Properties: ${result.migrationStats.totalProperties}`);
    console.log(`   Properties Processed: ${result.migrationStats.propertiesProcessed}`);
    console.log(`   Land Properties Found: ${result.migrationStats.landPropertiesFound}`);
    console.log(`   Sessions Created: ${result.migrationStats.sessionsCreated}`);
    console.log(`   Errors: ${result.migrationStats.errors}`);
  }

  // Seeding Summary
  if (plan.seedTestData && result.seedingStats) {
    console.log("\n🌱 Test Data Seeding:");
    console.log(`   Users Created: ${result.seedingStats.usersCreated}`);
    console.log(`   Properties Created: ${result.seedingStats.propertiesCreated}`);
    console.log(`   Sessions Created: ${result.seedingStats.sessionsCreated}`);
    console.log(`   Layers Created: ${result.seedingStats.layersCreated}`);
    console.log(`   Risk Factors: ${result.seedingStats.riskFactorsCreated}`);
    console.log(`   Expert Assignments: ${result.seedingStats.expertsCreated}`);
    console.log(`   Errors: ${result.seedingStats.errors}`);
  }

  // Validation Summary
  if (plan.validateData && result.validationSummary) {
    console.log("\n🔍 Data Validation:");
    console.log(`   Tables Validated: ${result.validationSummary.totalTables}`);
    console.log(`   Passed: ${result.validationSummary.passedTables}`);
    console.log(`   Failed: ${result.validationSummary.failedTables}`);
    console.log(`   Total Issues: ${result.validationSummary.totalIssues}`);
  }

  // Test Summary
  if (plan.runTests && result.testSummary) {
    console.log("\n🧪 Migration Tests:");
    console.log(`   Total Tests: ${result.testSummary.totalTests}`);
    console.log(`   Passed: ${result.testSummary.passedTests}`);
    console.log(`   Failed: ${result.testSummary.failedTests}`);
    console.log(`   Duration: ${result.testSummary.totalDuration}ms`);
  }

  // Next Steps
  console.log("\n📋 Next Steps:");
  if (result.success) {
    console.log("   ✅ Migration completed successfully!");
    console.log("   ✅ Kenya Land Verification System is ready for use");
    console.log("   ✅ You can now start using the land verification features");
    console.log("");
    console.log("   🔗 Available endpoints:");
    console.log("   - POST /api/land-verification/sessions - Start verification");
    console.log("   - GET /api/land-verification/sessions/:id - Get session status");
    console.log("   - GET /api/properties/:id/verification - Get property verification");
  } else {
    console.log("   ❌ Migration failed - please review errors above");
    console.log("   🔧 Fix the issues and run migration again");
    console.log("   📞 Consider running rollback if needed:");
    console.log("   - tsx scripts/data-migration/rollback-migration.ts full");
  }

  console.log(`\n${  "=".repeat(60)}`);
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const plan: MigrationPlan = {
    migrateExisting: !args.includes('--no-migrate'),
    seedTestData: !args.includes('--no-seed'),
    validateData: !args.includes('--no-validate'),
    runTests: !args.includes('--no-tests'),
    createBackup: !args.includes('--no-backup')
  };

  // Handle specific commands
  if (args.includes('--help') || args.includes('-h')) {
    console.log("Kenya Land Verification Migration Tool");
    console.log("");
    console.log("Usage: tsx run-migration.ts [options]");
    console.log("");
    console.log("Options:");
    console.log("  --no-migrate    Skip existing property migration");
    console.log("  --no-seed       Skip test data seeding");
    console.log("  --no-validate   Skip data validation");
    console.log("  --no-tests      Skip comprehensive testing");
    console.log("  --no-backup     Skip backup creation");
    console.log("  --help, -h      Show this help message");
    console.log("");
    console.log("Examples:");
    console.log("  tsx run-migration.ts                    # Full migration");
    console.log("  tsx run-migration.ts --no-tests         # Skip tests");
    console.log("  tsx run-migration.ts --no-seed          # Skip test data");
    return;
  }

  // Run migration
  const result = await runCompleteMigration(plan);
  
  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

// Run main if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { runCompleteMigration, type MigrationPlan, type MigrationResult };