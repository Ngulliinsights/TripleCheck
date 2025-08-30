/**
 * ENVIRONMENT SCHEMA VALIDATION - CRITICAL CONFIGURATION FIX
 * =========================================================
 * 
 * Addresses the configuration sprawl and runtime failures due to
 * missing or malformed environment variables identified in the audit.
 * 
 * This creates a single source of truth for all environment configuration
 * with proper validation and type safety.
 */

import { z } from 'zod';

// Database configuration schema
const databaseSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().min(1).max(100).default(10),
  DATABASE_TIMEOUT: z.coerce.number().min(1000).default(30000),
});

// Redis configuration schema
const redisSchema = z.object({
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_MAX_RETRIES: z.coerce.number().min(0).default(3),
});

// Authentication configuration schema
const authSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),
});

// Email configuration schema
const emailSchema = z.object({
  SENDGRID_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().default('noreply@triplecheck.co.ke'),
});

// File upload configuration schema
const uploadSchema = z.object({
  SECURE_UPLOAD_DIR: z.string().default('/tmp/triplecheck-uploads'),
  MAX_FILE_SIZE: z.coerce.number().min(1024).default(10 * 1024 * 1024), // 10MB
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

// API configuration schema
const apiSchema = z.object({
  PORT: z.coerce.number().min(1000).max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_BASE_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

// External services configuration schema
const externalServicesSchema = z.object({
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GOVERNMENT_API_BASE_URL: z.string().url().optional(),
  GOVERNMENT_API_KEY: z.string().optional(),
});

// Monitoring configuration schema
const monitoringSchema = z.object({
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_METRICS: z.coerce.boolean().default(true),
  SENTRY_DSN: z.string().optional(),
  PROMETHEUS_PORT: z.coerce.number().optional(),
});

// Complete environment schema
const environmentSchema = z.object({
  ...databaseSchema.shape,
  ...redisSchema.shape,
  ...authSchema.shape,
  ...emailSchema.shape,
  ...uploadSchema.shape,
  ...apiSchema.shape,
  ...externalServicesSchema.shape,
  ...monitoringSchema.shape,
});

export type EnvironmentConfig = z.infer<typeof environmentSchema>;

/**
 * Validate and parse environment variables
 */
export function validateEnvironment(): EnvironmentConfig {
  try {
    const config = environmentSchema.parse(process.env);
    
    // Additional validation logic
    validateDependentConfigurations(config);
    
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      throw new Error(`Environment validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Validate dependent configurations
 */
function validateDependentConfigurations(config: EnvironmentConfig): void {
  // Validate email configuration
  const hasEmailConfig = config.SENDGRID_API_KEY || 
    (config.SMTP_HOST && config.SMTP_PORT && config.SMTP_USER && config.SMTP_PASS);
  
  if (config.NODE_ENV === 'production' && !hasEmailConfig) {
    throw new Error('Email configuration is required in production environment');
  }

  // Validate external services in production
  if (config.NODE_ENV === 'production') {
    const requiredServices = [
      'GOOGLE_MAPS_API_KEY',
      'GOVERNMENT_API_BASE_URL',
      'GOVERNMENT_API_KEY'
    ] as const;

    const missingServices = requiredServices.filter(service => !config[service]);
    if (missingServices.length > 0) {
      console.warn(`Warning: Missing external service configurations in production: ${missingServices.join(', ')}`);
    }
  }

  // Validate file upload configuration
  if (config.NODE_ENV === 'production' && !config.CLOUDINARY_CLOUD_NAME) {
    console.warn('Warning: Cloudinary not configured. File uploads will use local storage.');
  }
}

/**
 * Get validated environment configuration
 */
let cachedConfig: EnvironmentConfig | null = null;

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnvironment();
  }
  return cachedConfig;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'test';
}

/**
 * Get database configuration
 */
export function getDatabaseConfig() {
  const config = getEnvironmentConfig();
  return {
    url: config.DATABASE_URL,
    maxConnections: config.DATABASE_MAX_CONNECTIONS,
    timeout: config.DATABASE_TIMEOUT,
  };
}

/**
 * Get Redis configuration
 */
export function getRedisConfig() {
  const config = getEnvironmentConfig();
  return {
    url: config.REDIS_URL,
    password: config.REDIS_PASSWORD,
    maxRetries: config.REDIS_MAX_RETRIES,
  };
}

/**
 * Get authentication configuration
 */
export function getAuthConfig() {
  const config = getEnvironmentConfig();
  return {
    jwtSecret: config.JWT_SECRET,
    jwtExpiresIn: config.JWT_EXPIRES_IN,
    sessionSecret: config.SESSION_SECRET,
    bcryptRounds: config.BCRYPT_ROUNDS,
  };
}

/**
 * Initialize environment validation on module load
 */
try {
  validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}