#!/usr/bin/env tsx

/**
 * Database Structure Migration Script
 * 
 * Migrates database/ directory to server/infrastructure/database/
 * with proper conflict resolution and validation.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface MigrationConfig {
  sourceDir: string;
  targetDir: string;
  backupDir: string;
  dryRun: boolean;
  skipBackup: boolean;
}

class DatabaseMigrator {
  private config: MigrationConfig;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor(config: Partial<MigrationConfig> = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    this.config = {
      sourceDir: join(projectRoot, 'database'),
      targetDir: join(projectRoot, 'server/infrastructure/database'),
      backupDir: join(projectRoot, `database_migration_backup_${timestamp}`),
      dryRun: false,
      skipBackup: false,
      ...config
    };
  }

  async migrate(): Promise<boolean> {
    console.log('🚀 Starting Database Structure Migration');
    console.log(`Source: ${this.config.sourceDir}`);
    console.log(`Target: ${this.config.targetDir}`);
    console.log(`Dry Run: ${this.config.dryRun}`);

    try {
      // Phase 1: Pre-migration validation
      await this.validatePreConditions();
      
      // Phase 2: Create backups
      if (!this.config.skipBackup) {
        await this.createBackups();
      }
      
      // Phase 3: Migrate directory structure
      await this.migrateDirectoryStructure();
      
      // Phase 4: Update configuration files
      await this.updateConfigurationFiles();
      
      // Phase 5: Update package.json scripts
      await this.updatePackageScripts();
      
      // Phase 6: Update import statements
      await this.updateImportStatements();
      
      // Phase 7: Post-migration validation
      await this.validatePostMigration();
      
      console.log('✅ Migration completed successfully!');
      this.printSummary();
      
      return true;
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.errors.push(error instanceof Error ? error.message : String(error));
      
      if (!this.config.dryRun) {
        console.log('🔄 Attempting rollback...');
        await this.rollback();
      }
      
      return false;
    }
  }

  private async validatePreConditions(): Promise<void> {
    console.log('📋 Validating pre-conditions...');
    
    // Check if source directory exists
    if (!existsSync(this.config.sourceDir)) {
      throw new Error(`Source directory does not exist: ${this.config.sourceDir}`);
    }
    
    // Check if target directory exists
    if (!existsSync(this.config.targetDir)) {
      this.warnings.push(`Target directory does not exist, will be created: ${this.config.targetDir}`);
    }
    
    // Check for uncommitted changes
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        this.warnings.push('Uncommitted changes detected. Consider committing before migration.');
      }
    } catch (error) {
      this.warnings.push('Could not check git status. Ensure you have a clean working directory.');
    }
    
    // Check if npm scripts reference database/
    const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
    const databaseScripts = Object.entries(packageJson.scripts || {})
      .filter(([, script]) => typeof script === 'string' && script.includes('database/'))
      .length;
    
    console.log(`📊 Found ${databaseScripts} npm scripts referencing database/`);
  }

  private async createBackups(): Promise<void> {
    console.log('💾 Creating backups...');
    
    if (!this.config.dryRun) {
      // Backup source directory
      execSync(`cp -r "${this.config.sourceDir}" "${this.config.backupDir}_source"`);
      
      // Backup target directory if it exists
      if (existsSync(this.config.targetDir)) {
        execSync(`cp -r "${this.config.targetDir}" "${this.config.backupDir}_target"`);
      }
      
      // Backup package.json
      execSync(`cp "${join(projectRoot, 'package.json')}" "${this.config.backupDir}_package.json"`);
      
      // Backup drizzle.config.ts
      const drizzleConfig = join(projectRoot, 'drizzle.config.ts');
      if (existsSync(drizzleConfig)) {
        execSync(`cp "${drizzleConfig}" "${this.config.backupDir}_drizzle.config.ts"`);
      }
    }
    
    console.log('✅ Backups created');
  }

  private async migrateDirectoryStructure(): Promise<void> {
    console.log('📁 Migrating directory structure...');
    
    if (!this.config.dryRun) {
      // Ensure target directory exists
      mkdirSync(this.config.targetDir, { recursive: true });
      
      // Use rsync for intelligent merging
      try {
        execSync(`rsync -av "${this.config.sourceDir}/" "${this.config.targetDir}/" --exclude="*.md" --exclude="README*"`);
      } catch (error) {
        // Fallback to manual copy if rsync fails
        this.copyDirectoryRecursive(this.config.sourceDir, this.config.targetDir);
      }
    }
    
    console.log('✅ Directory structure migrated');
  }

  private copyDirectoryRecursive(src: string, dest: string): void {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    
    const items = readdirSync(src);
    
    for (const item of items) {
      const srcPath = join(src, item);
      const destPath = join(dest, item);
      
      if (statSync(srcPath).isDirectory()) {
        this.copyDirectoryRecursive(srcPath, destPath);
      } else {
        // Skip README files and markdown docs
        if (!item.toLowerCase().includes('readme') && !item.endsWith('.md')) {
          execSync(`cp "${srcPath}" "${destPath}"`);
        }
      }
    }
  }

  private async updateConfigurationFiles(): Promise<void> {
    console.log('⚙️ Updating configuration files...');
    
    // Update drizzle.config.ts
    const drizzleConfigPath = join(projectRoot, 'drizzle.config.ts');
    if (existsSync(drizzleConfigPath)) {
      let content = readFileSync(drizzleConfigPath, 'utf8');
      content = content.replace(
        /out: "\.\/database\/migrations"/g,
        'out: "./server/infrastructure/database/migrations"'
      );
      content = content.replace(
        /schema: "\.\/database\/schemas\/core\/index\.ts"/g,
        'schema: "./server/infrastructure/database/schemas/core/index.ts"'
      );
      
      if (!this.config.dryRun) {
        writeFileSync(drizzleConfigPath, content);
      }
      console.log('  ✅ Updated drizzle.config.ts');
    }
    
    // Update tsconfig files if they have database paths
    const tsconfigFiles = ['tsconfig.json', 'tsconfig.dev.json', 'tsconfig.infrastructure.json'];
    
    for (const configFile of tsconfigFiles) {
      const configPath = join(projectRoot, configFile);
      if (existsSync(configPath)) {
        let content = readFileSync(configPath, 'utf8');
        const originalContent = content;
        
        content = content.replace(
          /"database\/\*"/g,
          '"server/infrastructure/database/*"'
        );
        
        if (content !== originalContent && !this.config.dryRun) {
          writeFileSync(configPath, content);
          console.log(`  ✅ Updated ${configFile}`);
        }
      }
    }
  }

  private async updatePackageScripts(): Promise<void> {
    console.log('📦 Updating package.json scripts...');
    
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    
    let updatedCount = 0;
    
    // Update scripts that reference database/
    for (const [scriptName, scriptCommand] of Object.entries(packageJson.scripts || {})) {
      if (typeof scriptCommand === 'string' && scriptCommand.includes('database/')) {
        const updatedCommand = scriptCommand.replace(/database\//g, 'server/infrastructure/database/');
        packageJson.scripts[scriptName] = updatedCommand;
        updatedCount++;
        console.log(`  📝 Updated script: ${scriptName}`);
      }
    }
    
    if (updatedCount > 0 && !this.config.dryRun) {
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    }
    
    console.log(`✅ Updated ${updatedCount} npm scripts`);
  }

  private async updateImportStatements(): Promise<void> {
    console.log('🔄 Updating import statements...');
    
    const fileExtensions = ['.ts', '.js', '.tsx', '.jsx'];
    const filesToUpdate: string[] = [];
    
    // Find all TypeScript/JavaScript files
    const findFiles = (dir: string): void => {
      if (dir.includes('node_modules') || dir.includes('.git')) return;
      
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          findFiles(fullPath);
        } else if (fileExtensions.some(ext => item.endsWith(ext))) {
          filesToUpdate.push(fullPath);
        }
      }
    };
    
    findFiles(projectRoot);
    
    let updatedFiles = 0;
    
    for (const filePath of filesToUpdate) {
      let content = readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Update import statements
      content = content.replace(
        /from ['"]database\//g,
        'from "server/infrastructure/database/'
      );
      content = content.replace(
        /import\(['"]database\//g,
        'import("server/infrastructure/database/'
      );
      
      // Update require statements
      content = content.replace(
        /require\(['"]database\//g,
        'require("server/infrastructure/database/'
      );
      
      if (content !== originalContent) {
        if (!this.config.dryRun) {
          writeFileSync(filePath, content);
        }
        updatedFiles++;
      }
    }
    
    console.log(`✅ Updated imports in ${updatedFiles} files`);
  }

  private async validatePostMigration(): Promise<void> {
    console.log('🔍 Validating post-migration state...');
    
    if (this.config.dryRun) {
      console.log('⏭️ Skipping validation in dry-run mode');
      return;
    }
    
    // Check if target directory exists and has content
    if (!existsSync(this.config.targetDir)) {
      throw new Error('Target directory was not created');
    }
    
    const targetContents = readdirSync(this.config.targetDir);
    if (targetContents.length === 0) {
      throw new Error('Target directory is empty');
    }
    
    // Test database connection
    try {
      execSync('npm run db:test-connection', { stdio: 'pipe' });
      console.log('  ✅ Database connection test passed');
    } catch (error) {
      this.warnings.push('Database connection test failed - may need manual verification');
    }
    
    // Test TypeScript compilation
    try {
      execSync('npm run check', { stdio: 'pipe' });
      console.log('  ✅ TypeScript compilation passed');
    } catch (error) {
      this.warnings.push('TypeScript compilation issues detected');
    }
    
    console.log('✅ Post-migration validation completed');
  }

  private async rollback(): Promise<void> {
    console.log('🔄 Rolling back changes...');
    
    try {
      // Restore from backups
      if (existsSync(`${this.config.backupDir}_source`)) {
        execSync(`rm -rf "${this.config.sourceDir}"`);
        execSync(`cp -r "${this.config.backupDir}_source" "${this.config.sourceDir}"`);
      }
      
      if (existsSync(`${this.config.backupDir}_package.json`)) {
        execSync(`cp "${this.config.backupDir}_package.json" "${join(projectRoot, 'package.json')}"`);
      }
      
      if (existsSync(`${this.config.backupDir}_drizzle.config.ts`)) {
        execSync(`cp "${this.config.backupDir}_drizzle.config.ts" "${join(projectRoot, 'drizzle.config.ts')}"`);
      }
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      console.log('🚨 Manual recovery required!');
    }
  }

  private printSummary(): void {
    console.log('\n📊 Migration Summary:');
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test database connection: npm run db:test-connection');
    console.log('2. Run migrations: npm run db:migrate');
    console.log('3. Test build: npm run build');
    console.log('4. Run tests: npm test');
    console.log('5. Update team documentation');
    
    if (!this.config.dryRun) {
      console.log(`\n💾 Backups created at: ${this.config.backupDir}_*`);
      console.log('Remove backups after confirming everything works correctly.');
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipBackup = args.includes('--skip-backup');
  
  if (args.includes('--help')) {
    console.log(`
Database Structure Migration Tool

Usage: tsx scripts/migrate-database-structure.ts [options]

Options:
  --dry-run      Simulate migration without making changes
  --skip-backup  Skip creating backups (not recommended)
  --help         Show this help message

Examples:
  tsx scripts/migrate-database-structure.ts --dry-run
  tsx scripts/migrate-database-structure.ts
`);
    process.exit(0);
  }
  
  const migrator = new DatabaseMigrator({ dryRun, skipBackup });
  const success = await migrator.migrate();
  
  process.exit(success ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DatabaseMigrator };