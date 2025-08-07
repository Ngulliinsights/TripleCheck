/**
 * Schema Compatibility Layer
 * 
 * Provides backward compatibility for existing code that imports
 * from src/shared/schema.ts while we transition to the consolidated
 * database infrastructure.
 */

// Re-export everything from the new consolidated core schemas
export * from '@server/infrastructure/database/schemas/core';
export * from '@server/infrastructure/database/schemas/land-verification';

// Maintain backward compatibility for any code that might be importing
// from the old location during the transition period
// Deprecation warning removed to reduce console noise during development