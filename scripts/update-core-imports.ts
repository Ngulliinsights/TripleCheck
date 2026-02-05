#!/usr/bin/env node

/**
 * Update Core Imports Script
 * 
 * This script updates all import references throughout the codebase to use
 * the new core utilities instead of scattered implementations.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface ImportReplacement {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const importReplacements: ImportReplacement[] = [
  // Cache Service imports
  {
    pattern: /import\s*{\s*cacheService\s*}\s*from\s*["'].*\/shared\/services\/CacheService["']/g,
    replacement: "import { cacheService } from '..\server\cache\CacheService'",
    description: "Migrate CacheService import to core cache module"
  },
  {
    pattern: /import\s*{\s*CacheService\s*}\s*from\s*["'].*\/shared\/services\/CacheService["']/g,
    replacement: "import { CacheService } from '..\server\cache\CacheService'",
    description: "Migrate CacheService class import to core cache module"
  },
  {
    pattern: /import\s*cacheService\s*from\s*["'].*\/shared\/services\/CacheService["']/g,
    replacement: "import { cacheService } from '..\server\cache\CacheService'",
    description: "Migrate default CacheService import to core cache module"
  },
  {
    pattern: /from\s*["'].*\/shared\/services\/CacheService["']/g,
    replacement: "from '../core/src/cache'",
    description: "Update CacheService import path to core module"
  },

  // Logger imports
  {
    pattern: /import\s*{\s*logger\s*}\s*from\s*["'].*\/shared\/utils\/logger["']/g,
    replacement: "import { legacyLogger as logger } from '../core/src/logging'",
    description: "Migrate logger import to core logging module"
  },
  {
    pattern: /from\s*["'].*\/shared\/utils\/logger["']/g,
    replacement: "from '../core/src/logging'",
    description: "Update logger import path to core module"
  },

  // Validation Service imports
  {
    pattern: /import\s*{\s*validationService\s*}\s*from\s*["'].*\/shared\/services\/ValidationService["']/g,
    replacement: "import { legacyValidationService as validationService } from '../core/src/validation'",
    description: "Migrate ValidationService import to core validation module"
  },
  {
    pattern: /import\s*{\s*ValidationService\s*}\s*from\s*["'].*\/shared\/services\/ValidationService["']/g,
    replacement: "import { LegacyValidationService as ValidationService } from '../core/src/validation'",
    description: "Migrate ValidationService class import to core validation module"
  },
  {
    pattern: /import\s*validationService\s*from\s*["'].*\/shared\/services\/ValidationService["']/g,
    replacement: "import { legacyValidationService as validationService } from '../core/src/validation'",
    description: "Migrate default ValidationService import to core validation module"
  },
  {
    pattern: /from\s*["'].*\/shared\/services\/ValidationService["']/g,
    replacement: "from '../core/src/validation'",
    description: "Update ValidationService import path to core module"
  },

  // Error handling imports
  {
    pattern: /import\s*{\s*ERROR_MESSAGES\s*}\s*from\s*["'].*\/shared\/error-handling\/constants\/error-messages["']/g,
    replacement: "import { ERROR_MESSAGES } from '..\src\shared\error-handling\index'",
    description: "Migrate ERROR_MESSAGES import to core error handling module"
  },
  {
    pattern: /import\s*{\s*AUTH_ERROR_MESSAGES\s*}\s*from\s*["'].*\/utils\/error-messages["']/g,
    replacement: "import { AUTH_ERROR_MESSAGES } from '../core/src/error-handling'",
    description: "Migrate AUTH_ERROR_MESSAGES import to core error handling module"
  },

  // Infrastructure cache imports (these should use core cache)
  {
    pattern: /import\s*{\s*CacheService\s*}\s*from\s*["'].*\/infrastructure\/cache["']/g,
    replacement: "import { CacheService } from '..\server\cache\CacheService'",
    description: "Migrate infrastructure CacheService import to core cache module"
  },
  {
    pattern: /import\s*{\s*cacheService\s*}\s*from\s*["'].*\/infrastructure\/cache["']/g,
    replacement: "import { cacheService } from '..\server\cache\CacheService'",
    description: "Migrate infrastructure cacheService import to core cache module"
  },

  // Logging service imports from core
  {
    pattern: /import\s*{\s*loggingService\s*}\s*from\s*["'].*\/core\/src\/logging["']/g,
    replacement: "import { logger as loggingService } from '..\server\infrastructure\monitoring\logger'",
    description: "Migrate loggingService import to use standard core logging export"
  },
];

function getAllFiles(dir: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
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
  }
  
  traverse(dir);
  return files;
}

function updateImportsInFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    let updatedContent = content;
    let hasChanges = false;

    for (const replacement of importReplacements) {
      const matches = content.match(replacement.pattern);
      if (matches) {
        console.log(`  Updating ${matches.length} import(s) in ${filePath}: ${replacement.description}`);
        updatedContent = updatedContent.replace(replacement.pattern, replacement.replacement);
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
  console.log('🔄 Starting core imports update...\n');

  const rootDir = process.cwd();
  const files = getAllFiles(rootDir);
  
  let totalFiles = 0;
  let updatedFiles = 0;

  for (const file of files) {
    totalFiles++;
    const wasUpdated = updateImportsInFile(file);
    if (wasUpdated) {
      updatedFiles++;
    }
  }

  console.log(`\n✅ Import update complete!`);
  console.log(`📊 Statistics:`);
  console.log(`   - Total files processed: ${totalFiles}`);
  console.log(`   - Files updated: ${updatedFiles}`);
  console.log(`   - Files unchanged: ${totalFiles - updatedFiles}`);

  if (updatedFiles > 0) {
    console.log(`\n⚠️  Please review the changes and run tests to ensure everything works correctly.`);
  }
}

// Run the script if executed directly
main();

export { updateImportsInFile, importReplacements };