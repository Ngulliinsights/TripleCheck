/**
 * Database Service Tests
 * 
 * Comprehensive unit tests for the DatabaseService implementation
 * including initialization, connection management, and cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseServiceImpl } from '../service';
import { DatabaseConfig, DataScenario } from '../index';

// Mock postgres
vi.mock('postgres', () => {
  const mockSql = vi.fn();
  mockSql.end = vi.fn().mockResolvedValue(undefined);
  mockSql.begin = vi.fn().mockImplementation((callback) => callback(mockSql));
  
  const mockPostgres = vi.fn().mockReturnValue(mockSql);
  return { default: mockPostgres };
});

// Mock drizzle
vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn().mockReturnValue({})
}));

// Mock schema manager
vi.mock('../schemas', () => ({
  SchemaManager: vi.fn().mockImplementation(() => ({
    loadSchemas: vi.fn().mockResolvedValue({}),
    validateSchemas: vi.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      tablesValidated: 5
    })
  }))
}));

// Mock migration manager
vi.mock('../migrations', () => ({
  MigrationManager: vi.fn().mockImplementation(() => ({
    runPendingMigrations: vi.fn().mockResolvedValue({
      success: true,
      migrationsRun: 2,
      details: ['Migration 1 completed', 'Migration 2 completed']
    })
  }))
}));

// Mock data generator
vi.mock('../seeds', () => ({
  DataGenerator: vi.fn().mockImplementation(() => ({
    generateData: vi.fn().mockResolvedValue({
      success: true,
      recordsCreated: 10,
      tablesSeeded: ['users', 'properties']
    })
  }))
}));

describe('DatabaseService', () => {
  let service: DatabaseServiceImpl;
  let mockConfig: DatabaseConfig;

  beforeEach(() => {
    mockConfig = {
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

    service = new DatabaseServiceImpl(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully with valid configuration', async () => {
      const result = await service.initialize();

      expect(result.success).toBe(true);
      expect(result.connectionInfo).toBeDefined();
      expect(result.connectionInfo?.host).toBe('localhost');
      expect(result.connectionInfo?.database).toBe('testdb');
      expect(result.connectionInfo?.poolSize).toBe(10);
    });

    it('should handle initialization failure', async () => {
      // Mock postgres to throw an error
      const postgres = await import('postgres');
      vi.mocked(postgres.default).mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      const result = await service.initialize();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Connection failed');
    });

    it('should mask database URL in logs', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await service.initialize();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('postgresql://user:***@localhost:5432/testdb')
      );

      consoleSpy.mockRestore();
    });

    it('should retry without SSL on SSL error in development', async () => {
      process.env.NODE_ENV = 'development';
      
      const postgres = await import('postgres');
      let callCount = 0;
      vi.mocked(postgres.default).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Connection failed: insecure connection');
        }
        const mockSql = vi.fn();
        mockSql.end = vi.fn().mockResolvedValue(undefined);
        return mockSql;
      });

      const result = await service.initialize();

      expect(result.success).toBe(true);
      expect(callCount).toBe(2); // First call failed, second succeeded
    });
  });

  describe('getConnection', () => {
    it('should return connection after initialization', async () => {
      await service.initialize();
      
      const connection = await service.getConnection();

      expect(connection).toBeDefined();
      expect(typeof connection.query).toBe('function');
      expect(typeof connection.transaction).toBe('function');
      expect(typeof connection.isHealthy).toBe('function');
    });

    it('should throw error if not initialized', async () => {
      await expect(service.getConnection()).rejects.toThrow(
        'Database not initialized. Call initialize() first.'
      );
    });
  });

  describe('runMigrations', () => {
    it('should run migrations successfully', async () => {
      await service.initialize();
      
      const result = await service.runMigrations();

      expect(result.success).toBe(true);
      expect(result.migrationsRun).toBe(2);
      expect(result.details).toHaveLength(2);
    });

    it('should throw error if not initialized', async () => {
      await expect(service.runMigrations()).rejects.toThrow(
        'Database not initialized. Call initialize() first.'
      );
    });
  });

  describe('seedData', () => {
    it('should seed data successfully', async () => {
      await service.initialize();
      
      const result = await service.seedData(DataScenario.DEVELOPMENT);

      expect(result.success).toBe(true);
      expect(result.recordsCreated).toBe(10);
      expect(result.tablesSeeded).toEqual(['users', 'properties']);
    });

    it('should throw error if not initialized', async () => {
      await expect(service.seedData(DataScenario.DEVELOPMENT)).rejects.toThrow(
        'Database not initialized. Call initialize() first.'
      );
    });
  });

  describe('validateSchema', () => {
    it('should validate schema successfully', async () => {
      await service.initialize();
      
      const result = await service.validateSchema();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.tablesValidated).toBe(5);
    });

    it('should throw error if not initialized', async () => {
      await expect(service.validateSchema()).rejects.toThrow(
        'Database not initialized. Call initialize() first.'
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true for healthy connection', async () => {
      await service.initialize();
      
      const isHealthy = await service.healthCheck();

      expect(isHealthy).toBe(true);
    });

    it('should return false if not initialized', async () => {
      const isHealthy = await service.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should return false on connection error', async () => {
      await service.initialize();
      
      // Mock SQL to throw error
      const postgres = await import('postgres');
      const mockSql = vi.mocked(postgres.default)();
      vi.mocked(mockSql).mockRejectedValueOnce(new Error('Connection lost'));

      const isHealthy = await service.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources successfully', async () => {
      await service.initialize();
      
      await service.cleanup();

      // Should not throw when calling health check after cleanup
      const isHealthy = await service.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should handle cleanup when not initialized', async () => {
      // Should not throw
      await expect(service.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('URL parsing', () => {
    it('should extract host from URL correctly', async () => {
      const result = await service.initialize();

      expect(result.connectionInfo?.host).toBe('localhost');
    });

    it('should extract database from URL correctly', async () => {
      const result = await service.initialize();

      expect(result.connectionInfo?.database).toBe('testdb');
    });

    it('should handle malformed URLs gracefully', async () => {
      const serviceWithBadUrl = new DatabaseServiceImpl({
        ...mockConfig,
        url: 'not-a-valid-url'
      });

      const result = await serviceWithBadUrl.initialize();

      expect(result.connectionInfo?.host).toBe('unknown');
      expect(result.connectionInfo?.database).toBe('unknown');
    });
  });

  describe('health check monitoring', () => {
    it('should start health check monitoring after initialization', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      
      await service.initialize();

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        mockConfig.healthCheckInterval
      );

      setIntervalSpy.mockRestore();
    });

    it('should stop health check monitoring on cleanup', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      await service.initialize();
      await service.cleanup();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });
});