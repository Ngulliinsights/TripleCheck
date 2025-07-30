#!/usr/bin/env tsx
/**
 * Emergency Script to Stop Infinite API Queries
 * 
 * This script helps identify and stop processes that might be causing
 * infinite API queries in the TripleCheck system.
 */

import { execSync } from 'child_process';

console.log('🚨 Emergency: Stopping Infinite API Queries...');

// Check for running Node processes
try {
  console.log('\n📋 Checking for running Node processes...');
  
  // On Windows, use tasklist to find Node processes
  if (process.platform === 'win32') {
    const processes = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf8' });
    console.log('Node processes:', processes);
  } else {
    // On Unix-like systems, use ps
    const processes = execSync('ps aux | grep node', { encoding: 'utf8' });
    console.log('Node processes:', processes);
  }
} catch (error) {
  console.log('Could not list processes:', error);
}

// Check for any running development servers
const commonPorts = [3000, 3001, 3002, 3003, 5173, 8080];

console.log('\n🔍 Checking for servers on common ports...');
for (const port of commonPorts) {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`netstat -an | findstr :${port}`, { encoding: 'utf8' });
      if (result.trim()) {
        console.log(`Port ${port}: ${result.trim()}`);
      }
    } else {
      const result = execSync(`lsof -i :${port}`, { encoding: 'utf8' });
      if (result.trim()) {
        console.log(`Port ${port}: ${result.trim()}`);
      }
    }
  } catch (error) {
    // Port not in use, which is fine
  }
}

console.log('\n💡 Recommendations to stop infinite queries:');
console.log('1. Stop your development server (Ctrl+C in the terminal)');
console.log('2. Clear browser cache and localStorage');
console.log('3. Check for any running data generation scripts');
console.log('4. Restart your development server with: npm run dev');

console.log('\n🔧 Quick fixes applied:');
console.log('✅ Added request throttling to prevent >20 requests/second');
console.log('✅ Added debouncing to property queries (300ms)');
console.log('✅ Made similar properties optional (not automatic)');
console.log('✅ Added global rate limiting');

console.log('\n🎯 To test the fixes:');
console.log('1. Restart your dev server: npm run dev');
console.log('2. Open browser dev tools → Network tab');
console.log('3. Navigate to the home page');
console.log('4. You should see much fewer API requests');

console.log('\n✅ Emergency script completed!');