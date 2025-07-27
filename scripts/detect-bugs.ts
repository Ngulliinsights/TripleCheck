#!/usr/bin/env tsx

/**
 * Run comprehensive bug detection and generate report
 * 
 * This script is designed as a CLI tool that legitimately needs console output
 * for user feedback. We use targeted ESLint disable comments to maintain
 * code quality while allowing necessary console usage.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { bugDetector } from '../src/shared/test-utils/bug-detector';

/**
 * Logger utility that wraps console methods with clear intent
 * This makes it explicit that we're intentionally using console for CLI output
 */
class CLILogger {
  // ESLint disable for the entire class since this is a CLI utility
  /* eslint-disable no-console */
  
  info(message: string): void {
    console.log(message);
  }
  
  warn(message: string): void {
    console.warn(message);
  }
  
  error(message: string): void {
    console.error(message);
  }
  
  success(message: string): void {
    console.log(message);
  }
  
  /* eslint-enable no-console */
}

// Create our CLI logger instance
const logger = new CLILogger();

/**
 * Formats bug statistics in a consistent, readable way
 */
function formatBugStats(bugs: any[], label: string): void {
  const critical = bugs.filter(b => b.severity === 'critical').length;
  const high = bugs.filter(b => b.severity === 'high').length;
  
  logger.info(`${label}:`);
  logger.info(`  Total: ${bugs.length}`);
  logger.info(`  Critical: ${critical}`);
  logger.info(`  High: ${high}`);
}

/**
 * Displays categorized statistics with proper formatting
 */
function displayCategorizedStats(
  title: string, 
  stats: Record<string, number>
): void {
  if (Object.keys(stats).length === 0) return;
  
  logger.info(`\n${title}:`);
  Object.entries(stats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      logger.info(`  ${category}: ${count}`);
    });
}

/**
 * Shows the top issues with detailed information
 */
function displayTopIssues(
  issues: any[], 
  title: string, 
  maxCount: number = 5
): void {
  if (issues.length === 0) return;
  
  logger.info(`${title}:`);
  issues.slice(0, maxCount).forEach((bug, index) => {
    logger.info(`${index + 1}. [${bug.severity.toUpperCase()}] ${bug.description}`);
    logger.info(`   File: ${bug.location.file}${bug.location.line ? `:${bug.location.line}` : ''}`);
    logger.info(`   Fix: ${bug.fixSuggestion || 'Manual investigation required'}\n`);
  });
}

/**
 * Provides actionable recommendations based on bug analysis results
 */
function provideRecommendations(result: any): void {
  logger.info('\n🎯 Recommended Next Steps (Production Code Priority):');
  
  const productionCritical = result.productionBugs.filter((b: any) => b.severity === 'critical').length;
  const productionHigh = result.productionBugs.filter((b: any) => b.severity === 'high').length;
  const testCritical = result.testBugs.filter((b: any) => b.severity === 'critical').length;
  const testHigh = result.testBugs.filter((b: any) => b.severity === 'high').length;
  
  // Priority-based recommendations
  if (productionCritical > 0) {
    logger.info(`1. 🚨 Fix ${productionCritical} CRITICAL production bugs immediately`);
  }
  
  if (productionHigh > 0) {
    logger.info(`2. ⚠️  Address ${productionHigh} HIGH priority production bugs`);
  }
  
  // Type-specific recommendations
  const productionImportErrors = result.productionSummary.byType['import-error'] || 0;
  const productionMissingFiles = result.productionSummary.byType['missing-file'] || 0;
  const productionDuplicateExports = result.productionSummary.byType['duplicate-code'] || 0;
  const testConfigIssues = result.summary.byType['test-configuration'] || 0;
  
  if (productionImportErrors > 0) {
    logger.info(`3. 🔗 Fix ${productionImportErrors} production import resolution issues`);
  }
  
  if (testCritical > 0 || testHigh > 0) {
    logger.info(`\n🧪 Test Code Issues:`);
    if (testCritical > 0) logger.info(`   - ${testCritical} critical test issues`);
    if (testHigh > 0) logger.info(`   - ${testHigh} high priority test issues`);
  }
  
  if (productionMissingFiles > 0) {
    logger.info(`4. 📁 Create ${productionMissingFiles} missing production files or update references`);
  }
  
  if (productionDuplicateExports > 0) {
    logger.info(`5. 🔄 Resolve ${productionDuplicateExports} duplicate export issues in production code`);
  }
  
  if (testConfigIssues > 0) {
    logger.info(`6. 🧪 Fix ${testConfigIssues} test configuration issues`);
  }
}

