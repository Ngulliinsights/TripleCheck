/**
 * Migration Management System
 * 
 * Handles database migrations with rollback capabilities,
 * dependency tracking, and environment-specific configuration.
 */

import postgres from 'postgres';
import { MigrationResult } from '../index';

export interface Migration {
  id: string;
  name: string;
  version: string;
  up: string;
  down: string;
  dependencies: string[];
  createdAt: Date;
  checksum: string;
}

export interface MigrationRecord {
  id: string;
  name: string;
  version: string;
  executed_at: Date;
  checksum: string;
  execution_time_ms: number;
}

export interface MigrationStatus {
  totalMigrations: number;
  executedCount: number;
  pendingCount: number;
  executedMigrations: {
    id: string;
    name: string;
    version: string;
    executedAt: Date;
    executionTimeMs: number;
  }[];
  pendingMigrations: {
    id: string;
    name: string;
    version: string;
    dependencies: string[];
  }[];
  isUpToDate: boolean;
}

export interface MigrationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  migrationsValidated: number;
  executedMigrationsValidated: number;
}

export interface MigrationHistoryEntry {
  id: string;
  name: string;
  version: string;
  executedAt: Date;
  executionTimeMs: number;
  checksum: string;
  hasDefinition: boolean;
  dependencies: string[];
}

export class MigrationManager {
  private migrations: Map<string, Migration> = new Map();
  private migrationGraph: Map<string, string[]> = new Map(); // dependency graph
  private executionHistory: MigrationRecord[] = [];

  constructor() {
    // Load migrations asynchronously when needed
  }

