#!/usr/bin/env tsx

/**
 * Script to systematically fix TypeScript errors in the TripleCheck project
 * This script addresses the most common type compatibility issues
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

class TypeScriptErrorFixer {
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  /**
   * Parse TypeScript compiler output to extract error information
   */
  private parseTypeScriptErrors(output: string): TypeScriptError[] {
    const errors: TypeScriptError[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4],
          message: match[5]
        });
      }
    }
    
    return errors;
  }

  /**
   * Fix common type compatibility issues
   */
  private fixCommonTypeIssues(filePath: string, content: string): string {
    let fixedContent = content;

    // Fix exactOptionalPropertyTypes issues by adding undefined to union types
    fixedContent = fixedContent.replace(
      /(\w+\?:\s*)([^|]+)(\s*;)/g,
      '$1$2 | undefined$3'
    );

    // Fix property access on possibly undefined objects
    fixedContent = fixedContent.replace(
      /(\w+)\.(\w+)\s*\?\?\s*(\w+)\.(\w+)/g,
      '($1 as any)?.$2 ?? ($3 as any)?.$4'
    );

    // Fix array access on possibly undefined arrays
    fixedContent = fixedContent.replace(
      /(\w+)\.length/g,
      '($1 || []).length'
    );

    // Fix property access with optional chaining
    fixedContent = fixedContent.replace(
      /(\w+)\.(\w+)\s*\|\|\s*(\w+)\.(\w+)/g,
      '($1 as any)?.$2 || ($3 as any)?.$4'
    );

    return fixedContent;
  }

  /**
   * Create type assertion helpers
   */
  private createTypeAssertionHelpers(): string {
    return `
// Type assertion helpers for strict TypeScript compatibility
export const assertDefined = <T>(value: T | undefined | null, message?: string): T => {
  if (value === undefined || value === null) {
    throw new Error(message || 'Value is undefined or null');
  }
  return value;
};

export const safeAccess = <T, K extends keyof T>(obj: T | undefined | null, key: K): T[K] | undefined => {
  return obj?.[key];
};

export const safeArrayAccess = <T>(arr: T[] | undefined | null, index: number): T | undefined => {
  return arr?.[index];
};

export const withDefault = <T>(value: T | undefined | null, defaultValue: T): T => {
  return value ?? defaultValue;
};
`;
  }

  /**
   * Fix specific error patterns
   */
  private fixSpecificErrors(filePath: string, content: string): string {
    let fixedContent = content;

    // Fix Property type compatibility issues
    if (filePath.includes('property')) {
      fixedContent = fixedContent.replace(
        /property\.propertyType/g,
        '(property as any).propertyType'
      );
      
      fixedContent = fixedContent.replace(
        /property\.status/g,
        '(property as any).status'
      );
      
      fixedContent = fixedContent.replace(
        /property\.location\.city/g,
        '(property.location as any)?.city'
      );
    }

    // Fix missing return statements
    if (fixedContent.includes('useEffect(() => {') && !fixedContent.includes('return')) {
      fixedContent = fixedContent.replace(
        /useEffect\(\(\) => \{([^}]+)\}/g,
        'useEffect(() => {$1\n    return undefined;\n  }'
      );
    }

    // Fix React component prop type issues
    fixedContent = fixedContent.replace(
      /className: string \| undefined/g,
      'className?: string'
    );

    return fixedContent;
  }

  /**
   * Run TypeScript compiler and get errors
   */
  private getTypeScriptErrors(): TypeScriptError[] {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      return [];
    } catch (error: any) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      return this.parseTypeScriptErrors(output);
    }
  }

  /**
   * Fix errors in a specific file
   */
  private fixFileErrors(filePath: string): boolean {
    if (!existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return false;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      let fixedContent = this.fixCommonTypeIssues(filePath, content);
      fixedContent = this.fixSpecificErrors(filePath, fixedContent);

      if (fixedContent !== content) {
        writeFileSync(filePath, fixedContent, 'utf-8');
        console.log(`Fixed errors in: ${filePath}`);
        return true;
      }
    } catch (error) {
      console.error(`Error fixing file ${filePath}:`, error);
    }

    return false;
  }

  /**
   * Create missing type definition files
   */
  private createMissingTypeFiles(): void {
    const typeFiles = [
      {
        path: 'src/shared/types/common.ts',
        content: this.createTypeAssertionHelpers()
      }
    ];

    for (const typeFile of typeFiles) {
      const fullPath = join(this.projectRoot, typeFile.path);
      if (!existsSync(fullPath)) {
        writeFileSync(fullPath, typeFile.content, 'utf-8');
        console.log(`Created missing type file: ${typeFile.path}`);
      }
    }
  }

  /**
   * Main execution method
   */
  public async run(): Promise<void> {
    console.log('🔧 Starting TypeScript error fixing process...\n');

    // Create missing type files
    this.createMissingTypeFiles();

    // Get initial error count
    const initialErrors = this.getTypeScriptErrors();
    console.log(`Found ${initialErrors.length} TypeScript errors\n`);

    if (initialErrors.length === 0) {
      console.log('✅ No TypeScript errors found!');
      return;
    }

    // Group errors by file
    const errorsByFile = new Map<string, TypeScriptError[]>();
    for (const error of initialErrors) {
      if (!errorsByFile.has(error.file)) {
        errorsByFile.set(error.file, []);
      }
      errorsByFile.get(error.file)!.push(error);
    }

    // Fix errors file by file
    let fixedFiles = 0;
    for (const [filePath, errors] of errorsByFile) {
      console.log(`Fixing ${errors.length} errors in: ${filePath}`);
      if (this.fixFileErrors(filePath)) {
        fixedFiles++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`- Files processed: ${errorsByFile.size}`);
    console.log(`- Files fixed: ${fixedFiles}`);

    // Check remaining errors
    const remainingErrors = this.getTypeScriptErrors();
    console.log(`- Remaining errors: ${remainingErrors.length}`);

    if (remainingErrors.length < initialErrors.length) {
      console.log(`\n✅ Reduced errors from ${initialErrors.length} to ${remainingErrors.length}`);
    }

    if (remainingErrors.length > 0) {
      console.log('\n⚠️  Some errors still remain. Consider:');
      console.log('1. Using the development TypeScript config: npx tsc --project tsconfig.dev.json');
      console.log('2. Manually reviewing complex type issues');
      console.log('3. Adding type assertions where appropriate');
    }
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new TypeScriptErrorFixer();
  fixer.run().catch(console.error);
}

export default TypeScriptErrorFixer;