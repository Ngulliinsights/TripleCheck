/**
 * Schema Manager Tests
 * 
 * Comprehensive unit tests for the SchemaManager class including
 * schema loading, validation, and consistency checking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SchemaManager } from '../index';
import postgres from 'postgres';

// Mock postgres
vi.mock('postgres', () => {
  const mockSql = vi.fn();
  mockSql.end = vi.fn().mockResolvedValue(undefined);
  
  const mockPostgres = vi.fn().mockReturnValue(mockSql);
  mockPostgres.default = mockPostgres;
  return mockPostgres;
});

// Mock the schema modules
vi.mock('../core', () => ({
  users: { getSQL: vi.fn() },
  properties: { getSQL: vi.fn() },
  reviews: { getSQL: vi.fn() },
  favorites: { getSQL: vi.fn() },
  propertyViews: { getSQL: vi.fn() },
  usersRelations: {},
  propertiesRelations: {},
  reviewsRelations: {},
  favoritesRelations: {},
  propertyViewsRelations: {}
}));

vi.mock('../trust', () => ({
  trustSchemas: {}
}));

vi.mock('../verification', () => ({
  verificationSchemas: {}
}));

vi.mock('../fraud', () => ({
  fraudSchemas: {}
}));

vi.mock('../communication', () => ({
  communicationSchemas: {}
}));

vi.mock('../analytics', () => ({
  analyticsSchemas: {}
}));

describe('SchemaManager', () => {
  let schemaManager: SchemaManager;
  let mockSql: any;

  beforeEach(() => {
    schemaManager = new SchemaManager();
    const postgres = require('postgres');
    mockSql = postgres();
    
    // Mock database queries for validation
    mockSql.mockImplementation((query: any) => {
      if (typeof query === 'string' || (query && query.strings)) {
        // Mock different query responses based on the query
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('information_schema.tables')) {
          return Promise.resolve([
            { table_name: 'users' },
            { table_name: 'properties' },
            { table_name: 'reviews' },
            { table_name: 'favorites' },
            { table_name: 'property_views' }
          ]);
        }
        
        if (queryStr?.includes('information_schema.table_constraints')) {
          return Promise.resolve([
            {
              table_name: 'properties',
              column_name: 'owner_id',
              foreign_table_name: 'users',
              foreign_column_name: 'id',
              delete_rule: 'CASCADE',
              update_rule: 'NO ACTION'
            },
            {
              table_name: 'reviews',
              column_name: 'property_id',
              foreign_table_name: 'properties',
              foreign_column_name: 'id',
              delete_rule: 'CASCADE',
              update_rule: 'NO ACTION'
            }
          ]);
        }
        
        if (queryStr?.includes('pg_class')) {
          return Promise.resolve([
            {
              table_name: 'users',
              index_name: 'users_pkey',
              is_unique: true,
              column_name: 'id'
            },
            {
              table_name: 'users',
              index_name: 'users_email_idx',
              is_unique: true,
              column_name: 'email'
            }
          ]);
        }
        
        if (queryStr?.includes('information_schema.columns')) {
          return Promise.resolve([
            {
              column_name: 'id',
              data_type: 'integer',
              is_nullable: 'NO',
              column_default: "nextval('users_id_seq'::regclass)"
            },
            {
              column_name: 'email',
              data_type: 'character varying',
              is_nullable: 'NO',
              column_default: null
            },
            {
              column_name: 'created_at',
              data_type: 'timestamp without time zone',
              is_nullable: 'NO',
              column_default: 'now()'
            }
          ]);
        }
        
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadSchemas', () => {
    it('should load schemas successfully', async () => {
      const schemas = await schemaManager.loadSchemas();

      expect(schemas).toBeDefined();
      expect(schemas.users).toBeDefined();
      expect(schemas.properties).toBeDefined();
      expect(schemas.reviews).toBeDefined();
      expect(schemas.favorites).toBeDefined();
      expect(schemas.propertyViews).toBeDefined();
    });

    it('should cache loaded schemas on subsequent calls', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const schemas1 = await schemaManager.loadSchemas();
      const schemas2 = await schemaManager.loadSchemas();

      expect(schemas1).toBe(schemas2); // Same reference
      expect(consoleSpy).toHaveBeenCalledTimes(2); // Only called once for loading
      
      consoleSpy.mockRestore();
    });

    it('should handle schema loading errors', async () => {
      // Mock import to throw an error
      vi.doMock('../core', () => {
        throw new Error('Failed to import core schemas');
      });

      const newSchemaManager = new SchemaManager();
      
      await expect(newSchemaManager.loadSchemas()).rejects.toThrow(
        'Schema loading failed: Failed to import core schemas'
      );
    });

    it('should store schema metadata', async () => {
      await schemaManager.loadSchemas();

      const coreMetadata = schemaManager.getSchemaMetadata('core');
      expect(coreMetadata).toBeDefined();
      expect(coreMetadata?.name).toBe('core');
      expect(coreMetadata?.version).toBe('1.0.0');
      expect(coreMetadata?.tables).toContain('users');
      expect(coreMetadata?.tables).toContain('properties');
      expect(coreMetadata?.loadedAt).toBeInstanceOf(Date);
    });
  });

  describe('validateSchemas', () => {
    beforeEach(async () => {
      await schemaManager.loadSchemas();
    });

    it('should validate schemas successfully', async () => {
      const result = await schemaManager.validateSchemas(mockSql);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.tablesValidated).toBeGreaterThan(0);
    });

    it('should detect missing tables', async () => {
      // Mock database to return fewer tables
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('information_schema.tables')) {
          return Promise.resolve([
            { table_name: 'users' }
            // Missing other tables
          ]);
        }
        
        return Promise.resolve([]);
      });

      const result = await schemaManager.validateSchemas(mockSql);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('does not exist in database'))).toBe(true);
    });

    it('should validate table structure', async () => {
      const result = await schemaManager.validateSchemas(mockSql);

      expect(result.tablesValidated).toBeGreaterThan(0);
      // Should have warnings about missing standard columns if they don't exist
      if (result.warnings.length > 0) {
        expect(result.warnings.some(warning => 
          warning.includes('created_at') || warning.includes('updated_at')
        )).toBe(true);
      }
    });

    it('should validate foreign key relationships', async () => {
      const result = await schemaManager.validateSchemas(mockSql);

      // Should not have errors about foreign key relationships since our mock returns valid FKs
      expect(result.errors.filter(error => error.includes('references')).length).toBe(0);
    });

    it('should handle validation errors gracefully', async () => {
      // Mock SQL to throw an error
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await schemaManager.validateSchemas(mockSql);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Schema validation error: Database connection failed');
    });
  });

  describe('schema metadata management', () => {
    beforeEach(async () => {
      await schemaManager.loadSchemas();
    });

    it('should return schema metadata for existing domain', () => {
      const metadata = schemaManager.getSchemaMetadata('core');

      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('core');
      expect(metadata?.tables).toBeInstanceOf(Array);
    });

    it('should return undefined for non-existent domain', () => {
      const metadata = schemaManager.getSchemaMetadata('nonexistent');

      expect(metadata).toBeUndefined();
    });

    it('should return all schema metadata', () => {
      const allMetadata = schemaManager.getAllSchemaMetadata();

      expect(allMetadata).toBeInstanceOf(Array);
      expect(allMetadata.length).toBeGreaterThan(0);
      expect(allMetadata[0]).toHaveProperty('name');
      expect(allMetadata[0]).toHaveProperty('version');
      expect(allMetadata[0]).toHaveProperty('tables');
      expect(allMetadata[0]).toHaveProperty('loadedAt');
    });
  });

  describe('table name extraction', () => {
    it('should extract table names from schema module', async () => {
      await schemaManager.loadSchemas();
      
      const coreMetadata = schemaManager.getSchemaMetadata('core');
      
      expect(coreMetadata?.tables).toContain('users');
      expect(coreMetadata?.tables).toContain('properties');
      expect(coreMetadata?.tables).toContain('reviews');
      expect(coreMetadata?.tables).toContain('favorites');
      expect(coreMetadata?.tables).toContain('propertyViews');
    });

    it('should not include non-table exports', async () => {
      await schemaManager.loadSchemas();
      
      const coreMetadata = schemaManager.getSchemaMetadata('core');
      
      // Relations should not be included as tables
      expect(coreMetadata?.tables).not.toContain('usersRelations');
      expect(coreMetadata?.tables).not.toContain('propertiesRelations');
    });
  });

  describe('error handling', () => {
    it('should handle database query errors during validation', async () => {
      await schemaManager.loadSchemas();
      
      // Mock a specific query to fail
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('information_schema.tables')) {
          throw new Error('Permission denied');
        }
        
        return Promise.resolve([]);
      });

      const result = await schemaManager.validateSchemas(mockSql);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Permission denied'))).toBe(true);
    });

    it('should provide meaningful error messages', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock import to fail
      vi.doMock('../core', () => {
        throw new Error('Module not found');
      });

      const newSchemaManager = new SchemaManager();
      
      try {
        await newSchemaManager.loadSchemas();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Schema loading failed');
        expect((error as Error).message).toContain('Module not found');
      }

      consoleSpy.mockRestore();
    });
  });
});