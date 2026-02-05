#!/usr/bin/env node

/**
 * Database Path Update Script
 * 
 * Updates all configuration files and scripts to use the new
 * server/infrastructure/database/ path after manual directory move.
 */

const { execSync } = require('child_process');
const { existsSync, readFileSync, writeFileSync, readdirSync, statSync } = require('fs');
const { join } = require('path');

const projectRoot = process.cwd();

class DatabasePathUpdater {
  constructor() {
    this.updatedFiles = [];
    this.errors = [];
  }

  async updateAllPaths() {
    console.log('🔧 Updating Database Paths After Manual Directory Move');
    console.log('====================================================\n');

    try {
      // Verify the new directory exists
      this.verifyNewDirectoryExists();
      
      // Update configuration files
      this.updateDrizzleConfig();
      
      // Update package.json scripts
      this.updatePackageScripts();
      
      // Update import statements
      this.updateImportStatements();
      
      // Update TypeScript configs
      this.updateTypeScriptConfigs();
      
      // Print summary
      this.printSummary();
      
      return true;
    } catch (error) {
      console.error('❌ Path update failed:', error.message);
      this.errors.push(error.message);
      return false;
    }
  }

  verifyNewDirectoryExists() {
    const newDbPath = join(projectRoot, 'server/infrastructure/database');
    const oldDbPath = join(projectRoot, 'database');
    
    if (!existsSync(newDbPath)) {
      throw new Error('server/infrastructure/database/ directory not found. Please move the database directory first.');
    }
    
    if (existsSync(oldDbPath)) {
      console.log('⚠️ Warning: Old database/ directory still exists. Consider removing it after validation.');
    }
    
    console.log('✅ Verified: server/infrastructure/database/ directory exists');
  }

  updateDrizzleConfig() {
    console.log('⚙️ Updating drizzle.config.ts...');
    
    const drizzleConfigPath = join(projectRoot, 'drizzle.config.ts');
    if (!existsSync(drizzleConfigPath)) {
      console.log('  ⚠️ drizzle.config.ts not found, skipping');
      return;
    }

    let content = readFileSync(drizzleConfigPath, 'utf8');
    const originalContent = content;
    
    // Update migration output path
    content = content.replace(
      /out: "\.\/database\/migrations"/g,
      'out: "./server/infrastructure/database/migrations"'
    );
    
    // Update schema path
    content = content.replace(
      /schema: "\.\/database\/schemas\/core\/index\.ts"/g,
      'schema: "./server/infrastructure/database/schemas/core/index.ts"'
    );
    
    // Handle any other database/ references
    content = content.replace(
      /\.\/database\//g,
      './server/infrastructure/database/'
    );
    
    if (content !== originalContent) {
      writeFileSync(drizzleConfigPath, content);
      this.updatedFiles.push('drizzle.config.ts');
      console.log('  ✅ Updated drizzle.config.ts');
    } else {
      console.log('  ℹ️ drizzle.config.ts already uses correct paths');
    }
  }

