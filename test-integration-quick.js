#!/usr/bin/env node

/**
 * Quick Integration Test
 * Verifies that the integration fixes are working after autofix
 */

const http = require('http');

function testEndpoint(path, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const success = res.statusCode === 200 && parsed.success !== false;
          console.log(`${success ? '✅' : '❌'} ${name}: ${success ? 'PASSED' : 'FAILED'}`);
          if (!success && parsed.error) {
            console.log(`   Error: ${parsed.error}`);
          }
          resolve(success);
        } catch (error) {
          console.log(`❌ ${name}: PARSE ERROR`);
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      console.log(`❌ ${name}: CONNECTION ERROR`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`❌ ${name}: TIMEOUT`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runQuickTest() {
  console.log('🔍 Quick Integration Test (Post-Autofix)');
  console.log('==========================================\n');

  const tests = [
    { path: '/health', name: 'Server Health' },
    { path: '/api/properties', name: 'Properties API' },
    { path: '/api/test/integration', name: 'Database Integration' }
  ];

  let passed = 0;
  for (const test of tests) {
    const result = await testEndpoint(test.path, test.name);
    if (result) passed++;
  }

  console.log(`\n📊 Results: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('🎉 Integration is working correctly after autofix!');
  } else {
    console.log('⚠️  Some integration issues detected. Check server logs.');
  }
}

runQuickTest().catch(console.error);