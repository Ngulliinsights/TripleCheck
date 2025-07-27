import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService } from '../AuthService';
import type { IStorage } from '../../storage';
import type { User, InsertUser } from '../../../src/shared/schema';
import type { LoginRequest, RegisterRequest, AuthenticatedRequest } from '../../types/auth.types';
import { AUTH_ERROR_MESSAGES } from '../../utils/error-messages';
import bcrypt from 'bcrypt';

// Mock bcrypt for consistent testing
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  }
}));

const mockBcrypt = bcrypt as any;

// Mock storage implementation for testing
class MockStorage implements IStorage {
  private users: User[] = [];
  private nextId = 1;
  private shouldThrowError = false;
  private errorMessage = 'Database error';

  // Test helper methods
  setError(shouldThrow: boolean, message = 'Database error') {
    this.shouldThrowError = shouldThrow;
    this.errorMessage = message;
  }

  reset() {
    this.users = [];
    this.nextId = 1;
    this.shouldThrowError = false;
  }

  addUser(user: Partial<User>): User {
    const newUser: User = {
      id: this.nextId++,
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'user',
      trustScore: 50,
      isVerifiedAgent: false,
      firstName: 'Test',
      lastName: 'User',
      phone: null,
      profileImageUrl: null,
      bio: null,
      isActive: true,
      lastLoginAt: null,
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...user,
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUser(id: number): Promise<User | null> {
    if (this.shouldThrowError) throw new Error(this.errorMessage);
    return this.users.find(user => user.id === id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (this.shouldThrowError) throw new Error(this.errorMessage);
    return this.users.find(user => user.username === username) || null;
  }

  async createUser(user: InsertUser): Promise<User> {
    if (this.shouldThrowError) throw new Error(this.errorMessage);
    const newUser: User = {
      id: this.nextId++,
      ...user,
      role: 'user',
      trustScore: 50,
      isVerifiedAgent: false,
      isActive: true,
      lastLoginAt: null,
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUserTrustScore(id: number, score: number): Promise<User> {
    if (this.shouldThrowError) throw new Error(this.errorMessage);
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    user.trustScore = score;
    user.updatedAt = new Date();
    return user;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    if (this.shouldThrowError) throw new Error(this.errorMessage);
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    user.password = hashedPassword;
    user.updatedAt = new Date();
  }

  // Stub implementations for other required methods
  async getProperty(): Promise<any> { return null; }
  async getProperties(): Promise<any> { return []; }
  async getPropertiesPaginated(): Promise<any> { return { items: [], totalCount: 0, currentPage: 1, totalPages: 0, hasNextPage: false, hasPreviousPage: false }; }
  async createProperty(): Promise<any> { return null; }
  async createPropertiesBatch(): Promise<any> { return { successful: [], failed: [], totalProcessed: 0 }; }
  async updateVerificationStatus(): Promise<any> { return null; }
  async searchProperties(): Promise<any> { return []; }
  async searchPropertiesWithFilters(): Promise<any> { return []; }
  async searchPropertiesWithFiltersPaginated(): Promise<any> { return { items: [], totalCount: 0, currentPage: 1, totalPages: 0, hasNextPage: false, hasPreviousPage: false }; }
  async getReviews(): Promise<any> { return []; }
  async getReviewsPaginated(): Promise<any> { return { items: [], totalCount: 0, currentPage: 1, totalPages: 0, hasNextPage: false, hasPreviousPage: false }; }
  async createReview(): Promise<any> { return null; }
  async searchLocations(): Promise<any> { return []; }
  async initializeDatabase(): Promise<void> { }
}

describe('AuthService', () => {
  let authService: AuthService;
  let mockStorage: MockStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = new MockStorage();
    authService = new AuthService(mockStorage);
    
    // Setup default bcrypt mocks
    mockBcrypt.hash.mockResolvedValue('$2b$10$hashedpassword');
    mockBcrypt.compare.mockImplementation((plain: string, hash: string) => {
      return Promise.resolve(plain === 'TestPassword123' && hash.includes('hashedpassword'));
    });
  });

  afterEach(() => {
    mockStorage.reset();
    // Clean up rate limiting entries
    AuthService.cleanupRateLimitEntries();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await authService.register(registerData);

      expect(result.user.username).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.firstName).toBe('Test');
      expect(result.user.lastName).toBe('User');
      expect('password' in result.user).toBe(false); // Password should not be in result
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw error if username already exists', async () => {
      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User',
      };

      // Register user first time
      await authService.register(registerData);

      // Try to register same username again
      await expect(authService.register(registerData))
        .rejects.toThrow(AUTH_ERROR_MESSAGES.USERNAME_EXISTS);
    });

    it('should hash the password before storing', async () => {
      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User',
      };

      await authService.register(registerData);

      const storedUser = await mockStorage.getUserByUsername('testuser');
      expect(storedUser?.password).not.toBe('TestPassword123');
      expect(storedUser?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a test user
      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User',
      };
      await authService.register(registerData);
    });

    it('should successfully login with valid credentials', async () => {
      const loginData: LoginRequest = {
        username: 'testuser',
        password: 'TestPassword123',
      };

      const result = await authService.login(loginData, 'test-client');

      expect(result.user.username).toBe('testuser');
      expect('password' in result.user).toBe(false); // Password should not be in result
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw error with invalid username', async () => {
      const loginData: LoginRequest = {
        username: 'nonexistent',
        password: 'TestPassword123',
      };

      await expect(authService.login(loginData, 'test-client'))
        .rejects.toThrow(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    });

    it('should throw error with invalid password', async () => {
      const loginData: LoginRequest = {
        username: 'testuser',
        password: 'WrongPassword',
      };

      await expect(authService.login(loginData, 'test-client'))
        .rejects.toThrow(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    });

    it('should enforce rate limiting', async () => {
      const loginData: LoginRequest = {
        username: 'testuser',
        password: 'WrongPassword',
      };

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await authService.login(loginData, 'test-client');
        } catch (error) {
          // Expected to fail
        }
      }

      // 6th attempt should be rate limited
      await expect(authService.login(loginData, 'test-client'))
        .rejects.toThrow(AUTH_ERROR_MESSAGES.RATE_LIMITED);
    });
  });

  describe('validateSession', () => {
    let userId: number;

    beforeEach(async () => {
      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User',
      };
      const result = await authService.register(registerData);
      userId = result.user.id;
    });

    it('should validate valid session', async () => {
      const result = await authService.validateSession(userId);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(userId);
      expect(result.user?.username).toBe('testuser');
      expect('password' in (result.user || {})).toBe(false);
    });

    it('should reject invalid user ID', async () => {
      const result = await authService.validateSession(999);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
    });

    it('should reject invalid session format', async () => {
      const result = await authService.validateSession(0);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(AUTH_ERROR_MESSAGES.INVALID_SESSION);
    });
  });

  describe('password operations', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await authService.hashPassword(password);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should validate credentials correctly', async () => {
      // Create a test user
      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User',
      };
      await authService.register(registerData);

      const validResult = await authService.validateCredentials('testuser', 'TestPassword123');
      expect(validResult).toBe(true);

      const invalidResult = await authService.validateCredentials('testuser', 'WrongPassword');
      expect(invalidResult).toBe(false);

      const nonexistentResult = await authService.validateCredentials('nonexistent', 'TestPassword123');
      expect(nonexistentResult).toBe(false);
    });
  });

  describe('validation methods', () => {
    it('should validate password strength', () => {
      const weakPassword = authService.validatePasswordStrength('weak');
      expect(weakPassword.valid).toBe(false);
      expect(weakPassword.errors.length).toBeGreaterThan(0);

      const strongPassword = authService.validatePasswordStrength('StrongPassword123');
      expect(strongPassword.valid).toBe(true);
      expect(strongPassword.errors.length).toBe(0);
    });

    it('should validate username format', () => {
      const shortUsername = authService.validateUsername('ab');
      expect(shortUsername.valid).toBe(false);
      expect(shortUsername.errors.length).toBeGreaterThan(0);

      const invalidUsername = authService.validateUsername('user@name');
      expect(invalidUsername.valid).toBe(false);
      expect(invalidUsername.errors.length).toBeGreaterThan(0);

      const validUsername = authService.validateUsername('valid_username123');
      expect(validUsername.valid).toBe(true);
      expect(validUsername.errors.length).toBe(0);
    });
  });

  describe('session management', () => {
    it('should manage session correctly', () => {
      const mockReq = {
        session: {
          userId: undefined,
          lastActivity: undefined,
          destroy: vi.fn((callback) => callback()),
        },
      } as unknown as AuthenticatedRequest;

      // Set session
      authService.setUserSession(mockReq, 123);
      expect(mockReq.session?.userId).toBe(123);
      expect(mockReq.session?.lastActivity).toBeDefined();

      // Get user ID from session
      const userId = authService.getUserIdFromSession(mockReq);
      expect(userId).toBe(123);

      // Check session validity
      const isValid = authService.isSessionValid(mockReq);
      expect(isValid).toBe(true);

      // Update session activity
      const oldActivity = mockReq.session?.lastActivity;
      setTimeout(() => {
        authService.updateSessionActivity(mockReq);
        expect(mockReq.session?.lastActivity).not.toBe(oldActivity);
      }, 10);
    });

    it('should handle missing session gracefully', () => {
      const mockReq = {} as AuthenticatedRequest;

      // Should not throw when session is undefined
      authService.setUserSession(mockReq, 123);
      
      const userId = authService.getUserIdFromSession(mockReq);
      expect(userId).toBeNull();

      const isValid = authService.isSessionValid(mockReq);
      expect(isValid).toBe(false);

      authService.updateSessionActivity(mockReq);
      // Should not throw
    });

    it('should handle session destruction errors', async () => {
      const mockReq = {
        session: {
          userId: 123,
          lastActivity: new Date().toISOString(),
          destroy: vi.fn((callback) => callback(new Error('Session destruction failed'))),
        },
      } as unknown as AuthenticatedRequest;

      await expect(authService.clearUserSession(mockReq))
        .rejects.toThrow(AUTH_ERROR_MESSAGES.LOGOUT_FAILED);
    });

    it('should validate session expiry', () => {
      const mockReq = {
        session: {
          userId: 123,
          lastActivity: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        },
      } as unknown as AuthenticatedRequest;

      const isValid = authService.isSessionValid(mockReq, 24 * 60 * 60 * 1000); // 24 hour max age
      expect(isValid).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle database errors during registration', async () => {
      mockStorage.setError(true, 'Database connection failed');

      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User',
      };

      await expect(authService.register(registerData))
        .rejects.toThrow(AUTH_ERROR_MESSAGES.REGISTRATION_FAILED);
    });

    it('should handle database errors during login', async () => {
      // Use a unique client ID to avoid rate limiting from other tests
      const uniqueClientId = 'db-error-test-client';
      
      // First register a user successfully
      mockStorage.setError(false); // Ensure registration works
      const registerData: RegisterRequest = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User',
      };
      await authService.register(registerData);

      // Then simulate database error
      mockStorage.setError(true, 'Database connection failed');

      const loginData: LoginRequest = {
        username: 'testuser2',
        password: 'TestPassword123',
      };

      await expect(authService.login(loginData, uniqueClientId))
        .rejects.toThrow(AUTH_ERROR_MESSAGES.LOGIN_FAILED);
    });

    it('should handle bcrypt errors during password hashing', async () => {
      mockBcrypt.hash.mockRejectedValue(new Error('Bcrypt error'));

      await expect(authService.hashPassword('password'))
        .rejects.toThrow('Password hashing failed');
    });

    it('should handle bcrypt errors during credential validation', async () => {
      // Create a user first
      mockStorage.addUser({ username: 'testuser', password: 'hashedpassword' });
      
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

      const result = await authService.validateCredentials('testuser', 'password');
      expect(result).toBe(false);
    });

    it('should handle database errors during session validation', async () => {
      mockStorage.setError(true, 'Database connection failed');

      const result = await authService.validateSession(123);
      expect(result.valid).toBe(false);
      expect(result.error).toBe(AUTH_ERROR_MESSAGES.INVALID_SESSION);
    });
  });

  describe('rate limiting', () => {
    it('should track failed attempts correctly', async () => {
      const clientId = 'rate-limit-test-client';
      
      // Clear any existing rate limit data for this client
      (AuthService as any).loginAttempts.delete(clientId);
      
      // Check initial rate limit status
      const initialStatus = authService.getRateLimitStatus(clientId);
      expect(initialStatus.allowed).toBe(true);
      expect(initialStatus.attemptsRemaining).toBe(5);

      // Make some failed attempts
      const loginData: LoginRequest = {
        username: 'nonexistent',
        password: 'wrongpassword',
      };

      for (let i = 0; i < 3; i++) {
        try {
          await authService.login(loginData, clientId);
        } catch (error) {
          // Expected to fail
        }
      }

      // Check rate limit status after failed attempts
      const statusAfterAttempts = authService.getRateLimitStatus(clientId);
      expect(statusAfterAttempts.allowed).toBe(true);
      expect(statusAfterAttempts.attemptsRemaining).toBe(2);
    });

    it('should reset rate limit after time window', () => {
      const clientId = 'test-client';
      
      // Simulate old failed attempts
      const oldTimestamp = Date.now() - 20 * 60 * 1000; // 20 minutes ago
      (AuthService as any).loginAttempts.set(clientId, {
        count: 5,
        lastAttempt: oldTimestamp
      });

      // Check rate limit status - should be reset
      const status = authService.getRateLimitStatus(clientId);
      expect(status.allowed).toBe(true);
      expect(status.attemptsRemaining).toBe(5);
    });

    it('should clean up expired rate limit entries', () => {
      const clientId1 = 'client1';
      const clientId2 = 'client2';
      
      // Add some entries with different timestamps
      (AuthService as any).loginAttempts.set(clientId1, {
        count: 3,
        lastAttempt: Date.now() - 20 * 60 * 1000 // 20 minutes ago (expired)
      });
      
      (AuthService as any).loginAttempts.set(clientId2, {
        count: 2,
        lastAttempt: Date.now() - 5 * 60 * 1000 // 5 minutes ago (not expired)
      });

      AuthService.cleanupRateLimitEntries();

      // Check that expired entry was removed
      expect((AuthService as any).loginAttempts.has(clientId1)).toBe(false);
      expect((AuthService as any).loginAttempts.has(clientId2)).toBe(true);
    });
  });

  describe('user retrieval methods', () => {
    beforeEach(async () => {
      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User',
      };
      await authService.register(registerData);
    });

    it('should get user by ID without password', async () => {
      const user = await authService.getUserById(1);
      
      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
      expect('password' in (user || {})).toBe(false);
    });

    it('should return null for non-existent user ID', async () => {
      const user = await authService.getUserById(999);
      expect(user).toBeNull();
    });

    it('should get user by username without password', async () => {
      const user = await authService.getUserByUsername('testuser');
      
      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
      expect('password' in (user || {})).toBe(false);
    });

    it('should return null for non-existent username', async () => {
      const user = await authService.getUserByUsername('nonexistent');
      expect(user).toBeNull();
    });

    it('should handle database errors in user retrieval', async () => {
      mockStorage.setError(true, 'Database error');

      const userById = await authService.getUserById(1);
      expect(userById).toBeNull();

      const userByUsername = await authService.getUserByUsername('testuser');
      expect(userByUsername).toBeNull();
    });
  });

  describe('edge cases and validation', () => {
    it('should handle empty and invalid inputs', async () => {
      // Test empty username in login
      await expect(authService.login({ username: '', password: 'password' }, 'client'))
        .rejects.toThrow();

      // Test empty password in login
      await expect(authService.login({ username: 'user', password: '' }, 'client'))
        .rejects.toThrow();

      // Test invalid session IDs
      const result1 = await authService.validateSession(-1);
      expect(result1.valid).toBe(false);

      const result2 = await authService.validateSession(0);
      expect(result2.valid).toBe(false);
    });

    it('should validate password strength edge cases', () => {
      const testCases = [
        { password: '', expectedValid: false },
        { password: '1234567', expectedValid: false }, // Too short
        { password: 'password', expectedValid: false }, // No uppercase, no numbers
        { password: 'PASSWORD', expectedValid: false }, // No lowercase, no numbers
        { password: 'Password', expectedValid: false }, // No numbers
        { password: 'password123', expectedValid: false }, // No uppercase
        { password: 'PASSWORD123', expectedValid: false }, // No lowercase
        { password: 'Password123', expectedValid: true }, // Valid
      ];

      testCases.forEach(({ password, expectedValid }) => {
        const result = authService.validatePasswordStrength(password);
        expect(result.valid).toBe(expectedValid);
      });
    });

    it('should validate username edge cases', () => {
      const testCases = [
        { username: '', expectedValid: false },
        { username: 'ab', expectedValid: false }, // Too short
        { username: 'a'.repeat(31), expectedValid: false }, // Too long
        { username: 'user@name', expectedValid: false }, // Invalid characters
        { username: 'user name', expectedValid: false }, // Spaces not allowed
        { username: 'user-name', expectedValid: false }, // Hyphens not allowed
        { username: 'username123', expectedValid: true }, // Valid
        { username: 'user_name', expectedValid: true }, // Underscores allowed
      ];

      testCases.forEach(({ username, expectedValid }) => {
        const result = authService.validateUsername(username);
        expect(result.valid).toBe(expectedValid);
      });
    });
  });
});