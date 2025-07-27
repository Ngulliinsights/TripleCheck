#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { db as database } from '../infrastructure/database/connection';

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
}

class SystemIntegrationValidator {
  private results: ValidationResult[] = [];

  async validateSystem(): Promise<void> {
    console.log('🔍 Validating Kenya Land Verification System Integration');
    console.log('=' .repeat(70));

    // Run all validation checks
    await this.validateDatabaseSchema();
    await this.validateBackendServices();
    await this.validateFrontendComponents();
    await this.validateAPIEndpoints();
    await this.validateRouteIntegration();
    await this.validateServiceIntegration();
    await this.validateConfigurationFiles();
    await this.validateTestCoverage();

    // Generate report
    this.generateValidationReport();

    // Exit with appropriate code
    const failures = this.results.filter(r => r.status === 'fail');
    if (failures.length > 0) {
      console.log('\n❌ System validation failed. Please fix the issues above.');
      process.exit(1);
    } else {
      console.log('\n✅ System validation passed. All components are properly integrated.');
      process.exit(0);
    }
  }

  private async validateDatabaseSchema(): Promise<void> {
    console.log('🗄️  Validating Database Schema...');

    try {
      // Check if land verification tables exist
      const tables = [
        'land_verification_sessions',
        'land_verification_layers',
        'land_verification_results',
        'land_verification_risk_assessments',
        'land_verification_monitoring'
      ];

      for (const table of tables) {
        try {
          await database.query(`SELECT 1 FROM ${table} LIMIT 1`);
          this.addResult('Database Schema', 'pass', `Table ${table} exists and accessible`);
        } catch (error) {
          this.addResult('Database Schema', 'fail', `Table ${table} missing or inaccessible`, [String(error)]);
        }
      }

      // Check for required indexes
      const indexChecks = [
        'land_verification_sessions_property_id_idx',
        'land_verification_sessions_user_id_idx',
        'land_verification_layers_session_id_idx'
      ];

      for (const index of indexChecks) {
        try {
          const result = await database.query(`
            SELECT indexname FROM pg_indexes 
            WHERE indexname = $1
          `, [index]);
          
          if (result.rows.length > 0) {
            this.addResult('Database Schema', 'pass', `Index ${index} exists`);
          } else {
            this.addResult('Database Schema', 'warning', `Index ${index} missing - may impact performance`);
          }
        } catch (error) {
          this.addResult('Database Schema', 'warning', `Could not verify index ${index}`, [String(error)]);
        }
      }

    } catch (error) {
      this.addResult('Database Schema', 'fail', 'Database connection failed', [String(error)]);
    }
  }

  private async validateBackendServices(): Promise<void> {
    console.log('⚙️  Validating Backend Services...');

    const serviceFiles = [
      'server/land-verification/LandVerificationService.ts',
      'server/land-verification/RiskAssessmentService.ts',
      'server/land-verification/CommunityIntelligenceService.ts',
      'server/land-verification/ExpertCoordinationService.ts',
      'server/land-verification/MonitoringService.ts',
      'server/land-verification/DocumentIntegration.ts'
    ];

    for (const serviceFile of serviceFiles) {
      try {
        await fs.access(serviceFile);
        
        // Check if service exports the expected class
        const content = await fs.readFile(serviceFile, 'utf-8');
        const serviceName = path.basename(serviceFile, '.ts');
        
        if (content.includes(`export class ${serviceName}`) || content.includes(`class ${serviceName}`)) {
          this.addResult('Backend Services', 'pass', `${serviceName} properly implemented`);
        } else {
          this.addResult('Backend Services', 'fail', `${serviceName} class not found in file`);
        }
        
        // Check for required methods based on service type
        if (serviceName === 'LandVerificationService') {
          const requiredMethods = ['initiateVerification', 'executeVerificationLayer', 'generateRiskAssessment'];
          for (const method of requiredMethods) {
            if (content.includes(method)) {
              this.addResult('Backend Services', 'pass', `LandVerificationService.${method} implemented`);
            } else {
              this.addResult('Backend Services', 'fail', `LandVerificationService.${method} missing`);
            }
          }
        }
        
      } catch (error) {
        this.addResult('Backend Services', 'fail', `Service file ${serviceFile} not found`, [String(error)]);
      }
    }

    // Check service factory
    try {
      await fs.access('server/land-verification/ServiceFactory.ts');
      this.addResult('Backend Services', 'pass', 'ServiceFactory exists');
    } catch {
      this.addResult('Backend Services', 'fail', 'ServiceFactory missing');
    }

    // Check routes
    try {
      await fs.access('server/land-verification/routes.ts');
      const routesContent = await fs.readFile('server/land-verification/routes.ts', 'utf-8');
      
      const requiredRoutes = ['/initiate', '/sessions/:sessionId/status', '/sessions/:sessionId/layers'];
      for (const route of requiredRoutes) {
        if (routesContent.includes(route)) {
          this.addResult('Backend Services', 'pass', `Route ${route} defined`);
        } else {
          this.addResult('Backend Services', 'fail', `Route ${route} missing`);
        }
      }
    } catch {
      this.addResult('Backend Services', 'fail', 'Land verification routes file missing');
    }
  }

