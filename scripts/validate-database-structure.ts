#!/usr/bin/env tsx

/**
 * Database Structure Validation Script
 * 
 * Validates database directory structure and identifies issues
 * before and after migration.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface ValidationResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
}

class DatabaseStructureValidator {
  private results: ValidationResult[] = [];

  async validate(): Promise<boolean> {
    console.log('🔍 Database Structure Validation');
    console.log('================================\n');

    // Check directory structure
    this.validateDirectoryStructure();
    
    // Check configuration files
    this.validateConfigurationFiles();
    
    // Check package.json scripts
    this.validatePackageScripts();
    
    // Check for import/require statements
    this.validateImportStatements();
    
    // Check database connectivity
    await this.validateDatabaseConnectivity();
    
    // Check for conflicts
    this.validateForConflicts();
    
    // Print results
    this.printResults();
    
    const hasErrors = this.results.some(r => r.status === 'fail');
    return !hasErrors;
  }

  private validateDirectoryStructure(): void {
    console.log('📁 Checking directory structure...');
    
    const rootDatabaseExists = existsSync(join(projectRoot, 'database'));
    const serverDatabaseExists = existsSync(join(projectRoot, 'server/infrastructure/database'));
    
    if (rootDatabaseExists && serverDatabaseExists) {
      this.results.push({
        category: 'Directory Structure',
        status: 'warning',
        message: 'Both root database/ and server/infrastructure/database/ exist',
        details: ['This indicates a duplication that should be resolved']
      });
    } else if (rootDatabaseExists && !serverDatabaseExists) {
      this.results.push({
        category: 'Directory Structure',
        status: 'pass',
        message: 'Root database/ directory exists (pre-migration state)',
        details: ['Ready for migration to server/infrastructure/database/']
      });
    } else if (!rootDatabaseExists && serverDatabaseExists) {
      this.results.push({
        category: 'Directory Structure',
        status: 'pass',
        message: 'Database consolidated to server/infrastructure/database/',
        details: ['Post-migration state detected']
      });
    } else {
      this.results.push({
        category: 'Directory Structure',
        status: 'fail',
        message: 'No database directory found',
        details: ['Neither database/ nor server/infrastructure/database/ exists']
      });
    }

    // Check for expected subdirectories
    const expectedDirs = ['migrations', 'schemas', 'seeds', 'scripts', 'config'];
    const databaseDir = rootDatabaseExists ? 
      join(projectRoot, 'database') : 
      join(projectRoot, 'server/infrastructure/database');
    
    if (existsSync(databaseDir)) {
      const missingDirs = expectedDirs.filter(dir => !existsSync(join(databaseDir, dir)));
      
      if (missingDirs.length === 0) {
        this.results.push({
          category: 'Directory Structure',
          status: 'pass',
          message: 'All expected subdirectories present',
          details: expectedDirs
        });
      } else {
        this.results.push({
          category: 'Directory Structure',
          status: 'warning',
          message: 'Some expected subdirectories missing',
          details: [`Missing: ${missingDirs.join(', ')}`]
        });
      }
    }
  }

  private validateConfigurationFiles(): void {
    console.log('⚙️ Checking configuration files...');
    
    // Check drizzle.config.ts
    const drizzleConfigPath = join(projectRoot, 'drizzle.config.ts');
    if (existsSync(drizzleConfigPath)) {
      const content = readFileSync(drizzleConfigPath, 'utf8');
      
      if (content.includes('./database/migrations')) {
        this.results.push({
          category: 'Configuration',
          status: 'warning',
          message: 'drizzle.config.ts points to old database/ path',
          details: ['Should be updated to server/infrastructure/database/migrations']
        });
      } else if (content.includes('./server/infrastructure/database/migrations')) {
        this.results.push({
          category: 'Configuration',
          status: 'pass',
          message: 'drizzle.config.ts uses correct path',
          details: ['Points to server/infrastructure/database/migrations']
        });
      } else {
        this.results.push({
          category: 'Configuration',
          status: 'warning',
          message: 'drizzle.config.ts migration path unclear',
          details: ['Could not determine migration path configuration']
        });
      }
      
      if (content.includes('./database/schemas')) {
        this.results.push({
          category: 'Configuration',
          status: 'warning',
          message: 'drizzle.config.ts schema points to old database/ path',
          details: ['Should be updated to server/infrastructure/database/schemas']
        });
      } else if (content.includes('./server/infrastructure/database/schemas')) {
        this.results.push({
          category: 'Configuration',
          status: 'pass',
          message: 'drizzle.config.ts schema uses correct path'
        });
      }
    } else {
      this.results.push({
        category: 'Configuration',
        status: 'fail',
        message: 'drizzle.config.ts not found',
        details: ['Required for database operations']
      });
    }

    // Check tsconfig files for path mappings
    const tsconfigFiles = ['tsconfig.json', 'tsconfig.dev.json', 'tsconfig.infrastructure.json'];
    
    for (const configFile of tsconfigFiles) {
      const configPath = join(projectRoot, configFile);
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf8');
        
        if (content.includes('"database/*"')) {
          this.results.push({
            category: 'Configuration',
            status: 'warning',
            message: `${configFile} has old database path mapping`,
            details: ['Should be updated to server/infrastructure/database/*']
          });
        }
      }
    }
  }

  private validatePackageScripts(): void {
    console.log('📦 Checking package.json scripts...');
    
    const packageJsonPath = join(projectRoot, 'package.json');
    if (!existsSync(packageJsonPath)) {
      this.results.push({
        category: 'Package Scripts',
        status: 'fail',
        message: 'package.json not found'
      });
      return;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const oldPathScripts: string[] = [];
    const newPathScripts: string[] = [];
    
    for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
      if (typeof scriptCommand === 'string') {
        if (scriptCommand.includes('database/')) {
          oldPathScripts.push(scriptName);
        } else if (scriptCommand.includes('server/infrastructure/database/')) {
          newPathScripts.push(scriptName);
        }
      }
    }
    
    if (oldPathScripts.length > 0) {
      this.results.push({
        category: 'Package Scripts',
        status: 'warning',
        message: `${oldPathScripts.length} scripts reference old database/ path`,
        details: oldPathScripts.slice(0, 5).concat(
          oldPathScripts.length > 5 ? [`... and ${oldPathScripts.length - 5} more`] : []
        )
      });
    }
    
    if (newPathScripts.length > 0) {
      this.results.push({
        category: 'Package Scripts',
        status: 'pass',
        message: `${newPathScripts.length} scripts use correct server/infrastructure/database/ path`,
        details: [`Examples: ${newPathScripts.slice(0, 3).join(', ')}`]
      });
    }
    
    if (oldPathScripts.length === 0 && newPathScripts.length === 0) {
      this.results.push({
        category: 'Package Scripts',
        status: 'pass',
        message: 'No database path references found in scripts'
      });
    }
  }

  private validateImportStatements(): void {
    console.log('🔄 Checking import/require statements...');
    
    const fileExtensions = ['.ts', '.js', '.tsx', '.jsx'];
    const filesWithOldImports: string[] = [];
    const filesWithNewImports: string[] = [];
    
    const checkFile = (filePath: string): void => {
      try {
        const content = readFileSync(filePath, 'utf8');
        const relativePath = filePath.replace(projectRoot, '').replace(/^\//, '');
        
        if (content.match(/from ['"]database\//g) || content.match(/require\(['"]database\//g)) {
          filesWithOldImports.push(relativePath);
        }
        
        if (content.match(/from ['"]server\/infrastructure\/database\//g) || 
            content.match(/require\(['"]server\/infrastructure\/database\//g)) {
          filesWithNewImports.push(relativePath);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    };
    
    const scanDirectory = (dir: string): void => {
      if (dir.includes('node_modules') || dir.includes('.git')) return;
      
      try {
        const items = readdirSync(dir);
        for (const item of items) {
          const fullPath = join(dir, item);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (fileExtensions.some(ext => item.endsWith(ext))) {
            checkFile(fullPath);
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    };
    
    scanDirectory(projectRoot);
    
    if (filesWithOldImports.length > 0) {
      this.results.push({
        category: 'Import Statements',
        status: 'warning',
        message: `${filesWithOldImports.length} files have old database/ imports`,
        details: filesWithOldImports.slice(0, 5).concat(
          filesWithOldImports.length > 5 ? [`... and ${filesWithOldImports.length - 5} more`] : []
        )
      });
    }
    
    if (filesWithNewImports.length > 0) {
      this.results.push({
        category: 'Import Statements',
        status: 'pass',
        message: `${filesWithNewImports.length} files use correct server/infrastructure/database/ imports`
      });
    }
    
    if (filesWithOldImports.length === 0 && filesWithNewImports.length === 0) {
      this.results.push({
        category: 'Import Statements',
        status: 'pass',
        message: 'No database imports found (or all imports are relative)'
      });
    }
  }

  private async validateDatabaseConnectivity(): Promise<void> {
    console.log('🔌 Checking database connectivity...');
    
    try {
      // Try to run database test connection script
      execSync('npm run db:test-connection', { stdio: 'pipe', timeout: 10000 });
      this.results.push({
        category: 'Database Connectivity',
        status: 'pass',
        message: 'Database connection test passed'
      });
    } catch (error) {
      this.results.push({
        category: 'Database Connectivity',
        status: 'warning',
        message: 'Database connection test failed',
        details: ['This may be expected if database is not set up or credentials are missing']
      });
    }
    
    // Check if DATABASE_URL is configured
    if (process.env.DATABASE_URL) {
      this.results.push({
        category: 'Database Connectivity',
        status: 'pass',
        message: 'DATABASE_URL environment variable is set'
      });
    } else {
      this.results.push({
        category: 'Database Connectivity',
        status: 'warning',
        message: 'DATABASE_URL environment variable not set',
        details: ['Required for database operations']
      });
    }
  }

  private validateForConflicts(): void {
    console.log('⚠️ Checking for conflicts...');
    
    const rootDbPath = join(projectRoot, 'database');
    const serverDbPath = join(projectRoot, 'server/infrastructure/database');
    
    if (existsSync(rootDbPath) && existsSync(serverDbPath)) {
      // Check for file conflicts
      const conflicts: string[] = [];
      
      const checkConflicts = (subPath: string = ''): void => {
        const rootSubPath = join(rootDbPath, subPath);
        const serverSubPath = join(serverDbPath, subPath);
        
        if (existsSync(rootSubPath) && existsSync(serverSubPath)) {
          try {
            const rootItems = readdirSync(rootSubPath);
            const serverItems = readdirSync(serverSubPath);
            
            const commonItems = rootItems.filter(item => serverItems.includes(item));
            
            for (const item of commonItems) {
              const rootItemPath = join(rootSubPath, item);
              const serverItemPath = join(serverSubPath, item);
              
              if (statSync(rootItemPath).isFile() && statSync(serverItemPath).isFile()) {
                conflicts.push(join(subPath, item));
              } else if (statSync(rootItemPath).isDirectory() && statSync(serverItemPath).isDirectory()) {
                checkConflicts(join(subPath, item));
              }
            }
          } catch (error) {
            // Skip if can't read directory
          }
        }
      };
      
      checkConflicts();
      
      if (conflicts.length > 0) {
        this.results.push({
          category: 'Conflicts',
          status: 'warning',
          message: `${conflicts.length} file conflicts detected between database directories`,
          details: conflicts.slice(0, 10).concat(
            conflicts.length > 10 ? [`... and ${conflicts.length - 10} more`] : []
          )
        });
      } else {
        this.results.push({
          category: 'Conflicts',
          status: 'pass',
          message: 'No file conflicts detected between database directories'
        });
      }
    } else {
      this.results.push({
        category: 'Conflicts',
        status: 'pass',
        message: 'No directory duplication detected'
      });
    }
  }

  private printResults(): void {
    console.log('\n📊 Validation Results');
    console.log('====================\n');
    
    const categories = [...new Set(this.results.map(r => r.category))];
    
    for (const category of categories) {
      console.log(`\n${category}:`);
      const categoryResults = this.results.filter(r => r.category === category);
      
      for (const result of categoryResults) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
        console.log(`  ${icon} ${result.message}`);
        
        if (result.details) {
          result.details.forEach(detail => {
            console.log(`     ${detail}`);
          });
        }
      }
    }
    
    // Summary
    const passCount = this.results.filter(r => r.status === 'pass').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;
    
    console.log('\n📈 Summary:');
    console.log(`  ✅ Passed: ${passCount}`);
    console.log(`  ⚠️ Warnings: ${warningCount}`);
    console.log(`  ❌ Failed: ${failCount}`);
    
    if (failCount > 0) {
      console.log('\n🚨 Action Required: Fix failed validations before proceeding');
    } else if (warningCount > 0) {
      console.log('\n💡 Recommendations: Address warnings for optimal setup');
    } else {
      console.log('\n🎉 All validations passed!');
    }
  }
}

// CLI Interface
async function main() {
  const validator = new DatabaseStructureValidator();
  const success = await validator.validate();
  
  process.exit(success ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DatabaseStructureValidator };