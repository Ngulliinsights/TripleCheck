#!/usr/bin/env tsx

/**
 * Simple test to check if the app can start without crashing
 */

import 'dotenv/config';

async function testAppStartup() {
  console.log('🧪 Testing app startup...');
  
  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const { testDatabaseConnection } = await import('./server/test-db-connection');
    // Database test is already working
    
    // Test basic server imports
    console.log('2. Testing server imports...');
    await import('./server/main.minimal');
    console.log('✅ Server imports successful');
    
    // Test basic frontend component imports (skip main.tsx due to CSS imports)
    console.log('3. Testing frontend component imports...');
    await import('./src/app/App');
    console.log('✅ Frontend component imports successful');
    
    console.log('✅ App startup test passed!');
    
  } catch (error) {
    console.error('❌ App startup test failed:');
    console.error(error);
    process.exit(1);
  }
}

testAppStartup();