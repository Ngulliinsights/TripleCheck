/**
 * Migration Executor
 * 
 * Executes migrations with proper transaction handling, rollback capabilities,
 * and comprehensive error handling.
 */

import { Pool, PoolClient } from 'pg';

import { migrationLoader } from './migration-loader';
import { migrationRegistry } from './migration-registry';

interface MigrationRecord {
  id: string;
  name: string;
  domain: string;
  version: string;
  checksum: string;
  applied_at: Date;
  execution_time_ms: number;
  success: boolean;
  error_message?: string;
}

interface ExecutionResult {
  success: boolean;
  migrationsExecuted: number;
  totalTime: number;
  results: {
    id: string;
    name: string;
    success: boolean;
    executionTime: number;
    error?: string;
  }[];
  error?: Error;
}

export class MigrationExecutor {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Initialize migration tracking table
   */
  async initializeMigrationTable(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migration_history (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          domain VARCHAR(100) NOT NULL,
          version VARCHAR(10) NOT NULL,
          checksum VARCHAR(64) NOT NULL,
          applied_at TIMESTAMP DEFAULT NOW() NOT NULL,
          execution_time_ms INTEGER NOT NULL,
          success BOOLEAN NOT NULL,
          error_message TEXT,
          rollback_sql TEXT,
          validate_sql TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        -- Create indexes for better query performance
        CREATE INDEX IF NOT EXISTS migration_history_domain_idx ON migration_history(domain);
        CREATE INDEX IF NOT EXISTS migration_history_version_idx ON migration_history(version);
        CREATE INDEX IF NOT EXISTS migration_history_applied_at_idx ON migration_history(applied_at);
        CREATE INDEX IF NOT EXISTS migration_history_success_idx ON migration_history(success);
        CREATE INDEX IF NOT EXISTS migration_history_checksum_idx ON migration_history(checksum);
      `);
      
      console.log('✅ Migration tracking table initialized');
    } finally {
      client.release();
    }
  }

  /**
   * Get all applied migrations
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT id, name, domain, version, checksum, applied_at, execution_time_ms, success, error_message
        FROM migration_history
        ORDER BY applied_at ASC
      `);
      
      return result.rows as MigrationRecord[];
    } finally {
      client.release();
    }
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<string[]> {
    // Ensure migrations are loaded
    if (migrationRegistry.size() === 0) {
      await migrationLoader.loadAllMigrations();
    }

    const appliedMigrations = await this.getAppliedMigrations();
    const appliedIds = new Set(appliedMigrations.filter(m => m.success).map(m => m.id));
    
    const allMigrations = migrationRegistry.getAllMigrations();
    const pendingIds = allMigrations
      .filter(m => !appliedIds.has(m.id))
      .map(m => m.id);

    // Return in execution order
    return migrationRegistry.getExecutionOrder(pendingIds);
  }

