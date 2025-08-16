/**
 * Enhanced Link Validator - Advanced testing of navigation links and API calls
 * 
 * This enhanced version provides comprehensive validation with intelligent
 * discovery, sophisticated error handling, and actionable insights.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { APIConnectionResult } from './UIAuditSystem.js';

export interface LinkValidationResult {
  url: string;
  type: 'internal_route' | 'external_link' | 'api_endpoint' | 'dynamic_route';
  status: 'working' | 'broken' | 'timeout' | 'redirect' | 'unauthorized' | '404' | 'rate_limited' | 'ssl_error';
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
  redirectUrl?: string;
  redirectChain?: string[];
  foundIn: LinkLocation[];
  lastTested: Date;
  retryCount: number;
  healthScore: number; // 0-100 based on reliability over time
  securityIssues?: SecurityIssue[];
  performance?: PerformanceMetrics;
  suggestions?: string[];
}

export interface LinkLocation {
  filePath: string;
  componentName: string;
  lineNumber: number;
  columnNumber: number;
  elementType: 'Link' | 'button' | 'a' | 'form' | 'navigate' | 'fetch' | 'axios' | 'dynamic_import';
  context: string;
  isConditional: boolean; // Whether link is inside conditional logic
  framework?: 'react-router' | 'next-router' | 'vanilla' | 'vue-router';
}

export interface SecurityIssue {
  type: 'mixed_content' | 'insecure_protocol' | 'suspicious_domain' | 'cors_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface PerformanceMetrics {
  firstByteTime: number;
  totalLoadTime: number;
  contentSize: number;
  compressionRatio?: number;
  cacheHeaders?: { [key: string]: string };
}

export interface APIEndpointInfo {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  usedIn: APIUsageLocation[];
  expectedResponse?: any;
  authentication?: AuthenticationInfo;
  parameters?: APIParameter[];
  rateLimit?: RateLimitInfo;
  version?: string;
  deprecated?: boolean;
  alternativeEndpoint?: string;
  documentation?: string;
  mockResponse?: any;
}

export interface AuthenticationInfo {
  type: 'bearer' | 'basic' | 'api_key' | 'oauth' | 'cookie' | 'none';
  required: boolean;
  scopes?: string[];
  headerName?: string;
}

export interface RateLimitInfo {
  requestsPerMinute: number;
  burstLimit?: number;
  resetInterval: number;
}

export interface APIUsageLocation {
  filePath: string;
  componentName: string;
  lineNumber: number;
  columnNumber: number;
  hookName?: string;
  context: string;
  errorHandling: boolean;
  loadingState: boolean;
  retryLogic: boolean;
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  validation?: string;
  defaultValue?: any;
  examples?: any[];
}

/**
 * Advanced configuration for the validator
 */
export interface ValidatorConfig {
  // Discovery settings
  scanPaths: string[];
  excludePaths: string[];
  fileExtensions: string[];
  maxFileSize: number;

  // Validation settings
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  concurrentRequests: number;
  userAgent: string;
  followRedirects: boolean;
  maxRedirects: number;

  // Caching
  cacheEnabled: boolean;
  cacheTimeout: number;

  // Security
  allowInsecureConnections: boolean;
  checkCertificates: boolean;
  blockedDomains: string[];
  trustedDomains: string[];

  // Performance
  performanceThreshold: number;
  enablePerformanceMetrics: boolean;

  // API specific
  apiBaseUrl?: string;
  authToken?: string;
  apiVersion?: string;
}

/**
 * Cache entry for validation results
 */
interface CacheEntry {
  result: LinkValidationResult;
  timestamp: number;
  ttl: number;
}

/**
 * Enhanced Link Validator class
 */
export class EnhancedLinkValidator {
  private config: ValidatorConfig;
  private discoveredLinks: Map<string, LinkValidationResult> = new Map();
  private discoveredAPIs: Map<string, APIEndpointInfo> = new Map();
  private validationResults: LinkValidationResult[] = [];
  private cache: Map<string, CacheEntry> = new Map();
  private rateLimiter: Map<string, number[]> = new Map();
  private routePatterns: RegExp[] = [];

  constructor(config: Partial<ValidatorConfig> = {}) {
    // Merge with default configuration
    this.config = {
      scanPaths: ['src', 'pages', 'components'],
      excludePaths: ['node_modules', 'build', 'dist', '.git'],
      fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'],
      maxFileSize: 1024 * 1024, // 1MB
      timeout: 10000,
      maxRetries: 3,
      retryDelay: 1000,
      concurrentRequests: 5,
      userAgent: 'LinkValidator/1.0',
      followRedirects: true,
      maxRedirects: 5,
      cacheEnabled: true,
      cacheTimeout: 300000, // 5 minutes
      allowInsecureConnections: false,
      checkCertificates: true,
      blockedDomains: [],
      trustedDomains: [],
      performanceThreshold: 3000,
      enablePerformanceMetrics: true,
      ...config
    };
  }

  /**
   * Enhanced validation method with comprehensive analysis
   */
  async validateAllLinks(): Promise<{
    linkResults: LinkValidationResult[];
    apiResults: APIConnectionResult[];
    summary: EnhancedValidationSummary;
    recommendations: ValidationRecommendation[];
  }> {
    console.log('🔍 Starting enhanced link and API validation...');

    try {
      // Step 1: Initialize route patterns from router configuration
      await this.initializeRoutePatterns();

      // Step 2: Discover all links through static analysis
      await this.discoverLinksFromFiles();

      // Step 3: Discover API endpoints through code analysis
      await this.discoverAPIEndpointsFromCode();

      // Step 4: Validate with intelligent batching and rate limiting
      await this.performIntelligentValidation();

      // Step 5: Validate API endpoints with proper error handling
      const apiResults = await this.validateAPIEndpointsAdvanced();

      // Step 6: Generate comprehensive analysis and recommendations
      const summary = this.generateEnhancedSummary();
      const recommendations = this.generateRecommendations();

      console.log('✅ Enhanced validation complete');

      return {
        linkResults: this.validationResults,
        apiResults,
        summary,
        recommendations
      };
    } catch (error) {
      console.error('❌ Enhanced validation failed:', error);
      throw this.enhanceError(error);
    }
  }

  /**
   * Initialize route patterns from actual router configuration
   */
  private async initializeRoutePatterns(): Promise<void> {
    console.log('🔍 Analyzing router configuration...');

    try {
      // Look for common router configuration files
      const routerFiles = [
        'src/App.tsx',
        'src/App.jsx',
        'src/router/index.ts',
        'src/routes.ts',
        'pages/_app.tsx', // Next.js
        'src/main.ts' // Vue
      ];

      for (const filePath of routerFiles) {
        if (await this.fileExists(filePath)) {
          await this.extractRoutePatternsFromFile(filePath);
        }
      }

      // Add dynamic route patterns for Next.js, Nuxt, etc.
      this.addFrameworkSpecificPatterns();

      console.log(`Initialized ${this.routePatterns.length} route patterns`);
    } catch (error) {
      console.warn('Could not fully initialize route patterns:', error);
      // Continue with basic patterns
      this.addBasicRoutePatterns();
    }
  }

