#!/usr/bin/env node

/**
 * Test Server Connection
 * Simple script to test if the server is running and responding
 */

const http = require('http');

async function testConnection(port = 3000) {
  console.log(`🔍 Testing server connection on localhost:${port}...`);
  
  const endpoints = [
    '/health',
    '/api/memory',
    '/'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing ${endpoint}...`);
      
      const result = await makeRequest(port, endpoint);
      
      console.log(`✅ ${endpoint}: SUCCESS`);
      console.log(`   Status: ${result.statusCode}`);
      console.log(`   Response Time: ${result.responseTime}ms`);
      console.log(`   Data Length: ${result.dataLength} bytes`);
      
      if (result.data && result.data.length < 500) {
        console.log(`   Response: ${result.data.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: FAILED - ${error.message}`);
    }
  }
}

function makeRequest(port, path) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent': 'ServerTest/1.0',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          dataLength: data.length,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test different common ports
async function testMultiplePorts() {
  const ports = [3000, 3001, 5000, 8000, 4000];
  
  console.log('🔍 Testing multiple ports to find running server...\n');
  
  for (const port of ports) {
    console.log(`\n🔌 Testing port ${port}:`);
    
    try {
      const result = await makeRequest(port, '/health');
      console.log(`✅ Server found on port ${port}!`);
      console.log(`   Status: ${result.statusCode}`);
      console.log(`   Response Time: ${result.responseTime}ms`);
      
      // Test this port more thoroughly
      await testConnection(port);
      return port;
      
    } catch (error) {
      console.log(`❌ Port ${port}: ${error.message}`);
    }
  }
  
  console.log('\n❌ No server found on any tested port');
  return null;
}

// Run the test
async function main() {
  console.log('🚀 Server Connection Test\n');
  
  // First try the default port
  try {
    await testConnection(3000);
  } catch (error) {
    console.log('\n⚠️  Default port 3000 failed, trying other ports...');
    await testMultiplePorts();
  }
  
  console.log('\n📋 Connection test completed');
}

main().catch(error => {
  console.error('Connection test failed:', error);
  process.exit(1);
});