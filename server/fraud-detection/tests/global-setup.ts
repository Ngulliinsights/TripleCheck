import { execSync } from 'child_process';
import fs from './global-teardown';
import path from './global-teardown';

export default async function globalSetup() {
  console.log('🔧 Setting up fraud detection test environment...');
  
  // Ensure test directories exist
  const testDirs = [
    path.join(__dirname, '../coverage'),
    path.join(__dirname, '../test-results'),
    path.join(__dirname, '../logs')
  ];
  
  testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  process.env.TEST_TIMEOUT = '30000';
  
  // Clean up any existing test artifacts
  try {
    const coverageDir = path.join(__dirname, '../coverage');
    if (fs.existsSync(coverageDir)) {
      fs.rmSync(coverageDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn('Warning: Could not clean coverage directory:', error);
  }
  
  console.log('✅ Test environment setup complete');
}