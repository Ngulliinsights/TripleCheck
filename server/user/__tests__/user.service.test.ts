/**
 * Unit tests for UserService
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { User } from '../../../src/shared/schema';

// Mock the storage module before importing UserService
vi.mock('../../storage', () => ({
  storage: {
    getUser: vi.fn(),
    updateUserTrustScore: vi.fn(),
    getProperties: vi.fn(),
    getReviews: vi.fn(),
  }
}));

import { UserService } from '../UserService';
import { storage } from '../../storage';

const mockStorage = storage as any;

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    vi.clearAllMocks();
  });

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'user',
    trustScore: 75,
    isVerifiedAgent: false,
    firstName: 'Test',
    lastName: 'User',
    phone: '+254700000001',
    profileImageUrl: null,
    bio: 'Test bio',
    isActive: true,
    lastLoginAt: new Date(),
    emailVerifiedAt: new Date(),
    createdAt: new Date(Date.now() - 86400000 * 30), // 30 days ago
    updatedAt: new Date()
  };

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);

      const result = await userService.getUserProfile(1);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(1);
      expect(result.data?.username).toBe('testuser');
      expect(result.data?.verificationLevel).toBe('verified'); // Based on emailVerifiedAt and trustScore >= 70
      expect(result.data?.profileCompleteness).toBeGreaterThan(0);
      expect(result.data).not.toHaveProperty('password');
    });

    it('should handle invalid user ID', async () => {
      const result = await userService.getUserProfile(0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid user ID');
      expect(mockStorage.getUser).not.toHaveBeenCalled();
    });

    it('should handle non-existent user', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      const result = await userService.getUserProfile(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);

      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio'
      };

      const result = await userService.updateUserProfile(1, updates);

      expect(result.success).toBe(true);
      expect(result.data?.firstName).toBe('Updated');
      expect(result.data?.lastName).toBe('Name');
      expect(result.data?.bio).toBe('Updated bio');
      expect(result.message).toBe('Profile updated successfully');
    });

    it('should validate profile update data', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);

      const updates = {
        firstName: '', // Invalid - empty string
      };

      const result = await userService.updateUserProfile(1, updates);

      expect(result.success).toBe(false);
      expect(result.error).toBe('First name must be between 1 and 100 characters');
    });

    it('should validate email format', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);

      const updates = {
        email: 'invalid-email' // Invalid email format
      };

      const result = await userService.updateUserProfile(1, updates);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should handle non-existent user', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      const result = await userService.updateUserProfile(999, { firstName: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('updateTrustScore', () => {
    it('should update trust score successfully', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);
      mockStorage.updateUserTrustScore.mockResolvedValue({ ...mockUser, trustScore: 80 });

      const result = await userService.updateTrustScore(1, 80, 'Good behavior');

      expect(result.success).toBe(true);
      expect(result.data?.userId).toBe(1);
      expect(result.data?.oldScore).toBe(75);
      expect(result.data?.newScore).toBe(80);
      expect(result.data?.reason).toBe('Good behavior');
      expect(result.message).toBe('Trust score updated from 75 to 80');
      expect(mockStorage.updateUserTrustScore).toHaveBeenCalledWith(1, 80);
    });

    it('should validate trust score range', async () => {
      const result = await userService.updateTrustScore(1, 150, 'Invalid score');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Trust score must be between 0 and 100');
      expect(mockStorage.updateUserTrustScore).not.toHaveBeenCalled();
    });

    it('should require reason for trust score update', async () => {
      const result = await userService.updateTrustScore(1, 80, '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Reason for trust score update is required');
      expect(mockStorage.updateUserTrustScore).not.toHaveBeenCalled();
    });

    it('should handle invalid user ID', async () => {
      const result = await userService.updateTrustScore(0, 80, 'Valid reason');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid user ID');
      expect(mockStorage.updateUserTrustScore).not.toHaveBeenCalled();
    });

    it('should handle non-existent user', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      const result = await userService.updateTrustScore(999, 80, 'Valid reason');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(mockStorage.updateUserTrustScore).not.toHaveBeenCalled();
    });
  });

  describe('getUserStatistics', () => {
    it('should get user statistics successfully', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);
      mockStorage.getProperties.mockResolvedValue([
        {
          id: 1,
          ownerId: 1,
          title: 'Property 1',
          description: 'Description',
          price: '100000',
          location: 'Location',
          address: 'Address',
          coordinates: null,
          imageUrls: [],
          verificationStatus: 'pending',
          features: null,
          isActive: true,
          isFeatured: false,
          viewCount: 0,
          favoriteCount: 0,
          verifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      mockStorage.getReviews.mockResolvedValue([
        {
          id: 1,
          propertyId: 1,
          userId: 2,
          rating: 5,
          comment: 'Great!',
          verified: false,
          helpfulCount: 0,
          reportCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      const result = await userService.getUserStatistics(1);

      expect(result.success).toBe(true);
      expect(result.data?.propertiesListed).toBe(1);
      expect(result.data?.reviewsReceived).toBe(1);
      expect(result.data?.averageRating).toBe(5);
      expect(result.data?.trustScore).toBe(75);
      expect(result.data?.verificationLevel).toBe('verified');
    });

    it('should handle user with no properties', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);
      mockStorage.getProperties.mockResolvedValue([]);

      const result = await userService.getUserStatistics(1);

      expect(result.success).toBe(true);
      expect(result.data?.propertiesListed).toBe(0);
      expect(result.data?.reviewsReceived).toBe(0);
      expect(result.data?.averageRating).toBe(0);
    });

    it('should handle non-existent user', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      const result = await userService.getUserStatistics(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('getUserPreferences', () => {
    it('should get user preferences successfully', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);

      const result = await userService.getUserPreferences(1);

      expect(result.success).toBe(true);
      expect(result.data?.emailNotifications).toBe(true);
      expect(result.data?.language).toBe('en');
      expect(result.data?.timezone).toBe('Africa/Nairobi');
      expect(result.data?.currency).toBe('KES');
    });

    it('should handle non-existent user', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      const result = await userService.getUserPreferences(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences successfully', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);

      const preferences = {
        emailNotifications: false,
        language: 'sw'
      };

      const result = await userService.updateUserPreferences(1, preferences);

      expect(result.success).toBe(true);
      expect(result.data?.emailNotifications).toBe(false);
      expect(result.data?.language).toBe('sw');
      expect(result.message).toBe('Preferences updated successfully');
    });

    it('should validate language preference', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);

      const preferences = {
        language: 'invalid' // Invalid language
      };

      const result = await userService.updateUserPreferences(1, preferences);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid language selection');
    });

    it('should validate currency preference', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);

      const preferences = {
        currency: 'INVALID' // Invalid currency
      };

      const result = await userService.updateUserPreferences(1, preferences);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid currency selection');
    });

    it('should handle non-existent user', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      const result = await userService.updateUserPreferences(999, { language: 'en' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('promoteToVerifiedAgent', () => {
    it('should promote user to verified agent successfully', async () => {
      const regularUser = { ...mockUser, isVerifiedAgent: false };
      mockStorage.getUser.mockResolvedValue(regularUser);

      const result = await userService.promoteToVerifiedAgent(1, 2);

      expect(result.success).toBe(true);
      expect(result.data?.isVerifiedAgent).toBe(true);
      expect(result.data?.verificationLevel).toBe('premium');
      expect(result.message).toBe('User promoted to verified agent successfully');
    });

    it('should prevent promoting already verified agent', async () => {
      const verifiedAgent = { ...mockUser, isVerifiedAgent: true };
      mockStorage.getUser.mockResolvedValue(verifiedAgent);

      const result = await userService.promoteToVerifiedAgent(1, 2);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User is already a verified agent');
    });

    it('should handle non-existent user', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      const result = await userService.promoteToVerifiedAgent(999, 2);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('getUserActivity', () => {
    it('should get user activity successfully', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);

      const result = await userService.getUserActivity(1);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data![0]).toHaveProperty('action');
      expect(result.data![0]).toHaveProperty('description');
      expect(result.data![0]).toHaveProperty('timestamp');
    });

    it('should handle pagination', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);

      const result = await userService.getUserActivity(1, { page: 1, limit: 2 });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeLessThanOrEqual(2);
    });

    it('should handle non-existent user', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      const result = await userService.getUserActivity(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('searchUsers', () => {
    it('should search users with filters', async () => {
      const result = await userService.searchUsers({
        role: 'user',
        trustScoreMin: 70,
        active: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle empty search results', async () => {
      const result = await userService.searchUsers({
        role: 'admin',
        trustScoreMin: 99
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by verification level', async () => {
      const result = await userService.searchUsers({
        verificationLevel: 'verified'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by date ranges', async () => {
      const result = await userService.searchUsers({
        joinedAfter: '2024-01-01',
        joinedBefore: '2024-12-31'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('getUserEngagementMetrics', () => {
    it('should get engagement metrics successfully', async () => {
      const result = await userService.getUserEngagementMetrics();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.totalUsers).toBeGreaterThanOrEqual(0);
      expect(result.data?.activeUsers).toBeGreaterThanOrEqual(0);
      expect(result.data?.averageTrustScore).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.data?.topContributors)).toBe(true);
    });

    it('should handle metrics calculation with no users', async () => {
      // Mock empty user list
      const originalGetAllUsers = (userService as any).getAllUsers;
      (userService as any).getAllUsers = vi.fn().mockResolvedValue({
        success: true,
        data: []
      });

      const result = await userService.getUserEngagementMetrics();

      expect(result.success).toBe(true);
      expect(result.data?.totalUsers).toBe(0);
      expect(result.data?.activeUsers).toBe(0);
      expect(result.data?.averageTrustScore).toBe(0);

      // Restore original method
      (userService as any).getAllUsers = originalGetAllUsers;
    });
  });

  describe('updateUserPassword', () => {
    it('should update user password successfully', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);
      mockStorage.updateUserPassword = vi.fn().mockResolvedValue(undefined);

      const result = await userService.updateUserPassword(1, 'newhashpassword');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password updated successfully');
      expect(mockStorage.updateUserPassword).toHaveBeenCalledWith(1, 'newhashpassword');
    });

    it('should validate password hash', async () => {
      const result = await userService.updateUserPassword(1, '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid password hash');
    });

    it('should handle non-existent user', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      const result = await userService.updateUserPassword(999, 'newhashpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);
      mockStorage.updateUserPassword = vi.fn().mockRejectedValue(new Error('Database error'));

      const result = await userService.updateUserPassword(1, 'newhashpassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update password');
    });
  });

  describe('error handling', () => {
    it('should handle database errors in all methods', async () => {
      const dbError = new Error('Database connection failed');

      mockStorage.getUser.mockRejectedValue(dbError);
      mockStorage.updateUserTrustScore.mockRejectedValue(dbError);
      mockStorage.getProperties.mockRejectedValue(dbError);

      const results = await Promise.allSettled([
        userService.getUserProfile(1),
        userService.updateUserProfile(1, { firstName: 'Updated' }),
        userService.updateTrustScore(1, 80, 'Test reason'),
        userService.getUserStatistics(1),
        userService.getUserPreferences(1),
        userService.updateUserPreferences(1, { language: 'sw' }),
        userService.promoteToVerifiedAgent(1, 2),
        userService.getUserActivity(1)
      ]);

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.success).toBe(false);
          expect(result.value.error).toBeDefined();
        }
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      mockStorage.getUser.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await userService.getUserProfile(1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get user profile');
    });
  });

  describe('validation edge cases', () => {
    beforeEach(() => {
      mockStorage.getUser.mockResolvedValue(mockUser);
    });

    it('should validate profile update fields thoroughly', async () => {
      const testCases = [
        {
          update: { firstName: '' },
          expectedError: 'First name must be between 1 and 100 characters'
        },
        {
          update: { firstName: 'A'.repeat(101) },
          expectedError: 'First name must be between 1 and 100 characters'
        },
        {
          update: { lastName: '' },
          expectedError: 'Last name must be between 1 and 100 characters'
        },
        {
          update: { email: 'invalid-email' },
          expectedError: 'Invalid email format'
        },
        {
          update: { email: '@invalid.com' },
          expectedError: 'Invalid email format'
        },
        {
          update: { phone: '123' },
          expectedError: 'Invalid phone number format'
        },
        {
          update: { bio: 'A'.repeat(501) },
          expectedError: 'Bio cannot exceed 500 characters'
        }
      ];

      for (const testCase of testCases) {
        const result = await userService.updateUserProfile(1, testCase.update);
        expect(result.success).toBe(false);
        expect(result.error).toBe(testCase.expectedError);
      }
    });

    it('should validate preferences thoroughly', async () => {
      const testCases = [
        {
          preferences: { language: 'invalid' },
          expectedError: 'Invalid language selection'
        },
        {
          preferences: { timezone: 'invalid' },
          expectedError: 'Invalid timezone format'
        },
        {
          preferences: { currency: 'INVALID' },
          expectedError: 'Invalid currency selection'
        }
      ];

      for (const testCase of testCases) {
        const result = await userService.updateUserPreferences(1, testCase.preferences);
        expect(result.success).toBe(false);
        expect(result.error).toBe(testCase.expectedError);
      }
    });

    it('should handle edge case trust scores', async () => {
      const testCases = [
        { score: -1, expectedError: 'Trust score must be between 0 and 100' },
        { score: 101, expectedError: 'Trust score must be between 0 and 100' },
        { score: 1000, expectedError: 'Trust score must be between 0 and 100' }
      ];

      for (const testCase of testCases) {
        const result = await userService.updateTrustScore(1, testCase.score, 'Test reason');
        expect(result.success).toBe(false);
        expect(result.error).toBe(testCase.expectedError);
      }
    });

    it('should handle invalid user IDs consistently', async () => {
      const invalidIds = [0, -1, null, undefined];

      for (const id of invalidIds) {
        const results = await Promise.all([
          userService.getUserProfile(id as any),
          userService.updateTrustScore(id as any, 80, 'Test reason'),
          userService.updateUserPassword(id as any, 'password')
        ]);

        results.forEach(result => {
          expect(result.success).toBe(false);
          expect(result.error).toContain('Invalid user ID');
        });
      }
    });
  });

  describe('verification level calculation', () => {
    it('should calculate verification levels correctly', async () => {
      const testUsers = [
        {
          user: { ...mockUser, emailVerifiedAt: null, trustScore: 30, isVerifiedAgent: false },
          expectedLevel: 'unverified'
        },
        {
          user: { ...mockUser, emailVerifiedAt: new Date(), trustScore: 50, isVerifiedAgent: false },
          expectedLevel: 'basic'
        },
        {
          user: { ...mockUser, emailVerifiedAt: new Date(), trustScore: 80, isVerifiedAgent: false },
          expectedLevel: 'verified'
        },
        {
          user: { ...mockUser, emailVerifiedAt: new Date(), trustScore: 90, isVerifiedAgent: true },
          expectedLevel: 'premium'
        }
      ];

      for (const testCase of testUsers) {
        mockStorage.getUser.mockResolvedValue(testCase.user);
        
        const result = await userService.getUserProfile(testCase.user.id);
        
        expect(result.success).toBe(true);
        expect(result.data?.verificationLevel).toBe(testCase.expectedLevel);
      }
    });
  });

  describe('profile completeness calculation', () => {
    it('should calculate profile completeness correctly', async () => {
      const incompleteUser = {
        ...mockUser,
        firstName: null,
        lastName: null,
        phone: null,
        bio: null,
        profileImageUrl: null,
        emailVerifiedAt: null
      };

      mockStorage.getUser.mockResolvedValue(incompleteUser);

      const result = await userService.getUserProfile(1);

      expect(result.success).toBe(true);
      expect(result.data?.profileCompleteness).toBeLessThan(50);
    });

    it('should give bonus for email verification', async () => {
      const verifiedUser = {
        ...mockUser,
        emailVerifiedAt: new Date()
      };

      mockStorage.getUser.mockResolvedValue(verifiedUser);

      const result = await userService.getUserProfile(1);

      expect(result.success).toBe(true);
      expect(result.data?.profileCompleteness).toBeGreaterThan(80);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent profile updates', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);

      const promises = Array.from({ length: 5 }, (_, i) =>
        userService.updateUserProfile(1, { firstName: `Name${i}` })
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle concurrent trust score updates', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);
      mockStorage.updateUserTrustScore.mockResolvedValue({ ...mockUser, trustScore: 80 });

      const promises = Array.from({ length: 3 }, (_, i) =>
        userService.updateTrustScore(1, 80 + i, `Reason ${i}`)
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('getUserById', () => {
    it('should get user by ID including password for internal operations', async () => {
      mockStorage.getUser.mockResolvedValue(mockUser);

      const user = await userService.getUserById(1);

      expect(user).toBeDefined();
      expect(user?.id).toBe(1);
      expect(user?.password).toBeDefined(); // Should include password for internal operations
    });

    it('should return null for invalid ID', async () => {
      const user = await userService.getUserById(0);
      expect(user).toBeNull();
    });

    it('should handle database errors', async () => {
      mockStorage.getUser.mockRejectedValue(new Error('Database error'));

      const user = await userService.getUserById(1);
      expect(user).toBeNull();
    });
  });
});