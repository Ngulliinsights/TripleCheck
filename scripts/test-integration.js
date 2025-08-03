#!/usr/bin/env node

/**
 * Integration Test Script
 * Tests the complete integration between frontend, backend, and database
 */

import http from 'http';

const BASE_URL = 'http://localhost:3003';

const tests = [
  {
    name: 'Server Health Check',
    path: '/health'
  },
  {
    name: 'Database Integration Test',
    path: '/api/test/integration'
  },
  {
    name: 'Properties API Test',
    path: '/api/test/properties'
  },
  {
    name: 'Properties List (Real API)',
    path: '/api/properties'
  }
];

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running Integration Tests...\n');
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`⏳ Running: ${test.name}`);
      const result = await makeRequest(test.path);
      
      const success = result.status === 200 && (result.data.success !== false);
      
      console.log(`${success ? '✅' : '❌'} ${test.name}: ${success ? 'PASSED' : 'FAILED'}`);
      
      if (!success) {
        console.log(`   Status: ${result.status}`);
        if (result.data.error) {
          console.log(`   Error: ${result.data.error}`);
        }
        if (result.parseError) {
          console.log(`   Parse Error: ${result.parseError}`);
        }
      } else if (result.data.data) {
        // Show some sample data for successful tests
        if (Array.isArray(result.data.data)) {
          console.log(`   Found ${result.data.data.length} items`);
        } else if (typeof result.data.data === 'object') {
          const keys = Object.keys(result.data.data);
          console.log(`   Response contains: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`);
        }
      }
      
      results.push({
        name: test.name,
        success,
        status: result.status,
        data: result.data
      });
      
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR`);
      console.log(`   ${error.message}`);
      
      results.push({
        name: test.name,
        success: false,
        error: error.message
      });
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Summary
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = Math.round((passed / total) * 100);
  
  console.log('📊 Test Summary:');
  console.log(`   Total Tests: ${total}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${total - passed}`);
  console.log(`   Success Rate: ${successRate}%`);
  
  if (successRate === 100) {
    console.log('\n🎉 All integration tests passed! The system is properly integrated.');
  } else if (successRate >= 75) {
    console.log('\n⚠️  Most tests passed, but some issues were found. Check the failures above.');
  } else {
    console.log('\n🚨 Multiple integration issues found. Please fix the failures above.');
  }
  
  process.exit(successRate === 100 ? 0 : 1);
}

// Check if server is running first
console.log('🔍 Checking if server is running...');
makeRequest('/health')
  .then(() => {
    console.log('✅ Server is running\n');
    runTests();
  })
  .catch((error) => {
    console.log('❌ Server is not running or not accessible');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Please start the server first with: npm run dev');
    process.exit(1);
  });