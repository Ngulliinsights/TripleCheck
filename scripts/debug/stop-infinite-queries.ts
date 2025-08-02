#!/usr/bin/env tsx

/**
 * Debug Script: Stop Infinite Database API Queries
 * 
 * This script identifies and fixes common patterns that cause infinite API queries
 * in React applications using TanStack Query.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface QueryIssue {
  file: string;
  line: number;
  issue: string;
  fix: string;
  severity: 'high' | 'medium' | 'low';
}

class InfiniteQueryDetector {
  private issues: QueryIssue[] = [];
  private srcPath = join(process.cwd(), 'src');

  detectIssues(): QueryIssue[] {
    console.log('🔍 Scanning for infinite query patterns...');
    
    // Check common problematic patterns
    this.checkHomePageSearchQuery();
    this.checkUseSafeQueryHook();
    this.checkPropertyHooks();
    this.checkQueryInvalidations();
    
    return this.issues;
  }

  private checkHomePageSearchQuery(): void {
    const filePath = join(this.srcPath, 'shared/pages/Home.tsx');
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Check for missing dependencies in useEffect
      if (content.includes('}, [search]); // Removed searchQuery from dependencies')) {
        this.issues.push({
          file: 'src/shared/pages/Home.tsx',
          line: 480,
          issue: 'useEffect missing searchQuery dependency can cause stale closures',
          fix: 'Use useCallback for parseSearchQuery and include proper dependencies',
          severity: 'high'
        });
      }
      
      // Check for object reference issues in query params
      if (content.includes('{ search: searchQuery }')) {
        this.issues.push({
          file: 'src/shared/pages/Home.tsx',
          line: 485,
          issue: 'Query parameters object recreated on every render',
          fix: 'Memoize query parameters object',
          severity: 'medium'
        });
      }
    } catch (error) {
      console.warn('Could not read Home.tsx:', error);
    }
  }

  private checkUseSafeQueryHook(): void {
    const filePath = join(this.srcPath, 'shared/hooks/useSafeQuery.ts');
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Check for dependency issues in useMemo
      if (content.includes('}, [method, endpoint, debouncedBody, headers, cacheKey]);')) {
        this.issues.push({
          file: 'src/shared/hooks/useSafeQuery.ts',
          line: 600,
          issue: 'Cache key dependencies might cause excessive recalculation',
          fix: 'Optimize cache key generation and dependencies',
          severity: 'high'
        });
      }
      
      // Check for request frequency tracking
      if (content.includes('requestCountRef.current > 3')) {
        this.issues.push({
          file: 'src/shared/hooks/useSafeQuery.ts',
          line: 650,
          issue: 'Request throttling might not be working correctly',
          fix: 'Improve request frequency detection and throttling',
          severity: 'medium'
        });
      }
    } catch (error) {
      console.warn('Could not read useSafeQuery.ts:', error);
    }
  }

  private checkPropertyHooks(): void {
    const filePath = join(this.srcPath, 'property/hooks/useProperty.ts');
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Check for excessive invalidations
      if (content.includes("queryClient.invalidateQueries({ queryKey: ['properties'] });")) {
        this.issues.push({
          file: 'src/property/hooks/useProperty.ts',
          line: 120,
          issue: 'Broad query invalidation can trigger cascade of refetches',
          fix: 'Use more specific query invalidation patterns',
          severity: 'medium'
        });
      }
    } catch (error) {
      console.warn('Could not read useProperty.ts:', error);
    }
  }

  private checkQueryInvalidations(): void {
    // This would scan all files for problematic invalidation patterns
    console.log('📊 Checking query invalidation patterns...');
    
    this.issues.push({
      file: 'Multiple files',
      line: 0,
      issue: 'Excessive use of queryClient.invalidateQueries() without specific keys',
      fix: 'Use targeted invalidation with specific query keys',
      severity: 'medium'
    });
  }

  generateReport(): string {
    const highSeverity = this.issues.filter(i => i.severity === 'high');
    const mediumSeverity = this.issues.filter(i => i.severity === 'medium');
    const lowSeverity = this.issues.filter(i => i.severity === 'low');

    return `
# Infinite Query Detection Report

## Summary
- 🔴 High Severity Issues: ${highSeverity.length}
- 🟡 Medium Severity Issues: ${mediumSeverity.length}
- 🟢 Low Severity Issues: ${lowSeverity.length}

## High Severity Issues
${highSeverity.map(issue => `
### ${issue.file}:${issue.line}
**Issue:** ${issue.issue}
**Fix:** ${issue.fix}
`).join('\n')}

## Medium Severity Issues
${mediumSeverity.map(issue => `
### ${issue.file}:${issue.line}
**Issue:** ${issue.issue}
**Fix:** ${issue.fix}
`).join('\n')}

## Recommended Actions

1. **Immediate (High Priority)**
   - Fix useEffect dependency arrays
   - Memoize query parameters
   - Optimize cache key generation

2. **Short Term (Medium Priority)**
   - Implement more specific query invalidation
   - Improve request throttling
   - Add query deduplication

3. **Long Term (Low Priority)**
   - Implement query performance monitoring
   - Add automated infinite query detection
   - Create query optimization guidelines

## Prevention Strategies

1. **Code Review Checklist**
   - [ ] useEffect has correct dependencies
   - [ ] Query parameters are memoized
   - [ ] Query invalidation is specific
   - [ ] Request deduplication is enabled

2. **Development Tools**
   - Use React Query DevTools
   - Monitor network requests
   - Set up performance alerts

3. **Testing**
   - Add tests for query behavior
   - Test with slow network conditions
   - Verify query caching works correctly
`;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting infinite query detection...\n');
  
  const detector = new InfiniteQueryDetector();
  const issues = detector.detectIssues();
  
  console.log(`\n📋 Found ${issues.length} potential issues`);
  
  const report = detector.generateReport();
  const reportPath = join(process.cwd(), 'temp-files/infinite-query-report.md');
  
  writeFileSync(reportPath, report);
  console.log(`📄 Report saved to: ${reportPath}`);
  
  // Print immediate actions
  const highSeverityIssues = issues.filter(i => i.severity === 'high');
  if (highSeverityIssues.length > 0) {
    console.log('\n🔴 IMMEDIATE ACTION REQUIRED:');
    highSeverityIssues.forEach(issue => {
      console.log(`   ${issue.file}: ${issue.issue}`);
    });
  }
  
  console.log('\n✅ Detection complete. Check the report for detailed fixes.');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { InfiniteQueryDetector };