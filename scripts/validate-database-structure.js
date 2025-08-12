#!/usr/bin/env node

/**
 * Database Structure Validation Script (JavaScript version)
 * 
 * Validates database directory structure and identifies issues
 * before and after migration.
 */

const { execSync } = require('child_process');
const { existsSync, readFileSync, readdirSync, statSync } = require('fs');
const { join } = require('path');

const projectRoot = process.cwd();

class DatabaseStructureValidator {
  constructor() {
    this.results = [];
  }

  async validate() {
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

  validateDirectoryStructure() {
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

  validateConfigurationFiles() {
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
  }

  validatePackageScripts() {
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
    
    const oldPathScripts = [];
    const newPathScripts = [];
    
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

  validateImportStatements() {
    console.log('🔄 Checking import/require statements...');
    
    const fileExtensions = ['.ts', '.js', '.tsx', '.jsx'];
    const filesWithOldImports = [];
    const filesWithNewImports = [];
    
    const checkFile = (filePath) => {
      try {
        const content = readFileSync(filePath, 'utf8');
        const relativePath = filePath.replace(projectRoot, '').replace(/^[\/\\]/, '');
        
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
    
    const scanDirectory = (dir) => {
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

  async validateDatabaseConnectivity() {
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

  validateForConflicts() {
    console.log('⚠️ Checking for conflicts...');
    
    const rootDbPath = join(projectRoot, 'database');
    const serverDbPath = join(projectRoot, 'server/infrastructure/database');
    
    if (existsSync(rootDbPath) && existsSync(serverDbPath)) {
      this.results.push({
        category: 'Conflicts',
        status: 'warning',
        message: 'Both database directories exist - duplication detected',
        details: ['Migration needed to consolidate into single location']
      });
    } else {
      this.results.push({
        category: 'Conflicts',
        status: 'pass',
        message: 'No directory duplication detected'
      });
    }
  }

  printResults() {
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
      console.log('\n🔧 Next Steps:');
      console.log('1. Run migration: node scripts/migrate-database-structure.js');
      console.log('2. Test after migration: node scripts/validate-database-structure.js');
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

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DatabaseStructureValidator };