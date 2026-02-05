#!/usr/bin/env tsx

/**
 * Validation script for image component tests
 * Ensures all test files are properly structured and can be imported
 */

import { existsSync, readFileSync } from 'fs';
import path from './cleanup-redundancies';

const TEST_FILES = [
  'src/shared/components/images/__tests__/ImageVault.test.tsx',
  'src/shared/components/images/__tests__/ImageEngine.test.tsx',
  'src/shared/components/images/__tests__/ImageGallery.test.tsx',
  'src/shared/components/images/__tests__/integration.test.tsx',
  'src/shared/components/images/__tests__/performance.test.tsx',
  'src/shared/components/images/__tests__/setup.ts',
];

const COMPONENT_FILES = [
  'src/shared/components/images/ImageVault.tsx',
  'src/shared/components/images/ImageEngine.tsx',
  'src/shared/components/images/ImageGallery.tsx',
];

interface ValidationResult {
  file: string;
  exists: boolean;
  hasDescribeBlocks: boolean;
  hasTestCases: boolean;
  hasImports: boolean;
  hasProperStructure: boolean;
  issues: string[];
}

class TestValidator {
  private results: ValidationResult[] = [];

  async validateAllTests(): Promise<void> {
    console.log('🔍 Validating Image Component Tests\n');
    console.log('=' .repeat(60));

    // Check if component files exist
    console.log('\n📁 Checking component files...');
    for (const file of COMPONENT_FILES) {
      if (!existsSync(file)) {
        console.error(`❌ Missing component file: ${file}`);
        process.exit(1);
      } else {
        console.log(`✅ ${path.basename(file)}`);
      }
    }

    // Validate test files
    console.log('\n🧪 Validating test files...');
    for (const testFile of TEST_FILES) {
      await this.validateTestFile(testFile);
    }

    this.displayResults();
  }

