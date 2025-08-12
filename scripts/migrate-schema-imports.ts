#!/usr/bin/env tsx
/**
 * Migration Script: Update Schema Imports
 * 
 * This script helps migrate from deprecated server/infrastructure/database/schemas/consolidated imports
 * to the new consolidated database schema location.
 * 
 * Usage: npm run migrate:schema-imports
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface MigrationResult {
  file: string;
  changes: number;
  errors: string[];
}

class SchemaImportMigrator {
  private results: MigrationResult[] = [];
  private readonly deprecatedImports = [
    /from\s+['"]src\/shared\/schema['"];?/g,
    /from\s+['"]\.\.\/\.\.\/shared\/schema['"];?/g,
    /from\s+['"]\.\.\/shared\/schema['"];?/g,
    /from\s+['"]\.\/shared\/schema['"];?/g,
  ];

  private readonly newImport = "from 'server/infrastructure/database/schemas/consolidated';";

  migrate(directory: string = '.'): void {
    console.log('🔄 Starting schema import migration...\n');
    
    this.processDirectory(directory);
    this.printResults();
  }

  private processDirectory(dir: string): void {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry)) {
          this.processDirectory(fullPath);
        }
      } else if (this.shouldProcessFile(fullPath)) {
        this.processFile(fullPath);
      }
    }
  }

  private shouldProcessFile(filePath: string): boolean {
    const ext = extname(filePath);
    return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
  }

  private processFile(filePath: string): void {
    try {
      const content = readFileSync(filePath, 'utf8');
      let newContent = content;
      let changes = 0;
      const errors: string[] = [];

      // Check for deprecated imports
      for (const pattern of this.deprecatedImports) {
        const matches = content.match(pattern);
        if (matches) {
          newContent = newContent.replace(pattern, this.newImport);
          changes += matches.length;
        }
      }

      // Additional checks for potential issues
      if (content.includes('src/shared/schema') && changes === 0) {
        errors.push('Contains schema reference but no import pattern matched');
      }

      if (changes > 0) {
        writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Updated ${filePath} (${changes} changes)`);
      }

      if (changes > 0 || errors.length > 0) {
        this.results.push({
          file: filePath,
          changes,
          errors
        });
      }

    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
      this.results.push({
        file: filePath,
        changes: 0,
        errors: [`Processing error: ${error}`]
      });
    }
  }

  private printResults(): void {
    console.log('\n📊 Migration Results:');
    console.log('='.repeat(50));
    
    const totalChanges = this.results.reduce((sum, result) => sum + result.changes, 0);
    const filesWithChanges = this.results.filter(r => r.changes > 0).length;
    const filesWithErrors = this.results.filter(r => r.errors.length > 0).length;

    console.log(`📁 Files processed: ${this.results.length}`);
    console.log(`✅ Files updated: ${filesWithChanges}`);
    console.log(`🔄 Total changes: ${totalChanges}`);
    console.log(`⚠️  Files with errors: ${filesWithErrors}`);

    if (filesWithErrors > 0) {
      console.log('\n⚠️  Files requiring manual review:');
      this.results
        .filter(r => r.errors.length > 0)
        .forEach(result => {
          console.log(`   ${result.file}:`);
          result.errors.forEach(error => console.log(`     - ${error}`));
        });
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Review the updated files');
    console.log('2. Run tests to ensure everything works');
    console.log('3. Update any remaining manual references');
    console.log('4. Consider removing server/infrastructure/database/schemas/consolidated after migration');
    
    if (totalChanges > 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n✨ No deprecated imports found. You\'re all set!');
    }
  }
}

// Run the migration
if (require.main === module) {
  const migrator = new SchemaImportMigrator();
  migrator.migrate();
}

export { SchemaImportMigrator };