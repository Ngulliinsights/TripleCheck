import { promises as fs } from 'fs';

async function testBasicIntegration() {
  console.log('🧪 Testing Basic Land Verification Integration');
  console.log('=' .repeat(50));

  let tests = 0;
  let passed = 0;

  // Test 1: Check if services can be imported
  console.log('Test 1: Service Import Test');
  tests++;
  try {
    const serviceContent = await fs.readFile('server/land-verification/LandVerificationService.ts', 'utf-8');
    if (serviceContent.includes('export class LandVerificationService')) {
      console.log('✅ LandVerificationService exports correctly');
      passed++;
    } else {
      console.log('❌ LandVerificationService export not found');
    }
  } catch (error) {
    console.log('❌ Could not read LandVerificationService:', error.message);
  }

  // Test 2: Check if routes are properly structured
  console.log('\nTest 2: Routes Structure Test');
  tests++;
  try {
    const routesContent = await fs.readFile('server/land-verification/routes.ts', 'utf-8');
    if (routesContent.includes('router') && routesContent.includes('POST') && routesContent.includes('GET')) {
      console.log('✅ Routes are properly structured');
      passed++;
    } else {
      console.log('❌ Routes structure incomplete');
    }
  } catch (error) {
    console.log('❌ Could not read routes file:', error.message);
  }

  // Test 3: Check if frontend components are React components
  console.log('\nTest 3: Frontend Components Test');
  tests++;
  try {
    const dashboardContent = await fs.readFile('src/land-verification/pages/LandVerificationDashboardPage.tsx', 'utf-8');
    if (dashboardContent.includes('export') && (dashboardContent.includes('function') || dashboardContent.includes('const'))) {
      console.log('✅ Dashboard component is properly structured');
      passed++;
    } else {
      console.log('❌ Dashboard component structure incomplete');
    }
  } catch (error) {
    console.log('❌ Could not read dashboard component:', error.message);
  }

  // Test 4: Check if types are defined
  console.log('\nTest 4: TypeScript Types Test');
  tests++;
  try {
    const typesContent = await fs.readFile('src/types/land-verification.ts', 'utf-8');
    if (typesContent.includes('interface') || typesContent.includes('type')) {
      console.log('✅ TypeScript types are defined');
      passed++;
    } else {
      console.log('❌ TypeScript types not found');
    }
  } catch (error) {
    console.log('❌ Could not read types file:', error.message);
  }

  // Test 5: Check if routes are integrated
  console.log('\nTest 5: Route Integration Test');
  tests++;
  try {
    const routerContent = await fs.readFile('src/app/router.tsx', 'utf-8');
    const lazyRoutesContent = await fs.readFile('src/app/lazy-routes.tsx', 'utf-8');
    
    if (routerContent.includes('/land-verification') && lazyRoutesContent.includes('LandVerification')) {
      console.log('✅ Routes are properly integrated');
      passed++;
    } else {
      console.log('❌ Route integration incomplete');
    }
  } catch (error) {
    console.log('❌ Could not check route integration:', error.message);
  }

  // Test 6: Check if all required services exist
  console.log('\nTest 6: All Services Exist Test');
  tests++;
  const requiredServices = [
    'server/land-verification/RiskAssessmentService.ts',
    'server/land-verification/CommunityIntelligenceService.ts',
    'server/land-verification/ExpertCoordinationService.ts',
    'server/land-verification/MonitoringService.ts'
  ];

  let servicesExist = 0;
  for (const service of requiredServices) {
    try {
      await fs.access(service);
      servicesExist++;
    } catch {
      // Service doesn't exist
    }
  }

  if (servicesExist === requiredServices.length) {
    console.log('✅ All required services exist');
    passed++;
  } else {
    console.log(`❌ Only ${servicesExist}/${requiredServices.length} services exist`);
  }

  // Summary
  console.log('\n📊 INTEGRATION TEST SUMMARY');
  console.log('=' .repeat(30));
  console.log(`Tests Run: ${tests}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${tests - passed}`);
  console.log(`Success Rate: ${((passed / tests) * 100).toFixed(1)}%`);

  if (passed === tests) {
    console.log('\n🎉 All integration tests passed!');
    console.log('✅ System is ready for comprehensive testing');
    return true;
  } else {
    console.log('\n⚠️  Some integration tests failed');
    console.log('❌ System needs fixes before comprehensive testing');
    return false;
  }
}

testBasicIntegration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Integration test failed:', error);
  process.exit(1);
});