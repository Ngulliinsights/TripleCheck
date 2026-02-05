#!/usr/bin/env tsx

/**
 * Database Infrastructure Consolidation Validation Script
 * 
 * Validates that the database infrastructure consolidation was successful
 * and all functionality is working correctly.
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from '..\..\..\..\scripts\cleanup-redundancies';

interface ValidationResult {
  category: string;
  checks: ValidationCheck[];
  passed: number;
  failed: number;
  warnings: number;
}

interface ValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

class ConsolidationValidator {
  private results: ValidationResult[] = [];

  async validate(): Promise<boolean> {
    console.log('🔍 Validating Database Infrastructure Consolidation');
    console.log('=' .repeat(60));

    // Run all validation categories
    await this.validateFileStructure();
    await this.validateConfigurations();
    await this.validateSchemas();
    await this.validateServices();
    await this.validateImports();
    await this.validateFunctionality();

    // Print results
    this.printResults();

    // Return overall success
    return this.isOverallSuccess();
  }

  private async validateFileStructure(): Promise<void> {
    const checks: ValidationCheck[] = [];
    
    // Check that main database structure exists
    const requiredDirectories = [
      'database/config',
      'database/schemas',
      'database/connection',
      'database/migrations',
      'database/seeds',
      'database/utils',
      'database/scripts'
    ];

    for (const dir of requiredDirectories) {
      try {
        await fs.access(dir);
        checks.push({
          name: `Directory exists: ${dir}`,
          status: 'pass',
          message: 'Required directory found'
        });
      } catch {
        checks.push({
          name: `Directory exists: ${dir}`,
          status: 'fail',
          message: 'Required directory missing'
        });
      }
    }

    // Check that server infrastructure database is still there (should be removed after validation)
    try {
      await fs.access('server/infrastructure/database');
      checks.push({
        name: 'Server infrastructure database cleanup',
        status: 'warning',
        message: 'Server infrastructure database still exists - should be removed after validation'
      });
    } catch {
      checks.push({
        name: 'Server infrastructure database cleanup',
        status: 'pass',
        message: 'Server infrastructure database properly removed'
      });
    }

    // Check for integrated files
    const integratedFiles = [
      'database/config/index.ts',
      'database/utils/QueryOptimizer.ts',
      'database/services/FullStackIntegration.ts',
      'database/services/DatabaseInitializer.ts'
    ];

    for (const file of integratedFiles) {
      try {
        await fs.access(file);
        checks.push({
          name: `Integrated file: ${file}`,
          status: 'pass',
          message: 'Integration file found'
        });
      } catch {
        checks.push({
          name: `Integrated file: ${file}`,
          status: 'warning',
          message: 'Integration file not found - may not have existed in source'
        });
      }
    }

    this.results.push({
      category: 'File Structure',
      checks,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warning').length
    });
  }

  private async validateConfigurations(): Promise<void> {
    const checks: ValidationCheck[] = [];
    
    // Check main configuration file
    try {
      const configPath = 'database/config/index.ts';
      const configContent = await fs.readFile(configPath, 'utf-8');
      
      if (configContent.includes('EnhancedDatabaseConfig')) {
        checks.push({
          name: 'Enhanced configuration interface',
          status: 'pass',
          message: 'Enhanced configuration interface found'
        });
      } else {
        checks.push({
          name: 'Enhanced configuration interface',
          status: 'warning',
          message: 'Enhanced configuration interface not found'
        });
      }

      if (configContent.includes('serverDatabaseConfig')) {
        checks.push({
          name: 'Server configuration integration',
          status: 'pass',
          message: 'Server configuration integrated'
        });
      } else {
        checks.push({
          name: 'Server configuration integration',
          status: 'warning',
          message: 'Server configuration not integrated'
        });
      }

      if (configContent.includes('buildConnectionString')) {
        checks.push({
          name: 'Connection string builder',
          status: 'pass',
          message: 'Connection string builder function found'
        });
      } else {
        checks.push({
          name: 'Connection string builder',
          status: 'warning',
          message: 'Connection string builder function not found'
        });
      }

    } catch (error) {
      checks.push({
        name: 'Configuration file validation',
        status: 'fail',
        message: 'Could not read configuration file',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    // Check for backup configuration
    try {
      await fs.access('database/config/original-config.ts');
      checks.push({
        name: 'Original configuration backup',
        status: 'pass',
        message: 'Original configuration backed up'
      });
    } catch {
      checks.push({
        name: 'Original configuration backup',
        status: 'warning',
        message: 'Original configuration backup not found'
      });
    }

    this.results.push({
      category: 'Configuration',
      checks,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warning').length
    });
  }

  private async validateSchemas(): Promise<void> {
    const checks: ValidationCheck[] = [];
    
    // Check schema directories
    const schemaDirectories = [
      'database/schemas/core',
      'database/schemas/verification',
      'database/schemas/trust',
      'database/schemas/fraud',
      'database/schemas/communication',
      'database/schemas/analytics'
    ];

    for (const dir of schemaDirectories) {
      try {
        const files = await fs.readdir(dir);
        const tsFiles = files.filter(f => f.endsWith('.ts'));
        
        if (tsFiles.length > 0) {
          checks.push({
            name: `Schema directory: ${dir}`,
            status: 'pass',
            message: `Found ${tsFiles.length} schema files`
          });
        } else {
          checks.push({
            name: `Schema directory: ${dir}`,
            status: 'warning',
            message: 'No schema files found'
          });
        }
      } catch {
        checks.push({
          name: `Schema directory: ${dir}`,
          status: 'warning',
          message: 'Schema directory not found'
        });
      }
    }

    // Check for server-integrated schemas
    try {
      const coreFiles = await fs.readdir('database/schemas/core');
      const serverFiles = coreFiles.filter(f => f.startsWith('server-'));
      
      if (serverFiles.length > 0) {
        checks.push({
          name: 'Server schema integration',
          status: 'pass',
          message: `Found ${serverFiles.length} integrated server schema files`
        });
      } else {
        checks.push({
          name: 'Server schema integration',
          status: 'warning',
          message: 'No server schema files found - may not have existed'
        });
      }
    } catch {
      checks.push({
        name: 'Server schema integration',
        status: 'warning',
        message: 'Could not check for server schema integration'
      });
    }

    this.results.push({
      category: 'Schemas',
      checks,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warning').length
    });
  }

  private async validateServices(): Promise<void> {
    const checks: ValidationCheck[] = [];
    
    // Check main database service
    try {
      const servicePath = 'database/service.ts';
      await fs.access(servicePath);
      checks.push({
        name: 'Main database service',
        status: 'pass',
        message: 'Database service file found'
      });
    } catch {
      checks.push({
        name: 'Main database service',
        status: 'fail',
        message: 'Database service file not found'
      });
    }

    // Check integrated services
    const integratedServices = [
      'database/utils/QueryOptimizer.ts',
      'database/services/FullStackIntegration.ts',
      'database/services/DatabaseInitializer.ts'
    ];

    for (const service of integratedServices) {
      try {
        await fs.access(service);
        checks.push({
          name: `Integrated service: ${path.basename(service)}`,
          status: 'pass',
          message: 'Service integrated successfully'
        });
      } catch {
        checks.push({
          name: `Integrated service: ${path.basename(service)}`,
          status: 'warning',
          message: 'Service not found - may not have existed in source'
        });
      }
    }

    // Check connection integration
    try {
      await fs.access('database/connection/server-connection.ts');
      checks.push({
        name: 'Server connection integration',
        status: 'pass',
        message: 'Server connection patterns integrated'
      });
    } catch {
      checks.push({
        name: 'Server connection integration',
        status: 'warning',
        message: 'Server connection integration not found'
      });
    }

    this.results.push({
      category: 'Services',
      checks,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warning').length
    });
  }

  private async validateImports(): Promise<void> {
    const checks: ValidationCheck[] = [];
    
    try {
      // Check for remaining server infrastructure database imports
      const command = `find server/ src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "server/infrastructure/database" 2>/dev/null || true`;
      const result = execSync(command, { encoding: 'utf-8' });
      
      if (result.trim()) {
        const files = result.trim().split('\n').filter(f => f.trim());
        checks.push({
          name: 'Import path updates',
          status: 'fail',
          message: `Found ${files.length} files with old import paths`,
          details: files.join(', ')
        });
      } else {
        checks.push({
          name: 'Import path updates',
          status: 'pass',
          message: 'All import paths updated successfully'
        });
      }
    } catch (error) {
      checks.push({
        name: 'Import path updates',
        status: 'warning',
        message: 'Could not check import paths',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    // Check main database exports
    try {
      const indexPath = 'database/index.ts';
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      
      if (indexContent.includes('export')) {
        checks.push({
          name: 'Main database exports',
          status: 'pass',
          message: 'Database exports are available'
        });
      } else {
        checks.push({
          name: 'Main database exports',
          status: 'fail',
          message: 'No exports found in main database index'
        });
      }
    } catch (error) {
      checks.push({
        name: 'Main database exports',
        status: 'fail',
        message: 'Could not read main database index',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    this.results.push({
      category: 'Imports',
      checks,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warning').length
    });
  }

  private async validateFunctionality(): Promise<void> {
    const checks: ValidationCheck[] = [];
    
    // Test TypeScript compilation
    try {
      execSync('npx tsc --noEmit --project tsconfig.json', { stdio: 'pipe' });
      checks.push({
        name: 'TypeScript compilation',
        status: 'pass',
        message: 'TypeScript compiles without errors'
      });
    } catch (error) {
      checks.push({
        name: 'TypeScript compilation',
        status: 'fail',
        message: 'TypeScript compilation failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    // Test database connection (if possible)
    try {
      execSync('tsx database/scripts/test-connection.ts', { stdio: 'pipe' });
      checks.push({
        name: 'Database connection test',
        status: 'pass',
        message: 'Database connection test passed'
      });
    } catch (error) {
      checks.push({
        name: 'Database connection test',
        status: 'warning',
        message: 'Database connection test failed - may be expected without database',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    // Test database scripts
    const scripts = [
      'database/scripts/status.ts',
      'database/scripts/validate.ts'
    ];

    for (const script of scripts) {
      try {
        await fs.access(script);
        checks.push({
          name: `Script availability: ${path.basename(script)}`,
          status: 'pass',
          message: 'Script is available'
        });
      } catch {
        checks.push({
          name: `Script availability: ${path.basename(script)}`,
          status: 'fail',
          message: 'Required script not found'
        });
      }
    }

    this.results.push({
      category: 'Functionality',
      checks,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warning').length
    });
  }

  private printResults(): void {
    console.log('\n📊 Validation Results');
    console.log('=' .repeat(60));

    let totalPassed = 0;
    let totalFailed = 0;
    let totalWarnings = 0;

    for (const result of this.results) {
      console.log(`\n📋 ${result.category}`);
      console.log(`   ✅ Passed: ${result.passed}`);
      console.log(`   ❌ Failed: ${result.failed}`);
      console.log(`   ⚠️  Warnings: ${result.warnings}`);

      totalPassed += result.passed;
      totalFailed += result.failed;
      totalWarnings += result.warnings;

      // Show failed checks
      const failedChecks = result.checks.filter(c => c.status === 'fail');
      if (failedChecks.length > 0) {
        console.log('   Failed checks:');
        for (const check of failedChecks) {
          console.log(`     ❌ ${check.name}: ${check.message}`);
          if (check.details) {
            console.log(`        Details: ${check.details}`);
          }
        }
      }

      // Show warnings
      const warningChecks = result.checks.filter(c => c.status === 'warning');
      if (warningChecks.length > 0) {
        console.log('   Warnings:');
        for (const check of warningChecks) {
          console.log(`     ⚠️  ${check.name}: ${check.message}`);
          if (check.details) {
            console.log(`        Details: ${check.details}`);
          }
        }
      }
    }

    console.log('\n📈 Overall Summary');
    console.log('=' .repeat(60));
    console.log(`✅ Total Passed: ${totalPassed}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(`⚠️  Total Warnings: ${totalWarnings}`);

    const successRate = Math.round((totalPassed / (totalPassed + totalFailed + totalWarnings)) * 100);
    console.log(`📊 Success Rate: ${successRate}%`);

    if (totalFailed === 0) {
      console.log('\n🎉 Consolidation validation PASSED!');
      if (totalWarnings > 0) {
        console.log('⚠️  Some warnings were found - review them for potential improvements');
      }
    } else {
      console.log('\n💥 Consolidation validation FAILED!');
      console.log('❌ Critical issues must be resolved before proceeding');
    }
  }

  private isOverallSuccess(): boolean {
    const totalFailed = this.results.reduce((sum, result) => sum + result.failed, 0);
    return totalFailed === 0;
  }
}

// CLI execution
async function main() {
  const validator = new ConsolidationValidator();
  
  try {
    const success = await validator.validate();
    
    if (success) {
      console.log('\n✅ Database infrastructure consolidation validation completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Review any warnings and address if needed');
      console.log('2. Run full test suite: npm test');
      console.log('3. Remove server/infrastructure/database/ directory');
      console.log('4. Update documentation and package.json scripts');
      console.log('5. Commit changes to version control');
      
      process.exit(0);
    } else {
      console.error('\n❌ Validation failed - consolidation needs attention');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Critical validation error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { ConsolidationValidator };