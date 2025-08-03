/**
 * UserService - Handles user profile management and trust score updates
 * 
 * This service provides comprehensive user management functionality including
 * profile updates, trust score management, user statistics, and preferences.
 */

import { z } from "zod";

import type { User, InsertUser } from "../../src/shared/schema";
import { insertUserSchema } from "../../src/shared/schema";
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  DatabaseError,
  generateCorrelationId 
} from "../../src/shared/utils/errors";
import { storage } from "../infrastructure/storage/storage";
import type { PaginationParams, PaginatedResult } from "../infrastructure/storage/storage";
import type { 
  UserProfile,
  UserProfileUpdateRequest,
  UserStatistics,
  UserPreferences,
  UserActivity,
  UserSearchFilters,
  UserWithoutPassword,
  UserRole
} from "../types/user.types";



export interface UserServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TrustScoreUpdate {
  userId: number;
  oldScore: number;
  newScore: number;
  reason: string;
  adjustedBy?: number; // Admin user ID if manually adjusted
  timestamp: string;
}

export interface UserEngagementMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  averageTrustScore: number;
  verifiedAgents: number;
  topContributors: {
    userId: number;
    username: string;
    contributionScore: number;
    trustScore: number;
  }[];
}

/**
 * UserService handles all user management business logic beyond authentication
 */
