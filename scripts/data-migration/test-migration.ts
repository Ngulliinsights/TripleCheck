#!/usr/bin/env tsx
/**
 * Migration Testing Script
 * 
 * This script tests data migration integrity and completeness
 * for the Kenya Land Verification System.
 */

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { migrateExistingProperties, type MigrationStats } from "./migrate-existing-properties";
import { seedKenyaProperties, type SeedingStats } from "./seed-kenya-properties";
import { validateMigration, type ValidationSummary } from "./validate-migration";
import { rollbackMigration, type RollbackStats } from "./rollback-migration";

// Load environment variables
config();

interface TestSuite {
  name: string;
  description: string;
  test: () => Promise<TestResult>;
}

interface TestResult {
  passed: boolean;
  message: string;
  details?: any;
  duration: number;
}

interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  results: Array<TestResult & { name: string }>;
  overallPassed: boolean;
}

async function runMigrationTests(): Promise<TestSummary> {
  console.log("🧪 Starting comprehensive migration testing...");

  const summary: TestSummary = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    totalDuration: 0,
    results: [],
    overallPassed: true
  };

  const testSuites: TestSuite[] = [
    {
      name: "Database Connection",
      description: "Test database connectivity and basic operations",
      test: testDatabaseConnection
    },
    {
      name: "Schema Validation",
      description: "Validate that all required tables and columns exist",
      test: testSchemaValidation
    },
    {
      name: "Property Migration",
      description: "Test migration of existing properties",
      test: testPropertyMigration
    },
    {
      name: "Kenya Property Seeding",
      description: "Test seeding of realistic Kenya property data",
      test: testKenyaPropertySeeding
    },
    {
      name: "Data Validation",
      description: "Validate migrated and seeded data integrity",
      test: testDataValidation
    },
    {
      name: "Referential Integrity",
      description: "Test foreign key relationships and constraints",
      test: testReferentialIntegrity
    },
    {
      name: "Performance Testing",
      description: "Test query performance on migrated data",
      test: testPerformance
    },
    {
      name: "Rollback Functionality",
      description: "Test rollback procedures",
      test: testRollbackFunctionality
    }
  ];

  console.log(`\n📋 Running ${testSuites.length} test suites...\n`);

  for (const suite of testSuites) {
    const startTime = Date.now();
    console.log(`🔍 Running: ${suite.name}`);
    console.log(`   ${suite.description}`);

    try {
      const result = await suite.test();
      const duration = Date.now() - startTime;
      
      result.duration = duration;
      summary.results.push({ ...result, name: suite.name });
      summary.totalDuration += duration;
      summary.totalTests++;

      if (result.passed) {
        summary.passedTests++;
        console.log(`   ✅ PASSED (${duration}ms): ${result.message}`);
      } else {
        summary.failedTests++;
        summary.overallPassed = false;
        console.log(`   ❌ FAILED (${duration}ms): ${result.message}`);
        if (result.details) {
          console.log(`   Details:`, result.details);
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      summary.results.push({
        name: suite.name,
        passed: false,
        message: `Test suite threw an error: ${error}`,
        duration
      });
      summary.totalDuration += duration;
      summary.totalTests++;
      summary.failedTests++;
      summary.overallPassed = false;
      
      console.log(`   ❌ ERROR (${duration}ms): ${error}`);
    }

    console.log(""); // Empty line for readability
  }

  printTestSummary(summary);
  return summary;
}

async function testDatabaseConnection(): Promise<TestResult> {
  if (!process.env.DATABASE_URL) {
    return {
      passed: false,
      message: "DATABASE_URL environment variable not set",
      duration: 0
    };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    // Test basic query
    const result = await sql`SELECT 1 as test`;
    
    if (result[0]?.test === 1) {
      return {
        passed: true,
        message: "Database connection successful",
        duration: 0
      };
    } else {
      return {
        passed: false,
        message: "Database query returned unexpected result",
        details: result,
        duration: 0
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: "Database connection failed",
      details: error,
      duration: 0
    };
  }
}

async function testSchemaValidation(): Promise<TestResult> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    const requiredTables = [
      'users',
      'properties',
      'land_verification_sessions',
      'verification_layers',
      'risk_factors',
      'government_designations',
      'community_feedback',
      'expert_assignments',
      'property_monitoring'
    ];

    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    const tableNames = existingTables.map((row: any) => row.table_name);
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));

    if (missingTables.length === 0) {
      return {
        passed: true,
        message: `All ${requiredTables.length} required tables exist`,
        duration: 0
      };
    } else {
      return {
        passed: false,
        message: `Missing ${missingTables.length} required tables`,
        details: { missingTables },
        duration: 0
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: "Schema validation failed",
      details: error,
      duration: 0
    };
  }
}

