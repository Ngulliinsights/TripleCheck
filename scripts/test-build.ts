#!/usr/bin/env tsx

/**
 * BUILD TESTING SCRIPT
 * ====================
 * 
 * Tests the build output to ensure it's ready for deployment
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

async function testBuild() {
  console.log('🏗️  Testing build output...\n');

  const rootDir = process.cwd();
  const distDir = join(rootDir, 'dist/public');

  // Step 1: Run build
  console.log('1. Running build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully\n');
  } catch (error) {
    console.log('❌ Build failed');
    process.exit(1);
  }

  // Step 2: Check build output
  console.log('2. Checking build output...');
  
  if (!existsSync(distDir)) {
    console.log('❌ Build output directory not found');
    process.exit(1);
  }
  
  const indexPath = join(distDir, 'index.html');
  if (!existsSync(indexPath)) {
    console.log('❌ index.html not found');
    process.exit(1);
  }
  
  console.log('✅ Build output structure is correct\n');

  // Step 3: Check index.html content
  console.log('3. Checking index.html content...');
  
  const indexContent = readFileSync(indexPath, 'utf8');
  
  if (!indexContent.includes('<div id="root">')) {
    console.log('❌ Root div not found in index.html');
    process.exit(1);
  }
  
  if (!indexContent.includes('<script')) {
    console.log('❌ No script tags found in index.html');
    process.exit(1);
  }
  
  console.log('✅ index.html content is correct\n');

  // Step 4: Start preview server
  console.log('4. Starting preview server...');
  console.log('   Run: npm run preview');
  console.log('   Then visit: http://localhost:4173');
  console.log('   Test navigation and refresh on sub-routes\n');

  // Step 5: Deployment ready
  console.log('🎉 Build test completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Test locally: npm run preview');
  console.log('2. Debug if needed: npm run debug:vercel');
  console.log('3. Deploy: vercel --prod');
}

testBuild().catch(console.error);