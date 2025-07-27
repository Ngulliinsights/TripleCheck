#!/usr/bin/env node

/**
 * Database Reset and Reseed Script
 * 
 * This script clears all data and reseeds the database with fresh sample data.
 * Useful for development and testing.
 * 
 * Usage:
 *   npm run db:reset
 *   or
 *   npx tsx server/scripts/reset-database.ts
 */

import 'dotenv/config';
import { initializeDatabase, runMigrations, seedDatabase, closeDatabaseConnection } from '../server/infrastructure/database/connection';

async function resetDatabase() {
  console.log('🔄 Starting database reset process...\n');

  try {
    // Initialize database connection
    console.log('1️⃣ Initializing database connection...');
    const initResult = await initializeDatabase();
    
    if (!initResult.success) {
      throw new Error(`Database initialization failed: ${initResult.error}`);
    }
    console.log('✅ Database connection established\n');

    // Run migrations
    console.log('2️⃣ Running database migrations...');
    const migrationResult = await runMigrations();
    
    if (!migrationResult.success) {
      throw new Error(`Migration failed: ${migrationResult.error}`);
    }
    console.log('✅ Database migrations completed\n');

    // Seed database with sample data
    console.log('3️⃣ Seeding database with sample data...');
    await seedDatabase();
    console.log('✅ Database seeding completed\n');

    console.log('🎉 Database reset completed successfully!');
    console.log('\n📋 What was created:');
    console.log('   ✓ 6 sample users with different roles');
    console.log('   ✓ 10 diverse properties across multiple locations');
    console.log('   ✓ 9 property reviews with various ratings');
    console.log('   ✓ Community trust data (if tables exist)');
    console.log('\n🧪 Ready for testing:');
    console.log('   • Search functionality');
    console.log('   • Property listings');
    console.log('   • User authentication');
    console.log('   • Review system');
    console.log('   • Trust scoring');
    console.log('\n🔍 Try searching for:');
    console.log('   • Property types: "apartment", "house", "studio"');
    console.log('   • Locations: "Nairobi", "Mombasa", "Nakuru"');
    console.log('   • Features: "modern", "luxury", "garden", "beach"');

  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await closeDatabaseConnection();
    process.exit(0);
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetDatabase();
}

export { resetDatabase };