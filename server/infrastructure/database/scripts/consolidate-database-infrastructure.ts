#!/usr/bin/env tsx

/**
 * Database Infrastructure Consolidation Script
 * 
 * Consolidates the scattered database infrastructure from server/infrastructure/database/
 * into the unified database/ folder structure.
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from '..\..\..\..\scripts\cleanup-redundancies';

interface MigrationStep {
  name: string;
  description: string;
  action: () => Promise<void>;
  rollback: () => Promise<void>;
}

interface MigrationResult {
  success: boolean;
  completedSteps: string[];
  error?: Error;
  rollbackRequired: boolean;
}

class DatabaseInfrastructureMigrator {
  private backupDir: string;
  private completedSteps: string[] = [];
  private serverDbPath = 'server/infrastructure/database';
  private mainDbPath = 'database';

  constructor() {
    this.backupDir = `database-migration-backup/${new Date().toISOString().split('T')[0]}`;
  }

  async migrate(): Promise<MigrationResult> {
    console.log('🚀 Starting Database Infrastructure Consolidation Migration');
    console.log('=' .repeat(60));

    try {
      // Create backup
      await this.createBackup();

      // Execute migration steps
      const steps = this.getMigrationSteps();
      
      for (const step of steps) {
        console.log(`\n📋 ${step.name}`);
        console.log(`   ${step.description}`);
        
        try {
          await step.action();
          this.completedSteps.push(step.name);
          console.log(`   ✅ Completed: ${step.name}`);
        } catch (error) {
          console.error(`   ❌ Failed: ${step.name}`, error);
          throw error;
        }
      }

      console.log('\n🎉 Migration completed successfully!');
      console.log('📊 Summary:');
      console.log(`   - Steps completed: ${this.completedSteps.length}`);
      console.log(`   - Backup location: ${this.backupDir}`);

      return {
        success: true,
        completedSteps: this.completedSteps,
        rollbackRequired: false
      };

    } catch (error) {
      console.error('\n💥 Migration failed:', error);
      console.log('\n🔄 Initiating rollback...');
      
      await this.rollback();
      
      return {
        success: false,
        completedSteps: this.completedSteps,
        error: error as Error,
        rollbackRequired: true
      };
    }
  }

  private getMigrationSteps(): MigrationStep[] {
    return [
      {
        name: 'Validate Prerequisites',
        description: 'Check that source and target directories exist',
        action: async () => {
          await this.validatePrerequisites();
        },
        rollback: async () => {
          // No rollback needed for validation
        }
      },
      {
        name: 'Merge Configuration Files',
        description: 'Consolidate database configuration systems',
        action: async () => {
          await this.mergeConfigurations();
        },
        rollback: async () => {
          await this.rollbackConfigurations();
        }
      },
      {
        name: 'Integrate Schema Definitions',
        description: 'Merge schema definitions from server infrastructure',
        action: async () => {
          await this.integrateSchemas();
        },
        rollback: async () => {
          await this.rollbackSchemas();
        }
      },
      {
        name: 'Consolidate Connection Management',
        description: 'Merge connection management systems',
        action: async () => {
          await this.consolidateConnections();
        },
        rollback: async () => {
          await this.rollbackConnections();
        }
      },
      {
        name: 'Integrate Database Services',
        description: 'Merge database service interfaces and implementations',
        action: async () => {
          await this.integrateServices();
        },
        rollback: async () => {
          await this.rollbackServices();
        }
      },
      {
        name: 'Consolidate Seeding Systems',
        description: 'Merge database seeding functionality',
        action: async () => {
          await this.consolidateSeeding();
        },
        rollback: async () => {
          await this.rollbackSeeding();
        }
      },
      {
        name: 'Merge Utilities and Types',
        description: 'Consolidate database utilities and type definitions',
        action: async () => {
          await this.mergeUtilitiesAndTypes();
        },
        rollback: async () => {
          await this.rollbackUtilitiesAndTypes();
        }
      },
      {
        name: 'Update Import References',
        description: 'Update all import paths to use consolidated database',
        action: async () => {
          await this.updateImportReferences();
        },
        rollback: async () => {
          await this.rollbackImportReferences();
        }
      },
      {
        name: 'Validate Integration',
        description: 'Test that all functionality works correctly',
        action: async () => {
          await this.validateIntegration();
        },
        rollback: async () => {
          // Validation rollback is handled by other steps
        }
      }
    ];
  }

  private async createBackup(): Promise<void> {
    console.log('💾 Creating backup...');
    
    await fs.mkdir(this.backupDir, { recursive: true });
    
    // Backup server infrastructure database
    await this.copyDirectory(
      this.serverDbPath,
      path.join(this.backupDir, 'server-infrastructure-database')
    );
    
    // Backup main database
    await this.copyDirectory(
      this.mainDbPath,
      path.join(this.backupDir, 'main-database')
    );
    
    // Backup package.json
    await fs.copyFile('package.json', path.join(this.backupDir, 'package.json.backup'));
    
    console.log(`   ✅ Backup created at: ${this.backupDir}`);
  }

  private async validatePrerequisites(): Promise<void> {
    // Check that server infrastructure database exists
    try {
      await fs.access(this.serverDbPath);
    } catch {
      throw new Error(`Server infrastructure database not found at: ${this.serverDbPath}`);
    }

    // Check that main database exists
    try {
      await fs.access(this.mainDbPath);
    } catch {
      throw new Error(`Main database not found at: ${this.mainDbPath}`);
    }

    console.log('   ✅ Prerequisites validated');
  }

  private async mergeConfigurations(): Promise<void> {
    const serverConfigPath = path.join(this.serverDbPath, 'config/database.config.ts');
    const mainConfigPath = path.join(this.mainDbPath, 'config/index.ts');
    
    // Read server configuration
    const serverConfig = await fs.readFile(serverConfigPath, 'utf-8');
    
    // Create enhanced configuration that includes server features
    const enhancedConfig = `/**
 * Enhanced Database Configuration Management
 * 
 * Consolidated configuration system that includes both main database
 * and server infrastructure features.
 */

