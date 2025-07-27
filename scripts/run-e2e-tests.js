#!/usr/bin/env node

/**
 * E2E Test Runner Script
 * 
 * Utility script to run end-to-end tests with various configurations
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003',
  headless: process.env.HEADLESS !== 'false',
  debug: process.env.DEBUG === 'true',
  slowMo: parseInt(process.env.SLOW_MO || '0'),
  timeout: parseInt(process.env.TIMEOUT || '30000'),
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0
};

// Test suites
const TEST_SUITES = {
  auth: 'auth-workflows.spec.ts',
  property: 'property-workflows.spec.ts',
  profile: 'user-profile-workflows.spec.ts',
  reviews: 'review-workflows.spec.ts',
  integration: 'integration-workflows.spec.ts',
  all: '*.spec.ts'
};

// Browser projects
const BROWSER_PROJECTS = {
  chrome: 'chromium-desktop',
  firefox: 'firefox-desktop',
  safari: 'webkit-desktop',
  edge: 'edge-desktop',
  mobile: 'mobile-chrome',
  tablet: 'chromium-tablet'
};

function printUsage() {
  console.log(`
E2E Test Runner

Usage: node scripts/run-e2e-tests.js [options]

Options:
  --suite <name>     Run specific test suite (auth, property, profile, reviews, integration, all)
  --browser <name>   Run on specific browser (chrome, firefox, safari, edge, mobile, tablet)
  --headed          Run tests in headed mode (show browser)
  --debug           Run tests in debug mode
  --slow-mo <ms>    Slow down test execution
  --timeout <ms>    Set test timeout
  --workers <num>   Number of parallel workers
  --retries <num>   Number of retries on failure
  --help            Show this help message

Examples:
  node scripts/run-e2e-tests.js --suite auth --browser chrome --headed
  node scripts/run-e2e-tests.js --suite all --debug
  node scripts/run-e2e-tests.js --browser mobile --slow-mo 1000
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    suite: 'all',
    browser: null,
    headed: !CONFIG.headless,
    debug: CONFIG.debug,
    slowMo: CONFIG.slowMo,
    timeout: CONFIG.timeout,
    workers: CONFIG.workers,
    retries: CONFIG.retries
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
        printUsage();
        process.exit(0);
        break;
      case '--suite':
        options.suite = args[++i];
        break;
      case '--browser':
        options.browser = args[++i];
        break;
      case '--headed':
        options.headed = true;
        break;
      case '--debug':
        options.debug = true;
        break;
      case '--slow-mo':
        options.slowMo = parseInt(args[++i]);
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]);
        break;
      case '--workers':
        options.workers = parseInt(args[++i]);
        break;
      case '--retries':
        options.retries = parseInt(args[++i]);
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  return options;
}

function buildPlaywrightCommand(options) {
  const cmd = 'npx';
  const args = ['playwright', 'test'];

  // Add test file pattern
  if (options.suite && TEST_SUITES[options.suite]) {
    args.push(TEST_SUITES[options.suite]);
  }

  // Add browser project
  if (options.browser && BROWSER_PROJECTS[options.browser]) {
    args.push('--project', BROWSER_PROJECTS[options.browser]);
  }

  // Add execution options
  if (options.headed) {
    args.push('--headed');
  }

  if (options.debug) {
    args.push('--debug');
  }

  if (options.slowMo > 0) {
    args.push('--slow-mo', options.slowMo.toString());
  }

  if (options.timeout > 0) {
    args.push('--timeout', options.timeout.toString());
  }

  if (options.workers) {
    args.push('--workers', options.workers.toString());
  }

  if (options.retries > 0) {
    args.push('--retries', options.retries.toString());
  }

  return { cmd, args };
}

function runTests(options) {
  console.log('🚀 Starting E2E Tests...\n');
  
  // Validate options
  if (options.suite && !TEST_SUITES[options.suite]) {
    console.error(`❌ Invalid test suite: ${options.suite}`);
    console.error(`Available suites: ${Object.keys(TEST_SUITES).join(', ')}`);
    process.exit(1);
  }

  if (options.browser && !BROWSER_PROJECTS[options.browser]) {
    console.error(`❌ Invalid browser: ${options.browser}`);
    console.error(`Available browsers: ${Object.keys(BROWSER_PROJECTS).join(', ')}`);
    process.exit(1);
  }

  // Print configuration
  console.log('📋 Test Configuration:');
  console.log(`   Suite: ${options.suite}`);
  console.log(`   Browser: ${options.browser || 'all'}`);
  console.log(`   Mode: ${options.headed ? 'headed' : 'headless'}`);
  console.log(`   Debug: ${options.debug ? 'enabled' : 'disabled'}`);
  console.log(`   Base URL: ${CONFIG.baseUrl}`);
  if (options.slowMo > 0) {
    console.log(`   Slow Motion: ${options.slowMo}ms`);
  }
  console.log('');

  // Build and execute command
  const { cmd, args } = buildPlaywrightCommand(options);
  
  console.log(`🔧 Running: ${cmd} ${args.join(' ')}\n`);

  const child = spawn(cmd, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: CONFIG.baseUrl
    }
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ All tests passed!');
      
      // Show report command
      console.log('\n📊 To view the test report, run:');
      console.log('   npx playwright show-report');
    } else {
      console.log('\n❌ Some tests failed!');
      console.log('\n🔍 To debug failures:');
      console.log('   1. Check screenshots in test-results/');
      console.log('   2. View the HTML report: npx playwright show-report');
      console.log('   3. Run with --debug flag for step-by-step debugging');
    }
    
    process.exit(code);
  });

  child.on('error', (error) => {
    console.error('❌ Failed to start test runner:', error.message);
    process.exit(1);
  });
}

// Health check function
function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  // Check if Playwright is installed
  try {
    require.resolve('@playwright/test');
    console.log('   ✅ Playwright is installed');
  } catch (error) {
    console.error('   ❌ Playwright is not installed. Run: npm install @playwright/test');
    process.exit(1);
  }

  // Check if application is running
  const http = require('http');
  const url = new URL(CONFIG.baseUrl);
  
  const req = http.request({
    hostname: url.hostname,
    port: url.port,
    path: '/',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    if (res.statusCode === 200) {
      console.log(`   ✅ Application is running at ${CONFIG.baseUrl}`);
      console.log('');
    } else {
      console.error(`   ❌ Application returned status ${res.statusCode}`);
      process.exit(1);
    }
  });

  req.on('error', (error) => {
    console.error(`   ❌ Cannot connect to application at ${CONFIG.baseUrl}`);
    console.error(`   Make sure the application is running with: npm run dev`);
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error(`   ❌ Connection timeout to ${CONFIG.baseUrl}`);
    console.error(`   Make sure the application is running and accessible`);
    process.exit(1);
  });

  req.end();
}

// Quick test function
function runQuickTest() {
  console.log('⚡ Running quick smoke test...\n');
  
  const { cmd, args } = buildPlaywrightCommand({
    suite: 'auth',
    browser: 'chrome',
    headed: false,
    debug: false,
    timeout: 10000,
    workers: 1,
    retries: 0
  });

  const child = spawn(cmd, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: CONFIG.baseUrl
    }
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Quick test passed! System is ready for full test suite.');
    } else {
      console.log('\n❌ Quick test failed! Check your setup before running full tests.');
    }
    process.exit(code);
  });
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  // Handle special commands
  if (args.includes('--check')) {
    checkPrerequisites();
    return;
  }
  
  if (args.includes('--quick')) {
    runQuickTest();
    return;
  }
  
  // Parse options and run tests
  const options = parseArgs();
  
  // Run prerequisites check first
  checkPrerequisites();
  
  // Small delay to ensure health check completes
  setTimeout(() => {
    runTests(options);
  }, 1000);
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⏹️  Test execution interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Test execution terminated');
  process.exit(143);
});

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  runTests,
  checkPrerequisites,
  TEST_SUITES,
  BROWSER_PROJECTS
};