/**
 * Test data fixtures and factory functions
 */

import { vi } from 'vitest';

// Base fixture interfaces
export interface TestUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'agent' | 'admin';
  trustScore: number;
  isVerifiedAgent: boolean;
  verificationLevel: 'unverified' | 'basic' | 'verified' | 'premium';
  bio?: string;
  joinedAt: string;
  preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    language: string;
    timezone: string;
    currency: string;
  };
}

export interface TestProperty {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  imageUrls: string[];
  features: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    parkingSpaces: number;
    yearBuilt: number;
    amenities: string[];
    propertyType: string;
  };
  status: 'pending' | 'verified' | 'rejected';
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  trustScore: number;
}

export interface TestReview {
  id: number;
  propertyId: string;
  userId: number;
  rating: number;
  comment: string;
  createdAt: string;
  helpfulCount: number;
  user?: TestUser;
}

// Factory functions for creating test data
export class TestDataFactory {
  private static userIdCounter = 1;
  private static propertyIdCounter = 1;
  private static reviewIdCounter = 1;

  /**
   * Create a test user with optional overrides
   */
  static createUser(overrides: Partial<TestUser> = {}): TestUser {
    const id = overrides.id || this.userIdCounter++;
    
    return {
      id,
      username: `user${id}`,
      email: `user${id}@example.com`,
      firstName: `User`,
      lastName: `${id}`,
      role: 'user',
      trustScore: 75,
      isVerifiedAgent: false,
      verificationLevel: 'basic',
      bio: `Test user ${id} bio`,
      joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
        language: 'en',
        timezone: 'Africa/Nairobi',
        currency: 'KES',
      },
      ...overrides,
    };
  }

  /**
   * Create a verified agent user
   */
  static createAgent(overrides: Partial<TestUser> = {}): TestUser {
    return this.createUser({
      role: 'agent',
      trustScore: 90,
      isVerifiedAgent: true,
      verificationLevel: 'verified',
      bio: 'Experienced real estate agent',
      ...overrides,
    });
  }

  /**
   * Create an admin user
   */
  static createAdmin(overrides: Partial<TestUser> = {}): TestUser {
    return this.createUser({
      role: 'admin',
      trustScore: 100,
      verificationLevel: 'premium',
      bio: 'System administrator',
      ...overrides,
    });
  }

  /**
   * Create a test property with optional overrides
   */
  static createProperty(overrides: Partial<TestProperty> = {}): TestProperty {
    const id = overrides.id || String(this.propertyIdCounter++);
    const now = new Date().toISOString();
    
    return {
      id,
      title: `Test Property ${id}`,
      description: `Beautiful test property ${id} with modern amenities`,
      location: 'Nairobi, Kenya',
      price: 15000000 + Math.floor(Math.random() * 30000000),
      imageUrls: [
        `/test-property-${id}-1.jpg`,
        `/test-property-${id}-2.jpg`,
      ],
      features: {
        bedrooms: 2 + Math.floor(Math.random() * 4),
        bathrooms: 1 + Math.floor(Math.random() * 3),
        squareFeet: 800 + Math.floor(Math.random() * 2000),
        parkingSpaces: Math.floor(Math.random() * 3),
        yearBuilt: 2000 + Math.floor(Math.random() * 24),
        amenities: ['Swimming Pool', 'Gym', '24/7 Security'],
        propertyType: 'Apartment',
      },
      status: 'verified',
      ownerId: 1,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      verificationStatus: 'verified',
      trustScore: 85 + Math.floor(Math.random() * 15),
      ...overrides,
    };
  }

  /**
   * Create a test review with optional overrides
   */
  static createReview(overrides: Partial<TestReview> = {}): TestReview {
    const id = overrides.id || this.reviewIdCounter++;
    
    return {
      id,
      propertyId: '1',
      userId: 1,
      rating: 4 + Math.floor(Math.random() * 2), // 4 or 5 stars
      comment: `Great property! Test review ${id}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      helpfulCount: Math.floor(Math.random() * 10),
      ...overrides,
    };
  }

  /**
   * Create multiple users
   */
  static createUsers(count: number, overrides: Partial<TestUser> = {}): TestUser[] {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  /**
   * Create multiple properties
   */
  static createProperties(count: number, overrides: Partial<TestProperty> = {}): TestProperty[] {
    return Array.from({ length: count }, () => this.createProperty(overrides));
  }

  /**
   * Create multiple reviews
   */
  static createReviews(count: number, overrides: Partial<TestReview> = {}): TestReview[] {
    return Array.from({ length: count }, () => this.createReview(overrides));
  }

  /**
   * Reset all counters (useful for test isolation)
   */
  static reset(): void {
    this.userIdCounter = 1;
    this.propertyIdCounter = 1;
    this.reviewIdCounter = 1;
  }
}

// Predefined test scenarios
export const testScenarios = {
  // Basic user with one property
  singleUserWithProperty: () => {
    const user = TestDataFactory.createUser();
    const property = TestDataFactory.createProperty({ ownerId: user.id });
    return { user, property };
  },

  // Agent with multiple properties
  agentWithProperties: (propertyCount = 3) => {
    const agent = TestDataFactory.createAgent();
    const properties = TestDataFactory.createProperties(propertyCount, { ownerId: agent.id });
    return { agent, properties };
  },

  // Property with reviews
  propertyWithReviews: (reviewCount = 5) => {
    const property = TestDataFactory.createProperty();
    const users = TestDataFactory.createUsers(reviewCount);
    const reviews = users.map((user, index) => 
      TestDataFactory.createReview({
        propertyId: property.id,
        userId: user.id,
        user,
      })
    );
    return { property, users, reviews };
  },

  // Complete marketplace scenario
  marketplace: () => {
    const users = TestDataFactory.createUsers(10);
    const agents = [
      TestDataFactory.createAgent(),
      TestDataFactory.createAgent(),
    ];
    const admin = TestDataFactory.createAdmin();
    
    const properties = [
      ...TestDataFactory.createProperties(5, { ownerId: agents[0]?.id ?? 1 }),
      ...TestDataFactory.createProperties(3, { ownerId: agents[1]?.id ?? 2 }),
      ...TestDataFactory.createProperties(2, { ownerId: users[0]?.id ?? 3 }),
    ];

    const reviews = properties.flatMap(property => 
      TestDataFactory.createReviews(
        Math.floor(Math.random() * 5) + 1,
        { propertyId: property.id }
      )
    );

    return {
      users: [...users, ...agents, admin],
      agents,
      admin,
      properties,
      reviews,
    };
  },
};

// Mock API response helpers
export const createMockApiResponse = <T>(
  data: T,
  options: {
    success?: boolean;
    message?: string;
    status?: number;
    delay?: number;
  } = {}
) => {
  const { success = true, message = 'Success', status = 200, delay = 0 } = options;

  const response = {
    success,
    data: success ? data : undefined,
    error: success ? undefined : (typeof data === 'string' ? data : 'An error occurred'),
    message: success ? message : undefined,
  };

  if (delay > 0) {
    return new Promise(resolve => 
      setTimeout(() => resolve(response), delay)
    );
  }

  return response;
};

// Mock pagination response
export const createMockPaginatedResponse = <T>(
  items: T[],
  options: {
    page?: number;
    limit?: number;
    totalCount?: number;
  } = {}
) => {
  const { page = 1, limit = 20, totalCount = items.length } = options;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = items.slice(startIndex, endIndex);

  return createMockApiResponse({
    items: paginatedItems,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
    hasNextPage: endIndex < totalCount,
    hasPreviousPage: page > 1,
  });
};

// Test database utilities
export class TestDatabase {
  private static data: Map<string, any[]> = new Map();

  /**
   * Seed the test database with initial data
   */
  static seed(collections: Record<string, any[]>): void {
    Object.entries(collections).forEach(([collection, data]) => {
      this.data.set(collection, [...data]);
    });
  }

  /**
   * Get all items from a collection
   */
  static getCollection<T>(collection: string): T[] {
    return this.data.get(collection) || [];
  }

  /**
   * Add item to collection
   */
  static insert<T>(collection: string, item: T): T {
    const items = this.getCollection(collection);
    items.push(item);
    this.data.set(collection, items);
    return item;
  }

  /**
   * Find item by ID
   */
  static findById<T extends { id: any }>(collection: string, id: any): T | undefined {
    const items = this.getCollection<T>(collection);
    return items.find(item => item.id === id);
  }

  /**
   * Update item by ID
   */
  static updateById<T extends { id: any }>(
    collection: string, 
    id: any, 
    updates: Partial<T>
  ): T | undefined {
    const items = this.getCollection<T>(collection);
    const index = items.findIndex(item => item.id === id);
    
    if (index !== -1 && items[index]) {
      items[index] = { ...items[index], ...updates };
      return items[index];
    }
    
    return undefined;
  }

  /**
   * Delete item by ID
   */
  static deleteById<T extends { id: any }>(collection: string, id: any): boolean {
    const items = this.getCollection<T>(collection);
    const index = items.findIndex(item => item.id === id);
    
    if (index !== -1) {
      items.splice(index, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Clear all data
   */
  static clear(): void {
    this.data.clear();
  }

  /**
   * Clear specific collection
   */
  static clearCollection(collection: string): void {
    this.data.delete(collection);
  }
}

// File upload test utilities
export const createTestFile = (
  name: string,
  content: string | ArrayBuffer = 'test file content',
  type: string = 'text/plain'
): File => {
  return new File([content], name, { type });
};

export const createTestImageFile = (
  name: string = 'test-image.jpg',
  width: number = 100,
  height: number = 100
): File => {
  // Create a canvas and convert to blob
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Draw a simple test pattern
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, width / 2, height / 2);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(width / 2, 0, width / 2, height / 2);
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, height / 2, width / 2, height / 2);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(width / 2, height / 2, width / 2, height / 2);
  }

  // Convert canvas to blob synchronously for testing
  const dataURL = canvas.toDataURL('image/jpeg');
  const base64Data = dataURL.split(',')[1];
  if (!base64Data) {
    throw new Error('Failed to generate base64 data from canvas');
  }
  const byteString = atob(base64Data);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new File([arrayBuffer], name, { type: 'image/jpeg' });
};

// Performance testing utilities
export const measurePerformance = async <T>(
  operation: () => Promise<T> | T,
  label: string = 'Operation'
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`${label} took ${duration.toFixed(2)}ms`);
  
  return { result, duration };
};

// Wait utilities for async testing
export const waitFor = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await waitFor(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Mock localStorage for testing
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    key: vi.fn((index: number) => Object.keys(storage)[index] || null),
    get length() {
      return Object.keys(storage).length;
    },
  };
};

// Mock sessionStorage for testing
export const mockSessionStorage = mockLocalStorage;

// Export commonly used test data
export const commonTestData = {
  users: {
    regular: TestDataFactory.createUser(),
    agent: TestDataFactory.createAgent(),
    admin: TestDataFactory.createAdmin(),
  },
  properties: {
    apartment: TestDataFactory.createProperty({
      features: { ...TestDataFactory.createProperty().features, propertyType: 'Apartment' }
    }),
    house: TestDataFactory.createProperty({
      features: { ...TestDataFactory.createProperty().features, propertyType: 'House' }
    }),
    studio: TestDataFactory.createProperty({
      features: { 
        ...TestDataFactory.createProperty().features, 
        propertyType: 'Studio',
        bedrooms: 1,
        bathrooms: 1,
      }
    }),
  },
};