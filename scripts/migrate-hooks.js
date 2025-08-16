#!/usr/bin/env node

/**
 * Automated Hook Migration Detection and Fix Script
 * 
 * This script scans the codebase for deprecated hook usage and provides
 * automated fixes for simple migration cases.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration for deprecated hooks and their replacements
const HOOK_MIGRATIONS = {
  // Form hooks
  'useForm': {
    newHook: 'useFormValidation',
    newImport: "import { useFormValidation } from '../shared/hooks/useFormValidation';",
    complexity: 'medium',
    autoFixable: false,
    description: 'Migrate to useFormValidation with configuration object',
    example: `
// Before:
const form = useForm({ initialValues: {...}, validationRules: {...} });

// After:
const form = useFormValidation({
  fieldName: {
    initialValue: '',
    rules: { required: 'Field is required' }
  }
});`
  },

  // Property hooks
  'useProperties': {
    newHook: 'useSafePropertiesQuery',
    newImport: "import { useSafePropertiesQuery } from '../shared/hooks/useSafeQuery';",
    complexity: 'low',
    autoFixable: true,
    description: 'Direct replacement with enhanced error handling',
    example: `
// Before:
const { data, isLoading } = useProperties(params);

// After:
const { data, isLoading } = useSafePropertiesQuery(params);`
  },

  'useProperty': {
    newHook: 'useSafePropertyQuery',
    newImport: "import { useSafePropertyQuery } from '../shared/hooks/useSafeQuery';",
    complexity: 'low',
    autoFixable: true,
    description: 'Direct replacement with enhanced error handling',
    example: `
// Before:
const { data } = useProperty(id);

// After:
const { data } = useSafePropertyQuery(id);`
  },

  'useOwnerProperties': {
    newHook: 'useSafeOwnerPropertiesQuery',
    newImport: "import { useSafeOwnerPropertiesQuery } from '../shared/hooks/useSafeQuery';",
    complexity: 'low',
    autoFixable: true,
    description: 'Direct replacement with enhanced error handling'
  },

  'usePropertyActions': {
    newHook: 'useSafePropertyActionsQuery',
    newImport: "import { useSafePropertyActionsQuery } from '../shared/hooks/useSafeQuery';",
    complexity: 'high',
    autoFixable: false,
    description: 'Requires refactoring to query-based pattern',
    example: `
// Before:
const { addToFavorites } = usePropertyActions();

// After:
const { data } = useSafePropertyActionsQuery('favorites', propertyId);`
  },

  'usePropertySearch': {
    newHook: 'useSafePropertySearchQuery',
    newImport: "import { useSafePropertySearchQuery } from '../shared/hooks/useSafeQuery';",
    complexity: 'medium',
    autoFixable: false,
    description: 'Migrate to useSafePropertySearchQuery with state management'
  },

  // Performance hooks
  'usePerformanceMonitor': {
    newHook: 'useComponentPerformance',
    newImport: "import { useComponentPerformance } from '../shared/hooks/useComponentPerformance';",
    complexity: 'medium',
    autoFixable: false,
    description: 'Migrate to useComponentPerformance with configuration object'
  },

  // Pagination hooks
  'usePaginatedQuery': {
    newHook: 'usePagination',
    newImport: "import { usePagination } from '../shared/hooks/usePagination';",
    complexity: 'medium',
    autoFixable: false,
    description: 'Migrate to usePagination with mode: "paginated"'
  },

  'useInfiniteScroll': {
    newHook: 'usePagination',
    newImport: "import { usePagination } from '../shared/hooks/usePagination';",
    complexity: 'medium',
    autoFixable: false,
    description: 'Migrate to usePagination with mode: "infinite"'
  },

  // Accessibility hooks (already migrated, but keeping for detection)
  'useAccessibility': {
    status: 'migrated',
    description: 'Already migrated to enhanced useAccessibility.tsx',
    checkFile: true // Check if importing from .ts instead of .tsx
  }
};

// File patterns to scan
const SCAN_PATTERNS = [
  'src/**/*.ts',
  'src/**/*.tsx',
  '!src/**/*.test.ts',
  '!src/**/*.test.tsx',
  '!src/**/*.spec.ts',
  '!src/**/*.spec.tsx',
  '!node_modules/**',
  '!dist/**',
  '!build/**'
];

class MigrationDetector {
  constructor() {
    this.results = {
      totalFiles: 0,
      filesWithIssues: 0,
      totalIssues: 0,
      issues: [],
      summary: {}
    };
  }

  /**
   * Scan all files for deprecated hook usage
   */
  async scanFiles() {
    console.log('🔍 Scanning codebase for deprecated hook usage...\n');

    const files = this.getFilesToScan();
    this.results.totalFiles = files.length;

    for (const file of files) {
      await this.scanFile(file);
    }

    this.generateSummary();
    this.printReport();
    this.saveReport();
  }

