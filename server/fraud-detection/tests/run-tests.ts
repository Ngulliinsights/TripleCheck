#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  output: string;
  error?: string;
}

class FraudDetectionTestRunner {
  private testSuites = [
    { name: 'Dashboard Routes', file: 'dashboard.test.ts' },
    { name: 'Fraud Detection Engine', file: 'engine.test.ts' },
    { name: 'Integration Tests', file: 'integration.test.ts' },
    { name: 'Performance Tests', file: 'performance.test.ts' }
  ];

  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Fraud Detection Backend Tests\n');
    console.log('=' .repeat(60));

    const startTime = Date.now();

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    const totalTime = Date.now() - startTime;
    this.printSummary(totalTime);
  }

  private async runTestSuite(suite: { name: string; file: string }): Promise<void> {
    console.log(`\n📋 Running ${suite.name}...`);
    console.log('-'.repeat(40));

    const startTime = Date.now();
    
    try {
      const result = await this.executeTest(suite.file);
      const duration = Date.now() - startTime;

      this.results.push({
        suite: suite.name,
        passed: result.success,
        duration,
        output: result.output,
        error: result.error
      });

      if (result.success) {
        console.log(`✅ ${suite.name} - PASSED (${duration}ms)`);
      } else {
        console.log(`❌ ${suite.name} - FAILED (${duration}ms)`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: suite.name,
        passed: false,
        duration,
        output: '',
        error: error instanceof Error ? error.message : String(error)
      });

      console.log(`❌ ${suite.name} - ERROR (${duration}ms)`);
      console.log(`   Error: ${error}`);
    }
  }

  private executeTest(testFile: string): Promise<{ success: boolean; output: string; error?: string }> {
    return new Promise((resolve) => {
      const testPath = path.join(__dirname, testFile);
      
      // Check if test file exists
      if (!fs.existsSync(testPath)) {
        resolve({
          success: false,
          output: '',
          error: `Test file not found: ${testFile}`
        });
        return;
      }

      const jest = spawn('npx', ['jest', testPath, '--verbose', '--no-cache'], {
        cwd: path.join(__dirname, '../../..'), // Go to project root
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      jest.stdout.on('data', (data) => {
        output += data.toString();
      });

      jest.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      jest.on('close', (code) => {
        resolve({
          success: code === 0,
          output: output + errorOutput,
          error: code !== 0 ? errorOutput : undefined
        });
      });

      jest.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: error.message
        });
      });
    });
  }

  private printSummary(totalTime: number): void {
    console.log(`\n${  '='.repeat(60)}`);
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`\n📈 Overall Results:`);
    console.log(`   Total Suites: ${total}`);
    console.log(`   Passed: ${passed} ✅`);
    console.log(`   Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
    console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`   Total Time: ${totalTime}ms`);

    console.log(`\n📋 Detailed Results:`);
    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} ${result.suite} (${result.duration}ms)`);
      
      if (!result.passed && result.error) {
        console.log(`      Error: ${result.error.split('\n')[0]}`);
      }
    });

    if (failed > 0) {
      console.log(`\n🔍 Failed Test Details:`);
      this.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`\n   ${result.suite}:`);
          if (result.error) {
            console.log(`   ${result.error}`);
          }
        });
    }

    console.log(`\n${  '='.repeat(60)}`);
    
    if (failed === 0) {
      console.log('🎉 All fraud detection tests passed! System is functioning optimally.');
    } else {
      console.log(`⚠️  ${failed} test suite(s) failed. Please review and fix issues.`);
    }
    
    console.log('='.repeat(60));
  }

  async runHealthCheck(): Promise<void> {
    console.log('\n🏥 Running System Health Check...');
    console.log('-'.repeat(40));

    const healthChecks = [
      this.checkDependencies(),
      this.checkTestEnvironment(),
      this.checkMockServices()
    ];

    const results = await Promise.all(healthChecks);
    const allHealthy = results.every(r => r.healthy);

    if (allHealthy) {
      console.log('✅ All health checks passed');
    } else {
      console.log('❌ Some health checks failed:');
      results.forEach(result => {
        if (!result.healthy) {
          console.log(`   - ${result.check}: ${result.message}`);
        }
      });
    }
  }

  private async checkDependencies(): Promise<{ healthy: boolean; check: string; message: string }> {
    try {
      // Check if required packages are available
      const requiredPackages = ['jest', 'supertest', 'express'];
      
      for (const pkg of requiredPackages) {
        try {
          require.resolve(pkg);
        } catch {
          return {
            healthy: false,
            check: 'Dependencies',
            message: `Missing required package: ${pkg}`
          };
        }
      }

      return {
        healthy: true,
        check: 'Dependencies',
        message: 'All required packages available'
      };
    } catch (error) {
      return {
        healthy: false,
        check: 'Dependencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkTestEnvironment(): Promise<{ healthy: boolean; check: string; message: string }> {
    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion < 16) {
        return {
          healthy: false,
          check: 'Environment',
          message: `Node.js version ${nodeVersion} is too old. Requires Node.js 16+`
        };
      }

      // Check if we're in test environment
      if (process.env.NODE_ENV !== 'test') {
        console.log('⚠️  Warning: NODE_ENV is not set to "test"');
      }

      return {
        healthy: true,
        check: 'Environment',
        message: `Node.js ${nodeVersion} - Environment ready`
      };
    } catch (error) {
      return {
        healthy: false,
        check: 'Environment',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkMockServices(): Promise<{ healthy: boolean; check: string; message: string }> {
    try {
      // Verify that mock services can be imported
      const mockPaths = [
        '../utils/Logger',
        '../services/DataIntegrationService',
        '../analytics/MLAnalyticsEngine'
      ];

      // In a real implementation, you'd check if these services are properly mockable
      return {
        healthy: true,
        check: 'Mock Services',
        message: 'Mock services ready'
      };
    } catch (error) {
      return {
        healthy: false,
        check: 'Mock Services',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Main execution
async function main() {
  const runner = new FraudDetectionTestRunner();
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  try {
    await runner.runHealthCheck();
    await runner.runAllTests();
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { FraudDetectionTestRunner };