  /**
   * Execute all pending migrations
   */
  async executePendingMigrations(): Promise<ExecutionResult> {
    const startTime = Date.now();
    const results: ExecutionResult['results'] = [];
    
    try {
      await this.initializeMigrationTable();
      
      const pendingMigrationIds = await this.getPendingMigrations();
      
      if (pendingMigrationIds.length === 0) {
        console.log('✅ No pending migrations to execute');
        return {
          success: true,
          migrationsExecuted: 0,
          totalTime: Date.now() - startTime,
          results: []
        };
      }

      console.log(`📋 Found ${pendingMigrationIds.length} pending migrations`);

      // Execute migrations in order
      for (const migrationId of pendingMigrationIds) {
        const result = await this.executeSingleMigration(migrationId);
        results.push(result);
        
        if (!result.success) {
          // Stop execution on first failure
          throw new Error(`Migration ${migrationId} failed: ${result.error}`);
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(`🎉 Successfully executed ${results.length} migrations in ${totalTime}ms`);
      
      return {
        success: true,
        migrationsExecuted: results.length,
        totalTime,
        results
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error('❌ Migration execution failed:', error);
      
      return {
        success: false,
        migrationsExecuted: results.filter(r => r.success).length,
        totalTime,
        results,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Execute a single migration
   */
  async executeSingleMigration(migrationId: string): Promise<ExecutionResult['results'][0]> {
    const migration = migrationRegistry.getMigration(migrationId);
    if (!migration) {
      throw new Error(`Migration ${migrationId} not found in registry`);
    }

    const startTime = Date.now();
    const client = await this.pool.connect();
    
    try {
      console.log(`🔄 Executing migration: ${migration.name}`);
      
      await client.query('BEGIN');
      
      // Create savepoint for rollback
      const savepointName = `migration_${migrationId.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await client.query(`SAVEPOINT ${savepointName}`);
      
      try {
        // Execute the migration SQL
        await client.query(migration.up);
        
        // Run validation if provided
        if (migration.validate) {
          await client.query(migration.validate);
        }
        
        const executionTime = Date.now() - startTime;
        
        // Record successful migration
        await client.query(`
          INSERT INTO migration_history (
            id, name, domain, version, checksum, execution_time_ms, success, rollback_sql, validate_sql
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          migration.id,
          migration.name,
          migration.domain,
          migration.version,
          migration.checksum,
          executionTime,
          true,
          migration.down || null,
          migration.validate || null
        ]);
        
        // Release savepoint and commit
        await client.query(`RELEASE SAVEPOINT ${savepointName}`);
        await client.query('COMMIT');
        
        console.log(`✅ Migration completed: ${migration.name} (${executionTime}ms)`);
        
        return {
          id: migration.id,
          name: migration.name,
          success: true,
          executionTime
        };
      } catch (migrationError) {
        // Rollback to savepoint
        await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
        
        const executionTime = Date.now() - startTime;
        const errorMessage = migrationError instanceof Error ? migrationError.message : String(migrationError);
        
        // Record failed migration
        await client.query(`
          INSERT INTO migration_history (
            id, name, domain, version, checksum, execution_time_ms, success, error_message
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          migration.id,
          migration.name,
          migration.domain,
          migration.version,
          migration.checksum,
          executionTime,
          false,
          errorMessage
        ]);
        
        await client.query('COMMIT');
        
        throw migrationError;
      }
    } catch (error) {
      await client.query('ROLLBACK');
      
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ Migration failed: ${migration.name} - ${errorMessage}`);
      
      return {
        id: migration.id,
        name: migration.name,
        success: false,
        executionTime,
        error: errorMessage
      };
    } finally {
      client.release();
    }
  }

  /**
   * Rollback a specific migration
   */
  async rollbackMigration(migrationId: string): Promise<ExecutionResult['results'][0]> {
    const startTime = Date.now();
    const client = await this.pool.connect();
    
    try {
      // Get migration record
      const result = await client.query(`
        SELECT id, name, rollback_sql FROM migration_history 
        WHERE id = $1 AND success = true
        ORDER BY applied_at DESC LIMIT 1
      `, [migrationId]);

      if (result.rows.length === 0) {
        throw new Error(`Migration ${migrationId} not found or not successfully applied`);
      }

      const migrationRecord = result.rows[0];
      if (!migrationRecord.rollback_sql) {
        throw new Error(`Migration ${migrationId} does not have rollback SQL`);
      }

      console.log(`🔄 Rolling back migration: ${migrationRecord.name}`);
      
      await client.query('BEGIN');
      
      // Create savepoint for rollback safety
      const savepointName = `rollback_${migrationId.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await client.query(`SAVEPOINT ${savepointName}`);
      
      try {
        // Execute rollback SQL
        await client.query(migrationRecord.rollback_sql);
        
        // Remove migration record
        await client.query(`DELETE FROM migration_history WHERE id = $1`, [migrationId]);
        
        await client.query(`RELEASE SAVEPOINT ${savepointName}`);
        await client.query('COMMIT');
        
        const executionTime = Date.now() - startTime;
        console.log(`✅ Migration rolled back: ${migrationRecord.name} (${executionTime}ms)`);
        
        return {
          id: migrationId,
          name: migrationRecord.name,
          success: true,
          executionTime
        };
      } catch (rollbackError) {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
        throw rollbackError;
      }
    } catch (error) {
      await client.query('ROLLBACK');
      
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ Rollback failed: ${migrationId} - ${errorMessage}`);
      
      return {
        id: migrationId,
        name: `Rollback ${migrationId}`,
        success: false,
        executionTime,
        error: errorMessage
      };
    } finally {
      client.release();
    }
  }

  /**
   * Generate migration status report
   */
  async generateStatusReport(): Promise<void> {
    // Ensure migrations are loaded
    if (migrationRegistry.size() === 0) {
      await migrationLoader.loadAllMigrations();
    }

    const allMigrations = migrationRegistry.getAllMigrations();
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedIds = new Set(appliedMigrations.filter(m => m.success).map(m => m.id));
    const pendingMigrations = allMigrations.filter(m => !appliedIds.has(m.id));
    const failedMigrations = appliedMigrations.filter(m => !m.success);

    console.log(`\n${  '='.repeat(80)}`);
    console.log('📊 MIGRATION STATUS REPORT');
    console.log('='.repeat(80));

    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Migrations: ${allMigrations.length}`);
    console.log(`   Applied Successfully: ${appliedIds.size}`);
    console.log(`   Pending: ${pendingMigrations.length}`);
    console.log(`   Failed: ${failedMigrations.length}`);

    // Group by domain
    const stats = migrationRegistry.getStatistics();
    console.log(`\n📁 BY DOMAIN:`);
    Object.entries(stats.byDomain).forEach(([domain, total]) => {
      const applied = appliedMigrations.filter(m => m.domain === domain && m.success).length;
      const pending = total - applied;
      console.log(`   ${domain.toUpperCase()}: ${applied}/${total} applied (${pending} pending)`);
    });

    // Show pending migrations
    if (pendingMigrations.length > 0) {
      console.log(`\n⏳ PENDING MIGRATIONS:`);
      const pendingIds = await this.getPendingMigrations();
      pendingIds.forEach(id => {
        const migration = migrationRegistry.getMigration(id);
        if (migration) {
          console.log(`   📄 ${id} - ${migration.name}`);
        }
      });
    }

    // Show failed migrations
    if (failedMigrations.length > 0) {
      console.log(`\n❌ FAILED MIGRATIONS:`);
      failedMigrations.forEach(m => {
        console.log(`   💥 ${m.id} - ${m.error_message}`);
      });
    }

    console.log(`\n${  '='.repeat(80)}`);
  }

  /**
   * Validate migration integrity
   */
  async validateMigrationIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Ensure migrations are loaded
    if (migrationRegistry.size() === 0) {
      await migrationLoader.loadAllMigrations();
    }

    const appliedMigrations = await this.getAppliedMigrations();
    const allMigrations = migrationRegistry.getAllMigrations();

    // Check for applied migrations that no longer exist
    for (const applied of appliedMigrations) {
      if (applied.success) {
        const migration = migrationRegistry.getMigration(applied.id);
        if (!migration) {
          errors.push(`Applied migration ${applied.id} no longer exists in migration files`);
        } else if (migration.checksum !== applied.checksum) {
          errors.push(`Migration ${applied.id} has been modified after execution (checksum mismatch)`);
        }
      }
    }

    // Validate dependency integrity
    const dependencyValidation = migrationRegistry.validateDependencies();
    if (!dependencyValidation.isValid) {
      errors.push(...dependencyValidation.errors);
    }

    // Check for orphaned migration records
    const orphanedRecords = appliedMigrations.filter(m => 
      !allMigrations.some(migration => migration.id === m.id)
    );
    if (orphanedRecords.length > 0) {
      warnings.push(`Found ${orphanedRecords.length} orphaned migration records in database`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}