  /**
   * Get list of files to scan based on patterns
   */
  getFilesToScan() {
    try {
      // Use glob pattern to find files
      const command = `find src -name "*.ts" -o -name "*.tsx" | grep -v test | grep -v spec`;
      const output = execSync(command, { encoding: 'utf8' });
      return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      console.error('Error finding files:', error.message);
      return [];
    }
  }

  /**
   * Scan individual file for deprecated hooks
   */
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      let fileHasIssues = false;

      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // Check for deprecated hook imports
        const importMatch = line.match(/import\s*{[^}]*}\s*from\s*['"][^'"]*['"]/);
        if (importMatch) {
          this.checkImportLine(line, filePath, lineNumber);
        }

        // Check for deprecated hook usage
        Object.keys(HOOK_MIGRATIONS).forEach(deprecatedHook => {
          const hookPattern = new RegExp(`\\b${deprecatedHook}\\s*\\(`, 'g');
          if (hookPattern.test(line)) {
            this.addIssue(filePath, lineNumber, line.trim(), deprecatedHook, 'usage');
            fileHasIssues = true;
          }
        });
      });

      if (fileHasIssues) {
        this.results.filesWithIssues++;
      }
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error.message);
    }
  }

  /**
   * Check import line for deprecated hooks
   */
  checkImportLine(line, filePath, lineNumber) {
    Object.keys(HOOK_MIGRATIONS).forEach(deprecatedHook => {
      const migration = HOOK_MIGRATIONS[deprecatedHook];
      
      // Check for deprecated import
      if (line.includes(deprecatedHook)) {
        // Special case for useAccessibility - check if importing from .ts
        if (deprecatedHook === 'useAccessibility' && line.includes('.ts')) {
          this.addIssue(filePath, lineNumber, line.trim(), deprecatedHook, 'import', 
            'Import from .tsx instead of .ts for enhanced accessibility features');
          return;
        }
        
        if (migration.status !== 'migrated') {
          this.addIssue(filePath, lineNumber, line.trim(), deprecatedHook, 'import');
        }
      }
    });
  }

  /**
   * Add issue to results
   */
  addIssue(filePath, lineNumber, lineContent, deprecatedHook, type, customMessage = null) {
    const migration = HOOK_MIGRATIONS[deprecatedHook];
    
    const issue = {
      file: filePath,
      line: lineNumber,
      content: lineContent,
      deprecatedHook,
      type, // 'import' or 'usage'
      newHook: migration.newHook,
      complexity: migration.complexity,
      autoFixable: migration.autoFixable,
      description: customMessage || migration.description,
      example: migration.example
    };

    this.results.issues.push(issue);
    this.results.totalIssues++;
  }

  /**
   * Generate summary statistics
   */
  generateSummary() {
    this.results.summary = {
      byHook: {},
      byComplexity: { low: 0, medium: 0, high: 0 },
      autoFixable: 0,
      manualRequired: 0
    };

    this.results.issues.forEach(issue => {
      // Count by hook
      if (!this.results.summary.byHook[issue.deprecatedHook]) {
        this.results.summary.byHook[issue.deprecatedHook] = 0;
      }
      this.results.summary.byHook[issue.deprecatedHook]++;

      // Count by complexity
      if (issue.complexity) {
        this.results.summary.byComplexity[issue.complexity]++;
      }

      // Count fixable vs manual
      if (issue.autoFixable) {
        this.results.summary.autoFixable++;
      } else {
        this.results.summary.manualRequired++;
      }
    });
  }

  /**
   * Print migration report to console
   */
  printReport() {
    console.log('📊 HOOK MIGRATION REPORT');
    console.log('========================\n');

    console.log(`📁 Files scanned: ${this.results.totalFiles}`);
    console.log(`⚠️  Files with issues: ${this.results.filesWithIssues}`);
    console.log(`🔧 Total issues found: ${this.results.totalIssues}\n`);

    if (this.results.totalIssues === 0) {
      console.log('✅ No deprecated hook usage found! Your codebase is up to date.\n');
      return;
    }

    // Summary by hook
    console.log('📋 ISSUES BY HOOK:');
    console.log('------------------');
    Object.entries(this.results.summary.byHook).forEach(([hook, count]) => {
      const migration = HOOK_MIGRATIONS[hook];
      const status = migration.autoFixable ? '🤖 Auto-fixable' : '👤 Manual required';
      console.log(`${hook}: ${count} issues (${status})`);
    });
    console.log();

    // Summary by complexity
    console.log('📊 COMPLEXITY BREAKDOWN:');
    console.log('------------------------');
    console.log(`🟢 Low complexity: ${this.results.summary.byComplexity.low} issues`);
    console.log(`🟡 Medium complexity: ${this.results.summary.byComplexity.medium} issues`);
    console.log(`🔴 High complexity: ${this.results.summary.byComplexity.high} issues`);
    console.log();

    console.log('🔧 MIGRATION EFFORT:');
    console.log('--------------------');
    console.log(`🤖 Auto-fixable: ${this.results.summary.autoFixable} issues`);
    console.log(`👤 Manual required: ${this.results.summary.manualRequired} issues`);
    console.log();

    // Detailed issues
    console.log('📝 DETAILED ISSUES:');
    console.log('-------------------');
    
    this.results.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.file}:${issue.line}`);
      console.log(`   Hook: ${issue.deprecatedHook} → ${issue.newHook || 'See description'}`);
      console.log(`   Type: ${issue.type}`);
      console.log(`   Complexity: ${issue.complexity || 'N/A'}`);
      console.log(`   Auto-fixable: ${issue.autoFixable ? 'Yes' : 'No'}`);
      console.log(`   Code: ${issue.content}`);
      console.log(`   Description: ${issue.description}`);
      
      if (issue.example) {
        console.log(`   Example:${issue.example}`);
      }
    });

    console.log('\n🚀 NEXT STEPS:');
    console.log('--------------');
    console.log('1. Review the detailed issues above');
    console.log('2. Run automated fixes: npm run migrate:fix');
    console.log('3. Manually migrate complex cases using the migration guide');
    console.log('4. Test your changes thoroughly');
    console.log('5. Run this script again to verify all issues are resolved');
    console.log('\n📖 For detailed migration instructions, see:');
    console.log('   src/shared/hooks/migration/COMPREHENSIVE_MIGRATION_GUIDE.md\n');
  }

  /**
   * Save report to file
   */
  saveReport() {
    const reportPath = 'migration-report.json';
    const timestamp = new Date().toISOString();
    
    const report = {
      timestamp,
      ...this.results
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }

  /**
   * Apply automated fixes for simple migrations
   */
  async applyAutomatedFixes(hookName = null) {
    console.log('🤖 Applying automated fixes...\n');

    const fixableIssues = this.results.issues.filter(issue => 
      issue.autoFixable && (!hookName || issue.deprecatedHook === hookName)
    );

    if (fixableIssues.length === 0) {
      console.log('ℹ️  No auto-fixable issues found.');
      return;
    }

    const fileChanges = {};

    // Group issues by file
    fixableIssues.forEach(issue => {
      if (!fileChanges[issue.file]) {
        fileChanges[issue.file] = [];
      }
      fileChanges[issue.file].push(issue);
    });

    // Apply fixes file by file
    Object.entries(fileChanges).forEach(([filePath, issues]) => {
      this.fixFile(filePath, issues);
    });

    console.log(`✅ Applied automated fixes to ${Object.keys(fileChanges).length} files`);
    console.log('⚠️  Please review the changes and test thoroughly before committing');
  }

  /**
   * Fix individual file
   */
  fixFile(filePath, issues) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      issues.forEach(issue => {
        const migration = HOOK_MIGRATIONS[issue.deprecatedHook];
        
        if (issue.type === 'import') {
          // Fix import statements
          const oldImportPattern = new RegExp(
            `import\\s*{([^}]*)}\\s*from\\s*['"][^'"]*${issue.deprecatedHook}[^'"]*['"]`,
            'g'
          );
          
          if (oldImportPattern.test(content)) {
            content = content.replace(oldImportPattern, migration.newImport);
            modified = true;
          }
        } else if (issue.type === 'usage') {
          // Fix hook usage (simple cases only)
          const oldHookPattern = new RegExp(`\\b${issue.deprecatedHook}\\b`, 'g');
          content = content.replace(oldHookPattern, migration.newHook);
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing file ${filePath}:`, error.message);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const detector = new MigrationDetector();

  switch (command) {
    case 'detect':
    case undefined:
      await detector.scanFiles();
      break;
      
    case 'fix':
      // First scan to get issues
      await detector.scanFiles();
      
      // Then apply fixes
      const hookName = args.find(arg => arg.startsWith('--hook='))?.split('=')[1];
      await detector.applyAutomatedFixes(hookName);
      break;
      
    case 'help':
      console.log(`
🔧 Hook Migration Tool

Usage:
  node scripts/migrate-hooks.js [command] [options]

Commands:
  detect (default)  Scan codebase for deprecated hook usage
  fix              Apply automated fixes for simple migrations
  help             Show this help message

Options:
  --hook=<name>    Only fix specific hook (use with 'fix' command)

Examples:
  node scripts/migrate-hooks.js                    # Scan for issues
  node scripts/migrate-hooks.js detect             # Same as above
  node scripts/migrate-hooks.js fix                # Fix all auto-fixable issues
  node scripts/migrate-hooks.js fix --hook=useForm # Fix only useForm issues

For detailed migration instructions, see:
src/shared/hooks/migration/COMPREHENSIVE_MIGRATION_GUIDE.md
      `);
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run "node scripts/migrate-hooks.js help" for usage information');
      process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { MigrationDetector, HOOK_MIGRATIONS };