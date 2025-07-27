/**
 * Database Infrastructure - Central Export
 * 
 * Provides centralized access to all database-related services and utilities
 */

// Core database services
export { DatabaseConnection } from './connection';
export { QueryOptimizer } from './QueryOptimizer';
export { DatabaseMigrator } from './migrations/migrator';

// Database utilities
export * from './utils/database-utils';
export * from './utils/query-builder';

// Seeding services
export { LandVerificationSeeder } from './seeds/land-verification-seed';
export { DatabaseSeeder } from './seeds/database-seeder';

// Types
export * from './types/database.types';

// Configuration
export { databaseConfig } from './config/database.config';

// Initialization
export { initializeDatabase, checkDatabaseStatus, resetDatabase } from './init';

// Integration
export { FullStackIntegration } from './integration';

// Core database connection exports
export { 
  initializeDatabase,
  runMigrations,
  seedDatabase,
  db,
  sql,
  getDatabase,
  withDatabase,
  withTransaction,
  checkDatabaseHealth,
  getDatabaseDiagnostics,
  closeDatabaseConnection
} from './connection';