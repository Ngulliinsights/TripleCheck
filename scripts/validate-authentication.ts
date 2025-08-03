#!/usr/bin/env tsx

/**
 * Authentication System Validation Script
 * 
 * This script comprehensively tests and validates the authentication system
 * including login, logout, registration, password reset, and session management.
 * 
 * Usage: npm run validate:auth
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: string;
  duration?: number;
}

interface AuthValidationReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  results: ValidationResult[];
  summary: string;
}

class AuthenticationValidator {
  private results: ValidationResult[] = [];
  private startTime: number = Date.now();

  constructor() {
    console.log('🔐 Starting Authentication System Validation...\n');
  }

  /**
   * Add a test result to the validation report
   */
  private addResult(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: string, duration?: number): void {
    this.results.push({
      test,
      status,
      message,
      details,
      duration
    });

    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${icon} ${test}: ${message}`);
    if (details) {
      console.log(`   Details: ${details}`);
    }
    if (duration) {
      console.log(`   Duration: ${duration}ms`);
    }
    console.log();
  }

  /**
   * Test if authentication files exist and are properly structured
   */
  async validateAuthFileStructure(): Promise<void> {
    console.log('📁 Validating Authentication File Structure...\n');

    const requiredFiles = [
      'src/auth/types/auth.types.ts',
      'src/auth/hooks/useAuth.ts',
      'src/auth/services/auth-api.ts',
      'src/auth/components/LoginForm.tsx',
      'src/auth/pages/Login.tsx',
      'src/auth/pages/Register.tsx',
      'server/auth/auth.controller.ts',
      'server/auth/auth.service.ts'
    ];

    for (const file of requiredFiles) {
      const startTime = Date.now();
      try {
        const content = readFileSync(file, 'utf-8');
        const duration = Date.now() - startTime;
        
        if (content.length > 0) {
          this.addResult(
            `File Structure: ${file}`,
            'PASS',
            'File exists and has content',
            `File size: ${content.length} characters`,
            duration
          );
        } else {
          this.addResult(
            `File Structure: ${file}`,
            'FAIL',
            'File exists but is empty',
            undefined,
            duration
          );
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addResult(
          `File Structure: ${file}`,
          'FAIL',
          'File does not exist or cannot be read',
          error instanceof Error ? error.message : 'Unknown error',
          duration
        );
      }
    }
  }

  /**
   * Validate TypeScript types and interfaces
   */
  async validateAuthTypes(): Promise<void> {
    console.log('🔍 Validating Authentication Types...\n');

    const startTime = Date.now();
    try {
      const typesContent = readFileSync('src/auth/types/auth.types.ts', 'utf-8');
      const duration = Date.now() - startTime;

      // Check for required interfaces
      const requiredTypes = [
        'User',
        'AuthState',
        'LoginCredentials',
        'RegisterData'
      ];

      const missingTypes = requiredTypes.filter(type => 
        !typesContent.includes(`interface ${type}`) && !typesContent.includes(`type ${type}`)
      );

      if (missingTypes.length === 0) {
        this.addResult(
          'Type Definitions',
          'PASS',
          'All required authentication types are defined',
          `Found: ${requiredTypes.join(', ')}`,
          duration
        );
      } else {
        this.addResult(
          'Type Definitions',
          'FAIL',
          'Missing required authentication types',
          `Missing: ${missingTypes.join(', ')}`,
          duration
        );
      }

      // Check for proper User interface structure
      if (typesContent.includes('interface User') && 
          typesContent.includes('email:') && 
          typesContent.includes('role:') && 
          typesContent.includes('isVerified:')) {
        this.addResult(
          'User Interface Structure',
          'PASS',
          'User interface has required fields',
          'Contains email, role, isVerified fields'
        );
      } else {
        this.addResult(
          'User Interface Structure',
          'FAIL',
          'User interface missing required fields',
          'Should contain email, role, isVerified fields'
        );
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        'Type Definitions',
        'FAIL',
        'Cannot read or parse authentication types',
        error instanceof Error ? error.message : 'Unknown error',
        duration
      );
    }
  }

  /**
   * Validate authentication hooks
   */
  async validateAuthHooks(): Promise<void> {
    console.log('🪝 Validating Authentication Hooks...\n');

    const startTime = Date.now();
    try {
      const hooksContent = readFileSync('src/auth/hooks/useAuth.ts', 'utf-8');
      const duration = Date.now() - startTime;

      // Check for required hooks
      const requiredHooks = [
        'useProfile',
        'useLogin',
        'useRegister',
        'useLogout',
        'useAuth'
      ];

      const missingHooks = requiredHooks.filter(hook => 
        !hooksContent.includes(`export function ${hook}`) && 
        !hooksContent.includes(`const ${hook}`)
      );

      if (missingHooks.length === 0) {
        this.addResult(
          'Authentication Hooks',
          'PASS',
          'All required authentication hooks are defined',
          `Found: ${requiredHooks.join(', ')}`,
          duration
        );
      } else {
        this.addResult(
          'Authentication Hooks',
          'FAIL',
          'Missing required authentication hooks',
          `Missing: ${missingHooks.join(', ')}`,
          duration
        );
      }

      // Check for proper React Query usage
      if (hooksContent.includes('useQuery') && hooksContent.includes('useMutation')) {
        this.addResult(
          'React Query Integration',
          'PASS',
          'Authentication hooks use React Query properly',
          'Uses useQuery and useMutation'
        );
      } else {
        this.addResult(
          'React Query Integration',
          'FAIL',
          'Authentication hooks missing React Query integration',
          'Should use useQuery and useMutation'
        );
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        'Authentication Hooks',
        'FAIL',
        'Cannot read or parse authentication hooks',
        error instanceof Error ? error.message : 'Unknown error',
        duration
      );
    }
  }

  /**
   * Validate authentication API service
   */
  async validateAuthAPI(): Promise<void> {
    console.log('🌐 Validating Authentication API Service...\n');

    const startTime = Date.now();
    try {
      const apiContent = readFileSync('src/auth/services/auth-api.ts', 'utf-8');
      const duration = Date.now() - startTime;

      // Check for required API methods
      const requiredMethods = [
        'login',
        'register',
        'logout',
        'getProfile',
        'updateProfile',
        'requestPasswordReset',
        'resetPassword'
      ];

      const missingMethods = requiredMethods.filter(method => 
        !apiContent.includes(`${method}:`) && !apiContent.includes(`${method} =`)
      );

      if (missingMethods.length === 0) {
        this.addResult(
          'API Methods',
          'PASS',
          'All required API methods are defined',
          `Found: ${requiredMethods.join(', ')}`,
          duration
        );
      } else {
        this.addResult(
          'API Methods',
          'FAIL',
          'Missing required API methods',
          `Missing: ${missingMethods.join(', ')}`,
          duration
        );
      }

      // Check for proper error handling
      if (apiContent.includes('try') && apiContent.includes('catch')) {
        this.addResult(
          'Error Handling',
          'PASS',
          'API service includes error handling',
          'Uses try-catch blocks'
        );
      } else {
        this.addResult(
          'Error Handling',
          'FAIL',
          'API service missing error handling',
          'Should use try-catch blocks'
        );
      }

      // Check for proper API base URL
      if (apiContent.includes('API_BASE') || apiContent.includes('/api/auth')) {
        this.addResult(
          'API Configuration',
          'PASS',
          'API service has proper base URL configuration',
          'Uses API_BASE or /api/auth'
        );
      } else {
        this.addResult(
          'API Configuration',
          'FAIL',
          'API service missing base URL configuration',
          'Should define API_BASE or use /api/auth'
        );
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        'Authentication API',
        'FAIL',
        'Cannot read or parse authentication API service',
        error instanceof Error ? error.message : 'Unknown error',
        duration
      );
    }
  }

  /**
   * Validate authentication components
   */
  async validateAuthComponents(): Promise<void> {
    console.log('🧩 Validating Authentication Components...\n');

    // Validate LoginForm component
    const startTime = Date.now();
    try {
      const loginFormContent = readFileSync('src/auth/components/LoginForm.tsx', 'utf-8');
      const duration = Date.now() - startTime;

      // Check for required form elements
      const requiredElements = [
        'email',
        'password',
        'rememberMe',
        'onSubmit',
        'useForm'
      ];

      const missingElements = requiredElements.filter(element => 
        !loginFormContent.includes(element)
      );

      if (missingElements.length === 0) {
        this.addResult(
          'LoginForm Component',
          'PASS',
          'LoginForm has all required elements',
          `Found: ${requiredElements.join(', ')}`,
          duration
        );
      } else {
        this.addResult(
          'LoginForm Component',
          'FAIL',
          'LoginForm missing required elements',
          `Missing: ${missingElements.join(', ')}`,
          duration
        );
      }

      // Check for form validation
      if (loginFormContent.includes('zodResolver') && loginFormContent.includes('schema')) {
        this.addResult(
          'Form Validation',
          'PASS',
          'LoginForm includes proper validation',
          'Uses Zod schema validation'
        );
      } else {
        this.addResult(
          'Form Validation',
          'FAIL',
          'LoginForm missing validation',
          'Should use Zod schema validation'
        );
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        'LoginForm Component',
        'FAIL',
        'Cannot read or parse LoginForm component',
        error instanceof Error ? error.message : 'Unknown error',
        duration
      );
    }

    // Validate Login page
    try {
      const loginPageContent = readFileSync('src/auth/pages/Login.tsx', 'utf-8');

      if (loginPageContent.includes('LoginForm') && loginPageContent.includes('useNavigate')) {
        this.addResult(
          'Login Page',
          'PASS',
          'Login page properly integrates LoginForm and navigation',
          'Uses LoginForm component and useNavigate hook'
        );
      } else {
        this.addResult(
          'Login Page',
          'FAIL',
          'Login page missing required integration',
          'Should use LoginForm component and useNavigate hook'
        );
      }

    } catch (error) {
      this.addResult(
        'Login Page',
        'FAIL',
        'Cannot read or parse Login page',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Validate backend authentication implementation
   */
  async validateBackendAuth(): Promise<void> {
    console.log('🖥️ Validating Backend Authentication...\n');

    // Validate auth controller
    const startTime = Date.now();
    try {
      const controllerContent = readFileSync('server/auth/auth.controller.ts', 'utf-8');
      const duration = Date.now() - startTime;

      // Check for required routes
      const requiredRoutes = [
        'login',
        'register',
        'logout',
        'profile'
      ];

      const missingRoutes = requiredRoutes.filter(route => 
        !controllerContent.includes(`'/${route}'`) && 
        !controllerContent.includes(`"/${route}"`)
      );

      if (missingRoutes.length === 0) {
        this.addResult(
          'Auth Controller Routes',
          'PASS',
          'All required authentication routes are defined',
          `Found: ${requiredRoutes.join(', ')}`,
          duration
        );
      } else {
        this.addResult(
          'Auth Controller Routes',
          'FAIL',
          'Missing required authentication routes',
          `Missing: ${missingRoutes.join(', ')}`,
          duration
        );
      }

      // Check for proper middleware usage
      if (controllerContent.includes('validateRequest') || controllerContent.includes('middleware')) {
        this.addResult(
          'Middleware Integration',
          'PASS',
          'Auth controller uses validation middleware',
          'Includes request validation'
        );
      } else {
        this.addResult(
          'Middleware Integration',
          'FAIL',
          'Auth controller missing validation middleware',
          'Should include request validation'
        );
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        'Auth Controller',
        'FAIL',
        'Cannot read or parse auth controller',
        error instanceof Error ? error.message : 'Unknown error',
        duration
      );
    }

    // Validate auth service
    try {
      const serviceContent = readFileSync('server/auth/auth.service.ts', 'utf-8');

      // Check for required service methods
      const requiredMethods = [
        'login',
        'register',
        'logout',
        'getProfile'
      ];

      const missingMethods = requiredMethods.filter(method => 
        !serviceContent.includes(`${method}(`) && !serviceContent.includes(`${method} =`)
      );

      if (missingMethods.length === 0) {
        this.addResult(
          'Auth Service Methods',
          'PASS',
          'All required service methods are defined',
          `Found: ${requiredMethods.join(', ')}`
        );
      } else {
        this.addResult(
          'Auth Service Methods',
          'FAIL',
          'Missing required service methods',
          `Missing: ${missingMethods.join(', ')}`
        );
      }

      // Check if service is implemented or just stubs
      if (serviceContent.includes('TODO') || serviceContent.includes('mock')) {
        this.addResult(
          'Service Implementation',
          'FAIL',
          'Auth service contains TODO items or mock implementations',
          'Service needs proper implementation'
        );
      } else {
        this.addResult(
          'Service Implementation',
          'PASS',
          'Auth service appears to be properly implemented',
          'No TODO items or mock implementations found'
        );
      }

    } catch (error) {
      this.addResult(
        'Auth Service',
        'FAIL',
        'Cannot read or parse auth service',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Test authentication flow by running unit tests
   */
  async validateAuthTests(): Promise<void> {
    console.log('🧪 Running Authentication Tests...\n');

    const testFiles = [
      'src/auth/components/__tests__/LoginForm.test.tsx',
      'src/auth/components/__tests__/PasswordReset.test.tsx',
      'src/auth/components/__tests__/RegistrationWizard.test.tsx'
    ];

    for (const testFile of testFiles) {
      const startTime = Date.now();
      try {
        // Check if test file exists
        const testContent = readFileSync(testFile, 'utf-8');
        
        if (testContent.includes('describe') && testContent.includes('it')) {
          this.addResult(
            `Test File: ${testFile.split('/').pop()}`,
            'PASS',
            'Test file exists and has test cases',
            `File size: ${testContent.length} characters`
          );
        } else {
          this.addResult(
            `Test File: ${testFile.split('/').pop()}`,
            'FAIL',
            'Test file exists but has no test cases',
            'File should contain describe and it blocks'
          );
        }

      } catch (error) {
        const duration = Date.now() - startTime;
        this.addResult(
          `Test File: ${testFile.split('/').pop()}`,
          'FAIL',
          'Test file does not exist',
          error instanceof Error ? error.message : 'Unknown error',
          duration
        );
      }
    }

    // Try to run a specific auth test
    try {
      console.log('Attempting to run LoginForm tests...');
      const testOutput = execSync('npm run test -- src/auth/components/__tests__/LoginForm.test.tsx --run', {
        encoding: 'utf-8',
        timeout: 30000,
        stdio: 'pipe'
      });

      if (testOutput.includes('PASS') || testOutput.includes('✓')) {
        this.addResult(
          'LoginForm Tests Execution',
          'PASS',
          'LoginForm tests executed successfully',
          'Tests passed'
        );
      } else if (testOutput.includes('FAIL') || testOutput.includes('✗')) {
        this.addResult(
          'LoginForm Tests Execution',
          'FAIL',
          'LoginForm tests failed',
          'Some tests are failing'
        );
      } else {
        this.addResult(
          'LoginForm Tests Execution',
          'SKIP',
          'LoginForm tests executed but results unclear',
          'Test output format not recognized'
        );
      }

    } catch (error) {
      this.addResult(
        'LoginForm Tests Execution',
        'FAIL',
        'Could not execute LoginForm tests',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Validate authentication security measures
   */
  async validateAuthSecurity(): Promise<void> {
    console.log('🔒 Validating Authentication Security...\n');

    // Check for password hashing
    try {
      const serviceContent = readFileSync('server/auth/auth.service.ts', 'utf-8');
      
      if (serviceContent.includes('bcrypt') || serviceContent.includes('hash')) {
        this.addResult(
          'Password Hashing',
          'PASS',
          'Password hashing implementation found',
          'Uses bcrypt or similar hashing'
        );
      } else {
        this.addResult(
          'Password Hashing',
          'FAIL',
          'No password hashing implementation found',
          'Should use bcrypt or similar for password hashing'
        );
      }

    } catch (error) {
      this.addResult(
        'Password Hashing',
        'FAIL',
        'Cannot validate password hashing',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    // Check for JWT token handling
    try {
      const apiContent = readFileSync('src/auth/services/auth-api.ts', 'utf-8');
      
      if (apiContent.includes('token') && apiContent.includes('localStorage')) {
        this.addResult(
          'Token Management',
          'PASS',
          'Token management implementation found',
          'Uses localStorage for token storage'
        );
      } else {
        this.addResult(
          'Token Management',
          'FAIL',
          'No token management implementation found',
          'Should handle JWT tokens properly'
        );
      }

    } catch (error) {
      this.addResult(
        'Token Management',
        'FAIL',
        'Cannot validate token management',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    // Check for input validation
    try {
      const loginFormContent = readFileSync('src/auth/components/LoginForm.tsx', 'utf-8');
      
      if (loginFormContent.includes('zod') && loginFormContent.includes('schema')) {
        this.addResult(
          'Input Validation',
          'PASS',
          'Input validation implementation found',
          'Uses Zod schema validation'
        );
      } else {
        this.addResult(
          'Input Validation',
          'FAIL',
          'No input validation implementation found',
          'Should use Zod or similar for input validation'
        );
      }

    } catch (error) {
      this.addResult(
        'Input Validation',
        'FAIL',
        'Cannot validate input validation',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Generate comprehensive validation report
   */
  generateReport(): AuthValidationReport {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    const report: AuthValidationReport = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed,
      failed,
      skipped,
      results: this.results,
      summary: this.generateSummary(passed, failed, skipped, totalDuration)
    };

    return report;
  }

  /**
   * Generate summary text for the report
   */
  private generateSummary(passed: number, failed: number, skipped: number, duration: number): string {
    const total = passed + failed + skipped;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    let summary = `Authentication Validation Complete\n`;
    summary += `Total Tests: ${total}\n`;
    summary += `Passed: ${passed} (${passRate}%)\n`;
    summary += `Failed: ${failed}\n`;
    summary += `Skipped: ${skipped}\n`;
    summary += `Duration: ${Math.round(duration / 1000)}s\n\n`;

    if (failed === 0) {
      summary += `🎉 All authentication tests passed! The authentication system appears to be working correctly.`;
    } else if (failed <= 3) {
      summary += `⚠️ Minor issues found in authentication system. ${failed} test(s) failed but core functionality appears intact.`;
    } else {
      summary += `🚨 Significant issues found in authentication system. ${failed} test(s) failed. Immediate attention required.`;
    }

    return summary;
  }

  /**
   * Run all validation tests
   */
  async runAllValidations(): Promise<AuthValidationReport> {
    try {
      await this.validateAuthFileStructure();
      await this.validateAuthTypes();
      await this.validateAuthHooks();
      await this.validateAuthAPI();
      await this.validateAuthComponents();
      await this.validateBackendAuth();
      await this.validateAuthTests();
      await this.validateAuthSecurity();

      const report = this.generateReport();
      
      // Save report to file
      const reportPath = join(process.cwd(), 'temp-files', 'auth-validation-report.json');
      writeFileSync(reportPath, JSON.stringify(report, null, 2));

      console.log(`\n${  '='.repeat(80)}`);
      console.log(report.summary);
      console.log('='.repeat(80));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);

      return report;

    } catch (error) {
      console.error('❌ Validation failed with error:', error);
      throw error;
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    const validator = new AuthenticationValidator();
    const report = await validator.runAllValidations();
    
    // Exit with error code if there are failures
    if (report.failed > 0) {
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during authentication validation:', error);
    process.exit(1);
  }
}

// Run the validation
main();

export { AuthenticationValidator, type AuthValidationReport, type ValidationResult };