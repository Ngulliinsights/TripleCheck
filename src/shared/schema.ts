/**
 * DEPRECATED: This schema file is deprecated.
 * 
 * Please use the new consolidated schema from:
 * server/infrastructure/database/schemas/consolidated
 * 
 * This file now re-exports from the new location for backward compatibility.
 */

console.warn(
  '⚠️ DEPRECATION WARNING: You are importing from server/infrastructure/database/schemas/consolidated. ' +
  'Please update your imports to use: ' +
  'import { users, properties, reviews } from "server/infrastructure/database/schemas/consolidated"'
);

// Re-export everything from the new consolidated schema location
export * from '../../server/infrastructure/database/schemas/consolidated';