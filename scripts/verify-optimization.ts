#!/usr/bin/env tsx

/**
 * Optimization Verification Script
 * 
 * Verifies that the project structure optimization was successful
 */

import * as fs from './add-b2b-messaging';
import * as path from './fix-core-import-paths';
import { execSync } from 'child_process';

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: string[];
}

class OptimizationVerifier {
  private results: VerificationResult[] = [];

  async verify(): Promise<boolean> {
    console.log('🔍 Verifying project structure optimization...\n');

    // Run all verification checks
    await this.checkCompiledFilesRemoved();
    await this.checkDuplicateComponentsRemoved();
    await this.checkBarrelExportsCreated();
    await this.checkTypeScriptCompilation();
    await this.checkImportStatements();
    await this.checkBuildProcess();

    this.printResults();
    
    const allPassed = this.results.every(result => result.passed);
    return allPassed;
  }

  private async checkCompiledFilesRemoved(): Promise<void> {
    console.log('📁 Checking compiled files removal...');
    
    const compiledFiles = await this.findCompiledFilesInSrc();
    
    if (compiledFiles.length === 0) {
      this.results.push({
        passed: true,
        message: 'All compiled files removed from src/ directory'
      });
    } else {
      this.results.push({
        passed: false,
        message: `${compiledFiles.length} compiled files still present in src/`,
        details: compiledFiles.slice(0, 5).map(f => `- ${f}`)
      });
    }
  }

  private async checkDuplicateComponentsRemoved(): Promise<void> {
    console.log('🔄 Checking duplicate components removal...');
    
    const duplicateChecks = [
      {
        name: 'PropertyMap',
        shouldExist: 'src/property/components/PropertyMap.tsx',
        shouldNotExist: 'src/property/pages/PropertyMap.tsx',
        wrapperShouldExist: 'src/property/pages/PropertyMapPage.tsx'
      },
      {
        name: 'MobileNav',
        shouldExist: 'src/shared/components/navigation/MobileNav.tsx',
        shouldNotExist: 'src/shared/components/layout/MobileNav.tsx'
      },
      {
        name: 'LazyComponents',
        shouldExist: 'src/shared/components/lazy/LazyComponents.tsx',
        shouldNotExist: 'src/shared/components/LazyComponents.tsx'
      }
    ];

    let allPassed = true;
    const details: string[] = [];

    for (const check of duplicateChecks) {
      const exists = await this.fileExists(check.shouldExist);
      const duplicateExists = await this.fileExists(check.shouldNotExist);
      const wrapperExists = check.wrapperShouldExist ? await this.fileExists(check.wrapperShouldExist) : true;

      if (exists && !duplicateExists && wrapperExists) {
        details.push(`✓ ${check.name}: correctly consolidated`);
      } else {
        allPassed = false;
        details.push(`✗ ${check.name}: consolidation incomplete`);
        if (!exists) details.push(`  - Missing: ${check.shouldExist}`);
        if (duplicateExists) details.push(`  - Still exists: ${check.shouldNotExist}`);
        if (check.wrapperShouldExist && !wrapperExists) details.push(`  - Missing wrapper: ${check.wrapperShouldExist}`);
      }
    }

    this.results.push({
      passed: allPassed,
      message: allPassed ? 'All duplicate components successfully consolidated' : 'Some duplicate components not properly consolidated',
      details
    });
  }

  private async checkBarrelExportsCreated(): Promise<void> {
    console.log('📦 Checking barrel exports creation...');
    
    const expectedBarrels = [
      'src/property/components/index.ts',
      'src/shared/hooks/index.ts',
      'src/shared/components/ui/index.ts'
    ];

    let allCreated = true;
    const details: string[] = [];

    for (const barrel of expectedBarrels) {
      const exists = await this.fileExists(barrel);
      if (exists) {
        details.push(`✓ ${barrel}`);
      } else {
        allCreated = false;
        details.push(`✗ Missing: ${barrel}`);
      }
    }

    this.results.push({
      passed: allCreated,
      message: allCreated ? 'All barrel exports created successfully' : 'Some barrel exports missing',
      details
    });
  }

