#!/usr/bin/env node

/**
 * Script to temporarily disable route preloader for stability
 * This swaps the active route preloader with a disabled version
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routingDir = path.join(__dirname, '..', 'src', 'infrastructure', 'routing');

// File paths
const originalPreloader = path.join(routingDir, 'route-preloader.ts');
const disabledPreloader = path.join(routingDir, 'route-preloader-disabled.ts');
const backupPreloader = path.join(routingDir, 'route-preloader.ts.backup');

const originalHook = path.join(routingDir, 'useRoutePreloader.ts');
const disabledHook = path.join(routingDir, 'useRoutePreloader-disabled.ts');
const backupHook = path.join(routingDir, 'useRoutePreloader.ts.backup');

function disableRoutePreloader() {
  try {
    console.log('🔄 Disabling route preloader for stability...');

    // Backup original files
    if (fs.existsSync(originalPreloader)) {
      fs.copyFileSync(originalPreloader, backupPreloader);
      console.log('✅ Backed up route-preloader.ts');
    }

    if (fs.existsSync(originalHook)) {
      fs.copyFileSync(originalHook, backupHook);
      console.log('✅ Backed up useRoutePreloader.ts');
    }

    // Replace with disabled versions
    if (fs.existsSync(disabledPreloader)) {
      fs.copyFileSync(disabledPreloader, originalPreloader);
      console.log('✅ Replaced route-preloader.ts with disabled version');
    }

    if (fs.existsSync(disabledHook)) {
      fs.copyFileSync(disabledHook, originalHook);
      console.log('✅ Replaced useRoutePreloader.ts with disabled version');
    }

    console.log('');
    console.log('🚨 Route preloader has been DISABLED for stability');
    console.log('📝 Navigation will work normally without preloading');
    console.log('🔄 To restore: npm run enable-route-preloader');
    console.log('');

  } catch (error) {
    console.error('❌ Error disabling route preloader:', error.message);
    process.exit(1);
  }
}

function enableRoutePreloader() {
  try {
    console.log('🔄 Enabling route preloader...');

    // Restore from backups
    if (fs.existsSync(backupPreloader)) {
      fs.copyFileSync(backupPreloader, originalPreloader);
      fs.unlinkSync(backupPreloader);
      console.log('✅ Restored route-preloader.ts');
    }

    if (fs.existsSync(backupHook)) {
      fs.copyFileSync(backupHook, originalHook);
      fs.unlinkSync(backupHook);
      console.log('✅ Restored useRoutePreloader.ts');
    }

    console.log('');
    console.log('✅ Route preloader has been ENABLED');
    console.log('📝 Preloading functionality is now active');
    console.log('');

  } catch (error) {
    console.error('❌ Error enabling route preloader:', error.message);
    process.exit(1);
  }
}

// Check command line argument
const command = process.argv[2];

if (command === 'enable') {
  enableRoutePreloader();
} else {
  disableRoutePreloader();
}