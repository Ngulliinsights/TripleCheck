import { AUTH_ERROR_MESSAGES } from '@local/error-handling/base-error';

// App-specific authentication error messages extending core error messages
export const APP_AUTH_ERRORS = {
  // Re-export core auth errors
  ...AUTH_ERROR_MESSAGES,
  
  // App-specific errors
  AUTH_REQUIRED: 'Authentication is required',
  USER_NOT_FOUND: 'User not found',
  INSUFFICIENT_PERMISSIONS: 'You do not have sufficient permissions',
  RATE_LIMITED: 'Too many attempts, please try again later',
  TRUST_SCORE_TOO_LOW: 'Your trust score is too low for this action',
  VERIFICATION_REQUIRED: 'Account verification required',
  OWNERSHIP_REQUIRED: 'You must be the owner to perform this action',
  INVALID_ROLE: 'Invalid user role',
  ROLE_REQUIRED: 'Role specification required',
  SESSION_EXPIRED: 'Your session has expired',
  SESSION_INVALID: 'Invalid session',
  SESSION_REQUIRED: 'Valid session required'
} as const;

// Authentication constants
export const AUTH_CONSTANTS = {
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  SESSION_NAME: 'connect.sid',
  TOKEN_EXPIRY: '24h',
  TOKEN_ALGORITHM: 'HS256',
  SALT_ROUNDS: 10,
  MIN_PASSWORD_LENGTH: 8
} as const;
