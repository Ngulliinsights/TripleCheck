#!/usr/bin/env tsx

/**
 * Remove Empty Directories Script
 * 
 * This script removes empty directories from the server infrastructure database
 * after consolidation is complete.
 */

import { promises as fs } from 'fs';
import path from '../../../../scripts/cleanup-redundancies';

async function removeEmptyDirectories() {
  console.log('🗑️ Removing empty directories...');
  
  const dirsToCheck = [
    'server/infrastructure/database/config',
    'server/infrastructure/database/types', 
    'server/infrastructure/database/utils'
  ];
  
  let removedCount = 0;
  
  for (const dir of dirsToCheck) {
    try {
      // Check if directory exists and is empty
      const entries = await fs.readdir(dir);
      
      if (entries.length === 0) {
        await fs.rmdir(dir);
        console.log(`✅ Removed empty directory: ${dir}`);
        removedCount++;
      } else {
        console.log(`⚠️  Directory not empty, skipping: ${dir}`);
        console.log(`   Contains: ${entries.join(', ')}`);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`ℹ️  Directory doesn't exist: ${dir}`);
      } else {
        console.error(`❌ Failed to remove ${dir}:`, error.message);
      }
    }
  }
  
  console.log(`\n🎉 Removed ${removedCount} empty directories`);
  
  // Also check if we can remove the main schemas directories if they're redundant
  await checkSchemaDirectories();
}

async function checkSchemaDirectories() {
  console.log('\n📋 Checking schema directories...');
  
  const schemaDirs = [
    'server/infrastructure/database/schemas/core',
    'server/infrastructure/database/schemas/land-verification'
  ];
  
  for (const dir of schemaDirs) {
    try {
      const entries = await fs.readdir(dir);
      console.log(`📁 ${dir} contains: ${entries.join(', ')}`);
      
      // If directory only contains index.ts or is empty, it might be redundant
      if (entries.length === 0) {
        await fs.rmdir(dir);
        console.log(`✅ Removed empty schema directory: ${dir}`);
      } else if (entries.length === 1 && entries[0] === 'index.ts') {
        console.log(`⚠️  ${dir} only contains index.ts - may be redundant`);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`ℹ️  Schema directory doesn't exist: ${dir}`);
      }
    }
  }
  
  // Check if the main schemas directory can be removed
  try {
    const schemaEntries = await fs.readdir('server/infrastructure/database/schemas');
    if (schemaEntries.length === 0) {
      await fs.rmdir('server/infrastructure/database/schemas');
      console.log('✅ Removed empty schemas directory');
    } else if (schemaEntries.length === 1 && schemaEntries[0] === 'index.ts') {
      console.log('⚠️  Schemas directory only contains index.ts - review needed');
    }
  } catch (error) {
    // Directory might not exist
  }
}

// Run the script
removeEmptyDirectories().catch(console.error);