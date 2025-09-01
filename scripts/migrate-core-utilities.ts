#!/usr/bin/env ts-node

/**
 * Core Utilities Migration Script
 * 
 * This script migrates existing service references and imports to use the new core utilities.
 * It updates cache service imports, middleware usage, configuration references, and logging calls.
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { glob } from 'glob';

interface MigrationRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

interface FileUpdate {
  filePath: string;
  originalContent: string;
  updatedContent: string;
  changes: string[];
}

class CoreUtilitiesMigrator {
  private migrationRules: MigrationRule[] = [];
  private fileUpdates: FileUpdate[] = [];
  private dryRun: boolean = false;

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun;
    this.setupMigrationRules();
  }

  private setupMigrationRules(): void {
    // Cache service import migrations
    this.migrationRules.push(
      {
        pattern: /import\s*{\s*cacheService\s*}\s*from\s*["']\.\.\/\.\.\/src\/shared\/services\/CacheService["']/g,
        replacement: "import { cacheService } from '../core/src/cache'",
        description: "Migrate frontend cache service import"
      },
      {
        pattern: /import\s*{\s*cacheService\s*}\s*from\s*["']\.\.\/services\/CacheService["']/g,
        replacement: "import { cacheService } from '../core/src/cache'",
        description: "Migrate relative cache service import"
      },
      {
        pattern: /import\s*{\s*CacheService\s*}\s*from\s*["']\.\.\/infrastructure\/cache["']/g,
        replacement: "import { CacheService } from '../core/src/cache'",
        description: "Migrate server cache service import"
      },
      {
        pattern: /import\s*{\s*CacheService\s*,\s*defaultCacheConfig\s*}\s*from\s*["']\.\.\/infrastructure\/cache["']/g,
        replacement: "import { CacheService, defaultCacheConfig } from '../core/src/cache'",
        description: "Migrate server cache service with config import"
      },
      {
        pattern: /import\s*{\s*cacheService\s*,\s*CacheKeys\s*}\s*from\s*["']\.\.\/infrastructure\/cache["']/g,
        replacement: "import { cacheService, CacheKeys } from '../core/src/cache'",
        description: "Migrate cache service with keys import"
      },
      {
        pattern: /import\s*{\s*cacheService\s*,\s*CacheKeys\s*,\s*CacheOptions\s*}\s*from\s*["']\.\.\/infrastructure\/cache["']/g,
        replacement: "import { cacheService, CacheKeys, CacheOptions } from '../core/src/cache'",
        description: "Migrate cache service with keys and options import"
      }
    );

    // Middleware import migrations
    this.migrationRules.push(
      {
        pattern: /import\s*{\s*requireAuth\s*,\s*AuthenticatedRequest\s*}\s*from\s*["']\.\.\/middleware\/auth\.middleware["']/g,
        replacement: "import { requireAuth, AuthenticatedRequest } from '@triplecheck/core/middleware'",
        description: "Migrate auth middleware import"
      },
      {
        pattern: /import\s*{\s*validateRequest\s*}\s*from\s*["']\.\.\/middleware\/validation\.middleware["']/g,
        replacement: "import { validateRequest } from '@triplecheck/core/middleware'",
        description: "Migrate validation middleware import"
      },
      {
        pattern: /import\s*{\s*cacheResponse\s*}\s*from\s*["']\.\.\/middleware\/cache\.middleware["']/g,
        replacement: "import { cacheResponse } from '@triplecheck/core/middleware'",
        description: "Migrate cache middleware import"
      }
    );

    // Configuration import migrations
    this.migrationRules.push(
      {
        pattern: /process\.env\.REDIS_HOST/g,
        replacement: "configManager.config.cache.redisUrl",
        description: "Migrate Redis host environment variable"
      },
      {
        pattern: /process\.env\.CACHE_TTL_SECONDS/g,
        replacement: "configManager.config.cache.defaultTtlSec",
        description: "Migrate cache TTL environment variable"
      },
      {
        pattern: /process\.env\.LOG_LEVEL/g,
        replacement: "configManager.config.log.level",
        description: "Migrate log level environment variable"
      }
    );

    // Logging migrations
    this.migrationRules.push(
      {
        pattern: /console\.log\(/g,
        replacement: "logger.info(",
        description: "Migrate console.log to structured logging"
      },
      {
        pattern: /console\.error\(/g,
        replacement: "logger.error(",
        description: "Migrate console.error to structured logging"
      },
      {
        pattern: /console\.warn\(/g,
        replacement: "logger.warn(",
        description: "Migrate console.warn to structured logging"
      },
      {
        pattern: /console\.info\(/g,
        replacement: "logger.info(",
        description: "Migrate console.info to structured logging"
      }
    );

    // Error handling migrations
    this.migrationRules.push(
      {
        pattern: /import\s*{\s*ValidationError\s*}\s*from\s*["']\.\.\/\.\.\/src\/shared\/error-handling["']/g,
        replacement: "import { ValidationError } from '../core/src/error-handling'",
        description: "Migrate ValidationError import"
      },
      {
        pattern: /import\s*{\s*AppError\s*}\s*from\s*["']\.\.\/shared\/error-handling["']/g,
        replacement: "import { AppError } from '../core/src/error-handling'",
        description: "Migrate AppError import"
      }
    );

    // Validation service migrations
    this.migrationRules.push(
      {
        pattern: /import\s*{\s*z\s*}\s*from\s*["']zod["']/g,
        replacement: "import { z, ValidationService } from '../core/src/validation'",
        description: "Migrate Zod import to include ValidationService"
      }
    );
  }

  async migrateProject(): Promise<void> {
    console.log('🚀 Starting Core Utilities Migration...');
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    console.log('');

    // Find all TypeScript files to migrate
    const files = await this.findFilesToMigrate();
    console.log(`📁 Found ${files.length} files to process`);

    // Process each file
    for (const filePath of files) {
      await this.processFile(filePath);
    }

    // Generate migration report
    await this.generateMigrationReport();

    // Apply changes if not dry run
    if (!this.dryRun) {
      await this.applyChanges();
    }

    console.log('✅ Migration completed successfully!');
  }

  private async findFilesToMigrate(): Promise<string[]> {
    const patterns = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'server/**/*.ts',
      'scripts/**/*.ts',
      'tests/**/*.ts'
    ];

    const excludePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.d.ts',
      'core/**/*' // Don't migrate core module itself
    ];

    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matchedFiles = await glob(pattern, {
        ignore: excludePatterns,
        absolute: true
      });
      files.push(...matchedFiles);
    }

    return [...new Set(files)]; // Remove duplicates
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      const originalContent = await fs.readFile(filePath, 'utf-8');
      let updatedContent = originalContent;
      const changes: string[] = [];

      // Apply each migration rule
      for (const rule of this.migrationRules) {
        const matches = originalContent.match(rule.pattern);
        if (matches) {
          updatedContent = updatedContent.replace(rule.pattern, rule.replacement);
          changes.push(`${rule.description} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`);
        }
      }

      // Only track files that have changes
      if (changes.length > 0) {
        this.fileUpdates.push({
          filePath,
          originalContent,
          updatedContent,
          changes
        });

        console.log(`📝 ${filePath.replace(process.cwd(), '.')}: ${changes.length} change${changes.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
    }
  }

  private async generateMigrationReport(): Promise<void> {
    const reportPath = join(process.cwd(), 'migration-report.md');
    
    let report = `# Core Utilities Migration Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}\n\n`;

    report += `## Summary\n\n`;
    report += `- Files processed: ${this.fileUpdates.length}\n`;
    report += `- Total changes: ${this.fileUpdates.reduce((sum, update) => sum + update.changes.length, 0)}\n\n`;

    report += `## Migration Rules Applied\n\n`;
    for (const rule of this.migrationRules) {
      const affectedFiles = this.fileUpdates.filter(update => 
        update.changes.some(change => change.includes(rule.description))
      );
      report += `- **${rule.description}**: ${affectedFiles.length} files\n`;
    }

    report += `\n## Files Modified\n\n`;
    for (const update of this.fileUpdates) {
      const relativePath = update.filePath.replace(process.cwd(), '.');
      report += `### ${relativePath}\n\n`;
      for (const change of update.changes) {
        report += `- ${change}\n`;
      }
      report += '\n';
    }

    report += `## Next Steps\n\n`;
    if (this.dryRun) {
      report += `1. Review the changes above\n`;
      report += `2. Run the migration script without --dry-run to apply changes\n`;
      report += `3. Test the application thoroughly\n`;
      report += `4. Update any remaining manual references\n\n`;
    } else {
      report += `1. Test the application thoroughly\n`;
      report += `2. Update any remaining manual references\n`;
      report += `3. Remove legacy adapters once migration is complete\n`;
      report += `4. Update documentation and team knowledge\n\n`;
    }

    report += `## Manual Updates Required\n\n`;
    report += `Some imports may require manual updates:\n\n`;
    report += `- Complex import statements with multiple destructured items\n`;
    report += `- Dynamic imports using require()\n`;
    report += `- Configuration objects that need restructuring\n`;
    report += `- Custom middleware that extends core patterns\n\n`;

    await fs.writeFile(reportPath, report);
    console.log(`📊 Migration report generated: ${reportPath}`);
  }

  private async applyChanges(): Promise<void> {
    console.log('\n🔄 Applying changes...');
    
    for (const update of this.fileUpdates) {
      try {
        // Ensure directory exists
        await fs.mkdir(dirname(update.filePath), { recursive: true });
        
        // Write updated content
        await fs.writeFile(update.filePath, update.updatedContent);
        
        console.log(`✅ Updated ${update.filePath.replace(process.cwd(), '.')}`);
      } catch (error) {
        console.error(`❌ Failed to update ${update.filePath}:`, error);
      }
    }
  }

  async addCoreImports(): Promise<void> {
    console.log('\n📦 Adding core utility imports to files that need them...');

    const filesToUpdate = this.fileUpdates.filter(update => 
      update.changes.some(change => 
        change.includes('console.log') || 
        change.includes('console.error') ||
        change.includes('configManager')
      )
    );

    for (const update of filesToUpdate) {
      let content = update.updatedContent;
      const needsLogger = update.changes.some(change => change.includes('console'));
      const needsConfig = update.changes.some(change => change.includes('configManager'));

      // Add imports at the top of the file
      const imports: string[] = [];
      
      if (needsLogger) {
        imports.push("import { logger } from '../core/src/logging';");
      }
      
      if (needsConfig) {
        imports.push("import { configManager } from '@triplecheck/core/config';");
      }

      if (imports.length > 0) {
        // Find the last import statement
        const importRegex = /^import\s+.*?;$/gm;
        const matches = [...content.matchAll(importRegex)];
        
        if (matches.length > 0) {
          const lastImport = matches[matches.length - 1];
          const insertPosition = lastImport.index! + lastImport[0].length;
          
          content = content.slice(0, insertPosition) + 
                   '\n' + imports.join('\n') + 
                   content.slice(insertPosition);
        } else {
          // No existing imports, add at the top
          content = imports.join('\n') + '\n\n' + content;
        }

        update.updatedContent = content;
      }
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
Core Utilities Migration Script

Usage:
  npm run migrate-core-utilities [options]

Options:
  --dry-run, -d    Run in dry-run mode (show changes without applying them)
  --help, -h       Show this help message

Examples:
  npm run migrate-core-utilities --dry-run    # Preview changes
  npm run migrate-core-utilities              # Apply changes
`);
    return;
  }

  try {
    const migrator = new CoreUtilitiesMigrator(dryRun);
    await migrator.migrateProject();
    await migrator.addCoreImports();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { CoreUtilitiesMigrator };