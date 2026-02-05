#!/usr/bin/env tsx

/**
 * Comprehensive Project Cleanup Script
 * 
 * Implements all audit recommendations:
 * 1. Remove all compiled files (.js/.d.ts) from src/
 * 2. Clean up redundant files
 * 3. Remove orphaned test files
 * 4. Organize project structure
 */

import * as fs from './add-b2b-messaging';
import * as path from './fix-core-import-paths';

class ComprehensiveCleanup {
  private removedFiles: string[] = [];
  private errors: string[] = [];

  async runCleanup(): Promise<void> {
    console.log('🧹 Starting comprehensive project cleanup...');
    
    // 1. Remove compiled files from src/
    await this.removeCompiledFiles();
    
    // 2. Remove dist directories from src/
    await this.removeDistDirectories();
    
    // 3. Clean up orphaned test files
    await this.cleanupOrphanedTests();
    
    // 4. Remove empty directories
    await this.removeEmptyDirectories();
    
    this.printSummary();
  }

  private async removeCompiledFiles(): Promise<void> {
    console.log('📁 Removing compiled files from src/ directory...');
    
    const compiledFiles = await this.findCompiledFiles('src');
    console.log(`   Found ${compiledFiles.length} compiled files`);

    for (const file of compiledFiles) {
      try {
        await fs.promises.unlink(file);
        this.removedFiles.push(file);
        console.log(`   ✓ Removed: ${path.relative('.', file)}`);
      } catch (error) {
        this.errors.push(`Failed to remove ${file}: ${error}`);
      }
    }
  }

  private async removeDistDirectories(): Promise<void> {
    console.log('📁 Removing dist directories from src/...');
    
    const distDirs = await this.findDistDirectories('src');
    console.log(`   Found ${distDirs.length} dist directories`);

    for (const dir of distDirs) {
      try {
        await this.removeDirectory(dir);
        this.removedFiles.push(dir + '/ (directory)');
        console.log(`   ✓ Removed directory: ${path.relative('.', dir)}`);
      } catch (error) {
        this.errors.push(`Failed to remove directory ${dir}: ${error}`);
      }
    }
  }

  private async cleanupOrphanedTests(): Promise<void> {
    console.log('🧪 Cleaning up orphaned test files...');
    
    const orphanedTests = await this.findOrphanedTests('src');
    console.log(`   Found ${orphanedTests.length} potentially orphaned test files`);

    for (const testFile of orphanedTests) {
      const sourceFile = this.getSourceFileForTest(testFile);
      if (!await this.fileExists(sourceFile)) {
        try {
          await fs.promises.unlink(testFile);
          this.removedFiles.push(testFile);
          console.log(`   ✓ Removed orphaned test: ${path.relative('.', testFile)}`);
        } catch (error) {
          this.errors.push(`Failed to remove test ${testFile}: ${error}`);
        }
      }
    }
  }

  private async removeEmptyDirectories(): Promise<void> {
    console.log('📂 Removing empty directories...');
    
    const emptyDirs = await this.findEmptyDirectories('src');
    console.log(`   Found ${emptyDirs.length} empty directories`);

    // Sort by depth (deepest first) to avoid removing parent before child
    emptyDirs.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);

