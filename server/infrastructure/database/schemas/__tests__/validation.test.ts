/**
 * Schema Validation Tests
 * 
 * Comprehensive unit tests for the SchemaValidator class including
 * foreign key validation, index analysis, and business rule checking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SchemaValidator } from '@/shared/services/ValidationService';
import postgres from 'postgres';

// Mock postgres
vi.mock('postgres', () => {
  const mockSql = vi.fn();
  mockSql.end = vi.fn().mockResolvedValue(undefined);
  
  const mockPostgres = vi.fn().mockReturnValue(mockSql);
  mockPostgres.default = mockPostgres;
  return mockPostgres;
});

describe('SchemaValidator', () => {
  let validator: SchemaValidator;
  let mockSql: any;

  beforeEach(() => {
    const postgres = require('postgres');
    mockSql = postgres();
    validator = new SchemaValidator(mockSql);

    // Default mock implementations
    mockSql.mockImplementation((query: any) => {
      const queryStr = typeof query === 'string' ? query : query.strings?.join('');
      
      if (queryStr?.includes('information_schema.tables')) {
        return Promise.resolve([
          { table_name: 'users' },
          { table_name: 'properties' },
          { table_name: 'reviews' },
          { table_name: 'favorites' }
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
            update_rule: 'NO ACTION',
            constraint_name: 'properties_owner_id_fkey'
          }
        ]);
      }
      
      if (queryStr?.includes('pg_class')) {
        return Promise.resolve([
          {
            table_name: 'users',
            index_name: 'users_pkey',
            is_unique: true,
            is_primary: true,
            column_name: 'id',
            column_position: 1
          },
          {
            table_name: 'users',
            index_name: 'users_email_idx',
            is_unique: true,
            is_primary: false,
            column_name: 'email',
            column_position: 1
          }
        ]);
      }
      
      if (queryStr?.includes('information_schema.columns')) {
        return Promise.resolve([
          {
            column_name: 'id',
            data_type: 'integer',
            is_nullable: 'NO',
            column_default: "nextval('users_id_seq'::regclass)",
            character_maximum_length: null,
            numeric_precision: 32,
            numeric_scale: 0
          },
          {
            column_name: 'email',
            data_type: 'character varying',
            is_nullable: 'NO',
            column_default: null,
            character_maximum_length: 255,
            numeric_precision: null,
            numeric_scale: null
          },
          {
            column_name: 'created_at',
            data_type: 'timestamp without time zone',
            is_nullable: 'NO',
            column_default: 'now()',
            character_maximum_length: null,
            numeric_precision: null,
            numeric_scale: null
          }
        ]);
      }
      
      // Business rule validation queries
      if (queryStr?.includes('reviews') && queryStr?.includes('rating')) {
        return Promise.resolve([{ count: '0' }]);
      }
      
      if (queryStr?.includes('properties') && queryStr?.includes('price')) {
        return Promise.resolve([{ count: '0' }]);
      }
      
      if (queryStr?.includes('users') && queryStr?.includes('trust_score')) {
        return Promise.resolve([{ count: '0' }]);
      }
      
      return Promise.resolve([]);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateAllSchemas', () => {
    it('should validate schemas successfully', async () => {
      const expectedTables = ['users', 'properties', 'reviews', 'favorites'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.tablesValidated).toBe(4);
    });

    it('should detect missing tables', async () => {
      const expectedTables = ['users', 'properties', 'reviews', 'favorites', 'missing_table'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('missing_table'))).toBe(true);
      expect(result.tablesValidated).toBe(4); // Only existing tables are counted
    });

    it('should detect orphaned tables', async () => {
      // Mock database to return extra table
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('information_schema.tables')) {
          return Promise.resolve([
            { table_name: 'users' },
            { table_name: 'properties' },
            { table_name: 'orphaned_table' } // Extra table not in schema
          ]);
        }
        
        return Promise.resolve([]);
      });

      const expectedTables = ['users', 'properties'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      expect(result.warnings.some(warning => warning.includes('orphaned_table'))).toBe(true);
    });

    it('should validate with different options', async () => {
      const strictValidator = new SchemaValidator(mockSql, { strictMode: true });
      const expectedTables = ['users'];
      
      // Mock table without 'id' column
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('information_schema.tables')) {
          return Promise.resolve([{ table_name: 'users' }]);
        }
        
        if (queryStr?.includes('information_schema.columns')) {
          return Promise.resolve([
            {
              column_name: 'email',
              data_type: 'character varying',
              is_nullable: 'NO',
              column_default: null
            }
          ]);
        }
        
        return Promise.resolve([]);
      });

      const result = await strictValidator.validateAllSchemas(expectedTables);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes("must have an 'id' column"))).toBe(true);
    });
  });

  describe('foreign key validation', () => {
    it('should validate foreign key consistency', async () => {
      const expectedTables = ['users', 'properties'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      // Should not have errors since both tables exist
      expect(result.errors.filter(error => error.includes('references')).length).toBe(0);
    });

    it('should detect references to missing tables', async () => {
      // Mock foreign key to non-existent table
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('information_schema.tables')) {
          return Promise.resolve([{ table_name: 'properties' }]);
        }
        
        if (queryStr?.includes('information_schema.table_constraints')) {
          return Promise.resolve([
            {
              table_name: 'properties',
              column_name: 'owner_id',
              foreign_table_name: 'missing_users_table',
              foreign_column_name: 'id',
              delete_rule: 'CASCADE',
              update_rule: 'NO ACTION'
            }
          ]);
        }
        
        return Promise.resolve([]);
      });

      const expectedTables = ['properties'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      expect(result.warnings.some(warning => 
        warning.includes('missing_users_table') && warning.includes('not in expected schema')
      )).toBe(true);
    });

    it('should detect circular references', async () => {
      // Mock circular foreign key references
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('information_schema.tables')) {
          return Promise.resolve([
            { table_name: 'table_a' },
            { table_name: 'table_b' }
          ]);
        }
        
        if (queryStr?.includes('information_schema.table_constraints')) {
          return Promise.resolve([
            {
              table_name: 'table_a',
              column_name: 'b_id',
              foreign_table_name: 'table_b',
              foreign_column_name: 'id',
              delete_rule: 'CASCADE',
              update_rule: 'NO ACTION'
            },
            {
              table_name: 'table_b',
              column_name: 'a_id',
              foreign_table_name: 'table_a',
              foreign_column_name: 'id',
              delete_rule: 'CASCADE',
              update_rule: 'NO ACTION'
            }
          ]);
        }
        
        return Promise.resolve([]);
      });

      const expectedTables = ['table_a', 'table_b'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      expect(result.warnings.some(warning => warning.includes('circular reference'))).toBe(true);
    });
  });

  describe('business rule validation', () => {
    it('should detect invalid ratings', async () => {
      // Mock invalid ratings
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('reviews') && queryStr?.includes('rating')) {
          return Promise.resolve([{ count: '5' }]); // 5 invalid ratings
        }
        
        return Promise.resolve([{ count: '0' }]);
      });

      const expectedTables = ['reviews'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('invalid ratings'))).toBe(true);
    });

    it('should detect invalid prices', async () => {
      // Mock invalid prices
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('properties') && queryStr?.includes('price')) {
          return Promise.resolve([{ count: '3' }]); // 3 invalid prices
        }
        
        return Promise.resolve([{ count: '0' }]);
      });

      const expectedTables = ['properties'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('invalid prices'))).toBe(true);
    });

    it('should detect invalid trust scores', async () => {
      // Mock invalid trust scores
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('users') && queryStr?.includes('trust_score')) {
          return Promise.resolve([{ count: '2' }]); // 2 invalid trust scores
        }
        
        return Promise.resolve([{ count: '0' }]);
      });

      const expectedTables = ['users'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('invalid trust scores'))).toBe(true);
    });

    it('should handle missing tables gracefully during business rule validation', async () => {
      // Mock business rule queries to throw errors (table doesn't exist)
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('information_schema.tables')) {
          return Promise.resolve([]);
        }
        
        if (queryStr?.includes('reviews') || queryStr?.includes('properties') || queryStr?.includes('users')) {
          throw new Error('relation does not exist');
        }
        
        return Promise.resolve([]);
      });

      const expectedTables = [];
      
      const result = await validator.validateAllSchemas(expectedTables);

      // Should not fail completely, just skip business rule validation
      expect(result.isValid).toBe(true);
    });
  });

  describe('index validation', () => {
    it('should detect missing primary keys', async () => {
      // Mock table without primary key
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('information_schema.tables')) {
          return Promise.resolve([{ table_name: 'test_table' }]);
        }
        
        if (queryStr?.includes('pg_class')) {
          return Promise.resolve([]); // No indexes
        }
        
        if (queryStr?.includes('information_schema.columns')) {
          return Promise.resolve([
            {
              column_name: 'id',
              data_type: 'integer',
              is_nullable: 'NO'
            }
          ]);
        }
        
        return Promise.resolve([]);
      });

      const expectedTables = ['test_table'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      expect(result.warnings.some(warning => warning.includes('does not have a primary key'))).toBe(true);
    });

    it('should suggest indexes for foreign key columns', async () => {
      // Mock table with foreign key column but no index
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('information_schema.tables')) {
          return Promise.resolve([{ table_name: 'test_table' }]);
        }
        
        if (queryStr?.includes('pg_class')) {
          return Promise.resolve([
            {
              table_name: 'test_table',
              index_name: 'test_table_pkey',
              is_primary: true,
              column_name: 'id'
            }
          ]);
        }
        
        if (queryStr?.includes('information_schema.columns')) {
          return Promise.resolve([
            {
              column_name: 'id',
              data_type: 'integer',
              is_nullable: 'NO'
            },
            {
              column_name: 'user_id',
              data_type: 'integer',
              is_nullable: 'NO'
            }
          ]);
        }
        
        return Promise.resolve([]);
      });

      const expectedTables = ['test_table'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      expect(result.warnings.some(warning => 
        warning.includes('user_id') && warning.includes('may benefit from an index')
      )).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      mockSql.mockRejectedValue(new Error('Connection failed'));

      const expectedTables = ['users'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Connection failed'))).toBe(true);
    });

    it('should handle partial validation failures', async () => {
      // Mock some queries to succeed and others to fail
      mockSql.mockImplementation((query: any) => {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('information_schema.tables')) {
          return Promise.resolve([{ table_name: 'users' }]);
        }
        
        if (queryStr?.includes('information_schema.columns')) {
          throw new Error('Permission denied');
        }
        
        return Promise.resolve([]);
      });

      const expectedTables = ['users'];
      
      const result = await validator.validateAllSchemas(expectedTables);

      // Should continue validation despite partial failures
      expect(result.tablesValidated).toBe(0); // Table exists but structure validation failed
      expect(result.warnings.some(warning => warning.includes('Permission denied'))).toBe(true);
    });
  });
});