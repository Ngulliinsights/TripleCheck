/**
 * Database Schemas Index
 * 
 * Consolidated export of all database schemas for easy importing.
 * Use this file to import all schemas in one place.
 */

// Core schemas (users, properties, reviews, etc.)
export * from './core';

// Land verification schemas
export * from './land-verification';

// Re-export for convenience
export { 
  users, 
  properties, 
  reviews, 
  favorites, 
  propertyViews, 
  transactions, 
  statistics 
} from './core';

export {
  landVerificationSessions,
  verificationLayers,
  riskFactors,
  governmentDesignations,
  communityFeedback,
  expertAssignments
} from './land-verification';