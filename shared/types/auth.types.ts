/**
 * CANONICAL Authentication types for entire monorepo (client + server)
 * Single source of truth for auth contracts.
 *
 * Sections:
 *   1. Primitives & constants    — roles, permissions, thresholds
 *   2. Domain models             — User, UserPreferences
 *   3. Client types              — auth state, form payloads
 *   4. Server types              — requests, sessions, results
 */

// ─── SERVER IMPORT (server-only consumers) ────────────────────────────────────
// Import Express types only when consumed server-side; tree-shaken on the client.
import type { Request } from 'express';

// ============================================================================
// 1. PRIMITIVES & CONSTANTS
// ============================================================================

export type UserRole = 'user' | 'agent' | 'admin';

/** Numeric rank used for ≥ comparisons (e.g. requiresRole('agent')). */
export const ROLE_HIERARCHY = {
  user:  1,
  agent: 2,
  admin: 3,
} as const satisfies Record<UserRole, number>;

export type PermissionLevel = 'read' | 'write' | 'delete' | 'admin';

/** Cumulative: each role inherits all permissions below it. */
export const ROLE_PERMISSIONS = {
  user:  ['read', 'write'],
  agent: ['read', 'write', 'delete'],
  admin: ['read', 'write', 'delete', 'admin'],
} as const satisfies Record<UserRole, PermissionLevel[]>;

export const TRUST_THRESHOLDS = {
  LOW:      30,
  MEDIUM:   60,
  HIGH:     80,
  VERIFIED: 90,
} as const;

export type TrustTier = keyof typeof TRUST_THRESHOLDS;

export const AUTH_CONSTANTS = {
  SESSION_MAX_AGE:    24 * 60 * 60 * 1000, // 24 h  (ms)
  RATE_LIMIT_WINDOW:  15 * 60 * 1000,       // 15 min (ms)
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
} as const;

// ============================================================================
// 2. DOMAIN MODELS
// ============================================================================

// ── Preferences ──────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  email: boolean;
  sms:   boolean;
  push:  boolean;
  frequency?: 'immediate' | 'daily' | 'weekly';
  types?: {
    propertyUpdates?: boolean;
    trustAlerts?:     boolean;
    messages?:        boolean;
    marketing?:       boolean;
    systemUpdates?:   boolean;
  };
}

export interface PrivacyPreferences {
  showProfile:          boolean;
  showContactInfo:      boolean;
  showTrustScore?:      boolean;
  allowDirectMessages?: boolean;
  showActivityStatus?:  boolean;
}

export type PropertyType = 'apartment' | 'house' | 'condo' | 'townhouse' | 'land';

export interface SavedSearch {
  name:          string;
  criteria:      Record<string, unknown>;
  alertsEnabled: boolean;
}

export interface SearchPreferences {
  defaultLocation?:        string;
  priceRange?: {
    min: number;
    max: number;
  };
  preferredPropertyTypes?: PropertyType[];
  savedSearches?:           SavedSearch[];
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  privacy:       PrivacyPreferences;
  search?:       SearchPreferences;
}

// ── User ─────────────────────────────────────────────────────────────────────

/**
 * Canonical user shape shared across client and server.
 * `id` is always `number` — coerce string IDs at the API boundary.
 *
 * NOTE: password hash is NEVER included here. Use `UserRecord` in the DB
 * layer for the row type that carries the hashed password.
 */
export interface User {
  id:               number | string;
  email:            string;
  firstName:        string;
  lastName:         string;
  username?:        string;
  phone?:           string;
  avatar?:          string;
  profileImageUrl?: string;
  role:             UserRole;
  isVerified:       boolean;
  isVerifiedAgent?: boolean;
  trustScore?:      number;
  preferences?:     UserPreferences;
  createdAt?:       string | Date;
  updatedAt?:       string | Date;
}

// ============================================================================
// 3. CLIENT TYPES  (frontend auth state & form payloads)
// ============================================================================

export interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  token?:          string;
}

/** Login form — supports email or username, never both simultaneously. */
export type LoginCredentials =
  | { email: string;    username?: never; password: string; rememberMe?: boolean }
  | { username: string; email?: never;    password: string; rememberMe?: boolean };

export interface RegisterData {
  email:        string;
  password:     string;
  firstName:    string;
  lastName:     string;
  username?:    string;
  phone?:       string;
  agreeToTerms: boolean;
}

// ============================================================================
// 4. SERVER TYPES  (sessions, middleware, results)
// ============================================================================

// ── Session ───────────────────────────────────────────────────────────────────

/**
 * Application-level session payload stored in the session store.
 * Express session management methods are intentionally excluded — use the
 * `req.session` object directly for `.destroy()`, `.save()`, etc.
 */
export interface SessionPayload {
  userId?:       number;
  lastActivity?: string; // ISO-8601
}

// ── Authenticated request ─────────────────────────────────────────────────────

export interface AuthenticatedRequest extends Omit<Request, 'session'> {
  session?: SessionPayload & {
    destroy: (callback: (err?: unknown) => void) => void;
  };
  user?: User;
}

// ── Auth operation results ────────────────────────────────────────────────────

export interface AuthResult {
  user:       User;
  token?:     string;
  expiresAt?: Date;
}

export interface SessionValidationResult {
  valid:   boolean;
  userId?: number;
  user?:   User;
  error?:  string;
}

export interface RateLimitResult {
  allowed:            boolean;
  timeLeft?:          number; // ms
  attemptsRemaining?: number;
}

export interface PermissionCheckResult {
  allowed:             boolean;
  reason?:             string;
  requiredRole?:       UserRole;
  requiredTrustScore?: number;
}

// ── Auth context & config ─────────────────────────────────────────────────────

/** Hydrated context passed to authorization middleware and service calls. */
export interface AuthorizationContext {
  userId:          number;
  user:            User;
  role:            UserRole;
  isVerifiedAgent: boolean;
  trustScore:      number;
}

export interface SessionConfig {
  maxAge:          number; // ms
  updateActivity:  boolean;
  requireReauth:   boolean;
}

// ── Errors ────────────────────────────────────────────────────────────────────

export interface AuthError {
  code:        string;
  message:     string;
  statusCode:  number;
}