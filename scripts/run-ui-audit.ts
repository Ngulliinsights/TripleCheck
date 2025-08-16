#!/usr/bin/env tsx

/**
 * UI Audit Runner Script
 * 
 * Standalone script to run the enhanced UI audit system
 */

import { EnhancedAuditRunner } from '../src/infrastructure/audit/EnhancedAuditRunner.js';
import { getAuditConfig } from '../src/infrastructure/audit/config.js';

async function main() {
  console.log('🚀 Starting UI Audit System...');
  
  try {
    // Get configuration
    const config = getAuditConfig();
    
    // Create audit runner
    const auditRunner = new EnhancedAuditRunner(config);
    
    // Set up progress monitoring
    auditRunner.on('progress', (progress) => {
      if (progress.phase) {
        console.log(`📊 ${progress.phase}: ${progress.completed || 0}/${progress.total || 0}`);
      }
    });
    
    auditRunner.on('auditStarted', () => {
      console.log('🔍 Audit started...');
    });
    
    auditRunner.on('auditCompleted', (result) => {
      console.log('✅ Audit completed successfully!');
      console.log(`📊 Found ${result.coverage.components} components, ${result.coverage.routes} routes, ${result.coverage.apis} APIs`);
    });
    
    auditRunner.on('auditError', (error) => {
      console.error('❌ Audit failed:', error);
    });
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const isQuick = args.includes('--quick');
    const isFocused = args.includes('--focused');
    
    let focus: ('accessibility' | 'performance' | 'security' | 'connectivity')[] | undefined;
    const focusIndex = args.indexOf('--focus');
    if (focusIndex !== -1 && args[focusIndex + 1]) {
      const focusAreas = args[focusIndex + 1]?.split(',') || [];
      focus = focusAreas.filter(area => 
        ['accessibility', 'performance', 'security', 'connectivity'].includes(area)
      ) as ('accessibility' | 'performance' | 'security' | 'connectivity')[];
    }
    
    // Run audit
    const result = await auditRunner.runAudit({
      mode: isQuick ? 'quick' : isFocused ? 'focused' : 'complete',
      focus: focus || undefined,
      outputFormats: ['json', 'markdown'],
      outputPath: 'reports/audit',
      includeScreenshots: false,
      parallel: true,
      continueOnError: true,
      generateRecommendations: true,
      notifyOnCompletion: false
    });
    
    if (result.success && result.report) {
      console.log('\n📊 AUDIT SUMMARY:');
      console.log(`   Total Elements: ${result.report.summary.totalElements}`);
      console.log(`   Working: ${result.report.summary.workingElements}`);
      console.log(`   Broken: ${result.report.summary.brokenElements}`);
      console.log(`   Critical Issues: ${result.report.summary.criticalIssues}`);
      console.log(`   Estimated Fix Time: ${result.report.summary.estimatedFixTime} hours`);
      console.log(`   Execution Time: ${result.executionTime}ms`);
      
      if (result.report.recommendations && result.report.recommendations.length > 0) {
        console.log('\n🎯 TOP PRIORITY ACTIONS:');
        result.report.recommendations.slice(0, 3).forEach((rec: any, index: number) => {
          console.log(`   ${index + 1}. ${rec.title} (${rec.priority})`);
          console.log(`      📝 ${rec.description}`);
          console.log(`      ⏱️  ${rec.estimatedEffort} hours`);
        });
      }
      
      console.log('\n📋 IMPLEMENTATION PLAN:');
      console.log('   Phase 1: Critical Fixes (immediate)');
      console.log('   Phase 2: High Priority Features (1-2 weeks)');
      console.log('   Phase 3: Performance & Polish (2-4 weeks)');
      
      // Exit with appropriate code
      if (result.report.summary.criticalIssues > 0) {
        console.log('\n🔴 Critical issues found. Address before deployment.');
        process.exit(1);
      } else {
        console.log('\n✅ No critical issues found.');
        process.exit(0);
      }
    } else {
      console.error('❌ Audit failed:', result.error);
      process.exit(2);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(2);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Audit interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Audit terminated');
  process.exit(143);
});

// Run the script
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(2);
});