#!/usr/bin/env tsx
/**
 * Update Package.json Scripts
 * 
 * Adds new migration system scripts to package.json
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function updatePackageScripts() {
  const packageJsonPath = join(process.cwd(), 'package.json');
  
  try {
    // Read current package.json
    const packageContent = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    // Add new migration scripts
    const newScripts = {
      // New migration system
      'migrate': 'tsx database/migrations/migration-cli.ts migrate',
      'migrate:status': 'tsx database/migrations/migration-cli.ts status',
      'migrate:validate': 'tsx database/migrations/migration-cli.ts validate',
      'migrate:rollback': 'tsx database/migrations/migration-cli.ts rollback',
      'migrate:list': 'tsx database/migrations/migration-cli.ts list',
      'migrate:list-pending': 'tsx database/migrations/migration-cli.ts list-pending',
      'migrate:list-applied': 'tsx database/migrations/migration-cli.ts list-applied',
      'migrate:init': 'tsx database/migrations/migration-cli.ts init',
      'migrate:reload': 'tsx database/migrations/migration-cli.ts reload',
      'migrate:help': 'tsx database/migrations/migration-cli.ts help',
      
      // Migration development
      'migrate:dry-run': 'tsx database/migrations/migration-cli.ts migrate --dry-run',
      'migrate:verbose': 'tsx database/migrations/migration-cli.ts migrate --verbose',
      'migrate:list-core': 'tsx database/migrations/migration-cli.ts list --domain=core',
      'migrate:list-verification': 'tsx database/migrations/migration-cli.ts list --domain=verification',
      'migrate:list-trust': 'tsx database/migrations/migration-cli.ts list --domain=trust',
      'migrate:list-fraud': 'tsx database/migrations/migration-cli.ts list --domain=fraud',
      
      // Legacy compatibility (updated to use new system)
      'db:migrate': 'tsx database/migrations/migration-cli.ts migrate',
      'db:migrate:status': 'tsx database/migrations/migration-cli.ts status',
      'db:migrate:validate': 'tsx database/migrations/migration-cli.ts validate',
    };
    
    // Merge with existing scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      ...newScripts
    };
    
    // Write updated package.json
    await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)  }\n`);
    
    console.log('✅ Updated package.json with new migration scripts');
    console.log('\n📋 New migration commands available:');
    console.log('   npm run migrate              - Run all pending migrations');
    console.log('   npm run migrate:status       - Show migration status');
    console.log('   npm run migrate:validate     - Validate migration integrity');
    console.log('   npm run migrate:list         - List all migrations');
    console.log('   npm run migrate:list-pending - List pending migrations');
    console.log('   npm run migrate:rollback <id> - Rollback specific migration');
    console.log('   npm run migrate:help         - Show detailed help');
    
  } catch (error) {
    console.error('❌ Failed to update package.json:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePackageScripts();
}

export { updatePackageScripts };