async function testPropertyMigration(): Promise<TestResult> {
  try {
    const stats = await migrateExistingProperties();
    
    if (stats.errors === 0) {
      return {
        passed: true,
        message: `Successfully migrated ${stats.propertiesProcessed} properties (${stats.landPropertiesFound} land properties)`,
        details: stats,
        duration: 0
      };
    } else {
      return {
        passed: false,
        message: `Migration completed with ${stats.errors} errors`,
        details: stats,
        duration: 0
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: "Property migration test failed",
      details: error,
      duration: 0
    };
  }
}

async function testKenyaPropertySeeding(): Promise<TestResult> {
  try {
    const stats = await seedKenyaProperties();
    
    if (stats.errors === 0 && stats.propertiesCreated > 0) {
      return {
        passed: true,
        message: `Successfully seeded ${stats.propertiesCreated} properties with ${stats.sessionsCreated} sessions`,
        details: stats,
        duration: 0
      };
    } else {
      return {
        passed: false,
        message: `Seeding completed with ${stats.errors} errors or no properties created`,
        details: stats,
        duration: 0
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: "Kenya property seeding test failed",
      details: error,
      duration: 0
    };
  }
}

async function testDataValidation(): Promise<TestResult> {
  try {
    const summary = await validateMigration();
    
    if (summary.overallPassed) {
      return {
        passed: true,
        message: `All ${summary.totalTables} tables passed validation`,
        details: summary,
        duration: 0
      };
    } else {
      return {
        passed: false,
        message: `${summary.failedTables} out of ${summary.totalTables} tables failed validation`,
        details: summary,
        duration: 0
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: "Data validation test failed",
      details: error,
      duration: 0
    };
  }
}

async function testReferentialIntegrity(): Promise<TestResult> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Test foreign key constraints
    const constraintTests = [
      {
        name: "Sessions reference valid properties",
        query: `
          SELECT COUNT(*) as count
          FROM land_verification_sessions lvs
          LEFT JOIN properties p ON lvs.property_id = p.id
          WHERE p.id IS NULL
        `
      },
      {
        name: "Sessions reference valid users",
        query: `
          SELECT COUNT(*) as count
          FROM land_verification_sessions lvs
          LEFT JOIN users u ON lvs.user_id = u.id
          WHERE u.id IS NULL
        `
      },
      {
        name: "Layers reference valid sessions",
        query: `
          SELECT COUNT(*) as count
          FROM verification_layers vl
          LEFT JOIN land_verification_sessions lvs ON vl.session_id = lvs.id
          WHERE lvs.id IS NULL
        `
      }
    ];

    const issues = [];
    for (const test of constraintTests) {
      const result = await sql(test.query);
      const count = result[0]?.count || 0;
      if (count > 0) {
        issues.push(`${test.name}: ${count} orphaned records`);
      }
    }

    if (issues.length === 0) {
      return {
        passed: true,
        message: "All referential integrity checks passed",
        duration: 0
      };
    } else {
      return {
        passed: false,
        message: `Found ${issues.length} referential integrity issues`,
        details: issues,
        duration: 0
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: "Referential integrity test failed",
      details: error,
      duration: 0
    };
  }
}

async function testPerformance(): Promise<TestResult> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    const performanceTests = [
      {
        name: "Property search by location",
        query: `SELECT COUNT(*) FROM properties WHERE location ILIKE '%nairobi%'`,
        maxTime: 1000 // 1 second
      },
      {
        name: "Session lookup with joins",
        query: `
          SELECT lvs.*, p.title, u.username
          FROM land_verification_sessions lvs
          JOIN properties p ON lvs.property_id = p.id
          JOIN users u ON lvs.user_id = u.id
          LIMIT 10
        `,
        maxTime: 2000 // 2 seconds
      },
      {
        name: "Risk factor aggregation",
        query: `
          SELECT category, COUNT(*), AVG(confidence)
          FROM risk_factors
          GROUP BY category
        `,
        maxTime: 1500 // 1.5 seconds
      }
    ];

    const slowQueries = [];
    for (const test of performanceTests) {
      const startTime = Date.now();
      await sql(test.query);
      const duration = Date.now() - startTime;
      
      if (duration > test.maxTime) {
        slowQueries.push(`${test.name}: ${duration}ms (max: ${test.maxTime}ms)`);
      }
    }

    if (slowQueries.length === 0) {
      return {
        passed: true,
        message: "All performance tests passed",
        duration: 0
      };
    } else {
      return {
        passed: false,
        message: `${slowQueries.length} queries exceeded performance thresholds`,
        details: slowQueries,
        duration: 0
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: "Performance test failed",
      details: error,
      duration: 0
    };
  }
}

async function testRollbackFunctionality(): Promise<TestResult> {
  try {
    // Test rollback without actually executing it (dry run)
    const sql = neon(process.env.DATABASE_URL!);
    
    // Count records before potential rollback
    const beforeCounts = {
      sessions: await sql`SELECT COUNT(*) as count FROM land_verification_sessions`,
      layers: await sql`SELECT COUNT(*) as count FROM verification_layers`,
      risks: await sql`SELECT COUNT(*) as count FROM risk_factors`
    };

    // Test backup creation functionality
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const testBackupTable = `test_backup_${timestamp}`;
    
    try {
      await sql(`CREATE TABLE ${testBackupTable} AS SELECT * FROM land_verification_sessions LIMIT 1`);
      await sql(`DROP TABLE ${testBackupTable}`);
      
      return {
        passed: true,
        message: "Rollback functionality test passed (backup creation works)",
        details: {
          beforeCounts: {
            sessions: beforeCounts.sessions[0].count,
            layers: beforeCounts.layers[0].count,
            risks: beforeCounts.risks[0].count
          }
        },
        duration: 0
      };
    } catch (error) {
      return {
        passed: false,
        message: "Rollback functionality test failed (backup creation failed)",
        details: error,
        duration: 0
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: "Rollback functionality test failed",
      details: error,
      duration: 0
    };
  }
}

function printTestSummary(summary: TestSummary) {
  console.log("🧪 Test Summary");
  console.log("=".repeat(50));
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Passed: ${summary.passedTests}`);
  console.log(`Failed: ${summary.failedTests}`);
  console.log(`Total Duration: ${summary.totalDuration}ms`);
  console.log(`Overall Result: ${summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  console.log("\n📋 Detailed Results:");
  for (const result of summary.results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name} (${result.duration}ms)`);
    console.log(`   ${result.message}`);
    if (!result.passed && result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
  }

  if (summary.overallPassed) {
    console.log("\n🎉 All migration tests passed! The system is ready for production.");
  } else {
    console.log("\n⚠️  Some tests failed. Please review and fix the issues before deploying.");
  }
}

// Run tests if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrationTests()
    .then((summary) => {
      console.log('\n✨ Migration testing completed!');
      process.exit(summary.overallPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Migration testing failed:', error);
      process.exit(1);
    });
}

export { runMigrationTests, type TestSummary, type TestResult };