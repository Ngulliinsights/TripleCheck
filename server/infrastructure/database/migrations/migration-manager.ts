#!/usr/bin/env tsx
/**
 * Enterprise Migration Manager
 * 
 * Handles database migrations with proper versioning, dependency tracking,
 * rollback capabilities, and comprehensive validation.
 */

import { existsSync } from 'fs';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, basename } from 'path';

import { Pool } from 'pg';

import { databaseConfig } from '../config/database.config';

interface Migration {
  id: string;
  name: string;
  domain: string;
  version: number;
  filename: string;
  filepath: string;
  sql: string;
  dependencies: string[];
  checksum: string;
  appliedAt?: Date;
  rollbackSql?: string;
}

interface MigrationStatus {
  id: string;
  name: string;
  domain: string;
  version: number;
  checksum: string;
  applied_at: Date;
  execution_time_ms: number;
  success: boolean;
  error_message?: string;
}

class MigrationManager {
  private pool: Pool;
  private migrationsPath: string;

  constructor(migrationsPath: string = join(process.cwd(), 'database/migrations')) {
    this.migrationsPath = migrationsPath;
    this.pool = new Pool({
      host: databaseConfig.host,
      port: databaseConfig.port,
      database: databaseConfig.database,
      user: databaseConfig.username,
      password: databaseConfig.password,
      ssl: databaseConfig.ssl,
      max: 5, // Limited pool for migrations
    });
  }

  /**
   * Initialize migration tracking table
   */
  async initializeMigrationTable(): Promise<void> {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS migration_history (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(100) NOT NULL,
        version INTEGER NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW() NOT NULL,
        execution_time_ms INTEGER NOT NULL,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        rollback_sql TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS migration_history_domain_idx ON migration_history(domain);
      CREATE INDEX IF NOT EXISTS migration_history_version_idx ON migration_history(version);
      CREATE INDEX IF NOT EXISTS migration_history_applied_at_idx ON migration_history(applied_at);
      CREATE INDEX IF NOT EXISTS migration_history_success_idx ON migration_history(success);
    `;

    await this.pool.query(createTableSql);
    console.log('✅ Migration tracking table initialized');
  }

  /**
   * Discover all migration files
   */
  async discoverMigrations(): Promise<Migration[]> {
    const migrations: Migration[] = [];
    const domains = ['core', 'verification', 'trust', 'fraud', 'communication', 'analytics', 'performance'];

    for (const domain of domains) {
      const domainPath = join(this.migrationsPath, domain);
      if (!existsSync(domainPath)) {
        console.log(`⚠️  Domain directory not found: ${domain}`);
        continue;
      }

      const files = await readdir(domainPath);
      const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

      for (const file of sqlFiles) {
        const filepath = join(domainPath, file);
        const sql = await readFile(filepath, 'utf-8');
        const migration = this.parseMigration(file, domain, filepath, sql);
        migrations.push(migration);
      }
    }

    return migrations.sort((a, b) => {
      // Sort by domain priority, then by version
      const domainPriority = this.getDomainPriority(a.domain) - this.getDomainPriority(b.domain);
      if (domainPriority !== 0) return domainPriority;
      return a.version - b.version;
    });
  }

  /**
   * Parse migration file to extract metadata
   */
  private parseMigration(filename: string, domain: string, filepath: string, sql: string): Migration {
    // Extract version from filename (e.g., "001_create_tables.sql" -> 1)
    const versionMatch = filename.match(/^(\d+)_/);
    const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;
    
    // Generate migration ID
    const id = `${domain}_${String(version).padStart(3, '0')}_${filename.replace(/^\d+_/, '').replace('.sql', '')}`;
    
    // Extract name from filename
    const name = filename.replace(/^\d+_/, '').replace('.sql', '').replace(/_/g, ' ');
    
    // Calculate checksum
    const checksum = this.calculateChecksum(sql);
    
    // Extract dependencies from comments
    const dependencies = this.extractDependencies(sql);
    
    // Extract rollback SQL if present
    const rollbackSql = this.extractRollbackSql(sql);

    return {
      id,
      name,
      domain,
      version,
      filename,
      filepath,
      sql,
      dependencies,
      checksum,
      rollbackSql,
    };
  }

  /**
   * Get domain priority for ordering
   */
  private getDomainPriority(domain: string): number {
    const priorities = {
      core: 1,
      verification: 2,
      trust: 3,
      fraud: 4,
      communication: 5,
      analytics: 6,
      performance: 7,
    };
    return priorities[domain as keyof typeof priorities] || 999;
  }

  /**
   * Calculate SHA-256 checksum of migration content
   */
  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content.trim()).digest('hex');
  }

  /**
   * Extract dependencies from migration comments
   */
  private extractDependencies(sql: string): string[] {
    const dependencyRegex = /--\s*@depends:\s*(.+)/gi;
    const dependencies: string[] = [];
    let match;

    while ((match = dependencyRegex.exec(sql)) !== null) {
      dependencies.push(...match[1].split(',').map(d => d.trim()));
    }

    return dependencies;
  }

  /**
   * Extract rollback SQL from migration comments
   */
  private extractRollbackSql(sql: string): string | undefined {
    const rollbackMatch = sql.match(/--\s*@rollback\s*start\s*\n([\s\S]*?)--\s*@rollback\s*end/i);
    return rollbackMatch ? rollbackMatch[1].trim() : undefined;
  }

  /**
   * Get applied migrations from database
   */
  async getAppliedMigrations(): Promise<MigrationStatus[]> {
    const result = await this.pool.query(`
      SELECT id, name, domain, version, checksum, applied_at, execution_time_ms, success, error_message
      FROM migration_history
      ORDER BY applied_at ASC
    `);
    return result.rows;
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const allMigrations = await this.discoverMigrations();
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedIds = new Set(appliedMigrations.map(m => m.id));

    return allMigrations.filter(m => !appliedIds.has(m.id));
  }

  /**
   * Validate migration dependencies
   */
  private validateDependencies(migrations: Migration[], appliedIds: Set<string>): string[] {
    const errors: string[] = [];

    for (const migration of migrations) {
      for (const dependency of migration.dependencies) {
        if (!appliedIds.has(dependency)) {
          errors.push(`Migration ${migration.id} depends on ${dependency} which is not applied`);
        }
      }
    }

    return errors;
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      console.log(`🔄 Applying migration: ${migration.id}`);
      
      // Execute migration SQL
      await client.query(migration.sql);
      
      const executionTime = Date.now() - startTime;

      // Record migration in history
      await client.query(`
        INSERT INTO migration_history (id, name, domain, version, checksum, execution_time_ms, success, rollback_sql)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        migration.id,
        migration.name,
        migration.domain,
        migration.version,
        migration.checksum,
        executionTime,
        true,
        migration.rollbackSql || null,
      ]);

