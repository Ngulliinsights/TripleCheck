#!/usr/bin/env tsx
/**
 * Database Path Validation Script
 * 
 * Validates that all database-related paths in package.json and configuration files
 * point to the correct location: server/infrastructure/database/
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  file: string;
  script: string;
  path: string;
  exists: boolean;
  status: 'valid' | 'invalid' | 'warning';
  message?: string;
}

class DatabasePathValidator {
  private results: ValidationResult[] = [];

  validate(): void {
    console.log('🔍 Validating database paths...\n');
    
    this.validatePackageJsonScripts();
    this.validateConfigFiles();
    this.printResults();
  }

  private validatePackageJsonScripts(): void {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};

    const databaseScripts = Object.entries(scripts).filter(([key, value]) => 
      key.includes('db:') || 
      key.includes('migrate') || 
      key.includes('seed') || 
      key.includes('security') ||
      key.includes('data:') ||
      (typeof value === 'string' && value.includes('database'))
    );

    for (const [scriptName, scriptValue] of databaseScripts) {
      this.validateScript(scriptName, scriptValue as string);
    }
  }

  private validateScript(scriptName: string, scriptValue: string): void {
    // Extract file path from script command
    const match = scriptValue.match(/tsx\s+([^\s]+)/);
    if (!match) {
      this.results.push({
        file: 'package.json',
        script: scriptName,
        path: scriptValue,
        exists: false,
        status: 'warning',
        message: 'Could not extract file path from script'
      });
      return;
    }

    const filePath = match[1];
    const exists = existsSync(filePath);
    
    let status: 'valid' | 'invalid' | 'warning' = 'valid';
    let message: string | undefined;

    if (!exists) {
      status = 'invalid';
      message = 'File does not exist';
    } else if (filePath.includes('database/') && !filePath.includes('server/infrastructure/database/')) {
      status = 'invalid';
      message = 'Using deprecated database path - should use server/infrastructure/database/';
    } else if (!filePath.includes('server/infrastructure/database/') && 
               (scriptName.includes('db:') || scriptName.includes('migrate') || scriptName.includes('seed'))) {
      status = 'warning';
      message = 'Database-related script not using standard path';
    }

    this.results.push({
      file: 'package.json',
      script: scriptName,
      path: filePath,
      exists,
      status,
      message
    });
  }

  private validateConfigFiles(): void {
    const configFiles = [
      'drizzle.config.ts',
      'server/infrastructure/database/schemas/consolidated'
    ];

    for (const configFile of configFiles) {
      if (existsSync(configFile)) {
        this.validateConfigFile(configFile);
      }
    }
  }

  private validateConfigFile(filePath: string): void {
    const content = readFileSync(filePath, 'utf8');
    
    // Check for deprecated database paths
    const deprecatedPatterns = [
      /\.\/database\//g,
      /database\/schemas/g,
      /database\/migrations/g
    ];

    const correctPatterns = [
      /server\/infrastructure\/database/g
    ];

    let hasDeprecated = false;
    let hasCorrect = false;

    for (const pattern of deprecatedPatterns) {
      if (pattern.test(content)) {
        hasDeprecated = true;
        break;
      }
    }

    for (const pattern of correctPatterns) {
      if (pattern.test(content)) {
        hasCorrect = true;
        break;
      }
    }

    let status: 'valid' | 'invalid' | 'warning' = 'valid';
    let message: string | undefined;

    if (hasDeprecated && !hasCorrect) {
      status = 'invalid';
      message = 'Contains deprecated database paths';
    } else if (hasDeprecated && hasCorrect) {
      status = 'warning';
      message = 'Contains both deprecated and correct paths';
    } else if (filePath === 'server/infrastructure/database/schemas/consolidated') {
      status = 'warning';
      message = 'This file is deprecated and should be removed after migration';
    }

    this.results.push({
      file: filePath,
      script: 'config',
      path: filePath,
      exists: true,
      status,
      message
    });
  }

  private printResults(): void {
    console.log('📊 Validation Results:');
    console.log('='.repeat(60));

    const validCount = this.results.filter(r => r.status === 'valid').length;
    const invalidCount = this.results.filter(r => r.status === 'invalid').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;

    console.log(`✅ Valid: ${validCount}`);
    console.log(`❌ Invalid: ${invalidCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`📁 Total checked: ${this.results.length}\n`);

    // Show invalid results
    const invalidResults = this.results.filter(r => r.status === 'invalid');
    if (invalidResults.length > 0) {
      console.log('❌ Invalid Paths:');
      invalidResults.forEach(result => {
        console.log(`   ${result.file}:${result.script}`);
        console.log(`     Path: ${result.path}`);
        console.log(`     Issue: ${result.message}\n`);
      });
    }

    // Show warnings
    const warningResults = this.results.filter(r => r.status === 'warning');
    if (warningResults.length > 0) {
      console.log('⚠️  Warnings:');
      warningResults.forEach(result => {
        console.log(`   ${result.file}:${result.script}`);
        console.log(`     Path: ${result.path}`);
        console.log(`     Note: ${result.message}\n`);
      });
    }

    // Summary
    if (invalidCount === 0 && warningCount === 0) {
      console.log('🎉 All database paths are valid!');
    } else if (invalidCount === 0) {
      console.log('✅ No invalid paths found. Review warnings above.');
    } else {
      console.log('🔧 Please fix the invalid paths above.');
      console.log('\n💡 Quick fixes:');
      console.log('   1. Run: npm run migrate:schema-imports');
      console.log('   2. Update package.json scripts to use server/infrastructure/database/');
      console.log('   3. Update drizzle.config.ts paths');
    }
  }
}

// Run validation
if (require.main === module) {
  const validator = new DatabasePathValidator();
  validator.validate();
}

export { DatabasePathValidator };