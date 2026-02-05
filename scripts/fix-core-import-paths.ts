#!/usr/bin/env node

/**
 * Fix Core Import Paths Script
 * 
 * This script fixes the import paths to use relative paths instead of aliases
 * to ensure compatibility across all environments.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative, dirname } from 'path';

interface PathReplacement {
  pattern: RegExp;
  getReplacement: (filePath: string) => string;
  description: string;
}

function getRelativePathToCore(fromFile: string): string {
  const fromDir = dirname(fromFile);
  const coreDir = join(process.cwd(), 'core', 'src');
  const relativePath = relative(fromDir, coreDir);
  
  // Normalize path separators for cross-platform compatibility
  return relativePath.replace(/\\/g, '/');
}

const pathReplacements: PathReplacement[] = [
  // Cache imports
  {
    pattern: /from\s*['"]@triplecheck\/core\/cache['"]/g,
    getReplacement: (filePath: string) => {
      const relativePath = getRelativePathToCore(filePath);
      return `from '${relativePath}/cache'`;
    },
    description: "Fix cache import path to use relative path"
  },
  
  // Logging imports
  {
    pattern: /from\s*['"]@triplecheck\/core\/logging['"]/g,
    getReplacement: (filePath: string) => {
      const relativePath = getRelativePathToCore(filePath);
      return `from '${relativePath}/logging'`;
    },
    description: "Fix logging import path to use relative path"
  },
  
  // Validation imports
  {
    pattern: /from\s*['"]@triplecheck\/core\/validation['"]/g,
    getReplacement: (filePath: string) => {
      const relativePath = getRelativePathToCore(filePath);
      return `from '${relativePath}/validation'`;
    },
    description: "Fix validation import path to use relative path"
  },
  
  // Error handling imports
  {
    pattern: /from\s*['"]@triplecheck\/core\/error-handling['"]/g,
    getReplacement: (filePath: string) => {
      const relativePath = getRelativePathToCore(filePath);
      return `from '${relativePath}/error-handling'`;
    },
    description: "Fix error handling import path to use relative path"
  },
];

function getAllFiles(dir: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    try {
      const items = readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = join(currentDir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules, .git, and other common directories
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
            traverse(fullPath);
          }
        } else if (extensions.includes(extname(item))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${currentDir}:`, error);
    }
  }
  
  traverse(dir);
  return files;
}

function fixImportPathsInFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    let updatedContent = content;
    let hasChanges = false;

    for (const replacement of pathReplacements) {
      const matches = content.match(replacement.pattern);
      if (matches) {
        console.log(`  Fixing ${matches.length} import path(s) in ${filePath}: ${replacement.description}`);
        const newPath = replacement.getReplacement(filePath);
        updatedContent = updatedContent.replace(replacement.pattern, newPath);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      writeFileSync(filePath, updatedContent, 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing core import paths to use relative paths...\n');

  const rootDir = process.cwd();
  const files = getAllFiles(rootDir);
  
  let totalFiles = 0;
  let updatedFiles = 0;

  for (const file of files) {
    totalFiles++;
    const wasUpdated = fixImportPathsInFile(file);
    if (wasUpdated) {
      updatedFiles++;
    }
  }

  console.log(`\n✅ Import path fix complete!`);
  console.log(`📊 Statistics:`);
  console.log(`   - Total files processed: ${totalFiles}`);
  console.log(`   - Files updated: ${updatedFiles}`);
  console.log(`   - Files unchanged: ${totalFiles - updatedFiles}`);

  if (updatedFiles > 0) {
    console.log(`\n⚠️  Please review the changes and run tests to ensure everything works correctly.`);
  }
}

// Run the script
main();

export { fixImportPathsInFile, pathReplacements };