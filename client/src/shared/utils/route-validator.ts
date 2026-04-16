/**
 * Route Validation Utility
 * Provides comprehensive route validation and error handling
 */

interface RouteValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface RouteParams {
  [key: string]: string | undefined;
}

export class RouteValidator {
  private static instance: RouteValidator;
  private validRoutes = new Set<string>();
  private routePatterns = new Map<string, RegExp>();

  private constructor() {
    this.initializeValidRoutes();
  }

  static getInstance(): RouteValidator {
    if (!RouteValidator.instance) {
      RouteValidator.instance = new RouteValidator();
    }
    return RouteValidator.instance;
  }

  private initializeValidRoutes(): void {
    // Core application routes
    const routes = [
      '/',
      '/features',
      '/pricing',
      '/auth/login',
      '/auth/register',
      '/dashboard',
      '/team',
      '/tenants',
      '/properties',
      '/properties/my',
      '/properties/residential',
      '/properties/commercial',
      '/properties/land',
      '/property/:id',
      '/property/:id/edit',
      '/property/:id/photos',
      '/property/:id/optimize',
      '/land/:id',
      '/compare',
      '/list-property',
      '/services',
      '/services/list-property',
      '/services/basic-checks',
      '/services/fraud-detection',
      '/services/document-auth',
      '/services/reports',
      '/services/alerts',
      '/services/karma',
      '/services/reputation',
      '/services/trust-points',
      '/services/reviews',
      '/solutions',
      '/solutions/buyers',
      '/solutions/sellers',
      '/solutions/agents',
      '/solutions/developers',
      '/solutions/legal-experts',
      '/land-verification',
      '/land-verification/dashboard',
      '/land-verification/new',
      '/search',
      '/inbox',
      '/help',
      '/help/getting-started',
      '/help/verification-guide',
      '/help/faq',
      '/contact',
      '/resources',
      '/blog',
      '/blog/:id',
      '/community-resources',
      '/community',
      '/fraud-guide',
      '/fraud-resources',
      '/resources/fraud',
      '/about',
      '/static/our-story',
      '/static/partners',
      '/static/press-media',
      '/privacy',
      '/terms',
      '/cookies',
      '/security',
      '/mvp-demo',
      '/dev'
    ];

    routes.forEach(route => {
      this.validRoutes.add(route);
      
      // Create regex pattern for parameterized routes
      if (route.includes(':')) {
        const pattern = route.replace(/:([^/]+)/g, '([^/]+)');
        this.routePatterns.set(route, new RegExp(`^${pattern}$`));
      }
    });
  }

  /**
   * Validate a route path
   */
  validateRoute(path: string): RouteValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if it's an exact match
    if (this.validRoutes.has(path)) {
      return { isValid: true, errors, warnings };
    }

    // Check against parameterized routes
    for (const [routePattern, regex] of this.routePatterns) {
      if (regex.test(path)) {
        return { isValid: true, errors, warnings };
      }
    }

    // If no match found, it's invalid
    errors.push(`Route '${path}' is not defined in the application`);
    
    // Suggest similar routes
    const suggestions = this.findSimilarRoutes(path);
    if (suggestions.length > 0) {
      warnings.push(`Did you mean: ${suggestions.join(', ')}?`);
    }

    return { isValid: false, errors, warnings };
  }

  /**
   * Validate route parameters
   */
  validateRouteParams(params: RouteParams, requiredParams: string[] = []): RouteValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required parameters
    for (const param of requiredParams) {
      if (!params[param] || params[param]?.trim() === '') {
        errors.push(`Missing required parameter: ${param}`);
      }
    }

    // Validate ID format if present
    if (params.id && !/^[a-zA-Z0-9_-]+$/.test(params.id)) {
      errors.push('Invalid ID format. IDs should contain only letters, numbers, underscores, and hyphens.');
    }

    // Check for potentially dangerous parameters
    for (const [key, value] of Object.entries(params)) {
      if (value && this.containsSuspiciousContent(value)) {
        warnings.push(`Parameter '${key}' contains potentially unsafe content`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Find similar routes for suggestions
   */
  private findSimilarRoutes(path: string): string[] {
    const suggestions: string[] = [];
    const pathParts = path.toLowerCase().split('/').filter(Boolean);

    for (const route of this.validRoutes) {
      const routeParts = route.toLowerCase().split('/').filter(Boolean);
      
      // Calculate similarity score
      const similarity = this.calculateSimilarity(pathParts, routeParts);
      if (similarity > 0.5) {
        suggestions.push(route);
      }
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Calculate similarity between two path arrays
   */
  private calculateSimilarity(path1: string[], path2: string[]): number {
    const maxLength = Math.max(path1.length, path2.length);
    if (maxLength === 0) return 1;

    let matches = 0;
    const minLength = Math.min(path1.length, path2.length);

    for (let i = 0; i < minLength; i++) {
      if (path1[i] === path2[i] || this.isParameterMatch(path1[i] || '', path2[i] || '')) {
        matches++;
      }
    }

    return matches / maxLength;
  }

  /**
   * Check if a path segment matches a parameter pattern
   */
  private isParameterMatch(segment1: string, segment2: string): boolean {
    return segment1.startsWith(':') || segment2.startsWith(':');
  }

  /**
   * Check for suspicious content in parameters
   */
  private containsSuspiciousContent(value: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /\.\./,
      /[<>'"]/
    ];

    return suspiciousPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Get all valid routes for debugging
   */
  getAllValidRoutes(): string[] {
    return Array.from(this.validRoutes).sort();
  }

  /**
   * Check if a route exists in the application
   */
  routeExists(path: string): boolean {
    return this.validateRoute(path).isValid;
  }
}

// Export singleton instance
export const routeValidator = RouteValidator.getInstance();

// Export utility functions
export const validateRoute = (path: string) => routeValidator.validateRoute(path);
export const validateRouteParams = (params: RouteParams, requiredParams?: string[]) => 
  routeValidator.validateRouteParams(params, requiredParams);
export const routeExists = (path: string) => routeValidator.routeExists(path);