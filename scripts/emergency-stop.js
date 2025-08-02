#!/usr/bin/env node

/**
 * Emergency Stop Script
 * Stops all running processes and clears caches to prevent infinite API calls
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚨 EMERGENCY STOP - Stopping all processes and clearing caches...');

try {
  // Kill any running Node.js processes on common ports
  const ports = [3000, 3001, 3002, 3003, 3004, 5000, 5001, 8000, 8080];
  
  ports.forEach(port => {
    try {
      if (process.platform === 'win32') {
        execSync(`netstat -ano | findstr :${port}`, { stdio: 'ignore' });
        execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /f /pid %a`, { stdio: 'ignore' });
      } else {
        execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
      }
      console.log(`✅ Stopped processes on port ${port}`);
    } catch (error) {
      // Port not in use, continue
    }
  });

  // Clear various cache directories
  const cacheDirs = [
    'node_modules/.cache',
    '.cache',
    'dist',
    'build',
    '.next',
    '.vite',
    'temp-files'
  ];

  cacheDirs.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✅ Cleared cache directory: ${dir}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not clear ${dir}: ${error.message}`);
    }
  });

  // Clear browser storage (if possible)
  console.log('🧹 Cache clearing complete');
  console.log('');
  console.log('🔧 FIXES APPLIED:');
  console.log('   - Fixed infinite loop in Home.tsx useEffect');
  console.log('   - Fixed infinite loop in FraudDetectionDashboard.tsx');
  console.log('   - Fixed cacheKey infinite loop in useProperty.ts');
  console.log('   - Added request throttling in useSafeQuery.ts');
  console.log('');
  console.log('✅ Emergency stop complete. It should now be safe to restart the application.');
  console.log('');
  console.log('To restart safely:');
  console.log('   npm run dev');

} catch (error) {
  console.error('❌ Error during emergency stop:', error.message);
  process.exit(1);
}