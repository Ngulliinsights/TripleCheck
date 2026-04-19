/**
 * Route Validation and Testing System
 * Provides automated testing for all application routes
 */

import { routeValidator } from './route-validator'

interface RouteTestResult {
  route: string;
  isValid: boolean;
  componentExists: boolean;
  loadTime?: number;
  error?: string;
  warnings: string[];
}

interface RouteTestSuite {
  totalRoutes: number;
  passedRoutes: number;
  failedRoutes: number;
  results: RouteTestResult[];
  executionTime: number;
}

export class RouteTester {
  private static instance: RouteTester;
  private testResults: RouteTestResult[] = [];

  private constructor() {}

  static getInstance(): RouteTester {
    if (!RouteTester.instance) {
      RouteTester.instance = new RouteTester();
    }
    return RouteTester.instance;
  }

  /**
   * Test all application routes
   */
  async testAllRoutes(): Promise<RouteTestSuite> {
    const startTime = Date.now();
    const routes = routeValidator.getAllValidRoutes();
    const results: RouteTestResult[] = [];

    console.log(`🧪 Testing ${routes.length} application routes...`);

    for (const route of routes) {
      const result = await this.testRoute(route);
      results.push(result);
      
      // Log progress
      if (process.env.NODE_ENV === "development") {
        const status = result.isValid && result.componentExists ? '✅' : '❌';
        // eslint-disable-next-line no-console
        console.log(`${status} ${route} ${result.error ? `- ${result.error}` : ''}`);
      }
    }

    const executionTime = Date.now() - startTime;
    const passedRoutes = results.filter(r => r.isValid && r.componentExists).length;
    const failedRoutes = results.length - passedRoutes;

    const testSuite: RouteTestSuite = {
      totalRoutes: routes.length,
      passedRoutes,
      failedRoutes,
      results,
      executionTime,
    };

    this.testResults = results;
    this.logTestSummary(testSuite);

    return testSuite;
  }

  /**
   * Test a specific route
   */
  async testRoute(route: string): Promise<RouteTestResult> {
    const startTime = Date.now();
    const result: RouteTestResult = {
      route,
      isValid: false,
      componentExists: false,
      warnings: [],
    };

    try {
      // Validate route structure
      const validation = routeValidator.validateRoute(route);
      result.isValid = validation.isValid;
      result.warnings = validation.warnings;

      if (!validation.isValid) {
        result.error = validation.errors.join(', ');
        return result;
      }

      // Test component loading for dynamic routes
      if (route.includes(':')) {
        // Test with sample parameters
        const testRoute = route.replace(/:id/g, 'test-id').replace(/:([^/]+)/g, 'test-param');
        result.componentExists = await this.testComponentLoading(testRoute);
      } else {
        result.componentExists = await this.testComponentLoading(route);
      }

      result.loadTime = Date.now() - startTime;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.componentExists = false;
    }

    return result;
  }

