/**
 * Canonical authentication types for the entire monorepo (client + server).
 * Single source of truth for all auth contracts.
 *
 * Sections:
 *   1. Primitives & constants
 *   2. Domain models
 *   3. Client types   — auth state, form payloads
 *   4. Server types   — sessions, middleware, results
 *
 * NOTE: Express types live in `auth.server.types.ts`, not here, so this file
 * is safe to import in client bundles without a polyfill or tree-shake risk.
 */

// ============================================================================
// 1. PRIMITIVES & CONSTANTS
// ============================================================================

export type UserRole = 'user' | 'agent' | 'admin';

/** Numeric rank used for ≥ comparisons (e.g. `hasMinRole('agent')`). */
export const ROLE_HIERARCHY = {
  user:  1,
  agent: 2,
  admin: 3,
} as const satisfies Record<UserRole, number>;

export type PermissionLevel = 'read' | 'write' | 'delete' | 'admin';

/** Cumulative: each role inherits all permissions below it in the hierarchy. */
export const ROLE_PERMISSIONS = {
  user:  ['read', 'write'],
  agent: ['read', 'write', 'delete'],
  admin: ['read', 'write', 'delete', 'admin'],
} as const satisfies Record<UserRole, readonly PermissionLevel[]>;

export const TRUST_THRESHOLDS = {
  LOW:      30,
  MEDIUM:   60,
  HIGH:     80,
  VERIFIED: 90,
} as const;

export type TrustTier = keyof typeof TRUST_THRESHOLDS;

export const AUTH_CONSTANTS = {
  SESSION_MAX_AGE:     24 * 60 * 60 * 1000, // 24 h  (ms)
  RATE_LIMIT_WINDOW:   15 * 60 * 1000,       // 15 min (ms)
  MAX_LOGIN_ATTEMPTS:  5,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
} as const;

// ============================================================================
// 2. DOMAIN MODELS
// ============================================================================

// ── Preferences ──────────────────────────────────────────────────────────────

export type NotificationFrequency = 'immediate' | 'daily' | 'weekly';

export interface NotificationTopics {
  propertyUpdates?: boolean;
  trustAlerts?:     boolean;
  messages?:        boolean;
  marketing?:       boolean;
  systemUpdates?:   boolean;
}

export interface NotificationPreferences {
  email:      boolean;
  sms:        boolean;
  push:       boolean;
  frequency?: NotificationFrequency;
  topics?:    NotificationTopics;
}

export interface PrivacyPreferences {
  showProfile:          boolean;
  showContactInfo:      boolean;
  showTrustScore?:      boolean;
  allowDirectMessages?: boolean;
  showActivityStatus?:  boolean;
}

export type PropertyType = 'apartment' | 'house' | 'condo' | 'townhouse' | 'land';

export interface PriceRange {
  min: number;
  max: number;
}

export interface SavedSearch {
  name:          string;
  criteria:      Record<string, unknown>;
  alertsEnabled: boolean;
}

export interface SearchPreferences {
  defaultLocation?:        string;
  priceRange?:             PriceRange;
  preferredPropertyTypes?: PropertyType[];
  savedSearches?:          SavedSearch[];
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  privacy:       PrivacyPreferences;
  search?:       SearchPreferences;
}

// ── User ─────────────────────────────────────────────────────────────────────

/**
 * Canonical user shape shared across client and server.
 *
 * - `id` is `string` — numeric DB IDs must be coerced to string at the API boundary.
 *   This keeps the type consistent with UUID-based systems and avoids `number | string`.
 * - Timestamps are `string` (ISO-8601) — `Date` objects must be serialised before transport.
 * - Password hash is NEVER present here. The DB row type (`UserRecord`) carries it separately.
 * - `avatarUrl` consolidates the previous `avatar` / `profileImageUrl` split.
 */
export interface User {
  id:              string;
  email:           string;
  firstName:       string;
  lastName:        string;
  username?:       string;
  phone?:          string;
  avatarUrl?:      string;
  role:            UserRole;
  isVerified:      boolean;
  isVerifiedAgent: boolean;  // always present; default false rather than undefined
  trustScore:      number;   // always present; default 0 rather than undefined
  preferences?:    UserPreferences;
  createdAt?:      string;   // ISO-8601
  updatedAt?:      string;
}

/** Read-only view of a user — safe to pass as props or freeze in state. */
export type ReadonlyUser = Readonly<User>;

// ============================================================================
// 3. CLIENT TYPES
// ============================================================================

export interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  token?:          string;
}

/**
 * Login form payload.
 * Either `email` or `username` is required — never both simultaneously.
 */
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
// 4. SERVER TYPES
// ============================================================================

// ── Session ───────────────────────────────────────────────────────────────────

/**
 * Application-level session payload stored in the session store.
 * Express session management methods (`.destroy`, `.save`, etc.) are
 * intentionally excluded — access them via `req.session` directly.
 */
export interface SessionPayload {
  userId?:       string;   // aligned with User.id (string)
  lastActivity?: string;   // ISO-8601
}

// ── Auth operation results ────────────────────────────────────────────────────

export interface AuthResult {
  user:       User;
  token?:     string;
  expiresAt?: string; // ISO-8601
}

/**
 * Discriminated union — exhaustively narrows without a `valid` boolean check.
 *
 * @example
 * if (result.valid) { result.userId; result.user; }
 * else              { result.error; }
 */
export type SessionValidationResult =
  | { valid: true;  userId: string; user: User  }
  | { valid: false; error: string               };

export interface RateLimitResult {
  allowed:             boolean;
  timeLeft?:           number; // ms until reset
  attemptsRemaining?:  number;
}

export interface PermissionCheckResult {
  allowed:              boolean;
  reason?:              string;
  requiredRole?:        UserRole;
  requiredTrustScore?:  number;
}

// ── Auth context & config ─────────────────────────────────────────────────────

/**
 * Hydrated context passed to authorisation middleware and service calls.
 * All fields required — build this only after a successful session validation.
 */
export interface AuthorizationContext {
  userId:          string;   // aligned with User.id (string)
  user:            User;
  role:            UserRole;
  isVerifiedAgent: boolean;
  trustScore:      number;
}

export interface SessionConfig {
  maxAge:         number;  // ms
  updateActivity: boolean;
  requireReauth:  boolean;
}

// ── Utility helpers ───────────────────────────────────────────────────────────

/** Returns true when a given role meets or exceeds the required minimum. */
export function hasMinRole(actual: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[actual] >= ROLE_HIERARCHY[required];
}

/** Returns true when a user holds a specific permission. */
export function hasPermission(role: UserRole, permission: PermissionLevel): boolean {
  return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
}