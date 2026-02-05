#!/usr/bin/env node

/**
 * Integration Test Execution Script
 * 
 * This script executes all integration tests for route modules and provides
 * comprehensive reporting on test coverage and results.
 */

import { IntegrationTestRunner } from './integration-test-runner';

async function main() {
  console.log('🚀 Starting Route Module Integration Test Suite...\n');
  console.log('This will test:');
  console.log('- All route module HTTP handling');
  console.log('- Authentication flows across modules');
  console.log('- Input validation and sanitization');
  console.log('- Error handling consistency');
  console.log('- API response format validation');
  console.log('- Cross-module integrations');
  console.log('- File upload processing');
  console.log('- Security and authorization\n');

  const runner = new IntegrationTestRunner();

  try {
    // Run all integration tests
    await runner.runAllTests();
    
    // Validate test coverage
    await runner.validateTestCoverage();
    
    console.log('\n🎉 Integration test suite completed successfully!');
    console.log('All route modules have been comprehensively tested.');
    
  } catch (error) {
    console.error('\n❌ Integration test suite failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Failed to run integration tests:', error);
    process.exit(1);
  });
}

export { main as runIntegrationTests };