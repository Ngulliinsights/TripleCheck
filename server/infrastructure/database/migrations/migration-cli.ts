#!/usr/bin/env tsx
/**
 * Migration CLI
 * 
 * Command-line interface for managing database migrations with proper
 * versioning, dependency tracking, and rollback capabilities.
 */

import { Pool } from 'pg';

import { databaseConfig } from '../config/database.config';

import { MigrationExecutor } from './migration-executor';
import { migrationLoader } from './migration-loader';
import { migrationRegistry } from './migration-registry';

class MigrationCLI {
  private executor: MigrationExecutor;
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: databaseConfig.host,
      port: databaseConfig.port,
      database: databaseConfig.database,
      user: databaseConfig.username,
      password: databaseConfig.password,
      ssl: databaseConfig.ssl,
      max: 5, // Limited pool for migrations
    });
    
    this.executor = new MigrationExecutor(this.pool);
  }

  /**
   * Show help information
   */
  showHelp(): void {
    console.log(`
🗄️  Database Migration Manager

Usage: tsx migration-cli.ts <command> [options]

Commands:
  status              Show migration status report
  migrate             Execute all pending migrations
  rollback <id>       Rollback a specific migration
  validate            Validate migration integrity
  list                List all available migrations
  list-pending        List pending migrations
  list-applied        List applied migrations
  init                Initialize migration tracking table
  reload              Reload migrations from files
  help                Show this help message

Examples:
  tsx migration-cli.ts status
  tsx migration-cli.ts migrate
  tsx migration-cli.ts rollback core_001_initial_schema
  tsx migration-cli.ts validate
  tsx migration-cli.ts list --domain=core
  tsx migration-cli.ts list-pending

Options:
  --domain=<domain>   Filter by domain (core, verification, trust, fraud, communication, analytics, performance)
  --verbose           Show detailed output
  --dry-run           Show what would be executed without running
    `);
  }

  /**
   * Execute status command
   */
  async executeStatus(): Promise<void> {
    try {
      await migrationLoader.loadAllMigrations();
      await this.executor.generateStatusReport();
    } catch (error) {
      console.error('❌ Failed to generate status report:', error);
      process.exit(1);
    }
  }

  /**
   * Execute migrate command
   */
  async executeMigrate(options: { dryRun?: boolean; verbose?: boolean } = {}): Promise<void> {
    try {
      await migrationLoader.loadAllMigrations();
      
      if (options.dryRun) {
        const pendingMigrations = await this.executor.getPendingMigrations();
        
        if (pendingMigrations.length === 0) {
          console.log('✅ No pending migrations to execute');
          return;
        }

        console.log(`📋 Would execute ${pendingMigrations.length} migrations:`);
        for (const migrationId of pendingMigrations) {
          const migration = migrationRegistry.getMigration(migrationId);
          if (migration) {
            console.log(`   📄 ${migrationId} - ${migration.name}`);
          }
        }
        return;
      }

      const result = await this.executor.executePendingMigrations();
      
      if (options.verbose && result.results.length > 0) {
        console.log('\n📊 EXECUTION DETAILS:');
        for (const migrationResult of result.results) {
          const status = migrationResult.success ? '✅' : '❌';
          console.log(`   ${status} ${migrationResult.name} (${migrationResult.executionTime}ms)`);
          if (!migrationResult.success && migrationResult.error) {
            console.log(`      Error: ${migrationResult.error}`);
          }
        }
      }

      if (!result.success) {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Migration execution failed:', error);
      process.exit(1);
    }
  }

  /**
   * Execute rollback command
   */
  async executeRollback(migrationId: string): Promise<void> {
    if (!migrationId) {
      console.error('❌ Migration ID is required for rollback');
      console.log('Usage: tsx migration-cli.ts rollback <migration-id>');
      process.exit(1);
    }

    try {
      await migrationLoader.loadAllMigrations();
      
      const result = await this.executor.rollbackMigration(migrationId);
      
      if (!result.success) {
        console.error(`❌ Rollback failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Rollback execution failed:', error);
      process.exit(1);
    }
  }

  /**
   * Execute validate command
   */
  async executeValidate(): Promise<void> {
    try {
      await migrationLoader.loadAllMigrations();
      
      const validation = await this.executor.validateMigrationIntegrity();
      
      console.log('\n🔍 MIGRATION INTEGRITY VALIDATION');
      console.log('='.repeat(50));
      
      if (validation.isValid) {
        console.log('✅ All migrations are valid and consistent');
      } else {
        console.log('❌ Migration integrity issues found:');
        for (const error of validation.errors) {
          console.log(`   💥 ${error}`);
        }
      }
      
      if (validation.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        for (const warning of validation.warnings) {
          console.log(`   ⚠️  ${warning}`);
        }
      }
      
      if (!validation.isValid) {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Execute list command
   */
  async executeList(options: { domain?: string; verbose?: boolean } = {}): Promise<void> {
    try {
      await migrationLoader.loadAllMigrations();
      
      let migrations = migrationRegistry.getAllMigrations();
      
      if (options.domain) {
        migrations = migrations.filter(m => m.domain === options.domain);
      }
      
      console.log(`\n📋 AVAILABLE MIGRATIONS (${migrations.length})`);
      console.log('='.repeat(50));
      
      const groupedByDomain = migrations.reduce((acc, migration) => {
        if (!acc[migration.domain]) {
          acc[migration.domain] = [];
        }
        acc[migration.domain].push(migration);
        return acc;
      }, {} as Record<string, typeof migrations>);
      
      for (const [domain, domainMigrations] of Object.entries(groupedByDomain)) {
        console.log(`\n📁 ${domain.toUpperCase()} (${domainMigrations.length} migrations):`);
        
        for (const migration of domainMigrations) {
          const rollbackSupport = migration.rollbackSupported ? '🔄' : '❌';
          console.log(`   ${rollbackSupport} ${migration.id} - ${migration.name}`);
          
          if (options.verbose) {
            console.log(`      Version: ${migration.version}`);
            console.log(`      Author: ${migration.author}`);
            console.log(`      Tags: ${migration.tags.join(', ')}`);
            if (migration.dependencies.length > 0) {
              console.log(`      Dependencies: ${migration.dependencies.join(', ')}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to list migrations:', error);
      process.exit(1);
    }
  }

  /**
   * Execute list-pending command
   */
  async executeListPending(): Promise<void> {
    try {
      await migrationLoader.loadAllMigrations();
      
      const pendingMigrationIds = await this.executor.getPendingMigrations();
      
      console.log(`\n⏳ PENDING MIGRATIONS (${pendingMigrationIds.length})`);
      console.log('='.repeat(50));
      
      if (pendingMigrationIds.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }
      
      for (const migrationId of pendingMigrationIds) {
        const migration = migrationRegistry.getMigration(migrationId);
        if (migration) {
          const rollbackSupport = migration.rollbackSupported ? '🔄' : '❌';
          console.log(`   ${rollbackSupport} ${migration.id} - ${migration.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to list pending migrations:', error);
      process.exit(1);
    }
  }

  /**
   * Execute list-applied command
   */
  async executeListApplied(): Promise<void> {
    try {
      const appliedMigrations = await this.executor.getAppliedMigrations();
      
      console.log(`\n✅ APPLIED MIGRATIONS (${appliedMigrations.length})`);
      console.log('='.repeat(50));
      
      if (appliedMigrations.length === 0) {
        console.log('📋 No migrations have been applied yet');
        return;
      }
      
      for (const migration of appliedMigrations) {
        const status = migration.success ? '✅' : '❌';
        const time = new Date(migration.applied_at).toLocaleString();
        console.log(`   ${status} ${migration.id} - ${migration.name}`);
        console.log(`      Applied: ${time} (${migration.execution_time_ms}ms)`);
        
        if (!migration.success && migration.error_message) {
          console.log(`      Error: ${migration.error_message}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to list applied migrations:', error);
      process.exit(1);
    }
  }

  /**
   * Execute init command
   */
  async executeInit(): Promise<void> {
    try {
      await this.executor.initializeMigrationTable();
      console.log('✅ Migration tracking table initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize migration table:', error);
      process.exit(1);
    }
  }

  /**
   * Execute reload command
   */
  async executeReload(): Promise<void> {
    try {
      await migrationLoader.reloadMigrations();
      const stats = migrationRegistry.getStatistics();
      console.log(`✅ Reloaded ${stats.totalMigrations} migrations`);
    } catch (error) {
      console.error('❌ Failed to reload migrations:', error);
      process.exit(1);
    }
  }

  /**
   * Parse command line arguments
   */
  parseArgs(args: string[]): {
    command: string;
    options: Record<string, any>;
    positional: string[];
  } {
    const command = args[2] || 'help';
    const options: Record<string, any> = {};
    const positional: string[] = [];

    for (let i = 3; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=');
        options[key] = value || true;
      } else {
        positional.push(arg);
      }
    }

    return { command, options, positional };
  }

  /**
   * Main CLI entry point
   */
  async run(args: string[] = process.argv): Promise<void> {
    const { command, options, positional } = this.parseArgs(args);

    try {
      switch (command) {
        case 'status':
          await this.executeStatus();
          break;
        
        case 'migrate':
          await this.executeMigrate(options);
          break;
        
        case 'rollback':
          await this.executeRollback(positional[0]);
          break;
        
        case 'validate':
          await this.executeValidate();
          break;
        
        case 'list':
          await this.executeList(options);
          break;
        
        case 'list-pending':
          await this.executeListPending();
          break;
        
        case 'list-applied':
          await this.executeListApplied();
          break;
        
        case 'init':
          await this.executeInit();
          break;
        
        case 'reload':
          await this.executeReload();
          break;
        
        case 'help':
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error('❌ CLI execution failed:', error);
      process.exit(1);
    } finally {
      await this.pool.end();
    }
  }
}

// Run CLI if called directly
const cli = new MigrationCLI();
cli.run().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

export { MigrationCLI };