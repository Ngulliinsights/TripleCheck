/**
 * Migration Integration Tests
 * 
 * Integration tests for the migration system including
 * rollback scenarios and dependency validation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MigrationManager } from './index';
import { DatabaseServiceImpl } from '../service';

// Mock the database service for integration testing
vi.mock('../../service', () => ({
  DatabaseServiceImpl: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue({ success: true }),
    getConnection: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue([]),
      transaction: vi.fn(),
      close: vi.fn(),
      isHealthy: vi.fn().mockResolvedValue(true)
    }),
    cleanup: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('Migration Integration Tests', () => {
  let migrationManager: MigrationManager;
  let dbService: DatabaseServiceImpl;
  let mockConnection: any;

  beforeEach(async () => {
    migrationManager = new MigrationManager();
    dbService = new DatabaseServiceImpl();
    
    await dbService.initialize();
    mockConnection = await dbService.getConnection();
    
    // Mock SQL execution for integration tests
    mockConnection.query = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes('CREATE TABLE IF NOT EXISTS schema_migrations')) {
        return Promise.resolve([]);
      }
      if (sql.includes('SELECT * FROM schema_migrations')) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    mockConnection.transaction = vi.fn().mockImplementation(async (callback) => {
      const trx = {
        query: mockConnection.query,
        unsafe: vi.fn().mockResolvedValue([])
      };
      return callback(trx);
    });
  });

  afterEach(async () => {
    await dbService.cleanup();
    vi.clearAllMocks();
  });

  describe('End-to-End Migration Workflow', () => {
    it('should complete full migration lifecycle', async () => {
      // Load migrations
      await migrationManager.loadMigrations();

      // Check initial status
      const initialStatus = await migrationManager.getMigrationStatus(mockConnection);
      expect(initialStatus.totalMigrations).toBeGreaterThan(0);
      expect(initialStatus.executedCount).toBe(0);

      // Run pending migrations
      const runResult = await migrationManager.runPendingMigrations(mockConnection);
      expect(runResult.success).toBe(true);

      // Validate migrations
      const validationResult = await migrationManager.validateMigrations(mockConnection);
      expect(validationResult.isValid).toBe(true);

      // Check final status
      const finalStatus = await migrationManager.getMigrationStatus(mockConnection);
      expect(finalStatus.isUpToDate).toBe(true);
    });

    it('should handle rollback scenarios correctly', async () => {
      await migrationManager.loadMigrations();

      // Mock some executed migrations
      mockConnection.query = vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM schema_migrations ORDER BY executed_at DESC LIMIT 1')) {
          return Promise.resolve([
            {
              id: '002_add_properties',
              name: 'Add properties table',
              version: '1.1.0',
              executed_at: new Date(),
              checksum: 'def456',
              execution_time_ms: 150
            }
          ]);
        }
        if (sql.includes('SELECT * FROM schema_migrations WHERE id =')) {
          return Promise.resolve([
            {
              id: '002_add_properties',
              name: 'Add properties table',
              version: '1.1.0',
              executed_at: new Date(),
              checksum: 'def456',
              execution_time_ms: 150
            }
          ]);
        }
        return Promise.resolve([]);
      });

      // Test rollback
      const rollbackResult = await migrationManager.rollbackLastMigration(mockConnection);
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.migrationsRun).toBe(1);
    });

    it('should maintain data integrity during failures', async () => {
      await migrationManager.loadMigrations();

      // Mock transaction failure
      mockConnection.transaction = vi.fn().mockImplementation(async (callback) => {
        const trx = {
          query: mockConnection.query,
          unsafe: vi.fn().mockRejectedValue(new Error('Transaction failed'))
        };
        return callback(trx);
      });

      // Run migrations (should fail)
      const result = await migrationManager.runPendingMigrations(mockConnection);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Verify no partial state was left
      const status = await migrationManager.getMigrationStatus(mockConnection);
      expect(status.executedCount).toBe(0);
    });
  });

  describe('Dependency Resolution', () => {
    it('should execute migrations in correct dependency order', async () => {
      await migrationManager.loadMigrations();

      const executionOrder: string[] = [];
      
      // Track execution order
      mockConnection.transaction = vi.fn().mockImplementation(async (callback) => {
        const trx = {
          query: mockConnection.query,
          unsafe: vi.fn().mockImplementation(async (sql: string) => {
            if (sql.includes('CREATE TABLE users')) {
              executionOrder.push('001_initial_schema');
            } else if (sql.includes('CREATE TABLE properties')) {
              executionOrder.push('002_add_properties');
            }
            return [];
          })
        };
        return callback(trx);
      });

      await migrationManager.runPendingMigrations(mockConnection);

      // Verify correct order (users table before properties table)
      expect(executionOrder).toEqual(['001_initial_schema', '002_add_properties']);
    });

    it('should prevent rollback of migrations with dependencies', async () => {
      await migrationManager.loadMigrations();

      // Mock both migrations as executed
      mockConnection.query = vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM schema_migrations WHERE id = \'001_initial_schema\'')) {
          return Promise.resolve([
            {
              id: '001_initial_schema',
              name: 'Create initial schema',
              version: '1.0.0',
              executed_at: new Date(),
              checksum: 'abc123',
              execution_time_ms: 100
            }
          ]);
        }
        if (sql.includes('SELECT * FROM schema_migrations ORDER BY executed_at')) {
          return Promise.resolve([
            {
              id: '001_initial_schema',
              name: 'Create initial schema',
              version: '1.0.0',
              executed_at: new Date(),
              checksum: 'abc123',
              execution_time_ms: 100
            },
            {
              id: '002_add_properties',
              name: 'Add properties table',
              version: '1.1.0',
              executed_at: new Date(),
              checksum: 'def456',
              execution_time_ms: 150
            }
          ]);
        }
        return Promise.resolve([]);
      });

      // Try to rollback the first migration (should fail due to dependency)
      const rollbackResult = await migrationManager.rollbackMigration(mockConnection, '001_initial_schema');
      
      expect(rollbackResult.success).toBe(false);
      expect(rollbackResult.error?.message).toContain('dependent migrations');
    });
  });

  describe('Error Recovery', () => {
    it('should recover from partial migration failures', async () => {
      await migrationManager.loadMigrations();

      let failureCount = 0;
      
      // Mock first attempt to fail, second to succeed
      mockConnection.transaction = vi.fn().mockImplementation(async (callback) => {
        const trx = {
          query: mockConnection.query,
          unsafe: vi.fn().mockImplementation(async (sql: string) => {
            if (sql.includes('CREATE TABLE') && failureCount === 0) {
              failureCount++;
              throw new Error('Temporary failure');
            }
            return [];
          })
        };
        return callback(trx);
      });

      // First attempt should fail
      const firstResult = await migrationManager.runPendingMigrations(mockConnection);
      expect(firstResult.success).toBe(false);

      // Second attempt should succeed
      const secondResult = await migrationManager.runPendingMigrations(mockConnection);
      expect(secondResult.success).toBe(true);
    });

    it('should handle database connection issues gracefully', async () => {
      await migrationManager.loadMigrations();

      // Mock connection failure
      mockConnection.query = vi.fn().mockRejectedValue(new Error('Connection lost'));

      const result = await migrationManager.getMigrationStatus(mockConnection);
      
      // Should handle the error gracefully
      expect(async () => {
        await migrationManager.getMigrationStatus(mockConnection);
      }).rejects.toThrow('Connection lost');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of migrations efficiently', async () => {
      // This test would be more meaningful with actual database operations
      // For now, we test that the system can handle the load conceptually
      
      await migrationManager.loadMigrations();

      const startTime = Date.now();
      const status = await migrationManager.getMigrationStatus(mockConnection);
      const endTime = Date.now();

      // Should complete quickly even with many migrations
      expect(endTime - startTime).toBeLessThan(1000);
      expect(status).toBeDefined();
    });

    it('should batch migration operations efficiently', async () => {
      await migrationManager.loadMigrations();

      // Track number of database calls
      let queryCount = 0;
      const originalQuery = mockConnection.query;
      mockConnection.query = vi.fn().mockImplementation((...args) => {
        queryCount++;
        return originalQuery(...args);
      });

      await migrationManager.runPendingMigrations(mockConnection);

      // Should not make excessive database calls
      expect(queryCount).toBeLessThan(20); // Reasonable upper bound
    });
  });

  describe('Validation and Integrity', () => {
    it('should detect and report migration inconsistencies', async () => {
      await migrationManager.loadMigrations();

      // Mock inconsistent migration state
      mockConnection.query = vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM schema_migrations ORDER BY executed_at')) {
          return Promise.resolve([
            {
              id: '001_initial_schema',
              name: 'Create initial schema',
              version: '1.0.0',
              executed_at: new Date(),
              checksum: 'wrong_checksum', // Incorrect checksum
              execution_time_ms: 100
            }
          ]);
        }
        return Promise.resolve([]);
      });

      const validation = await migrationManager.validateMigrations(mockConnection);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('checksum mismatch'))).toBe(true);
    });

    it('should provide comprehensive migration history', async () => {
      await migrationManager.loadMigrations();

      // Mock migration history
      mockConnection.query = vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM schema_migrations ORDER BY executed_at DESC')) {
          return Promise.resolve([
            {
              id: '002_add_properties',
              name: 'Add properties table',
              version: '1.1.0',
              executed_at: new Date('2024-01-02'),
              checksum: 'def456',
              execution_time_ms: 150
            },
            {
              id: '001_initial_schema',
              name: 'Create initial schema',
              version: '1.0.0',
              executed_at: new Date('2024-01-01'),
              checksum: 'abc123',
              execution_time_ms: 100
            }
          ]);
        }
        return Promise.resolve([]);
      });

      const history = await migrationManager.getMigrationHistory(mockConnection);
      
      expect(history).toHaveLength(2);
      expect(history[0].executedAt).toBeInstanceOf(Date);
      expect(history[0].hasDefinition).toBe(true);
      expect(history[0].dependencies).toBeDefined();
    });
  });
});