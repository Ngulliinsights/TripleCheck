/**
 * Database Initialization Module
 * 
 * Simple wrapper around the database service for backward compatibility
 */

import { databaseService } from './service';

/**
 * Initialize the database connection
 */
export async function initializeDatabase(): Promise<void> {
  const result = await databaseService.initialize();
  
  if (!result.success) {
    throw result.error || new Error('Database initialization failed');
  }
  
  console.log('✅ Database initialized successfully');
}

/**
 * Get database connection
 */
export async function getDatabase() {
  return databaseService.getConnection();
}

/**
 * Check if database is available
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  return databaseService.healthCheck();
}

/**
 * Cleanup database connections
 */
export async function cleanupDatabase(): Promise<void> {
  return databaseService.cleanup();
}

// Re-export the service for advanced usage
export { databaseService };