/**
 * Database Configuration Tests
 * 
 * Comprehensive unit tests for database configuration validation
 * and environment-specific settings.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateDatabaseConfig, createDatabaseConfig, getDatabaseConfig } from '../config';
import { DatabaseConfig } from '../index';

describe('Database Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateDatabaseConfig', () => {
    it('should validate a correct configuration', () => {
      const config: DatabaseConfig = {
        url: 'postgresql://user:pass@localhost:5432/testdb',
        ssl: false,
        poolSize: 10,
        connectionTimeout: 30000,
        idleTimeout: 20000,
        retryAttempts: 3,
        retryDelay: 1000,
        healthCheckInterval: 30000,
        applicationName: 'test_app'
      };

      const result = validateDatabaseConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject configuration without URL', () => {
      const config = {
        ssl: false,
        poolSize: 10,
        connectionTimeout: 30000,
        idleTimeout: 20000,
        retryAttempts: 3,
        retryDelay: 1000,
        healthCheckInterval: 30000,
        applicationName: 'test_app'
      } as DatabaseConfig;

      const result = validateDatabaseConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Database URL is required');
    });

    it('should reject invalid URL format', () => {
      const config: DatabaseConfig = {
        url: 'invalid-url',
        ssl: false,
        poolSize: 10,
        connectionTimeout: 30000,
        idleTimeout: 20000,
        retryAttempts: 3,
        retryDelay: 1000,
        healthCheckInterval: 30000,
        applicationName: 'test_app'
      };

      const result = validateDatabaseConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid database URL format');
    });

    it('should reject invalid pool size', () => {
      const config: DatabaseConfig = {
        url: 'postgresql://user:pass@localhost:5432/testdb',
        ssl: false,
        poolSize: 0,
        connectionTimeout: 30000,
        idleTimeout: 20000,
        retryAttempts: 3,
        retryDelay: 1000,
        healthCheckInterval: 30000,
        applicationName: 'test_app'
      };

      const result = validateDatabaseConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pool size must be between 1 and 100');
    });

    it('should reject negative timeout values', () => {
      const config: DatabaseConfig = {
        url: 'postgresql://user:pass@localhost:5432/testdb',
        ssl: false,
        poolSize: 10,
        connectionTimeout: -1000,
        idleTimeout: 20000,
        retryAttempts: 3,
        retryDelay: 1000,
        healthCheckInterval: 30000,
        applicationName: 'test_app'
      };

      const result = validateDatabaseConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Connection timeout must be positive');
    });

    it('should reject invalid retry attempts', () => {
      const config: DatabaseConfig = {
        url: 'postgresql://user:pass@localhost:5432/testdb',
        ssl: false,
        poolSize: 10,
        connectionTimeout: 30000,
        idleTimeout: 20000,
        retryAttempts: 15,
        retryDelay: 1000,
        healthCheckInterval: 30000,
        applicationName: 'test_app'
      };

      const result = validateDatabaseConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Retry attempts must be between 0 and 10');
    });

    it('should reject invalid SSL configuration', () => {
      const config: DatabaseConfig = {
        url: 'postgresql://user:pass@localhost:5432/testdb',
        ssl: 'invalid' as any,
        poolSize: 10,
        connectionTimeout: 30000,
        idleTimeout: 20000,
        retryAttempts: 3,
        retryDelay: 1000,
        healthCheckInterval: 30000,
        applicationName: 'test_app'
      };

      const result = validateDatabaseConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('SSL must be boolean or "require"');
    });

    it('should warn about large pool size', () => {
      const config: DatabaseConfig = {
        url: 'postgresql://user:pass@localhost:5432/testdb',
        ssl: false,
        poolSize: 60,
        connectionTimeout: 30000,
        idleTimeout: 20000,
        retryAttempts: 3,
        retryDelay: 1000,
        healthCheckInterval: 30000,
        applicationName: 'test_app'
      };

      const result = validateDatabaseConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Large pool size may impact performance');
    });

    it('should warn about long connection timeout', () => {
      const config: DatabaseConfig = {
        url: 'postgresql://user:pass@localhost:5432/testdb',
        ssl: false,
        poolSize: 10,
        connectionTimeout: 70000,
        idleTimeout: 20000,
        retryAttempts: 3,
        retryDelay: 1000,
        healthCheckInterval: 30000,
        applicationName: 'test_app'
      };

      const result = validateDatabaseConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Long connection timeout may cause delays');
    });
  });

  describe('createDatabaseConfig', () => {
    it('should create development configuration', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
      process.env.NODE_ENV = 'development';

      const config = createDatabaseConfig('development');

      expect(config.url).toBe('postgresql://user:pass@localhost:5432/testdb');
      expect(config.ssl).toBe(false);
      expect(config.poolSize).toBe(10);
      expect(config.applicationName).toBe('triplecheck_api');
    });

    it('should create production configuration with SSL', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@db.neon.tech:5432/testdb';
      process.env.NODE_ENV = 'production';

      const config = createDatabaseConfig('production');

      expect(config.url).toBe('postgresql://user:pass@db.neon.tech:5432/testdb');
      expect(config.ssl).toBe('require');
      expect(config.poolSize).toBe(20);
      expect(config.connectionTimeout).toBe(10000);
      expect(config.retryAttempts).toBe(5);
    });

    it('should create testing configuration', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
      process.env.NODE_ENV = 'testing';

      const config = createDatabaseConfig('testing');

      expect(config.poolSize).toBe(5);
      expect(config.connectionTimeout).toBe(5000);
      expect(config.applicationName).toBe('triplecheck_test');
    });

    it('should auto-detect SSL for cloud providers', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@db.supabase.co:5432/testdb';
      process.env.NODE_ENV = 'development';

      const config = createDatabaseConfig('development');

      expect(config.ssl).toBe('require');
    });

    it('should throw error when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;

      expect(() => createDatabaseConfig()).toThrow('DATABASE_URL environment variable is required');
    });

    it('should throw error for invalid configuration', () => {
      process.env.DATABASE_URL = 'invalid-url';

      expect(() => createDatabaseConfig()).toThrow('Invalid database configuration');
    });
  });

  describe('getDatabaseConfig', () => {
    it('should return configuration for current environment', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
      process.env.NODE_ENV = 'development';

      const config = getDatabaseConfig();

      expect(config).toBeDefined();
      expect(config.url).toBe('postgresql://user:pass@localhost:5432/testdb');
    });
  });

  describe('SSL Detection', () => {
    const testCases = [
      {
        url: 'postgresql://user:pass@localhost:5432/testdb',
        environment: 'development',
        expectedSSL: false,
        description: 'localhost in development'
      },
      {
        url: 'postgresql://user:pass@db.neon.tech:5432/testdb',
        environment: 'development',
        expectedSSL: 'require',
        description: 'Neon cloud provider'
      },
      {
        url: 'postgresql://user:pass@db.supabase.co:5432/testdb',
        environment: 'development',
        expectedSSL: 'require',
        description: 'Supabase cloud provider'
      },
      {
        url: 'postgresql://user:pass@localhost:5432/testdb',
        environment: 'production',
        expectedSSL: 'require',
        description: 'production environment'
      },
      {
        url: 'postgresql://user:pass@unknown-host:5432/testdb',
        environment: 'development',
        expectedSSL: 'require',
        description: 'unknown remote host'
      }
    ];

    testCases.forEach(({ url, environment, expectedSSL, description }) => {
      it(`should detect SSL correctly for ${description}`, () => {
        process.env.DATABASE_URL = url;
        process.env.NODE_ENV = environment;

        const config = createDatabaseConfig(environment);

        expect(config.ssl).toBe(expectedSSL);
      });
    });
  });
});