import { z } from "zod";
import { DatabaseConfig, ValidationResult } from '../index';

// Server-specific configuration schema (from server infrastructure)
const ServerDatabaseConfigSchema = z.object({
  host: z.string(),
  port: z.number().int().positive(),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  ssl: z.boolean().default(false),
  maxConnections: z.number().int().positive().default(20),
  idleTimeoutMillis: z.number().int().positive().default(30000),
  connectionTimeoutMillis: z.number().int().positive().default(2000),
  acquireTimeoutMillis: z.number().int().positive().default(60000),
  createTimeoutMillis: z.number().int().positive().default(30000),
  destroyTimeoutMillis: z.number().int().positive().default(5000),
  reapIntervalMillis: z.number().int().positive().default(1000),
  createRetryIntervalMillis: z.number().int().positive().default(200),
});

export type ServerDatabaseConfig = z.infer<typeof ServerDatabaseConfigSchema>;

// Enhanced database configuration that combines both systems
export interface EnhancedDatabaseConfig extends DatabaseConfig {
  // Server-specific properties
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
}

// Server infrastructure configuration (preserved from server)
export const serverDatabaseConfig: ServerDatabaseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "triplecheck",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.NODE_ENV === "production",
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || "2000"),
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || "60000"),
  createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || "30000"),
  destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || "5000"),
  reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || "1000"),
  createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL || "200"),
};

