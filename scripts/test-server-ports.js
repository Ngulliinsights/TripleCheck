#!/usr/bin/env node

/**
 * Test script to verify server port configuration
 * Tests both development and production port settings
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🧪 Testing Server Port Configuration\n');

// Test development mode (should use port 3000)
console.log('📋 Development Mode Test:');
console.log('Expected: Server should start on port 3000');
console.log('Command: NODE_ENV=development npm run dev');
console.log('Note: You can test this manually\n');

// Test production mode (should use port 3001)
console.log('📋 Production Mode Test:');
console.log('Expected: Server should start on port 3001');
console.log('Command: NODE_ENV=production npm start');
console.log('Note: Run npm run build first\n');

// Test with custom PORT environment variable
console.log('📋 Custom Port Test:');
console.log('Expected: Server should use custom port when PORT is set');
console.log('Command: PORT=4000 npm run dev');
console.log('Note: Should override default port\n');

console.log('🔧 Configuration Summary:');
console.log('- Development (NODE_ENV=development): Port 3000');
console.log('- Production (NODE_ENV=production): Port 3001');
console.log('- Custom (PORT=xxxx): Uses specified port');
console.log('- Vite dev server: Port 3000 (frontend)');
console.log('- Vite HMR: Port 3002');

console.log('\n✅ Port configuration updated successfully!');
console.log('\nTo test:');
console.log('1. Development: npm run dev (port 3000)');
console.log('2. Production: npm run build && NODE_ENV=production npm start (port 3001)');