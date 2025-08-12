/**
 * Migration Manager Tests
 * 
 * Comprehensive unit tests for the MigrationManager class including
 * migration execution, rollback capabilities, and dependency tracking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MigrationManager, Migration } from './index';
import postgres from 'postgres';

// Mock postgres
vi.mock('postgres', () => {
  const mockSql = vi.fn();
  mockSql.begin = vi.fn();
  mockSql.unsafe = vi.fn();
  mockSql.end = vi.fn().mockResolvedValue(undefined);
  
  const mockPostgres = vi.fn().mockReturnValue(mockSql);
  return { default: mockPostgres };
});

// Mock migration modules
vi.mock('../core', () => ({
  migrations: [
    {
      id: '001_initial_schema',
      name: 'Create initial schema',
      version: '1.0.0',
      dependencies: [],
      createdAt: new Date('2024-01-01'),
      checksum: 'abc123',
      up: 'CREATE TABLE users (id SERIAL PRIMARY KEY);',
      down: 'DROP TABLE users;'
    },
    {
      id: '002_add_properties',
      name: 'Add properties table',
      version: '1.1.0',
      dependencies: ['001_initial_schema'],
      createdAt: new Date('2024-01-02'),
      checksum: 'def456',
      up: 'CREATE TABLE properties (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id));',
      down: 'DROP TABLE properties;'
    }
  ]
}));

vi.mock('../trust', () => ({ migrations: [] }));
vi.mock('../verification', () => ({ migrations: [] }));
vi.mock('../fraud', () => ({ migrations: [] }));
vi.mock('../communication', () => ({ migrations: [] }));
vi.mock('../analytics', () => ({ migrations: [] }));

describe('MigrationManager', () => {
  let migrationManager: MigrationManager;
  let mockSql: any;

  beforeEach(() => {
    migrationManager = new MigrationManager();
    const postgres = require('postgres');
    mockSql = postgres.default();

    // Mock transaction behavior
    mockSql.begin.mockImplementation(async (callback: any) => {
      const trx = { ...mockSql };
      trx.unsafe = vi.fn().mockResolvedValue([]);
      return callback(trx);
    });

    // Default mock for migration table queries
    mockSql.mockImplementation((query: any) => {
      const queryStr = typeof query === 'string' ? query : query.strings?.join('');
      
      if (queryStr?.includes('CREATE TABLE IF NOT EXISTS schema_migrations')) {
        return Promise.resolve([]);
      }
      
      if (queryStr?.includes('SELECT * FROM schema_migrations')) {
        return Promise.resolve([]);
      }
      
      if (queryStr?.includes('INSERT INTO schema_migrations')) {
        return Promise.resolve([]);
      }
      
      return Promise.resolve([]);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadMigrations', () => {
    it('should load migrations successfully', async () => {
      await migrationManager.loadMigrations();

      // Verify migrations were loaded (we can't directly access private members, 
      // but we can test through public methods)
      const status = await migrationManager.getMigrationStatus(mockSql);
      expect(status.totalMigrations).toBe(2);
    });

    it('should validate migration dependencies', async () => {
      await migrationManager.loadMigrations();
      
      // Should not throw for valid dependencies
      expect(async () => {
        await migrationManager.getMigrationStatus(mockSql);
      }).not.toThrow();
    });

    it('should detect circular dependencies', async () => {
      // Mock circular dependency
      vi.doMock('../core', () => ({
        migrations: [
          {
            id: 'migration_a',
            name: 'Migration A',
            version: '1.0.0',
            dependencies: ['migration_b'],
            createdAt: new Date(),
            checksum: 'abc',
            up: 'SELECT 1;',
            down: 'SELECT 1;'
          },
          {
            id: 'migration_b',
            name: 'Migration B',
            version: '1.1.0',
            dependencies: ['migration_a'],
            createdAt: new Date(),
            checksum: 'def',
            up: 'SELECT 1;',
            down: 'SELECT 1;'
          }
        ]
      }));

      const newManager = new MigrationManager();
      
      await expect(newManager.loadMigrations()).rejects.toThrow('Circular dependency detected');
    });

    it('should detect missing dependencies', async () => {
      // Mock missing dependency
      vi.doMock('../core', () => ({
        migrations: [
          {
            id: 'migration_with_missing_dep',
            name: 'Migration with missing dependency',
            version: '1.0.0',
            dependencies: ['non_existent_migration'],
            createdAt: new Date(),
            checksum: 'abc',
            up: 'SELECT 1;',
            down: 'SELECT 1;'
          }
        ]
      }));

      const newManager = new MigrationManager();
      
      await expect(newManager.loadMigrations()).rejects.toThrow('depends on non_existent_migration which does not exist');
    });
  });

  describe('runPendingMigrations', () => {
    beforeEach(async () => {
      await migrationManager.loadMigrations();
    });

    it('should run pending migrations in dependency order', async () => {
      // Mock no executed migrations
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT * FROM schema_migrations ORDER BY executed_at')) {
          return Promise.resolve([]);
        }
        
        return Promise.resolve([]);
      });

      const result = await migrationManager.runPendingMigrations(mockSql);

      expect(result.success).toBe(true);
      expect(result.migrationsRun).toBe(2);
      expect(result.details).toHaveLength(2);
    });

    it('should skip already executed migrations', async () => {
      // Mock one executed migration
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT * FROM schema_migrations ORDER BY executed_at')) {
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
        
        return Promise.resolve([]);
      });

      const result = await migrationManager.runPendingMigrations(mockSql);

      expect(result.success).toBe(true);
      expect(result.migrationsRun).toBe(1); // Only the second migration should run
    });

    it('should handle migration execution errors', async () => {
      // Mock migration execution to fail
      mockSql.begin.mockImplementation(async (callback: any) => {
        const trx = { ...mockSql };
        trx.unsafe = vi.fn().mockRejectedValue(new Error('SQL execution failed'));
        return callback(trx);
      });

      const result = await migrationManager.runPendingMigrations(mockSql);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('SQL execution failed');
    });

    it('should return success when no pending migrations', async () => {
      // Mock all migrations as executed
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT * FROM schema_migrations ORDER BY executed_at')) {
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

      const result = await migrationManager.runPendingMigrations(mockSql);

      expect(result.success).toBe(true);
      expect(result.migrationsRun).toBe(0);
      expect(result.details).toContain('No pending migrations');
    });
  });

  describe('rollbackLastMigration', () => {
    beforeEach(async () => {
      await migrationManager.loadMigrations();
    });

    it('should rollback the last migration successfully', async () => {
      // Mock one executed migration
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT * FROM schema_migrations ORDER BY executed_at DESC LIMIT 1')) {
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
        
        if (queryStr?.includes('SELECT * FROM schema_migrations WHERE id =')) {
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

      const result = await migrationManager.rollbackLastMigration(mockSql);

      expect(result.success).toBe(true);
      expect(result.migrationsRun).toBe(1);
      expect(result.details[0]).toContain('Add properties table');
    });

    it('should handle no migrations to rollback', async () => {
      // Mock no executed migrations
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT * FROM schema_migrations ORDER BY executed_at DESC LIMIT 1')) {
          return Promise.resolve([]);
        }
        
        return Promise.resolve([]);
      });

      const result = await migrationManager.rollbackLastMigration(mockSql);

      expect(result.success).toBe(true);
      expect(result.migrationsRun).toBe(0);
      expect(result.details).toContain('No migrations to rollback');
    });

    it('should handle rollback errors', async () => {
      // Mock executed migration
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT * FROM schema_migrations ORDER BY executed_at DESC LIMIT 1')) {
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
        
        if (queryStr?.includes('SELECT * FROM schema_migrations WHERE id =')) {
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

      // Mock rollback execution to fail
      mockSql.begin.mockImplementation(async (callback: any) => {
        const trx = { ...mockSql };
        trx.unsafe = vi.fn().mockRejectedValue(new Error('Rollback SQL failed'));
        return callback(trx);
      });

      const result = await migrationManager.rollbackLastMigration(mockSql);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Rollback SQL failed');
    });
  });

  describe('getMigrationStatus', () => {
    beforeEach(async () => {
      await migrationManager.loadMigrations();
    });

    it('should return correct migration status', async () => {
      // Mock one executed migration
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT * FROM schema_migrations ORDER BY executed_at')) {
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
        
        return Promise.resolve([]);
      });

      const status = await migrationManager.getMigrationStatus(mockSql);

      expect(status.totalMigrations).toBe(2);
      expect(status.executedCount).toBe(1);
      expect(status.pendingCount).toBe(1);
      expect(status.isUpToDate).toBe(false);
      expect(status.executedMigrations).toHaveLength(1);
      expect(status.pendingMigrations).toHaveLength(1);
    });

    it('should indicate up-to-date when no pending migrations', async () => {
      // Mock all migrations as executed
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT * FROM schema_migrations ORDER BY executed_at')) {
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

      const status = await migrationManager.getMigrationStatus(mockSql);

      expect(status.isUpToDate).toBe(true);
      expect(status.pendingCount).toBe(0);
    });
  });

  describe('validateMigrations', () => {
    beforeEach(async () => {
      await migrationManager.loadMigrations();
    });

    it('should validate migrations successfully', async () => {
      // Mock executed migration with correct checksum
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT * FROM schema_migrations ORDER BY executed_at')) {
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
        
        return Promise.resolve([]);
      });

      const result = await migrationManager.validateMigrations(mockSql);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.migrationsValidated).toBe(2);
      expect(result.executedMigrationsValidated).toBe(1);
    });

    it('should detect checksum mismatches', async () => {
      // Mock executed migration with wrong checksum
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT * FROM schema_migrations ORDER BY executed_at')) {
          return Promise.resolve([
            {
              id: '001_initial_schema',
              name: 'Create initial schema',
              version: '1.0.0',
              executed_at: new Date(),
              checksum: 'wrong_checksum',
              execution_time_ms: 100
            }
          ]);
        }
        
        return Promise.resolve([]);
      });

      const result = await migrationManager.validateMigrations(mockSql);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('checksum mismatch'))).toBe(true);
    });

    it('should detect orphaned migration records', async () => {
      // Mock executed migration that no longer exists in code
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT * FROM schema_migrations ORDER BY executed_at')) {
          return Promise.resolve([
            {
              id: 'non_existent_migration',
              name: 'Non-existent migration',
              version: '1.0.0',
              executed_at: new Date(),
              checksum: 'abc123',
              execution_time_ms: 100
            }
          ]);
        }
        
        return Promise.resolve([]);
      });

      const result = await migrationManager.validateMigrations(mockSql);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('no longer exists in migration files'))).toBe(true);
    });
  });

  describe('getMigrationHistory', () => {
    beforeEach(async () => {
      await migrationManager.loadMigrations();
    });

    it('should return migration history', async () => {
      // Mock migration history
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT * FROM schema_migrations ORDER BY executed_at DESC')) {
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

      const history = await migrationManager.getMigrationHistory(mockSql);

      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('002_add_properties');
      expect(history[0].hasDefinition).toBe(true);
      expect(history[0].dependencies).toEqual(['001_initial_schema']);
      expect(history[1].id).toBe('001_initial_schema');
      expect(history[1].hasDefinition).toBe(true);
      expect(history[1].dependencies).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      // Mock migration history
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('LIMIT')) {
          return Promise.resolve([
            {
              id: '002_add_properties',
              name: 'Add properties table',
              version: '1.1.0',
              executed_at: new Date('2024-01-02'),
              checksum: 'def456',
              execution_time_ms: 150
            }
          ]);
        }
        
        return Promise.resolve([]);
      });

      const history = await migrationManager.getMigrationHistory(mockSql, 1);

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('002_add_properties');
    });
  });
});