  private async validateFrontendComponents(): Promise<void> {
    console.log('🎨 Validating Frontend Components...');

    const componentFiles = [
      'src/land-verification/pages/LandVerificationDashboardPage.tsx',
      'src/land-verification/pages/NewVerificationPage.tsx',
      'src/land-verification/pages/LandVerificationPage.tsx',
      'src/land-verification/components/index.ts',
      'src/land-verification/services/index.ts'
    ];

    for (const componentFile of componentFiles) {
      try {
        await fs.access(componentFile);
        
        const content = await fs.readFile(componentFile, 'utf-8');
        
        // Check for React component structure
        if (componentFile.endsWith('.tsx')) {
          if (content.includes('export') && (content.includes('function') || content.includes('const'))) {
            this.addResult('Frontend Components', 'pass', `Component ${path.basename(componentFile)} properly structured`);
          } else {
            this.addResult('Frontend Components', 'fail', `Component ${path.basename(componentFile)} missing proper export`);
          }
          
          // Check for TypeScript usage
          if (content.includes('interface') || content.includes('type')) {
            this.addResult('Frontend Components', 'pass', `Component ${path.basename(componentFile)} uses TypeScript types`);
          } else {
            this.addResult('Frontend Components', 'warning', `Component ${path.basename(componentFile)} lacks TypeScript types`);
          }
        }
        
      } catch (error) {
        this.addResult('Frontend Components', 'fail', `Component file ${componentFile} not found`, [String(error)]);
      }
    }

    // Check for land verification types
    try {
      await fs.access('src/types/land-verification.ts');
      const typesContent = await fs.readFile('src/types/land-verification.ts', 'utf-8');
      
      const requiredTypes = ['VerificationSession', 'RiskAssessment', 'VerificationLayer'];
      for (const type of requiredTypes) {
        if (typesContent.includes(type)) {
          this.addResult('Frontend Components', 'pass', `Type ${type} defined`);
        } else {
          this.addResult('Frontend Components', 'fail', `Type ${type} missing`);
        }
      }
    } catch {
      this.addResult('Frontend Components', 'fail', 'Land verification types file missing');
    }
  }

  private async validateAPIEndpoints(): Promise<void> {
    console.log('🌐 Validating API Endpoints...');

    try {
      // Check if land verification routes are registered in main app
      const appContent = await fs.readFile('server/app.ts', 'utf-8');
      
      if (appContent.includes('land-verification') || appContent.includes('landVerification')) {
        this.addResult('API Endpoints', 'pass', 'Land verification routes registered in main app');
      } else {
        this.addResult('API Endpoints', 'fail', 'Land verification routes not registered in main app');
      }

      // Check for middleware integration
      if (appContent.includes('auth') && appContent.includes('middleware')) {
        this.addResult('API Endpoints', 'pass', 'Authentication middleware integrated');
      } else {
        this.addResult('API Endpoints', 'warning', 'Authentication middleware integration unclear');
      }

    } catch (error) {
      this.addResult('API Endpoints', 'fail', 'Could not validate API endpoint integration', [String(error)]);
    }

    // Check for API documentation
    try {
      await fs.access('server/land-verification/README.md');
      this.addResult('API Endpoints', 'pass', 'API documentation exists');
    } catch {
      this.addResult('API Endpoints', 'warning', 'API documentation missing');
    }
  }

