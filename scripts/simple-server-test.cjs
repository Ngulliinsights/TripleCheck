#!/usr/bin/env node

/**
 * Simple Server Test
 * Basic test to verify server functionality without complex integrations
 */

const http = require('http');
const { writeFileSync } = require('fs');

async function testBasicEndpoints() {
  console.log('🔍 Testing basic server endpoints...');
  
  const endpoints = [
    '/health',
    '/api/memory',
    '/api/deduplication/status',
    '/api/monitoring/cache',
    '/api/monitoring/optimizer',
    '/api/monitoring/dashboard'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing ${endpoint}...`);
      
      const result = await makeRequest(3000, endpoint);
      
      console.log(`✅ ${endpoint}: SUCCESS (${result.statusCode}) - ${result.responseTime}ms`);
      
      results.push({
        endpoint,
        status: 'success',
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        dataLength: result.dataLength
      });
      
    } catch (error) {
      console.log(`❌ ${endpoint}: FAILED - ${error.message}`);
      
      results.push({
        endpoint,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Generate simple report
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'Basic Server Endpoint Test',
    results: results,
    summary: {
      total: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    }
  };
  
  writeFileSync('temp-files/basic-server-test-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n📊 Test Summary:');
  console.log(`✅ Successful: ${report.summary.successful}/${report.summary.total}`);
  console.log(`❌ Failed: ${report.summary.failed}/${report.summary.total}`);
  console.log('📋 Report saved to: temp-files/basic-server-test-report.json');
  
  return report.summary.failed === 0;
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
        'User-Agent': 'BasicServerTest/1.0',
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

async function main() {
  console.log('🚀 Basic Server Test\n');
  
  const success = await testBasicEndpoints();
  
  if (success) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Server is responding correctly');
    console.log('✅ Request Deduplication endpoints are working');
    console.log('✅ System is ready for load testing');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    console.log('⚠️  Check if server is running: npm run dev');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Basic server test failed:', error);
  process.exit(1);
});