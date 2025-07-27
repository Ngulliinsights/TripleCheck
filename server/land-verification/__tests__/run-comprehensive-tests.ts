#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  duration: number;
  coverage?: number;
}

class ComprehensiveTestRunner {
  private results: TestResult[] = [];
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
  }

  async runTestSuite(suiteName: string, testPattern: string, options: string = ''): Promise<TestResult> {
    console.log(`\n🧪 Running ${suiteName}...`);
    const suiteStartTime = performance.now();

    try {
      const command = `vitest run ${testPattern} ${options} --reporter=json`;
      const output = execSync(command, { 
        encoding: 'utf-8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const result = JSON.parse(output);
      const duration = performance.now() - suiteStartTime;

      const testResult: TestResult = {
        suite: suiteName,
        passed: result.numPassedTests || 0,
        failed: result.numFailedTests || 0,
        duration: Math.round(duration),
        coverage: result.coverageMap ? this.calculateCoverage(result.coverageMap) : undefined
      };

      this.results.push(testResult);
      
      if (testResult.failed === 0) {
        console.log(`✅ ${suiteName} - ${testResult.passed} tests passed (${testResult.duration}ms)`);
      } else {
        console.log(`❌ ${suiteName} - ${testResult.failed} tests failed, ${testResult.passed} passed (${testResult.duration}ms)`);
      }

      return testResult;
    } catch (error) {
      console.error(`❌ ${suiteName} failed to run:`, error);
      const testResult: TestResult = {
        suite: suiteName,
        passed: 0,
        failed: 1,
        duration: Math.round(performance.now() - suiteStartTime)
      };
      this.results.push(testResult);
      return testResult;
    }
  }

  private calculateCoverage(coverageMap: any): number {
    // Simple coverage calculation - would be more sophisticated in real implementation
    const files = Object.keys(coverageMap);
    if (files.length === 0) return 0;

    let totalStatements = 0;
    let coveredStatements = 0;

    files.forEach(file => {
      const fileCoverage = coverageMap[file];
      if (fileCoverage.s) {
        totalStatements += Object.keys(fileCoverage.s).length;
        coveredStatements += Object.values(fileCoverage.s).filter(count => count > 0).length;
      }
    });

    return totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0;
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Land Verification Test Suite\n');

    // 1. End-to-End Tests
    await this.runTestSuite(
      'End-to-End Verification Workflows',
      'server/land-verification/__tests__/e2e/**/*.test.ts',
      '--timeout=30000'
    );

    // 2. Integration Tests
    await this.runTestSuite(
      'Government Services Integration',
      'server/land-verification/__tests__/integration/**/*.test.ts',
      '--timeout=15000'
    );

    // 3. Load Tests
    await this.runTestSuite(
      'Concurrent Verification Load Tests',
      'server/land-verification/__tests__/load/**/*.test.ts',
      '--timeout=60000'
    );

    // 4. User Acceptance Tests
    await this.runTestSuite(
      'Realistic Property Scenarios',
      'server/land-verification/__tests__/acceptance/**/*.test.ts',
      '--timeout=20000'
    );

    // 5. Security Tests
    await this.runTestSuite(
      'Data Protection Security',
      'server/land-verification/__tests__/security/data-protection.test.ts',
      '--timeout=10000'
    );

    await this.runTestSuite(
      'API Security',
      'server/land-verification/__tests__/security/api-security.test.ts',
      '--timeout=10000'
    );

    // 6. Unit Tests (existing)
    await this.runTestSuite(
      'Unit Tests',
      'server/land-verification/**/*.test.ts --exclude="server/land-verification/__tests__/**"',
      '--coverage'
    );

    this.generateReport();
  }

  private generateReport(): void {
    const totalDuration = Math.round(performance.now() - this.startTime);
    const totalPassed = this.results.reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = this.results.reduce((sum, result) => sum + result.failed, 0);
    const totalTests = totalPassed + totalFailed;

    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('=' .repeat(60));

    this.results.forEach(result => {
      const status = result.failed === 0 ? '✅' : '❌';
      const coverage = result.coverage ? ` (${result.coverage}% coverage)` : '';
      console.log(`${status} ${result.suite}: ${result.passed}/${result.passed + result.failed} passed (${result.duration}ms)${coverage}`);
    });

    console.log('=' .repeat(60));
    console.log(`📈 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed} (${Math.round((totalPassed / totalTests) * 100)}%)`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Total Duration: ${totalDuration}ms`);

    const overallSuccess = totalFailed === 0;
    console.log(`   Overall Status: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);

    // Generate detailed report file
    this.generateDetailedReport(totalDuration, totalPassed, totalFailed);

    if (!overallSuccess) {
      process.exit(1);
    }
  }

  private generateDetailedReport(totalDuration: number, totalPassed: number, totalFailed: number): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: totalPassed + totalFailed,
        passed: totalPassed,
        failed: totalFailed,
        successRate: Math.round((totalPassed / (totalPassed + totalFailed)) * 100),
        totalDuration
      },
      testSuites: this.results,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(process.cwd(), 'test-reports', 'comprehensive-test-report.json');
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for failed tests
    const failedSuites = this.results.filter(result => result.failed > 0);
    if (failedSuites.length > 0) {
      recommendations.push('Address failing tests before deployment');
      failedSuites.forEach(suite => {
        recommendations.push(`- Fix ${suite.failed} failing test(s) in ${suite.suite}`);
      });
    }

    // Check for slow tests
    const slowSuites = this.results.filter(result => result.duration > 10000);
    if (slowSuites.length > 0) {
      recommendations.push('Consider optimizing slow test suites:');
      slowSuites.forEach(suite => {
        recommendations.push(`- ${suite.suite} took ${suite.duration}ms`);
      });
    }

    // Check coverage
    const lowCoverageSuites = this.results.filter(result => result.coverage && result.coverage < 80);
    if (lowCoverageSuites.length > 0) {
      recommendations.push('Improve test coverage for:');
      lowCoverageSuites.forEach(suite => {
        recommendations.push(`- ${suite.suite} has ${suite.coverage}% coverage`);
      });
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests passing with good performance and coverage! 🎉');
    }

    return recommendations;
  }
}

// Run the comprehensive test suite
async function main() {
  const runner = new ComprehensiveTestRunner();
  await runner.runAllTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { ComprehensiveTestRunner };