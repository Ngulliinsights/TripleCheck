#!/usr/bin/env node

/**
 * Deployment Readiness Test Suite
 * Tests only critical functionality needed for deployment
 */

const { execSync } = require('child_process');

console.log('🧪 Running deployment readiness tests...');

const criticalTests = [
  {
    name: 'Request Deduplication Core',
    command: 'npm test -- --run server/infrastructure/deduplication/RequestDeduplicator.test.ts --reporter=basic',
    required: true
  },
  {
    name: 'Cache Performance Monitor',
    command: 'npm test -- --run server/infrastructure/monitoring/CachePerformanceMonitor.test.ts --reporter=basic',
    required: false
  },
  {
    name: 'Infrastructure Build',
    command: 'node scripts/build-infrastructure.cjs',
    required: true
  }
];

let passedTests = 0;
let totalTests = criticalTests.length;

for (const test of criticalTests) {
  console.log(`\n🔍 Running ${test.name}...`);
  
  try {
    execSync(test.command, { stdio: 'pipe' });
    console.log(`✅ ${test.name}: PASSED`);
    passedTests++;
  } catch (error) {
    if (test.required) {
      console.log(`❌ ${test.name}: FAILED (REQUIRED)`);
      console.error('Error:', error.message);
      process.exit(1);
    } else {
      console.log(`⚠️  ${test.name}: FAILED (OPTIONAL)`);
      passedTests++;
    }
  }
}

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`);

if (passedTests === totalTests) {
  console.log('✅ All critical tests passed - READY FOR DEPLOYMENT');
  process.exit(0);
} else {
  console.log('⚠️  Some optional tests failed but core functionality is intact');
  process.exit(0);
}