    for (const dir of emptyDirs) {
      try {
        await fs.promises.rmdir(dir);
        this.removedFiles.push(dir + '/ (empty directory)');
        console.log(`   ✓ Removed empty directory: ${path.relative('.', dir)}`);
      } catch (error) {
        // Ignore errors for non-empty directories
        if (!error.message.includes('not empty')) {
          this.errors.push(`Failed to remove directory ${dir}: ${error}`);
        }
      }
    }
  }

  private async findCompiledFiles(dir: string): Promise<string[]> {
    const compiledFiles: string[] = [];

    const walkDir = async (currentDir: string): Promise<void> => {
      try {
        const items = await fs.promises.readdir(currentDir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(currentDir, item.name);

          if (item.isDirectory() && !['node_modules', 'dist', 'build', '.git'].includes(item.name)) {
            await walkDir(fullPath);
          } else if (item.isFile()) {
            // Check if it's a compiled file with a corresponding TypeScript source
            if (fullPath.endsWith('.js') || fullPath.endsWith('.d.ts')) {
              // Skip global.d.ts and other declaration files that don't have source
              if (item.name === 'global.d.ts' || item.name.includes('vite-env.d.ts')) {
                continue;
              }

              const tsFile = fullPath.replace(/\\.(js|d\\.ts)$/, '.ts');
              const tsxFile = fullPath.replace(/\\.(js|d\\.ts)$/, '.tsx');

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

  private async findDistDirectories(dir: string): Promise<string[]> {
    const distDirs: string[] = [];

    const walkDir = async (currentDir: string): Promise<void> => {
      try {
        const items = await fs.promises.readdir(currentDir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(currentDir, item.name);

          if (item.isDirectory()) {
            if (item.name === 'dist' && currentDir.startsWith('src')) {
              distDirs.push(fullPath);
            } else if (!['node_modules', 'build', '.git'].includes(item.name)) {
              await walkDir(fullPath);
            }
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read directory ${currentDir}`);
      }
    };

    await walkDir(dir);
    return distDirs;
  }

  private async findOrphanedTests(dir: string): Promise<string[]> {
    const testFiles: string[] = [];

    const walkDir = async (currentDir: string): Promise<void> => {
      try {
        const items = await fs.promises.readdir(currentDir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(currentDir, item.name);

          if (item.isDirectory() && !['node_modules', 'dist', 'build', '.git'].includes(item.name)) {
            await walkDir(fullPath);
          } else if (item.isFile() && (item.name.includes('.test.') || item.name.includes('.spec.'))) {
            testFiles.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read directory ${currentDir}`);
      }
    };

    await walkDir(dir);
    return testFiles;
  }

  private async findEmptyDirectories(dir: string): Promise<string[]> {
    const emptyDirs: string[] = [];

    const walkDir = async (currentDir: string): Promise<void> => {
      try {
        const items = await fs.promises.readdir(currentDir);

        if (items.length === 0) {
          emptyDirs.push(currentDir);
          return;
        }

        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stat = await fs.promises.stat(fullPath);

          if (stat.isDirectory() && !['node_modules', 'dist', 'build', '.git'].includes(item)) {
            await walkDir(fullPath);
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read directory ${currentDir}`);
      }
    };

    await walkDir(dir);
    return emptyDirs;
  }

  private getSourceFileForTest(testFile: string): string {
    // Convert test file path to source file path
    const withoutTest = testFile
      .replace(/\\.test\\.(ts|tsx|js|jsx)$/, '.ts')
      .replace(/\\.spec\\.(ts|tsx|js|jsx)$/, '.ts');
    
    // Try .tsx if .ts doesn't exist
    return withoutTest;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      // Also try .tsx version
      const tsxPath = filePath.replace(/\\.ts$/, '.tsx');
      try {
        await fs.promises.access(tsxPath);
        return true;
      } catch {
        return false;
      }
    }
  }

  private async removeDirectory(dirPath: string): Promise<void> {
    const items = await fs.promises.readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = await fs.promises.stat(fullPath);
      
      if (stat.isDirectory()) {
        await this.removeDirectory(fullPath);
      } else {
        await fs.promises.unlink(fullPath);
      }
    }
    
    await fs.promises.rmdir(dirPath);
  }

  private printSummary(): void {
    console.log('\\n' + '='.repeat(60));
    console.log('COMPREHENSIVE CLEANUP SUMMARY');
    console.log('='.repeat(60));

    console.log(`\\n📊 RESULTS:`);
    console.log(`   Files/directories removed: ${this.removedFiles.length}`);
    console.log(`   Errors encountered: ${this.errors.length}`);

    if (this.removedFiles.length > 0) {
      console.log('\\n🗑️  REMOVED FILES/DIRECTORIES:');
      this.removedFiles.slice(0, 20).forEach(file => {
        console.log(`   - ${path.relative('.', file)}`);
      });
      
      if (this.removedFiles.length > 20) {
        console.log(`   ... and ${this.removedFiles.length - 20} more`);
      }
    }

    if (this.errors.length > 0) {
      console.log('\\n⚠️  ERRORS:');
      this.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }

    console.log('\\n✅ Comprehensive cleanup completed!');
    console.log('   Benefits:');
    console.log('   - Cleaner source directory');
    console.log('   - Reduced repository size');
    console.log('   - No confusion between source and compiled files');
    console.log('   - Better project organization');
    console.log('   - Faster file searches and indexing');

    console.log('='.repeat(60));
  }
}

// CLI interface
async function main() {
  try {
    const cleanup = new ComprehensiveCleanup();
    await cleanup.runCleanup();
  } catch (error) {
    console.error('Comprehensive cleanup failed:', error);
    process.exit(1);
  }
}

main();