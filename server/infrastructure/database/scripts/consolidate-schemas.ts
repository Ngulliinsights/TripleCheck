#!/usr/bin/env tsx

/**
 * Schema Consolidation Script
 * 
 * Runs the database schema consolidation process to unify
 * fragmented schemas into a single, optimized structure.
 */

import postgres from '../../../../scripts/cleanup-redundancies';

import { runSchemaConsolidation } from '../migrations/core/consolidate-schemas';

async function main() {
  console.log('🚀 Starting database schema consolidation...');
  
  // Get database connection string
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ No database connection string found. Please set DATABASE_URL or POSTGRES_URL environment variable.');
    process.exit(1);
  }

  let sql: postgres.Sql | null = null;

  try {
    // Initialize database connection
    sql = postgres(connectionString, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    console.log('✅ Database connection established');

    // Run schema consolidation
    const result = await runSchemaConsolidation(sql);

    // Display results
    console.log('\n📊 Schema Consolidation Results:');
    console.log('================================');
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    console.log(`Tables Created: ${result.tablesCreated.length}`);
    console.log(`Indexes Created: ${result.indexesCreated.length}`);
    console.log(`Constraints Added: ${result.constraintsAdded.length}`);
    console.log(`Errors: ${result.errors.length}`);
    console.log(`Warnings: ${result.warnings.length}`);

    if (result.tablesCreated.length > 0) {
      console.log('\n📋 Tables Created:');
      result.tablesCreated.forEach(table => console.log(`  - ${table}`));
    }

    if (result.indexesCreated.length > 0) {
      console.log('\n🔍 Indexes Created:');
      result.indexesCreated.forEach(index => console.log(`  - ${index}`));
    }

    if (result.constraintsAdded.length > 0) {
      console.log('\n🔗 Constraints Added:');
      result.constraintsAdded.forEach(constraint => console.log(`  - ${constraint}`));
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (result.success) {
      console.log('\n🎉 Schema consolidation completed successfully!');
      console.log('\n📝 Next Steps:');
      console.log('1. Update your imports to use: import { users, properties } from "..\schemas\consolidated"');
      console.log('2. Remove old schema imports from server/infrastructure/database/schemas/consolidated and server/infrastructure/database/schemas/');
      console.log('3. Run your application tests to ensure everything works correctly');
      console.log('4. Consider running the data generation scripts to populate the new tables');
    } else {
      console.log('\n💥 Schema consolidation failed. Please review the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Schema consolidation failed with unexpected error:', error);
    process.exit(1);
  } finally {
    // Clean up database connection
    if (sql) {
      try {
        await sql.end({ timeout: 5 });
        console.log('✅ Database connection closed');
      } catch (error) {
        console.warn('⚠️ Warning: Error closing database connection:', error);
      }
    }
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Schema consolidation interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Schema consolidation terminated');
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error('❌ Unexpected error in schema consolidation:', error);
  process.exit(1);
});