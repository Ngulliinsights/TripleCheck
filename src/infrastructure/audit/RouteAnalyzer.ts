/**
 * Route Analyzer - Analyzes routing configuration and identifies missing routes
 * 
 * This component analyzes the React Router configuration and identifies
 * routes that are referenced in the UI but not properly implemented.
 */

import { RouteValidationResult } from './UIAuditSystem.js';

export interface RouteDefinition {
  path: string;
  component?: string;
  lazy?: boolean;
  exact?: boolean;
  children?: RouteDefinition[];
}

export interface RouteReference {
  path: string;
  referencedIn: string[];
  lineNumbers: number[];
  isNavigationTarget: boolean;
  isLinkTarget: boolean;
}

export interface RouteMismatch {
  path: string;
  issue: 'missing_route' | 'missing_component' | 'broken_lazy_load' | 'invalid_params';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestedFix: string;
}

/**
 * Route Analyzer class
 */
export class RouteAnalyzer {
  private definedRoutes: Map<string, RouteDefinition> = new Map();
  private routeReferences: Map<string, RouteReference> = new Map();
  private routeMismatches: RouteMismatch[] = [];

  /**
   * Analyze the routing configuration
   */
  async analyzeRoutes(): Promise<{
    definedRoutes: RouteDefinition[];
    routeReferences: RouteReference[];
    mismatches: RouteMismatch[];
    validationResults: RouteValidationResult[];
  }> {
    console.log('🔍 Starting route analysis...');

    try {
      // Step 1: Parse router configuration
      await this.parseRouterConfiguration();

      // Step 2: Find all route references in components
      await this.findRouteReferences();

      // Step 3: Compare defined routes with references
      await this.compareRoutesAndReferences();

      // Step 4: Validate each route
      const validationResults = await this.validateAllRoutes();

      console.log('✅ Route analysis complete');
      
      return {
        definedRoutes: Array.from(this.definedRoutes.values()),
        routeReferences: Array.from(this.routeReferences.values()),
        mismatches: this.routeMismatches,
        validationResults
      };
    } catch (error) {
      console.error('❌ Route analysis failed:', error);
      throw error;
    }
  }

  /**
   * Parse the router configuration from router.tsx and lazy-routes.tsx
   */
  private async parseRouterConfiguration(): Promise<void> {
    console.log('📋 Parsing router configuration...');

    // In a real implementation, this would parse the actual router files
    // For now, simulate parsing the router configuration
    const mockRoutes = this.getMockRouterConfiguration();
    
    for (const route of mockRoutes) {
      this.definedRoutes.set(route.path, route);
    }

    console.log(`Found ${this.definedRoutes.size} defined routes`);
  }

  /**
   * Get mock router configuration (replace with real parsing)
   */
  private getMockRouterConfiguration(): RouteDefinition[] {
    return [
      { path: '/', component: 'Home', lazy: true },
      { path: '/dashboard', component: 'Dashboard', lazy: true },
      { path: '/properties', component: 'Properties', lazy: true },
      { path: '/property/:id', component: 'PropertyDetails', lazy: true },
      { path: '/login', component: 'Login', lazy: true },
      { path: '/register', component: 'Register', lazy: true },
      { path: '/profile', component: 'UserProfile', lazy: true },
      { path: '/trust/basic-checks', component: 'BasicChecks', lazy: true },
      { path: '/trust/fraud-detection', component: 'FraudDetection', lazy: true },
      { path: '/land-verification', component: 'LandVerification', lazy: true },
      { path: '/search', component: 'SearchResults', lazy: true },
      { path: '/inbox', component: 'Inbox', lazy: true },
      // Note: /notifications and /settings are missing - this will be detected
    ];
  }

  /**
   * Find all route references in component files
   */
  private async findRouteReferences(): Promise<void> {
    console.log('🔍 Finding route references in components...');

    // In a real implementation, this would scan all component files
    // For now, simulate finding route references
    const mockReferences = this.getMockRouteReferences();
    
    for (const reference of mockReferences) {
      this.routeReferences.set(reference.path, reference);
    }

    console.log(`Found ${this.routeReferences.size} route references`);
  }

  /**
   * Get mock route references (replace with real file scanning)
   */
  private getMockRouteReferences(): RouteReference[] {
    return [
      {
        path: '/dashboard',
        referencedIn: ['Navigation.tsx', 'Home.tsx'],
        lineNumbers: [45, 123],
        isNavigationTarget: true,
        isLinkTarget: true
      },
      {
        path: '/properties',
        referencedIn: ['Navigation.tsx', 'Dashboard.tsx'],
        lineNumbers: [52, 587],
        isNavigationTarget: true,
        isLinkTarget: true
      },
      {
        path: '/notifications',
        referencedIn: ['Dashboard.tsx', 'UserProfile.tsx'],
        lineNumbers: [471, 89],
        isNavigationTarget: true,
        isLinkTarget: false
      },
      {
        path: '/settings',
        referencedIn: ['Dashboard.tsx', 'Navigation.tsx'],
        lineNumbers: [478, 67],
        isNavigationTarget: true,
        isLinkTarget: true
      },
      {
        path: '/activity',
        referencedIn: ['Dashboard.tsx'],
        lineNumbers: [537],
        isNavigationTarget: true,
        isLinkTarget: false
      },
      {
        path: '/property/photos',
        referencedIn: ['Dashboard.tsx'],
        lineNumbers: [561],
        isNavigationTarget: true,
        isLinkTarget: false
      },
      {
        path: '/trust/basic-checks',
        referencedIn: ['Dashboard.tsx', 'Services.tsx'],
        lineNumbers: [569, 234],
        isNavigationTarget: true,
        isLinkTarget: true
      },
      {
        path: '/inbox',
        referencedIn: ['Dashboard.tsx', 'Navigation.tsx'],
        lineNumbers: [577, 78],
        isNavigationTarget: true,
        isLinkTarget: true
      }
    ];
  }

