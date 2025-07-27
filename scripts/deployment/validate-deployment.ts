#!/usr/bin/env tsx

import { DeploymentTester } from './deployment-tests';

async function validateDeployment() {
  const environment = process.env.NODE_ENV || 'development';
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const apiKey = process.env.API_KEY;

  console.log(`🔍 Validating deployment for ${environment} environment`);
  console.log(`🎯 Target URL: ${baseUrl}`);

  const tester = new DeploymentTester(baseUrl, apiKey);
  
  try {
    const results = await tester.runAllTests();
    const overallPassed = results.every(suite => suite.passed);
    
    if (overallPassed) {
      console.log('✅ Deployment validation passed');
      return true;
    } else {
      console.log('❌ Deployment validation failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Deployment validation error:', error);
    return false;
  }
}

if (require.main === module) {
  validateDeployment().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { validateDeployment };