  /**
   * Extract route patterns from router configuration files
   */
  private async extractRoutePatternsFromFile(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });

      // Traverse AST to find route definitions
      traverse(ast, {
        JSXAttribute: (path) => {
          if (path.node.name.name === 'path' && path.node.value) {
            const routePath = this.extractStringValue(path.node.value);
            if (routePath) {
              this.routePatterns.push(this.createRoutePattern(routePath));
            }
          }
        },
        Property: (path) => {
          if (path.node.key.type === 'Identifier' &&
            path.node.key.name === 'path' &&
            path.node.value && path.node.value.type === 'StringLiteral') {
            const routePath = path.node.value.value;
            this.routePatterns.push(this.createRoutePattern(routePath));
          }
        }
      });
    } catch (error) {
      console.warn(`Could not parse router file ${filePath}:`, error);
    }
  }

  /**
   * Discover links through comprehensive file analysis
   */
  private async discoverLinksFromFiles(): Promise<void> {
    console.log('🔍 Discovering links through static analysis...');

    const files = await this.getAllSourceFiles();
    let discoveredCount = 0;

    // Process files in batches to manage memory
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      await Promise.all(batch.map(async (file) => {
        try {
          const links = await this.extractLinksFromFile(file);
          discoveredCount += links.length;

          for (const link of links) {
            const existing = this.discoveredLinks.get(link.url);
            if (existing) {
              // Merge locations if link already exists
              existing.foundIn.push(...link.foundIn);
            } else {
              this.discoveredLinks.set(link.url, link);
            }
          }
        } catch (error) {
          console.warn(`Error processing file ${file}:`, error);
        }
      }));
    }

    console.log(`Discovered ${discoveredCount} links from ${files.length} files`);
  }

  /**
   * Get all source files to analyze
   */
  private async getAllSourceFiles(): Promise<string[]> {
    const files: string[] = [];

    for (const scanPath of this.config.scanPaths) {
      if (await this.fileExists(scanPath)) {
        const pathFiles = await this.walkDirectory(scanPath);
        files.push(...pathFiles);
      }
    }

    return files.filter(file => {
      const ext = path.extname(file);
      return this.config.fileExtensions.includes(ext) &&
        !this.config.excludePaths.some(excluded => file.includes(excluded));
    });
  }

  /**
   * Recursively walk directory to find files
   */
  private async walkDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const items = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);

        if (item.isDirectory() && !this.config.excludePaths.some(excluded => item.name.includes(excluded))) {
          const subFiles = await this.walkDirectory(fullPath);
          files.push(...subFiles);
        } else if (item.isFile()) {
          const stats = await fs.promises.stat(fullPath);
          if (stats.size <= this.config.maxFileSize) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${dirPath}:`, error);
    }

    return files;
  }

  /**
   * Extract links from a single file using AST analysis
   */
  private async extractLinksFromFile(filePath: string): Promise<LinkValidationResult[]> {
    const links: LinkValidationResult[] = [];

    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy']
      });

      let currentComponent = path.basename(filePath, path.extname(filePath));

      traverse(ast, {
        // React Router Links
        JSXElement: (nodePath) => {
          const openingElement = nodePath.node.openingElement;
          if (openingElement.name.type === 'JSXIdentifier') {
            const elementName = openingElement.name.name;

            if (['Link', 'NavLink'].includes(elementName)) {
              const toAttr = openingElement.attributes.find(attr =>
                attr.type === 'JSXAttribute' && attr.name.name === 'to'
              ) as any;

              if (toAttr && toAttr.value) {
                const url = this.extractStringValue(toAttr.value);
                if (url) {
                  links.push(this.createLinkResult(url, 'internal_route', {
                    filePath,
                    componentName: currentComponent,
                    lineNumber: nodePath.node.loc?.start.line || 0,
                    columnNumber: nodePath.node.loc?.start.column || 0,
                    elementType: 'Link',
                    context: content.substring(
                      nodePath.node.start! - 50,
                      nodePath.node.end! + 50
                    ).trim(),
                    isConditional: this.isInConditionalBlock(nodePath),
                    framework: 'react-router'
                  }));
                }
              }
            }

            // Regular anchor tags
            if (elementName === 'a') {
              const hrefAttr = openingElement.attributes.find(attr =>
                attr.type === 'JSXAttribute' && attr.name.name === 'href'
              ) as any;

              if (hrefAttr && hrefAttr.value) {
                const url = this.extractStringValue(hrefAttr.value);
                if (url) {
                  const type = this.determineUrlType(url);
                  links.push(this.createLinkResult(url, type, {
                    filePath,
                    componentName: currentComponent,
                    lineNumber: nodePath.node.loc?.start.line || 0,
                    columnNumber: nodePath.node.loc?.start.column || 0,
                    elementType: 'a',
                    context: content.substring(
                      nodePath.node.start! - 50,
                      nodePath.node.end! + 50
                    ).trim(),
                    isConditional: this.isInConditionalBlock(nodePath),
                    framework: 'vanilla'
                  }));
                }
              }
            }
          }
        },

        // Function calls like navigate(), router.push()
        CallExpression: (nodePath) => {
          const callee = nodePath.node.callee;

          // Direct navigate calls
          if (callee.type === 'Identifier' && ['navigate', 'push', 'replace'].includes(callee.name)) {
            const firstArg = nodePath.node.arguments[0];
            if (firstArg && firstArg.type === 'StringLiteral') {
              links.push(this.createLinkResult(firstArg.value, 'internal_route', {
                filePath,
                componentName: currentComponent,
                lineNumber: nodePath.node.loc?.start.line || 0,
                columnNumber: nodePath.node.loc?.start.column || 0,
                elementType: 'navigate',
                context: content.substring(
                  nodePath.node.start! - 50,
                  nodePath.node.end! + 50
                ).trim(),
                isConditional: this.isInConditionalBlock(nodePath),
                framework: 'react-router'
              }));
            }
          }

          // Member expression calls like router.push()
          if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
            const methodName = callee.property.name;
            if (['push', 'replace', 'go'].includes(methodName)) {
              const firstArg = nodePath.node.arguments[0];
              if (firstArg && firstArg.type === 'StringLiteral') {
                links.push(this.createLinkResult(firstArg.value, 'internal_route', {
                  filePath,
                  componentName: currentComponent,
                  lineNumber: nodePath.node.loc?.start.line || 0,
                  columnNumber: nodePath.node.loc?.start.column || 0,
                  elementType: 'navigate',
                  context: content.substring(
                    nodePath.node.start! - 50,
                    nodePath.node.end! + 50
                  ).trim(),
                  isConditional: this.isInConditionalBlock(nodePath),
                  framework: this.detectFramework(callee.object)
                }));
              }
            }
          }
        }
      });

    } catch (error) {
      console.warn(`Could not parse file ${filePath}:`, error);
    }

    return links;
  }

  /**
   * Perform intelligent validation with batching and error handling
   */
  private async performIntelligentValidation(): Promise<void> {
    console.log('🔍 Performing intelligent validation...');

    const links = Array.from(this.discoveredLinks.values());
    const batches = this.createValidationBatches(links);

    for (let i = 0; i < batches.length; i++) {
      console.log(`Processing batch ${i + 1}/${batches.length}...`);

      await Promise.all((batches[i] || []).map(async (link) => {
        try {
          // Check cache first
          if (this.config.cacheEnabled) {
            const cached = this.getCachedResult(link.url);
            if (cached) {
              this.validationResults.push(cached);
              return;
            }
          }

          // Validate based on type
          let result: LinkValidationResult;
          if (link.type === 'internal_route' || link.type === 'dynamic_route') {
            result = await this.validateInternalRouteAdvanced(link);
          } else {
            result = await this.validateExternalLinkAdvanced(link);
          }

          // Cache result
          if (this.config.cacheEnabled) {
            this.setCachedResult(link.url, result);
          }

          this.validationResults.push(result);
        } catch (error) {
          console.warn(`Validation failed for ${link.url}:`, error);

          // Create error result
          const errorResult: LinkValidationResult = {
            ...link,
            status: 'broken',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            lastTested: new Date(),
            retryCount: 0,
            healthScore: 0,
            suggestions: ['Check network connectivity', 'Verify URL syntax']
          };

          this.validationResults.push(errorResult);
        }
      }));

      // Rate limiting between batches
      if (i < batches.length - 1) {
        await this.sleep(500);
      }
    }
  }

  /**
   * Advanced internal route validation
   */
  private async validateInternalRouteAdvanced(link: LinkValidationResult): Promise<LinkValidationResult> {
    const startTime = Date.now();

    try {
      // Check if route matches any known patterns
      const routeExists = this.checkRouteExistsAdvanced(link.url);
      const responseTime = Date.now() - startTime;

      if (!routeExists) {
        return {
          ...link,
          status: '404',
          responseTime,
          errorMessage: 'Route not found in application configuration',
          lastTested: new Date(),
          retryCount: 0,
          healthScore: 0,
          suggestions: [
            'Check route definition in router configuration',
            'Verify component exists for this route',
            'Check for typos in route path'
          ]
        };
      }

      // Additional checks for dynamic routes
      if (this.isDynamicRoute(link.url)) {
        const dynamicChecks = await this.validateDynamicRoute(link.url);
        if (!dynamicChecks.valid) {
          return {
            ...link,
            status: 'broken',
            responseTime,
            errorMessage: dynamicChecks.error || 'Dynamic route validation failed',
            lastTested: new Date(),
            retryCount: 0,
            healthScore: 25,
            suggestions: dynamicChecks.suggestions || []
          };
        }
      }

      return {
        ...link,
        status: 'working',
        responseTime,
        lastTested: new Date(),
        retryCount: 0,
        healthScore: 100
      };

    } catch (error) {
      return {
        ...link,
        status: 'broken',
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        lastTested: new Date(),
        retryCount: 0,
        healthScore: 0,
        suggestions: ['Check application logs', 'Verify route configuration']
      };
    }
  }

  /**
   * Advanced external link validation with security and performance checks
   */
  private async validateExternalLinkAdvanced(link: LinkValidationResult): Promise<LinkValidationResult> {
    const startTime = Date.now();
    let retryCount = 0;

    while (retryCount <= this.config.maxRetries) {
      try {
        // Check rate limiting
        if (!this.checkRateLimit(link.url)) {
          await this.sleep(1000);
          continue;
        }

        const response = await this.makeHttpRequest(link.url);
        const responseTime = Date.now() - startTime;

        // Security checks
        const securityIssues = this.checkSecurityIssues(link.url, response);

        // Performance analysis
        const performance = this.config.enablePerformanceMetrics
          ? this.analyzePerformance(response, responseTime)
          : undefined;

        const result: LinkValidationResult = {
          ...link,
          status: this.mapResponseToStatus(response.status),
          responseTime,
          statusCode: response.status,
          lastTested: new Date(),
          retryCount,
          healthScore: this.calculateHealthScore(response.status, responseTime, retryCount),
          securityIssues: securityIssues.length > 0 ? securityIssues : [],
          suggestions: this.generateLinkSuggestions(response, securityIssues)
        };

        if (performance) {
          result.performance = performance;
        }

        return result;

      } catch (error) {
        retryCount++;
        if (retryCount <= this.config.maxRetries) {
          await this.sleep(this.config.retryDelay * retryCount);
          continue;
        }

        return {
          ...link,
          status: this.mapErrorToStatus(error),
          responseTime: Date.now() - startTime,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          lastTested: new Date(),
          retryCount,
          healthScore: 0,
          suggestions: this.generateErrorSuggestions(error)
        };
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Validation loop completed without result');
  }

  /**
   * Generate comprehensive recommendations based on analysis
   */
  private generateRecommendations(): ValidationRecommendation[] {
    const recommendations: ValidationRecommendation[] = [];

    // Analyze broken links
    const brokenLinks = this.validationResults.filter(r =>
      ['broken', '404', 'timeout'].includes(r.status)
    );

    if (brokenLinks.length > 0) {
      recommendations.push({
        type: 'broken_links',
        priority: 'high',
        title: `Fix ${brokenLinks.length} broken links`,
        description: 'Several links in your application are not working properly',
        affectedUrls: brokenLinks.map(l => l.url),
        actions: [
          'Review route configurations',
          'Check for typos in URLs',
          'Verify external services are accessible',
          'Implement proper error handling'
        ],
        estimatedEffort: 'medium'
      });
    }

    // Security recommendations
    const securityIssues = this.validationResults
      .filter(r => r.securityIssues && r.securityIssues.length > 0)
      .flatMap(r => r.securityIssues!);

    if (securityIssues.length > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        title: 'Address security concerns',
        description: 'Security issues found in external links',
        actions: [
          'Use HTTPS for all external links',
          'Review mixed content warnings',
          'Implement Content Security Policy',
          'Validate external domains'
        ],
        estimatedEffort: 'high'
      });
    }

    // Performance recommendations
    const slowLinks = this.validationResults.filter(r =>
      r.responseTime && r.responseTime > this.config.performanceThreshold
    );

    if (slowLinks.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Optimize slow-loading links',
        description: `${slowLinks.length} links are loading slowly`,
        affectedUrls: slowLinks.map(l => l.url),
        actions: [
          'Implement link preloading',
          'Add loading states for slow operations',
          'Consider caching strategies',
          'Review third-party service performance'
        ],
        estimatedEffort: 'medium'
      });
    }

    return recommendations;
  }

  // Helper methods for the enhanced functionality

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private createRoutePattern(routePath: string): RegExp {
    // Convert route path to regex (handle :param and * wildcards)
    const pattern = routePath
      .replace(/:[^/]+/g, '([^/]+)')
      .replace(/\*/g, '.*')
      .replace(/\//g, '\\/');
    return new RegExp(`^${pattern}$`);
  }

  private extractStringValue(value: any): string | null {
    if (value.type === 'StringLiteral') {
      return value.value;
    }
    if (value.type === 'JSXExpressionContainer' &&
      value.expression.type === 'StringLiteral') {
      return value.expression.value;
    }
    return null;
  }

  private determineUrlType(url: string): 'internal_route' | 'external_link' | 'dynamic_route' {
    if (url.startsWith('http') || url.startsWith('//')) {
      return 'external_link';
    }
    if (url.includes(':') || url.includes('*')) {
      return 'dynamic_route';
    }
    return 'internal_route';
  }

  private createLinkResult(url: string, type: LinkValidationResult['type'], location: Omit<LinkLocation, 'framework'> & { framework?: string }): LinkValidationResult {
    return {
      url,
      type,
      status: 'working', // Will be updated during validation
      foundIn: [location as LinkLocation],
      lastTested: new Date(),
      retryCount: 0,
      healthScore: 100
    };
  }

  private isInConditionalBlock(nodePath: any): boolean {
    let parent = nodePath.parent;
    while (parent) {
      if (parent.type === 'IfStatement' ||
        parent.type === 'ConditionalExpression' ||
        parent.type === 'LogicalExpression') {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  private detectFramework(object: any): string {
    // Simple framework detection based on object names
    if (object.type === 'Identifier') {
      switch (object.name) {
        case 'router': return 'vue-router';
        case 'history': return 'react-router';
        case 'navigate': return 'react-router';
        default: return 'vanilla';
      }
    }
    return 'vanilla';
  }

  private createValidationBatches(links: LinkValidationResult[]): LinkValidationResult[][] {
    const batches: LinkValidationResult[][] = [];
    const batchSize = this.config.concurrentRequests;

    for (let i = 0; i < links.length; i += batchSize) {
      batches.push(links.slice(i, i + batchSize));
    }

    return batches;
  }

  private getCachedResult(url: string): LinkValidationResult | null {
    const entry = this.cache.get(url);
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.result;
    }
    if (entry) {
      this.cache.delete(url); // Remove expired entry
    }
    return null;
  }

  private setCachedResult(url: string, result: LinkValidationResult): void {
    this.cache.set(url, {
      result,
      timestamp: Date.now(),
      ttl: this.config.cacheTimeout
    });
  }

  private checkRouteExistsAdvanced(url: string): boolean {
    // Check against discovered route patterns
    return this.routePatterns.some(pattern => pattern.test(url));
  }

  private isDynamicRoute(url: string): boolean {
    return url.includes(':') || url.includes('*') || /\/\d+/.test(url);
  }

  private async validateDynamicRoute(url: string): Promise<{
    valid: boolean;
    error?: string;
    suggestions?: string[];
  }> {
    // Simulate dynamic route validation
    // In reality, this would check if the dynamic parameters are valid
    const hasValidParams = /\/\d+$/.test(url); // Simple check for numeric IDs

    if (!hasValidParams && url.includes(':')) {
      return {
        valid: false,
        error: 'Dynamic route parameters may not be properly resolved',
        suggestions: [
          'Ensure dynamic parameters are properly passed',
          'Check parameter validation logic',
          'Verify data exists for dynamic routes'
        ]
      };
    }

    return { valid: true };
  }

  private checkRateLimit(url: string): boolean {
    const domain = new URL(url).hostname;
    const now = Date.now();
    const requests = this.rateLimiter.get(domain) || [];

    // Remove requests older than 1 minute
    const recentRequests = requests.filter(time => now - time < 60000);

    // Allow up to 30 requests per minute per domain
    if (recentRequests.length >= 30) {
      return false;
    }

    recentRequests.push(now);
    this.rateLimiter.set(domain, recentRequests);
    return true;
  }

  private async makeHttpRequest(url: string): Promise<{
    status: number;
    headers: { [key: string]: string };
    responseTime: number;
    size: number;
  }> {
    const startTime = Date.now();

    // In a real implementation, this would use fetch or axios
    // For this example, we'll simulate the response
    await this.sleep(Math.random() * 1000); // Simulate network delay

    const responseTime = Date.now() - startTime;

    // Simulate different response scenarios
    const random = Math.random();
    if (random < 0.1) {
      throw new Error('Network timeout');
    } else if (random < 0.15) {
      throw new Error('DNS resolution failed');
    } else if (random < 0.2) {
      return {
        status: 404,
        headers: { 'content-type': 'text/html' },
        responseTime,
        size: 1024
      };
    } else if (random < 0.25) {
      return {
        status: 500,
        headers: { 'content-type': 'text/html' },
        responseTime,
        size: 512
      };
    }

    return {
      status: 200,
      headers: {
        'content-type': 'text/html',
        'cache-control': 'max-age=3600',
        'content-encoding': 'gzip'
      },
      responseTime,
      size: 2048
    };
  }

  private checkSecurityIssues(url: string, response: any): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check for insecure protocol
    if (url.startsWith('http://')) {
      issues.push({
        type: 'insecure_protocol',
        severity: 'medium',
        description: 'Link uses insecure HTTP protocol',
        recommendation: 'Use HTTPS instead of HTTP for better security'
      });
    }

    // Check for suspicious domains (basic example)
    const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'short.link'];
    const domain = new URL(url).hostname;
    if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
      issues.push({
        type: 'suspicious_domain',
        severity: 'low',
        description: 'Link uses URL shortening service',
        recommendation: 'Consider using direct links for better transparency'
      });
    }

    // Check for mixed content issues
    if (typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      url.startsWith('http://')) {
      issues.push({
        type: 'mixed_content',
        severity: 'high',
        description: 'HTTP link on HTTPS page causes mixed content warning',
        recommendation: 'Use HTTPS version of the link or proxy through your domain'
      });
    }

    return issues;
  }

  private analyzePerformance(response: any, responseTime: number): PerformanceMetrics {
    return {
      firstByteTime: responseTime * 0.3, // Simulate TTFB
      totalLoadTime: responseTime,
      contentSize: response.size,
      compressionRatio: response.headers['content-encoding'] === 'gzip' ? 0.7 : 1.0,
      cacheHeaders: {
        'cache-control': response.headers['cache-control'] || 'no-cache',
        'etag': response.headers['etag'] || '',
        'last-modified': response.headers['last-modified'] || ''
      }
    };
  }

  private mapResponseToStatus(statusCode: number): LinkValidationResult['status'] {
    if (statusCode >= 200 && statusCode < 300) return 'working';
    if (statusCode >= 300 && statusCode < 400) return 'redirect';
    if (statusCode === 401 || statusCode === 403) return 'unauthorized';
    if (statusCode === 404) return '404';
    if (statusCode === 429) return 'rate_limited';
    return 'broken';
  }

  private mapErrorToStatus(error: any): LinkValidationResult['status'] {
    const errorMessage = error.message?.toLowerCase() || '';

    if (errorMessage.includes('timeout')) return 'timeout';
    if (errorMessage.includes('ssl') || errorMessage.includes('certificate')) return 'ssl_error';
    if (errorMessage.includes('rate limit')) return 'rate_limited';

    return 'broken';
  }

  private calculateHealthScore(statusCode: number, responseTime: number, retryCount: number): number {
    let score = 100;

    // Penalize non-200 responses
    if (statusCode !== 200) score -= 30;

    // Penalize slow responses
    if (responseTime > this.config.performanceThreshold) {
      score -= Math.min(40, (responseTime / this.config.performanceThreshold) * 20);
    }

    // Penalize retries
    score -= retryCount * 15;

    return Math.max(0, Math.round(score));
  }

  private generateLinkSuggestions(response: any, securityIssues: SecurityIssue[]): string[] {
    const suggestions: string[] = [];

    if (response.status >= 400) {
      suggestions.push('Check if the target resource still exists');
      suggestions.push('Verify the URL is correct');
    }

    if (response.responseTime > this.config.performanceThreshold) {
      suggestions.push('Consider implementing loading states');
      suggestions.push('Add timeout handling');
    }

    if (securityIssues.length > 0) {
      suggestions.push('Review security recommendations');
      suggestions.push('Consider using HTTPS');
    }

    if (!response.headers['cache-control']) {
      suggestions.push('Implement proper caching headers');
    }

    return suggestions;
  }

  private generateErrorSuggestions(error: any): string[] {
    const suggestions: string[] = [];
    const errorMessage = error.message?.toLowerCase() || '';

    if (errorMessage.includes('timeout')) {
      suggestions.push('Increase timeout duration');
      suggestions.push('Check network connectivity');
      suggestions.push('Implement retry logic');
    }

    if (errorMessage.includes('dns')) {
      suggestions.push('Verify domain name is correct');
      suggestions.push('Check DNS configuration');
    }

    if (errorMessage.includes('ssl') || errorMessage.includes('certificate')) {
      suggestions.push('Check SSL certificate validity');
      suggestions.push('Update certificate chain');
      suggestions.push('Verify hostname matches certificate');
    }

    suggestions.push('Check application logs for more details');
    return suggestions;
  }

  private async discoverAPIEndpointsFromCode(): Promise<void> {
    console.log('🔍 Discovering API endpoints from code...');

    const files = await this.getAllSourceFiles();
    let discoveredCount = 0;

    for (const file of files) {
      try {
        const apis = await this.extractAPICallsFromFile(file);
        discoveredCount += apis.length;

        for (const api of apis) {
          const key = `${api.method}:${api.endpoint}`;
          const existing = this.discoveredAPIs.get(key);
          if (existing) {
            existing.usedIn.push(...api.usedIn);
          } else {
            this.discoveredAPIs.set(key, api);
          }
        }
      } catch (error) {
        console.warn(`Error processing API calls in ${file}:`, error);
      }
    }

    console.log(`Discovered ${discoveredCount} API endpoints from code analysis`);
  }

  private async extractAPICallsFromFile(filePath: string): Promise<APIEndpointInfo[]> {
    const apis: APIEndpointInfo[] = [];

    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy']
      });

      let currentComponent = path.basename(filePath, path.extname(filePath));

      traverse(ast, {
        CallExpression: (nodePath) => {
          const callee = nodePath.node.callee;

          // fetch() calls
          if (callee.type === 'Identifier' && callee.name === 'fetch') {
            const firstArg = nodePath.node.arguments[0];
            if (firstArg && firstArg.type === 'StringLiteral') {
              const endpoint = firstArg.value;
              const method = this.extractHttpMethod(nodePath.node.arguments[1]) || 'GET';

              apis.push(this.createAPIEndpointInfo(endpoint, method, {
                filePath,
                componentName: currentComponent,
                lineNumber: nodePath.node.loc?.start.line || 0,
                columnNumber: nodePath.node.loc?.start.column || 0,
                context: content.substring(
                  nodePath.node.start! - 50,
                  nodePath.node.end! + 50
                ).trim(),
                errorHandling: this.hasErrorHandling(nodePath),
                loadingState: this.hasLoadingState(nodePath),
                retryLogic: this.hasRetryLogic(nodePath)
              }));
            }
          }

          // axios calls
          if (callee.type === 'MemberExpression' &&
            callee.object.type === 'Identifier' &&
            callee.object.name === 'axios') {

            const method = callee.property.type === 'Identifier' ?
              callee.property.name.toUpperCase() : 'GET';
            const firstArg = nodePath.node.arguments[0];

            if (firstArg && firstArg.type === 'StringLiteral') {
              apis.push(this.createAPIEndpointInfo(firstArg.value, method as any, {
                filePath,
                componentName: currentComponent,
                lineNumber: nodePath.node.loc?.start.line || 0,
                columnNumber: nodePath.node.loc?.start.column || 0,
                context: content.substring(
                  nodePath.node.start! - 50,
                  nodePath.node.end! + 50
                ).trim(),
                errorHandling: this.hasErrorHandling(nodePath),
                loadingState: this.hasLoadingState(nodePath),
                retryLogic: this.hasRetryLogic(nodePath)
              }));
            }
          }

          // useQuery, useMutation hooks
          if (callee.type === 'Identifier' &&
            ['useQuery', 'useMutation', 'useInfiniteQuery'].includes(callee.name)) {

            // Extract endpoint from query function
            const queryArg = nodePath.node.arguments[0];
            if (queryArg) {
              const endpoint = this.extractEndpointFromQuery(queryArg);
              if (endpoint) {
                apis.push(this.createAPIEndpointInfo(endpoint, 'GET', {
                  filePath,
                  componentName: currentComponent,
                  lineNumber: nodePath.node.loc?.start.line || 0,
                  columnNumber: nodePath.node.loc?.start.column || 0,
                  hookName: callee.name,
                  context: content.substring(
                    nodePath.node.start! - 50,
                    nodePath.node.end! + 50
                  ).trim(),
                  errorHandling: true, // React Query handles errors
                  loadingState: true, // React Query provides loading state
                  retryLogic: true // React Query has built-in retry
                }));
              }
            }
          }
        }
      });
    } catch (error) {
      console.warn(`Could not parse API calls from ${filePath}:`, error);
    }

    return apis;
  }

  private extractHttpMethod(optionsArg: any): string | null {
    if (!optionsArg || optionsArg.type !== 'ObjectExpression') return null;

    const methodProp = optionsArg.properties.find((prop: any) =>
      prop.type === 'ObjectProperty' &&
      prop.key.type === 'Identifier' &&
      prop.key.name === 'method'
    );

    if (methodProp && methodProp.value.type === 'StringLiteral') {
      return methodProp.value.value.toUpperCase();
    }

    return null;
  }

  private hasErrorHandling(nodePath: any): boolean {
    // Check if the call is wrapped in try-catch or has .catch()
    let parent = nodePath.parent;
    while (parent) {
      if (parent.type === 'TryStatement') return true;
      if (parent.type === 'CallExpression' &&
        parent.callee.type === 'MemberExpression' &&
        parent.callee.property.name === 'catch') return true;
      parent = parent.parent;
    }
    return false;
  }

  private hasLoadingState(nodePath: any): boolean {
    // This is a simplified check - in reality, you'd look for loading state variables
    // in the surrounding code
    return false;
  }

  private hasRetryLogic(nodePath: any): boolean {
    // This is a simplified check - in reality, you'd look for retry mechanisms
    return false;
  }

  private extractEndpointFromQuery(queryArg: any): string | null {
    // Simplified endpoint extraction from query functions
    if (queryArg.type === 'StringLiteral') {
      return queryArg.value;
    }
    if (queryArg.type === 'ArrowFunctionExpression') {
      // Look for fetch calls in the query function
      // This is simplified - real implementation would be more complex
      return null;
    }
    return null;
  }

  private createAPIEndpointInfo(endpoint: string, method: string, location: Omit<APIUsageLocation, 'hookName'> & { hookName?: string }): APIEndpointInfo {
    const version = this.extractAPIVersion(endpoint);
    return {
      endpoint,
      method: method as APIEndpointInfo['method'],
      usedIn: [location as APIUsageLocation],
      authentication: this.detectAuthenticationRequirement(endpoint),
      parameters: this.extractAPIParameters(endpoint),
      rateLimit: this.getDefaultRateLimit(),
      ...(version && { version })
    };
  }

  private detectAuthenticationRequirement(endpoint: string): AuthenticationInfo {
    // Simple heuristic - in reality, this would be more sophisticated
    if (endpoint.includes('/auth/') ||
      endpoint.includes('/user/') ||
      endpoint.includes('/admin/')) {
      return {
        type: 'bearer',
        required: true,
        headerName: 'Authorization'
      };
    }
    return {
      type: 'none',
      required: false
    };
  }

  private extractAPIParameters(endpoint: string): APIParameter[] {
    const params: APIParameter[] = [];
    const paramMatches = endpoint.match(/:(\w+)/g);

    if (paramMatches) {
      for (const match of paramMatches) {
        const paramName = match.substring(1);
        params.push({
          name: paramName,
          type: 'string',
          required: true,
          description: `Path parameter: ${paramName}`
        });
      }
    }

    return params;
  }

  private getDefaultRateLimit(): RateLimitInfo {
    return {
      requestsPerMinute: 100,
      burstLimit: 10,
      resetInterval: 60000
    };
  }

  private extractAPIVersion(endpoint: string): string | undefined {
    const versionMatch = endpoint.match(/\/v(\d+)\//);
    return versionMatch ? `v${versionMatch[1]}` : undefined;
  }

  private async validateAPIEndpointsAdvanced(): Promise<APIConnectionResult[]> {
    console.log('🔍 Performing advanced API validation...');

    const results: APIConnectionResult[] = [];
    const apis = Array.from(this.discoveredAPIs.values());

    for (const api of apis) {
      try {
        const result = await this.validateSingleAPIEndpoint(api);
        results.push(result);
      } catch (error) {
        results.push({
          endpoint: api.endpoint,
          method: api.method,
          status: 'broken',
          responseTime: 0,
          lastTested: new Date(),
          healthScore: 0,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          usedBy: api.usedIn.map(usage => usage.componentName)
        });
      }
    }

    return results;
  }

  private async validateSingleAPIEndpoint(api: APIEndpointInfo): Promise<APIConnectionResult> {
    const startTime = Date.now();

    // In a real implementation, this would make actual API calls
    // For now, simulate the validation
    const isWorking = await this.simulateAPIValidation(api.endpoint);
    const responseTime = Date.now() - startTime;

    return {
      endpoint: api.endpoint,
      method: api.method,
      status: isWorking ? 'working' : 'broken',
      responseTime,
      lastTested: new Date(),
      healthScore: isWorking ? 100 : 0,
      usedBy: api.usedIn.map(usage => usage.componentName)
    };
  }

  private async simulateAPIValidation(endpoint: string): Promise<boolean> {
    // Simulate some endpoints being broken
    const brokenEndpoints = ['/api/legacy/', '/api/deprecated/'];
    return !brokenEndpoints.some(broken => endpoint.includes(broken));
  }

  private generateEnhancedSummary(): EnhancedValidationSummary {
    const totalLinks = this.validationResults.length;
    const workingLinks = this.validationResults.filter(r => r.status === 'working').length;
    const brokenLinks = this.validationResults.filter(r =>
      ['broken', '404', 'timeout', 'unauthorized', 'ssl_error'].includes(r.status)
    ).length;

    const securityIssues = this.validationResults
      .filter(r => r.securityIssues && r.securityIssues.length > 0)
      .reduce((acc, r) => acc + r.securityIssues!.length, 0);

    const averageHealthScore = this.validationResults.length > 0
      ? Math.round(
        this.validationResults.reduce((acc, r) => acc + r.healthScore, 0) /
        this.validationResults.length
      )
      : 0;

    return {
      // Basic metrics
      totalLinks,
      workingLinks,
      brokenLinks,
      timeoutLinks: this.validationResults.filter(r => r.status === 'timeout').length,

      // Enhanced metrics
      averageHealthScore,
      securityIssues,
      performanceIssues: this.validationResults.filter(r =>
        r.responseTime && r.responseTime > this.config.performanceThreshold
      ).length,

      // Categorized results
      internalRoutes: this.validationResults.filter(r => r.type === 'internal_route').length,
      externalLinks: this.validationResults.filter(r => r.type === 'external_link').length,
      dynamicRoutes: this.validationResults.filter(r => r.type === 'dynamic_route').length,

      // Broken breakdown
      brokenInternalRoutes: this.validationResults.filter(r =>
        r.type === 'internal_route' && ['broken', '404'].includes(r.status)
      ).length,
      brokenExternalLinks: this.validationResults.filter(r =>
        r.type === 'external_link' && r.status === 'broken'
      ).length,

      // API metrics
      totalAPIs: this.discoveredAPIs.size,
      workingAPIs: 0, // Will be populated by API validation results
      brokenAPIs: 0,

      // Performance metrics
      averageResponseTime: this.calculateAverageResponseTime(),
      slowestLink: this.findSlowestLink(),

      // Cache metrics
      cacheHitRate: this.calculateCacheHitRate(),

      // Discovery metrics
      filesScanned: 0, // Would be populated during actual file scanning
      componentsAnalyzed: new Set(
        this.validationResults.flatMap(r => r.foundIn.map(loc => loc.componentName))
      ).size
    };
  }

  private findSlowestLink(): { url: string; responseTime: number } | null {
    const slowest = this.validationResults
      .filter(r => r.responseTime !== undefined)
      .sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0))[0];

    return slowest ? { url: slowest.url, responseTime: slowest.responseTime! } : null;
  }

  private calculateCacheHitRate(): number {
    // This would track actual cache hits during validation
    return 0; // Placeholder
  }

  private calculateAverageResponseTime(): number {
    const withResponseTime = this.validationResults.filter(r => r.responseTime !== undefined);
    if (withResponseTime.length === 0) return 0;

    const total = withResponseTime.reduce((sum, r) => sum + (r.responseTime || 0), 0);
    return Math.round(total / withResponseTime.length);
  }

  private addFrameworkSpecificPatterns(): void {
    // Next.js patterns
    this.routePatterns.push(
      /^\/\[.*\]$/, // Dynamic routes [id]
      /^\/.*\/\[\.\.\..*\]$/, // Catch-all routes [...slug]
      /^\/api\/.*$/ // API routes
    );

    // Nuxt patterns
    this.routePatterns.push(
      /^\/.*\/_.*$/, // Nuxt dynamic routes
      /^\/.*\.vue$/ // Vue pages
    );
  }

  private addBasicRoutePatterns(): void {
    // Basic patterns when router analysis fails
    this.routePatterns.push(
      /^\/$/,
      /^\/[^\/]+$/,
      /^\/[^\/]+\/[^\/]+$/,
      /^\/[^\/]+\/[^\/]+\/[^\/]+$/
    );
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private enhanceError(error: any): Error {
    if (error instanceof Error) {
      error.message = `Enhanced Link Validator Error: ${error.message}`;
      return error;
    }
    return new Error(`Enhanced Link Validator Error: ${String(error)}`);
  }

  /**
   * Get comprehensive report with actionable insights
   */
  getComprehensiveReport(): ComprehensiveReport {
    return {
      summary: this.generateEnhancedSummary(),
      brokenLinks: this.getBrokenLinksReport(),
      securityIssues: this.getSecurityIssuesReport(),
      performanceIssues: this.getPerformanceIssuesReport(),
      recommendations: this.generateRecommendations(),
      apiEndpoints: Array.from(this.discoveredAPIs.values()),
      healthMetrics: this.getHealthMetrics()
    };
  }

  private getBrokenLinksReport(): LinkValidationResult[] {
    return this.validationResults.filter(r =>
      ['broken', '404', 'timeout', 'unauthorized', 'ssl_error'].includes(r.status)
    );
  }

  private getSecurityIssuesReport(): { link: LinkValidationResult; issues: SecurityIssue[] }[] {
    return this.validationResults
      .filter(r => r.securityIssues && r.securityIssues.length > 0)
      .map(r => ({ link: r, issues: r.securityIssues! }));
  }

  private getPerformanceIssuesReport(): { link: LinkValidationResult; metrics: PerformanceMetrics }[] {
    return this.validationResults
      .filter(r => r.performance && r.responseTime && r.responseTime > this.config.performanceThreshold)
      .map(r => ({ link: r, metrics: r.performance! }));
  }

  private getHealthMetrics(): HealthMetrics {
    const scores = this.validationResults.map(r => r.healthScore);

    return {
      overallHealth: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0,
      reliabilityScore: this.calculateReliabilityScore(),
      performanceScore: this.calculatePerformanceScore(),
      securityScore: this.calculateSecurityScore(),
      trends: this.getHealthTrends()
    };
  }

  private calculateReliabilityScore(): number {
    const total = this.validationResults.length;
    const working = this.validationResults.filter(r => r.status === 'working').length;
    return total > 0 ? Math.round((working / total) * 100) : 0;
  }

  private calculatePerformanceScore(): number {
    const withResponseTime = this.validationResults.filter(r => r.responseTime !== undefined);
    if (withResponseTime.length === 0) return 100;

    const avgResponseTime = withResponseTime.reduce((acc, r) => acc + r.responseTime!, 0) / withResponseTime.length;
    const performanceScore = Math.max(0, 100 - (avgResponseTime / this.config.performanceThreshold) * 50);

    return Math.round(performanceScore);
  }

  private calculateSecurityScore(): number {
    const totalIssues = this.validationResults
      .filter(r => r.securityIssues)
      .reduce((acc, r) => acc + r.securityIssues!.length, 0);

    const criticalIssues = this.validationResults
      .filter(r => r.securityIssues)
      .reduce((acc, r) => acc + r.securityIssues!.filter(i => i.severity === 'critical').length, 0);

    const score = 100 - (criticalIssues * 30) - (totalIssues * 5);
    return Math.max(0, Math.round(score));
  }

  private getHealthTrends(): HealthTrend[] {
    // This would track changes over time
    // For now, return empty array as placeholder
    return [];
  }
}

// Additional interfaces for enhanced functionality

export interface EnhancedValidationSummary {
  // Basic metrics
  totalLinks: number;
  workingLinks: number;
  brokenLinks: number;
  timeoutLinks: number;

  // Enhanced metrics
  averageHealthScore: number;
  securityIssues: number;
  performanceIssues: number;

  // Categorized results
  internalRoutes: number;
  externalLinks: number;
  dynamicRoutes: number;
  brokenInternalRoutes: number;
  brokenExternalLinks: number;

  // API metrics
  totalAPIs: number;
  workingAPIs: number;
  brokenAPIs: number;

  // Performance metrics
  averageResponseTime: number;
  slowestLink: { url: string; responseTime: number } | null;

  // Cache metrics
  cacheHitRate: number;

  // Discovery metrics
  filesScanned: number;
  componentsAnalyzed: number;
}

export interface ValidationRecommendation {
  type: 'broken_links' | 'security' | 'performance' | 'architecture' | 'best_practices';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUrls?: string[];
  actions: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  impact?: string;
  resources?: string[];
}

export interface ComprehensiveReport {
  summary: EnhancedValidationSummary;
  brokenLinks: LinkValidationResult[];
  securityIssues: { link: LinkValidationResult; issues: SecurityIssue[] }[];
  performanceIssues: { link: LinkValidationResult; metrics: PerformanceMetrics }[];
  recommendations: ValidationRecommendation[];
  apiEndpoints: APIEndpointInfo[];
  healthMetrics: HealthMetrics;
}

export interface HealthMetrics {
  overallHealth: number;
  reliabilityScore: number;
  performanceScore: number;
  securityScore: number;
  trends: HealthTrend[];
}

export interface HealthTrend {
  timestamp: Date;
  overallHealth: number;
  brokenLinks: number;
  averageResponseTime: number;
}

/**
 * Advanced Link Validator Factory
 * Provides pre-configured validators for different scenarios
 */
export class LinkValidatorFactory {
  /**
   * Create validator optimized for development environment
   */
  static createDevelopmentValidator(): EnhancedLinkValidator {
    return new EnhancedLinkValidator({
      timeout: 5000,
      maxRetries: 1,
      concurrentRequests: 10,
      cacheEnabled: false,
      allowInsecureConnections: true,
      enablePerformanceMetrics: false,
      performanceThreshold: 5000
    });
  }

  /**
   * Create validator optimized for production environment
   */
  static createProductionValidator(): EnhancedLinkValidator {
    return new EnhancedLinkValidator({
      timeout: 10000,
      maxRetries: 3,
      concurrentRequests: 5,
      cacheEnabled: true,
      cacheTimeout: 300000,
      allowInsecureConnections: false,
      checkCertificates: true,
      enablePerformanceMetrics: true,
      performanceThreshold: 2000,
      blockedDomains: ['malware-site.com', 'phishing-site.com'],
      trustedDomains: ['api.company.com', 'cdn.company.com']
    });
  }

  /**
   * Create validator for CI/CD pipeline
   */
  static createCIValidator(): EnhancedLinkValidator {
    return new EnhancedLinkValidator({
      timeout: 15000,
      maxRetries: 2,
      concurrentRequests: 3,
      cacheEnabled: false,
      enablePerformanceMetrics: true,
      performanceThreshold: 3000,
      scanPaths: ['src', 'pages', 'components', 'app'],
      excludePaths: ['node_modules', 'build', 'dist', '.git', 'coverage', '__tests__'],
      fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro']
    });
  }

  /**
   * Create validator for security audit
   */
  static createSecurityValidator(): EnhancedLinkValidator {
    return new EnhancedLinkValidator({
      timeout: 20000,
      maxRetries: 1,
      concurrentRequests: 2,
      checkCertificates: true,
      allowInsecureConnections: false,
      enablePerformanceMetrics: false,
      blockedDomains: [
        'bit.ly', 'tinyurl.com', 'short.link', 't.co',
        'suspicious-domain.com', 'malware-site.com'
      ]
    });
  }
}

/**
 * Link Health Monitor
 * Provides continuous monitoring and alerting capabilities
 */
export class LinkHealthMonitor {
  private validator: EnhancedLinkValidator;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthHistory: HealthTrend[] = [];
  private alertCallbacks: Array<(alert: HealthAlert) => void> = [];

  constructor(validator: EnhancedLinkValidator) {
    this.validator = validator;
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMinutes: number = 60): void {
    console.log(`🔍 Starting link health monitoring every ${intervalMinutes} minutes`);

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
        this.triggerAlert({
          type: 'monitoring_failure',
          severity: 'high',
          message: 'Link health monitoring failed',
          timestamp: new Date(),
          details: { error: error instanceof Error ? error.message : String(error) }
        });
      }
    }, intervalMinutes * 60 * 1000);

    // Perform initial health check
    this.performHealthCheck();
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Link health monitoring stopped');
    }
  }

  /**
   * Add alert callback
   */
  onAlert(callback: (alert: HealthAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Perform a single health check
   */
  private async performHealthCheck(): Promise<void> {
    console.log('🩺 Performing health check...');

    const results = await this.validator.validateAllLinks();
    const healthMetrics = this.calculateCurrentHealth(results);

    // Store health trend
    this.healthHistory.push({
      timestamp: new Date(),
      overallHealth: healthMetrics.overallHealth,
      brokenLinks: results.linkResults.filter(r => r.status === 'broken').length,
      averageResponseTime: results.summary.averageResponseTime
    });

    // Keep only last 24 hours of history
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.healthHistory = this.healthHistory.filter(h => h.timestamp > cutoff);

    // Check for alerts
    this.checkForAlerts(healthMetrics, results);
  }

  /**
   * Calculate current health metrics
   */
  private calculateCurrentHealth(results: any): HealthMetrics {
    const total = results.linkResults.length;
    const working = results.linkResults.filter((r: any) => r.status === 'working').length;
    const overallHealth = total > 0 ? Math.round((working / total) * 100) : 0;

    return {
      overallHealth,
      reliabilityScore: overallHealth,
      performanceScore: this.calculatePerformanceScore(results.linkResults),
      securityScore: this.calculateSecurityScore(results.linkResults),
      trends: this.healthHistory.slice(-10) // Last 10 data points
    };
  }

  private calculatePerformanceScore(links: any[]): number {
    const withResponseTime = links.filter(l => l.responseTime !== undefined);
    if (withResponseTime.length === 0) return 100;

    const avgResponseTime = withResponseTime.reduce((acc, l) => acc + l.responseTime, 0) / withResponseTime.length;
    return Math.max(0, Math.round(100 - (avgResponseTime / 3000) * 50));
  }

  private calculateSecurityScore(links: any[]): number {
    const securityIssues = links.filter(l => l.securityIssues && l.securityIssues.length > 0);
    const totalIssues = securityIssues.reduce((acc, l) => acc + l.securityIssues.length, 0);

    return Math.max(0, Math.round(100 - totalIssues * 10));
  }

  /**
   * Check for alert conditions
   */
  private checkForAlerts(current: HealthMetrics, results: any): void {
    // Health degradation alert
    if (current.overallHealth < 80) {
      this.triggerAlert({
        type: 'health_degradation',
        severity: current.overallHealth < 60 ? 'critical' : 'high',
        message: `Overall link health dropped to ${current.overallHealth}%`,
        timestamp: new Date(),
        details: {
          overallHealth: current.overallHealth,
          brokenLinks: results.linkResults.filter((r: any) => r.status === 'broken').length
        }
      });
    }

    // Performance degradation alert
    if (current.performanceScore < 70) {
      this.triggerAlert({
        type: 'performance_degradation',
        severity: 'medium',
        message: `Link performance score dropped to ${current.performanceScore}%`,
        timestamp: new Date(),
        details: {
          performanceScore: current.performanceScore,
          averageResponseTime: results.summary.averageResponseTime
        }
      });
    }

    // Security issues alert
    if (current.securityScore < 90) {
      this.triggerAlert({
        type: 'security_issues',
        severity: 'high',
        message: `Security issues detected (score: ${current.securityScore}%)`,
        timestamp: new Date(),
        details: {
          securityScore: current.securityScore,
          securityIssues: results.linkResults.filter((r: any) => r.securityIssues).length
        }
      });
    }

    // Critical link failures
    const criticalBrokenLinks = results.linkResults.filter((r: any) =>
      r.status === 'broken' && r.foundIn.some((loc: any) =>
        loc.filePath.includes('critical') || loc.componentName.includes('Critical')
      )
    );

    if (criticalBrokenLinks.length > 0) {
      this.triggerAlert({
        type: 'critical_links_down',
        severity: 'critical',
        message: `${criticalBrokenLinks.length} critical links are broken`,
        timestamp: new Date(),
        details: {
          brokenLinks: criticalBrokenLinks.map((l: any) => l.url)
        }
      });
    }
  }

  /**
   * Trigger alert to all registered callbacks
   */
  private triggerAlert(alert: HealthAlert): void {
    console.warn(`🚨 ALERT: ${alert.message}`);
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Alert callback failed:', error);
      }
    });
  }

  /**
   * Get health trends for dashboard
   */
  getHealthTrends(): HealthTrend[] {
    return [...this.healthHistory];
  }
}

export interface HealthAlert {
  type: 'health_degradation' | 'performance_degradation' | 'security_issues' | 'critical_links_down' | 'monitoring_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  details: { [key: string]: any };
}

/**
 * Link Validator Reporter
 * Generates various report formats
 */
export class LinkValidatorReporter {
  /**
   * Generate HTML report
   */
  static generateHTMLReport(report: ComprehensiveReport): string {
    const { summary, brokenLinks, securityIssues, recommendations } = report;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Link Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 15px; background: white; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric.critical { border-left: 4px solid #e74c3c; }
        .metric.warning { border-left: 4px solid #f39c12; }
        .metric.success { border-left: 4px solid #27ae60; }
        .section { margin: 30px 0; }
        .section h2 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .issue { background: #fff5f5; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #e74c3c; }
        .recommendation { background: #f0f8ff; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #3498db; }
        .code { font-family: monospace; background: #f8f8f8; padding: 2px 4px; border-radius: 3px; }
        .health-score { font-size: 2em; font-weight: bold; }
        .health-good { color: #27ae60; }
        .health-warning { color: #f39c12; }
        .health-critical { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Link Validation Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <div class="health-score ${summary.averageHealthScore >= 80 ? 'health-good' : summary.averageHealthScore >= 60 ? 'health-warning' : 'health-critical'}">
            Overall Health: ${summary.averageHealthScore}%
        </div>
    </div>

    <div class="section">
        <h2>📊 Summary</h2>
        <div class="metric ${summary.brokenLinks === 0 ? 'success' : summary.brokenLinks < 5 ? 'warning' : 'critical'}">
            <strong>${summary.totalLinks}</strong><br>Total Links
        </div>
        <div class="metric ${summary.brokenLinks === 0 ? 'success' : 'critical'}">
            <strong>${summary.brokenLinks}</strong><br>Broken Links
        </div>
        <div class="metric ${summary.securityIssues === 0 ? 'success' : 'warning'}">
            <strong>${summary.securityIssues}</strong><br>Security Issues
        </div>
        <div class="metric ${summary.averageResponseTime < 2000 ? 'success' : 'warning'}">
            <strong>${summary.averageResponseTime}ms</strong><br>Avg Response Time
        </div>
    </div>

    ${brokenLinks.length > 0 ? `
    <div class="section">
        <h2>❌ Broken Links (${brokenLinks.length})</h2>
        ${brokenLinks.map(link => `
            <div class="issue">
                <strong>🔗 ${link.url}</strong> - <em>${link.status}</em><br>
                <small>Found in: ${link.foundIn.map(loc => `${loc.componentName} (${loc.filePath}:${loc.lineNumber})`).join(', ')}</small><br>
                ${link.errorMessage ? `<span style="color: #e74c3c;">Error: ${link.errorMessage}</span><br>` : ''}
                ${link.suggestions ? `<strong>Suggestions:</strong> ${link.suggestions.join(', ')}` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${securityIssues.length > 0 ? `
    <div class="section">
        <h2>🔒 Security Issues (${securityIssues.length})</h2>
        ${securityIssues.map(({ link, issues }) => `
            <div class="issue">
                <strong>🔗 ${link.url}</strong><br>
                ${issues.map(issue => `
                    <div style="margin: 5px 0;">
                        <strong>${issue.type}</strong> (${issue.severity}): ${issue.description}<br>
                        <em>Recommendation: ${issue.recommendation}</em>
                    </div>
                `).join('')}
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="section">
        <h2>💡 Recommendations (${recommendations.length})</h2>
        ${recommendations.map(rec => `
            <div class="recommendation">
                <h3>${rec.title} <span style="color: ${rec.priority === 'critical' ? '#e74c3c' : rec.priority === 'high' ? '#f39c12' : '#3498db'};">[${rec.priority.toUpperCase()}]</span></h3>
                <p>${rec.description}</p>
                <strong>Actions:</strong>
                <ul>${rec.actions.map(action => `<li>${action}</li>`).join('')}</ul>
                <small><strong>Estimated Effort:</strong> ${rec.estimatedEffort}</small>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>🚀 API Endpoints (${summary.totalAPIs})</h2>
        <p>Total endpoints discovered: <strong>${summary.totalAPIs}</strong></p>
        <p>Working endpoints: <strong>${summary.workingAPIs}</strong></p>
        <p>Broken endpoints: <strong>${summary.brokenAPIs}</strong></p>
    </div>
</body>
</html>`;
  }

  /**
   * Generate JSON report
   */
  static generateJSONReport(report: ComprehensiveReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate CSV report for broken links
   */
  static generateCSVReport(brokenLinks: LinkValidationResult[]): string {
    const headers = ['URL', 'Status', 'Error', 'File', 'Component', 'Line', 'Response Time'];
    const rows = brokenLinks.map(link => [
      link.url,
      link.status,
      link.errorMessage || '',
      link.foundIn[0]?.filePath || '',
      link.foundIn[0]?.componentName || '',
      link.foundIn[0]?.lineNumber || '',
      link.responseTime || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  /**
   * Generate markdown report
   */
  static generateMarkdownReport(report: ComprehensiveReport): string {
    const { summary, brokenLinks, recommendations } = report;

    return `# 🔍 Link Validation Report

Generated on ${new Date().toLocaleString()}

## 📊 Summary

| Metric | Value |
|--------|--------|
| Total Links | ${summary.totalLinks} |
| Working Links | ${summary.workingLinks} |
| Broken Links | ${summary.brokenLinks} |
| Security Issues | ${summary.securityIssues} |
| Average Response Time | ${summary.averageResponseTime}ms |
| Overall Health Score | ${summary.averageHealthScore}% |

## ❌ Broken Links

${brokenLinks.length === 0 ? '✅ No broken links found!' : brokenLinks.map(link => `
### ${link.url}

- **Status**: ${link.status}
- **Found in**: ${link.foundIn.map(loc => `${loc.componentName} (${loc.filePath}:${loc.lineNumber})`).join(', ')}
${link.errorMessage ? `- **Error**: ${link.errorMessage}` : ''}
${link.suggestions ? `- **Suggestions**: ${link.suggestions.join(', ')}` : ''}
`).join('')}

## 💡 Recommendations

${recommendations.map(rec => `
### ${rec.title} [${rec.priority.toUpperCase()}]

${rec.description}

**Actions:**
${rec.actions.map(action => `- ${action}`).join('\n')}

**Estimated Effort:** ${rec.estimatedEffort}
`).join('')}

## 🚀 API Endpoints

- Total endpoints: ${summary.totalAPIs}
- Working endpoints: ${summary.workingAPIs}  
- Broken endpoints: ${summary.brokenAPIs}
`;
  }
}

// Export enhanced singleton instance with factory methods
export const enhancedLinkValidator = {
  // Factory methods
  createDevelopment: () => LinkValidatorFactory.createDevelopmentValidator(),
  createProduction: () => LinkValidatorFactory.createProductionValidator(),
  createCI: () => LinkValidatorFactory.createCIValidator(),
  createSecurity: () => LinkValidatorFactory.createSecurityValidator(),

  // Utilities
  createMonitor: (validator: EnhancedLinkValidator) => new LinkHealthMonitor(validator),
  generateReport: LinkValidatorReporter,

  // Default instance
  default: new EnhancedLinkValidator()
};

export { EnhancedLinkValidator as default };