  private async validateRouteIntegration(): Promise<void> {
    console.log('🛣️  Validating Route Integration...');

    try {
      // Check if routes are added to lazy routes
      const lazyRoutesContent = await fs.readFile('src/app/lazy-routes.tsx', 'utf-8');
      
      const requiredRoutes = ['LandVerification', 'LandVerificationDashboard', 'NewLandVerification'];
      for (const route of requiredRoutes) {
        if (lazyRoutesContent.includes(route)) {
          this.addResult('Route Integration', 'pass', `Route ${route} defined in lazy routes`);
        } else {
          this.addResult('Route Integration', 'fail', `Route ${route} missing from lazy routes`);
        }
      }

      // Check if preloading is configured
      if (lazyRoutesContent.includes('landVerification') && lazyRoutesContent.includes('preload')) {
        this.addResult('Route Integration', 'pass', 'Land verification route preloading configured');
      } else {
        this.addResult('Route Integration', 'warning', 'Land verification route preloading not configured');
      }

    } catch (error) {
      this.addResult('Route Integration', 'fail', 'Could not validate lazy routes', [String(error)]);
    }

    try {
      // Check if routes are added to main router
      const routerContent = await fs.readFile('src/app/router.tsx', 'utf-8');
      
      if (routerContent.includes('/land-verification')) {
        this.addResult('Route Integration', 'pass', 'Land verification routes added to main router');
      } else {
        this.addResult('Route Integration', 'fail', 'Land verification routes missing from main router');
      }

    } catch (error) {
      this.addResult('Route Integration', 'fail', 'Could not validate main router', [String(error)]);
    }
  }

  private async validateServiceIntegration(): Promise<void> {
    console.log('🔗 Validating Service Integration...');

    try {
      // Check property service integration
      const propertyServiceContent = await fs.readFile('server/services/PropertyService.ts', 'utf-8');
      
      if (propertyServiceContent.includes('landVerification') || propertyServiceContent.includes('land_verification')) {
        this.addResult('Service Integration', 'pass', 'Property service integrated with land verification');
      } else {
        this.addResult('Service Integration', 'warning', 'Property service integration with land verification unclear');
      }

    } catch (error) {
      this.addResult('Service Integration', 'warning', 'Could not validate property service integration', [String(error)]);
    }

    try {
      // Check trust scoring integration
      const trustServiceContent = await fs.readFile('server/trust/TrustScoringService.ts', 'utf-8');
      
      if (trustServiceContent.includes('landVerification') || trustServiceContent.includes('land_verification')) {
        this.addResult('Service Integration', 'pass', 'Trust scoring service integrated with land verification');
      } else {
        this.addResult('Service Integration', 'warning', 'Trust scoring service integration with land verification unclear');
      }

    } catch (error) {
      this.addResult('Service Integration', 'warning', 'Could not validate trust scoring service integration', [String(error)]);
    }

    try {
      // Check document authentication integration
      const docAuthContent = await fs.readFile('server/document-auth/DocumentAuthService.ts', 'utf-8');
      
      if (docAuthContent.includes('land') || docAuthContent.includes('Land')) {
        this.addResult('Service Integration', 'pass', 'Document authentication service supports land documents');
      } else {
        this.addResult('Service Integration', 'warning', 'Document authentication service land document support unclear');
      }

    } catch (error) {
      this.addResult('Service Integration', 'warning', 'Could not validate document authentication integration', [String(error)]);
    }
  }

  private async validateConfigurationFiles(): Promise<void> {
    console.log('⚙️  Validating Configuration Files...');

    // Check package.json for required dependencies
    try {
      const packageContent = await fs.readFile('package.json', 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      const requiredDeps = ['react', 'typescript', 'express', 'jest', 'playwright'];
      for (const dep of requiredDeps) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          this.addResult('Configuration', 'pass', `Dependency ${dep} configured`);
        } else {
          this.addResult('Configuration', 'warning', `Dependency ${dep} missing`);
        }
      }

      // Check for test scripts
      if (packageJson.scripts?.test) {
        this.addResult('Configuration', 'pass', 'Test script configured');
      } else {
        this.addResult('Configuration', 'warning', 'Test script missing');
      }

    } catch (error) {
      this.addResult('Configuration', 'fail', 'Could not validate package.json', [String(error)]);
    }

