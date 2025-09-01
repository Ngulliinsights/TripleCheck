#!/usr/bin/env tsx
/**
 * Quick Migration Validation Check
 * 
 * Performs a rapid assessment of migration status and provides actionable recommendations
 */

import { resolve } from 'path';
import { existsSync } from 'fs';

interface QuickCheckResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  action?: string;
}

async function quickMigrationCheck(): Promise<QuickCheckResult[]> {
  const results: QuickCheckResult[] = [];
  
  console.log('🔍 Quick Migration Status Check');
  console.log('==============================\n');

  // Check 1: Core module structure
  const corePath = resolve(process.cwd(), 'core');
  if (existsSync(corePath)) {
    results.push({
      category: 'Structure',
      status: 'pass',
      message: 'Core module directory exists'
    });
  } else {
    results.push({
      category: 'Structure',
      status: 'fail',
      message: 'Core module directory missing',
      action: 'Create core module structure'
    });
    return results; // Can't continue without core module
  }

  // Check 2: Try importing core modules
  const moduleChecks = [
    { name: 'Cache', path: '../core/src/cache' },
    { name: 'Logging', path: '../core/src/logging' },
    { name: 'Validation', path: '../core/src/validation' },
    { name: 'Error Handling', path: '../core/src/error-handling' },
    { name: 'Rate Limiting', path: '../core/src/rate-limiting' },
    { name: 'Health', path: '../core/src/health' }
  ];

  for (const moduleCheck of moduleChecks) {
    try {
      await import(moduleCheck.path);
      results.push({
        category: 'Imports',
        status: 'pass',
        message: `${moduleCheck.name} module imports successfully`
      });
    } catch (error) {
      results.push({
        category: 'Imports',
        status: 'fail',
        message: `${moduleCheck.name} module import failed: ${(error as Error).message}`,
        action: `Fix ${moduleCheck.name} module exports and dependencies`
      });
    }
  }

  // Check 3: Try basic service instantiation
  const serviceChecks = [
    { name: 'CacheService', module: '../core/src/cache', class: 'CacheService' },
    { name: 'Logger', module: '../core/src/logging', class: 'Logger' },
    { name: 'ValidationService', module: '../core/src/validation', class: 'ValidationService' }
  ];

  for (const serviceCheck of serviceChecks) {
    try {
      const module = await import(serviceCheck.module);
      const ServiceClass = module[serviceCheck.class];
      
      if (ServiceClass) {
        // Try to instantiate
        if (serviceCheck.name === 'Logger') {
          new ServiceClass({ service: 'test' });
        } else {
          new ServiceClass();
        }
        
        results.push({
          category: 'Services',
          status: 'pass',
          message: `${serviceCheck.name} can be instantiated`
        });
      } else {
        results.push({
          category: 'Services',
          status: 'fail',
          message: `${serviceCheck.name} class not exported`,
          action: `Ensure ${serviceCheck.name} is properly exported from ${serviceCheck.module}`
        });
      }
    } catch (error) {
      results.push({
        category: 'Services',
        status: 'fail',
        message: `${serviceCheck.name} instantiation failed: ${(error as Error).message}`,
        action: `Fix ${serviceCheck.name} constructor and dependencies`
      });
    }
  }

  return results;
}

async function main() {
  try {
    const results = await quickMigrationCheck();
    
    // Categorize results
    const passed = results.filter(r => r.status === 'pass');
    const failed = results.filter(r => r.status === 'fail');
    const warnings = results.filter(r => r.status === 'warning');
    
    console.log('\n📊 Quick Check Results:');
    console.log('======================');
    console.log(`✅ Passed: ${passed.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    
    // Show results by category
    const categories = ['Structure', 'Imports', 'Services'];
    
    categories.forEach(category => {
      const categoryResults = results.filter(r => r.category === category);
      if (categoryResults.length > 0) {
        console.log(`\n${category.toUpperCase()}:`);
        categoryResults.forEach(result => {
          const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
          console.log(`  ${icon} ${result.message}`);
          if (result.action) {
            console.log(`     → Action: ${result.action}`);
          }
        });
      }
    });
    
    // Overall assessment
    console.log('\n🎯 Migration Status:');
    console.log('===================');
    
    const passRate = (passed.length / results.length) * 100;
    
    if (passRate >= 90) {
      console.log('🟢 READY: Migration is nearly complete and ready for production');
    } else if (passRate >= 70) {
      console.log('🟡 IN PROGRESS: Migration is mostly complete but needs attention');
    } else if (passRate >= 50) {
      console.log('🟠 NEEDS WORK: Migration has significant issues that need addressing');
    } else {
      console.log('🔴 CRITICAL: Migration has major problems and is not functional');
    }
    
    console.log(`Pass rate: ${passRate.toFixed(1)}%`);
    
    // Priority actions
    const criticalActions = failed.filter(f => f.action).slice(0, 3);
    if (criticalActions.length > 0) {
      console.log('\n🚨 Priority Actions:');
      console.log('==================');
      criticalActions.forEach((action, index) => {
        console.log(`${index + 1}. ${action.action}`);
      });
    }
    
    // Exit with appropriate code
    process.exit(failed.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Quick check failed:', error);
    process.exit(1);
  }
}

main();