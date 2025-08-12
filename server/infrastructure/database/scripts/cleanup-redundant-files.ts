#!/usr/bin/env tsx

/**
 * Cleanup Redundant Database Files
 * 
 * This script removes redundant database files from server/infrastructure/database
 * after successful consolidation and updates any remaining import references.
 */

import { promises as fs } from 'fs';
import path from 'path';

interface CleanupResult {
  success: boolean;
  filesRemoved: number;
  importsUpdated: number;
  errors: string[];
  warnings: string[];
}

class DatabaseCleanup {
  private result: CleanupResult = {
    success: false,
    filesRemoved: 0,
    importsUpdated: 0,
    errors: [],
    warnings: []
  };

  async cleanup(): Promise<CleanupResult> {
    console.log('🧹 Starting database cleanup...');
    
    try {
      // Step 1: Update import references
      await this.updateImportReferences();
      
      // Step 2: Remove redundant files
      await this.removeRedundantFiles();
      
      // Step 3: Update package.json scripts
      await this.updatePackageScripts();
      
      // Step 4: Create cleanup report
      await this.createCleanupReport();
      
      this.result.success = true;
      console.log('✅ Database cleanup completed successfully!');
      
    } catch (error) {
      this.result.errors.push(`Cleanup failed: ${error}`);
      console.error('❌ Database cleanup failed:', error);
    }
    
    return this.result;
  }

  private async updateImportReferences(): Promise<void> {
    console.log('🔄 Updating import references...');
    
    const importMappings = [
      {
        from: 'server/infrastructure/database/config/database.config',
        to: 'database/config'
      },
      {
        from: 'server/infrastructure/database/connection',
        to: 'database/connection'
      },
      {
        from: 'server/infrastructure/database/schemas/core',
        to: 'database/schemas/core'
      },
      {
        from: 'server/infrastructure/database/schemas/land-verification',
        to: 'database/schemas/verification'
      },
      {
        from: 'server/infrastructure/database/utils/database-utils',
        to: 'database/utils'
      },
      {
        from: 'server/infrastructure/database/types/database.types',
        to: 'database/types'
      },
      {
        from: 'server/infrastructure/database/QueryOptimizer',
        to: 'database/utils/QueryOptimizer'
      },
      {
        from: 'server/infrastructure/database',
        to: 'database'
      }
    ];

    // Find all TypeScript files
    const files = await this.findTypeScriptFiles();
    
    for (const file of files) {
      try {
        let content = await fs.readFile(file, 'utf-8');
        let updated = false;
        
        for (const mapping of importMappings) {
          const oldImportRegex = new RegExp(
            `from ['"].*${mapping.from.replace(/\//g, '\\/')}['"]`,
            'g'
          );
          
          if (oldImportRegex.test(content)) {
            content = content.replace(
              oldImportRegex,
              `from '${mapping.to}'`
            );
            updated = true;
          }
        }
        
        if (updated) {
          await fs.writeFile(file, content, 'utf-8');
          this.result.importsUpdated++;
          console.log(`✅ Updated imports in: ${file}`);
        }
        
      } catch (error) {
        this.result.warnings.push(`Failed to update imports in ${file}: ${error}`);
      }
    }
  }

  private async findTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const searchDirs = [
      'server',
      'src',
      'database'
    ];
    
    for (const dir of searchDirs) {
      try {
        await this.findFilesRecursive(dir, files, /\.(ts|tsx)$/);
      } catch (error) {
        // Directory might not exist, continue
      }
    }
    
