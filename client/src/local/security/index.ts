/**
 * Security Framework Index
 * Exports all security-related services, hooks, and utilities
 */

// Services
// export { default as validationService } from '../services/ValidationService' // File doesn't exist
export { default as authTokenService } from '../services/AuthTokenService'
export { default as rateLimitService } from '../services/RateLimitService'
export { default as auditLogService } from '../services/AuditLogService'

// Hooks
export {
  useSecureValidation,
  useAuth,
  useRateLimit,
  useSecureApi,
  useInputSanitization,
  useSecurityMonitoring
} from '../hooks/useSecurity'

// Types
// export type {
//   ValidationRule,
//   ValidationResult,
//   ValidationSchema
// } from '../services/ValidationService' // File doesn't exist

export type {
  TokenPayload,
  TokenPair
} from '../services/AuthTokenService'

export type {
  RateLimitConfig,
  RateLimitStatus
} from '../services/RateLimitService'

export type {
  AuditEvent,
  AuditEventType,
  AuditFilter
} from '../services/AuditLogService'