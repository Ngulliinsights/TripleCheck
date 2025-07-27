#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

interface TestSuite {
  name: string;
  path: string;
  timeout: number;
  critical: boolean;
  description: string;
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  output: string;
  error?: string;
}

class FinalIntegrationTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'System Integration',
      path: './integration/land-verification-system.test.ts',
      timeout: 120000, // 2 minutes
      critical: true,
      description: 'Tests integration between all land verification components and existing platform'
    },
    {
      name: 'End-to-End Workflow',
      path: './e2e/land-verification-workflow.test.ts',
      timeout: 300000, // 5 minutes
      critical: true,
      description: 'Tests complete user workflows from frontend to backend'
    },
    {
      name: 'Performance Load Testing',
      path: './performance/land-verification-load.test.ts',
      timeout: 180000, // 3 minutes
      critical: false,
      description: 'Tests system performance under realistic load conditions'
    },
    {
      name: 'Security Audit',
      path: './security/land-verification-security.test.ts',
      timeout: 120000, // 2 minutes
      critical: true,
      description: 'Comprehensive security testing and vulnerability assessment'
    }
  ];

  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Final Integration Testing for Kenya Land Verification System');
    console.log('=' .repeat(80));
    
    this.startTime = performance.now();
    
    // Check prerequisites
    await this.checkPrerequisites();
    
    // Run test suites
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }
    
    // Generate final report
    await this.generateFinalReport();
    
    // Exit with appropriate code
    const criticalFailures = this.results.filter(r => !r.passed && 
      this.testSuites.find(s => s.name === r.suite)?.critical);
    
    if (criticalFailures.length > 0) {
      console.log('\n❌ Critical test failures detected. System not ready for deployment.');
      process.exit(1);
    } else {
      console.log('\n✅ All critical tests passed. System ready for deployment.');
      process.exit(0);
    }
  }

  private async checkPrerequisites(): Promise<void> {
    console.log('🔍 Checking prerequisites...');
    
    // Check if database is running
    try {
      const { database } = await import('../lib/database');
      await database.query('SELECT 1');
      console.log('✅ Database connection verified');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw new Error('Database not available');
    }
    
    // Check if required test fixtures exist
    const requiredFixtures = [
      './test-fixtures/sample-title-deed.pdf',
      './test-fixtures/boundary-photo.jpg',
      './test-fixtures/problematic-title-deed.pdf'
    ];
    
    for (const fixture of requiredFixtures) {
      try {
        await fs.access(fixture);
        console.log(`✅ Test fixture found: ${fixture}`);
      } catch {
        console.log(`⚠️  Test fixture missing: ${fixture} (creating mock)`);
        await this.createMockFixture(fixture);
      }
    }
    
    // Check environment variables
    const requiredEnvVars = ['NODE_ENV', 'DATABASE_URL'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.warn(`⚠️  Environment variable ${envVar} not set`);
      } else {
        console.log(`✅ Environment variable ${envVar} configured`);
      }
    }
    
    console.log('✅ Prerequisites check completed\n');
  }

  private async createMockFixture(fixturePath: string): Promise<void> {
    const dir = path.dirname(fixturePath);
    await fs.mkdir(dir, { recursive: true });
    
    if (fixturePath.endsWith('.pdf')) {
      // Create a minimal PDF file
      const pdfContent = Buffer.from([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
        0x0A, 0x25, 0xC4, 0xE5, 0xF2, 0xE5, 0xEB, 0xA7, 0xF3, 0xA0, 0xD0, 0xC4, 0xC6, 0x0A,
        // Minimal PDF structure
        0x31, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x0A, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2F, 0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x0A, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x0A, 0x3E, 0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A
      ]);
      await fs.writeFile(fixturePath, pdfContent);
    } else if (fixturePath.endsWith('.jpg')) {
      // Create a minimal JPEG file
      const jpegContent = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
        0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
        0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xD9
      ]);
      await fs.writeFile(fixturePath, jpegContent);
    } else {
      // Create a text file
      await fs.writeFile(fixturePath, 'Mock test fixture file');
    }
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`🧪 Running ${suite.name} Tests`);
    console.log(`   ${suite.description}`);
    console.log(`   Timeout: ${suite.timeout / 1000}s | Critical: ${suite.critical ? 'Yes' : 'No'}`);
    console.log('-'.repeat(60));
    
    const startTime = performance.now();
    
    try {
      const result = await this.executeTest(suite);
      const duration = performance.now() - startTime;
      
      this.results.push({
        suite: suite.name,
        passed: result.success,
        duration,
        output: result.output,
        error: result.error
      });
      
      if (result.success) {
        console.log(`✅ ${suite.name} - PASSED (${(duration / 1000).toFixed(2)}s)`);
      } else {
        console.log(`❌ ${suite.name} - FAILED (${(duration / 1000).toFixed(2)}s)`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
      
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.push({
        suite: suite.name,
        passed: false,
        duration,
        output: '',
        error: error instanceof Error ? error.message : String(error)
      });
      
      console.log(`❌ ${suite.name} - ERROR (${(duration / 1000).toFixed(2)}s)`);
      console.log(`   Error: ${error}`);
    }
    
    console.log('');
  }

  private async executeTest(suite: TestSuite): Promise<{ success: boolean; output: string; error?: string }> {
    return new Promise((resolve) => {
      const testProcess = spawn('npx', ['jest', suite.path, '--verbose', '--detectOpenHandles'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: suite.timeout
      });

      let output = '';
      let errorOutput = '';

      testProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      testProcess.on('close', (code) => {
        resolve({
          success: code === 0,
          output: output + errorOutput,
          error: code !== 0 ? `Process exited with code ${code}` : undefined
        });
      });

      testProcess.on('error', (error) => {
        resolve({
          success: false,
          output: output + errorOutput,
          error: error.message
        });
      });

      // Handle timeout
      setTimeout(() => {
        testProcess.kill('SIGTERM');
        resolve({
          success: false,
          output: output + errorOutput,
          error: `Test suite timed out after ${suite.timeout / 1000}s`
        });
      }, suite.timeout);
    });
  }

  private async generateFinalReport(): Promise<void> {
    const totalDuration = performance.now() - this.startTime;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    const criticalFailures = this.results.filter(r => !r.passed && 
      this.testSuites.find(s => s.name === r.suite)?.critical).length;

    console.log('📊 FINAL INTEGRATION TEST REPORT');
    console.log('=' .repeat(80));
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Test Suites: ${this.results.length}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Critical Failures: ${criticalFailures}`);
    console.log('');

    // Detailed results
    console.log('📋 DETAILED RESULTS');
    console.log('-'.repeat(80));
    
    for (const result of this.results) {
      const suite = this.testSuites.find(s => s.name === result.suite);
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const critical = suite?.critical ? ' (CRITICAL)' : '';
      
      console.log(`${status} ${result.suite}${critical} - ${(result.duration / 1000).toFixed(2)}s`);
      
      if (!result.passed && result.error) {
        console.log(`     Error: ${result.error}`);
      }
    }
    
    console.log('');

    // Generate detailed report file
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration: totalDuration,
      summary: {
        total: this.results.length,
        passed: passedTests,
        failed: failedTests,
        criticalFailures
      },
      results: this.results.map(result => ({
        ...result,
        suite: this.testSuites.find(s => s.name === result.suite)
      }))
    };

    const reportPath = path.join(process.cwd(), 'final-integration-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    // Generate summary for CI/CD
    const summaryPath = path.join(process.cwd(), 'test-summary.txt');
    const summaryContent = [
      `FINAL INTEGRATION TEST SUMMARY`,
      `Timestamp: ${new Date().toISOString()}`,
      `Duration: ${(totalDuration / 1000).toFixed(2)}s`,
      `Results: ${passedTests}/${this.results.length} passed`,
      `Critical Failures: ${criticalFailures}`,
      `Status: ${criticalFailures === 0 ? 'READY FOR DEPLOYMENT' : 'NOT READY - CRITICAL FAILURES'}`
    ].join('\n');
    
    await fs.writeFile(summaryPath, summaryContent);
    console.log(`📄 CI/CD summary saved to: ${summaryPath}`);
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const runner = new FinalIntegrationTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Fatal error running integration tests:', error);
    process.exit(1);
  });
}

export { FinalIntegrationTestRunner };