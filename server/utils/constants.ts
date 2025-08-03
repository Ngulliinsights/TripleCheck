// Application constants for consistent usage across the system

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
} as const;

export const AUTH_CONSTANTS = {
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  SALT_ROUNDS_PRODUCTION: 12,
  SALT_ROUNDS_DEVELOPMENT: 10,
} as const;

export const VERIFICATION_STATUS = {
  PENDING: "pending" as const,
  VERIFIED: "verified" as const,
  SUSPICIOUS: "suspicious" as const,
  FAILED: "failed" as const,
} as const;

export const FILE_CONSTANTS = {
  SIZE_LIMIT: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
  UPLOAD_DIR: 'uploads',
} as const;

export const API_CONSTANTS = {
  VERSION: "1.0.0",
  DEFAULT_RISK_SCORE: 50,
  MAX_QUERY_LENGTH: 100,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const TRUST_SCORE_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 80,
  VERIFIED: 90,
} as const;

export const USER_ROLES = {
  USER: 'user' as const,
  AGENT: 'agent' as const,
  ADMIN: 'admin' as const,
} as const;

export const PERMISSION_LEVELS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
} as const;

export type PermissionLevel = typeof PERMISSION_LEVELS[keyof typeof PERMISSION_LEVELS];

// Role hierarchy for authorization (higher number = more permissions)
export const ROLE_HIERARCHY = {
  [USER_ROLES.USER]: 1,
  [USER_ROLES.AGENT]: 2,
  [USER_ROLES.ADMIN]: 3,
} as const;

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [USER_ROLES.USER]: [PERMISSION_LEVELS.READ, PERMISSION_LEVELS.WRITE],
  [USER_ROLES.AGENT]: [PERMISSION_LEVELS.READ, PERMISSION_LEVELS.WRITE, PERMISSION_LEVELS.DELETE],
  [USER_ROLES.ADMIN]: [PERMISSION_LEVELS.READ, PERMISSION_LEVELS.WRITE, PERMISSION_LEVELS.DELETE, PERMISSION_LEVELS.ADMIN],
} as const;