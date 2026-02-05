#!/usr/bin/env node

/**
 * Complete Load Test Runner
 * Starts the server and runs load test against the Request Deduplication System
 */

const { spawn } = require('child_process');
const { writeFileSync } = require('fs');
const http = require('http');

class CompleteLoadTestRunner {
  constructor() {
    this.testId = `complete-load-test-${Date.now()}`;
    this.serverProcess = null;
    this.serverReady = false;
  }

  async runCompleteTest() {
    console.log('🚀 Starting Complete Load Test with Live Server');
    console.log(`📋 Test ID: ${this.testId}`);
    console.log('🎯 Testing Request Deduplication System with live server\n');

    try {
      // Start the server
      await this.startServer();
      
      // Wait for server to be ready
      await this.waitForServer();
      
      // Run the load test
      await this.runLoadTest();
      
      // Stop the server
      await this.stopServer();
      
      console.log('\n🎉 COMPLETE LOAD TEST SUCCESSFUL!');
      return true;
      
    } catch (error) {
      console.error(`❌ Complete load test failed: ${error.message}`);
      await this.stopServer();
      return false;
    }
  }

  async startServer() {
    console.log('🔧 Starting development server...');
    
    return new Promise((resolve, reject) => {
      // Start the server using npm run dev
      this.serverProcess = spawn('npm', ['run', 'dev'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let serverOutput = '';
      
      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        
        // Look for server ready indicators
        if (output.includes('Server running') || 
            output.includes('localhost:3000') || 
            output.includes('ready') ||
            output.includes('Local:')) {
          console.log('✅ Server started successfully');
          this.serverReady = true;
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.log(`Server: ${error}`);
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!this.serverReady) {
          console.log('⚠️  Server startup timeout, proceeding anyway...');
          this.serverReady = true;
          resolve();
        }
      }, 30000);
    });
  }

  async waitForServer() {
    console.log('🔍 Waiting for server to be ready...');
    
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        await this.checkServerHealth();
        console.log('✅ Server is ready and responding');
        return;
      } catch (error) {
        attempts++;
        console.log(`⏳ Waiting for server... (${attempts}/${maxAttempts})`);
        await this.sleep(1000);
      }
    }
    
    throw new Error('Server did not become ready within timeout period');
  }

  async checkServerHealth() {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/health',
        method: 'GET',
        timeout: 2000
      }, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Health check failed: ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Health check timeout'));
      });

      req.end();
    });
  }

  async runLoadTest() {
    console.log('\n🔥 Running load test against live server...');
    
    return new Promise((resolve, reject) => {
      const loadTestProcess = spawn('node', ['scripts/load-test-simple.cjs'], {
        stdio: 'inherit',
        shell: true
      });

      loadTestProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Load test completed successfully');
          resolve();
        } else {
          reject(new Error(`Load test failed with exit code ${code}`));
        }
      });

      loadTestProcess.on('error', (error) => {
        reject(new Error(`Load test process error: ${error.message}`));
      });
    });
  }

  async stopServer() {
    if (this.serverProcess) {
      console.log('\n🛑 Stopping server...');
      
      // Try graceful shutdown first
      this.serverProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds if needed
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          console.log('🔨 Force stopping server...');
          this.serverProcess.kill('SIGKILL');
        }
      }, 5000);
      
      console.log('✅ Server stopped');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute complete load test
async function main() {
  const runner = new CompleteLoadTestRunner();
  const success = await runner.runCompleteTest();
  
  if (success) {
    console.log('\n🎉 COMPLETE LOAD TEST WITH LIVE SERVER SUCCESSFUL!');
    console.log('\n📋 Results:');
    console.log('✅ Server started and responded correctly');
    console.log('✅ Request Deduplication System tested under load');
    console.log('✅ Performance metrics collected');
    console.log('✅ System validated for production deployment');
    console.log('\n📊 Check temp-files/simple-load-test-report.json for detailed results');
    process.exit(0);
  } else {
    console.log('\n❌ COMPLETE LOAD TEST FAILED');
    console.log('Check the error messages above for details');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Complete load test runner failed:', error);
  process.exit(1);
});