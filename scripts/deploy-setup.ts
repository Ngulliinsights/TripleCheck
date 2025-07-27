#!/usr/bin/env tsx

/**
 * Deployment setup script
 * Prepares the application for deployment by checking dependencies,
 * running tests, and building the application
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
];

const OPTIONAL_ENV_VARS = [
  'GOOGLE_API_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
];

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check optional but recommended variables
  OPTIONAL_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    warnings.forEach(varName => console.warn(`  - ${varName}`));
  }

  console.log('✅ Environment variables check passed');
}

function runTests() {
  console.log('🧪 Running tests...');
  try {
    execSync('npm test -- --run', { stdio: 'inherit' });
    console.log('✅ Tests passed');
  } catch (error) {
    console.error('❌ Tests failed');
    process.exit(1);
  }
}

function buildApplication() {
  console.log('🏗️  Building application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed');
  } catch (error) {
    console.error('❌ Build failed');
    process.exit(1);
  }
}

function checkBuildOutput() {
  console.log('📦 Checking build output...');
  
  const requiredFiles = [
    'dist/index.html',
    'dist/assets',
  ];

  const missing = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missing.length > 0) {
    console.error('❌ Missing build files:');
    missing.forEach(file => console.error(`  - ${file}`));
    process.exit(1);
  }

  console.log('✅ Build output verified');
}

function generateDeploymentInfo() {
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    npmVersion: execSync('npm --version', { encoding: 'utf8' }).trim(),
    gitCommit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
    gitBranch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
    environment: process.env.NODE_ENV || 'development',
  };

  fs.writeFileSync('dist/deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('📋 Deployment info generated');
}

async function main() {
  console.log('🚀 Starting deployment setup...\n');

  try {
    checkEnvironmentVariables();
    runTests();
    buildApplication();
    checkBuildOutput();
    generateDeploymentInfo();

    console.log('\n✅ Deployment setup completed successfully!');
    console.log('🎉 Ready to deploy to production');
  } catch (error) {
    console.error('\n❌ Deployment setup failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}