export class UserService {
  /**
   * Get user by ID (including password for internal operations)
   */
  async getUserById(userId: number): Promise<User | null> {
    try {
      if (!userId || userId <= 0) {
        return null;
      }

      return await storage.getUser(userId);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Update user password
   */
  async updateUserPassword(userId: number, hashedPassword: string): Promise<UserServiceResult<void>> {
    try {
      if (!userId || userId <= 0) {
        return {
          success: false,
          error: 'Invalid user ID'
        };
      }

      if (!hashedPassword || hashedPassword.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid password hash'
        };
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Update password in storage
      await storage.updateUserPassword(userId, hashedPassword);

      return {
        success: true,
        message: 'Password updated successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to update password: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get user profile with additional metadata
   */
  async getUserProfile(userId: number): Promise<UserServiceResult<UserProfile>> {
    try {
      if (!userId || userId <= 0) {
        return {
          success: false,
          error: 'Invalid user ID'
        };
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Remove password and add profile metadata
      const { password: _, ...userWithoutPassword } = user;
      
      const profile: UserProfile = {
        ...userWithoutPassword,
        verificationLevel: this.determineVerificationLevel(user),
        joinedAt: user.createdAt.toISOString(),
        lastActive: user.lastLoginAt?.toISOString(),
        profileCompleteness: this.calculateProfileCompleteness(user)
      };

      return {
        success: true,
        data: profile
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(
    userId: number, 
    updates: UserProfileUpdateRequest
  ): Promise<UserServiceResult<UserProfile>> {
    try {
      // Validate user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Validate update data
      const validationResult = this.validateProfileUpdate(updates);
      if (!validationResult.success) {
        return validationResult;
      }

      // In a full implementation, this would update the user record
      // For now, we'll simulate the update and return the updated profile
      const updatedUser = {
        ...existingUser,
        ...updates,
        updatedAt: new Date()
      };

      const { password: _, ...userWithoutPassword } = updatedUser;
      
      const profile: UserProfile = {
        ...userWithoutPassword,
        verificationLevel: this.determineVerificationLevel(updatedUser),
        joinedAt: updatedUser.createdAt.toISOString(),
        lastActive: updatedUser.lastLoginAt?.toISOString(),
        profileCompleteness: this.calculateProfileCompleteness(updatedUser)
      };

      return {
        success: true,
        data: profile,
        message: 'Profile updated successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update user trust score with reason tracking
   */
  async updateTrustScore(
    userId: number, 
    newScore: number, 
    reason: string,
    adjustedBy?: number
  ): Promise<UserServiceResult<TrustScoreUpdate>> {
    try {
      // Validate inputs
      if (!userId || userId <= 0) {
        return {
          success: false,
          error: 'Invalid user ID'
        };
      }

      if (newScore < 0 || newScore > 100) {
        return {
          success: false,
          error: 'Trust score must be between 0 and 100'
        };
      }

      if (!reason || reason.trim().length === 0) {
        return {
          success: false,
          error: 'Reason for trust score update is required'
        };
      }

      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const oldScore = user.trustScore;

      // Update trust score in storage
      await storage.updateUserTrustScore(userId, newScore);

      // Create trust score update record
      const trustScoreUpdate: TrustScoreUpdate = {
        userId,
        oldScore,
        newScore,
        reason: reason.trim(),
        adjustedBy,
        timestamp: new Date().toISOString()
      };

      // In a full implementation, this would be stored in a trust_score_history table
      console.log('Trust score updated:', trustScoreUpdate);

      return {
        success: true,
        data: trustScoreUpdate,
        message: `Trust score updated from ${oldScore} to ${newScore}`
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to update trust score: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get user statistics including properties, reviews, and trust metrics
   */
  async getUserStatistics(userId: number): Promise<UserServiceResult<UserStatistics>> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Get user's properties
      const allProperties = await storage.getProperties();
      const userProperties = allProperties.filter(property => property.ownerId === userId);

      // Get reviews given by user
      const allReviews = [];
      for (const property of allProperties) {
        const propertyReviews = await storage.getReviews(property.id);
        allReviews.push(...propertyReviews);
      }
      const reviewsGiven = allReviews.filter(review => review.userId === userId);

      // Get reviews received on user's properties
      const reviewsReceived = [];
      for (const property of userProperties) {
        const propertyReviews = await storage.getReviews(property.id);
        reviewsReceived.push(...propertyReviews);
      }

      // Calculate average rating received
      const averageRating = reviewsReceived.length > 0 
        ? reviewsReceived.reduce((sum, review) => sum + review.rating, 0) / reviewsReceived.length
        : 0;

      const statistics: UserStatistics = {
        propertiesListed: userProperties.length,
        reviewsGiven: reviewsGiven.length,
        reviewsReceived: reviewsReceived.length,
        averageRating: Math.round(averageRating * 10) / 10,
        trustScore: user.trustScore,
        verificationLevel: this.determineVerificationLevel(user)
      };

      return {
        success: true,
        data: statistics
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get user statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get user preferences (simulated - would be stored in database)
   */
  async getUserPreferences(userId: number): Promise<UserServiceResult<UserPreferences>> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // In a full implementation, preferences would be stored in database
      // For now, return default preferences
      const preferences: UserPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        language: 'en',
        timezone: 'Africa/Nairobi',
        currency: 'KES'
      };

      return {
        success: true,
        data: preferences
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: number, 
    preferences: Partial<UserPreferences>
  ): Promise<UserServiceResult<UserPreferences>> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Validate preferences
      const validationResult = this.validatePreferences(preferences);
      if (!validationResult.success) {
        return validationResult;
      }

      // In a full implementation, this would update preferences in database
      // For now, simulate the update
      const currentPreferences = await this.getUserPreferences(userId);
      if (!currentPreferences.success || !currentPreferences.data) {
        return {
          success: false,
          error: 'Failed to get current preferences'
        };
      }

      const updatedPreferences: UserPreferences = {
        ...currentPreferences.data,
        ...preferences
      };

      return {
        success: true,
        data: updatedPreferences,
        message: 'Preferences updated successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get user activity log (simulated)
   */
  async getUserActivity(
    userId: number, 
    pagination?: PaginationParams
  ): Promise<UserServiceResult<UserActivity[]>> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // In a full implementation, this would query an activity log table
      // For now, generate sample activity data
      const activities: UserActivity[] = [
        {
          id: '1',
          userId,
          action: 'profile_updated',
          description: 'Updated profile information',
          timestamp: new Date().toISOString(),
          metadata: { fields: ['firstName', 'bio'] }
        },
        {
          id: '2',
          userId,
          action: 'review_created',
          description: 'Created a review for Property #123',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          metadata: { propertyId: 123, rating: 5 }
        },
        {
          id: '3',
          userId,
          action: 'property_listed',
          description: 'Listed a new property',
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          metadata: { propertyId: 456 }
        }
      ];

      // Apply pagination if provided
      if (pagination) {
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedActivities = activities.slice(startIndex, endIndex);
        
        return {
          success: true,
          data: paginatedActivities
        };
      }

      return {
        success: true,
        data: activities
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get user activity: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search users with filters
   */
  async searchUsers(filters: UserSearchFilters): Promise<UserServiceResult<UserWithoutPassword[]>> {
    try {
      // Get all users (in a full implementation, this would be a filtered database query)
      const allUsers = await this.getAllUsers();
      if (!allUsers.success || !allUsers.data) {
        return {
          success: false,
          error: 'Failed to retrieve users'
        };
      }

      let filteredUsers = allUsers.data;

      // Apply filters
      if (filters.role) {
        filteredUsers = filteredUsers.filter(user => user.role === filters.role);
      }

      if (filters.verificationLevel) {
        filteredUsers = filteredUsers.filter(user => 
          this.determineVerificationLevel(user as any) === filters.verificationLevel
        );
      }

      if (filters.trustScoreMin !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.trustScore >= filters.trustScoreMin!);
      }

      if (filters.trustScoreMax !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.trustScore <= filters.trustScoreMax!);
      }

      if (filters.joinedAfter) {
        const afterDate = new Date(filters.joinedAfter);
        filteredUsers = filteredUsers.filter(user => 
          new Date(user.createdAt) >= afterDate
        );
      }

      if (filters.joinedBefore) {
        const beforeDate = new Date(filters.joinedBefore);
        filteredUsers = filteredUsers.filter(user => 
          new Date(user.createdAt) <= beforeDate
        );
      }

      if (filters.active !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.isActive === filters.active);
      }

      return {
        success: true,
        data: filteredUsers
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to search users: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get user engagement metrics for admin dashboard
   */
  async getUserEngagementMetrics(): Promise<UserServiceResult<UserEngagementMetrics>> {
    try {
      const allUsersResult = await this.getAllUsers();
      if (!allUsersResult.success || !allUsersResult.data) {
        return {
          success: false,
          error: 'Failed to retrieve users for metrics'
        };
      }

      const users = allUsersResult.data;
      const totalUsers = users.length;
      
      // Calculate active users (logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsers = users.filter(user => 
        user.lastLoginAt && new Date(user.lastLoginAt) >= thirtyDaysAgo
      ).length;

      // Calculate new users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const newUsersThisMonth = users.filter(user => 
        new Date(user.createdAt) >= startOfMonth
      ).length;

      // Calculate average trust score
      const averageTrustScore = users.length > 0 
        ? Math.round(users.reduce((sum, user) => sum + user.trustScore, 0) / users.length)
        : 0;

      // Count verified agents
      const verifiedAgents = users.filter(user => user.isVerifiedAgent).length;

      // Calculate top contributors (users with high trust scores and activity)
      const topContributors = users
        .map(user => ({
          userId: user.id,
          username: user.username,
          contributionScore: this.calculateContributionScore(user as any),
          trustScore: user.trustScore
        }))
        .sort((a, b) => b.contributionScore - a.contributionScore)
        .slice(0, 10);

      const metrics: UserEngagementMetrics = {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        averageTrustScore,
        verifiedAgents,
        topContributors
      };

      return {
        success: true,
        data: metrics
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get engagement metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Promote user to verified agent status
   */
  async promoteToVerifiedAgent(
    userId: number, 
    promotedBy: number
  ): Promise<UserServiceResult<UserProfile>> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (user.isVerifiedAgent) {
        return {
          success: false,
          error: 'User is already a verified agent'
        };
      }

      // In a full implementation, this would update the user record
      // For now, simulate the promotion
      const updatedUser = {
        ...user,
        isVerifiedAgent: true,
        trustScore: Math.min(100, user.trustScore + 10), // Boost trust score
        updatedAt: new Date()
      };

      // Log the promotion
      console.log(`User ${userId} promoted to verified agent by user ${promotedBy}`);

      // Return updated profile
      const { password: _, ...userWithoutPassword } = updatedUser;
      const profile: UserProfile = {
        ...userWithoutPassword,
        verificationLevel: this.determineVerificationLevel(updatedUser),
        joinedAt: updatedUser.createdAt.toISOString(),
        lastActive: updatedUser.lastLoginAt?.toISOString(),
        profileCompleteness: this.calculateProfileCompleteness(updatedUser)
      };

      return {
        success: true,
        data: profile,
        message: 'User promoted to verified agent successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to promote user: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Private method: Get all users without passwords
   */
  private async getAllUsers(): Promise<UserServiceResult<UserWithoutPassword[]>> {
    try {
      // In a full implementation, this would be a more efficient query
      // For now, we'll simulate by getting a few sample users
      const sampleUsers: UserWithoutPassword[] = [
        {
          id: 1,
          username: 'john_doe',
          email: 'john@example.com',
          role: 'user' as UserRole,
          trustScore: 75,
          isVerifiedAgent: false,
          firstName: 'John',
          lastName: 'Doe',
          phone: '+254700000001',
          profileImageUrl: null,
          bio: 'Property enthusiast',
          isActive: true,
          lastLoginAt: new Date(),
          emailVerifiedAt: new Date(),
          createdAt: new Date(Date.now() - 86400000 * 30), // 30 days ago
          updatedAt: new Date()
        },
        {
          id: 2,
          username: 'jane_agent',
          email: 'jane@example.com',
          role: 'agent' as UserRole,
          trustScore: 90,
          isVerifiedAgent: true,
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+254700000002',
          profileImageUrl: null,
          bio: 'Certified real estate agent',
          isActive: true,
          lastLoginAt: new Date(),
          emailVerifiedAt: new Date(),
          createdAt: new Date(Date.now() - 86400000 * 60), // 60 days ago
          updatedAt: new Date()
        }
      ];

      return {
        success: true,
        data: sampleUsers
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get all users: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Private method: Determine user verification level
   */
  private determineVerificationLevel(user: User): "unverified" | "basic" | "verified" | "premium" {
    if (user.isVerifiedAgent) {
      return 'premium';
    }
    
    if (user.emailVerifiedAt && user.trustScore >= 70) {
      return 'verified';
    }
    
    if (user.emailVerifiedAt) {
      return 'basic';
    }
    
    return 'unverified';
  }

  /**
   * Private method: Calculate profile completeness percentage
   */
  private calculateProfileCompleteness(user: User): number {
    let completeness = 0;
    const fields = [
      user.firstName,
      user.lastName,
      user.email,
      user.phone,
      user.bio,
      user.profileImageUrl
    ];

    const filledFields = fields.filter(field => field && field.trim().length > 0).length;
    completeness = Math.round((filledFields / fields.length) * 100);

    // Email verification adds bonus
    if (user.emailVerifiedAt) {
      completeness = Math.min(100, completeness + 10);
    }

    return completeness;
  }

  /**
   * Private method: Calculate contribution score for ranking
   */
  private calculateContributionScore(user: User): number {
    let score = user.trustScore;
    
    // Verified agents get bonus
    if (user.isVerifiedAgent) {
      score += 20;
    }
    
    // Active users get bonus
    if (user.lastLoginAt) {
      const daysSinceLogin = (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLogin <= 7) {
        score += 10;
      }
    }
    
    // Long-term users get bonus
    const daysSinceJoined = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceJoined >= 90) {
      score += 5;
    }
    
    return Math.min(150, score); // Cap at 150
  }

  /**
   * Private method: Validate profile update data
   */
  private validateProfileUpdate(updates: UserProfileUpdateRequest): UserServiceResult<void> {
    try {
      if (updates.firstName !== undefined) {
        if (updates.firstName.length < 1 || updates.firstName.length > 100) {
          return {
            success: false,
            error: 'First name must be between 1 and 100 characters'
          };
        }
      }

      if (updates.lastName !== undefined) {
        if (updates.lastName.length < 1 || updates.lastName.length > 100) {
          return {
            success: false,
            error: 'Last name must be between 1 and 100 characters'
          };
        }
      }

      if (updates.email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updates.email)) {
          return {
            success: false,
            error: 'Invalid email format'
          };
        }
      }

      if (updates.phone !== undefined) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/;
        if (!phoneRegex.test(updates.phone)) {
          return {
            success: false,
            error: 'Invalid phone number format'
          };
        }
      }

      if (updates.bio !== undefined) {
        if (updates.bio.length > 500) {
          return {
            success: false,
            error: 'Bio cannot exceed 500 characters'
          };
        }
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: 'Invalid profile update data'
      };
    }
  }

  /**
   * Private method: Validate user preferences
   */
  private validatePreferences(preferences: Partial<UserPreferences>): UserServiceResult<void> {
    try {
      if (preferences.language !== undefined) {
        const validLanguages = ['en', 'sw', 'fr'];
        if (!validLanguages.includes(preferences.language)) {
          return {
            success: false,
            error: 'Invalid language selection'
          };
        }
      }

      if (preferences.timezone !== undefined) {
        // Simple timezone validation
        if (!preferences.timezone.includes('/')) {
          return {
            success: false,
            error: 'Invalid timezone format'
          };
        }
      }

      if (preferences.currency !== undefined) {
        const validCurrencies = ['KES', 'USD', 'EUR'];
        if (!validCurrencies.includes(preferences.currency)) {
          return {
            success: false,
            error: 'Invalid currency selection'
          };
        }
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: 'Invalid preferences data'
      };
    }
  }
}