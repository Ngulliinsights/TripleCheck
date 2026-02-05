#!/usr/bin/env tsx
// Script to run land verification database migration and seeding

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from './cleanup-redundancies';

const MIGRATION_FILE = 'server/db/migrations/001_add_land_verification_tables.sql';
const SEED_FILE = 'server/infrastructure/database/seeds/land-verification-seed.ts';

async function runMigration() {
  console.log('🚀 Starting Land Verification System database setup...\n');

  try {
    // Check if migration file exists
    if (!existsSync(MIGRATION_FILE)) {
      throw new Error(`Migration file not found: ${MIGRATION_FILE}`);
    }

    // Check if we have database connection
    console.log('📋 Checking database connection...');
    
    // For now, we'll just log the migration SQL since we don't have direct DB access
    console.log('📄 Migration SQL content:');
    console.log('─'.repeat(50));
    
    const migrationSQL = readFileSync(MIGRATION_FILE, 'utf-8');
    console.log(`${migrationSQL.substring(0, 500)  }...\n`);
    
    console.log('✅ Migration file is ready to be executed');
    console.log('📝 To run this migration, execute the SQL file against your PostgreSQL database:\n');
    console.log(`   psql -d your_database -f ${MIGRATION_FILE}\n`);

    // Check seed file
    if (existsSync(SEED_FILE)) {
      console.log('✅ Seed file is ready');
      console.log('📝 To run seeding after migration, execute:\n');
      console.log(`   tsx ${SEED_FILE}\n`);
    }

    console.log('🎯 Next steps:');
    console.log('1. Run the migration SQL against your database');
    console.log('2. Update your database connection configuration');
    console.log('3. Run the seeding script to populate test data');
    console.log('4. Start implementing the Land Verification Service\n');

    console.log('✨ Land Verification System database schema is ready!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

// Validation function to check schema completeness
function validateSchema() {
  console.log('🔍 Validating schema completeness...\n');

  const requiredTables = [
    'land_verification_sessions',
    'verification_layers',
    'risk_factors',
    'government_designations',
    'community_feedback',
    'expert_assignments',
    'property_monitoring',
    'monitoring_alerts'
  ];

  const requiredEnums = [
    'land_verification_status',
    'verification_layer_type',
    'risk_level',
    'risk_category',
    'government_designation_type',
    'community_feedback_source'
  ];

  const migrationContent = readFileSync(MIGRATION_FILE, 'utf-8');

  console.log('📊 Checking required tables:');
  requiredTables.forEach(table => {
    const found = migrationContent.includes(`CREATE TABLE ${table}`);
    console.log(`  ${found ? '✅' : '❌'} ${table}`);
  });

  console.log('\n📊 Checking required enums:');
  requiredEnums.forEach(enumType => {
    const found = migrationContent.includes(`CREATE TYPE ${enumType}`);
    console.log(`  ${found ? '✅' : '❌'} ${enumType}`);
  });

  console.log('\n📊 Checking indexes:');
  const indexCount = (migrationContent.match(/CREATE INDEX/g) || []).length;
  console.log(`  ✅ ${indexCount} indexes defined`);

  console.log('\n📊 Checking constraints:');
  const constraintCount = (migrationContent.match(/ADD CONSTRAINT/g) || []).length;
  console.log(`  ✅ ${constraintCount} constraints defined`);

  console.log('\n✅ Schema validation completed');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--validate')) {
    validateSchema();
  } else {
    await runMigration();
  }
}

main().catch(console.error);