import { vi } from 'vitest';

// Mock the storage module to avoid database connection issues during testing
vi.mock('../storage', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockProperty = {
    id: 1,
    title: 'Test Property',
    description: 'A test property',
    location: 'Test Location',
    price: 100000,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'house',
    ownerId: 1,
    verificationStatus: 'pending',
    imageUrls: [],
    features: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return {
    storage: {
      // User methods
      createUser: vi.fn().mockResolvedValue({ ...mockUser, password: process.env.TEST_HASHED_PASSWORD || 'hashedpassword' }),
      getUserByUsername: vi.fn().mockResolvedValue({ ...mockUser, password: process.env.TEST_HASHED_PASSWORD || 'hashedpassword' }),
      getUser: vi.fn().mockResolvedValue(mockUser),
      deleteUser: vi.fn().mockResolvedValue(undefined),
      
      // Property methods
      createProperty: vi.fn().mockResolvedValue(mockProperty),
      getProperty: vi.fn().mockResolvedValue(mockProperty),
      getProperties: vi.fn().mockResolvedValue([mockProperty]),
      searchProperties: vi.fn().mockResolvedValue([mockProperty]),
      updateProperty: vi.fn().mockResolvedValue({ ...mockProperty, title: 'Updated Property' }),
      deleteProperty: vi.fn().mockResolvedValue(undefined),
      
      // Review methods
      createReview: vi.fn().mockResolvedValue({
        id: 1,
        propertyId: 1,
        userId: 1,
        rating: 5,
        comment: 'Great property!',
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      getPropertyReviews: vi.fn().mockResolvedValue([]),
      
      // Verification methods
      updateVerificationStatus: vi.fn().mockResolvedValue(undefined),
      getVerificationStatus: vi.fn().mockResolvedValue({
        verificationStatus: 'pending',
        lastVerified: new Date().toISOString()
      }),
      
      // Search methods
      searchLocations: vi.fn().mockResolvedValue([
        { id: 1, name: 'Test Location', description: 'A test location' }
      ])
    }
  };
});

// Mock the database initialization
vi.mock('../lib/database', () => ({
  initializeDatabase: vi.fn().mockResolvedValue(undefined),
  seedDatabase: vi.fn().mockResolvedValue(undefined)
}));

// Mock AI services
vi.mock('../ai-routes', () => ({
  detectFraud: vi.fn().mockResolvedValue({
    isSuspicious: false,
    suspiciousScore: 0.1,
    overallScore: 85,
    verificationTimestamp: new Date().toISOString(),
    imageAnalysis: {
      qualityScore: 90,
      authenticityScore: 95,
      flaggedIssues: []
    },
    descriptionAnalysis: {
      sentiment: 0.8,
      keywordFlags: [],
      qualityScore: 85
    },
    aiModel: 'test-model'
  })
}));

// Mock fraud detection engine
vi.mock('../fraud-detection/core/FraudDetectionEngine', () => ({
  FraudDetectionEngine: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    processTransaction: vi.fn().mockResolvedValue([]),
    shutdown: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://testuser:testpass@localhost:5432/testdb';
process.env.SESSION_SECRET = process.env.TEST_SESSION_SECRET || 'test-session-secret-for-testing-only';
process.env.GOOGLE_API_KEY = process.env.TEST_GOOGLE_API_KEY || 'test-api-key-for-testing-only';