  private async checkTypeScriptCompilation(): Promise<void> {
    console.log('🔧 Checking TypeScript compilation...');
    
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.results.push({
        passed: true,
        message: 'TypeScript compilation successful'
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'TypeScript compilation failed',
        details: ['Run `npx tsc --noEmit` to see detailed errors']
      });
    }
  }

  private async checkImportStatements(): Promise<void> {
    console.log('📥 Checking import statements...');
    
    const problematicImports = await this.findProblematicImports();
    
    if (problematicImports.length === 0) {
      this.results.push({
        passed: true,
        message: 'No problematic import statements found'
      });
    } else {
      this.results.push({
        passed: false,
        message: `${problematicImports.length} files with potentially outdated imports`,
        details: problematicImports.slice(0, 5).map(imp => `- ${imp}`)
      });
    }
  }

  private async checkBuildProcess(): Promise<void> {
    console.log('🏗️ Checking build process...');
    
    try {
      execSync('npm run build:client', { stdio: 'pipe' });
      this.results.push({
        passed: true,
        message: 'Build process completed successfully'
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Build process failed',
        details: ['Run `npm run build:client` to see detailed errors']
      });
    }
  }

  private async findCompiledFilesInSrc(): Promise<string[]> {
    const compiledFiles: string[] = [];

    const walkDir = async (dir: string): Promise<void> => {
      try {
        const items = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(dir, item.name);

          if (item.isDirectory() && !['node_modules', 'dist', 'build'].includes(item.name)) {
            await walkDir(fullPath);
          } else if (item.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.d.ts'))) {
            // Check if there's a corresponding TypeScript file
            const tsFile = fullPath.replace(/\.(js|d\.ts)$/, '.ts');
            const tsxFile = fullPath.replace(/\.(js|d\.ts)$/, '.tsx');

            if (await this.fileExists(tsFile) || await this.fileExists(tsxFile)) {
              compiledFiles.push(path.relative('.', fullPath));
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    await walkDir('src');
    return compiledFiles;
  }

  private async findProblematicImports(): Promise<string[]> {
    const problematicFiles: string[] = [];
    const problematicPatterns = [
      /from\s+['"]\.\.\/pages\/PropertyMap['"]/,
      /from\s+['"]\.\.\/layout\/MobileNav['"]/,
      /from\s+['"]\.\.\/LazyComponents['"]/
    ];

    const walkDir = async (dir: string): Promise<void> => {
      try {
        const items = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(dir, item.name);

          if (item.isDirectory() && !['node_modules', 'dist', 'build'].includes(item.name)) {
            await walkDir(fullPath);
          } else if (item.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
            try {
              const content = await fs.promises.readFile(fullPath, 'utf8');
              
              if (problematicPatterns.some(pattern => pattern.test(content))) {
                problematicFiles.push(path.relative('.', fullPath));
              }
            } catch (error) {
              // Skip files we can't read
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    await walkDir('src');
    return problematicFiles;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(70));
    console.log('OPTIMIZATION VERIFICATION RESULTS');
    console.log('='.repeat(70));

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    console.log(`\n📊 SUMMARY: ${passed}/${total} checks passed\n`);

    for (const result of this.results) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.message}`);
      
      if (result.details) {
        result.details.forEach(detail => {
          console.log(`   ${detail}`);
        });
      }
      console.log();
    }

    if (passed === total) {
      console.log('🎉 All verification checks passed! Optimization was successful.');
      console.log('\n📋 NEXT STEPS:');
      console.log('   1. Run tests: npm test');
      console.log('   2. Start development server: npm run dev');
      console.log('   3. Verify application functionality manually');
      console.log('   4. Commit changes to version control');
    } else {
      console.log('⚠️  Some verification checks failed. Please address the issues above.');
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('   1. Check the detailed error messages above');
      console.log('   2. Run the import update script: tsx scripts/update-imports.ts');
      console.log('   3. Manually fix any remaining import issues');
      console.log('   4. Re-run this verification script');
    }

    console.log('='.repeat(70));
  }
}

// CLI interface
async function main() {
  try {
    const verifier = new OptimizationVerifier();
    const success = await verifier.verify();
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

main();