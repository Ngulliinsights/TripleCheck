#!/usr/bin/env node

/**
 * Quick test script to verify the MVP setup is working
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !key.startsWith('#')) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log('⚠️  No .env file found, checking environment variables only...');
}

console.log('🧪 Testing TripleCheck MVP Setup...\n');

// Test 1: Environment Variables
console.log('1. Testing Environment Variables:');
const requiredEnvVars = ['DATABASE_URL'];
const optionalEnvVars = ['GOOGLE_API_KEY', 'SESSION_SECRET'];

let envIssues = 0;

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✅ ${envVar}: Set`);
  } else {
    console.log(`   ❌ ${envVar}: Missing (REQUIRED)`);
    envIssues++;
  }
});

optionalEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✅ ${envVar}: Set`);
  } else {
    console.log(`   ⚠️  ${envVar}: Missing (optional but recommended)`);
  }
});

// Test 2: Dependencies
console.log('\n2. Testing Key Dependencies:');
const testDependencies = [
  'express',
  'drizzle-orm', 
  '@neondatabase/serverless',
  'bcrypt'
];

for (const dep of testDependencies) {
  try {
    await import(dep);
    console.log(`   ✅ ${dep}: Available`);
  } catch (e) {
    console.log(`   ❌ ${dep}: Missing`);
    envIssues++;
  }
}

// Test 3: File Structure
console.log('\n3. Testing File Structure:');

const criticalFiles = [
  'server/index.ts',
  'server/routes.ts',
  'server/storage.ts',
  'shared/schema.ts',
  'client/src/App.tsx',
  '.env.example'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`   ✅ ${file}: Exists`);
  } else {
    console.log(`   ❌ ${file}: Missing`);
    envIssues++;
  }
});

// Summary
console.log('\n📊 Test Summary:');
if (envIssues === 0) {
  console.log('✅ All critical tests passed! Your MVP setup looks good.');
  console.log('\n🚀 Next Steps:');
  console.log('1. Make sure your .env file is configured');
  console.log('2. Run: npm run db:setup');
  console.log('3. Run: npm run dev');
  console.log('4. Visit: http://localhost:5000');
} else {
  console.log(`❌ Found ${envIssues} issues that need to be resolved.`);
  console.log('\n🔧 Recommended Actions:');
  console.log('1. Install missing dependencies: npm install --legacy-peer-deps');
  console.log('2. Set up your .env file based on .env.example');
  console.log('3. Ensure DATABASE_URL is properly configured');
}

console.log('\n📚 For detailed setup instructions, see: SETUP_GUIDE.md');