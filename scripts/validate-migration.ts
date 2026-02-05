#!/usr/bin/env tsx
/**
 * Standalone Migration Validation Script
 * 
 * Runs comprehensive validation of the core utilities migration
 */

import { resolve } from 'path';
import { existsSync } from 'fs';

async function main() {
  console.log('🔍 Core Utilities Migration Validation');
  console.log('=====================================\n');

  // Check if core module exists
  const corePath = resolve(process.cwd(), 'core');
  if (!existsSync(corePath)) {
    console.error('❌ Core module directory not found at:', corePath);
    process.exit(1);
  }

  try {
    // Import and run validation
    const { validateMigration } = await import('../core/src/validation/migration-validator');
    const report = await validateMigration();

    // Display results
    console.log('\n📊 Validation Results:');
    console.log('======================');
    
    report.summary.forEach(line => console.log(line));
    
    console.log('\n📈 Category Breakdown:');
    console.log('=====================');
    
    Object.entries(report.categories).forEach(([category, results]) => {
      const passed = results.filter(r => r.success).length;
      const total = results.length;
      const status = passed === total ? '✅' : '⚠️';
      
      console.log(`${status} ${category.toUpperCase()}: ${passed}/${total} passed`);
      
      // Show failed tests
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        failed.forEach(result => {
          console.log(`   ❌ ${result.test}: ${result.message}`);
        });
      }
    });

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      console.log('==================');
      report.recommendations.forEach(rec => console.log(`• ${rec}`));
    }

    // Performance summary
    console.log('\n⚡ Performance Summary:');
    console.log('=====================');
    console.log(`Total validation time: ${(report.overall.duration / 1000).toFixed(2)}s`);
    
    const performanceResults = report.categories.performance;
    performanceResults.forEach(result => {
      if (result.success && result.details) {
        console.log(`• ${result.test}: ${JSON.stringify(result.details)}`);
      }
    });

    // Exit with appropriate code
    if (report.overall.success) {
      console.log('\n🎉 Migration validation completed successfully!');
      console.log('The core utilities migration is complete and functional.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Migration validation completed with issues.');
      console.log(`${report.overall.failed} out of ${report.overall.totalTests} tests failed.`);
      console.log('Please address the issues before considering the migration complete.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Validation failed with error:', error);
    console.error('\nThis may indicate a serious issue with the migration.');
    console.error('Please check the core module structure and dependencies.');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the validation
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});