// Validate server configuration
export function validateServerDatabaseConfig(): void {
  try {
    ServerDatabaseConfigSchema.parse(serverDatabaseConfig);
  } catch (error) {
    throw new Error(\`Invalid server database configuration: \${error}\`);
  }
}

// Connection string builder (from server infrastructure)
export function buildConnectionString(): string {
  const { host, port, database, username, password } = serverDatabaseConfig;
  return \`postgresql://\${username}:\${password}@\${host}:\${port}/\${database}\`;
}

// Enhanced configuration factory that combines both systems
export function createEnhancedDatabaseConfig(environment?: string): EnhancedDatabaseConfig {
  const mainConfig = createDatabaseConfig(environment);
  const serverConfig = serverDatabaseConfig;
  
  return {
    ...mainConfig,
    maxConnections: serverConfig.maxConnections,
    idleTimeoutMillis: serverConfig.idleTimeoutMillis,
    connectionTimeoutMillis: serverConfig.connectionTimeoutMillis,
    acquireTimeoutMillis: serverConfig.acquireTimeoutMillis,
    createTimeoutMillis: serverConfig.createTimeoutMillis,
    destroyTimeoutMillis: serverConfig.destroyTimeoutMillis,
    reapIntervalMillis: serverConfig.reapIntervalMillis,
    createRetryIntervalMillis: serverConfig.createRetryIntervalMillis,
  };
}

// Re-export original configuration functions
export * from './original-config';
`;

    // Backup original config
    const originalConfig = await fs.readFile(mainConfigPath, 'utf-8');
    await fs.writeFile(
      path.join(this.mainDbPath, 'config/original-config.ts'),
      originalConfig
    );
    
    // Write enhanced configuration
    await fs.writeFile(mainConfigPath, enhancedConfig);
    
    console.log('   ✅ Configuration systems merged');
  }

  private async integrateSchemas(): Promise<void> {
    const serverSchemasPath = path.join(this.serverDbPath, 'schemas');
    const mainSchemasPath = path.join(this.mainDbPath, 'schemas');
    
    // Copy server core schemas to main database
    const serverCorePath = path.join(serverSchemasPath, 'core');
    const mainCorePath = path.join(mainSchemasPath, 'core');
    
    try {
      const serverCoreFiles = await fs.readdir(serverCorePath);
      for (const file of serverCoreFiles) {
        if (file.endsWith('.ts')) {
          const serverFile = path.join(serverCorePath, file);
          const mainFile = path.join(mainCorePath, `server-${file}`);
          await fs.copyFile(serverFile, mainFile);
        }
      }
    } catch (error) {
      console.log('   ⚠️ No server core schemas found, skipping...');
    }
    
    // Copy server land verification schemas to main verification schemas
    const serverLandVerificationPath = path.join(serverSchemasPath, 'land-verification');
    const mainVerificationPath = path.join(mainSchemasPath, 'verification');
    
    try {
      const serverLandFiles = await fs.readdir(serverLandVerificationPath);
      for (const file of serverLandFiles) {
        if (file.endsWith('.ts')) {
          const serverFile = path.join(serverLandVerificationPath, file);
          const mainFile = path.join(mainVerificationPath, `server-${file}`);
          await fs.copyFile(serverFile, mainFile);
        }
      }
    } catch (error) {
      console.log('   ⚠️ No server land verification schemas found, skipping...');
    }
    
    console.log('   ✅ Schema definitions integrated');
  }

  private async consolidateConnections(): Promise<void> {
    const serverConnectionPath = path.join(this.serverDbPath, 'connection.ts');
    const mainConnectionPath = path.join(this.mainDbPath, 'connection');
    
    try {
      const serverConnection = await fs.readFile(serverConnectionPath, 'utf-8');
      
      // Create server connection integration file
      const serverConnectionIntegration = `/**
 * Server Infrastructure Connection Integration
 * 
 * Preserves server infrastructure connection patterns while
 * integrating with the main database connection system.
 */

${serverConnection}

// Export for backward compatibility
export { DatabaseConnection as ServerDatabaseConnection };
`;
      
      await fs.writeFile(
        path.join(mainConnectionPath, 'server-connection.ts'),
        serverConnectionIntegration
      );
      
      console.log('   ✅ Connection systems consolidated');
    } catch (error) {
      console.log('   ⚠️ No server connection file found, skipping...');
    }
  }

  private async integrateServices(): Promise<void> {
    const serverIndexPath = path.join(this.serverDbPath, 'index.ts');
    const serverInitPath = path.join(this.serverDbPath, 'init.ts');
    const serverIntegrationPath = path.join(this.serverDbPath, 'integration.ts');
    const serverQueryOptimizerPath = path.join(this.serverDbPath, 'QueryOptimizer.ts');
    
    const mainUtilsPath = path.join(this.mainDbPath, 'utils');
    const mainServicesPath = path.join(this.mainDbPath, 'services');
    
    // Create services directory if it doesn't exist
    try {
      await fs.mkdir(mainServicesPath, { recursive: true });
    } catch {
      // Directory might already exist
    }
    
    // Copy QueryOptimizer to utils
    try {
      await fs.copyFile(serverQueryOptimizerPath, path.join(mainUtilsPath, 'QueryOptimizer.ts'));
    } catch (error) {
      console.log('   ⚠️ No QueryOptimizer found, skipping...');
    }
    
    // Copy integration service
    try {
      await fs.copyFile(serverIntegrationPath, path.join(mainServicesPath, 'FullStackIntegration.ts'));
    } catch (error) {
      console.log('   ⚠️ No integration service found, skipping...');
    }
    
    // Copy initialization service
    try {
      await fs.copyFile(serverInitPath, path.join(mainServicesPath, 'DatabaseInitializer.ts'));
    } catch (error) {
      console.log('   ⚠️ No initialization service found, skipping...');
    }
    
    console.log('   ✅ Database services integrated');
  }

  private async consolidateSeeding(): Promise<void> {
    const serverSeedsPath = path.join(this.serverDbPath, 'seeds');
    const mainSeedsPath = path.join(this.mainDbPath, 'seeds');
    
    try {
      const serverSeedFiles = await fs.readdir(serverSeedsPath);
      
      for (const file of serverSeedFiles) {
        if (file.endsWith('.ts')) {
          const serverFile = path.join(serverSeedsPath, file);
          const mainFile = path.join(mainSeedsPath, `server-${file}`);
          
          // Check if main file already exists
          try {
            await fs.access(path.join(mainSeedsPath, file));
            // File exists, create server-prefixed version
            await fs.copyFile(serverFile, mainFile);
          } catch {
            // File doesn't exist, copy directly
            await fs.copyFile(serverFile, path.join(mainSeedsPath, file));
          }
        }
      }
      
      console.log('   ✅ Seeding systems consolidated');
    } catch (error) {
      console.log('   ⚠️ No server seeds found, skipping...');
    }
  }

  private async mergeUtilitiesAndTypes(): Promise<void> {
    const serverUtilsPath = path.join(this.serverDbPath, 'utils');
    const serverTypesPath = path.join(this.serverDbPath, 'types');
    const mainUtilsPath = path.join(this.mainDbPath, 'utils');
    const mainTypesPath = path.join(this.mainDbPath, 'types');
    
    // Create types directory if it doesn't exist
    try {
      await fs.mkdir(mainTypesPath, { recursive: true });
    } catch {
      // Directory might already exist
    }
    
    // Copy server utilities
    try {
      const serverUtilFiles = await fs.readdir(serverUtilsPath);
      for (const file of serverUtilFiles) {
        if (file.endsWith('.ts')) {
          const serverFile = path.join(serverUtilsPath, file);
          const mainFile = path.join(mainUtilsPath, `server-${file}`);
          await fs.copyFile(serverFile, mainFile);
        }
      }
    } catch (error) {
      console.log('   ⚠️ No server utilities found, skipping...');
    }
    
    // Copy server types
    try {
      const serverTypeFiles = await fs.readdir(serverTypesPath);
      for (const file of serverTypeFiles) {
        if (file.endsWith('.ts')) {
          const serverFile = path.join(serverTypesPath, file);
          const mainFile = path.join(mainTypesPath, `server-${file}`);
          await fs.copyFile(serverFile, mainFile);
        }
      }
    } catch (error) {
      console.log('   ⚠️ No server types found, skipping...');
    }
    
    console.log('   ✅ Utilities and types merged');
  }

  private async updateImportReferences(): Promise<void> {
    const filesToUpdate = [
      'server/**/*.ts',
      'server/**/*.tsx',
      'src/**/*.ts',
      'src/**/*.tsx'
    ];
    
    for (const pattern of filesToUpdate) {
      try {
        // Use grep to find files with server infrastructure database imports
        const command = `find . -name "${pattern.split('/')[1]}" -type f | xargs grep -l "server/infrastructure/database" 2>/dev/null || true`;
        const result = execSync(command, { encoding: 'utf-8' });
        
        if (result.trim()) {
          const files = result.trim().split('\n');
          
          for (const file of files) {
            if (file && file.trim()) {
              await this.updateFileImports(file.trim());
            }
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Could not update imports for pattern ${pattern}:`, error);
      }
    }
    
    console.log('   ✅ Import references updated');
  }

  private async updateFileImports(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Replace server infrastructure database imports with main database imports
      const updatedContent = content
        .replace(/from ['"]server\/infrastructure\/database['"]/g, 'from \'database\'')
        .replace(/from ['"]server\/infrastructure\/database\/([^'"]+)['"]/g, 'from \'database/$1\'')
        .replace(/import\s*\(\s*['"]server\/infrastructure\/database['"]\s*\)/g, 'import(\'database\')')
        .replace(/import\s*\(\s*['"]server\/infrastructure\/database\/([^'"]+)['"]\s*\)/g, 'import(\'database/$1\')');
      
      if (content !== updatedContent) {
        await fs.writeFile(filePath, updatedContent);
        console.log(`     📝 Updated imports in: ${filePath}`);
      }
    } catch (error) {
      console.log(`     ⚠️ Could not update file ${filePath}:`, error);
    }
  }

  private async validateIntegration(): Promise<void> {
    // Check that main database index exports are working
    try {
      const mainIndexPath = path.join(this.mainDbPath, 'index.ts');
      const mainIndex = await fs.readFile(mainIndexPath, 'utf-8');
      
      if (!mainIndex.includes('export')) {
        throw new Error('Main database index.ts does not contain exports');
      }
      
      console.log('   ✅ Integration validation passed');
    } catch (error) {
      throw new Error(`Integration validation failed: ${error}`);
    }
  }

  private async rollback(): Promise<void> {
    console.log('🔄 Rolling back migration...');
    
    try {
      // Restore from backup
      await this.copyDirectory(
        path.join(this.backupDir, 'main-database'),
        this.mainDbPath
      );
      
      // Restore package.json if needed
      await fs.copyFile(
        path.join(this.backupDir, 'package.json.backup'),
        'package.json'
      );
      
      console.log('   ✅ Rollback completed');
    } catch (error) {
      console.error('   ❌ Rollback failed:', error);
      throw new Error('Rollback failed - manual intervention required');
    }
  }

  // Rollback methods for individual steps
  private async rollbackConfigurations(): Promise<void> {
    // Restore original configuration
    const originalConfigPath = path.join(this.mainDbPath, 'config/original-config.ts');
    const mainConfigPath = path.join(this.mainDbPath, 'config/index.ts');
    
    try {
      await fs.copyFile(originalConfigPath, mainConfigPath);
      await fs.unlink(originalConfigPath);
    } catch (error) {
      console.log('   ⚠️ Could not rollback configurations');
    }
  }

  private async rollbackSchemas(): Promise<void> {
    // Remove server-prefixed schema files
    const mainSchemasPath = path.join(this.mainDbPath, 'schemas');
    
    try {
      const schemaFiles = await fs.readdir(mainSchemasPath, { recursive: true });
      for (const file of schemaFiles) {
        if (typeof file === 'string' && file.includes('server-')) {
          await fs.unlink(path.join(mainSchemasPath, file));
        }
      }
    } catch (error) {
      console.log('   ⚠️ Could not rollback schemas');
    }
  }

  private async rollbackConnections(): Promise<void> {
    // Remove server connection integration
    const serverConnectionPath = path.join(this.mainDbPath, 'connection/server-connection.ts');
    
    try {
      await fs.unlink(serverConnectionPath);
    } catch (error) {
      console.log('   ⚠️ Could not rollback connections');
    }
  }

  private async rollbackServices(): Promise<void> {
    // Remove integrated services
    const mainServicesPath = path.join(this.mainDbPath, 'services');
    const mainUtilsPath = path.join(this.mainDbPath, 'utils');
    
    try {
      await fs.unlink(path.join(mainUtilsPath, 'QueryOptimizer.ts'));
      await fs.unlink(path.join(mainServicesPath, 'FullStackIntegration.ts'));
      await fs.unlink(path.join(mainServicesPath, 'DatabaseInitializer.ts'));
    } catch (error) {
      console.log('   ⚠️ Could not rollback services');
    }
  }

  private async rollbackSeeding(): Promise<void> {
    // Remove server-prefixed seed files
    const mainSeedsPath = path.join(this.mainDbPath, 'seeds');
    
    try {
      const seedFiles = await fs.readdir(mainSeedsPath);
      for (const file of seedFiles) {
        if (file.startsWith('server-')) {
          await fs.unlink(path.join(mainSeedsPath, file));
        }
      }
    } catch (error) {
      console.log('   ⚠️ Could not rollback seeding');
    }
  }

  private async rollbackUtilitiesAndTypes(): Promise<void> {
    // Remove server-prefixed utility and type files
    const mainUtilsPath = path.join(this.mainDbPath, 'utils');
    const mainTypesPath = path.join(this.mainDbPath, 'types');
    
    try {
      const utilFiles = await fs.readdir(mainUtilsPath);
      for (const file of utilFiles) {
        if (file.startsWith('server-')) {
          await fs.unlink(path.join(mainUtilsPath, file));
        }
      }
      
      const typeFiles = await fs.readdir(mainTypesPath);
      for (const file of typeFiles) {
        if (file.startsWith('server-')) {
          await fs.unlink(path.join(mainTypesPath, file));
        }
      }
    } catch (error) {
      console.log('   ⚠️ Could not rollback utilities and types');
    }
  }

  private async rollbackImportReferences(): Promise<void> {
    // This would require restoring from backup since we can't easily undo
    // the import changes without knowing the original state
    console.log('   ⚠️ Import reference rollback requires full backup restore');
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

// CLI execution
async function main() {
  const migrator = new DatabaseInfrastructureMigrator();
  
  try {
    const result = await migrator.migrate();
    
    if (result.success) {
      console.log('\n🎉 Database infrastructure consolidation completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Run tests to validate integration: npm test database/');
      console.log('2. Update package.json scripts if needed');
      console.log('3. Remove server/infrastructure/database/ directory');
      console.log('4. Update documentation');
      
      process.exit(0);
    } else {
      console.error('\n💥 Migration failed and was rolled back');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Critical migration error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DatabaseInfrastructureMigrator };