      await client.query('COMMIT');
      console.log(`✅ Migration applied successfully: ${migration.id} (${executionTime}ms)`);

    } catch (error) {
      await client.query('ROLLBACK');
      
      // Record failed migration
      const executionTime = Date.now() - startTime;
      await client.query(`
        INSERT INTO migration_history (id, name, domain, version, checksum, execution_time_ms, success, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        migration.id,
        migration.name,
        migration.domain,
        migration.version,
        migration.checksum,
        executionTime,
        false,
        error instanceof Error ? error.message : String(error),
      ]);

      throw new Error(`Migration ${migration.id} failed: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * Apply all pending migrations
   */
  async applyPendingMigrations(): Promise<void> {
    await this.initializeMigrationTable();
    
    const pendingMigrations = await this.getPendingMigrations();
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedIds = new Set(appliedMigrations.map(m => m.id));

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations found');
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

    // Validate dependencies
    const dependencyErrors = this.validateDependencies(pendingMigrations, appliedIds);
    if (dependencyErrors.length > 0) {
      throw new Error(`Dependency validation failed:\n${dependencyErrors.join('\n')}`);
    }

    // Apply migrations in order
    for (const migration of pendingMigrations) {
      await this.applyMigration(migration);
      appliedIds.add(migration.id);
    }

    console.log(`🎉 Successfully applied ${pendingMigrations.length} migrations`);
  }

  /**
   * Rollback a specific migration
   */
  async rollbackMigration(migrationId: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      // Get migration details
      const result = await client.query(`
        SELECT id, name, rollback_sql FROM migration_history 
        WHERE id = $1 AND success = true
        ORDER BY applied_at DESC LIMIT 1
      `, [migrationId]);

      if (result.rows.length === 0) {
        throw new Error(`Migration ${migrationId} not found or not successfully applied`);
      }

      const migration = result.rows[0];
      if (!migration.rollback_sql) {
        throw new Error(`Migration ${migrationId} does not have rollback SQL`);
      }

      await client.query('BEGIN');

      console.log(`🔄 Rolling back migration: ${migrationId}`);
      
      // Execute rollback SQL
      await client.query(migration.rollback_sql);
      
      // Remove from migration history
      await client.query(`DELETE FROM migration_history WHERE id = $1`, [migrationId]);

      await client.query('COMMIT');
      console.log(`✅ Migration rolled back successfully: ${migrationId}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Rollback failed for ${migrationId}: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * Generate migration status report
   */
  async generateStatusReport(): Promise<void> {
    const allMigrations = await this.discoverMigrations();
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedIds = new Set(appliedMigrations.map(m => m.id));

    console.log(`\n${  '='.repeat(80)}`);
    console.log('📊 MIGRATION STATUS REPORT');
    console.log('='.repeat(80));

    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Migrations: ${allMigrations.length}`);
    console.log(`   Applied: ${appliedMigrations.length}`);
    console.log(`   Pending: ${allMigrations.length - appliedMigrations.length}`);
    console.log(`   Failed: ${appliedMigrations.filter(m => !m.success).length}`);

    // Group by domain
    const byDomain = allMigrations.reduce((acc, m) => {
      if (!acc[m.domain]) acc[m.domain] = { total: 0, applied: 0, pending: 0 };
      acc[m.domain].total++;
      if (appliedIds.has(m.id)) {
        acc[m.domain].applied++;
      } else {
        acc[m.domain].pending++;
      }
      return acc;
    }, {} as Record<string, { total: number; applied: number; pending: number }>);

    console.log(`\n📁 BY DOMAIN:`);
    Object.entries(byDomain).forEach(([domain, stats]) => {
      console.log(`   ${domain.toUpperCase()}: ${stats.applied}/${stats.total} applied (${stats.pending} pending)`);
    });

    // Show pending migrations
    const pendingMigrations = allMigrations.filter(m => !appliedIds.has(m.id));
    if (pendingMigrations.length > 0) {
      console.log(`\n⏳ PENDING MIGRATIONS:`);
      pendingMigrations.forEach(m => {
        console.log(`   📄 ${m.id} - ${m.name}`);
      });
    }

    // Show failed migrations
    const failedMigrations = appliedMigrations.filter(m => !m.success);
    if (failedMigrations.length > 0) {
      console.log(`\n❌ FAILED MIGRATIONS:`);
      failedMigrations.forEach(m => {
        console.log(`   💥 ${m.id} - ${m.error_message}`);
      });
    }

    console.log(`\n${  '='.repeat(80)}`);
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const migrationManager = new MigrationManager();

  try {
    switch (command) {
      case 'status':
        await migrationManager.generateStatusReport();
        break;
      
      case 'migrate':
        await migrationManager.applyPendingMigrations();
        break;
      
      case 'rollback':
        const migrationId = process.argv[3];
        if (!migrationId) {
          throw new Error('Migration ID required for rollback');
        }
        await migrationManager.rollbackMigration(migrationId);
        break;
      
      case 'init':
        await migrationManager.initializeMigrationTable();
        break;
      
      default:
        console.log(`
Usage: tsx migration-manager.ts <command>

Commands:
  status    - Show migration status report
  migrate   - Apply all pending migrations
  rollback  - Rollback a specific migration (requires migration ID)
  init      - Initialize migration tracking table

Examples:
  tsx migration-manager.ts status
  tsx migration-manager.ts migrate
  tsx migration-manager.ts rollback core_001_initial_schema
        `);
    }
  } catch (error) {
    console.error('❌ Migration manager error:', error);
    process.exit(1);
  } finally {
    await migrationManager.close();
  }
}

if (require.main === module) {
  main();
}

export { MigrationManager };