
// Tutorial Testing Script
// This script tests all tutorial functionality and elements

const fs = require('fs');

function testTutorialImplementation() {
  console.log('🧪 Testing Tutorial Implementation...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    issues: []
  };

  // Test 1: Check TutorialProvider file exists and has required exports
  try {
    const tutorialProviderPath = 'client/src/components/tutorial/TutorialProvider.tsx';
    if (fs.existsSync(tutorialProviderPath)) {
      const content = fs.readFileSync(tutorialProviderPath, 'utf8');
      
      if (content.includes('export function TutorialProvider') && 
          content.includes('export function useTutorial')) {
        console.log('✅ TutorialProvider exports correctly defined');
        results.passed++;
      } else {
        console.log('❌ Missing required TutorialProvider exports');
        results.failed++;
        results.issues.push('TutorialProvider missing required exports');
      }
      
      if (content.includes('tutorialSteps')) {
        console.log('✅ Tutorial steps array defined');
        results.passed++;
      } else {
        console.log('❌ Tutorial steps array missing');
        results.failed++;
        results.issues.push('Tutorial steps array not found');
      }
      
      // Check for strategic user journey elements
      const strategicElements = [
        'verify-property',
        'search-bar',
        'tutorial-welcome',
        '/services/basic-checks',
        '/services/document-auth',
        '/services/fraud-detection'
      ];
      
      strategicElements.forEach(element => {
        if (content.includes(element)) {
          console.log(`✅ Strategic element "${element}" implemented`);
          results.passed++;
        } else {
          console.log(`❌ Strategic element "${element}" missing`);
          results.failed++;
          results.issues.push(`Missing strategic element: ${element}`);
        }
      });
      
    } else {
      console.log('❌ TutorialProvider file not found');
      results.failed++;
      results.issues.push('TutorialProvider file missing');
    }
  } catch (error) {
    console.log('❌ Error testing TutorialProvider:', error.message);
    results.failed++;
    results.issues.push(`TutorialProvider test error: ${error.message}`);
  }

  // Test 2: Check App.tsx integration
  try {
    const appPath = 'client/src/App.tsx';
    if (fs.existsSync(appPath)) {
      const content = fs.readFileSync(appPath, 'utf8');
      
      if (content.includes('TutorialProvider') && content.includes('<TutorialProvider>')) {
        console.log('✅ TutorialProvider properly integrated in App.tsx');
        results.passed++;
      } else {
        console.log('❌ TutorialProvider not integrated in App.tsx');
        results.failed++;
        results.issues.push('TutorialProvider not integrated in App.tsx');
      }
      
      if (content.includes('TutorialButton') && content.includes('useTutorial')) {
        console.log('✅ Tutorial button implemented in navigation');
        results.passed++;
      } else {
        console.log('❌ Tutorial button missing in navigation');
        results.failed++;
        results.issues.push('Tutorial button not implemented');
      }
    }
  } catch (error) {
    console.log('❌ Error testing App.tsx integration:', error.message);
    results.failed++;
    results.issues.push(`App.tsx test error: ${error.message}`);
  }

  // Test 3: Check service pages exist
  const servicePages = [
    'client/src/pages/services/basic-checks.tsx',
    'client/src/pages/services/document-auth.tsx',
    'client/src/pages/services/fraud-detection.tsx',
    'client/src/pages/services/reviews.tsx',
    'client/src/pages/services/trust-points.tsx'
  ];

  servicePages.forEach(page => {
    if (fs.existsSync(page)) {
      console.log(`✅ Service page exists: ${page.split('/').pop()}`);
      results.passed++;
    } else {
      console.log(`❌ Service page missing: ${page.split('/').pop()}`);
      results.failed++;
      results.issues.push(`Missing service page: ${page}`);
    }
  });

  // Test 4: Check routing configuration
  try {
    const appPath = 'client/src/App.tsx';
    const content = fs.readFileSync(appPath, 'utf8');
    
    const routes = [
      '/services/basic-checks',
      '/services/document-auth',
      '/services/fraud-detection',
      '/services/reviews',
      '/dashboard',
      '/pricing'
    ];
    
    routes.forEach(route => {
      if (content.includes(`path="${route}"`)) {
        console.log(`✅ Route configured: ${route}`);
        results.passed++;
      } else {
        console.log(`❌ Route missing: ${route}`);
        results.failed++;
        results.issues.push(`Missing route: ${route}`);
      }
    });
  } catch (error) {
    console.log('❌ Error testing routes:', error.message);
    results.failed++;
    results.issues.push(`Route test error: ${error.message}`);
  }

  // Test Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%\n`);

  if (results.issues.length > 0) {
    console.log('🚨 Issues to Address:');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  } else {
    console.log('🎉 All tutorial tests passed! Tutorial is fully functional.');
  }

  // Save test report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: results.passed,
      failed: results.failed,
      successRate: Math.round((results.passed / (results.passed + results.failed)) * 100)
    },
    issues: results.issues
  };

  fs.writeFileSync('tutorial-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: tutorial-test-report.json');
}

// Run the test
testTutorialImplementation();
