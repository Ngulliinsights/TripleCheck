/**
 * Test Setup Configuration
 * Sets up the testing environment with proper mocks and configurations
 */

import { vi } from 'vitest';

// Mock environment variables - use test-specific values
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.TEST_SESSION_SECRET || 'test-session-secret-for-testing-only';

// Mock the storage module before any imports
vi.mock('../../storage', () => ({
  storage: {
    getUserByUsername: vi.fn(),
    createUser: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    createProperty: vi.fn(),
    getProperty: vi.fn(),
    updateProperty: vi.fn(),
    deleteProperty: vi.fn(),
    searchProperties: vi.fn(),
    getPropertiesByOwner: vi.fn(),
    createReview: vi.fn(),
    getReview: vi.fn(),
    getReviewsByProperty: vi.fn(),
    getReviewsByUser: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
  }
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('hashedpassword'),
  compare: vi.fn().mockResolvedValue(true),
}));

// Mock file system operations
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

// Mock path operations
vi.mock('path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
    extname: vi.fn((path) => '.jpg'),
    basename: vi.fn((path) => 'test-file.jpg'),
  },
  join: vi.fn((...args) => args.join('/')),
  extname: vi.fn((path) => '.jpg'),
  basename: vi.fn((path) => 'test-file.jpg'),
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};

export {};