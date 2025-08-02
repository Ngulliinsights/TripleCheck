/**
 * API Route Registry and Validation System
 * Provides centralized management and validation of all API routes
 */

interface ApiRoute {
  path: string;
  method: string;
  handler: string;
  middleware: string[];
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responses: Array<{
    status: number;
    description: string;
    schema?: string;
  }>;
}

interface RouteValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ApiRouteRegistry {
  private static instance: ApiRouteRegistry;
  private routes = new Map<string, ApiRoute>();
  private routePatterns = new Map<string, RegExp>();

  private constructor() {
    this.initializeRoutes();
  }

  static getInstance(): ApiRouteRegistry {
    if (!ApiRouteRegistry.instance) {
      ApiRouteRegistry.instance = new ApiRouteRegistry();
    }
    return ApiRouteRegistry.instance;
  }

  /**
   * Initialize all API routes
   */
  private initializeRoutes(): void {
    const routes: ApiRoute[] = [
      // Authentication routes
      {
        path: '/api/auth/login',
        method: 'POST',
        handler: 'AuthController.login',
        middleware: ['validation', 'rateLimit'],
        description: 'User login endpoint',
        parameters: [
          { name: 'email', type: 'string', required: true, description: 'User email address' },
          { name: 'password', type: 'string', required: true, description: 'User password' }
        ],
        responses: [
          { status: 200, description: 'Login successful', schema: 'AuthResponse' },
          { status: 401, description: 'Invalid credentials' },
          { status: 429, description: 'Too many login attempts' }
        ]
      },
      {
        path: '/api/auth/register',
        method: 'POST',
        handler: 'AuthController.register',
        middleware: ['validation', 'rateLimit'],
        description: 'User registration endpoint',
        parameters: [
          { name: 'email', type: 'string', required: true, description: 'User email address' },
          { name: 'password', type: 'string', required: true, description: 'User password' },
          { name: 'firstName', type: 'string', required: true, description: 'User first name' },
          { name: 'lastName', type: 'string', required: true, description: 'User last name' }
        ],
        responses: [
          { status: 201, description: 'Registration successful', schema: 'AuthResponse' },
          { status: 400, description: 'Invalid input data' },
          { status: 409, description: 'Email already exists' }
        ]
      },
      {
        path: '/api/auth/profile',
        method: 'GET',
        handler: 'AuthController.getProfile',
        middleware: ['auth'],
        description: 'Get user profile',
        responses: [
          { status: 200, description: 'Profile retrieved successfully', schema: 'UserProfile' },
          { status: 401, description: 'Authentication required' }
        ]
      },

      // Property routes
      {
        path: '/api/properties',
        method: 'GET',
        handler: 'PropertyController.getProperties',
        middleware: ['optionalAuth', 'cache'],
        description: 'Get list of properties with optional filtering',
        parameters: [
          { name: 'page', type: 'number', required: false, description: 'Page number for pagination' },
          { name: 'limit', type: 'number', required: false, description: 'Number of items per page' },
          { name: 'location', type: 'string', required: false, description: 'Filter by location' },
          { name: 'priceMin', type: 'number', required: false, description: 'Minimum price filter' },
          { name: 'priceMax', type: 'number', required: false, description: 'Maximum price filter' }
        ],
        responses: [
          { status: 200, description: 'Properties retrieved successfully', schema: 'PropertyList' },
          { status: 400, description: 'Invalid query parameters' }
        ]
      },
      {
        path: '/api/properties/:id',
        method: 'GET',
        handler: 'PropertyController.getProperty',
        middleware: ['optionalAuth', 'cache'],
        description: 'Get specific property by ID',
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Property ID' },
          { name: 'includeMarketEstimate', type: 'boolean', required: false, description: 'Include market estimate data' }
        ],
        responses: [
          { status: 200, description: 'Property retrieved successfully', schema: 'Property' },
          { status: 404, description: 'Property not found' }
        ]
      },
      {
        path: '/api/properties',
        method: 'POST',
        handler: 'PropertyController.createProperty',
        middleware: ['auth', 'validation'],
        description: 'Create new property listing',
        parameters: [
          { name: 'title', type: 'string', required: true, description: 'Property title' },
          { name: 'description', type: 'string', required: true, description: 'Property description' },
          { name: 'price', type: 'number', required: true, description: 'Property price' },
          { name: 'location', type: 'string', required: true, description: 'Property location' }
        ],
        responses: [
          { status: 201, description: 'Property created successfully', schema: 'Property' },
          { status: 400, description: 'Invalid property data' },
          { status: 401, description: 'Authentication required' }
        ]
      },

      // Trust and verification routes
      {
        path: '/api/trust/score/:userId',
        method: 'GET',
        handler: 'TrustController.getTrustScore',
        middleware: ['auth', 'cache'],
        description: 'Get user trust score',
        parameters: [
          { name: 'userId', type: 'string', required: true, description: 'User ID' }
        ],
        responses: [
          { status: 200, description: 'Trust score retrieved successfully', schema: 'TrustScore' },
          { status: 404, description: 'User not found' }
        ]
      },

      // Communication routes
      {
        path: '/api/communication/messages',
        method: 'GET',
        handler: 'CommunicationController.getMessages',
        middleware: ['auth'],
        description: 'Get user messages',
        parameters: [
          { name: 'userId', type: 'string', required: true, description: 'User ID' }
        ],
        responses: [
          { status: 200, description: 'Messages retrieved successfully', schema: 'MessageList' },
          { status: 401, description: 'Authentication required' }
        ]
      },

      // Land verification routes
      {
        path: '/api/land-verification/initiate',
        method: 'POST',
        handler: 'LandVerificationController.initiate',
        middleware: ['auth', 'validation'],
        description: 'Initiate land verification process',
        parameters: [
          { name: 'propertyId', type: 'string', required: true, description: 'Property ID to verify' },
          { name: 'requestedLayers', type: 'array', required: false, description: 'Specific verification layers' }
        ],
        responses: [
          { status: 200, description: 'Verification initiated successfully', schema: 'VerificationSession' },
          { status: 400, description: 'Invalid request data' },
          { status: 401, description: 'Authentication required' }
        ]
      },

      // Error monitoring routes
      {
        path: '/api/errors',
        method: 'POST',
        handler: 'ErrorController.logError',
        middleware: ['rateLimit'],
        description: 'Log client-side errors',
        parameters: [
          { name: 'error', type: 'object', required: true, description: 'Error details' },
          { name: 'context', type: 'object', required: true, description: 'Error context' }
        ],
        responses: [
          { status: 200, description: 'Error logged successfully' },
          { status: 400, description: 'Invalid error data' }
        ]
      },

      // Monitoring routes
      {
        path: '/api/monitoring/alerts',
        method: 'POST',
        handler: 'MonitoringController.createAlert',
        middleware: ['auth', 'validation'],
        description: 'Create monitoring alert',
        parameters: [
          { name: 'type', type: 'string', required: true, description: 'Alert type' },
          { name: 'message', type: 'string', required: true, description: 'Alert message' },
          { name: 'severity', type: 'string', required: false, description: 'Alert severity level' }
        ],
        responses: [
          { status: 200, description: 'Alert created successfully' },
          { status: 400, description: 'Invalid alert data' }
        ]
      }
    ];

