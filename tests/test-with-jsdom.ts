// Test that mimics the actual test environment with jsdom
import { JSDOM } from 'jsdom';

// Set up jsdom environment like in tests
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Set up global environment like in tests
Object.defineProperty(global, 'window', { value: dom.window, writable: true });
Object.defineProperty(global, 'document', { value: dom.window.document, writable: true });
Object.defineProperty(global, 'HTMLElement', { value: dom.window.HTMLElement, writable: true });

// Mock import.meta.env
(global as any).importMeta = {
  env: {
    VITE_DEMO_USER_PASSWORD: 'demo123',
    VITE_DEMO_AGENT_PASSWORD: 'agent123',
    VITE_GOOGLE_MAPS_API_KEY: 'test-key',
  }
};

async function testWithJSDOM() {
  console.log('🧪 Testing routes in jsdom environment (like actual tests)...\n');

  try {
    // Import React and testing utilities
    const React = await import('react');
    
    // Import the lazy routes
    const lazyRoutes = await import('./src/app/lazy-routes');
    
    if (!lazyRoutes.WorkingRoutes) {
      console.log('❌ WorkingRoutes not found');
      return;
    }

    const routes = lazyRoutes.WorkingRoutes;
    const routeNames = Object.keys(routes);
    
    console.log(`📊 Testing ${routeNames.length} routes in jsdom environment\n`);

    const results = {
      success: [] as string[],
      failed: [] as { name: string; error: string }[],
    };

    // Test a sample of routes that were failing in the original tests
    const testRoutes = [
      'Home', 'Features', 'Pricing', 'Login', 'Register',
      'Dashboard', 'PropertyDetails', 'PropertyCompare', 'ListProperty',
      'BasicChecks', 'FraudDetection', 'DocumentAuth', 'Reports',
      'Team', 'Inbox', 'SearchResults', 'NotFound', 'MyProperties'
    ];

    for (const routeName of testRoutes) {
      try {
        console.log(`Testing ${routeName}...`);
        
        const RouteComponent = routes[routeName as keyof typeof routes];
        
        if (!RouteComponent) {
          results.failed.push({
            name: routeName,
            error: 'Route component is undefined'
          });
          continue;
        }

        // Try to create a React element (this will trigger lazy loading)
        const element = React.createElement(RouteComponent as any);
        
        if (element) {
          results.success.push(routeName);
          console.log(`✅ ${routeName}: React element created successfully`);
        } else {
          results.failed.push({
            name: routeName,
            error: 'Failed to create React element'
          });
          console.log(`❌ ${routeName}: Failed to create React element`);
        }

      } catch (error: any) {
        results.failed.push({
          name: routeName,
          error: error.message
        });
        console.log(`❌ ${routeName}: ${error.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 JSDOM TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
      console.log('\n❌ FAILED ROUTES:');
      console.log('-'.repeat(40));
      results.failed.forEach(error => {
        console.log(`❌ ${error.name}: ${error.error}`);
      });
    }

  } catch (error: any) {
    console.log(`❌ Failed to set up test environment: ${error.message}`);
  }
}

testWithJSDOM().catch(console.error);