#!/usr/bin/env node

/**
 * CLI script to run data generation for TripleCheck
 * Usage: node scripts/run-data-generation.js [users] [properties] [reviews]
 */

import { generateTestData } from './data-generator.js';

async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const numUsers = parseInt(args[0]) || 200;
  const numProperties = parseInt(args[1]) || 100; 
  const numReviews = parseInt(args[2]) || 300;
  
  console.log('TripleCheck Data Generation Tool');
  console.log('================================');
  console.log(`Target: ${numUsers} users, ${numProperties} properties, ${numReviews} reviews\n`);
  
  try {
    await generateTestData({
      numUsers,
      numProperties, 
      numReviews
    });
    
    console.log('\n✅ Data generation completed successfully!');
    console.log('📊 Check data-generation-report.json for detailed statistics');
    
  } catch (error) {
    console.error('\n❌ Data generation failed:', error.message);
    process.exit(1);
  }
}

main();