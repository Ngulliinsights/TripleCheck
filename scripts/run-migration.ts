#!/usr/bin/env ts-node

/**
 * Core Utilities Migration Runner
 * 
 * Orchestrates the complete migration of existing services to core utilities
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { CoreUtilitiesMigrator } from './migrate-core-utilities';
import { CacheMigrationHelper } from './migration-helpers/cache-migration';
import { MiddlewareMigrationHelper } from './migration-helpers/middleware-migration';
import { ConfigMigrationHelper } from './migration-helpers/config-migration';

interface MigrationResult {
  success: boolean;
  filesProcessed: number;
  filesUpdated: number;
  errors: string[];
  warnings: string[];
}

class MigrationRunner {
  private dryRun: boolean;
  private verbose: boolean;
  private results: MigrationResult = {
    success: true,
    filesProcessed: 0,
    filesUpdated: 0,
    errors: [],
    warnings: []
  };

  constructor(options: { dryRun?: boolean; verbose?: boolean } = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
  }

  async runMigration(): Promise<MigrationResult> {
    console.log('🚀 Starting Core Utilities Migration');
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    console.log('');

    try {
      // Step 1: Run general migration
      await this.runGeneralMigration();

      // Step 2: Run specific service migrations
      await this.runCacheMigration();
      await this.runMiddlewareMigration();
      await this.runConfigMigration();

      // Step 3: Validate migrations
      await this.validateMigrations();

      // Step 4: Generate final report
      await this.generateFinalReport();

      console.log('✅ Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.results.success = false;
      this.results.errors.push(`Migration failed: ${error}`);
    }

    return this.results;
  }

  private async runGeneralMigration(): Promise<void> {
    console.log('📦 Running general migration...');
    
    const migrator = new CoreUtilitiesMigrator(this.dryRun);
    await migrator.migrateProject();
    await migrator.addCoreImports();
    
    console.log('✅ General migration completed');
  }

  private async runCacheMigration(): Promise<void> {
    console.log('🗄️  Running cache service migration...');
    
    const cacheFiles = await this.findFilesWithPattern([
      'cacheService',
      'CacheService',
      'PropertyCacheService'
    ]);

    for (const filePath of cacheFiles) {
      try {
        this.results.filesProcessed++;
        
        let updated = false;
        updated = await CacheMigrationHelper.updateCacheImports(filePath) || updated;
        updated = await CacheMigrationHelper.updateCacheMethodCalls(filePath) || updated;
        
        if (updated) {
          this.results.filesUpdated++;
          if (this.verbose) {
            console.log(`  ✅ Updated cache usage in ${this.getRelativePath(filePath)}`);
          }
        }
        
        // Validate migration
        const validation = await CacheMigrationHelper.validateCacheMigration(filePath);
        if (!validation.isValid) {
          this.results.warnings.push(...validation.issues.map(issue => 
            `${this.getRelativePath(filePath)}: ${issue}`
          ));
        }
        
      } catch (error) {
        this.results.errors.push(`Cache migration error in ${filePath}: ${error}`);
      }
    }
    
    console.log(`✅ Cache migration completed (${this.results.filesUpdated} files updated)`);
  }

  private async runMiddlewareMigration(): Promise<void> {
    console.log('🔧 Running middleware migration...');
    
    const middlewareFiles = await this.findFilesWithPattern([
      'requireAuth',
      'validateRequest',
      'cacheResponse',
      'middleware'
    ]);

    for (const filePath of middlewareFiles) {
      try {
        this.results.filesProcessed++;
        
        let updated = false;
        updated = await MiddlewareMigrationHelper.updateMiddlewareImports(filePath) || updated;
        updated = await MiddlewareMigrationHelper.updateValidationMiddleware(filePath) || updated;
        updated = await MiddlewareMigrationHelper.updateAuthMiddleware(filePath) || updated;
        updated = await MiddlewareMigrationHelper.updateErrorHandlingMiddleware(filePath) || updated;
        
        if (updated) {
          this.results.filesUpdated++;
          if (this.verbose) {
            console.log(`  ✅ Updated middleware usage in ${this.getRelativePath(filePath)}`);
          }
        }
        
        // Validate migration
        const validation = await MiddlewareMigrationHelper.validateMiddlewareMigration(filePath);
        if (!validation.isValid) {
          this.results.warnings.push(...validation.issues.map(issue => 
            `${this.getRelativePath(filePath)}: ${issue}`
          ));
        }
        
      } catch (error) {
        this.results.errors.push(`Middleware migration error in ${filePath}: ${error}`);
      }
    }
    
    console.log(`✅ Middleware migration completed`);
  }

  private async runConfigMigration(): Promise<void> {
    console.log('⚙️  Running configuration migration...');
    
    const configFiles = await this.findFilesWithPattern([
      'process.env',
      'FEATURE_',
      'config'
    ]);

    for (const filePath of configFiles) {
      try {
        this.results.filesProcessed++;
        
        let updated = false;
        updated = await ConfigMigrationHelper.updateConfigImports(filePath) || updated;
        updated = await ConfigMigrationHelper.updateFeatureFlags(filePath) || updated;
        updated = await ConfigMigrationHelper.updateConfigObjects(filePath) || updated;
        
        if (updated) {
          this.results.filesUpdated++;
          if (this.verbose) {
            console.log(`  ✅ Updated configuration usage in ${this.getRelativePath(filePath)}`);
          }
        }
        
        // Validate migration
        const validation = await ConfigMigrationHelper.validateConfigMigration(filePath);
        if (!validation.isValid) {
          this.results.warnings.push(...validation.issues.map(issue => 
            `${this.getRelativePath(filePath)}: ${issue}`
          ));
        }
        
      } catch (error) {
        this.results.errors.push(`Config migration error in ${filePath}: ${error}`);
      }
    }
    
    console.log(`✅ Configuration migration completed`);
  }

  private async validateMigrations(): Promise<void> {
    console.log('🔍 Validating migrations...');
    
    // Check for any remaining old patterns
    const allFiles = await glob('**/*.{ts,tsx}', {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', 'core/**/*'],
      absolute: true
    });

    const oldPatterns = [
      { pattern: /src\/shared\/services\/CacheService/g, description: 'Old cache service import' },
      { pattern: /server\/infrastructure\/cache\/CacheService/g, description: 'Old server cache import' },
      { pattern: /\.\.\/middleware\/auth\.middleware/g, description: 'Old auth middleware import' },
      { pattern: /\.\.\/middleware\/validation\.middleware/g, description: 'Old validation middleware import' },
      { pattern: /process\.env\.REDIS_URL/g, description: 'Unmigrated Redis URL' },
      { pattern: /process\.env\.CACHE_TTL/g, description: 'Unmigrated cache TTL' }
    ];

    for (const filePath of allFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        for (const { pattern, description } of oldPatterns) {
          if (pattern.test(content)) {
            this.results.warnings.push(`${this.getRelativePath(filePath)}: ${description}`);
          }
        }
      } catch (error) {
        // Ignore files that can't be read
      }
    }
    
    console.log(`✅ Validation completed (${this.results.warnings.length} warnings)`);
  }

  private async generateFinalReport(): Promise<void> {
    const reportPath = join(process.cwd(), 'migration-final-report.md');
    
    let report = `# Core Utilities Migration Final Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}\n\n`;

    report += `## Summary\n\n`;
    report += `- Files processed: ${this.results.filesProcessed}\n`;
    report += `- Files updated: ${this.results.filesUpdated}\n`;
    report += `- Errors: ${this.results.errors.length}\n`;
    report += `- Warnings: ${this.results.warnings.length}\n`;
    report += `- Success: ${this.results.success ? '✅' : '❌'}\n\n`;

    if (this.results.errors.length > 0) {
      report += `## Errors\n\n`;
      for (const error of this.results.errors) {
        report += `- ❌ ${error}\n`;
      }
      report += '\n';
    }

    if (this.results.warnings.length > 0) {
      report += `## Warnings\n\n`;
      for (const warning of this.results.warnings) {
        report += `- ⚠️  ${warning}\n`;
      }
      report += '\n';
    }

    report += `## Next Steps\n\n`;
    if (this.dryRun) {
      report += `1. Review the warnings and errors above\n`;
      report += `2. Run the migration script without --dry-run to apply changes\n`;
      report += `3. Test the application thoroughly\n`;
      report += `4. Address any remaining warnings manually\n\n`;
    } else {
      report += `1. Test the application thoroughly\n`;
      report += `2. Address any remaining warnings manually\n`;
      report += `3. Remove legacy adapters once migration is complete\n`;
      report += `4. Update documentation and team knowledge\n\n`;
    }

    report += `## Migration Guides\n\n`;
    report += `### Cache Service Migration\n`;
    report += CacheMigrationHelper.generateCacheConfigMigration();
    report += `\n### Middleware Migration\n`;
    report += MiddlewareMigrationHelper.generateMiddlewareConfigMigration();
    report += `\n### Configuration Migration\n`;
    report += ConfigMigrationHelper.generateConfigMigrationGuide();

    await fs.writeFile(reportPath, report);
    console.log(`📊 Final migration report generated: ${reportPath}`);
  }

  private async findFilesWithPattern(patterns: string[]): Promise<string[]> {
    const allFiles = await glob('**/*.{ts,tsx}', {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', 'core/**/*'],
      absolute: true
    });

    const matchingFiles: string[] = [];

    for (const filePath of allFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        for (const pattern of patterns) {
          if (content.includes(pattern)) {
            matchingFiles.push(filePath);
            break; // Only add file once
          }
        }
      } catch (error) {
        // Ignore files that can't be read
      }
    }

    return matchingFiles;
  }

  private getRelativePath(filePath: string): string {
    return filePath.replace(process.cwd(), '.');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const verbose = args.includes('--verbose') || args.includes('-v');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
Core Utilities Migration Runner

Usage:
  npm run run-migration [options]

Options:
  --dry-run, -d     Run in dry-run mode (show changes without applying them)
  --verbose, -v     Show detailed output for each file processed
  --help, -h        Show this help message

Examples:
  npm run run-migration --dry-run --verbose    # Preview changes with details
  npm run run-migration                        # Apply changes
`);
    return;
  }

  try {
    const runner = new MigrationRunner({ dryRun, verbose });
    const result = await runner.runMigration();
    
    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { MigrationRunner };