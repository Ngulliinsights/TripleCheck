#!/usr/bin/env tsx

/**
 * TRIPLECHECK PRODUCTION VALIDATION SCRIPT
 * ========================================
 * 
 * Validates that the application is ready for production deployment
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  passed: boolean;
  category: string;
  test: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

class ProductionValidator {
  private results: ValidationResult[] = [];
  private rootDir: string;

  constructor() {
    this.rootDir = process.cwd();
  }

  /**
   * Run all production validation checks
   */
  async validate(): Promise<boolean> {
    console.log('🔍 Validating production readiness...\n');

    // Run all validation categories
    await this.validateEnvironment();
    await this.validateSecurity();
    await this.validatePerformance();
    await this.validateBuild();
    await this.validateDependencies();

    // Display results
    this.displayResults();

    // Return overall status
    const hasErrors = this.results.some(r => !r.passed && r.severity === 'error');
    return !hasErrors;
  }

  /**
   * Validate environment configuration
   */
  private async validateEnvironment(): Promise<void> {
    const category = 'Environment';

    // Check NODE_ENV
    this.addResult({
      category,
      test: 'NODE_ENV set to production',
      passed: process.env.NODE_ENV === 'production',
      message: process.env.NODE_ENV === 'production' 
        ? 'NODE_ENV correctly set to production'
        : 'NODE_ENV should be set to production',
      severity: 'error'
    });

    // Check required environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'FRONTEND_URL'
    ];

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      this.addResult({
        category,
        test: `${envVar} configured`,
        passed: !!value && value.length > 0,
        message: value 
          ? `${envVar} is configured`
          : `${envVar} is missing or empty`,
        severity: 'error'
      });
    }

    // Check JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      const isStrong = jwtSecret.length >= 32 && !/^(test|dev|demo|secret|password|123)/.test(jwtSecret.toLowerCase());
      this.addResult({
        category,
        test: 'JWT secret strength',
        passed: isStrong,
        message: isStrong 
          ? 'JWT secret appears to be strong'
          : 'JWT secret should be at least 32 characters and not use common words',
        severity: 'error'
      });
    }

    // Check database URL format
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const url = new URL(dbUrl);
        const isSecure = url.protocol === 'postgresql:' && dbUrl.includes('sslmode=require');
        this.addResult({
          category,
          test: 'Database SSL configuration',
          passed: isSecure,
          message: isSecure 
            ? 'Database connection uses SSL'
            : 'Database should use SSL in production (sslmode=require)',
          severity: 'warning'
        });
      } catch {
        this.addResult({
          category,
          test: 'Database URL format',
          passed: false,
          message: 'DATABASE_URL format is invalid',
          severity: 'error'
        });
      }
    }
  }

  /**
   * Validate security configuration
   */
  private async validateSecurity(): Promise<void> {
    const category = 'Security';

    // Check for demo passwords in production
    const demoPwd = process.env.VITE_DEMO_USER_PASSWORD;
    this.addResult({
      category,
      test: 'Demo passwords removed',
      passed: !demoPwd || demoPwd === '',
      message: demoPwd 
        ? 'Demo passwords should be removed in production'
        : 'No demo passwords found',
      severity: 'warning'
    });

    // Check CORS configuration
    const corsOrigin = process.env.CORS_ORIGIN;
    const frontendUrl = process.env.FRONTEND_URL;
    this.addResult({
      category,
      test: 'CORS configuration',
      passed: !!corsOrigin && corsOrigin !== '*',
      message: corsOrigin && corsOrigin !== '*'
        ? 'CORS is properly configured'
        : 'CORS should be configured with specific origins, not wildcard',
      severity: 'warning'
    });

    // Check session secret
    const sessionSecret = process.env.SESSION_SECRET;
    if (sessionSecret) {
      const isStrong = sessionSecret.length >= 32;
      this.addResult({
        category,
        test: 'Session secret strength',
        passed: isStrong,
        message: isStrong 
          ? 'Session secret is sufficiently long'
          : 'Session secret should be at least 32 characters',
        severity: 'warning'
      });
    }

    // Check for development-only features
    const enableDemo = process.env.ENABLE_DEMO_DATA;
    this.addResult({
      category,
      test: 'Demo data disabled',
      passed: enableDemo !== 'true',
      message: enableDemo === 'true'
        ? 'Demo data should be disabled in production'
        : 'Demo data is properly disabled',
      severity: 'warning'
    });
  }

  /**
   * Validate performance configuration
   */
  private async validatePerformance(): Promise<void> {
    const category = 'Performance';

    // Check if build exists
    const buildExists = existsSync(join(this.rootDir, 'dist/public'));
    this.addResult({
      category,
      test: 'Production build exists',
      passed: buildExists,
      message: buildExists 
        ? 'Production build found'
        : 'Production build not found - run npm run build',
      severity: 'error'
    });

    if (buildExists) {
      // Check for source maps in production
      try {
        const jsFiles = execSync('find dist/public -name "*.js.map" 2>/dev/null || true', { encoding: 'utf8' });
        const hasSourceMaps = jsFiles.trim().length > 0;
        this.addResult({
          category,
          test: 'Source maps removed',
          passed: !hasSourceMaps,
          message: hasSourceMaps 
            ? 'Source maps found in production build - consider removing for security'
            : 'No source maps in production build',
          severity: 'warning'
        });
      } catch {
        // Skip this check if find command fails
      }

      // Check bundle size
      try {
        const bundleSize = execSync('du -sh dist/public 2>/dev/null || echo "0M"', { encoding: 'utf8' });
        const sizeMatch = bundleSize.match(/^(\d+(?:\.\d+)?)[MG]/);
        if (sizeMatch) {
          const size = parseFloat(sizeMatch[1]);
          const unit = bundleSize.includes('G') ? 'G' : 'M';
          const isReasonable = unit === 'M' && size < 50; // Less than 50MB
          
          this.addResult({
            category,
            test: 'Bundle size reasonable',
            passed: isReasonable,
            message: isReasonable 
              ? `Bundle size is reasonable: ${bundleSize.trim()}`
              : `Bundle size may be too large: ${bundleSize.trim()}`,
            severity: 'warning'
          });
        }
      } catch {
        // Skip bundle size check if it fails
      }
    }

    // Check caching configuration
    const enableCaching = process.env.ENABLE_CACHING !== 'false';
    this.addResult({
      category,
      test: 'Caching enabled',
      passed: enableCaching,
      message: enableCaching 
        ? 'Caching is enabled'
        : 'Consider enabling caching for better performance',
      severity: 'info'
    });
  }

  /**
   * Validate build configuration
   */
  private async validateBuild(): Promise<void> {
    const category = 'Build';

    // Check TypeScript configuration
    const tsconfigExists = existsSync(join(this.rootDir, 'tsconfig.json'));
    this.addResult({
      category,
      test: 'TypeScript configuration',
      passed: tsconfigExists,
      message: tsconfigExists 
        ? 'TypeScript configuration found'
        : 'TypeScript configuration missing',
      severity: 'error'
    });

    // Run TypeScript check
    try {
      execSync('npm run check', { stdio: 'pipe' });
      this.addResult({
        category,
        test: 'TypeScript compilation',
        passed: true,
        message: 'TypeScript compilation successful',
        severity: 'error'
      });
    } catch {
      this.addResult({
        category,
        test: 'TypeScript compilation',
        passed: false,
        message: 'TypeScript compilation failed - fix type errors',
        severity: 'error'
      });
    }

    // Check for linting errors
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      this.addResult({
        category,
        test: 'Linting',
        passed: true,
        message: 'No linting errors found',
        severity: 'warning'
      });
    } catch {
      this.addResult({
        category,
        test: 'Linting',
        passed: false,
        message: 'Linting errors found - consider fixing',
        severity: 'warning'
      });
    }
  }

  /**
   * Validate dependencies
   */
  private async validateDependencies(): Promise<void> {
    const category = 'Dependencies';

    // Check for security vulnerabilities
    try {
      execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
      this.addResult({
        category,
        test: 'Security vulnerabilities',
        passed: true,
        message: 'No moderate or high security vulnerabilities found',
        severity: 'warning'
      });
    } catch {
      this.addResult({
        category,
        test: 'Security vulnerabilities',
        passed: false,
        message: 'Security vulnerabilities found - run npm audit fix',
        severity: 'warning'
      });
    }

    // Check package.json
    try {
      const packageJson = JSON.parse(readFileSync(join(this.rootDir, 'package.json'), 'utf8'));
      
      // Check Node.js version requirement
      const nodeVersion = packageJson.engines?.node;
      this.addResult({
        category,
        test: 'Node.js version specified',
        passed: !!nodeVersion,
        message: nodeVersion 
          ? `Node.js version requirement: ${nodeVersion}`
          : 'Consider specifying Node.js version in package.json engines',
        severity: 'info'
      });

      // Check for production scripts
      const hasProductionScripts = !!(packageJson.scripts?.build && packageJson.scripts?.start);
      this.addResult({
        category,
        test: 'Production scripts',
        passed: hasProductionScripts,
        message: hasProductionScripts 
          ? 'Build and start scripts are configured'
          : 'Missing build or start scripts',
        severity: 'error'
      });

    } catch {
      this.addResult({
        category,
        test: 'Package.json validation',
        passed: false,
        message: 'Could not read or parse package.json',
        severity: 'error'
      });
    }
  }

  /**
   * Add validation result
   */
  private addResult(result: Omit<ValidationResult, 'passed'> & { passed: boolean }): void {
    this.results.push(result);
  }

  /**
   * Display validation results
   */
  private displayResults(): void {
    const categories = [...new Set(this.results.map(r => r.category))];
    
    for (const category of categories) {
      console.log(`\n📋 ${category}`);
      console.log('─'.repeat(50));
      
      const categoryResults = this.results.filter(r => r.category === category);
      
      for (const result of categoryResults) {
        const icon = result.passed ? '✅' : 
                    result.severity === 'error' ? '❌' : 
                    result.severity === 'warning' ? '⚠️' : 'ℹ️';
        
        console.log(`${icon} ${result.test}: ${result.message}`);
      }
    }

    // Summary
    const errors = this.results.filter(r => !r.passed && r.severity === 'error').length;
    const warnings = this.results.filter(r => !r.passed && r.severity === 'warning').length;
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    console.log('\n📊 Summary');
    console.log('─'.repeat(50));
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Errors: ${errors}`);

    if (errors === 0) {
      console.log('\n🎉 Production validation passed! Ready for deployment.');
    } else {
      console.log('\n🚨 Production validation failed! Fix errors before deployment.');
    }
  }
}

/**
 * CLI Interface
 */
async function main() {
  try {
    const validator = new ProductionValidator();
    const isValid = await validator.validate();
    
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('Validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ProductionValidator };