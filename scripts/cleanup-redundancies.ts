#!/usr/bin/env node

/**
 * Automated cleanup script for project redundancies
 * 
 * This script safely removes redundant files and consolidates duplicates
 * based on the project structure analysis.
 * 
 * Usage:
 *   node cleanup-redundancies.js [options]
 *   npm run cleanup -- [options]
 */

import { promises as fsPromises, constants } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CleanupOptions {
  dryRun: boolean;
  verbose: boolean;
  skipConfirmation: boolean;
}

interface DuplicateConfig {
  name: string;
  keep: string;
  remove: string;
  createWrapper?: string;
}

interface BarrelExportConfig {
  path: string;
  pattern: RegExp;
  exclude: string[];
}

interface CleanupStats {
  filesRemoved: number;
  filesCreated: number;
  filesMoved: number;
  errors: number;
}

class RedundancyCleanup {
  private options: CleanupOptions;
  private removedFiles: string[] = [];
  private createdFiles: string[] = [];
  private movedFiles: Array<{ from: string; to: string }> = [];
  private errors: string[] = [];
  private stats: CleanupStats = {
    filesRemoved: 0,
    filesCreated: 0,
    filesMoved: 0,
    errors: 0
  };

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
    console.log(`   Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    
    if (!this.options.skipConfirmation && !this.options.dryRun) {
      const confirmed = await this.confirmAction();
      if (!confirmed) {
        console.log('❌ Cleanup cancelled by user');
        return;
      }
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

  private async confirmAction(): Promise<boolean> {
    console.log('\n⚠️  This will make changes to your file system.');
    console.log('   Run with --dry-run first to see what would be changed.');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('   Continue? (y/N): ', (answer: string) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  private async removeCompiledFiles(): Promise<void> {
    console.log('\n📁 Phase 1: Removing compiled files from src/ directory...');

    const srcDir = join(process.cwd(), 'src');
    
    if (!await this.fileExists(srcDir)) {
      console.log('   ⚠️  src/ directory not found, skipping...');
      return;
    }

    const compiledFiles = await this.findCompiledFiles(srcDir);

    if (compiledFiles.length === 0) {
      console.log('   ✓ No compiled files found');
      return;
    }

    console.log(`   Found ${compiledFiles.length} compiled file(s)`);

    for (const file of compiledFiles) {
      if (this.options.verbose) {
        console.log(`   - ${this.getRelativePath(file)}`);
      }

      if (!this.options.dryRun) {
        try {
          await fsPromises.unlink(file);
          this.removedFiles.push(file);
          this.stats.filesRemoved++;
        } catch (error) {
          const errorMsg = `Could not remove ${file}: ${error}`;
          console.warn(`   ⚠️  ${errorMsg}`);
          this.errors.push(errorMsg);
          this.stats.errors++;
        }
      } else {
        this.removedFiles.push(file);
      }
    }

    console.log(`   ${this.options.dryRun ? 'Would remove' : 'Removed'} ${compiledFiles.length} file(s)`);
  }

  private async findCompiledFiles(dir: string): Promise<string[]> {
    const compiledFiles: string[] = [];
    const excludeDirs = new Set(['node_modules', 'dist', 'build', '.git', 'coverage']);

    const walkDir = async (currentDir: string): Promise<void> => {
      try {
        const items = await fsPromises.readdir(currentDir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = join(currentDir, item.name);

          if (item.isDirectory()) {
            if (!excludeDirs.has(item.name)) {
              await walkDir(fullPath);
            }
          } else if (item.isFile()) {
            // Check if it's a compiled file with a corresponding TypeScript source
            if (fullPath.endsWith('.js') || fullPath.endsWith('.d.ts')) {
              const tsFile = fullPath.replace(/\.(js|d\.ts)$/, '.ts');
              const tsxFile = fullPath.replace(/\.(js|d\.ts)$/, '.tsx');

              // Only mark as compiled if source exists
              if (await this.fileExists(tsFile) || await this.fileExists(tsxFile)) {
                compiledFiles.push(fullPath);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`   ⚠️  Could not read directory ${currentDir}: ${error}`);
      }
    };

    await walkDir(dir);
    return compiledFiles;
  }

  private async consolidateDuplicateComponents(): Promise<void> {
    console.log('\n🔄 Phase 2: Consolidating duplicate components...');

    const duplicates: DuplicateConfig[] = [
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

    let processedCount = 0;

    for (const duplicate of duplicates) {
      console.log(`   Processing ${duplicate.name}...`);

      const keepPath = join(process.cwd(), duplicate.keep);
      const removePath = join(process.cwd(), duplicate.remove);

      const keepExists = await this.fileExists(keepPath);
      const removeExists = await this.fileExists(removePath);

      if (!keepExists && !removeExists) {
        console.log(`   ⊘ Skipping - neither file exists`);
        continue;
      }

      if (!keepExists) {
        console.log(`   ⚠️  Warning - keep file ${duplicate.keep} not found`);
        continue;
      }

      if (!removeExists) {
        console.log(`   ⊘ Remove file ${duplicate.remove} already removed`);
        continue;
      }

      // Create wrapper if specified
      if (duplicate.createWrapper) {
        const wrapperPath = join(process.cwd(), duplicate.createWrapper);
        await this.createPageWrapper(keepPath, wrapperPath, duplicate.name);
      }

      // Remove duplicate file
      if (!this.options.dryRun) {
        try {
          await fsPromises.unlink(removePath);
          this.removedFiles.push(removePath);
          this.stats.filesRemoved++;
          processedCount++;
          console.log(`   ✓ Removed ${this.getRelativePath(removePath)}`);
        } catch (error) {
          const errorMsg = `Could not remove ${removePath}: ${error}`;
          console.warn(`   ⚠️  ${errorMsg}`);
          this.errors.push(errorMsg);
          this.stats.errors++;
        }
      } else {
        this.removedFiles.push(removePath);
        processedCount++;
        console.log(`   ✓ Would remove ${this.getRelativePath(removePath)}`);
      }
    }

    console.log(`   Processed ${processedCount} duplicate(s)`);
  }

  private async createPageWrapper(
    componentPath: string,
    wrapperPath: string,
    componentName: string
  ): Promise<void> {
    const wrapperContent = `import React from 'react';
import ${componentName} from '../components/${componentName}';

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
        const dir = dirname(wrapperPath);
        await fsPromises.mkdir(dir, { recursive: true });
        
        await fsPromises.writeFile(wrapperPath, wrapperContent, 'utf8');
        this.createdFiles.push(wrapperPath);
        this.stats.filesCreated++;
        console.log(`   ✓ Created wrapper: ${this.getRelativePath(wrapperPath)}`);
      } catch (error) {
        const errorMsg = `Could not create wrapper ${wrapperPath}: ${error}`;
        console.warn(`   ⚠️  ${errorMsg}`);
        this.errors.push(errorMsg);
        this.stats.errors++;
      }
    } else {
      this.createdFiles.push(wrapperPath);
      console.log(`   ✓ Would create wrapper: ${this.getRelativePath(wrapperPath)}`);
    }
  }

  private async createBarrelExports(): Promise<void> {
    console.log('\n📦 Phase 3: Creating barrel exports...');

    const directories: BarrelExportConfig[] = [
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

    let createdCount = 0;

    for (const dir of directories) {
      const dirPath = join(process.cwd(), dir.path);
      
      if (await this.fileExists(dirPath)) {
        const created = await this.createBarrelExport(dirPath, dir.pattern, dir.exclude);
        if (created) createdCount++;
      } else {
        console.log(`   ⊘ Skipping ${dir.path} - directory not found`);
      }
    }

    console.log(`   Created ${createdCount} barrel export(s)`);
  }

  private async createBarrelExport(
    dirPath: string,
    pattern: RegExp,
    exclude: string[]
  ): Promise<boolean> {
    try {
      const files = await fsPromises.readdir(dirPath);
      const exportFiles = files.filter((file: string) => 
        pattern.test(file) && 
        !exclude.some(ex => file.includes(ex))
      );

      if (exportFiles.length === 0) {
        console.log(`   ⊘ No files to export in ${this.getRelativePath(dirPath)}`);
        return false;
      }

      const exports = exportFiles
        .map((file: string) => {
          const name = basename(file, extname(file));
          return `export * from './${name}';`;
        })
        .join('\n');

      const indexContent = `/**
 * Barrel exports for ${this.getRelativePath(dirPath)}
 * 
 * This file provides a single entry point for importing components/hooks
 * from this directory, improving import statements and bundle optimization.
 * 
 * Auto-generated by cleanup-redundancies script
 */

${exports}
`;

      const indexPath = join(dirPath, 'index.ts');

      if (!this.options.dryRun) {
        await fsPromises.writeFile(indexPath, indexContent, 'utf8');
        this.createdFiles.push(indexPath);
        this.stats.filesCreated++;
        console.log(`   ✓ Created barrel: ${this.getRelativePath(indexPath)}`);
      } else {
        this.createdFiles.push(indexPath);
        console.log(`   ✓ Would create barrel: ${this.getRelativePath(indexPath)}`);
      }

      return true;
    } catch (error) {
      const errorMsg = `Could not create barrel export for ${dirPath}: ${error}`;
      console.warn(`   ⚠️  ${errorMsg}`);
      this.errors.push(errorMsg);
      this.stats.errors++;
      return false;
    }
  }

  private async updateGitignore(): Promise<void> {
    console.log('\n📝 Phase 4: Updating .gitignore...');

    const gitignorePath = join(process.cwd(), '.gitignore');
    const newRules = [
      '',
      '# Compiled TypeScript files in source directories',
      'src/**/*.js',
      'src/**/*.d.ts',
      '!src/**/*.config.js',
      '!src/**/*.test.js',
      ''
    ];

    try {
      let gitignoreContent = '';
      
      if (await this.fileExists(gitignorePath)) {
        gitignoreContent = await fsPromises.readFile(gitignorePath, 'utf8');
      }

      // Check if rules already exist
      const hasRules = newRules.some(rule => 
        rule.trim() && gitignoreContent.includes(rule.trim())
      );

      if (!hasRules) {
        const updatedContent = gitignoreContent.trimEnd() + '\n' + newRules.join('\n');

        if (!this.options.dryRun) {
          await fsPromises.writeFile(gitignorePath, updatedContent, 'utf8');
          console.log('   ✓ Updated .gitignore');
        } else {
          console.log('   ✓ Would update .gitignore');
        }
      } else {
        console.log('   ⊘ .gitignore already contains necessary rules');
      }
    } catch (error) {
      const errorMsg = `Could not update .gitignore: ${error}`;
      console.warn(`   ⚠️  ${errorMsg}`);
      this.errors.push(errorMsg);
      this.stats.errors++;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fsPromises.access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private getRelativePath(fullPath: string): string {
    return fullPath.replace(process.cwd() + '/', '');
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(70));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(70));

    console.log(`\n📊 Statistics (${this.options.dryRun ? 'PLANNED' : 'COMPLETED'}):`);
    console.log(`   Files removed:  ${this.stats.filesRemoved}`);
    console.log(`   Files created:  ${this.stats.filesCreated}`);
    console.log(`   Files moved:    ${this.stats.filesMoved}`);
    console.log(`   Errors:         ${this.stats.errors}`);

    if (this.options.verbose && this.removedFiles.length > 0) {
      console.log('\n🗑️  Removed Files:');
      const displayCount = Math.min(this.removedFiles.length, 15);
      this.removedFiles.slice(0, displayCount).forEach(file => {
        console.log(`   - ${this.getRelativePath(file)}`);
      });
      if (this.removedFiles.length > displayCount) {
        console.log(`   ... and ${this.removedFiles.length - displayCount} more`);
      }
    }

    if (this.options.verbose && this.createdFiles.length > 0) {
      console.log('\n📄 Created Files:');
      this.createdFiles.forEach(file => {
        console.log(`   - ${this.getRelativePath(file)}`);
      });
    }

    if (this.errors.length > 0) {
      console.log('\n⚠️  Errors Encountered:');
      this.errors.slice(0, 5).forEach(error => {
        console.log(`   - ${error}`);
      });
      if (this.errors.length > 5) {
        console.log(`   ... and ${this.errors.length - 5} more errors`);
      }
    }

    if (this.options.dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No files were actually changed.');
      console.log('   Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Cleanup completed!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Review the changes made');
      console.log('   2. Update import statements if needed');
      console.log('   3. Run tests: npm test');
      console.log('   4. Build project: npm run build');
      console.log('   5. Commit changes: git add . && git commit');
    }

    console.log('='.repeat(70));
  }
}

// CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  const options: Partial<CleanupOptions> = {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    skipConfirmation: args.includes('--yes') || args.includes('-y')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║              Redundancy Cleanup Tool v1.0                          ║
╚════════════════════════════════════════════════════════════════════╝

Safely removes redundant files and consolidates duplicates in your project.

Usage:
  node cleanup-redundancies.js [options]
  npm run cleanup -- [options]

Options:
  --dry-run, -d     Show what would be changed without making changes
  --verbose, -v     Show detailed output including all file operations
  --yes, -y         Skip confirmation prompts (use with caution)
  --help, -h        Show this help message

Examples:
  # Safe preview of changes
  node cleanup-redundancies.js --dry-run

  # Detailed preview
  node cleanup-redundancies.js --dry-run --verbose

  # Execute cleanup with confirmation
  node cleanup-redundancies.js

  # Execute cleanup without prompts (CI/CD)
  node cleanup-redundancies.js --yes

What this script does:
  1. Removes compiled .js and .d.ts files from src/ (when .ts/.tsx exists)
  2. Consolidates duplicate components
  3. Creates barrel exports (index.ts) for better imports
  4. Updates .gitignore to prevent future compiled files

⚠️  Always run with --dry-run first to review changes!
`);
    process.exit(0);
  }

  try {
    const cleanup = new RedundancyCleanup(options);
    await cleanup.cleanup();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { RedundancyCleanup, CleanupOptions };