    // Register all routes
    routes.forEach(route => {
      const key = `${route.method}:${route.path}`;
      this.routes.set(key, route);
      
      // Create regex pattern for parameterized routes
      if (route.path.includes(':')) {
        const pattern = route.path.replace(/:([^/]+)/g, '([^/]+)');
        this.routePatterns.set(key, new RegExp(`^${pattern}$`));
      }
    });
  }

  /**
   * Validate if a route exists
   */
  validateRoute(method: string, path: string): RouteValidationResult {
    const key = `${method.toUpperCase()}:${path}`;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check exact match first
    if (this.routes.has(key)) {
      return { isValid: true, errors, warnings };
    }

    // Check parameterized routes
    for (const [routeKey, pattern] of this.routePatterns) {
      if (routeKey.startsWith(`${method.toUpperCase()}:`) && pattern.test(path)) {
        return { isValid: true, errors, warnings };
      }
    }

    errors.push(`Route ${method.toUpperCase()} ${path} is not registered`);
    
    // Suggest similar routes
    const suggestions = this.findSimilarRoutes(method, path);
    if (suggestions.length > 0) {
      warnings.push(`Similar routes found: ${suggestions.join(', ')}`);
    }

    return { isValid: false, errors, warnings };
  }

  /**
   * Get route information
   */
  getRoute(method: string, path: string): ApiRoute | null {
    const key = `${method.toUpperCase()}:${path}`;
    return this.routes.get(key) || null;
  }

  /**
   * Get all routes
   */
  getAllRoutes(): ApiRoute[] {
    return Array.from(this.routes.values());
  }

  /**
   * Get routes by method
   */
  getRoutesByMethod(method: string): ApiRoute[] {
    return Array.from(this.routes.values()).filter(route => 
      route.method.toUpperCase() === method.toUpperCase()
    );
  }

  /**
   * Find similar routes for suggestions
   */
  private findSimilarRoutes(method: string, path: string): string[] {
    const suggestions: string[] = [];
    const pathParts = path.split('/').filter(Boolean);
    
    for (const route of this.routes.values()) {
      if (route.method.toUpperCase() !== method.toUpperCase()) continue;
      
      const routeParts = route.path.split('/').filter(Boolean);
      const similarity = this.calculatePathSimilarity(pathParts, routeParts);
      
      if (similarity > 0.5) {
        suggestions.push(`${route.method} ${route.path}`);
      }
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Calculate similarity between two paths
   */
  private calculatePathSimilarity(path1: string[], path2: string[]): number {
    const maxLength = Math.max(path1.length, path2.length);
    if (maxLength === 0) return 1;
    
    let matches = 0;
    const minLength = Math.min(path1.length, path2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (path1[i] === path2[i] || path2[i].startsWith(':')) {
        matches++;
      }
    }
    
    return matches / maxLength;
  }

  /**
   * Generate API documentation
   */
  generateApiDocumentation(): string {
    let doc = "# API Documentation\n\n";
    doc += `Generated: ${new Date().toISOString()}\n\n`;
    
    const routesByPath = new Map<string, ApiRoute[]>();
    
    // Group routes by base path
    for (const route of this.routes.values()) {
      const basePath = route.path.split('/').slice(0, 3).join('/');
      if (!routesByPath.has(basePath)) {
        routesByPath.set(basePath, []);
      }
      routesByPath.get(basePath)!.push(route);
    }
    
    // Generate documentation for each group
    for (const [basePath, routes] of routesByPath) {
      doc += `## ${basePath}\n\n`;
      
      for (const route of routes) {
        doc += `### ${route.method.toUpperCase()} ${route.path}\n\n`;
        doc += `${route.description}\n\n`;
        
        if (route.parameters && route.parameters.length > 0) {
          doc += "**Parameters:**\n";
          for (const param of route.parameters) {
            const required = param.required ? " (required)" : " (optional)";
            doc += `- \`${param.name}\` (${param.type})${required}: ${param.description}\n`;
          }
          doc += "\n";
        }
        
        doc += "**Responses:**\n";
        for (const response of route.responses) {
          doc += `- \`${response.status}\`: ${response.description}\n`;
        }
        doc += "\n";
        
        if (route.middleware.length > 0) {
          doc += `**Middleware:** ${route.middleware.join(', ')}\n\n`;
        }
      }
    }
    
    return doc;
  }

  /**
   * Validate API route health
   */
  async validateRouteHealth(): Promise<Array<{ route: string; status: 'healthy' | 'unhealthy' | 'timeout'; responseTime?: number; error?: string }>> {
    const results: Array<{ route: string; status: 'healthy' | 'unhealthy' | 'timeout'; responseTime?: number; error?: string }> = [];
    
    // Test a subset of GET routes that don't require authentication
    const testRoutes = Array.from(this.routes.values())
      .filter(route => route.method === 'GET' && !route.middleware.includes('auth'))
      .slice(0, 5); // Test first 5 routes
    
    for (const route of testRoutes) {
      const startTime = Date.now();
      
      try {
        const testPath = route.path.replace(/:([^/]+)/g, 'test-param');
        const response = await fetch(`http://localhost:3000${testPath}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        
        const responseTime = Date.now() - startTime;
        
        results.push({
          route: `${route.method} ${route.path}`,
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime,
          error: response.ok ? undefined : `HTTP ${response.status}`
        });
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.push({
          route: `${route.method} ${route.path}`,
          status: responseTime > 5000 ? 'timeout' : 'unhealthy',
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const apiRouteRegistry = ApiRouteRegistry.getInstance();

// Development utilities
if (process.env.NODE_ENV === "development") {
  // Make registry available globally for debugging
  (global as any).apiRouteRegistry = apiRouteRegistry;
}

export type { ApiRoute, RouteValidationResult };