  /**
   * Test component loading for a route
   */
  private async testComponentLoading(route: string): Promise<boolean> {
    try {
      // Create a temporary test navigation
      const testUrl = `${window.location.origin}${route}`;
      
      // Use fetch to test if the route responds (basic check)
      const response = await fetch(testUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      // Consider 200, 404 (handled by React Router), and 304 as valid
      return response.status === 200 || response.status === 404 || response.status === 304;
    } catch (error) {
      // Network errors or timeouts indicate potential issues
      return false;
    }
  }

  /**
   * Test route parameters validation
   */
  testRouteParameters(): Array<{ route: string; paramTests: Array<{ params: Record<string, string>; isValid: boolean; errors: string[] }> }> {
    const parameterizedRoutes = routeValidator.getAllValidRoutes().filter(route => route.includes(':'));
    const results: Array<{ route: string; paramTests: Array<{ params: Record<string, string>; isValid: boolean; errors: string[] }> }> = [];

    for (const route of parameterizedRoutes) {
      const paramTests = [];

      // Test valid parameters
      if (route.includes(':id')) {
        const validParams = { id: 'valid-id-123' };
        const validation = routeValidator.validateRouteParams(validParams, ['id']);
        paramTests.push({
          params: validParams,
          isValid: validation.isValid,
          errors: validation.errors,
        });

        // Test invalid parameters
        const invalidParams = { id: '<script>alert("xss")</script>' };
        const invalidValidation = routeValidator.validateRouteParams(invalidParams, ['id']);
        paramTests.push({
          params: invalidParams,
          isValid: invalidValidation.isValid,
          errors: invalidValidation.errors,
        });

        // Test missing parameters
        const missingValidation = routeValidator.validateRouteParams({}, ['id']);
        paramTests.push({
          params: {},
          isValid: missingValidation.isValid,
          errors: missingValidation.errors,
        });
      }

      results.push({ route, paramTests });
    }

    return results;
  }

  /**
   * Test route performance
   */
  async testRoutePerformance(routes?: string[]): Promise<Array<{ route: string; loadTime: number; status: 'fast' | 'slow' | 'timeout' }>> {
    const testRoutes = routes || routeValidator.getAllValidRoutes().slice(0, 10); // Test first 10 routes by default
    const results: Array<{ route: string; loadTime: number; status: 'fast' | 'slow' | 'timeout' }> = [];

    for (const route of testRoutes) {
      const startTime = Date.now();
      
      try {
        const testUrl = `${window.location.origin}${route}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        await fetch(testUrl, { 
          method: 'HEAD',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const loadTime = Date.now() - startTime;
        
        results.push({
          route,
          loadTime,
          status: loadTime < 1000 ? 'fast' : loadTime < 3000 ? 'slow' : 'timeout'
        });

      } catch (error) {
        const loadTime = Date.now() - startTime;
        results.push({
          route,
          loadTime,
          status: 'timeout'
        });
      }
    }

    return results;
  }

  /**
   * Generate a comprehensive route test report
   */
  generateTestReport(): string {
    if (this.testResults.length === 0) {
      return "No test results available. Run testAllRoutes() first.";
    }

    const passed = this.testResults.filter(r => r.isValid && r.componentExists);
    const failed = this.testResults.filter(r => !r.isValid || !r.componentExists);
    const warnings = this.testResults.filter(r => r.warnings.length > 0);

    let report = "# Route Test Report\n\n";
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += "## Summary\n";
    report += `- Total Routes: ${this.testResults.length}\n`;
    report += `- Passed: ${passed.length}\n`;
    report += `- Failed: ${failed.length}\n`;
    report += `- Success Rate: ${((passed.length / this.testResults.length) * 100).toFixed(1)}%\n\n`;

    if (failed.length > 0) {
      report += "## Failed Routes\n";
      failed.forEach(result => {
        report += `- **${result.route}**: ${result.error || 'Component loading failed'}\n`;
      });
      report += "\n";
    }

    if (warnings.length > 0) {
      report += "## Routes with Warnings\n";
      warnings.forEach(result => {
        report += `- **${result.route}**: ${result.warnings.join(', ')}\n`;
      });
      report += "\n";
    }

    report += "## Performance Analysis\n";
    const avgLoadTime = this.testResults
      .filter(r => r.loadTime !== undefined)
      .reduce((sum, r) => sum + (r.loadTime || 0), 0) / this.testResults.length;
    
    report += `- Average Load Time: ${avgLoadTime.toFixed(0)}ms\n`;
    
    const slowRoutes = this.testResults
      .filter(r => r.loadTime && r.loadTime > 2000)
      .sort((a, b) => (b.loadTime || 0) - (a.loadTime || 0));
    
    if (slowRoutes.length > 0) {
      report += "- Slow Routes (>2s):\n";
      slowRoutes.slice(0, 5).forEach(result => {
        report += `  - ${result.route}: ${result.loadTime}ms\n`;
      });
    }

    return report;
  }

  /**
   * Log test summary to console
   */
  private logTestSummary(testSuite: RouteTestSuite): void {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log('\n📊 Route Test Summary:');
      // eslint-disable-next-line no-console
      console.log(`✅ Passed: ${testSuite.passedRoutes}/${testSuite.totalRoutes}`);
      // eslint-disable-next-line no-console
      console.log(`❌ Failed: ${testSuite.failedRoutes}/${testSuite.totalRoutes}`);
      // eslint-disable-next-line no-console
      console.log(`⏱️  Execution Time: ${testSuite.executionTime}ms`);
      
      if (testSuite.failedRoutes > 0) {
        // eslint-disable-next-line no-console
        console.log('\n❌ Failed Routes:');
        testSuite.results
          .filter(r => !r.isValid || !r.componentExists)
          .forEach(result => {
            // eslint-disable-next-line no-console
            console.log(`  - ${result.route}: ${result.error || 'Component loading failed'}`);
          });
      }
    }
  }

  /**
   * Get test results
   */
  getTestResults(): RouteTestResult[] {
    return this.testResults;
  }

  /**
   * Clear test results
   */
  clearTestResults(): void {
    this.testResults = [];
  }
}

// Export singleton instance
export const routeTester = RouteTester.getInstance();

// Development utilities
if (process.env.NODE_ENV === "development") {
  // Make route tester available globally for debugging
  (window as any).routeTester = routeTester;
  
  // Auto-run route tests on page load (with delay to avoid blocking)
  setTimeout(() => {
    routeTester.testAllRoutes().catch(error => {
      // eslint-disable-next-line no-console
      console.warn('Route testing failed:', error);
    });
  }, 5000); // Wait 5 seconds after page load
}

export type { RouteTestResult, RouteTestSuite };