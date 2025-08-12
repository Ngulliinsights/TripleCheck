/**
 * Consolidated Database Entry Point
 * 
 * This module provides the main interface for all database operations,
 * including initialization, connection management, and cleanup.
 */

export interface DatabaseConfig {
  url: string;
  ssl: boolean | 'require';
  poolSize: number;
  connectionTimeout: number;
  idleTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
  applicationName: string;
}

export interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  transaction<T>(callback: (trx: DatabaseConnection) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  isHealthy(): Promise<boolean>;
}

export interface DatabaseInitResult {
  success: boolean;
  error?: Error;
  connectionInfo?: {
    host: string;
    database: string;
    ssl: boolean;
    poolSize: number;
  };
}

export interface MigrationResult {
  success: boolean;
  migrationsRun: number;
  error?: Error;
  details?: string[];
}

export interface SeedResult {
  success: boolean;
  recordsCreated: number;
  tablesSeeded: string[];
  error?: Error;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tablesValidated: number;
}

export enum DataScenario {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  PERFORMANCE = 'performance',
  PRODUCTION_SYNTHETIC = 'production_synthetic'
}

export interface DatabaseService {
  initialize(): Promise<DatabaseInitResult>;
  getConnection(): Promise<DatabaseConnection>;
  runMigrations(): Promise<MigrationResult>;
  seedData(scenario: DataScenario): Promise<SeedResult>;
  validateSchema(): Promise<ValidationResult>;
  cleanup(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

// Re-export all database components
export * from './config';
export * from './schemas';
export * from './migrations';
export * from './seeds';
export * from './utils';
export * from './types';
export * from './connection';
export * from './health';
export * from './service';