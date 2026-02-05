// Errors
export * from './errors/base-error'
export * from './errors/validation-error'
export * from './errors/database-error'

// Constants
export * from './constants/error-codes'
export { ErrorCategory } from './constants/error-categories'
export * from './constants/http-status'
export * from './constants/postgres-codes'
export * from './constants/error-messages'

// Utilities
export * from './utilities/error-factory'
export * from './utilities/error-utils'
export * from './utilities/error-metrics'

// Server
export * from './server/express-handler'

// Client
export * from './client/error-handler'

// Convenience exports
export { AppError } from './errors/base-error'
export { ErrorFactory } from './utilities/error-factory'
export { ERROR_MESSAGES } from './constants/error-messages'
export { errorMetrics } from './utilities/error-metrics'