  /**
   * Compare defined routes with references to find mismatches
   */
  private async compareRoutesAndReferences(): Promise<void> {
    console.log('🔍 Comparing routes and references...');

    // Find referenced routes that are not defined
    for (const [path, reference] of Array.from(this.routeReferences)) {
      if (!this.definedRoutes.has(path) && !this.isParameterizedRoute(path)) {
        this.routeMismatches.push({
          path,
          issue: 'missing_route',
          severity: reference.isNavigationTarget ? 'high' : 'medium',
          description: `Route "${path}" is referenced in ${reference.referencedIn.join(', ')} but not defined in router`,
          suggestedFix: `Add route definition for "${path}" in router configuration`
        });
      }
    }

    // Find defined routes that might have missing components
    for (const [path, route] of Array.from(this.definedRoutes)) {
      if (route.lazy && route.component) {
        const componentExists = await this.checkComponentExists(route.component);
        if (!componentExists) {
          this.routeMismatches.push({
            path,
            issue: 'missing_component',
            severity: 'critical',
            description: `Route "${path}" references component "${route.component}" which doesn't exist`,
            suggestedFix: `Create component "${route.component}" or fix the component reference`
          });
        }
      }
    }

    console.log(`Found ${this.routeMismatches.length} route mismatches`);
  }

  /**
   * Check if a path matches a parameterized route
   */
  private isParameterizedRoute(path: string): boolean {
    for (const definedPath of Array.from(this.definedRoutes.keys())) {
      if (this.matchesParameterizedPath(path, definedPath)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a path matches a parameterized route pattern
   */
  private matchesParameterizedPath(path: string, pattern: string): boolean {
    // Simple pattern matching for :param style routes
    const patternRegex = pattern.replace(/:[\w]+/g, '[^/]+');
    const regex = new RegExp(`^${patternRegex}$`);
    return regex.test(path);
  }

  /**
   * Check if a component exists (mock implementation)
   */
  private async checkComponentExists(componentName: string): Promise<boolean> {
    // In a real implementation, this would check if the component file exists
    // For now, simulate some missing components
    const missingComponents = ['NotificationPage', 'SettingsPage', 'ActivityPage'];
    return !missingComponents.includes(componentName);
  }

  /**
   * Validate all routes by attempting to load them
   */
  private async validateAllRoutes(): Promise<RouteValidationResult[]> {
    console.log('🔍 Validating all routes...');

    const results: RouteValidationResult[] = [];

    for (const [path, route] of Array.from(this.definedRoutes)) {
      const result = await this.validateSingleRoute(path, route);
      results.push(result);
    }

    // Also validate referenced routes that aren't defined
    for (const [path, reference] of Array.from(this.routeReferences)) {
      if (!this.definedRoutes.has(path) && !this.isParameterizedRoute(path)) {
        results.push({
          route: path,
          status: '404',
          errorMessage: 'Route not defined in router configuration'
        });
      }
    }

    console.log(`Validated ${results.length} routes`);
    return results;
  }

  /**
   * Validate a single route
   */
  private async validateSingleRoute(path: string, route: RouteDefinition): Promise<RouteValidationResult> {
    const startTime = Date.now();

    try {
      // Check if component exists
      if (route.component) {
        const componentExists = await this.checkComponentExists(route.component);
        if (!componentExists) {
          return {
            route: path,
            status: 'broken',
            component: route.component || 'Unknown',
            errorMessage: `Component ${route.component} not found`,
            responseTime: Date.now() - startTime
          };
        }
      }

      // Check if lazy loading works
      if (route.lazy) {
        const lazyLoadWorks = await this.checkLazyLoading(route.component || path);
        if (!lazyLoadWorks) {
          return {
            route: path,
            status: 'broken',
            component: route.component || 'Unknown',
            errorMessage: 'Lazy loading failed',
            responseTime: Date.now() - startTime
          };
        }
      }

      return {
        route: path,
        status: 'working',
        component: route.component || 'Unknown',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        route: path,
        status: 'broken',
        component: route.component || 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check if lazy loading works for a component
   */
  private async checkLazyLoading(componentName: string): Promise<boolean> {
    // In a real implementation, this would attempt to lazy load the component
    // For now, simulate some lazy loading failures
    const failingLazyLoads = ['NotificationPage', 'SettingsPage'];
    return !failingLazyLoads.includes(componentName);
  }

  /**
   * Get route analysis summary
   */
  getAnalysisSummary(): {
    totalDefinedRoutes: number;
    totalReferencedRoutes: number;
    missingRoutes: number;
    brokenRoutes: number;
    criticalIssues: number;
  } {
    const missingRoutes = this.routeMismatches.filter(m => m.issue === 'missing_route').length;
    const brokenRoutes = this.routeMismatches.filter(m => m.issue === 'missing_component' || m.issue === 'broken_lazy_load').length;
    const criticalIssues = this.routeMismatches.filter(m => m.severity === 'critical').length;

    return {
      totalDefinedRoutes: this.definedRoutes.size,
      totalReferencedRoutes: this.routeReferences.size,
      missingRoutes,
      brokenRoutes,
      criticalIssues
    };
  }

  /**
   * Get detailed mismatch report
   */
  getMismatchReport(): RouteMismatch[] {
    return this.routeMismatches.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
}

// Export singleton instance
export const routeAnalyzer = new RouteAnalyzer();