/**
 * UI Audit System Configuration
 * 
 * Centralized configuration for the audit system with environment-specific settings
 */

export interface AuditConfig {
  // Scanning Configuration
  componentDirectories: string[];
  excludePatterns: string[];
  includeTestFiles: boolean;
  scanDepth: 'shallow' | 'deep' | 'exhaustive';
  
  // API Testing Configuration
  apiTimeout: number;
  maxRetries: number;
  parallelRequests: number;
  baseURL?: string;
  
  // Route Validation Configuration
  routeTimeout: number;
  validateExternalLinks: boolean;
  followRedirects: boolean;
  
  // Performance Configuration
  enableCaching: boolean;
  cacheTimeout: number; // minutes
  maxConcurrentScans: number;
  
  // Reporting Configuration
  outputFormats: ('json' | 'markdown' | 'html' | 'csv')[];
  reportDirectory: string;
  includeScreenshots: boolean;
  
  // Priority Weights
  priorityWeights: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  
  // Custom Rules
  customRules: CustomAuditRule[];
  
  // Integration Settings
  integrations: {
    slack?: SlackIntegration;
    github?: GitHubIntegration;
    jira?: JiraIntegration;
  };
}

export interface CustomAuditRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  pattern: string | RegExp;
  check: (element: any) => Promise<boolean>;
  suggestion: string;
}

export interface SlackIntegration {
  webhookUrl: string;
  channel: string;
  notifyOnCritical: boolean;
  notifyOnCompletion: boolean;
}

export interface GitHubIntegration {
  token: string;
  repository: string;
  createIssues: boolean;
  labelPrefix: string;
}

export interface JiraIntegration {
  baseUrl: string;
  username: string;
  apiToken: string;
  projectKey: string;
  issueType: string;
}

/**
 * Default configuration
 */
export const defaultAuditConfig: AuditConfig = {
  // Scanning Configuration
  componentDirectories: [
    'src/auth/components',
    'src/property/components',
    'src/user/components',
    'src/trust/components',
    'src/search/components',
    'src/communication/components',
    'src/analytics/components',
    'src/land-verification/components',
    'src/shared/components'
  ],
  excludePatterns: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/__tests__/**',
    '**/*.stories.{ts,tsx,js,jsx}'
  ],
  includeTestFiles: false,
  scanDepth: 'deep',
  
  // API Testing Configuration
  apiTimeout: 5000,
  maxRetries: 3,
  parallelRequests: 4,
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-api.com' 
    : 'http://localhost:3000',
  
  // Route Validation Configuration
  routeTimeout: 3000,
  validateExternalLinks: true,
  followRedirects: true,
  
  // Performance Configuration
  enableCaching: true,
  cacheTimeout: 30,
  maxConcurrentScans: 6,
  
  // Reporting Configuration
  outputFormats: ['json', 'markdown'],
  reportDirectory: 'reports/audit',
  includeScreenshots: false,
  
  // Priority Weights
  priorityWeights: {
    critical: 10,
    high: 5,
    medium: 2,
    low: 1
  },
  
  // Custom Rules
  customRules: [
    {
      id: 'missing-aria-labels',
      name: 'Missing ARIA Labels',
      description: 'Interactive elements should have proper ARIA labels',
      category: 'accessibility',
      severity: 'medium',
      pattern: /button|input|select|textarea/i,
      check: async (element) => {
        return element.props['aria-label'] || element.props['aria-labelledby'];
      },
      suggestion: 'Add aria-label or aria-labelledby attributes to improve accessibility'
    },
    {
      id: 'missing-error-boundaries',
      name: 'Missing Error Boundaries',
      description: 'Components should be wrapped in error boundaries',
      category: 'error-handling',
      severity: 'high',
      pattern: /Page|Layout|Route/i,
      check: async (element) => {
        return element.parentComponents?.some((parent: string) => 
          parent.includes('ErrorBoundary')
        );
      },
      suggestion: 'Wrap components in error boundaries to handle runtime errors gracefully'
    }
  ],
  
  // Integration Settings
  integrations: {}
};

/**
 * Environment-specific configurations
 */
export const developmentConfig: Partial<AuditConfig> = {
  apiTimeout: 10000,
  includeTestFiles: true,
  scanDepth: 'exhaustive',
  enableCaching: false,
  outputFormats: ['json', 'markdown'],
  includeScreenshots: true
};

export const productionConfig: Partial<AuditConfig> = {
  apiTimeout: 3000,
  includeTestFiles: false,
  scanDepth: 'deep',
  enableCaching: true,
  outputFormats: ['json'],
  includeScreenshots: false,
  maxConcurrentScans: 3
};

export const ciConfig: Partial<AuditConfig> = {
  apiTimeout: 5000,
  includeTestFiles: false,
  scanDepth: 'shallow',
  enableCaching: false,
  outputFormats: ['json'],
  includeScreenshots: false,
  maxConcurrentScans: 2
};

/**
 * Get configuration for current environment
 */
export function getAuditConfig(): AuditConfig {
  const env = process.env.NODE_ENV || 'development';
  
  let envConfig: Partial<AuditConfig> = {};
  
  switch (env) {
    case 'production':
      envConfig = productionConfig;
      break;
    case 'test':
    case 'ci':
      envConfig = ciConfig;
      break;
    case 'development':
    default:
      envConfig = developmentConfig;
      break;
  }
  
  return {
    ...defaultAuditConfig,
    ...envConfig
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: AuditConfig): string[] {
  const errors: string[] = [];
  
  if (config.componentDirectories.length === 0) {
    errors.push('At least one component directory must be specified');
  }
  
  if (config.apiTimeout < 1000) {
    errors.push('API timeout should be at least 1000ms');
  }
  
  if (config.maxRetries < 0 || config.maxRetries > 10) {
    errors.push('Max retries should be between 0 and 10');
  }
  
  if (config.parallelRequests < 1 || config.parallelRequests > 20) {
    errors.push('Parallel requests should be between 1 and 20');
  }
  
  if (config.cacheTimeout < 1) {
    errors.push('Cache timeout should be at least 1 minute');
  }
  
  return errors;
}

/**
 * Merge user configuration with defaults
 */
export function mergeConfig(userConfig: Partial<AuditConfig>): AuditConfig {
  const baseConfig = getAuditConfig();
  
  return {
    ...baseConfig,
    ...userConfig,
    priorityWeights: {
      ...baseConfig.priorityWeights,
      ...userConfig.priorityWeights
    },
    integrations: {
      ...baseConfig.integrations,
      ...userConfig.integrations
    }
  };
}