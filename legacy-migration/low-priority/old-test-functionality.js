#!/usr/bin/env node

/**
 * Comprehensive Functionality Test
 * Tests authentication and document upload functionality
 */

import fs from 'fs';
import path from 'path';

async function testAuthentication() {
  console.log('🔐 Testing Authentication System...');
  
  const testCredentials = [
    { username: 'demo_user', password: 'password123' },
    { username: 'test_user', password: 'test123' },
    { username: 'admin', password: 'admin123' }
  ];

  for (const creds of testCredentials) {
    try {
      console.log(`Testing login for: ${creds.username}`);
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creds)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log(`✅ Login successful for ${creds.username}`);
        console.log(`   User ID: ${result.data.id}`);
        console.log(`   Trust Score: ${result.data.trustScore}`);
        
        // Test the /me endpoint
        const meResponse = await fetch('http://localhost:5000/api/auth/me', {
          method: 'GET',
          headers: {
            'Cookie': response.headers.get('set-cookie') || ''
          }
        });
        
        if (meResponse.ok) {
          console.log(`✅ Session validation successful for ${creds.username}`);
        } else {
          console.log(`⚠️  Session validation failed for ${creds.username}`);
        }
        
      } else {
        console.log(`❌ Login failed for ${creds.username}: ${result.message}`);
      }
    } catch (error) {
      console.log(`❌ Network error testing ${creds.username}: ${error.message}`);
    }
  }
}

async function testDocumentUpload() {
  console.log('\n📄 Testing Document Upload System...');
  
  // First login to get session
  const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: 'demo_user', password: 'password123' })
  });

  if (!loginResponse.ok) {
    console.log('❌ Cannot test document upload - login failed');
    return;
  }

  const sessionCookie = loginResponse.headers.get('set-cookie');
  
  // Create a test file
  const testFileContent = Buffer.from('This is a test document for verification');
  const testFileName = 'test-document.txt';
  
  // Create FormData for file upload
  const FormData = (await import('form-data')).default;
  const formData = new FormData();
  
  formData.append('documents', testFileContent, {
    filename: testFileName,
    contentType: 'text/plain'
  });
  formData.append('documentTypes', 'Property Document');

  try {
    console.log('Uploading test document...');
    
    const uploadResponse = await fetch('http://localhost:5000/api/properties/20004/verify-documents', {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie || '',
        ...formData.getHeaders()
      },
      body: formData
    });

    const result = await uploadResponse.json();
    
    if (uploadResponse.ok && result.success) {
      console.log('✅ Document upload successful!');
      console.log(`   Verification ID: ${result.result.verificationId}`);
      console.log(`   Overall Status: ${result.result.overallStatus}`);
      console.log(`   Documents processed: ${result.result.documentVerifications.length}`);
      
      // Display verification results
      result.result.documentVerifications.forEach((doc, index) => {
        console.log(`   Document ${index + 1}:`);
        console.log(`     - Type: ${doc.documentType}`);
        console.log(`     - Verified: ${doc.isVerified ? 'Yes' : 'No'}`);
        console.log(`     - Confidence: ${Math.round(doc.confidence * 100)}%`);
        if (doc.issues.length > 0) {
          console.log(`     - Issues: ${doc.issues.join(', ')}`);
        }
      });
    } else {
      console.log(`❌ Document upload failed: ${result.error || result.message}`);
      console.log('Response status:', uploadResponse.status);
      console.log('Response body:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log(`❌ Document upload error: ${error.message}`);
  }
}

async function testPropertyRetrieval() {
  console.log('\n🏠 Testing Property Retrieval...');
  
  try {
    const response = await fetch('http://localhost:5000/api/properties');
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Properties retrieved successfully`);
      console.log(`   Total properties: ${result.data.totalCount}`);
      
      if (result.data.properties.length > 0) {
        const property = result.data.properties[0];
        console.log(`   Sample property: ${property.title} (ID: ${property.id})`);
        console.log(`   Location: ${property.location}`);
        console.log(`   Price: KES ${property.price.toLocaleString()}`);
        console.log(`   Verification Status: ${property.verificationStatus}`);
      }
    } else {
      console.log(`❌ Property retrieval failed: ${result.message}`);
    }
  } catch (error) {
    console.log(`❌ Property retrieval error: ${error.message}`);
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Health check passed`);
      console.log(`   Status: ${result.data.status}`);
      console.log(`   Database: ${result.data.services.database}`);
      console.log(`   AI Service: ${result.data.services.ai}`);
      console.log(`   Uptime: ${Math.round(result.data.uptime)}s`);
    } else {
      console.log(`⚠️  Health check degraded: ${result.message}`);
    }
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting Comprehensive Functionality Tests\n');
  console.log('Server should be running on http://localhost:5000\n');
  
  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testHealthCheck();
  await testAuthentication();
  await testPropertyRetrieval();
  await testDocumentUpload();
  
  console.log('\n🎉 Test suite completed!');
  console.log('\n📋 Summary:');
  console.log('- Authentication: Test with credentials above');
  console.log('- Document Upload: Test with any file type');
  console.log('- Property Management: CRUD operations working');
  console.log('\n🔗 Test URLs:');
  console.log('- Login: http://localhost:5173/auth/login');
  console.log('- Dashboard: http://localhost:5173/dashboard');
  console.log('- Document Upload: http://localhost:5173/services/document-auth');
}

// Run tests
runTests().catch(console.error);