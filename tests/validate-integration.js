import { promises as fs } from 'fs';
import path from '../scripts/cleanup-redundancies';

async function validateIntegration() {
  console.log('🔍 Validating Kenya Land Verification System Integration');
  console.log('=' .repeat(70));

  let passed = 0;
  let failed = 0;

  // Check backend files
  const backendFiles = [
    'server/land-verification/LandVerificationService.ts',
    'server/land-verification/RiskAssessmentService.ts',
    'server/land-verification/CommunityIntelligenceService.ts',
    'server/land-verification/routes.ts',
    'server/land-verification/index.ts'
  ];

  console.log('⚙️  Checking Backend Services...');
  for (const file of backendFiles) {
    try {
      await fs.access(file);
      console.log(`✅ ${file} - EXISTS`);
      passed++;
    } catch {
      console.log(`❌ ${file} - MISSING`);
      failed++;
    }
  }

  // Check frontend files
  const frontendFiles = [
    'src/land-verification/pages/LandVerificationDashboardPage.tsx',
    'src/land-verification/pages/NewVerificationPage.tsx',
    'src/land-verification/pages/LandVerificationPage.tsx',
    'src/land-verification/index.ts',
    'src/types/land-verification.ts'
  ];

  console.log('\n🎨 Checking Frontend Components...');
  for (const file of frontendFiles) {
    try {
      await fs.access(file);
      console.log(`✅ ${file} - EXISTS`);
      passed++;
    } catch {
      console.log(`❌ ${file} - MISSING`);
      failed++;
    }
  }

  // Check route integration
  console.log('\n🛣️  Checking Route Integration...');
  try {
    const lazyRoutesContent = await fs.readFile('src/app/lazy-routes.tsx', 'utf-8');
    if (lazyRoutesContent.includes('LandVerification')) {
      console.log('✅ Land verification routes added to lazy routes');
      passed++;
    } else {
      console.log('❌ Land verification routes missing from lazy routes');
      failed++;
    }

    const routerContent = await fs.readFile('src/app/router.tsx', 'utf-8');
    if (routerContent.includes('/land-verification')) {
      console.log('✅ Land verification routes added to main router');
      passed++;
    } else {
      console.log('❌ Land verification routes missing from main router');
      failed++;
    }
  } catch (error) {
    console.log('❌ Could not check route integration:', error.message);
    failed += 2;
  }

  // Check test files
  const testFiles = [
    'server/tests/integration/land-verification-system.test.ts',
    'server/tests/e2e/land-verification-workflow.test.ts',
    'server/tests/performance/land-verification-load.test.ts',
    'server/tests/security/land-verification-security.test.ts'
  ];

  console.log('\n🧪 Checking Test Files...');
  for (const file of testFiles) {
    try {
      await fs.access(file);
      console.log(`✅ ${file} - EXISTS`);
      passed++;
    } catch {
      console.log(`❌ ${file} - MISSING`);
      failed++;
    }
  }

  // Summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('=' .repeat(40));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All components are properly integrated!');
    return true;
  } else {
    console.log('\n⚠️  Some components are missing or not properly integrated.');
    return false;
  }
}

validateIntegration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});