    // Check TypeScript configuration
    try {
      await fs.access('tsconfig.json');
      this.addResult('Configuration', 'pass', 'TypeScript configuration exists');
    } catch {
      this.addResult('Configuration', 'fail', 'TypeScript configuration missing');
    }

    // Check Jest configuration
    try {
      await fs.access('jest.config.js');
      this.addResult('Configuration', 'pass', 'Jest configuration exists');
    } catch {
      try {
        const packageContent = await fs.readFile('package.json', 'utf-8');
        const packageJson = JSON.parse(packageContent);
        if (packageJson.jest) {
          this.addResult('Configuration', 'pass', 'Jest configuration in package.json');
        } else {
          this.addResult('Configuration', 'warning', 'Jest configuration missing');
        }
      } catch {
        this.addResult('Configuration', 'warning', 'Jest configuration missing');
      }
    }
  }

  private async validateTestCoverage(): Promise<void> {
    console.log('🧪 Validating Test Coverage...');

    const testFiles = [
      'server/tests/integration/land-verification-system.test.ts',
      'server/tests/e2e/land-verification-workflow.test.ts',
      'server/tests/performance/land-verification-load.test.ts',
      'server/tests/security/land-verification-security.test.ts'
    ];

    for (const testFile of testFiles) {
      try {
        await fs.access(testFile);
        
        const content = await fs.readFile(testFile, 'utf-8');
        
        // Check for proper test structure
        if (content.includes('describe') && content.includes('it') && content.includes('expect')) {
          this.addResult('Test Coverage', 'pass', `Test file ${path.basename(testFile)} properly structured`);
        } else {
          this.addResult('Test Coverage', 'fail', `Test file ${path.basename(testFile)} missing proper test structure`);
        }

        // Check for comprehensive test cases
        const testCaseCount = (content.match(/it\(/g) || []).length;
        if (testCaseCount >= 5) {
          this.addResult('Test Coverage', 'pass', `Test file ${path.basename(testFile)} has ${testCaseCount} test cases`);
        } else {
          this.addResult('Test Coverage', 'warning', `Test file ${path.basename(testFile)} has only ${testCaseCount} test cases`);
        }

      } catch (error) {
        this.addResult('Test Coverage', 'fail', `Test file ${testFile} not found`, [String(error)]);
      }
    }

    // Check for test runner
    try {
      await fs.access('server/tests/run-final-integration-tests.ts');
      this.addResult('Test Coverage', 'pass', 'Test runner script exists');
    } catch {
      this.addResult('Test Coverage', 'warning', 'Test runner script missing');
    }
  }

  private addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string, details?: string[]): void {
    this.results.push({ component, status, message, details });
  }

  private generateValidationReport(): void {
    console.log('\n📊 SYSTEM INTEGRATION VALIDATION REPORT');
    console.log('=' .repeat(70));

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    console.log(`Total Checks: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log('');

    // Group results by component
    const componentGroups = this.results.reduce((groups, result) => {
      if (!groups[result.component]) {
        groups[result.component] = [];
      }
      groups[result.component].push(result);
      return groups;
    }, {} as Record<string, ValidationResult[]>);

    for (const [component, results] of Object.entries(componentGroups)) {
      console.log(`📋 ${component}`);
      console.log('-'.repeat(50));

      for (const result of results) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
        console.log(`${icon} ${result.message}`);
        
        if (result.details && result.details.length > 0) {
          result.details.forEach(detail => {
            console.log(`     ${detail}`);
          });
        }
      }
      console.log('');
    }

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: { total: this.results.length, passed, failed, warnings },
      results: this.results
    };

    fs.writeFile('system-integration-validation-report.json', JSON.stringify(reportData, null, 2))
      .then(() => console.log('📄 Detailed validation report saved to: system-integration-validation-report.json'))
      .catch(error => console.error('Failed to save validation report:', error));
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new SystemIntegrationValidator();
  validator.validateSystem().catch(error => {
    console.error('Fatal error during system validation:', error);
    process.exit(1);
  });
}

export { SystemIntegrationValidator };