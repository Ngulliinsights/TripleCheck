#!/usr/bin/env node

/**
 * Visual Regression Testing Script
 * 
 * Runs visual regression tests with Playwright and manages screenshot comparison
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  testDir: 'tests/visual',
  configFile: 'tests/visual/visual.config.ts',
  outputDir: 'test-results/visual',
  screenshotDir: 'test-results/visual-screenshots',
  reportDir: 'test-results/visual-report',
  baselineDir: 'tests/visual/screenshots-baseline'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectories() {
  const dirs = [
    CONFIG.outputDir,
    CONFIG.screenshotDir,
    CONFIG.reportDir,
    CONFIG.baselineDir
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created directory: ${dir}`, 'cyan');
    }
  });
}

function runVisualTests(options = {}) {
  const {
    update = false,
    browser = 'all',
    test = '',
    headed = false,
    debug = false,
    workers = undefined
  } = options;
  
  log('\n🎨 Starting Visual Regression Tests', 'bright');
  log('=====================================', 'cyan');
  
  // Create necessary directories
  createDirectories();
  
  // Build the command
  let command = `npx playwright test --config=${CONFIG.configFile}`;
  
  // Add options
  if (update) {
    command += ' --update-snapshots';
    log('📸 Updating baseline screenshots', 'yellow');
  }
  
  if (browser !== 'all') {
    command += ` --project=${browser}`;
    log(`🌐 Running on browser: ${browser}`, 'blue');
  }
  
  if (test) {
    command += ` --grep="${test}"`;
    log(`🔍 Running specific test: ${test}`, 'blue');
  }
  
  if (headed) {
    command += ' --headed';
    log('👁️  Running in headed mode', 'blue');
  }
  
  if (debug) {
    command += ' --debug';
    log('🐛 Running in debug mode', 'blue');
  }
  
  if (workers) {
    command += ` --workers=${workers}`;
    log(`👥 Using ${workers} workers`, 'blue');
  }
  
  // Add reporter
  command += ' --reporter=html,line';
  
  log(`\n📋 Command: ${command}`, 'cyan');
  log('\n🚀 Executing tests...\n', 'green');
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log('\n✅ Visual tests completed successfully!', 'green');
    log(`📊 View report: npx playwright show-report ${CONFIG.reportDir}`, 'cyan');
    
  } catch (error) {
    log('\n❌ Visual tests failed!', 'red');
    log(`📊 View report: npx playwright show-report ${CONFIG.reportDir}`, 'cyan');
    log('\n🔍 To debug failures:', 'yellow');
    log('   1. Check the HTML report for visual diffs', 'yellow');
    log('   2. Run with --headed flag to see browser', 'yellow');
    log('   3. Run with --debug flag for step-by-step debugging', 'yellow');
    log('   4. Update baselines with --update-snapshots if changes are expected', 'yellow');
    
    process.exit(1);
  }
}

function showHelp() {
  log('\n🎨 Visual Regression Testing Tool', 'bright');
  log('=================================', 'cyan');
  log('\nUsage: npm run test:visual [options]', 'green');
  log('\nOptions:', 'yellow');
  log('  --update              Update baseline screenshots', 'cyan');
  log('  --browser <name>      Run on specific browser (chromium, firefox, webkit)', 'cyan');
  log('  --test <pattern>      Run specific test pattern', 'cyan');
  log('  --headed              Run in headed mode (show browser)', 'cyan');
  log('  --debug               Run in debug mode', 'cyan');
  log('  --workers <number>    Number of parallel workers', 'cyan');
  log('  --help                Show this help message', 'cyan');
  log('\nExamples:', 'yellow');
  log('  npm run test:visual', 'green');
  log('  npm run test:visual -- --update', 'green');
  log('  npm run test:visual -- --browser chromium', 'green');
  log('  npm run test:visual -- --test "components"', 'green');
  log('  npm run test:visual -- --headed --debug', 'green');
  log('\nBrowser Projects:', 'yellow');
  log('  chromium-desktop, firefox-desktop, webkit-desktop', 'cyan');
  log('  chromium-tablet, firefox-tablet', 'cyan');
  log('  mobile-chrome, mobile-safari', 'cyan');
}

function checkPrerequisites() {
  // Check if Playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
  } catch (error) {
    log('❌ Playwright not found. Please install it first:', 'red');
    log('   npm install @playwright/test', 'cyan');
    process.exit(1);
  }
  
  // Check if browsers are installed
  try {
    execSync('npx playwright install --dry-run', { stdio: 'pipe' });
  } catch (error) {
    log('⚠️  Some browsers may not be installed. Run:', 'yellow');
    log('   npx playwright install', 'cyan');
  }
  
  // Check if dev server is running
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: 3003,
    path: '/',
    method: 'GET',
    timeout: 1000
  };
  
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      log('⚠️  Development server not running on localhost:3003', 'yellow');
      log('   Start it with: npm run dev', 'cyan');
      resolve(false);
    });
    
    req.on('timeout', () => {
      resolve(false);
    });
    
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  // Check prerequisites
  checkPrerequisites();
  
  // Parse arguments
  const options = {
    update: args.includes('--update'),
    headed: args.includes('--headed'),
    debug: args.includes('--debug')
  };
  
  // Parse browser option
  const browserIndex = args.indexOf('--browser');
  if (browserIndex !== -1 && args[browserIndex + 1]) {
    options.browser = args[browserIndex + 1];
  }
  
  // Parse test option
  const testIndex = args.indexOf('--test');
  if (testIndex !== -1 && args[testIndex + 1]) {
    options.test = args[testIndex + 1];
  }
  
  // Parse workers option
  const workersIndex = args.indexOf('--workers');
  if (workersIndex !== -1 && args[workersIndex + 1]) {
    options.workers = args[workersIndex + 1];
  }
  
  // Run tests
  runVisualTests(options);
}

// Handle specific commands
if (process.argv.includes('--clean')) {
  log('🧹 Cleaning visual test artifacts...', 'yellow');
  
  const dirsToClean = [CONFIG.outputDir, CONFIG.screenshotDir, CONFIG.reportDir];
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      log(`Cleaned: ${dir}`, 'cyan');
    }
  });
  
  log('✅ Cleanup complete!', 'green');
  process.exit(0);
}

if (process.argv.includes('--setup')) {
  log('🔧 Setting up visual testing environment...', 'yellow');
  
  // Install Playwright browsers
  try {
    execSync('npx playwright install', { stdio: 'inherit' });
    log('✅ Playwright browsers installed!', 'green');
  } catch (error) {
    log('❌ Failed to install Playwright browsers', 'red');
    process.exit(1);
  }
  
  // Create directories
  createDirectories();
  
  log('✅ Visual testing setup complete!', 'green');
  process.exit(0);
}

// Run main function
if (require.main === module) {
  main().catch(error => {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runVisualTests, CONFIG };