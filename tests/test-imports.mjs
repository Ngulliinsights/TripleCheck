// Test script to check if components can be imported
// Note: This script tests the file existence and basic structure
// For actual TypeScript imports, we need to use tsx or the build system

async function testImports() {
  const componentsToTest = [
    { name: 'Home', path: './src/shared/pages/Home.tsx' },
    { name: 'Features', path: './src/shared/pages/Features.tsx' },
    { name: 'Pricing', path: './src/shared/pages/Pricing.tsx' },
    { name: 'Login', path: './src/auth/pages/Login.tsx' },
    { name: 'Register', path: './src/auth/pages/Register.tsx' },
    { name: 'Dashboard', path: './src/user/pages/Dashboard.tsx' },
    { name: 'PropertyDetails', path: './src/property/pages/PropertyDetails.tsx' },
    { name: 'PropertyCompare', path: './src/property/pages/PropertyCompare.tsx' },
    { name: 'BasicChecks', path: './src/trust/pages/BasicChecks.tsx' },
    { name: 'SearchResults', path: './src/search/pages/SearchResults.tsx' },
    { name: 'NotFound', path: './src/shared/pages/NotFound.tsx' },
    { name: 'ComingSoon', path: './src/shared/pages/ComingSoon.tsx' },
  ];

  console.log('Testing component imports...\n');

  for (const component of componentsToTest) {
    try {
      const module = await import(component.path);
      if (module.default) {
        console.log(`✅ ${component.name}: Import successful`);
      } else {
        console.log(`❌ ${component.name}: No default export found`);
      }
    } catch (error) {
      console.log(`❌ ${component.name}: Import failed - ${error.message}`);
    }
  }

  console.log('\nTesting lazy-routes module...');
  try {
    const lazyRoutes = await import('./src/app/lazy-routes.tsx');
    console.log('✅ lazy-routes.tsx: Import successful');
    
    if (lazyRoutes.WorkingRoutes) {
      console.log('✅ WorkingRoutes object exists');
      const routeNames = Object.keys(lazyRoutes.WorkingRoutes);
      console.log(`📊 Found ${routeNames.length} routes:`, routeNames.slice(0, 10).join(', '), '...');
    } else {
      console.log('❌ WorkingRoutes object not found');
    }
  } catch (error) {
    console.log(`❌ lazy-routes.tsx: Import failed - ${error.message}`);
  }
}

testImports().catch(console.error);