#!/usr/bin/env node

/**
 * Infrastructure-focused build script
 * Builds only the server infrastructure components needed for deployment
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');

console.log('🔨 Building infrastructure components for deployment...');

try {
  // Build server with infrastructure focus
  console.log('📦 Building server infrastructure...');
  execSync('npx tsc --project tsconfig.infrastructure.json --outDir dist/server', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  // Copy necessary files
  console.log('📋 Copying configuration files...');
  execSync('cp package.json dist/', { stdio: 'inherit' });
  execSync('cp .env.production.example dist/', { stdio: 'inherit' });
  
  // Install production dependencies
  console.log('📥 Installing production dependencies...');
  execSync('npm ci --production --prefix dist', { stdio: 'inherit' });
  
  console.log('✅ Infrastructure build completed successfully!');
  console.log('📁 Build artifacts available in dist/ directory');
  
} catch (error) {
  console.error('❌ Infrastructure build failed:', error.message);
  process.exit(1);
}