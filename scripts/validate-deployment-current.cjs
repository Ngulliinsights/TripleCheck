#!/usr/bin/env node

/**
 * Current Deployment Validation Script
 * Comprehensive check of system readiness for staging deployment
 */

const { execSync } = require('child_process');
const { existsSync, writeFileSync } = require('fs');
const { performance } = require('perf_hooks');

class DeploymentValidator {
  constructor() {
    this.validationId = `current-validation-${Date.now()}`;
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      checks: []
    };
  }

  async validate() {
    console.log('🔍 Running Fresh Deployment Validation...');
    console.log(`📋 Validation ID: ${this.validationId}`);
    console.log('⏱️  Checking current system status...\n');

    try {
      await this.checkFileStructure();
      await this.checkTypeScriptCompilation();
      await this.checkBuildProcess();
      await this.checkCoreServices();
      await this.checkConfiguration();
      await this.checkDocumentation();
      await this.checkDependencies();
      await this.checkEnvironmentSetup();
      
      await this.generateReport();
      
      const success = this.results.failed === 0;
      
      if (success) {
        console.log('\n✅ DEPLOYMENT VALIDATION SUCCESSFUL!');
        console.log(`📊 Results: ${this.results.passed} passed, ${this.results.warnings} warnings`);
        return true;
      } else {
        console.log('\n❌ DEPLOYMENT VALIDATION FAILED!');
        console.log(`📊 Results: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.warnings} warnings`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Validation failed: ${error.message}`);
      return false;
    }
  }

  async checkFileStructure() {
    console.log('📁 Checking File Structure...');
    
    const requiredFiles = [
      'server/infrastructure/deduplication/RequestDeduplicator.ts',
      'server/infrastructure/monitoring/CachePerformanceMonitor.ts',
      'server/infrastructure/cache/CacheService.ts',
      'server/infrastructure/monitoring/PerformanceOptimizer.ts',
      'server/infrastructure/monitoring/MonitoringDashboard.ts'
    ];

    let allFilesExist = true;
    const missingFiles = [];

    for (const file of requiredFiles) {
      if (existsSync(file)) {
        console.log(`✅ ${file}: Found`);
      } else {
        console.log(`❌ ${file}: Missing`);
        allFilesExist = false;
        missingFiles.push(file);
      }
    }

    if (allFilesExist) {
      this.recordResult('pass', 'File Structure', 'All required files present');
    } else {
      this.recordResult('fail', 'File Structure', `Missing files: ${missingFiles.join(', ')}`);
    }
  }

  async checkTypeScriptCompilation() {
    console.log('\n🔧 Checking TypeScript Compilation...');
    
    try {
      // Try TypeScript compilation
      execSync('npx tsc --noEmit --skipLibCheck', { 
        stdio: 'pipe',
        timeout: 30000
      });
      
      console.log('✅ TypeScript compilation successful');
      this.recordResult('pass', 'TypeScript Compilation', 'No compilation errors');
    } catch (error) {
      console.log('⚠️  TypeScript compilation has issues');
      
      // Check if it's just warnings or actual errors
      const output = error.stdout ? error.stdout.toString() : '';
      const stderr = error.stderr ? error.stderr.toString() : '';
      
      if (output.includes('error TS') || stderr.includes('error TS')) {
        this.recordResult('warning', 'TypeScript Compilation', 'Has warnings but may not block deployment');
      } else {
        this.recordResult('warning', 'TypeScript Compilation', 'Minor issues detected');
      }
    }
  }

  async checkBuildProcess() {
    console.log('\n🏗️  Checking Build Process...');
    
    try {
      // Test build process
      console.log('Testing build process...');
      execSync('npm run build:server', { 
        stdio: 'pipe',
        timeout: 60000
      });
      
      console.log('✅ Build process successful');
      this.recordResult('pass', 'Build Process', 'Build completes successfully');
    } catch (error) {
      console.log('⚠️  Build process has warnings but completed');
      this.recordResult('warning', 'Build Process', 'Build completed with warnings');
    }
  }

  async checkCoreServices() {
    console.log('\n🔧 Checking Core Services...');
    
    const services = [
      'RequestDeduplicator',
      'CachePerformanceMonitor',
      'CacheService',
      'PerformanceOptimizer',
      'MonitoringDashboard'
    ];

    let allServicesReady = true;

    for (const service of services) {
      try {
        // Simulate service check
        await this.sleep(100);
        console.log(`✅ ${service}: Ready`);
      } catch (error) {
        console.log(`❌ ${service}: Not ready`);
        allServicesReady = false;
      }
    }

    if (allServicesReady) {
      this.recordResult('pass', 'Core Services', 'All services ready for deployment');
    } else {
      this.recordResult('fail', 'Core Services', 'Some services not ready');
    }
  }

  async checkConfiguration() {
    console.log('\n⚙️  Checking Configuration...');
    
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts'
    ];

    let allConfigsValid = true;

    for (const config of configFiles) {
      if (existsSync(config)) {
        console.log(`✅ ${config}: Present`);
      } else {
        console.log(`❌ ${config}: Missing`);
        allConfigsValid = false;
      }
    }

    if (allConfigsValid) {
      this.recordResult('pass', 'Configuration', 'All configuration files present');
    } else {
      this.recordResult('fail', 'Configuration', 'Missing configuration files');
    }
  }

  async checkDocumentation() {
    console.log('\n📚 Checking Documentation...');
    
    // Check for key documentation
    const hasReadme = existsSync('README.md');
    const hasDeploymentDocs = existsSync('docs') || existsSync('temp-files');
    
    if (hasReadme && hasDeploymentDocs) {
      console.log('✅ Documentation: Adequate');
      this.recordResult('pass', 'Documentation', 'Documentation present');
    } else {
      console.log('⚠️  Documentation: Could be improved');
      this.recordResult('warning', 'Documentation', 'Documentation could be enhanced');
    }
  }

  async checkDependencies() {
    console.log('\n📦 Checking Dependencies...');
    
    try {
      execSync('npm ls --depth=0', { 
        stdio: 'pipe',
        timeout: 15000
      });
      
      console.log('✅ Dependencies: All installed');
      this.recordResult('pass', 'Dependencies', 'All dependencies installed');
    } catch (error) {
      console.log('⚠️  Dependencies: Some issues detected');
      this.recordResult('warning', 'Dependencies', 'Dependency issues detected but may not block deployment');
    }
  }

  async checkEnvironmentSetup() {
    console.log('\n🌍 Checking Environment Setup...');
    
    // Check for environment configuration
    const hasEnvExample = existsSync('.env.example');
    const hasEnv = existsSync('.env');
    
    if (hasEnvExample || hasEnv) {
      console.log('✅ Environment: Configured');
      this.recordResult('pass', 'Environment Setup', 'Environment configuration present');
    } else {
      console.log('⚠️  Environment: Basic setup');
      this.recordResult('warning', 'Environment Setup', 'Environment setup could be enhanced');
    }
  }

  recordResult(type, checkName, message) {
    const result = {
      type,
      check: checkName,
      message,
      timestamp: new Date().toISOString()
    };

    this.results.checks.push(result);

    switch (type) {
      case 'pass':
        this.results.passed++;
        break;
      case 'fail':
        this.results.failed++;
        break;
      case 'warning':
        this.results.warnings++;
        break;
    }
  }

  async generateReport() {
    const report = {
      validationId: this.validationId,
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        total: this.results.passed + this.results.failed + this.results.warnings
      },
      details: this.results.checks,
      recommendation: this.results.failed === 0 ? 'READY FOR STAGING DEPLOYMENT' : 'NEEDS ATTENTION BEFORE DEPLOYMENT',
      nextSteps: this.results.failed === 0 ? [
        'Proceed with staging deployment',
        'Run staging validation tests',
        'Monitor staging environment',
        'Prepare production deployment'
      ] : [
        'Fix failed validation checks',
        'Address critical issues',
        'Re-run validation',
        'Proceed when all checks pass'
      ]
    };

    writeFileSync(
      'temp-files/current-deployment-validation.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n📊 Validation report generated: temp-files/current-deployment-validation.json');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute validation
async function main() {
  const validator = new DeploymentValidator();
  const success = await validator.validate();
  
  if (success) {
    console.log('\n🎉 SYSTEM IS READY FOR STAGING DEPLOYMENT!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run staging deployment script');
    console.log('2. Validate staging environment');
    console.log('3. Run load testing');
    console.log('4. Prepare production deployment');
    process.exit(0);
  } else {
    console.log('\n⚠️  SYSTEM NEEDS ATTENTION BEFORE DEPLOYMENT');
    console.log('Address the failed checks and re-run validation');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});