  private async validateTestFile(filePath: string): Promise<void> {
    const fileName = path.basename(filePath);
    const result: ValidationResult = {
      file: fileName,
      exists: false,
      hasDescribeBlocks: false,
      hasTestCases: false,
      hasImports: false,
      hasProperStructure: false,
      issues: [],
    };

    // Check if file exists
    if (!existsSync(filePath)) {
      result.issues.push('File does not exist');
      this.results.push(result);
      return;
    }
    result.exists = true;

    try {
      const content = readFileSync(filePath, 'utf-8');

      // Check for imports
      if (content.includes('import') && content.includes('from')) {
        result.hasImports = true;
      } else {
        result.issues.push('Missing import statements');
      }

      // Check for describe blocks
      if (content.includes('describe(')) {
        result.hasDescribeBlocks = true;
      } else {
        result.issues.push('Missing describe blocks');
      }

      // Check for test cases
      if (content.includes('it(') || content.includes('test(')) {
        result.hasTestCases = true;
      } else {
        result.issues.push('Missing test cases');
      }

      // Check for proper test structure
      const hasVitest = content.includes('vitest') || content.includes('@testing-library');
      const hasExpect = content.includes('expect(');
      const hasBeforeEach = content.includes('beforeEach') || content.includes('beforeAll');
      
      if (hasVitest && hasExpect) {
        result.hasProperStructure = true;
      } else {
        if (!hasVitest) result.issues.push('Missing testing framework imports');
        if (!hasExpect) result.issues.push('Missing expect assertions');
      }

      // File-specific validations
      if (fileName.includes('ImageVault')) {
        this.validateImageVaultTest(content, result);
      } else if (fileName.includes('ImageEngine')) {
        this.validateImageEngineTest(content, result);
      } else if (fileName.includes('ImageGallery')) {
        this.validateImageGalleryTest(content, result);
      } else if (fileName.includes('integration')) {
        this.validateIntegrationTest(content, result);
      } else if (fileName.includes('performance')) {
        this.validatePerformanceTest(content, result);
      }

    } catch (error) {
      result.issues.push(`Error reading file: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.results.push(result);
  }

  private validateImageVaultTest(content: string, result: ValidationResult): void {
    const requiredTests = [
      'drag and drop',
      'file upload',
      'processing pipeline',
      'security scanning',
      'AI metadata',
      'statistics',
    ];

    for (const test of requiredTests) {
      if (!content.toLowerCase().includes(test.toLowerCase())) {
        result.issues.push(`Missing test for: ${test}`);
      }
    }

    if (!content.includes('EnterpriseImageVault')) {
      result.issues.push('Missing import of EnterpriseImageVault component');
    }
  }

  private validateImageEngineTest(content: string, result: ValidationResult): void {
    const requiredTests = [
      'lazy loading',
      'intersection observer',
      'image loading',
      'error handling',
      'land placeholder',
      'responsive images',
    ];

    for (const test of requiredTests) {
      if (!content.toLowerCase().includes(test.toLowerCase())) {
        result.issues.push(`Missing test for: ${test}`);
      }
    }

    if (!content.includes('ImageEngine')) {
      result.issues.push('Missing import of ImageEngine component');
    }
  }

  private validateImageGalleryTest(content: string, result: ValidationResult): void {
    const requiredTests = [
      'search functionality',
      'filtering',
      'sorting',
      'lightbox',
      'keyboard navigation',
      'view modes',
    ];

    for (const test of requiredTests) {
      if (!content.toLowerCase().includes(test.toLowerCase())) {
        result.issues.push(`Missing test for: ${test}`);
      }
    }

    if (!content.includes('EnhancedImageGallery')) {
      result.issues.push('Missing import of EnhancedImageGallery component');
    }
  }

  private validateIntegrationTest(content: string, result: ValidationResult): void {
    const requiredTests = [
      'cross-component',
      'integration',
      'workflow',
      'error recovery',
      'accessibility',
    ];

    for (const test of requiredTests) {
      if (!content.toLowerCase().includes(test.toLowerCase())) {
        result.issues.push(`Missing integration test for: ${test}`);
      }
    }
  }

  private validatePerformanceTest(content: string, result: ValidationResult): void {
    const requiredTests = [
      'performance',
      'large dataset',
      'memory',
      'rendering',
      'network',
    ];

    for (const test of requiredTests) {
      if (!content.toLowerCase().includes(test.toLowerCase())) {
        result.issues.push(`Missing performance test for: ${test}`);
      }
    }

    if (!content.includes('Date.now()') && !content.includes('performance.now()')) {
      result.issues.push('Missing performance timing measurements');
    }
  }

  private displayResults(): void {
    console.log(`\n${  '=' .repeat(60)}`);
    console.log('📊 Validation Results');
    console.log('=' .repeat(60));

    const passed = this.results.filter(r => r.issues.length === 0).length;
    const failed = this.results.filter(r => r.issues.length > 0).length;

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Valid files: ${passed}`);
    console.log(`   ❌ Files with issues: ${failed}`);

    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.issues.length === 0 ? '✅' : '❌';
      console.log(`\n${status} ${result.file}`);
      
      if (result.exists) {
        console.log(`   📁 File exists: ✅`);
        console.log(`   📦 Has imports: ${result.hasImports ? '✅' : '❌'}`);
        console.log(`   🏗️  Has describe blocks: ${result.hasDescribeBlocks ? '✅' : '❌'}`);
        console.log(`   🧪 Has test cases: ${result.hasTestCases ? '✅' : '❌'}`);
        console.log(`   🔧 Proper structure: ${result.hasProperStructure ? '✅' : '❌'}`);
      } else {
        console.log(`   📁 File exists: ❌`);
      }

      if (result.issues.length > 0) {
        console.log(`   🚨 Issues:`);
        result.issues.forEach(issue => {
          console.log(`      - ${issue}`);
        });
      }
    });

    // Recommendations
    if (failed > 0) {
      console.log('\n💡 Recommendations:');
      console.log('   1. Fix missing test files');
      console.log('   2. Add missing test cases for critical functionality');
      console.log('   3. Ensure proper imports and test structure');
      console.log('   4. Run tests to verify they execute correctly');
    } else {
      console.log('\n🎉 All test files are properly structured!');
      console.log('\n🚀 Next steps:');
      console.log('   1. Run: npm run test:images');
      console.log('   2. Check coverage: npm run test:images:coverage');
      console.log('   3. Run performance tests: npm run test:images:performance');
    }

    process.exit(failed > 0 ? 1 : 0);
  }
}

async function main(): Promise<void> {
  const validator = new TestValidator();
  await validator.validateAllTests();
}

main().catch((error) => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});