  updatePackageScripts() {
    console.log('📦 Updating package.json scripts...');
    
    const packageJsonPath = join(projectRoot, 'package.json');
    if (!existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    let updatedCount = 0;
    
    // Update scripts that reference database/
    for (const [scriptName, scriptCommand] of Object.entries(packageJson.scripts || {})) {
      if (typeof scriptCommand === 'string' && scriptCommand.includes('database/')) {
        const updatedCommand = scriptCommand.replace(/database\//g, 'server/infrastructure/database/');
        packageJson.scripts[scriptName] = updatedCommand;
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      this.updatedFiles.push(`package.json (${updatedCount} scripts)`);
      console.log(`  ✅ Updated ${updatedCount} npm scripts in package.json`);
    } else {
      console.log('  ℹ️ No package.json scripts needed updating');
    }
  }

  updateImportStatements() {
    console.log('🔄 Updating import/require statements...');
    
    const fileExtensions = ['.ts', '.js', '.tsx', '.jsx'];
    const filesToUpdate = [];
    
    // Find all TypeScript/JavaScript files
    const findFiles = (dir) => {
      if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('database_backup_')) return;
      
      try {
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
      } catch (error) {
        // Skip directories that can't be read
      }
    };
    
    findFiles(projectRoot);
    
    let updatedFiles = 0;
    
    for (const filePath of filesToUpdate) {
      try {
        let content = readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Update import statements
        content = content.replace(
          /from ['"]database\//g,
          'from "server/infrastructure/database/'
        );
        content = content.replace(
          /from ['"]\.\/database\//g,
          'from "./server/infrastructure/database/'
        );
        content = content.replace(
          /from ['"]\.\.\/database\//g,
          'from "../server/infrastructure/database/'
        );
        
        // Update dynamic imports
        content = content.replace(
          /import\(['"]database\//g,
          'import("server/infrastructure/database/'
        );
        content = content.replace(
          /import\(['"]\.\/database\//g,
          'import("./server/infrastructure/database/'
        );
        
        // Update require statements
        content = content.replace(
          /require\(['"]database\//g,
          'require("server/infrastructure/database/'
        );
        content = content.replace(
          /require\(['"]\.\/database\//g,
          'require("./server/infrastructure/database/'
        );
        
        if (content !== originalContent) {
          writeFileSync(filePath, content);
          updatedFiles++;
          const relativePath = filePath.replace(projectRoot, '').replace(/^[\/\\]/, '');
          console.log(`  📝 Updated: ${relativePath}`);
        }
      } catch (error) {
        console.log(`  ⚠️ Could not update: ${filePath} (${error.message})`);
      }
    }
    
    if (updatedFiles > 0) {
      this.updatedFiles.push(`${updatedFiles} source files`);
      console.log(`  ✅ Updated imports in ${updatedFiles} files`);
    } else {
      console.log('  ℹ️ No import statements needed updating');
    }
  }

  updateTypeScriptConfigs() {
    console.log('📝 Updating TypeScript configurations...');
    
    const tsconfigFiles = [
      'tsconfig.json',
      'tsconfig.dev.json', 
      'tsconfig.infrastructure.json',
      'tsconfig.test.json'
    ];
    
    let updatedConfigs = 0;
    
    for (const configFile of tsconfigFiles) {
      const configPath = join(projectRoot, configFile);
      if (existsSync(configPath)) {
        try {
          let content = readFileSync(configPath, 'utf8');
          const originalContent = content;
          
          // Update path mappings
          content = content.replace(
            /"database\/\*"/g,
            '"server/infrastructure/database/*"'
          );
          
          // Update any other database/ references in paths
          content = content.replace(
            /"database\//g,
            '"server/infrastructure/database/'
          );
          
          if (content !== originalContent) {
            writeFileSync(configPath, content);
            updatedConfigs++;
            console.log(`  ✅ Updated: ${configFile}`);
          }
        } catch (error) {
          console.log(`  ⚠️ Could not update: ${configFile} (${error.message})`);
        }
      }
    }
    
    if (updatedConfigs > 0) {
      this.updatedFiles.push(`${updatedConfigs} TypeScript configs`);
    } else {
      console.log('  ℹ️ No TypeScript configs needed updating');
    }
  }

  printSummary() {
    console.log('\n📊 Path Update Summary');
    console.log('======================');
    
    if (this.updatedFiles.length > 0) {
      console.log('\n✅ Updated Files:');
      this.updatedFiles.forEach(file => {
        console.log(`  - ${file}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    console.log('\n🔍 Next Steps:');
    console.log('1. Run validation: node scripts/validate-database-structure.cjs');
    console.log('2. Test database connection: npm run db:test-connection');
    console.log('3. Test TypeScript compilation: npm run check');
    console.log('4. Test build: npm run build');
    console.log('5. Remove old database/ directory if validation passes');
    
    if (this.errors.length === 0) {
      console.log('\n🎉 All path updates completed successfully!');
    } else {
      console.log('\n⚠️ Some updates had issues. Please review and fix manually.');
    }
  }
}

// CLI Interface
async function main() {
  const updater = new DatabasePathUpdater();
  const success = await updater.updateAllPaths();
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DatabasePathUpdater };