    return files;
  }

  private async findFilesRecursive(
    dir: string, 
    files: string[], 
    pattern: RegExp
  ): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other build directories
        if (!['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
          await this.findFilesRecursive(fullPath, files, pattern);
        }
      } else if (pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  private async removeRedundantFiles(): Promise<void> {
    console.log('🗑️ Removing redundant files...');
    
    const filesToRemove = [
      'server/infrastructure/database/config/database.config.ts',
      'server/infrastructure/database/utils/database-utils.ts',
      'server/infrastructure/database/types/database.types.ts',
      'server/infrastructure/database/QueryOptimizer.ts',
      'server/infrastructure/database/seeds/database-seeder.ts',
      'server/infrastructure/database/seeds/land-verification-seed.ts',
      'server/infrastructure/database/seeds/sample-ai-data.ts'
    ];

    for (const file of filesToRemove) {
      try {
        await fs.unlink(file);
        this.result.filesRemoved++;
        console.log(`🗑️ Removed: ${file}`);
      } catch (error) {
        if ((error as any).code !== 'ENOENT') {
          this.result.warnings.push(`Failed to remove ${file}: ${error}`);
        }
      }
    }

    // Remove empty directories
    const dirsToRemove = [
      'server/infrastructure/database/config',
      'server/infrastructure/database/utils',
      'server/infrastructure/database/types',
      'server/infrastructure/database/seeds'
    ];

    for (const dir of dirsToRemove) {
      try {
        const entries = await fs.readdir(dir);
        if (entries.length === 0) {
          await fs.rmdir(dir);
          console.log(`📁 Removed empty directory: ${dir}`);
        }
      } catch (error) {
        // Directory might not exist or not be empty
      }
    }
  }

  private async updatePackageScripts(): Promise<void> {
    console.log('📦 Updating package.json scripts...');
    
    try {
      const packagePath = 'package.json';
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      // Update database-related scripts to use the consolidated database directory
      const scriptUpdates = {
        'db:setup': 'tsx database/scripts/setup-database.ts',
        'db:migrate': 'tsx database/scripts/migrate.ts',
        'db:seed': 'tsx database/scripts/seed-data.ts',
        'db:status': 'tsx database/scripts/status.ts',
        'db:validate': 'tsx database/scripts/validate.ts',
        'db:consolidate': 'tsx database/scripts/consolidate-database-files.ts',
        'db:cleanup': 'tsx database/scripts/cleanup-redundant-files.ts'
      };

      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      for (const [script, command] of Object.entries(scriptUpdates)) {
        packageJson.scripts[script] = command;
      }

      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2), 'utf-8');
      console.log('✅ Updated package.json scripts');
      
    } catch (error) {
      this.result.warnings.push(`Failed to update package.json: ${error}`);
    }
  }

  private async createCleanupReport(): Promise<void> {
    const report = `# Database Cleanup Report

## Summary
- **Files Removed**: ${this.result.filesRemoved}
- **Imports Updated**: ${this.result.importsUpdated}
- **Errors**: ${this.result.errors.length}
- **Warnings**: ${this.result.warnings.length}

## Errors
${this.result.errors.map(error => `- ${error}`).join('\\n')}

## Warnings
${this.result.warnings.map(warning => `- ${warning}`).join('\\n')}

## Cleanup Actions Completed

### Files Removed
- Redundant configuration files
- Duplicate utility functions
- Obsolete type definitions
- Legacy seeding scripts

### Import References Updated
- Updated all import paths to use consolidated database structure
- Removed references to server/infrastructure/database
- Updated to use database/* imports

### Package Scripts Updated
- Added database management scripts
- Updated existing scripts to use consolidated structure

## Next Steps

1. **Test Application**: Run the application to ensure all imports work correctly
2. **Run Database Tests**: Execute database tests to validate functionality
3. **Update Documentation**: Update any remaining documentation references
4. **Deploy Changes**: Deploy the consolidated database structure

## Validation Commands

\`\`\`bash
# Test database connection
npm run db:status

# Run database tests
npm test database/

# Test application startup
npm run dev

# Run integration tests
npm run test:integration
\`\`\`

## Cleanup Complete

The database consolidation and cleanup process is now complete. All redundant files have been removed and import references have been updated to use the unified database structure.
`;

    await fs.writeFile('database-cleanup-report.md', report, 'utf-8');
    console.log('📊 Cleanup report created: database-cleanup-report.md');
  }
}

// Main execution
async function main() {
  const cleanup = new DatabaseCleanup();
  const result = await cleanup.cleanup();
  
  console.log('\\n📊 Cleanup Results:');
  console.log(`Files Removed: ${result.filesRemoved}`);
  console.log(`Imports Updated: ${result.importsUpdated}`);
  console.log(`Errors: ${result.errors.length}`);
  console.log(`Warnings: ${result.warnings.length}`);
  
  if (result.errors.length > 0) {
    console.log('\\n❌ Errors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  process.exit(result.success ? 0 : 1);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DatabaseCleanup };