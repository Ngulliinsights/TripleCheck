#!/usr/bin/env tsx

/**
 * Automated cleanup script for project redundancies
 * 
 * This script safely removes redundant files and consolidates duplicates
 * based on the project structure analysis.
 */

import * as fs from 'fs';
import * as path from 'path';

interface CleanupOptions {
  dryRun: boolean;
  verbose: boolean;
  skipConfirmation: boolean;
}

class RedundancyCleanup {
  private options: CleanupOptions;
  private removedFiles: string[] = [];
  private movedFiles: Array<{ from: string; to: string }> = [];

  constructor(options: Partial<CleanupOptions> = {}) {
    this.options = {
      dryRun: false,
      verbose: false,
      skipConfirmation: false,
      ...options
    };
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Starting automated redundancy cleanup...');
    
    if (!this.options.skipConfirmation && !this.options.dryRun) {
      console.log('\n⚠️  This will make changes to your file system.');
      console.log('   Run with --dry-run first to see what would be changed.');
      console.log('   Press Ctrl+C to cancel, or Enter to continue...');
      
      // In a real implementation, would wait for user input
      // For now, we'll proceed with dry run mode
      this.options.dryRun = true;
      console.log('   Running in DRY RUN mode for safety...');
    }

    try {
      // Phase 1: Remove compiled files from src/
      await this.removeCompiledFiles();

      // Phase 2: Consolidate duplicate components
      await this.consolidateDuplicateComponents();

      // Phase 3: Create barrel exports
      await this.createBarrelExports();

      // Phase 4: Update gitignore
      await this.updateGitignore();

      this.printSummary();
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  private async removeCompiledFiles(): Promise<void> {
    console.log('\n📁 Removing compiled files from src/ directory...');

    const srcDir = 'src';
    const compiledFiles = await this.findCompiledFiles(srcDir);

    console.log(`   Found ${compiledFiles.length} compiled files to remove`);

    for (const file of compiledFiles) {
      if (this.options.verbose) {
        console.log(`   - ${file}`);
      }

      if (!this.options.dryRun) {
        try {
          await fs.promises.unlink(file);
          this.removedFiles.push(file);
        } catch (error) {
          console.warn(`   Warning: Could not remove ${file}`);
        }
      } else {
        this.removedFiles.push(file);
      }
    }

    console.log(`   ${this.options.dryRun ? 'Would remove' : 'Removed'} ${compiledFiles.length} compiled files`);
  }

  private async findCompiledFiles(dir: string): Promise<string[]> {
    const compiledFiles: string[] = [];

    const walkDir = async (currentDir: string): Promise<void> => {
      try {
        const items = await fs.promises.readdir(currentDir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(currentDir, item.name);

          if (item.isDirectory() && !['node_modules', 'dist', 'build'].includes(item.name)) {
            await walkDir(fullPath);
          } else if (item.isFile()) {
            // Check if it's a compiled file with a corresponding TypeScript source
            if (fullPath.endsWith('.js') || fullPath.endsWith('.d.ts')) {
              const tsFile = fullPath.replace(/\.(js|d\.ts)$/, '.ts');
              const tsxFile = fullPath.replace(/\.(js|d\.ts)$/, '.tsx');

              if (await this.fileExists(tsFile) || await this.fileExists(tsxFile)) {
                compiledFiles.push(fullPath);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read directory ${currentDir}`);
      }
    };

    await walkDir(dir);
    return compiledFiles;
  }

  private async consolidateDuplicateComponents(): Promise<void> {
    console.log('\n🔄 Consolidating duplicate components...');

    const duplicates = [
      {
        name: 'PropertyMap',
        keep: 'src/property/components/PropertyMap.tsx',
        remove: 'src/property/pages/PropertyMap.tsx',
        createWrapper: 'src/property/pages/PropertyMapPage.tsx'
      },
      {
        name: 'MobileNav',
        keep: 'src/shared/components/navigation/MobileNav.tsx',
        remove: 'src/shared/components/layout/MobileNav.tsx'
      },
      {
        name: 'LazyComponents',
        keep: 'src/shared/components/lazy/LazyComponents.tsx',
        remove: 'src/shared/components/LazyComponents.tsx'
      }
    ];

    for (const duplicate of duplicates) {
      console.log(`   Processing ${duplicate.name}...`);

      if (await this.fileExists(duplicate.keep) && await this.fileExists(duplicate.remove)) {
        // Create wrapper if specified
        if (duplicate.createWrapper) {
          await this.createPageWrapper(duplicate.keep, duplicate.createWrapper, duplicate.name);
        }

        // Remove duplicate file
        if (!this.options.dryRun) {
          try {
            await fs.promises.unlink(duplicate.remove);
            this.removedFiles.push(duplicate.remove);
          } catch (error) {
            console.warn(`   Warning: Could not remove ${duplicate.remove}`);
          }
        } else {
          this.removedFiles.push(duplicate.remove);
        }

        console.log(`   ${this.options.dryRun ? 'Would remove' : 'Removed'} ${duplicate.remove}`);
      } else {
        console.log(`   Skipping ${duplicate.name} - files not found as expected`);
      }
    }
  }

  private async createPageWrapper(componentPath: string, wrapperPath: string, componentName: string): Promise<void> {
    const wrapperContent = `import React from 'react';
import { ${componentName} } from '../components/${componentName}';

/**
 * ${componentName} Page
 * 
 * Page wrapper for the ${componentName} component.
 * This provides page-level functionality while keeping the component reusable.
 */
export default function ${componentName}Page() {
  return (
    <div className="page-container">
      <${componentName} />
    </div>
  );
}
`;

    if (!this.options.dryRun) {
      try {
        // Ensure directory exists
        const dir = path.dirname(wrapperPath);
        await fs.promises.mkdir(dir, { recursive: true });
        
        await fs.promises.writeFile(wrapperPath, wrapperContent);
        console.log(`   Created page wrapper: ${wrapperPath}`);
      } catch (error) {
        console.warn(`   Warning: Could not create wrapper ${wrapperPath}`);
      }
    } else {
      console.log(`   Would create page wrapper: ${wrapperPath}`);
    }
  }

  private async createBarrelExports(): Promise<void> {
    console.log('\n📦 Creating barrel exports...');

    const directories = [
      {
        path: 'src/property/components',
        pattern: /\.tsx?$/,
        exclude: ['index.ts', 'index.tsx']
      },
      {
        path: 'src/shared/hooks',
        pattern: /\.ts$/,
        exclude: ['index.ts', '__tests__']
      },
      {
        path: 'src/shared/components/ui',
        pattern: /\.tsx$/,
        exclude: ['index.ts', 'index.tsx']
      }
    ];

    for (const dir of directories) {
      if (await this.fileExists(dir.path)) {
        await this.createBarrelExport(dir.path, dir.pattern, dir.exclude);
      }
    }
  }

  private async createBarrelExport(dirPath: string, pattern: RegExp, exclude: string[]): Promise<void> {
    try {
      const files = await fs.promises.readdir(dirPath);
      const exportFiles = files.filter(file => 
        pattern.test(file) && 
        !exclude.some(ex => file.includes(ex))
      );

      if (exportFiles.length === 0) return;

      const exports = exportFiles.map(file => {
        const name = path.basename(file, path.extname(file));
        return `export { ${name} } from './${name}';`;
      }).join('\n');

      const indexContent = `/**
 * Barrel exports for ${dirPath}
 * 
 * This file provides a single entry point for importing components/hooks
 * from this directory, improving import statements and bundle optimization.
 */

${exports}
`;

      const indexPath = path.join(dirPath, 'index.ts');

      if (!this.options.dryRun) {
        await fs.promises.writeFile(indexPath, indexContent);
        console.log(`   Created barrel export: ${indexPath}`);
      } else {
        console.log(`   Would create barrel export: ${indexPath}`);
      }
    } catch (error) {
      console.warn(`   Warning: Could not create barrel export for ${dirPath}`);
    }
  }

  private async updateGitignore(): Promise<void> {
    console.log('\n📝 Updating .gitignore...');

    const gitignorePath = '.gitignore';
    const newRules = [
      '',
      '# Compiled TypeScript files in source directories',
      'src/**/*.js',
      'src/**/*.d.ts',
      '!src/**/*.config.js',
      '!src/**/*.test.js'
    ];

    try {
      let gitignoreContent = '';
      
      if (await this.fileExists(gitignorePath)) {
        gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf8');
      }

      // Check if rules already exist
      const hasRules = newRules.some(rule => gitignoreContent.includes(rule.trim()));

      if (!hasRules) {
        const updatedContent = gitignoreContent + '\n' + newRules.join('\n') + '\n';

        if (!this.options.dryRun) {
          await fs.promises.writeFile(gitignorePath, updatedContent);
          console.log('   Updated .gitignore with new rules');
        } else {
          console.log('   Would update .gitignore with new rules');
        }
      } else {
        console.log('   .gitignore already contains necessary rules');
      }
    } catch (error) {
      console.warn('   Warning: Could not update .gitignore');
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(60));

    console.log(`\n📊 ACTIONS ${this.options.dryRun ? 'PLANNED' : 'COMPLETED'}:`);
    console.log(`   Files removed: ${this.removedFiles.length}`);
    console.log(`   Files moved: ${this.movedFiles.length}`);

    if (this.options.verbose && this.removedFiles.length > 0) {
      console.log('\n🗑️  REMOVED FILES:');
      this.removedFiles.slice(0, 10).forEach(file => {
        console.log(`   - ${file}`);
      });
      if (this.removedFiles.length > 10) {
        console.log(`   ... and ${this.removedFiles.length - 10} more`);
      }
    }

    if (this.options.dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no files were actually changed.');
      console.log('   Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Cleanup completed successfully!');
      console.log('   Remember to:');
      console.log('   1. Update import statements if needed');
      console.log('   2. Run tests to ensure nothing is broken');
      console.log('   3. Commit changes to version control');
    }

    console.log('='.repeat(60));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: Partial<CleanupOptions> = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    skipConfirmation: args.includes('--yes') || args.includes('-y')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Redundancy Cleanup Tool

Usage: tsx scripts/cleanup-redundancies.ts [options]

Options:
  --dry-run         Show what would be changed without making changes
  --verbose, -v     Show detailed output
  --yes, -y         Skip confirmation prompts
  --help, -h        Show this help message

Examples:
  tsx scripts/cleanup-redundancies.ts --dry-run
  tsx scripts/cleanup-redundancies.ts --verbose --yes
`);
    return;
  }

  try {
    const cleanup = new RedundancyCleanup(options);
    await cleanup.cleanup();
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

main();