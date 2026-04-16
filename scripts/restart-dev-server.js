#!/usr/bin/env tsx
"use strict";
/**
 * Script to restart the development server and clear any stuck processes
 */
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
console.log('🔄 Restarting development server...');
try {
    // Kill any existing Node.js processes that might be stuck
    console.log('🛑 Stopping existing processes...');
    try {
        // On Windows, kill processes using port 3003
        (0, child_process_1.execSync)('netstat -ano | findstr :3003', { stdio: 'pipe' });
        (0, child_process_1.execSync)('for /f "tokens=5" %a in (\'netstat -ano ^| findstr :3003\') do taskkill /PID %a /F', { stdio: 'pipe' });
    }
    catch (error) {
        // Port might not be in use, which is fine
        console.log('ℹ️  No processes found on port 3003');
    }
    // Clear any npm/node cache
    console.log('🧹 Clearing caches...');
    try {
        (0, child_process_1.execSync)('npm run clean', { stdio: 'inherit' });
    }
    catch (error) {
        console.log('ℹ️  Clean script not available, skipping...');
    }
    // Start the development server
    console.log('🚀 Starting development server...');
    (0, child_process_1.execSync)('npm run dev', { stdio: 'inherit' });
}
catch (error) {
    console.error('❌ Error restarting server:', error);
    process.exit(1);
}
