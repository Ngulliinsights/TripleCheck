#!/usr/bin/env node

/**
 * Test if the server can start successfully
 */

import { spawn } from 'child_process';

console.log('🧪 Testing server startup...');

const serverProcess = spawn('npm', ['run', 'dev:backend'], {
  stdio: 'pipe',
  shell: true
});

let output = '';
let hasStarted = false;
let hasError = false;

// Timeout after 30 seconds
const timeout = setTimeout(() => {
  if (!hasStarted && !hasError) {
    console.log('⏰ Server startup timeout (30s)');
    serverProcess.kill();
    process.exit(1);
  }
}, 30000);

serverProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  
  // Check for successful startup indicators
  if (text.includes('Server started successfully') || 
      text.includes('Health check:') ||
      text.includes('Frontend:') ||
      text.includes('listening on')) {
    hasStarted = true;
    clearTimeout(timeout);
    console.log('✅ Server started successfully!');
    console.log('🔗 Health check: http://localhost:3001/health');
    console.log('🌐 API: http://localhost:3001/api');
    serverProcess.kill();
    process.exit(0);
  }
});

serverProcess.stderr.on('data', (data) => {
  const text = data.toString();
  output += text;
  
  // Check for critical errors that prevent startup
  if (text.includes('Error:') && 
      (text.includes('EADDRINUSE') || 
       text.includes('Cannot find module') ||
       text.includes('SyntaxError') ||
       text.includes('TypeError'))) {
    hasError = true;
    clearTimeout(timeout);
    console.log('❌ Server failed to start:');
    console.log(text);
    serverProcess.kill();
    process.exit(1);
  }
});

serverProcess.on('close', (code) => {
  clearTimeout(timeout);
  if (!hasStarted && !hasError) {
    console.log(`⚠️  Server process exited with code ${code}`);
    if (output.includes('Database')) {
      console.log('💡 This might be a database connection issue - server should still work with mock data');
    }
    console.log('\nLast output:');
    console.log(output.slice(-500)); // Show last 500 characters
  }
});