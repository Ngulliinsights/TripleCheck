/**
 * Migration Management System - New Architecture
 * 
 * Unified migration system with proper versioning, dependency tracking,
 * and rollback capabilities using the new migration architecture.
 */

import { Pool } from 'pg';

import { databaseConfig } from '../config/database.config';

import { MigrationExecutor } from './migration-executor';
import { migrationLoader } from './migration-loader';
import { migrationRegistry } from './migration-registry';

// Re-export new migration system components
export { MigrationRegistry, migrationRegistry } from './migration-registry';
export { MigrationLoader, migrationLoader } from './migration-loader';
export { MigrationExecutor } from './migration-executor';
export { MigrationCLI } from './migration-cli';

// Legacy compatibility types
export interface MigrationResult {
  success: boolean;
  migrationsRun: number;
  details: string[];
  error?: Error;
}

/**
 * Legacy Migration Manager for backward compatibility
 * @deprecated Use MigrationExecutor instead
 */
export class MigrationManager {
  private executor: MigrationExecutor;
  private pool: Pool;

  constructor() {
    console.warn('⚠️  MigrationManager is deprecated. Use MigrationExecutor instead.');
    
    this.pool = new Pool({
      host: databaseConfig.host,
      port: databaseConfig.port,
      database: databaseConfig.database,
      user: databaseConfig.username,
      password: databaseConfig.password,
      ssl: databaseConfig.ssl,
      max: 5,
    });
    
    this.executor = new MigrationExecutor(this.pool);
  }

  /**
   * Load migrations (legacy compatibility)
   */
  async loadMigrations(): Promise<void> {
    await migrationLoader.loadAllMigrations();
  }

  /**
   * Run pending migrations (legacy compatibility)
   */
  async runPendingMigrations(): Promise<MigrationResult> {
    const result = await this.executor.executePendingMigrations();
    
    return {
      success: result.success,
      migrationsRun: result.migrationsExecuted,
      details: result.results.map(r => 
        r.success 
          ? `✅ ${r.name} (${r.executionTime}ms)`
          : `❌ ${r.name}: ${r.error}`
      ),
      error: result.error
    };
  }

  /**
   * Rollback last migration (legacy compatibility)
   */
  async rollbackLastMigration(): Promise<MigrationResult> {
    // Get the last applied migration
    const appliedMigrations = await this.executor.getAppliedMigrations();
    if (appliedMigrations.length === 0) {
      return {
        success: true,
        migrationsRun: 0,
        details: ['No migrations to rollback']
      };
    }

    const lastMigration = appliedMigrations[appliedMigrations.length - 1];
    const result = await this.executor.rollbackMigration(lastMigration.id);
    
    return {
      success: result.success,
      migrationsRun: result.success ? 1 : 0,
      details: [
        result.success 
          ? `✅ Rolled back ${result.name} (${result.executionTime}ms)`
          : `❌ Rollback failed: ${result.error}`
      ],
      error: result.error ? new Error(result.error) : undefined
    };
  }

  /**
   * Get migration status (legacy compatibility)
   */
  async getMigrationStatus(): Promise<{
    totalMigrations: number;
    executedCount: number;
    pendingCount: number;
    isUpToDate: boolean;
  }> {
    // Ensure migrations are loaded
    if (migrationRegistry.size() === 0) {
      await migrationLoader.loadAllMigrations();
    }

    const allMigrations = migrationRegistry.getAllMigrations();
    const appliedMigrations = await this.executor.getAppliedMigrations();
    const successfullyApplied = appliedMigrations.filter(m => m.success);
    
    return {
      totalMigrations: allMigrations.length,
      executedCount: successfullyApplied.length,
      pendingCount: allMigrations.length - successfullyApplied.length,
      isUpToDate: allMigrations.length === successfullyApplied.length
    };
  }

  /**
   * Validate migrations (legacy compatibility)
   */
  async validateMigrations(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    return await this.executor.validateMigrationIntegrity();
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Create a new migration executor instance
 */
export function createMigrationExecutor(): MigrationExecutor {
  const pool = new Pool({
    host: databaseConfig.host,
    port: databaseConfig.port,
    database: databaseConfig.database,
    user: databaseConfig.username,
    password: databaseConfig.password,
    ssl: databaseConfig.ssl,
    max: 5,
  });
  
  return new MigrationExecutor(pool);
}

/**
 * Quick migration functions for common operations
 */
export async function runMigrations(): Promise<void> {
  const executor = createMigrationExecutor();
  
  try {
    await migrationLoader.loadAllMigrations();
    const result = await executor.executePendingMigrations();
    
    if (!result.success) {
      throw new Error(`Migration failed: ${result.error?.message}`);
    }
    
    console.log(`✅ Successfully executed ${result.migrationsExecuted} migrations`);
  } finally {
    // Note: Pool cleanup is handled by the executor
  }
}

export async function getMigrationStatus(): Promise<void> {
  const executor = createMigrationExecutor();
  
  try {
    await executor.generateStatusReport();
  } finally {
    // Note: Pool cleanup is handled by the executor
  }
}

export async function validateMigrations(): Promise<void> {
  const executor = createMigrationExecutor();
  
  try {
    await migrationLoader.loadAllMigrations();
    const validation = await executor.validateMigrationIntegrity();
    
    if (!validation.isValid) {
      console.error('❌ Migration validation failed:');
      validation.errors.forEach(error => console.error(`   💥 ${error}`));
      throw new Error('Migration validation failed');
    }
    
    console.log('✅ All migrations are valid and consistent');
    
    if (validation.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      validation.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
    }
  } finally {
    // Note: Pool cleanup is handled by the executor
  }
}

// Export default for backward compatibility
export default MigrationManager;