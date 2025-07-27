import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { storage } from '../infrastructure/storage/storage';
import { cacheService } from '../cache/CacheService';
import { structuredLogger } from '../monitoring/StructuredLogger';

// Test database setup
beforeAll(async () => {
  // Initialize test database
  await storage.initialize();
  
  // Initialize cache service for tests
  await cacheService.connect();
  
  // Set up test logging
  structuredLogger.info('Test suite starting');
});

afterAll(async () => {
  // Clean up test database
  await storage.cleanup?.();
  
  // Disconnect cache service
  await cacheService.disconnect();
  
  // Shutdown logger
  await structuredLogger.shutdown();
});

beforeEach(async () => {
  // Clear cache before each test
  await cacheService.clear();
});

afterEach(async () => {
  // Clean up any test data
  // This would be implemented based on your specific needs
});

// Test utilities
export const testUtils = {
  createTestUser: () => ({
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  }),

  createTestProperty: () => ({
    title: `Test Property ${Date.now()}`,
    description: 'A test property for unit testing purposes',
    price: 500000,
    location: 'Test City, Test Country',
    ownerId: 1,
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1500,
      propertyType: 'house' as const
    }
  }),

  createTestReview: (propertyId: number, userId: number) => ({
    propertyId,
    userId,
    rating: 4,
    comment: 'This is a test review for testing purposes'
  }),

  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  generateRandomString: (length: number = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  }
};