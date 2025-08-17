/**
 * UI Audit System - Main Entry Point
 * 
 * This module provides a unified interface to the UI audit system
 * for discovering and analyzing frontend-backend connectivity issues.
 */

import { UIAuditSystem } from './UIAuditSystem.js';
import { RouteAnalyzer } from './RouteAnalyzer.js';
import LinkValidator from './LinkValidator.js';
import { AuditReporter } from './AuditReporter.js';
import type {
  UIElement,
  ComponentLocation,
  ElementStatus,
  Priority,
  AccessibilityInfo,
  PerformanceMetrics,
  AuditConfiguration,
  AuditRule,
  AuditRuleResult
} from '../../types/audit.types';
import type { EventHandler, APICall } from '../../types/event.types';
import type { RouteValidationResult } from '../../types/route.types';
import type { APIConnectionResult } from './LinkValidator.js';

export { UIAuditSystem } from './UIAuditSystem.js';
export { RouteAnalyzer } from './RouteAnalyzer.js';
export { default as LinkValidator } from './LinkValidator.js';
export { AuditReporter } from './AuditReporter.js';

// Re-export types
export type {
  UIElement,
  ComponentLocation,
  ElementStatus,
  Priority,
  AccessibilityInfo,
  PerformanceMetrics,
  AuditConfiguration,
  AuditRule,
  AuditRuleResult,
  RouteValidationResult,
  APIConnectionResult,
  Recommendation
} from './UIAuditSystem';

export type {
  RouteDefinition,
  RouteReference,
  RouteMismatch
} from './RouteAnalyzer';

export type {
  LinkValidationResult,
  LinkLocation,
  APIEndpointInfo,
  APIUsageLocation,
  ValidationSummary
} from './LinkValidator';

export type {
  ComprehensiveAuditReport,
  PrioritizedAction,
  ImplementationPlan,
  ImplementationPhase,
  RiskAssessment,
  Risk
} from './AuditReporter';

/**
 * Main audit orchestrator function
 * 
 * This function runs the complete audit process and generates
 * a comprehensive report of all frontend-backend connectivity issues.
 */
export async function runCompleteAudit(): Promise<{
  success: boolean;
  report?: any;
  error?: string;
}> {
  console.log('🚀 Starting complete UI audit...');
  
  try {
    // Create audit system instances
    const auditSystem = new UIAuditSystem({
      scanDepth: 'deep',
      includeTestFiles: false,
      excludePaths: [],
      componentDirectories: [],
      apiTimeout: 5000,
      parallelism: 4,
      cacheResults: true,
      cacheDuration: 60,
      includeAccessibility: true,
      includePerformance: true,
      customRules: []
    });
    const routeAnalyzer = new RouteAnalyzer();
    const linkValidator = new LinkValidator();
    const auditReporter = new AuditReporter();

    // Step 1: Scan UI components
    console.log('\n📋 Step 1: Scanning UI components...');
    const elements = await auditSystem.scanComponents();
    console.log(`✅ Found ${elements.length} interactive elements`);

    // Step 2: Validate routes
    console.log('\n🛣️  Step 2: Validating routes...');
    const routes = await auditSystem.validateRoutes();
    console.log(`✅ Validated ${routes.length} routes`);

    // Step 3: Test API connections
    console.log('\n🔌 Step 3: Testing API connections...');
    const apiConnections = await auditSystem.testAPIConnections();
    console.log(`✅ Tested ${apiConnections.length} API endpoints`);

    // Step 4: Analyze routing configuration
    console.log('\n🔍 Step 4: Analyzing routing configuration...');
    const routeAnalysis = await routeAnalyzer.analyzeRoutes();
    console.log(`✅ Found ${routeAnalysis.mismatches.length} route mismatches`);

    // Step 5: Validate all links
    console.log('\n🔗 Step 5: Validating links...');
    const linkValidation = await linkValidator.validateAllLinks();
    console.log(`✅ Validated ${linkValidation.linkResults.length} links`);

    // Step 6: Generate comprehensive report
    console.log('\n📊 Step 6: Generating comprehensive report...');
    const report = await auditReporter.generateComprehensiveReport(
      elements,
      routes,
      apiConnections,
      routeAnalysis.mismatches,
      linkValidation.summary
    );

    console.log('\n🎉 Audit completed successfully!');
    console.log(`📄 Report ID: ${report.id}`);
    console.log(`⏱️  Total estimated fix time: ${report.summary.estimatedFixTime} hours`);
    console.log(`🔴 Critical issues: ${report.summary.criticalIssues}`);
    console.log(`🟡 High priority issues: ${report.summary.highPriorityIssues}`);

    return {
      success: true,
      report
    };
  } catch (error) {
    console.error('❌ Audit failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Quick audit function for development use
 * 
 * Runs a simplified audit focusing on the most critical issues.
 */
export async function runQuickAudit(): Promise<{
  success: boolean;
  summary?: any;
  error?: string;
}> {
  console.log('⚡ Starting quick audit...');
  
  try {
    // Create audit system instance
    const auditSystem = new UIAuditSystem({
      scanDepth: 'shallow',
      includeTestFiles: false,
      excludePaths: [],
      componentDirectories: [],
      apiTimeout: 3000,
      parallelism: 2,
      cacheResults: true,
      cacheDuration: 30,
      includeAccessibility: false,
      includePerformance: false,
      customRules: []
    });
    
    // Quick scan of critical elements only
    const elements = await auditSystem.scanComponents();
    const criticalElements = elements.filter((e: UIElement) => e.priority === 'critical');
    
    // Quick route validation
    const routes = await auditSystem.validateRoutes();
    const brokenRoutes = routes.filter((r: RouteValidationResult) => r.status === 'broken' || r.status === '404');
    
    // Quick API test
    const apiConnections = await auditSystem.testAPIConnections();
    const brokenAPIs = apiConnections.filter((a: APIConnectionResult) => a.status === 'broken');

    const summary = {
      totalElements: elements.length,
      criticalElements: criticalElements.length,
      brokenRoutes: brokenRoutes.length,
      brokenAPIs: brokenAPIs.length,
      quickRecommendations: [
        ...(brokenAPIs.length > 0 ? ['Fix broken API endpoints immediately'] : []),
        ...(brokenRoutes.length > 0 ? ['Implement missing routes'] : []),
        ...(criticalElements.length > 0 ? ['Connect critical UI elements'] : [])
      ]
    };

    console.log('⚡ Quick audit completed!');
    console.log(`🔍 Scanned ${elements.length} elements`);
    console.log(`🔴 Found ${criticalElements.length} critical issues`);
    console.log(`🛣️  Found ${brokenRoutes.length} broken routes`);
    console.log(`🔌 Found ${brokenAPIs.length} broken APIs`);

    return {
      success: true,
      summary
    };
  } catch (error) {
    console.error('❌ Quick audit failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}