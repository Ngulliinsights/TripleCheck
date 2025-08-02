// TypeScript test script to check component imports
import { config } from 'dotenv';

// Load environment variables
config();

async function testImports() {
  const componentsToTest = [
    { name: 'Home', path: './src/shared/pages/Home' },
    { name: 'Features', path: './src/shared/pages/Features' },
    { name: 'Pricing', path: './src/shared/pages/Pricing' },
    { name: 'Login', path: './src/auth/pages/Login' },
    { name: 'Register', path: './src/auth/pages/Register' },
    { name: 'Dashboard', path: './src/user/pages/Dashboard' },
    { name: 'PropertyDetails', path: './src/property/pages/PropertyDetails' },
    { name: 'PropertyCompare', path: './src/property/pages/PropertyCompare' },
    { name: 'BasicChecks', path: './src/trust/pages/BasicChecks' },
    { name: 'SearchResults', path: './src/search/pages/SearchResults' },
    { name: 'NotFound', path: './src/shared/pages/NotFound' },
    { name: 'ComingSoon', path: './src/shared/pages/ComingSoon' },
  ];

  console.log('Testing component imports with tsx...\n');

  for (const component of componentsToTest) {
    try {
      const module = await import(component.path);
      if (module.default) {
        console.log(`✅ ${component.name}: Import successful`);
      } else {
        console.log(`❌ ${component.name}: No default export found`);
      }
    } catch (error: any) {
      console.log(`❌ ${component.name}: Import failed - ${error.message}`);
    }
  }

  console.log('\nTesting lazy-routes module...');
  try {
    const lazyRoutes = await import('./src/app/lazy-routes');
    console.log('✅ lazy-routes.tsx: Import successful');
    
    if (lazyRoutes.WorkingRoutes) {
      console.log('✅ WorkingRoutes object exists');
      const routeNames = Object.keys(lazyRoutes.WorkingRoutes);
      console.log(`📊 Found ${routeNames.length} routes`);
      
      // Test a few specific routes
      const testRoutes = ['Home', 'Login', 'PropertyCompare', 'MyProperties'];
      for (const routeName of testRoutes) {
        if (lazyRoutes.WorkingRoutes[routeName as keyof typeof lazyRoutes.WorkingRoutes]) {
          console.log(`✅ Route ${routeName}: Exists in WorkingRoutes`);
        } else {
          console.log(`❌ Route ${routeName}: Missing from WorkingRoutes`);
        }
      }
    } else {
      console.log('❌ WorkingRoutes object not found');
    }
  } catch (error: any) {
    console.log(`❌ lazy-routes.tsx: Import failed - ${error.message}`);
  }
}

testImports().catch(console.error);