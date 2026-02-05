/**
 * Database Configuration Management
 * 
 * Handles environment-specific database configurations with validation
 * and secure defaults.
 */

import { DatabaseConfig } from '../index';

export interface EnvironmentConfig {
  development: DatabaseConfig;
  testing: DatabaseConfig;
  staging: DatabaseConfig;
  production: DatabaseConfig;
}

/**
 * Default database configuration values
 */
const DEFAULT_CONFIG: Omit<DatabaseConfig, 'url'> = {
  ssl: false,
  poolSize: 10,
  connectionTimeout: 30000, // 30 seconds
  idleTimeout: 20000, // 20 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  healthCheckInterval: 30000, // 30 seconds
  applicationName: 'triplecheck_api'
};

/**
 * Environment-specific configuration overrides
 */
const ENVIRONMENT_OVERRIDES: Partial<Record<string, Partial<DatabaseConfig>>> = {
  production: {
    ssl: 'require',
    poolSize: 20,
    connectionTimeout: 10000,
    idleTimeout: 30000,
    retryAttempts: 5,
    retryDelay: 2000
  },
  staging: {
    ssl: 'require',
    poolSize: 15,
    connectionTimeout: 15000,
    retryAttempts: 4
  },
  testing: {
    poolSize: 5,
    connectionTimeout: 5000,
    idleTimeout: 10000,
    applicationName: 'triplecheck_test'
  }
};

/**
 * Validates database configuration
 */
export function validateDatabaseConfig(config: DatabaseConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!config.url) {
    errors.push('Database URL is required');
  }

  // Validate URL format
  if (config.url && !isValidDatabaseUrl(config.url)) {
    errors.push('Invalid database URL format');
  }

  // Validate numeric values
  if (config.poolSize <= 0 || config.poolSize > 100) {
    errors.push('Pool size must be between 1 and 100');
  }

  if (config.connectionTimeout <= 0) {
    errors.push('Connection timeout must be positive');
  }

  if (config.idleTimeout <= 0) {
    errors.push('Idle timeout must be positive');
  }

  if (config.retryAttempts < 0 || config.retryAttempts > 10) {
    errors.push('Retry attempts must be between 0 and 10');
  }

  if (config.retryDelay <= 0) {
    errors.push('Retry delay must be positive');
  }

  // Validate SSL configuration
  if (typeof config.ssl !== 'boolean' && config.ssl !== 'require') {
    errors.push('SSL must be boolean or "require"');
  }

  // Performance warnings
  if (config.poolSize > 50) {
    warnings.push('Large pool size may impact performance');
  }

  if (config.connectionTimeout > 60000) {
    warnings.push('Long connection timeout may cause delays');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    tablesValidated: 0 // Not applicable for config validation
  };
}

/**
 * Determines SSL requirement based on database URL and environment
 */
function shouldUseSSL(url: string, environment: string): boolean | 'require' {
  // Cloud providers typically require SSL
  const cloudProviders = [
    'neon.tech',
    'supabase.co',
    'amazonaws.com',
    'railway.app',
    'planetscale.com',
    'cockroachlabs.cloud'
  ];

  const requiresSSL = cloudProviders.some(provider => url.includes(provider));
  
  if (requiresSSL || environment === 'production') {
    return 'require';
  }

  // Local development typically doesn't need SSL
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return false;
  }

  // Default to requiring SSL for unknown remote connections
  return 'require';
}

/**
 * Validates database URL format
 */
function isValidDatabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
  } catch {
    return false;
  }
}

/**
 * Creates database configuration for the current environment
 */
export function createDatabaseConfig(environment?: string): DatabaseConfig {
  const env = environment || process.env.NODE_ENV || 'development';
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Start with default configuration
  const config: DatabaseConfig = {
    ...DEFAULT_CONFIG,
    url: databaseUrl
  };

  // Apply environment-specific overrides
  const envOverrides = ENVIRONMENT_OVERRIDES[env];
  if (envOverrides) {
    Object.assign(config, envOverrides);
  }

  // Auto-detect SSL requirement if not explicitly set
  if (envOverrides?.ssl === undefined) {
    config.ssl = shouldUseSSL(databaseUrl, env);
  }

  // Validate the final configuration
  const validation = validateDatabaseConfig(config);
  if (!validation.isValid) {
    throw new Error(`Invalid database configuration: ${validation.errors.join(', ')}`);
  }

  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.warn('Database configuration warnings:', validation.warnings);
  }

  return config;
}

/**
 * Gets database configuration with environment detection
 */
export function getDatabaseConfig(): DatabaseConfig {
  return createDatabaseConfig();
}

// Removed circular import - ValidationResult should be imported directly from where it's defined