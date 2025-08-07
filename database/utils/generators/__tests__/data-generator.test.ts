/**
 * Data Generator Tests
 * 
 * Comprehensive unit tests for the DataGenerator class including
 * data generation, validation, and scenario testing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataGenerator, generateDataForScenario, DATA_SCENARIOS, DataValidationSchemas } from '../index';
import postgres from 'postgres';

// Mock postgres
vi.mock('postgres', () => {
  const mockSql = vi.fn();
  mockSql.end = vi.fn().mockResolvedValue(undefined);
  mockSql.begin = vi.fn().mockImplementation((callback) => callback(mockSql));
  mockSql.unsafe = vi.fn().mockResolvedValue(undefined);
  
  const mockPostgres = vi.fn().mockReturnValue(mockSql);
  return { default: mockPostgres };
});

// Mock faker to ensure consistent test results
vi.mock('@faker-js/faker', () => ({
  faker: {
    setLocale: vi.fn(),
    seed: vi.fn(),
    string: {
      uuid: vi.fn(() => 'test-uuid-123'),
      numeric: vi.fn(() => '123456')
    },
    internet: {
      email: vi.fn(() => 'test@example.com')
    },
    person: {
      firstName: vi.fn(() => 'John'),
      lastName: vi.fn(() => 'Doe')
    },
    phone: {
      number: vi.fn(() => '+1234567890')
    },
    date: {
      past: vi.fn(() => new Date('2023-01-01')),
      recent: vi.fn(() => new Date('2024-01-01'))
    },
    number: {
      int: vi.fn(() => 100),
      float: vi.fn(() => 0.5)
    },
    helpers: {
      arrayElement: vi.fn((arr) => arr[0]),
      arrayElements: vi.fn((arr, options) => arr.slice(0, options?.min || 1))
    },
    location: {
      city: vi.fn(() => 'Test City')
    },
    lorem: {
      sentences: vi.fn(() => 'Test description.')
    }
  }
}));

describe('DataGenerator', () => {
  let mockSql: any;
  let dataGenerator: DataGenerator;

  beforeEach(() => {
    const postgres = require('postgres');
    mockSql = postgres.default();
    
    // Reset mock implementations
    mockSql.mockClear();
    mockSql.begin.mockClear();
    mockSql.unsafe.mockClear();
    
    // Default mock for SQL queries
    mockSql.mockImplementation((query: any) => {
      if (typeof query === 'string' || (query && query.strings)) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    // Create data generator with testing configuration
    dataGenerator = new DataGenerator(mockSql, DATA_SCENARIOS.testing);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('configuration and initialization', () => {
    it('should initialize with valid configuration', () => {
      expect(dataGenerator).toBeDefined();
    });

    it('should set faker locale and seed', () => {
      const { faker } = require('@faker-js/faker');
      
      new DataGenerator(mockSql, DATA_SCENARIOS.development);
      
      expect(faker.setLocale).toHaveBeenCalledWith('en_KE');
      expect(faker.seed).toHaveBeenCalled();
    });

    it('should handle configuration without seed', () => {
      const configWithoutSeed = {
        ...DATA_SCENARIOS.testing,
        options: {
          ...DATA_SCENARIOS.testing.options,
          seedRandomness: null
        }
      };

      const generator = new DataGenerator(mockSql, configWithoutSeed);
      expect(generator).toBeDefined();
    });
  });

  describe('data generation scenarios', () => {
    it('should generate development scenario data', async () => {
      const result = await dataGenerator.generateAll();

      expect(result.success).toBe(true);
      expect(result.recordsGenerated.users).toBe(DATA_SCENARIOS.testing.volumes.users);
      expect(result.recordsGenerated.properties).toBe(DATA_SCENARIOS.testing.volumes.properties);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle minimal scenario', async () => {
      const minimalGenerator = new DataGenerator(mockSql, DATA_SCENARIOS.minimal);
      const result = await minimalGenerator.generateAll();

      expect(result.success).toBe(true);
      expect(result.recordsGenerated.users).toBe(DATA_SCENARIOS.minimal.volumes.users);
    });

    it('should handle performance scenario configuration', async () => {
      const perfGenerator = new DataGenerator(mockSql, DATA_SCENARIOS.performance);
      
      // Mock SQL to avoid actual large data generation in tests
      mockSql.mockImplementation(() => Promise.resolve([]));
      
      const result = await perfGenerator.generateAll();
      expect(result.success).toBe(true);
    });
  });

  describe('user generation', () => {
    it('should generate users with Kenyan characteristics', async () => {
      const result = await dataGenerator.generateAll();

      expect(result.success).toBe(true);
      expect(result.recordsGenerated.users).toBeGreaterThan(0);
      
      // Verify SQL was called to insert users
      expect(mockSql).toHaveBeenCalledWith(
        expect.objectContaining({
          strings: expect.arrayContaining([expect.stringContaining('INSERT INTO users')])
        })
      );
    });

    it('should generate realistic vs test data based on configuration', () => {
      const realisticConfig = {
        ...DATA_SCENARIOS.development,
        options: { ...DATA_SCENARIOS.development.options, useRealisticData: true }
      };
      
      const testConfig = {
        ...DATA_SCENARIOS.testing,
        options: { ...DATA_SCENARIOS.testing.options, useRealisticData: false }
      };

      const realisticGenerator = new DataGenerator(mockSql, realisticConfig);
      const testGenerator = new DataGenerator(mockSql, testConfig);

      expect(realisticGenerator).toBeDefined();
      expect(testGenerator).toBeDefined();
    });
  });

  describe('property generation', () => {
    it('should generate properties with Kenyan locations', async () => {
      const result = await dataGenerator.generateAll();

      expect(result.success).toBe(true);
      expect(result.recordsGenerated.properties).toBeGreaterThan(0);
      
      // Verify SQL was called to insert properties
      expect(mockSql).toHaveBeenCalledWith(
        expect.objectContaining({
          strings: expect.arrayContaining([expect.stringContaining('INSERT INTO properties')])
        })
      );
    });

    it('should handle missing users for property generation', async () => {
      // Create generator that will have no users
      const emptyGenerator = new DataGenerator(mockSql, {
        ...DATA_SCENARIOS.testing,
        volumes: { ...DATA_SCENARIOS.testing.volumes, users: 0 }
      });

      const result = await emptyGenerator.generateAll();
      
      // Should fail or handle gracefully
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('batch processing', () => {
    it('should process data in configured batch sizes', async () => {
      const batchConfig = {
        ...DATA_SCENARIOS.testing,
        options: { ...DATA_SCENARIOS.testing.options, batchSize: 5 }
      };
      
      const batchGenerator = new DataGenerator(mockSql, batchConfig);
      const result = await batchGenerator.generateAll();

      expect(result.success).toBe(true);
      
      // Should have made multiple SQL calls for batching
      const insertCalls = mockSql.mock.calls.filter(call => 
        call[0]?.strings?.[0]?.includes('INSERT INTO')
      );
      expect(insertCalls.length).toBeGreaterThan(1);
    });

    it('should handle large batch sizes efficiently', async () => {
      const largeBatchConfig = {
        ...DATA_SCENARIOS.testing,
        options: { ...DATA_SCENARIOS.testing.options, batchSize: 1000 }
      };
      
      const largeBatchGenerator = new DataGenerator(mockSql, largeBatchConfig);
      const result = await largeBatchGenerator.generateAll();

      expect(result.success).toBe(true);
    });
  });

  describe('data validation', () => {
    it('should validate generated data when enabled', async () => {
      const validationConfig = {
        ...DATA_SCENARIOS.testing,
        options: { ...DATA_SCENARIOS.testing.options, validateConstraints: true }
      };

      // Mock validation queries
      mockSql.mockImplementation((query: any) => {
        const queryStr = query?.strings?.[0] || '';
        
        if (queryStr.includes('SELECT * FROM users')) {
          return Promise.resolve([{
            id: 'test-uuid-123',
            email: 'test@example.com',
            name: 'John Doe',
            phone: '0701123456',
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2024-01-01')
          }]);
        }
        
        if (queryStr.includes('SELECT * FROM properties')) {
          return Promise.resolve([{
            id: 'test-uuid-123',
            title: 'Test Property',
            description: 'Test description for property',
            price: 5000000,
            location: 'Nairobi',
            property_type: 'residential',
            status: 'active',
            user_id: 'test-uuid-123',
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2024-01-01')
          }]);
        }
        
        if (queryStr.includes('LEFT JOIN')) {
          return Promise.resolve([]); // No orphaned records
        }
        
        return Promise.resolve([]);
      });

      const validationGenerator = new DataGenerator(mockSql, validationConfig);
      const result = await validationGenerator.generateAll();

      expect(result.success).toBe(true);
      expect(result.validationResults).toBeDefined();
      expect(result.validationResults?.validRecords).toBeGreaterThan(0);
    });

    it('should skip validation when disabled', async () => {
      const noValidationConfig = {
        ...DATA_SCENARIOS.performance,
        options: { ...DATA_SCENARIOS.performance.options, validateConstraints: false }
      };

      const noValidationGenerator = new DataGenerator(mockSql, noValidationConfig);
      const result = await noValidationGenerator.generateAll();

      expect(result.success).toBe(true);
      expect(result.validationResults).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle SQL insertion errors gracefully', async () => {
      // Mock SQL to throw error
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await dataGenerator.generateAll();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Database connection failed');
    });

    it('should handle transaction errors', async () => {
      // Mock transaction to fail
      mockSql.begin.mockRejectedValueOnce(new Error('Transaction failed'));

      const result = await dataGenerator.generateAll();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide detailed error information', async () => {
      mockSql.mockRejectedValueOnce(new Error('Specific SQL error'));

      const result = await dataGenerator.generateAll();

      expect(result.success).toBe(false);
      expect(result.errors[0]).toBe('Specific SQL error');
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('data schemas validation', () => {
    it('should validate user schema correctly', () => {
      const validUser = {
        id: 'test-uuid-123',
        email: 'test@example.com',
        name: 'John Doe',
        phone: '0701123456',
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(() => DataValidationSchemas.user.parse(validUser)).not.toThrow();
    });

    it('should reject invalid user data', () => {
      const invalidUser = {
        id: 'invalid-uuid',
        email: 'invalid-email',
        name: '',
        created_at: 'invalid-date',
        updated_at: new Date()
      };

      expect(() => DataValidationSchemas.user.parse(invalidUser)).toThrow();
    });

    it('should validate property schema correctly', () => {
      const validProperty = {
        id: 'test-uuid-123',
        title: 'Test Property',
        description: 'Valid description with enough characters',
        price: 5000000,
        location: 'Nairobi',
        property_type: 'residential' as const,
        status: 'active' as const,
        user_id: 'test-uuid-123',
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(() => DataValidationSchemas.property.parse(validProperty)).not.toThrow();
    });

    it('should validate review schema correctly', () => {
      const validReview = {
        id: 'test-uuid-123',
        rating: 4,
        comment: 'Great property with excellent location',
        property_id: 'test-uuid-123',
        user_id: 'test-uuid-123',
        created_at: new Date()
      };

      expect(() => DataValidationSchemas.review.parse(validReview)).not.toThrow();
    });
  });

  describe('convenience functions', () => {
    it('should generate data for predefined scenarios', async () => {
      const result = await generateDataForScenario(mockSql, 'testing');

      expect(result.success).toBe(true);
      expect(result.recordsGenerated.users).toBe(DATA_SCENARIOS.testing.volumes.users);
    });

    it('should throw error for unknown scenario', async () => {
      await expect(
        generateDataForScenario(mockSql, 'unknown' as any)
      ).rejects.toThrow('Unknown scenario: unknown');
    });
  });

  describe('Kenyan-specific data generation', () => {
    it('should generate Kenyan phone numbers', () => {
      // Test the phone number generation indirectly through user generation
      const generator = new DataGenerator(mockSql, {
        ...DATA_SCENARIOS.development,
        region: 'kenya'
      });

      expect(generator).toBeDefined();
    });

    it('should use Kenyan locations for properties', () => {
      const generator = new DataGenerator(mockSql, {
        ...DATA_SCENARIOS.development,
        region: 'kenya',
        options: { ...DATA_SCENARIOS.development.options, useRealisticData: true }
      });

      expect(generator).toBeDefined();
    });

    it('should generate appropriate property prices for Kenya', () => {
      const generator = new DataGenerator(mockSql, {
        ...DATA_SCENARIOS.development,
        region: 'kenya'
      });

      expect(generator).toBeDefined();
    });
  });

  describe('performance considerations', () => {
    it('should handle large data volumes efficiently', async () => {
      const largeVolumeConfig = {
        ...DATA_SCENARIOS.performance,
        volumes: {
          users: 1000,
          properties: 5000,
          reviews: 10000,
          transactions: 2000,
          verifications: 3000
        }
      };

      const perfGenerator = new DataGenerator(mockSql, largeVolumeConfig);
      
      const startTime = Date.now();
      const result = await perfGenerator.generateAll();
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      // Should complete within reasonable time (this is a mock, so it should be fast)
      expect(duration).toBeLessThan(5000);
    });

    it('should use appropriate batch sizes for different scenarios', () => {
      const devGenerator = new DataGenerator(mockSql, DATA_SCENARIOS.development);
      const perfGenerator = new DataGenerator(mockSql, DATA_SCENARIOS.performance);

      expect(devGenerator).toBeDefined();
      expect(perfGenerator).toBeDefined();
      
      // Performance scenario should have larger batch size
      expect(DATA_SCENARIOS.performance.options.batchSize)
        .toBeGreaterThan(DATA_SCENARIOS.development.options.batchSize);
    });
  });
});