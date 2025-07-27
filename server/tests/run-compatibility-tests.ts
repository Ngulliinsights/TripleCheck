#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestResult {
  testSuite: string;
  passed: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
}

interface CompatibilityReport {
  timestamp: string;
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  testResults: TestResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalDuration: number;
  };
  recommendations: string[];
}

class CompatibilityTestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<CompatibilityReport> {
    console.log('🚀 Starting Backward Compatibility and Performance Validation...\n');
    this.startTime = Date.now();

    const testSuites = [
      {
        name: 'Backward Compatibility Tests',
        command: 'npm test -- server/tests/backward-compatibility.test.ts --run',
        critical: true
      },
      {
        name: 'Performance Tests',
        command: 'npm test -- server/tests/performance.test.ts --run',
        critical: true
      },
      {
        name: 'File Upload Tests',
        command: 'npm test -- server/tests/file-upload.test.ts --run',
        critical: true
      },
      {
        name: 'AI Integration Tests',
        command: 'npm test -- server/tests/ai-integration.test.ts --run',
        critical: false // AI might not be fully configured in all environments
      }
    ];

    for (const suite of testSuites) {
      await this.runTestSuite(suite.name, suite.command, suite.critical);
    }

    return this.generateReport();
  }

  private async runTestSuite(name: string, command: string, critical: boolean): Promise<void> {
    console.log(`📋 Running ${name}...`);
    const suiteStartTime = Date.now();
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        timeout: 120000, // 2 minute timeout per test suite
        stdio: 'pipe'
      });
      
      const duration = Date.now() - suiteStartTime;
      
      this.results.push({
        testSuite: name,
        passed: true,
        duration,
        errors: [],
        warnings: this.extractWarnings(output)
      });
      
      console.log(`✅ ${name} - PASSED (${duration}ms)\n`);
      
    } catch (error: any) {
      const duration = Date.now() - suiteStartTime;
      const errorMessage = error.stdout || error.stderr || error.message || 'Unknown error';
      
      this.results.push({
        testSuite: name,
        passed: false,
        duration,
        errors: [errorMessage],
        warnings: []
      });
      
      if (critical) {
        console.log(`❌ ${name} - FAILED (${duration}ms)`);
        console.log(`Error: ${errorMessage}\n`);
      } else {
        console.log(`⚠️  ${name} - FAILED (${duration}ms) - Non-critical`);
        console.log(`Error: ${errorMessage}\n`);
      }
    }
  }

  private extractWarnings(output: string): string[] {
    const warnings: string[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('WARN') || line.includes('Warning') || line.includes('deprecated')) {
        warnings.push(line.trim());
      }
    }
    
    return warnings;
  }

  private generateReport(): CompatibilityReport {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    const criticalFailures = this.results.filter(r => !r.passed && 
      (r.testSuite.includes('Backward Compatibility') || 
       r.testSuite.includes('Performance') || 
       r.testSuite.includes('File Upload'))).length;

    let overallStatus: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
    
    if (criticalFailures > 0) {
      overallStatus = 'FAIL';
    } else if (failedTests > 0) {
      overallStatus = 'WARNING';
    }

    const recommendations = this.generateRecommendations();

    return {
      timestamp: new Date().toISOString(),
      overallStatus,
      testResults: this.results,
      summary: {
        totalTests: this.results.length,
        passedTests,
        failedTests,
        totalDuration
      },
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const failedSuites = this.results.filter(r => !r.passed);
    
    if (failedSuites.some(s => s.testSuite.includes('Backward Compatibility'))) {
      recommendations.push('❗ Critical: Backward compatibility issues detected. Review API endpoint changes and ensure all existing functionality is preserved.');
    }
    
    if (failedSuites.some(s => s.testSuite.includes('Performance'))) {
      recommendations.push('⚡ Performance issues detected. Review response times and optimize slow endpoints.');
    }
    
    if (failedSuites.some(s => s.testSuite.includes('File Upload'))) {
      recommendations.push('📁 File upload functionality issues detected. Verify file handling and security measures.');
    }
    
    if (failedSuites.some(s => s.testSuite.includes('AI Integration'))) {
      recommendations.push('🤖 AI integration issues detected. This may be due to missing API keys or service unavailability.');
    }

    const slowTests = this.results.filter(r => r.duration > 30000); // > 30 seconds
    if (slowTests.length > 0) {
      recommendations.push(`⏱️  Slow test suites detected: ${slowTests.map(t => t.testSuite).join(', ')}. Consider optimizing test performance.`);
    }

    const warningTests = this.results.filter(r => r.warnings.length > 0);
    if (warningTests.length > 0) {
      recommendations.push('⚠️  Warnings detected in test output. Review and address deprecation warnings.');
    }

    if (recommendations.length === 0) {
      recommendations.push('✨ All tests passed successfully! The refactored architecture maintains backward compatibility and performance.');
    }

    return recommendations;
  }

  async saveReport(report: CompatibilityReport): Promise<void> {
    const reportPath = path.join(__dirname, '..', '..', 'compatibility-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Also create a human-readable summary
    const summaryPath = path.join(__dirname, '..', '..', 'compatibility-summary.md');
    const summary = this.generateMarkdownSummary(report);
    fs.writeFileSync(summaryPath, summary);
    
    console.log(`📊 Report saved to: ${reportPath}`);
    console.log(`📄 Summary saved to: ${summaryPath}`);
  }

  private generateMarkdownSummary(report: CompatibilityReport): string {
    const { summary, testResults, recommendations, overallStatus } = report;
    
    let markdown = `# Backward Compatibility and Performance Report\n\n`;
    markdown += `**Generated:** ${report.timestamp}\n`;
    markdown += `**Overall Status:** ${overallStatus === 'PASS' ? '✅ PASS' : overallStatus === 'WARNING' ? '⚠️ WARNING' : '❌ FAIL'}\n\n`;
    
    markdown += `## Summary\n\n`;
    markdown += `- **Total Test Suites:** ${summary.totalTests}\n`;
    markdown += `- **Passed:** ${summary.passedTests}\n`;
    markdown += `- **Failed:** ${summary.failedTests}\n`;
    markdown += `- **Total Duration:** ${Math.round(summary.totalDuration / 1000)}s\n\n`;
    
    markdown += `## Test Results\n\n`;
    
    for (const result of testResults) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const duration = Math.round(result.duration / 1000);
      
      markdown += `### ${result.testSuite}\n`;
      markdown += `**Status:** ${status} | **Duration:** ${duration}s\n\n`;
      
      if (result.errors.length > 0) {
        markdown += `**Errors:**\n`;
        for (const error of result.errors) {
          markdown += `- ${error}\n`;
        }
        markdown += `\n`;
      }
      
      if (result.warnings.length > 0) {
        markdown += `**Warnings:**\n`;
        for (const warning of result.warnings) {
          markdown += `- ${warning}\n`;
        }
        markdown += `\n`;
      }
    }
    
    markdown += `## Recommendations\n\n`;
    for (const recommendation of recommendations) {
      markdown += `- ${recommendation}\n`;
    }
    
    return markdown;
  }

  printSummary(report: CompatibilityReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 BACKWARD COMPATIBILITY AND PERFORMANCE VALIDATION COMPLETE');
    console.log('='.repeat(80));
    
    const statusIcon = report.overallStatus === 'PASS' ? '✅' : 
                      report.overallStatus === 'WARNING' ? '⚠️' : '❌';
    
    console.log(`\n${statusIcon} Overall Status: ${report.overallStatus}`);
    console.log(`📊 Test Results: ${report.summary.passedTests}/${report.summary.totalTests} passed`);
    console.log(`⏱️  Total Duration: ${Math.round(report.summary.totalDuration / 1000)}s`);
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      for (const recommendation of report.recommendations) {
        console.log(`   ${recommendation}`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const runner = new CompatibilityTestRunner();
  
  runner.runAllTests()
    .then(async (report) => {
      await runner.saveReport(report);
      runner.printSummary(report);
      
      // Exit with appropriate code
      process.exit(report.overallStatus === 'FAIL' ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

export { CompatibilityTestRunner };