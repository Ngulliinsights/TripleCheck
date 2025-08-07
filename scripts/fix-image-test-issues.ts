#!/usr/bin/env tsx

/**
 * Quick fix script for common image component test issues
 * Addresses frequent test failures and provides diagnostic information
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';

interface TestIssue {
  type: 'mock' | 'async' | 'memory' | 'performance' | 'accessibility';
  description: string;
  fix: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ImageTestFixer {
  private issues: TestIssue[] = [];

  async diagnoseAndFix(): Promise<void> {
    console.log('🔧 Image Component Test Fixer\n');
    console.log('=' .repeat(50));

    await this.checkTestEnvironment();
    await this.checkMockSetup();
    await this.checkAsyncPatterns();
    await this.checkMemoryUsage();
    await this.checkPerformanceThresholds();
    
    this.displayResults();
    await this.applyFixes();
  }

  private async checkTestEnvironment(): Promise<void> {
    console.log('\n🔍 Checking test environment...');

    // Check if setup files exist
    const setupFiles = [
      'src/shared/test-utils/setup.ts',
      'src/shared/components/images/__tests__/setup.ts',
    ];

    for (const file of setupFiles) {
      if (!existsSync(file)) {
        this.issues.push({
          type: 'mock',
          description: `Missing setup file: ${file}`,
          fix: `Create ${file} with proper mock configurations`,
          severity: 'critical',
        });
      }
    }

    // Check vitest configuration
    if (!existsSync('vitest.workspace.ts')) {
      this.issues.push({
        type: 'mock',
        description: 'Missing vitest workspace configuration',
        fix: 'Create vitest.workspace.ts with proper test configuration',
        severity: 'high',
      });
    }

    console.log('✅ Test environment check complete');
  }

  private async checkMockSetup(): Promise<void> {
    console.log('\n🎭 Checking mock setup...');

    const setupFile = 'src/shared/components/images/__tests__/setup.ts';
    if (existsSync(setupFile)) {
      const content = readFileSync(setupFile, 'utf-8');

      // Check for IntersectionObserver mock
      if (!content.includes('IntersectionObserver')) {
        this.issues.push({
          type: 'mock',
          description: 'Missing IntersectionObserver mock',
          fix: 'Add proper IntersectionObserver mock to setup.ts',
          severity: 'high',
        });
      }

      // Check for Image constructor mock
      if (!content.includes('global.Image')) {
        this.issues.push({
          type: 'mock',
          description: 'Missing Image constructor mock',
          fix: 'Add Image constructor mock to setup.ts',
          severity: 'high',
        });
      }

      // Check for Canvas API mock
      if (!content.includes('createElement')) {
        this.issues.push({
          type: 'mock',
          description: 'Missing Canvas API mock',
          fix: 'Add Canvas and Context2D mocks to setup.ts',
          severity: 'medium',
        });
      }
    }

    console.log('✅ Mock setup check complete');
  }

  private async checkAsyncPatterns(): Promise<void> {
    console.log('\n⏱️ Checking async patterns...');

    const testFiles = [
      'src/shared/components/images/__tests__/ImageVault.test.tsx',
      'src/shared/components/images/__tests__/ImageEngine.test.tsx',
      'src/shared/components/images/__tests__/ImageGallery.test.tsx',
    ];

    for (const file of testFiles) {
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf-8');

        // Check for proper waitFor usage
        if (content.includes('await') && !content.includes('waitFor')) {
          this.issues.push({
            type: 'async',
            description: `${file} may have async issues without waitFor`,
            fix: 'Use waitFor() for async operations in tests',
            severity: 'medium',
          });
        }

        // Check for proper timeout handling
        if (content.includes('setTimeout') && !content.includes('timeout:')) {
          this.issues.push({
            type: 'async',
            description: `${file} may need timeout configuration`,
            fix: 'Add timeout options to waitFor calls',
            severity: 'low',
          });
        }
      }
    }

    console.log('✅ Async patterns check complete');
  }

  private async checkMemoryUsage(): Promise<void> {
    console.log('\n🧠 Checking memory usage patterns...');

    const testFiles = [
      'src/shared/components/images/__tests__/performance.test.tsx',
      'src/shared/components/images/__tests__/integration.test.tsx',
    ];

    for (const file of testFiles) {
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf-8');

        // Check for cleanup patterns
        if (!content.includes('afterEach') || !content.includes('cleanup')) {
          this.issues.push({
            type: 'memory',
            description: `${file} may have memory leak issues`,
            fix: 'Add proper cleanup in afterEach hooks',
            severity: 'medium',
          });
        }

        // Check for mock reset
        if (!content.includes('vi.clearAllMocks')) {
          this.issues.push({
            type: 'memory',
            description: `${file} may not reset mocks properly`,
            fix: 'Add vi.clearAllMocks() in beforeEach/afterEach',
            severity: 'low',
          });
        }
      }
    }

    console.log('✅ Memory usage check complete');
  }

  private async checkPerformanceThresholds(): Promise<void> {
    console.log('\n⚡ Checking performance thresholds...');

    const perfFile = 'src/shared/components/images/__tests__/performance.test.tsx';
    if (existsSync(perfFile)) {
      const content = readFileSync(perfFile, 'utf-8');

      // Check for reasonable thresholds
      const thresholds = content.match(/toBeLessThan\((\d+)\)/g);
      if (thresholds) {
        thresholds.forEach(threshold => {
          const value = parseInt(threshold.match(/\d+/)?.[0] || '0');
          if (value < 50) {
            this.issues.push({
              type: 'performance',
              description: `Performance threshold ${value}ms may be too strict`,
              fix: 'Adjust performance thresholds for CI environment',
              severity: 'low',
            });
          }
        });
      }
    }

    console.log('✅ Performance thresholds check complete');
  }

  private displayResults(): void {
    console.log(`\n${  '=' .repeat(50)}`);
    console.log('📊 Diagnostic Results');
    console.log('=' .repeat(50));

    const critical = this.issues.filter(i => i.severity === 'critical').length;
    const high = this.issues.filter(i => i.severity === 'high').length;
    const medium = this.issues.filter(i => i.severity === 'medium').length;
    const low = this.issues.filter(i => i.severity === 'low').length;

    console.log(`\n📈 Issue Summary:`);
    console.log(`   🔴 Critical: ${critical}`);
    console.log(`   🟠 High: ${high}`);
    console.log(`   🟡 Medium: ${medium}`);
    console.log(`   🟢 Low: ${low}`);
    console.log(`   📊 Total: ${this.issues.length}`);

    if (this.issues.length === 0) {
      console.log('\n🎉 No issues found! Tests should be working properly.');
      return;
    }

    console.log('\n📋 Detailed Issues:');
    this.issues.forEach((issue, index) => {
      const icon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
      }[issue.severity];

      console.log(`\n${icon} Issue ${index + 1}: ${issue.description}`);
      console.log(`   Type: ${issue.type}`);
      console.log(`   Severity: ${issue.severity}`);
      console.log(`   Fix: ${issue.fix}`);
    });
  }

  private async applyFixes(): Promise<void> {
    if (this.issues.length === 0) return;

    console.log('\n🔧 Applying automatic fixes...');

    // Fix IntersectionObserver mock
    const intersectionIssues = this.issues.filter(i => 
      i.description.includes('IntersectionObserver')
    );

    if (intersectionIssues.length > 0) {
      await this.fixIntersectionObserverMock();
    }

    // Fix Image constructor mock
    const imageIssues = this.issues.filter(i => 
      i.description.includes('Image constructor')
    );

    if (imageIssues.length > 0) {
      await this.fixImageConstructorMock();
    }

    // Fix Canvas API mock
    const canvasIssues = this.issues.filter(i => 
      i.description.includes('Canvas API')
    );

    if (canvasIssues.length > 0) {
      await this.fixCanvasMock();
    }

    console.log('✅ Automatic fixes applied');
    console.log('\n💡 Manual fixes may still be required for some issues.');
    console.log('   Please review the detailed issues above and apply fixes as needed.');
  }

  private async fixIntersectionObserverMock(): Promise<void> {
    const setupFile = 'src/shared/components/images/__tests__/setup.ts';
    if (!existsSync(setupFile)) return;

    let content = readFileSync(setupFile, 'utf-8');
    
    if (!content.includes('IntersectionObserver')) {
      const mockCode = `
// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));
`;
      
      // Insert after imports
      const importEnd = content.lastIndexOf('import');
      const nextLine = content.indexOf('\n', importEnd);
      content = content.slice(0, nextLine) + mockCode + content.slice(nextLine);
      
      writeFileSync(setupFile, content);
      console.log('   ✅ Fixed IntersectionObserver mock');
    }
  }

  private async fixImageConstructorMock(): Promise<void> {
    const setupFile = 'src/shared/components/images/__tests__/setup.ts';
    if (!existsSync(setupFile)) return;

    let content = readFileSync(setupFile, 'utf-8');
    
    if (!content.includes('global.Image')) {
      const mockCode = `
// Mock Image constructor
global.Image = vi.fn().mockImplementation(() => ({
  onload: null,
  onerror: null,
  src: '',
  naturalWidth: 0,
  naturalHeight: 0,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));
`;
      
      content += mockCode;
      writeFileSync(setupFile, content);
      console.log('   ✅ Fixed Image constructor mock');
    }
  }

  private async fixCanvasMock(): Promise<void> {
    const setupFile = 'src/shared/components/images/__tests__/setup.ts';
    if (!existsSync(setupFile)) return;

    let content = readFileSync(setupFile, 'utf-8');
    
    if (!content.includes('createElement')) {
      const mockCode = `
// Mock Canvas API
Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return {
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
          getImageData: vi.fn(() => ({
            data: new Uint8ClampedArray([255, 255, 255, 255]),
          })),
        })),
        width: 0,
        height: 0,
      };
    }
    return {};
  }),
});
`;
      
      content += mockCode;
      writeFileSync(setupFile, content);
      console.log('   ✅ Fixed Canvas API mock');
    }
  }
}

async function main(): Promise<void> {
  const fixer = new ImageTestFixer();
  await fixer.diagnoseAndFix();

  console.log('\n🚀 Next Steps:');
  console.log('   1. Run: npm run test:images');
  console.log('   2. If tests still fail, check the detailed issues above');
  console.log('   3. Consider running: npm run validate:image-tests');
  console.log('   4. For performance issues, try: npm run test:images:performance');
}

main().catch((error) => {
  console.error('❌ Fix script failed:', error);
  process.exit(1);
});