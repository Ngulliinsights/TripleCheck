import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
  
  // Mock console methods to reduce noise
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  
  // Keep error logging for debugging
  const originalError = console.error;
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (process.env.DEBUG_TESTS === 'true') {
      originalError(...args);
    }
  });
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Global test utilities
global.testUtils = {
  // Create mock authenticated request
  createMockAuthRequest: (userId: number = 123) => ({
    session: { userId },
    user: {
      id: userId,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    }
  }),
  
  // Create mock response object
  createMockResponse: () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
  },
  
  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate test transaction data
  generateTestTransaction: (overrides: any = {}) => ({
    id: `TEST-TXN-${Date.now()}`,
    propertyId: `TEST-PROP-${Date.now()}`,
    amount: 500000,
    paymentMethod: 'wire',
    buyer: { id: 'BUYER-001', name: 'Test Buyer' },
    seller: { id: 'SELLER-001', name: 'Test Seller' },
    ...overrides
  }),
  
  // Generate test property data
  generateTestProperty: (overrides: any = {}) => ({
    id: `TEST-PROP-${Date.now()}`,
    title: 'Test Property',
    description: 'A test property for fraud detection',
    price: 500000,
    location: 'Test City',
    type: 'residential',
    ...overrides
  })
};

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toHaveValidFraudAlert(received: any) {
    const requiredFields = ['id', 'severity', 'category', 'confidence', 'timeframe'];
    const missingFields = requiredFields.filter(field => !(field in received));
    
    if (missingFields.length === 0) {
      return {
        message: () => `expected fraud alert to be invalid`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected fraud alert to have fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }
  }
});

// Type declarations for global utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidFraudAlert(): R;
    }
  }
  
  var testUtils: {
    createMockAuthRequest: (userId?: number) => any;
    createMockResponse: () => any;
    wait: (ms: number) => Promise<void>;
    generateTestTransaction: (overrides?: any) => any;
    generateTestProperty: (overrides?: any) => any;
  };
}