/**
 * Ensures the reports directory exists and generates output files
 */
function generateReports(result: any): void {
  try {
    // Ensure reports directory exists
    mkdirSync('reports', { recursive: true });
    
    // Generate detailed reports
    const markdownReport = bugDetector.generateMarkdownReport(result);
    writeFileSync('reports/bug-detection-report.md', markdownReport);
    
    const jsonReport = JSON.stringify(result, null, 2);
    writeFileSync('reports/bug-detection-report.json', jsonReport);
    
    logger.info('\n📄 Reports generated:');
    logger.info('  - reports/bug-detection-report.md');
    logger.info('  - reports/bug-detection-report.json');
  } catch (error) {
    logger.error(`Failed to generate reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Main bug detection function with comprehensive error handling
 */
async function runBugDetection(): Promise<void> {
  logger.info('🐛 Starting comprehensive bug detection...\n');
  
  try {
    // Execute bug detection
    const result = await bugDetector.detectBugs();
    
    // Display overview statistics
    logger.info('📊 Bug Detection Results:');
    logger.info(`Total bugs found: ${result.totalBugs}`);
    logger.info(`Critical bugs: ${result.criticalBugs}`);
    logger.info(`High priority bugs: ${result.highPriorityBugs}`);
    logger.info(`Medium priority bugs: ${result.summary.bySeverity.medium || 0}`);
    logger.info(`Low priority bugs: ${result.summary.bySeverity.low || 0}\n`);

    // Production vs Test breakdown with helper function
    formatBugStats(result.productionBugs, '🏭 PRODUCTION CODE BUGS');
    logger.info(`  Medium: ${result.productionSummary.bySeverity.medium || 0}`);
    logger.info(`  Low: ${result.productionSummary.bySeverity.low || 0}\n`);

    formatBugStats(result.testBugs, '🧪 TEST CODE BUGS');
    logger.info(`  Medium: ${result.testSummary.bySeverity.medium || 0}`);
    logger.info(`  Low: ${result.testSummary.bySeverity.low || 0}\n`);
    
    // Show top issues using helper functions
    displayTopIssues(
      result.productionSummary.topIssues, 
      '🔥 Top PRODUCTION Issues (Critical/High Priority)', 
      5
    );

    displayTopIssues(
      result.testSummary.topIssues, 
      '🧪 Top TEST Issues (Critical/High Priority)', 
      3
    );
    
    // Display categorized statistics
    displayCategorizedStats(
      '📂 Production Bugs by Category',
      result.productionSummary.byCategory
    );
    
    displayCategorizedStats(
      '🔧 Production Bugs by Type',
      result.productionSummary.byType
    );

    displayCategorizedStats(
      '🧪 Test Bugs by Type',
      result.testSummary.byType
    );
    
    // Generate reports
    generateReports(result);
    
    // Provide actionable recommendations
    provideRecommendations(result);
    
    logger.success('\n✅ Bug detection complete!');
    
    // Determine exit status based on critical production bugs
    const productionCritical = result.productionBugs.filter((b: any) => b.severity === 'critical').length;
    const testCritical = result.testBugs.filter((b: any) => b.severity === 'critical').length;
    
    if (productionCritical > 0) {
      logger.error('\n❌ Critical PRODUCTION bugs found - exiting with error code');
      process.exit(1);
    } else if (testCritical > 0) {
      logger.warn('\n⚠️  Critical TEST bugs found - consider fixing but not blocking');
    }
    
  } catch (error) {
    logger.error(`\n❌ Bug detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Execute the bug detection with proper error handling
runBugDetection().catch((error) => {
  logger.error(`Unhandled error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
});