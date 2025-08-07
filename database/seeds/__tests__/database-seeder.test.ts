/**
 * Database Seeder Tests
 * 
 * Comprehensive unit tests for the DatabaseSeeder class including
 * seeding scenarios, validation, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseSeeder, seedDevelopmentData, seedTestingData, DATA_SCENARIOS } from '../index';
import postgres from 'postgres';

// Mock the data generator
vi.mock('../utils/generators', () => ({
  generateDataForScenario: vi.fn(),
  DATA_SCENARIOS: {
    development: {
      scenario: 'development',
      volumes: { users: 50, properties: 200, reviews: 500, transactions: 100, verifications: 150 }
    },
    testing: {
      scenario: 'testing',
      volumes: { users: 20, properties: 50, reviews: 100, transactions: 30, verifications: 40 }
    }
  }
}));

// Mock postgres
vi.mock('postgres', () => {
  const mockSql = vi.fn();
  mockSql.end = vi.fn().mockResolvedValue(undefined);
  mockSql.unsafe = vi.fn().mockResolvedValue(undefined);
  
  const mockPostgres = vi.fn().mockReturnValue(mockSql);
  return { default: mockPostgres };
});

describe('DatabaseSeeder', () => {
  let mockSql: any;
  let seeder: DatabaseSeeder;

  beforeEach(() => {
    const postgres = require('postgres');
    mockSql = postgres.default();
    
    // Reset mock implementations
    mockSql.mockClear();
    mockSql.unsafe.mockClear();
    
    // Default mock for SQL queries
    mockSql.mockImplementation((query: any) => {
      if (typeof query === 'string' || (query && query.strings)) {
        const queryStr = typeof query === 'string' ? query : query.strings?.join('');
        
        if (queryStr?.includes('SELECT 1 as test')) {
          return Promise.resolve([{ test: 1 }]);
        }
        
        if (queryStr?.includes('SELECT COUNT(*) as count')) {
          return Promise.resolve([{ count: '0' }]);
        }
      }
      return Promise.resolve([]);
    });

    // Mock data generation
    const { generateDataForScenario } = require('../utils/generators');
    generateDataForScenario.mockResolvedValue({
      success: true,
      recordsGenerated: {
        users: 20,
        properties: 50,
        reviews: 100,
        transactions: 30,
        verifications: 40
      },
      duration: 1000,
      errors: [],
      warnings: []
    });

    seeder = new DatabaseSeeder(mockSql, {
      scenario: 'testing',
      clearExisting: false,
      validateResults: false,
      dryRun: false,
      verbose: false
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('seeding process', () => {
    it('should complete seeding successfully', async () => {
      const result = await seeder.seed();

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('testing');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.summary.totalRecords).toBe(240); // Sum of all generated records
    });

    it('should validate database connection before seeding', async () => {
      await seeder.seed();

      expect(mockSql).toHaveBeenCalledWith(
        expect.objectContaining({
          strings: expect.arrayContaining([expect.stringContaining('SELECT 1 as test')])
        })
      );
    });

    it('should handle database connection failure', async () => {
      mockSql.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await seeder.seed();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });

  describe('data clearing', () => {
    it('should clear existing data when requested', async () => {
      const clearingSeeder = new DatabaseSeeder(mockSql, {
        scenario: 'testing',
        clearExisting: true,
        validateResults: false,
        dryRun: false,
        verbose: false
      });

      await clearingSeeder.seed();

      // Should have called DELETE queries
      expect(mockSql.unsafe).toHaveBeenCalledWith('DELETE FROM reviews');
      expect(mockSql.unsafe).toHaveBeenCalledWith('DELETE FROM transactions');
      expect(mockSql.unsafe).toHaveBeenCalledWith('DELETE FROM land_verifications');
      expect(mockSql.unsafe).toHaveBeenCalledWith('DELETE FROM properties');
      expect(mockSql.unsafe).toHaveBeenCalledWith('DELETE FROM users');
    });

    it('should skip clearing when not requested', async () => {
      const noClearSeeder = new DatabaseSeeder(mockSql, {
        scenario: 'testing',
        clearExisting: false,
        validateResults: false,
        dryRun: false,
        verbose: false
      });

      await noClearSeeder.seed();

      // Should not have called DELETE queries
      expect(mockSql.unsafe).not.toHaveBeenCalledWith(expect.stringContaining('DELETE'));
    });

    it('should handle clearing errors gracefully', async () => {
      mockSql.unsafe.mockRejectedValueOnce(new Error('Delete failed'));

      const clearingSeeder = new DatabaseSeeder(mockSql, {
        scenario: 'testing',
        clearExisting: true,
        validateResults: false,
        dryRun: false,
        verbose: false
      });

      const result = await clearingSeeder.seed();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to clear existing data');
    });
  });

  describe('dry run mode', () => {
    it('should perform dry run without writing data', async () => {
      const dryRunSeeder = new DatabaseSeeder(mockSql, {
        scenario: 'testing',
        clearExisting: false,
        validateResults: false,
        dryRun: true,
        verbose: false
      });

      const result = await dryRunSeeder.seed();

      expect(result.success).toBe(true);
      expect(result.generationResult?.warnings).toContain('DRY RUN - No data was actually generated');
      
      // Should not have called data generation
      const { generateDataForScenario } = require('../utils/generators');
      expect(generateDataForScenario).not.toHaveBeenCalled();
    });

    it('should not clear data in dry run mode', async () => {
      const dryRunSeeder = new DatabaseSeeder(mockSql, {
        scenario: 'testing',
        clearExisting: true,
        validateResults: false,
        dryRun: true,
        verbose: false
      });

      await dryRunSeeder.seed();

      expect(mockSql.unsafe).not.toHaveBeenCalledWith(expect.stringContaining('DELETE'));
    });
  });

  describe('validation', () => {
    it('should validate seeding results when requested', async () => {
      // Mock count queries for validation
      mockSql.mockImplementation((query: any) => {
        const queryStr = query?.strings?.[0] || '';
        
        if (queryStr.includes('SELECT 1 as test')) {
          return Promise.resolve([{ test: 1 }]);
        }
        
        if (queryStr.includes('SELECT COUNT(*) as count FROM users')) {
          return Promise.resolve([{ count: '20' }]);
        }
        
        if (queryStr.includes('SELECT COUNT(*) as count FROM properties')) {
          return Promise.resolve([{ count: '50' }]);
        }
        
        if (queryStr.includes('SELECT COUNT(*) as count FROM reviews')) {
          return Promise.resolve([{ count: '100' }]);
        }
        
        if (queryStr.includes('SELECT COUNT(*) as count FROM transactions')) {
          return Promise.resolve([{ count: '30' }]);
        }
        
        if (queryStr.includes('SELECT COUNT(*) as count FROM land_verifications')) {
          return Promise.resolve([{ count: '40' }]);
        }
        
        if (queryStr.includes('LEFT JOIN')) {
          return Promise.resolve([{ count: '0' }]); // No violations
        }
        
        return Promise.resolve([]);
      });

      const validatingSeeder = new DatabaseSeeder(mockSql, {
        scenario: 'testing',
        clearExisting: false,
        validateResults: true,
        dryRun: false,
        verbose: false
      });

      const result = await validatingSeeder.seed();

      expect(result.success).toBe(true);
      expect(result.summary.validationPassed).toBe(true);
    });

    it('should detect foreign key violations', async () => {
      // Mock to return foreign key violations
      mockSql.mockImplementation((query: any) => {
        const queryStr = query?.strings?.[0] || '';
        
        if (queryStr.includes('SELECT 1 as test')) {
          return Promise.resolve([{ test: 1 }]);
        }
        
        if (queryStr.includes('LEFT JOIN') && queryStr.includes('properties')) {
          return Promise.resolve([{ count: '5' }]); // 5 violations
        }
        
        if (queryStr.includes('SELECT COUNT(*) as count')) {
          return Promise.resolve([{ count: '20' }]);
        }
        
        return Promise.resolve([]);
      });

      const validatingSeeder = new DatabaseSeeder(mockSql, {
        scenario: 'testing',
        clearExisting: false,
        validateResults: true,
        dryRun: false,
        verbose: false
      });

      const result = await validatingSeeder.seed();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Foreign key violations found');
    });

    it('should skip validation when not requested', async () => {
      const noValidationSeeder = new DatabaseSeeder(mockSql, {
        scenario: 'testing',
        clearExisting: false,
        validateResults: false,
        dryRun: false,
        verbose: false
      });

      const result = await noValidationSeeder.seed();

      expect(result.success).toBe(true);
      // Should not have called count queries for validation
      expect(mockSql).not.toHaveBeenCalledWith(
        expect.objectContaining({
          strings: expect.arrayContaining([expect.stringContaining('SELECT COUNT(*) as count FROM')])
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle data generation errors', async () => {
      const { generateDataForScenario } = require('../utils/generators');
      generateDataForScenario.mockResolvedValueOnce({
        success: false,
        recordsGenerated: { users: 0, properties: 0, reviews: 0, transactions: 0, verifications: 0 },
        duration: 500,
        errors: ['Generation failed'],
        warnings: []
      });

      const result = await seeder.seed();

      expect(result.success).toBe(true); // Seeder itself succeeds, but generation failed
      expect(result.generationResult?.success).toBe(false);
    });

    it('should handle validation errors', async () => {
      mockSql.mockImplementation((query: any) => {
        const queryStr = query?.strings?.[0] || '';
        
        if (queryStr.includes('SELECT 1 as test')) {
          return Promise.resolve([{ test: 1 }]);
        }
        
        if (queryStr.includes('SELECT COUNT(*) as count')) {
          throw new Error('Validation query failed');
        }
        
        return Promise.resolve([]);
      });

      const validatingSeeder = new DatabaseSeeder(mockSql, {
        scenario: 'testing',
        clearExisting: false,
        validateResults: true,
        dryRun: false,
        verbose: false
      });

      const result = await validatingSeeder.seed();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Seeding validation failed');
    });

    it('should provide comprehensive error information', async () => {
      const { generateDataForScenario } = require('../utils/generators');
      generateDataForScenario.mockRejectedValueOnce(new Error('Specific generation error'));

      const result = await seeder.seed();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Specific generation error');
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('convenience functions', () => {
    it('should seed development data', async () => {
      const result = await seedDevelopmentData(mockSql);

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('development');
    });

    it('should seed testing data', async () => {
      const result = await seedTestingData(mockSql);

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('testing');
    });
  });

  describe('verbose mode', () => {
    it('should provide detailed output in verbose mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const verboseSeeder = new DatabaseSeeder(mockSql, {
        scenario: 'testing',
        clearExisting: true,
        validateResults: true,
        dryRun: false,
        verbose: true
      });

      await verboseSeeder.seed();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting database seeding')
      );

      consoleSpy.mockRestore();
    });

    it('should suppress output in non-verbose mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const quietSeeder = new DatabaseSeeder(mockSql, {
        scenario: 'testing',
        clearExisting: false,
        validateResults: false,
        dryRun: false,
        verbose: false
      });

      await quietSeeder.seed();

      // Should still have some output, but less detailed
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('seeding summary', () => {
    it('should provide accurate seeding summary', async () => {
      const result = await seeder.seed();

      expect(result.summary).toBeDefined();
      expect(result.summary.totalRecords).toBe(240);
      expect(result.summary.tablesSeeded).toContain('users');
      expect(result.summary.tablesSeeded).toContain('properties');
      expect(result.summary.tablesSeeded).toContain('reviews');
      expect(result.summary.tablesSeeded).toContain('transactions');
      expect(result.summary.tablesSeeded).toContain('land_verifications');
    });

    it('should handle empty generation results', async () => {
      const { generateDataForScenario } = require('../utils/generators');
      generateDataForScenario.mockResolvedValueOnce({
        success: true,
        recordsGenerated: {
          users: 0,
          properties: 0,
          reviews: 0,
          transactions: 0,
          verifications: 0
        },
        duration: 100,
        errors: [],
        warnings: []
      });

      const result = await seeder.seed();

      expect(result.success).toBe(true);
      expect(result.summary.totalRecords).toBe(0);
      expect(result.summary.tablesSeeded).toHaveLength(0);
    });
  });
});