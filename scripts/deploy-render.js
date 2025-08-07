#!/usr/bin/env node

/**
 * Render Deployment Helper Script
 * Helps prepare and validate the TripleCheck app for Render deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, colors.green);
    return true;
  } else {
    log(`❌ ${description} missing: ${filePath}`, colors.red);
    return false;
  }
}

function checkPackageScript(scriptName) {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts?.[scriptName]) {
      log(`✅ npm script "${scriptName}" exists`, colors.green);
      return true;
    } else {
      log(`❌ npm script "${scriptName}" missing`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, colors.red);
    return false;
  }
}

function validateEnvironmentTemplate() {
  const envExample = '.env.production.example';
  if (!fs.existsSync(envExample)) {
    log(`❌ Environment template missing: ${envExample}`, colors.red);
    return false;
  }

  const content = fs.readFileSync(envExample, 'utf8');
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'SESSION_SECRET'
  ];

  let allFound = true;
  requiredVars.forEach(varName => {
    if (content.includes(varName)) {
      log(`✅ Required env var "${varName}" documented`, colors.green);
    } else {
      log(`❌ Required env var "${varName}" not documented`, colors.red);
      allFound = false;
    }
  });

  return allFound;
}

function testBuild() {
  log('\n🔨 Testing build process...', colors.blue);
  try {
    execSync('npm run build', { stdio: 'pipe' });
    log('✅ Build successful', colors.green);
    return true;
  } catch (error) {
    log('❌ Build failed', colors.red);
    log(error.stdout?.toString() || error.message, colors.red);
    return false;
  }
}

function checkDependencies() {
  log('\n📦 Checking dependencies...', colors.blue);
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check for production dependencies
    const prodDeps = Object.keys(packageJson.dependencies || {});
    log(`✅ ${prodDeps.length} production dependencies found`, colors.green);
    
    // Check for potential issues
    const problematicDeps = ['nodemon', 'ts-node-dev'];
    const issues = problematicDeps.filter(dep => prodDeps.includes(dep));
    
    if (issues.length > 0) {
      log(`⚠️  Development dependencies in production: ${issues.join(', ')}`, colors.yellow);
      log('   Consider moving these to devDependencies', colors.yellow);
    }
    
    return true;
  } catch (error) {
    log(`❌ Error checking dependencies: ${error.message}`, colors.red);
    return false;
  }
}

function generateRenderConfig() {
  const renderConfig = {
    services: [
      {
        type: 'web',
        name: 'triplecheck-app',
        env: 'node',
        region: 'oregon',
        plan: 'starter',
        buildCommand: 'npm ci && npm run build',
        startCommand: 'npm start',
        healthCheckPath: '/health',
        envVars: [
          { key: 'NODE_ENV', value: 'production' },
          { key: 'PORT', value: '10000' },
          { key: 'DATABASE_URL', sync: false },
          { key: 'JWT_SECRET', generateValue: true },
          { key: 'SESSION_SECRET', generateValue: true },
          { key: 'CORS_ORIGIN', sync: false },
          { key: 'BASE_URL', sync: false },
          { key: 'FRONTEND_URL', sync: false }
        ]
      }
    ]
  };

  // Write render.yaml if it doesn't exist or is outdated
  const renderYamlPath = 'render.yaml';
  if (!fs.existsSync(renderYamlPath)) {
    const yaml = `services:
  - type: web
    name: triplecheck-app
    env: node
    region: oregon
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: SESSION_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        sync: false
      - key: BASE_URL
        sync: false
      - key: FRONTEND_URL
        sync: false`;

    fs.writeFileSync(renderYamlPath, yaml);
    log('✅ Generated render.yaml configuration', colors.green);
  } else {
    log('✅ render.yaml already exists', colors.green);
  }
}

function displayDeploymentChecklist() {
  log('\n📋 Render Deployment Checklist:', colors.cyan);
  log('');
  log('1. 🗄️  Set up PostgreSQL database on Render or external provider', colors.blue);
  log('2. 🔗 Connect your GitHub repository to Render', colors.blue);
  log('3. 🌐 Create a new Web Service on Render', colors.blue);
  log('4. ⚙️  Configure environment variables:', colors.blue);
  log('   - DATABASE_URL (from your database)', colors.yellow);
  log('   - CORS_ORIGIN (your Render app URL)', colors.yellow);
  log('   - BASE_URL (your Render app URL)', colors.yellow);
  log('   - FRONTEND_URL (your Render app URL)', colors.yellow);
  log('   - Optional: GOOGLE_MAPS_API_KEY, SENDGRID_API_KEY, etc.', colors.yellow);
  log('5. 🚀 Deploy and monitor build logs', colors.blue);
  log('6. 🔍 Test health endpoint: https://your-app.onrender.com/health', colors.blue);
  log('');
  log('📖 For detailed instructions, see DEPLOY_RENDER.md', colors.magenta);
}

async function main() {
  log('🚀 TripleCheck Render Deployment Helper', colors.bright);
  log('=====================================', colors.bright);

  let allChecks = true;

  // File checks
  log('\n📁 Checking required files...', colors.blue);
  allChecks &= checkFile('package.json', 'Package configuration');
  allChecks &= checkFile('render.yaml', 'Render configuration');
  allChecks &= checkFile('.env.production.example', 'Environment template');
  allChecks &= checkFile('server/main.ts', 'Server entry point');

  // Script checks
  log('\n📜 Checking npm scripts...', colors.blue);
  allChecks &= checkPackageScript('build');
  allChecks &= checkPackageScript('start');
  allChecks &= checkPackageScript('build:client');
  allChecks &= checkPackageScript('build:server');

  // Environment validation
  log('\n🌍 Validating environment configuration...', colors.blue);
  allChecks &= validateEnvironmentTemplate();

  // Dependency checks
  allChecks &= checkDependencies();

  // Generate configuration
  log('\n⚙️  Generating Render configuration...', colors.blue);
  generateRenderConfig();

  // Build test
  if (process.argv.includes('--test-build')) {
    allChecks &= testBuild();
  } else {
    log('\n💡 Tip: Run with --test-build to test the build process', colors.yellow);
  }

  // Results
  log(`\n${  '='.repeat(50)}`, colors.bright);
  if (allChecks) {
    log('✅ All checks passed! Ready for Render deployment', colors.green);
  } else {
    log('❌ Some checks failed. Please fix the issues above', colors.red);
  }

  displayDeploymentChecklist();
}

// Run the script
main().catch(error => {
  log(`❌ Script error: ${error.message}`, colors.red);
  process.exit(1);
});