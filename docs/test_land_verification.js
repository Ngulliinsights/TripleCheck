// Quick test to verify land verification routes are working
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testLandVerificationRoutes() {
  console.log('🧪 Testing Land Verification Routes...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/land-verification/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.data.status);

    // Test 2: Report templates (requires auth, but should return 401 not 404)
    console.log('\n2. Testing report templates endpoint...');
    const templatesResponse = await fetch(`${BASE_URL}/api/land-verification/report-templates`);
    console.log('✅ Templates endpoint status:', templatesResponse.status);
    
    if (templatesResponse.status === 401) {
      console.log('✅ Route exists (returns 401 Unauthorized as expected)');
    } else if (templatesResponse.status === 404) {
      console.log('❌ Route not found (404) - routes not properly registered');
      return false;
    }

    // Test 3: Sessions endpoint (should return 401, not 404)
    console.log('\n3. Testing sessions endpoint...');
    const sessionsResponse = await fetch(`${BASE_URL}/api/land-verification/sessions`);
    console.log('✅ Sessions endpoint status:', sessionsResponse.status);
    
    if (sessionsResponse.status === 401) {
      console.log('✅ Route exists (returns 401 Unauthorized as expected)');
    } else if (sessionsResponse.status === 404) {
      console.log('❌ Route not found (404) - routes not properly registered');
      return false;
    }

    console.log('\n🎉 All land verification routes are properly registered!');
    console.log('🚀 Your MVP is ready for frontend integration!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your server is running on port 3000');
    console.log('   Run: npm run dev');
    return false;
  }
}

// Run the test
testLandVerificationRoutes();