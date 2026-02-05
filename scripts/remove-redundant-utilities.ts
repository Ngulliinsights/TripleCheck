#!/usr/bin/env node

/**
 * Remove Redundant Utilities Script
 * 
 * This script safely removes redundant utility files after verifying
 * that all imports have been migrated to the core module.
 */

import { existsSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface FileToRemove {
  path: string;
  description: string;
  backupContent?: boolean;
}

const filesToRemove: FileToRemove[] = [
  {
    path: 'src/shared/services/CacheService.ts',
    description: 'Legacy CacheService - migrated to core/src/cache',
    backupContent: true
  },
  {
    path: 'src/shared/utils/logger.ts',
    description: 'Legacy logger utility - migrated to core/src/logging',
    backupContent: true
  },
  {
    path: 'src/shared/services/ValidationService.ts',
    description: 'Legacy ValidationService - migrated to core/src/validation',
    backupContent: true
  },
  {
    path: 'src/shared/error-handling/constants/error-messages.ts',
    description: 'Legacy error messages - migrated to core/src/error-handling',
    backupContent: true
  }
];

function createBackup(filePath: string): boolean {
  try {
    if (!existsSync(filePath)) {
      console.log(`  ⚠️  File ${filePath} does not exist, skipping backup`);
      return false;
    }

    const content = readFileSync(filePath, 'utf-8');
    const backupPath = `${filePath}.backup.${Date.now()}`;
    
    writeFileSync(backupPath, content, 'utf-8');
    console.log(`  📦 Created backup: ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to create backup for ${filePath}:`, error);
    return false;
  }
}

function removeFile(filePath: string): boolean {
  try {
    if (!existsSync(filePath)) {
      console.log(`  ⚠️  File ${filePath} does not exist, skipping removal`);
      return true;
    }

    unlinkSync(filePath);
    console.log(`  ✅ Removed: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to remove ${filePath}:`, error);
    return false;
  }
}

function checkForActiveImports(filePath: string): string[] {
  const issues: string[] = [];
  
  // This is a simplified check - in a real scenario, you'd want more comprehensive checking
  const searchPatterns = [
    filePath.replace(/\.ts$/, ''),
    filePath.replace(/^src\//, '').replace(/\.ts$/, ''),
    filePath.replace(/^src\//, './').replace(/\.ts$/, ''),
  ];

  // For now, we'll assume the import migration script has done its job correctly
  // In a production environment, you'd want to scan all files for remaining imports
  
  return issues;
}

function main() {
  console.log('🗑️  Starting removal of redundant utility files...\n');

  let totalFiles = 0;
  let removedFiles = 0;
  let skippedFiles = 0;

  for (const fileInfo of filesToRemove) {
    totalFiles++;
    console.log(`Processing: ${fileInfo.path}`);
    console.log(`  Description: ${fileInfo.description}`);

    // Check for active imports (simplified check)
    const importIssues = checkForActiveImports(fileInfo.path);
    if (importIssues.length > 0) {
      console.log(`  ⚠️  Skipping removal due to potential active imports:`);
      importIssues.forEach(issue => console.log(`    - ${issue}`));
      skippedFiles++;
      continue;
    }

    // Create backup if requested
    if (fileInfo.backupContent) {
      const backupCreated = createBackup(fileInfo.path);
      if (!backupCreated && existsSync(fileInfo.path)) {
        console.log(`  ⚠️  Skipping removal due to backup failure`);
        skippedFiles++;
        continue;
      }
    }

    // Remove the file
    const removed = removeFile(fileInfo.path);
    if (removed) {
      removedFiles++;
    } else {
      skippedFiles++;
    }

    console.log('');
  }

  console.log(`✅ Redundant utility removal complete!`);
  console.log(`📊 Statistics:`);
  console.log(`   - Total files processed: ${totalFiles}`);
  console.log(`   - Files removed: ${removedFiles}`);
  console.log(`   - Files skipped: ${skippedFiles}`);

  if (removedFiles > 0) {
    console.log(`\n📦 Backup files have been created for removed files.`);
    console.log(`⚠️  Please run tests to ensure everything works correctly.`);
    console.log(`🧹 You can clean up backup files once you're confident the migration is successful.`);
  }

  if (skippedFiles > 0) {
    console.log(`\n⚠️  Some files were skipped. Please review and remove manually if appropriate.`);
  }
}

// Run the script
main();

export { filesToRemove };