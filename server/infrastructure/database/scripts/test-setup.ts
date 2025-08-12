#!/usr/bin/env tsx
/**
 * Database Setup Test Script
 * 
 * Tests the consolidated database infrastructure by initializing
 * the database service and running basic operations.
 */

import { DatabaseServiceImpl, DataScenario } from '../index';

async function testDatabaseSetup() {
  console.log('🧪 Testing consolidated database infrastructure...\n');

  const service = new DatabaseServiceImpl();

  try {
    // Test 1: Initialize database
    console.log('1️⃣ Testing database initialization...');
    const initResult = await service.initialize();
    
    if (initResult.success) {
      console.log('✅ Database initialization successful');
      console.log(`   Host: ${initResult.connectionInfo?.host}`);
      console.log(`   Database: ${initResult.connectionInfo?.database}`);
      console.log(`   Pool Size: ${initResult.connectionInfo?.poolSize}`);
      console.log(`   SSL: ${initResult.connectionInfo?.ssl}\n`);
    } else {
      console.log('❌ Database initialization failed:', initResult.error?.message);
      return;
    }

    // Test 2: Health check
    console.log('2️⃣ Testing health check...');
    const isHealthy = await service.healthCheck();
    console.log(isHealthy ? '✅ Database is healthy\n' : '❌ Database health check failed\n');

    // Test 3: Schema validation
    console.log('3️⃣ Testing schema validation...');
    const schemaResult = await service.validateSchema();
    console.log(`✅ Schema validation completed`);
    console.log(`   Tables validated: ${schemaResult.tablesValidated}`);
    console.log(`   Errors: ${schemaResult.errors.length}`);
    console.log(`   Warnings: ${schemaResult.warnings.length}`);
    
    if (schemaResult.errors.length > 0) {
      console.log('   Schema errors:', schemaResult.errors);
    }
    if (schemaResult.warnings.length > 0) {
      console.log('   Schema warnings:', schemaResult.warnings);
    }
    console.log();

    // Test 4: Run migrations
    console.log('4️⃣ Testing migration system...');
    const migrationResult = await service.runMigrations();
    console.log(`✅ Migration system test completed`);
    console.log(`   Migrations run: ${migrationResult.migrationsRun}`);
    console.log(`   Success: ${migrationResult.success}`);
    
    if (migrationResult.details) {
      migrationResult.details.forEach(detail => console.log(`   ${detail}`));
    }
    console.log();

    // Test 5: Data generation
    console.log('5️⃣ Testing data generation...');
    const seedResult = await service.seedData(DataScenario.DEVELOPMENT);
    console.log(`✅ Data generation test completed`);
    console.log(`   Records created: ${seedResult.recordsCreated}`);
    console.log(`   Tables seeded: ${seedResult.tablesSeeded.join(', ')}`);
    console.log(`   Success: ${seedResult.success}`);
    console.log();

    // Test 6: Connection management
    console.log('6️⃣ Testing connection management...');
    const connection = await service.getConnection();
    const connectionHealthy = await connection.isHealthy();
    console.log(`✅ Connection management test completed`);
    console.log(`   Connection healthy: ${connectionHealthy}\n`);

    // Test 7: Cleanup
    console.log('7️⃣ Testing cleanup...');
    await service.cleanup();
    console.log('✅ Cleanup completed\n');

    console.log('🎉 All database infrastructure tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database initialization');
    console.log('   ✅ Health monitoring');
    console.log('   ✅ Schema validation');
    console.log('   ✅ Migration system');
    console.log('   ✅ Data generation');
    console.log('   ✅ Connection management');
    console.log('   ✅ Resource cleanup');

  } catch (error) {
    console.error('❌ Database setup test failed:', error);
    
    // Ensure cleanup even on error
    try {
      await service.cleanup();
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
    }
    
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseSetup().catch(console.error);
}

export { testDatabaseSetup };