/**
 * User-related types and interfaces (beyond authentication)
 */

// Import from auth types and schema
import type { User } from "../infrastructure/database/schemas/consolidated";

import type { UserRole } from "./auth.types";

// User without password type
export type UserWithoutPassword = Omit<User, 'password'>;

// Re-export common user types
export type { UserRole };

// User profile update request
export interface UserProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

// User with additional profile information
export interface UserProfile extends UserWithoutPassword {
  verificationLevel?: "unverified" | "basic" | "verified" | "premium";
  joinedAt: string;
  lastActive?: string;
  profileCompleteness?: number;
}

// User statistics interface
export interface UserStatistics {
  propertiesListed: number;
  reviewsGiven: number;
  reviewsReceived: number;
  averageRating: number;
  trustScore: number;
  verificationLevel: string;
}

// User preferences interface
export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  language: string;
  timezone: string;
  currency: string;
}

// User activity log entry
export interface UserActivity {
  id: string;
  userId: number;
  action: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// User search filters
export interface UserSearchFilters {
  role?: UserRole;
  verificationLevel?: string;
  trustScoreMin?: number;
  trustScoreMax?: number;
  joinedAfter?: string;
  joinedBefore?: string;
  active?: boolean;
}