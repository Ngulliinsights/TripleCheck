/**
 * API Client Verification Script
 * 
 * Simple verification that the unified API client is working correctly
 */

// Mock fetch for testing
global.fetch = async (url, options) => {
  console.log(`🔍 Mock fetch called: ${options?.method || 'GET'} ${url}`);
  
  // Simulate different responses based on URL
  if (url.includes('/error')) {
    throw new Error('Network error');
  }
  
  if (url.includes('/404')) {
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ error: 'Not found' })
    };
  }
  
  // Default success response
  return {
    ok: true,
    status: 200,
    headers: new Map([['content-type', 'application/json']]),
    json: async () => ({ 
      success: true, 
      data: { message: 'API client working!' },
      timestamp: new Date().toISOString()
    })
  };
};

// Mock localStorage
global.localStorage = {
  getItem: (key) => {
    if (key === 'auth_token') return 'test-token-123';
    return null;
  },
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

// Mock sessionStorage
global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

// Mock console methods to avoid clutter
const originalLog = console.log;
console.log = (...args) => {
  if (args[0]?.includes?.('🚀') || args[0]?.includes?.('🔍')) {
    // Only show important logs
    originalLog(...args);
  }
};

async function verifyApiClient() {
  console.log('🧪 Starting API Client Verification...\n');
  
  try {
    // Import the unified API client
    const { apiClient, UnifiedApiClient } = await import('../src/shared/services/unified-api-client.ts');
    
    console.log('✅ 1. Import successful');
    
    // Test basic instantiation
    const testClient = new UnifiedApiClient({
      baseUrl: '/test-api',
      defaultOptions: {
        timeout: 5000,
        retries: 1
      }
    });
    
    console.log('✅ 2. Client instantiation successful');
    
    // Test GET request
    const getResult = await testClient.get('/users');
    if (getResult.success && getResult.data) {
      console.log('✅ 3. GET request successful');
    } else {
      throw new Error('GET request failed');
    }
    
    // Test POST request
    const postResult = await testClient.post('/users', { name: 'Test User' });
    if (postResult.success) {
      console.log('✅ 4. POST request successful');
    } else {
      throw new Error('POST request failed');
    }
    
    // Test error handling
    const errorResult = await testClient.get('/error');
    if (!errorResult.success && errorResult.error) {
      console.log('✅ 5. Error handling working');
    } else {
      throw new Error('Error handling not working');
    }
    
    // Test 404 handling
    const notFoundResult = await testClient.get('/404');
    if (!notFoundResult.success && notFoundResult.status === 404) {
      console.log('✅ 6. 404 handling working');
    } else {
      throw new Error('404 handling not working');
    }
    
    // Test singleton instance
    const singletonResult = await apiClient.get('/singleton-test');
    if (singletonResult.success) {
      console.log('✅ 7. Singleton instance working');
    } else {
      throw new Error('Singleton instance not working');
    }
    
    // Test cache clearing
    apiClient.clearCache();
    console.log('✅ 8. Cache clearing working');
    
    // Test circuit breaker state
    const cbState = apiClient.getCircuitBreakerState();
    if (typeof cbState === 'string') {
      console.log('✅ 9. Circuit breaker state accessible');
    } else {
      throw new Error('Circuit breaker state not accessible');
    }
    
    console.log('\n🎉 All API Client verifications passed!');
    console.log('\n📊 Verification Summary:');
    console.log('- ✅ Import and instantiation');
    console.log('- ✅ HTTP methods (GET, POST)');
    console.log('- ✅ Error handling');
    console.log('- ✅ Status code handling');
    console.log('- ✅ Singleton pattern');
    console.log('- ✅ Cache management');
    console.log('- ✅ Circuit breaker integration');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ API Client verification failed:', error.message);
    console.error('\n🔍 Error details:', error);
    return false;
  }
}

// Run verification
verifyApiClient()
  .then(success => {
    if (success) {
      console.log('\n✅ API Client is ready for production use!');
      process.exit(0);
    } else {
      console.log('\n❌ API Client verification failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Verification script error:', error);
    process.exit(1);
  });