  /**
   * Loads all available migrations from the migrations directory
   */
  async loadMigrations(): Promise<void> {
    if (this.migrations.size > 0) {
      return; // Already loaded
    }

    try {
      console.log('📋 Loading database migrations...');
      
      // Load core migrations
      const coreMigrations = await import('./core');
      
      // Load domain-specific migrations
      const trustMigrations = await import('./trust');
      const verificationMigrations = await import('./verification');
      const fraudMigrations = await import('./fraud');
      const communicationMigrations = await import('./communication');
      const analyticsMigrations = await import('./analytics');

      // Combine all migrations
      const allMigrations = [
        ...coreMigrations.migrations || [],
        ...trustMigrations.migrations || [],
        ...verificationMigrations.migrations || [],
        ...fraudMigrations.migrations || [],
        ...communicationMigrations.migrations || [],
        ...analyticsMigrations.migrations || []
      ];

      // Store migrations in map for easy access and build dependency graph
      for (const migration of allMigrations) {
        this.migrations.set(migration.id, migration);
        this.migrationGraph.set(migration.id, migration.dependencies);
      }

      console.log(`✅ Loaded ${this.migrations.size} migrations`);
      
      // Validate migration dependencies
      this.validateMigrationGraph();
    } catch (error) {
      console.error('❌ Failed to load migrations:', error);
      throw new Error(`Migration loading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validates the migration dependency graph for cycles and missing dependencies
   */
  private validateMigrationGraph(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (migrationId: string): boolean => {
      if (recursionStack.has(migrationId)) {
        return true; // Cycle detected
      }
      if (visited.has(migrationId)) {
        return false; // Already processed
      }

      visited.add(migrationId);
      recursionStack.add(migrationId);

      const dependencies = this.migrationGraph.get(migrationId) || [];
      for (const depId of dependencies) {
        if (!this.migrations.has(depId)) {
          throw new Error(`Migration ${migrationId} depends on ${depId} which does not exist`);
        }
        if (hasCycle(depId)) {
          throw new Error(`Circular dependency detected involving migration ${migrationId}`);
        }
      }

      recursionStack.delete(migrationId);
      return false;
    };

    // Check all migrations for cycles
    for (const migrationId of this.migrations.keys()) {
      if (!visited.has(migrationId)) {
        if (hasCycle(migrationId)) {
          throw new Error(`Circular dependency detected in migration graph`);
        }
      }
    }
  }

  /**
   * Runs all pending migrations
   */
  async runPendingMigrations(sql: postgres.Sql): Promise<MigrationResult> {
    try {
      console.log('🔄 Running pending migrations...');

      // Load migrations if not already loaded
      await this.loadMigrations();

      // Ensure migration tracking table exists
      await this.ensureMigrationTable(sql);

      // Get executed migrations
      this.executionHistory = await this.getExecutedMigrations(sql);
      const executedIds = new Set(this.executionHistory.map(m => m.id));

      // Find pending migrations and sort by dependency order
      const pendingMigrations = this.getOrderedPendingMigrations(executedIds);

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations to run');
        return {
          success: true,
          migrationsRun: 0,
          details: ['No pending migrations']
        };
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

      // Run migrations in dependency order
      const results: string[] = [];
      let migrationsRun = 0;

      for (const migration of pendingMigrations) {
        const executionResult = await this.executeMigration(sql, migration);
        
        results.push(...executionResult.details);
        
        if (executionResult.success) {
          migrationsRun++;
        } else {
          // Migration failed, stop execution
          throw new Error(`Migration ${migration.name} failed: ${executionResult.error?.message}`);
        }
      }

      console.log(`✅ Successfully ran ${migrationsRun} migrations`);
      return {
        success: true,
        migrationsRun,
        details: results
      };
    } catch (error) {
      console.error('❌ Migration execution failed:', error);
      return {
        success: false,
        migrationsRun: 0,
        error: error instanceof Error ? error : new Error(String(error)),
        details: [`Migration execution failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Executes a single migration with comprehensive error handling
   */
  private async executeMigration(sql: postgres.Sql, migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Running migration: ${migration.name}`);
      
      // Validate migration checksum
      const currentChecksum = this.calculateChecksum(migration.up);
      if (currentChecksum !== migration.checksum) {
        throw new Error(`Migration checksum mismatch for ${migration.id}. Migration may have been modified.`);
      }

      // Execute migration in transaction with savepoint for rollback
      await sql.begin(async (trx) => {
        // Create savepoint before migration
        await trx`SAVEPOINT migration_${migration.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        try {
          // Run the migration SQL
          await trx.unsafe(migration.up);
          
          // Record the migration
          await trx`
            INSERT INTO schema_migrations (id, name, version, executed_at, checksum, execution_time_ms)
            VALUES (${migration.id}, ${migration.name}, ${migration.version}, NOW(), ${migration.checksum}, ${Date.now() - startTime})
          `;
          
          // Release savepoint on success
          await trx`RELEASE SAVEPOINT migration_${migration.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
          
        } catch (migrationError) {
          // Rollback to savepoint on error
          await trx`ROLLBACK TO SAVEPOINT migration_${migration.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
          throw migrationError;
        }
      });

      const executionTime = Date.now() - startTime;
      const successMessage = `✅ ${migration.name} completed in ${executionTime}ms`;
      console.log(successMessage);
      
      return {
        success: true,
        migrationsRun: 1,
        details: [successMessage]
      };
    } catch (error) {
      const errorMessage = `❌ Migration failed: ${migration.name} - ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      
      return {
        success: false,
        migrationsRun: 0,
        error: error instanceof Error ? error : new Error(String(error)),
        details: [errorMessage]
      };
    }
  }

  /**
   * Gets pending migrations ordered by dependencies
   */
  private getOrderedPendingMigrations(executedIds: Set<string>): Migration[] {
    const pendingMigrations = Array.from(this.migrations.values())
      .filter(m => !executedIds.has(m.id));

    // Topological sort based on dependencies
    const sorted: Migration[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (migrationId: string): void => {
      if (visiting.has(migrationId)) {
        throw new Error(`Circular dependency detected involving migration ${migrationId}`);
      }
      if (visited.has(migrationId)) {
        return;
      }

      const migration = this.migrations.get(migrationId);
      if (!migration || executedIds.has(migrationId)) {
        return; // Skip executed or missing migrations
      }

      visiting.add(migrationId);

      // Visit dependencies first
      for (const depId of migration.dependencies) {
        if (!executedIds.has(depId)) {
          visit(depId);
        }
      }

      visiting.delete(migrationId);
      visited.add(migrationId);
      sorted.push(migration);
    };

    // Visit all pending migrations
    for (const migration of pendingMigrations) {
      if (!visited.has(migration.id)) {
        visit(migration.id);
      }
    }

    return sorted;
  }

  /**
   * Calculates checksum for migration content
   */
  private calculateChecksum(content: string): string {
    // Simple hash function for checksum calculation
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Rolls back the last migration
   */
  async rollbackLastMigration(sql: postgres.Sql): Promise<MigrationResult> {
    try {
      console.log('🔄 Rolling back last migration...');

      // Load migrations if not already loaded
      await this.loadMigrations();

      // Get the last executed migration
      const lastMigration = await sql`
        SELECT * FROM schema_migrations 
        ORDER BY executed_at DESC 
        LIMIT 1
      `;

      if (lastMigration.length === 0) {
        return {
          success: true,
          migrationsRun: 0,
          details: ['No migrations to rollback']
        };
      }

      const migrationRecord = lastMigration[0] as MigrationRecord;
      return this.rollbackMigration(sql, migrationRecord.id);
    } catch (error) {
      console.error('❌ Migration rollback failed:', error);
      return {
        success: false,
        migrationsRun: 0,
        error: error instanceof Error ? error : new Error(String(error)),
        details: [`Rollback failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Rolls back a specific migration by ID
   */
  async rollbackMigration(sql: postgres.Sql, migrationId: string): Promise<MigrationResult> {
    try {
      const migration = this.migrations.get(migrationId);
      if (!migration) {
        throw new Error(`Migration ${migrationId} not found in loaded migrations`);
      }

      // Check if migration is actually executed
      const executedMigration = await sql`
        SELECT * FROM schema_migrations 
        WHERE id = ${migrationId}
      `;

      if (executedMigration.length === 0) {
        throw new Error(`Migration ${migrationId} is not currently executed`);
      }

      // Check for dependent migrations that need to be rolled back first
      const dependentMigrations = await this.getDependentMigrations(sql, migrationId);
      if (dependentMigrations.length > 0) {
        const dependentNames = dependentMigrations.map(m => m.name).join(', ');
        throw new Error(
          `Cannot rollback migration ${migration.name} because it has dependent migrations: ${dependentNames}. ` +
          `Please rollback dependent migrations first.`
        );
      }

      console.log(`🔄 Rolling back migration: ${migration.name}`);

      const startTime = Date.now();

      // Execute rollback in transaction with savepoint
      await sql.begin(async (trx) => {
        // Create savepoint before rollback
        await trx`SAVEPOINT rollback_${migrationId.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        try {
          // Run the rollback SQL
          await trx.unsafe(migration.down);
          
          // Remove the migration record
          await trx`
            DELETE FROM schema_migrations 
            WHERE id = ${migration.id}
          `;
          
          // Release savepoint on success
          await trx`RELEASE SAVEPOINT rollback_${migrationId.replace(/[^a-zA-Z0-9]/g, '_')}`;
          
        } catch (rollbackError) {
          // Rollback to savepoint on error
          await trx`ROLLBACK TO SAVEPOINT rollback_${migrationId.replace(/[^a-zA-Z0-9]/g, '_')}`;
          throw rollbackError;
        }
      });

      const executionTime = Date.now() - startTime;
      const successMessage = `✅ Successfully rolled back migration: ${migration.name} in ${executionTime}ms`;
      console.log(successMessage);
      
      return {
        success: true,
        migrationsRun: 1,
        details: [successMessage]
      };
    } catch (error) {
      console.error('❌ Migration rollback failed:', error);
      return {
        success: false,
        migrationsRun: 0,
        error: error instanceof Error ? error : new Error(String(error)),
        details: [`Rollback failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Rolls back multiple migrations to a specific target migration
   */
  async rollbackToMigration(sql: postgres.Sql, targetMigrationId: string): Promise<MigrationResult> {
    try {
      console.log(`🔄 Rolling back to migration: ${targetMigrationId}`);

      // Load migrations if not already loaded
      await this.loadMigrations();

      // Get all executed migrations after the target
      const migrationsToRollback = await sql`
        SELECT * FROM schema_migrations 
        WHERE executed_at > (
          SELECT executed_at FROM schema_migrations WHERE id = ${targetMigrationId}
        )
        ORDER BY executed_at DESC
      `;

      if (migrationsToRollback.length === 0) {
        return {
          success: true,
          migrationsRun: 0,
          details: [`Already at migration ${targetMigrationId}`]
        };
      }

      console.log(`📋 Found ${migrationsToRollback.length} migrations to rollback`);

      const results: string[] = [];
      let migrationsRolledBack = 0;

      // Rollback migrations in reverse order
      for (const migrationRecord of migrationsToRollback) {
        const rollbackResult = await this.rollbackMigration(sql, migrationRecord.id as string);
        
        results.push(...rollbackResult.details);
        
        if (rollbackResult.success) {
          migrationsRolledBack++;
        } else {
          // Rollback failed, stop execution
          throw new Error(`Rollback failed at migration ${migrationRecord.id}: ${rollbackResult.error?.message}`);
        }
      }

      console.log(`✅ Successfully rolled back ${migrationsRolledBack} migrations`);
      return {
        success: true,
        migrationsRun: migrationsRolledBack,
        details: results
      };
    } catch (error) {
      console.error('❌ Rollback to migration failed:', error);
      return {
        success: false,
        migrationsRun: 0,
        error: error instanceof Error ? error : new Error(String(error)),
        details: [`Rollback to migration failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Gets migrations that depend on the specified migration
   */
  private async getDependentMigrations(sql: postgres.Sql, migrationId: string): Promise<MigrationRecord[]> {
    const executedMigrations = await this.getExecutedMigrations(sql);
    const dependentMigrations: MigrationRecord[] = [];

    for (const executedMigration of executedMigrations) {
      const migration = this.migrations.get(executedMigration.id);
      if (migration && migration.dependencies.includes(migrationId)) {
        dependentMigrations.push(executedMigration);
      }
    }

    return dependentMigrations;
  }

  /**
   * Gets all executed migrations from the database
   */
  private async getExecutedMigrations(sql: postgres.Sql): Promise<MigrationRecord[]> {
    const result = await sql`
      SELECT id, name, version, executed_at, checksum, execution_time_ms
      FROM schema_migrations
      ORDER BY executed_at ASC
    `;
    
    return result as MigrationRecord[];
  }

  /**
   * Ensures the migration tracking table exists
   */
  private async ensureMigrationTable(sql: postgres.Sql): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        version VARCHAR(50) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        checksum VARCHAR(64) NOT NULL,
        execution_time_ms INTEGER NOT NULL
      )
    `;

    // Create index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at 
      ON schema_migrations(executed_at)
    `;
  }

  /**
   * Gets the current migration status
   */
  async getMigrationStatus(sql: postgres.Sql): Promise<MigrationStatus> {
    try {
      // Load migrations if not already loaded
      await this.loadMigrations();

      // Ensure migration tracking table exists
      await this.ensureMigrationTable(sql);

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations(sql);
      const executedIds = new Set(executedMigrations.map(m => m.id));

      // Get pending migrations
      const pendingMigrations = Array.from(this.migrations.values())
        .filter(m => !executedIds.has(m.id));

      // Calculate statistics
      const totalMigrations = this.migrations.size;
      const executedCount = executedMigrations.length;
      const pendingCount = pendingMigrations.length;

      return {
        totalMigrations,
        executedCount,
        pendingCount,
        executedMigrations: executedMigrations.map(m => ({
          id: m.id,
          name: m.name,
          version: m.version,
          executedAt: m.executed_at,
          executionTimeMs: m.execution_time_ms
        })),
        pendingMigrations: pendingMigrations.map(m => ({
          id: m.id,
          name: m.name,
          version: m.version,
          dependencies: m.dependencies
        })),
        isUpToDate: pendingCount === 0
      };
    } catch (error) {
      throw new Error(`Failed to get migration status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validates all migrations for consistency and integrity
   */
  async validateMigrations(sql: postgres.Sql): Promise<MigrationValidationResult> {
    try {
      console.log('🔍 Validating migration integrity...');

      // Load migrations if not already loaded
      await this.loadMigrations();

      const errors: string[] = [];
      const warnings: string[] = [];

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations(sql);
      const executedIds = new Set(executedMigrations.map(m => m.id));

      // Validate executed migrations still exist in code
      for (const executedMigration of executedMigrations) {
        const migration = this.migrations.get(executedMigration.id);
        if (!migration) {
          errors.push(`Executed migration ${executedMigration.id} no longer exists in migration files`);
          continue;
        }

        // Validate checksum
        const currentChecksum = this.calculateChecksum(migration.up);
        if (currentChecksum !== executedMigration.checksum) {
          errors.push(`Migration ${migration.id} has been modified after execution (checksum mismatch)`);
        }
      }

      // Validate pending migration dependencies
      const pendingMigrations = Array.from(this.migrations.values())
        .filter(m => !executedIds.has(m.id));

      for (const migration of pendingMigrations) {
        for (const depId of migration.dependencies) {
          if (!this.migrations.has(depId)) {
            errors.push(`Migration ${migration.id} depends on non-existent migration ${depId}`);
          } else if (!executedIds.has(depId)) {
            const depMigration = this.migrations.get(depId);
            if (depMigration && !pendingMigrations.some(m => m.id === depId)) {
              errors.push(`Migration ${migration.id} depends on ${depId} which is not executed and not pending`);
            }
          }
        }
      }

      // Check for orphaned migration records
      const orphanedRecords = executedMigrations.filter(m => !this.migrations.has(m.id));
      if (orphanedRecords.length > 0) {
        warnings.push(`Found ${orphanedRecords.length} orphaned migration records in database`);
      }

      // Validate migration naming and versioning
      const versions = Array.from(this.migrations.values()).map(m => m.version).sort();
      const duplicateVersions = versions.filter((v, i) => versions.indexOf(v) !== i);
      if (duplicateVersions.length > 0) {
        errors.push(`Duplicate migration versions found: ${duplicateVersions.join(', ')}`);
      }

      console.log(`✅ Migration validation completed. Found ${errors.length} errors and ${warnings.length} warnings`);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        migrationsValidated: this.migrations.size,
        executedMigrationsValidated: executedMigrations.length
      };
    } catch (error) {
      console.error('❌ Migration validation failed:', error);
      return {
        isValid: false,
        errors: [`Migration validation error: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        migrationsValidated: 0,
        executedMigrationsValidated: 0
      };
    }
  }

  /**
   * Gets migration history with detailed information
   */
  async getMigrationHistory(sql: postgres.Sql, limit?: number): Promise<MigrationHistoryEntry[]> {
    const query = limit 
      ? sql`SELECT * FROM schema_migrations ORDER BY executed_at DESC LIMIT ${limit}`
      : sql`SELECT * FROM schema_migrations ORDER BY executed_at DESC`;

    const records = await query;
    
    return records.map(record => {
      const migration = this.migrations.get(record.id as string);
      return {
        id: record.id as string,
        name: record.name as string,
        version: record.version as string,
        executedAt: record.executed_at as Date,
        executionTimeMs: record.execution_time_ms as number,
        checksum: record.checksum as string,
        hasDefinition: !!migration,
        dependencies: migration?.dependencies || []
      };
    });
  }
}