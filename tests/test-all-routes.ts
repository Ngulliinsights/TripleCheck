// Comprehensive test to find ALL 404 errors in lazy routes
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config();

// Mock import.meta.env for components that need it
(globalThis as any).importMeta = {
  env: {
    VITE_DEMO_USER_PASSWORD: process.env.VITE_DEMO_USER_PASSWORD || 'demo123',
    VITE_DEMO_AGENT_PASSWORD: process.env.VITE_DEMO_AGENT_PASSWORD || 'agent123',
    VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY || 'test-key',
  }
};

async function testAllRoutes() {
  console.log('🔍 Testing ALL routes for 404 errors...\n');

  try {
    // Import the lazy routes module
    const lazyRoutes = await import('./src/app/lazy-routes');
    
    if (!lazyRoutes.WorkingRoutes) {
      console.log('❌ WorkingRoutes not found in lazy-routes module');
      return;
    }

    const routes = lazyRoutes.WorkingRoutes;
    const routeNames = Object.keys(routes);
    
    console.log(`📊 Found ${routeNames.length} routes to test\n`);

    const results = {
      success: [] as string[],
      failed: [] as { name: string; error: string; isFileNotFound: boolean }[],
      comingSoon: [] as string[],
    };

    // Test each route
    for (const routeName of routeNames) {
      try {
        const RouteComponent = routes[routeName as keyof typeof routes];
        
        if (!RouteComponent) {
          results.failed.push({
            name: routeName,
            error: 'Route component is undefined',
            isFileNotFound: false
          });
          continue;
        }

        // Try to render the component to trigger lazy loading
        console.log(`Testing ${routeName}...`);
        
        // For lazy components, we need to actually trigger the import
        // This is a bit tricky, but we can try to access the component's internal loader
        if (RouteComponent && typeof RouteComponent === 'object' && '_payload' in RouteComponent) {
          // This is a React lazy component, try to trigger its loader
          const payload = (RouteComponent as any)._payload;
          if (payload && typeof payload._result === 'undefined') {
            // Component hasn't been loaded yet, trigger the loader
            try {
              await (RouteComponent as any)._init((RouteComponent as any)._payload);
            } catch (loadError: any) {
              if (loadError.message.includes('Cannot resolve module') || 
                  loadError.message.includes('Module not found') ||
                  loadError.message.includes('Failed to resolve')) {
                results.failed.push({
                  name: routeName,
                  error: loadError.message,
                  isFileNotFound: true
                });
                console.log(`❌ ${routeName}: 404 - ${loadError.message}`);
                continue;
              } else {
                // Other error (like environment variables, etc.)
                results.failed.push({
                  name: routeName,
                  error: loadError.message,
                  isFileNotFound: false
                });
                console.log(`⚠️  ${routeName}: Runtime error - ${loadError.message}`);
                continue;
              }
            }
          }
        }

        results.success.push(routeName);
        console.log(`✅ ${routeName}: OK`);

      } catch (error: any) {
        if (error.message.includes('Cannot resolve module') || 
            error.message.includes('Module not found') ||
            error.message.includes('Failed to resolve')) {
          results.failed.push({
            name: routeName,
            error: error.message,
            isFileNotFound: true
          });
          console.log(`❌ ${routeName}: 404 - ${error.message}`);
        } else {
          results.failed.push({
            name: routeName,
            error: error.message,
            isFileNotFound: false
          });
          console.log(`⚠️  ${routeName}: Runtime error - ${error.message}`);
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    const fileNotFoundErrors = results.failed.filter(f => f.isFileNotFound);
    const runtimeErrors = results.failed.filter(f => !f.isFileNotFound);
    
    console.log(`🚫 404 Errors (File Not Found): ${fileNotFoundErrors.length}`);
    console.log(`⚠️  Runtime Errors: ${runtimeErrors.length}`);

    if (fileNotFoundErrors.length > 0) {
      console.log('\n🚫 404 ERRORS (Missing Files):');
      console.log('-'.repeat(40));
      fileNotFoundErrors.forEach(error => {
        console.log(`❌ ${error.name}: ${error.error}`);
      });
    }

    if (runtimeErrors.length > 0) {
      console.log('\n⚠️  RUNTIME ERRORS:');
      console.log('-'.repeat(40));
      runtimeErrors.forEach(error => {
        console.log(`⚠️  ${error.name}: ${error.error}`);
      });
    }

    if (results.success.length > 0) {
      console.log('\n✅ SUCCESSFUL ROUTES:');
      console.log('-'.repeat(40));
      results.success.forEach(name => {
        console.log(`✅ ${name}`);
      });
    }

  } catch (error: any) {
    console.log(`❌ Failed to load lazy-routes module: ${error.message}`);
  }
}

testAllRoutes().catch(console.error);