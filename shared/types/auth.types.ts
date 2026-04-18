/**
 * CANONICAL Authentication types for entire monorepo (client + server)
 * Single source of truth for auth contracts
 *
 * Organized in sections:
 * - SHARED types (used by both client and server)
 * - CLIENT types (frontend-specific auth state)
 * - SERVER types (backend-specific auth contracts)
 */

import type { Request } from 'express';

// ============================================================================
// SHARED TYPES (used by both client and server)
// ============================================================================

// User role type for authorization
export type UserRole = 'user' | 'agent' | 'admin';

// Role hierarchy for authorization
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  agent: 2,
  admin: 3,
} as const;

// Permission levels
export const PERMISSION_LEVELS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
} as const;

export type PermissionLevel = typeof PERMISSION_LEVELS[keyof typeof PERMISSION_LEVELS];

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, PermissionLevel[]> = {
  user: ['read', 'write'],
  agent: ['read', 'write', 'delete'],
  admin: ['read', 'write', 'delete', 'admin'],
} as const;

// Trust score thresholds
export const TRUST_SCORE_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 80,
  VERIFIED: 90,
} as const;

// Authentication constants
export const AUTH_CONSTANTS = {
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
} as const;

// ============================================================================
// CLIENT TYPES (frontend-specific auth state and forms)
// ============================================================================

export interface User {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  trustScore?: number;
  isVerifiedAgent?: boolean;
  profileImageUrl?: string;
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    privacy: {
      showProfile: boolean;
      showContactInfo: boolean;
    };
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token?: string;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
  agreeToTerms: boolean;
}

// ============================================================================
// SERVER TYPES (backend-specific auth contracts and session management)
// ============================================================================

// Enhanced session interface with proper typing
export interface CustomSession {
  userId?: number;
  lastActivity?: string;
  destroy: (callback: (err?: any) => void) => void;
}

// Type-safe authenticated request interface
export interface AuthenticatedRequest extends Omit<Request, 'session'> {
  session?: CustomSession;
  user?: Omit<User, 'password'>;
}

// Authentication result types
export interface AuthResult {
  user: Omit<User, 'password'>;
  token?: string;
  expiresAt?: Date;
}

// Login request interface
export interface LoginRequest {
  username: string;
  password: string;
}

// Registration request interface
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Session validation result
export interface SessionValidationResult {
  valid: boolean;
  userId?: number;
  user?: Omit<User, 'password'>;
  error?: string;
}

// Rate limiting result
export interface RateLimitResult {
  allowed: boolean;
  timeLeft?: number;
  attemptsRemaining?: number;
}

// Authorization context
export interface AuthorizationContext {
  userId: number;
  user: Omit<User, 'password'>;
  role: UserRole;
  isVerifiedAgent: boolean;
  trustScore: number;
}

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: UserRole;
  requiredTrustScore?: number;
}

// Authentication error types
export interface AuthError {
  code: string;
  message: string;
  statusCode: number;
}

// Session configuration
export interface SessionConfig {
  maxAge: number;
  updateActivity: boolean;
  requireReauth: boolean;
}

// Session type augmentation for express-session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
    isAuthenticated?: boolean;
  }
}
