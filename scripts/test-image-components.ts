#!/usr/bin/env tsx

/**
 * Test runner for image components
 * Runs comprehensive tests for ImageVault, ImageEngine, and ImageGallery components
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const COMPONENT_TESTS = [
  'src/shared/components/images/__tests__/ImageVault.test.tsx',
  'src/shared/components/images/__tests__/ImageEngine.test.tsx',
  'src/shared/components/images/__tests__/ImageGallery.test.tsx',
  'src/shared/components/images/__tests__/integration.test.tsx',
  'src/shared/components/images/__tests__/performance.test.tsx',
];

interface TestResult {
  file: string;
  passed: boolean;
  duration: number;
  error?: string;
}

class ImageComponentTestRunner {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Running Image Component Tests\n');
    console.log('=' .repeat(60));

    // Verify all test files exist
    const missingFiles = COMPONENT_TESTS.filter(file => !existsSync(file));
    if (missingFiles.length > 0) {
      console.error('❌ Missing test files:');
      missingFiles.forEach(file => console.error(`   - ${file}`));
      process.exit(1);
    }

    // Run each test suite
    for (const testFile of COMPONENT_TESTS) {
      await this.runSingleTest(testFile);
    }

    // Display summary
    this.displaySummary();
  }

  private async runSingleTest(testFile: string): Promise<void> {
    const testName = path.basename(testFile, '.test.tsx');
    console.log(`\n🔍 Running ${testName} tests...`);
    
    const startTime = Date.now();
    
    try {
      const command = `npx vitest run "${testFile}" --reporter=verbose --no-coverage`;
      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd(),
        timeout: 60000 // 1 minute timeout per test file
      });
      
      const duration = Date.now() - startTime;
      this.results.push({
        file: testName,
        passed: true,
        duration
      });
      
      console.log(`✅ ${testName} tests passed (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        file: testName,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
      console.log(`❌ ${testName} tests failed (${duration}ms)`);
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private displaySummary(): void {
    console.log(`\n${  '=' .repeat(60)}`);
    console.log('📊 Test Summary');
    console.log('=' .repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📈 Results:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏱️  Total Duration: ${totalDuration}ms`);

    if (failed > 0) {
      console.log(`\n🚨 Failed Tests:`);
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   - ${r.file}: ${r.error}`);
        });
    }

    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${result.file.padEnd(20)} ${result.duration}ms`);
    });

    // Performance analysis
    console.log('\n⚡ Performance Analysis:');
    const avgDuration = totalDuration / this.results.length;
    console.log(`   Average test duration: ${avgDuration.toFixed(2)}ms`);
    
    const slowTests = this.results.filter(r => r.duration > avgDuration * 1.5);
    if (slowTests.length > 0) {
      console.log(`   Slow tests (>${(avgDuration * 1.5).toFixed(0)}ms):`);
      slowTests.forEach(test => {
        console.log(`     - ${test.file}: ${test.duration}ms`);
      });
    }

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run specific test suites based on command line arguments
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Image Component Test Runner

Usage:
  npm run test:images              # Run all image component tests
  npm run test:images -- --vault   # Run only ImageVault tests
  npm run test:images -- --engine  # Run only ImageEngine tests
  npm run test:images -- --gallery # Run only ImageGallery tests
  npm run test:images -- --integration # Run only integration tests
  npm run test:images -- --performance # Run only performance tests

Options:
  --help, -h    Show this help message
  --verbose     Show detailed output
  --coverage    Run with coverage report
    `);
    return;
  }

  const runner = new ImageComponentTestRunner();

  // Filter tests based on arguments
  if (args.includes('--vault')) {
    console.log('🏦 Running ImageVault tests only...');
    await runner.runSingleTest('src/shared/components/images/__tests__/ImageVault.test.tsx');
  } else if (args.includes('--engine')) {
    console.log('🔧 Running ImageEngine tests only...');
    await runner.runSingleTest('src/shared/components/images/__tests__/ImageEngine.test.tsx');
  } else if (args.includes('--gallery')) {
    console.log('🖼️ Running ImageGallery tests only...');
    await runner.runSingleTest('src/shared/components/images/__tests__/ImageGallery.test.tsx');
  } else if (args.includes('--integration')) {
    console.log('🔗 Running integration tests only...');
    await runner.runSingleTest('src/shared/components/images/__tests__/integration.test.tsx');
  } else if (args.includes('--performance')) {
    console.log('⚡ Running performance tests only...');
    await runner.runSingleTest('src/shared/components/images/__tests__/performance.test.tsx');
  } else {
    // Run all tests
    await runner.runAllTests();
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});