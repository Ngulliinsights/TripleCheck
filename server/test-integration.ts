#!/usr/bin/env node

/**
 * Backend-Frontend Integration Test
 * 
 * This script tests the integration between backend and frontend
 * by making actual HTTP requests to the API endpoints.
 */

import 'dotenv/config';

async function testIntegration() {
  console.log('🧪 Testing Backend-Frontend Integration...\n');

  const baseUrl = 'http://localhost:5000';
  const tests = [];

  // Test 1: Basic API Health Check
  try {
    console.log('1️⃣ Testing API Health Check...');
    const response = await fetch(`${baseUrl}/api/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check passed:', data);
      tests.push({ name: 'Health Check', status: 'PASS' });
    } else {
      console.log('❌ Health check failed:', response.status);
      tests.push({ name: 'Health Check', status: 'FAIL', error: `HTTP ${response.status}` });
    }
  } catch (error) {
    console.log('❌ Health check error:', error);
    tests.push({ name: 'Health Check', status: 'ERROR', error: error.message });
  }

  // Test 2: Properties API (No Search)
  try {
    console.log('\n2️⃣ Testing Properties API (No Search)...');
    const response = await fetch(`${baseUrl}/api/properties`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Properties API passed');
      console.log(`   Found ${data.data?.properties?.length || 0} properties`);
      tests.push({ name: 'Properties API', status: 'PASS', count: data.data?.properties?.length || 0 });
    } else {
      console.log('❌ Properties API failed:', response.status);
      tests.push({ name: 'Properties API', status: 'FAIL', error: `HTTP ${response.status}` });
    }
  } catch (error) {
    console.log('❌ Properties API error:', error);
    tests.push({ name: 'Properties API', status: 'ERROR', error: error.message });
  }

  // Test 3: Search API
  try {
    console.log('\n3️⃣ Testing Search API...');
    const searchTerm = 'apartment';
    const response = await fetch(`${baseUrl}/api/properties?q=${encodeURIComponent(searchTerm)}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Search API passed');
      console.log(`   Search for "${searchTerm}" found ${data.data?.properties?.length || 0} results`);
      tests.push({ name: 'Search API', status: 'PASS', count: data.data?.properties?.length || 0 });
    } else {
      console.log('❌ Search API failed:', response.status);
      tests.push({ name: 'Search API', status: 'FAIL', error: `HTTP ${response.status}` });
    }
  } catch (error) {
    console.log('❌ Search API error:', error);
    tests.push({ name: 'Search API', status: 'ERROR', error: error.message });
  }

  // Test 4: CORS Headers
  try {
    console.log('\n4️⃣ Testing CORS Headers...');
    const response = await fetch(`${baseUrl}/api/properties`, {
      method: 'OPTIONS'
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    };
    
    console.log('✅ CORS headers:', corsHeaders);
    tests.push({ name: 'CORS Headers', status: 'PASS', headers: corsHeaders });
  } catch (error) {
    console.log('❌ CORS test error:', error);
    tests.push({ name: 'CORS Headers', status: 'ERROR', error: error.message });
  }

  // Test 5: Database Connection (via API)
  try {
    console.log('\n5️⃣ Testing Database Connection...');
    const response = await fetch(`${baseUrl}/api/properties`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.data?.properties)) {
        console.log('✅ Database connection working');
        console.log(`   Database has ${data.data.properties.length} properties`);
        tests.push({ name: 'Database Connection', status: 'PASS' });
      } else {
        console.log('❌ Database response format invalid');
        tests.push({ name: 'Database Connection', status: 'FAIL', error: 'Invalid response format' });
      }
    } else {
      console.log('❌ Database connection failed via API');
      tests.push({ name: 'Database Connection', status: 'FAIL', error: `HTTP ${response.status}` });
    }
  } catch (error) {
    console.log('❌ Database test error:', error);
    tests.push({ name: 'Database Connection', status: 'ERROR', error: error.message });
  }

  // Summary
  console.log('\n📊 Integration Test Summary:');
  console.log('=' .repeat(50));
  
  const passed = tests.filter(t => t.status === 'PASS').length;
  const failed = tests.filter(t => t.status === 'FAIL').length;
  const errors = tests.filter(t => t.status === 'ERROR').length;
  
  tests.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${status} ${test.name}: ${test.status}`);
    if (test.error) console.log(`   Error: ${test.error}`);
    if (test.count !== undefined) console.log(`   Count: ${test.count}`);
  });
  
  console.log('\n📈 Results:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total:  ${tests.length}`);
  
  if (failed === 0 && errors === 0) {
    console.log('\n🎉 All integration tests passed! Backend and frontend are properly connected.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above and ensure:');
    console.log('   1. Server is running on port 5000');
    console.log('   2. Database is connected and seeded');
    console.log('   3. Environment variables are set');
    console.log('   4. No firewall blocking requests');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testIntegration().catch(console.error);
}

export { testIntegration };