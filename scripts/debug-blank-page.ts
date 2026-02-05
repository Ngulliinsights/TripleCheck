#!/usr/bin/env tsx

/**
 * BLANK PAGE DEBUGGING SCRIPT
 * ===========================
 * 
 * Helps identify why the app is rendering blank
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

class BlankPageDebugger {
  private rootDir: string;

  constructor() {
    this.rootDir = process.cwd();
  }

  async debug(): Promise<void> {
    console.log('🔍 Debugging blank page issue...\n');

    // Check build output
    await this.checkBuildOutput();
    
    // Check for JavaScript errors
    await this.checkJavaScriptErrors();
    
    // Check main entry point
    await this.checkMainEntry();
    
    // Check router configuration
    await this.checkRouter();
    
    // Provide debugging steps
    await this.provideDebuggingSteps();
  }

  private async checkBuildOutput(): Promise<void> {
    console.log('📁 Checking build output...');
    
    const distDir = join(this.rootDir, 'dist/public');
    const indexPath = join(distDir, 'index.html');
    
    if (!existsSync(indexPath)) {
      console.log('❌ index.html not found');
      return;
    }
    
    const indexContent = readFileSync(indexPath, 'utf8');
    
    // Check for root div
    if (indexContent.includes('<div id="root">')) {
      console.log('✅ Root div found in built index.html');
    } else {
      console.log('❌ Root div missing in built index.html');
    }
    
    // Check for script tags
    const scriptMatches = indexContent.match(/<script[^>]*src="[^"]*"[^>]*>/g);
    if (scriptMatches && scriptMatches.length > 0) {
      console.log(`✅ Found ${scriptMatches.length} script tag(s)`);
      scriptMatches.forEach((script, i) => {
        console.log(`   ${i + 1}. ${script}`);
      });
    } else {
      console.log('❌ No script tags found');
    }
    
    console.log('');
  }

  private async checkJavaScriptErrors(): Promise<void> {
    console.log('🔧 Checking for TypeScript/JavaScript errors...');
    
    try {
      execSync('npm run check', { stdio: 'pipe' });
      console.log('✅ TypeScript compilation successful');
    } catch (error) {
      console.log('❌ TypeScript compilation failed:');
      console.log(error.stdout?.toString() || error.message);
    }
    
    console.log('');
  }

  private async checkMainEntry(): Promise<void> {
    console.log('📄 Checking main entry point...');
    
    const mainPath = join(this.rootDir, 'src/main.tsx');
    if (!existsSync(mainPath)) {
      console.log('❌ src/main.tsx not found');
      return;
    }
    
    const mainContent = readFileSync(mainPath, 'utf8');
    
    // Check for critical imports
    const checks = [
      { name: 'React import', pattern: /import.*React.*from.*react/ },
      { name: 'ReactDOM import', pattern: /import.*ReactDOM.*from.*react-dom/ },
      { name: 'App import', pattern: /import.*App.*from/ },
      { name: 'Root element', pattern: /getElementById\("root"\)/ },
      { name: 'ReactDOM.createRoot', pattern: /ReactDOM\.createRoot/ },
      { name: 'BrowserRouter', pattern: /BrowserRouter/ },
    ];
    
    checks.forEach(check => {
      if (check.pattern.test(mainContent)) {
        console.log(`✅ ${check.name} found`);
      } else {
        console.log(`❌ ${check.name} missing`);
      }
    });
    
    console.log('');
  }

  private async checkRouter(): Promise<void> {
    console.log('🛣️  Checking router configuration...');
    
    const routerPath = join(this.rootDir, 'src/app/router.tsx');
    if (!existsSync(routerPath)) {
      console.log('❌ Router file not found');
      return;
    }
    
    const routerContent = readFileSync(routerPath, 'utf8');
    
    // Check for home route
    if (routerContent.includes('path="/"')) {
      console.log('✅ Home route found');
    } else {
      console.log('❌ Home route missing');
    }
    
    // Check for Routes component
    if (routerContent.includes('<Routes>')) {
      console.log('✅ Routes component found');
    } else {
      console.log('❌ Routes component missing');
    }
    
    console.log('');
  }

  private async provideDebuggingSteps(): Promise<void> {
    console.log('🔍 Manual debugging steps:');
    console.log('');
    console.log('1. 🌐 Open browser and visit http://localhost:4173');
    console.log('2. 🛠️  Open Developer Tools (F12)');
    console.log('3. 📋 Check Console tab for JavaScript errors');
    console.log('4. 🌐 Check Network tab for failed requests');
    console.log('5. 📄 Check Elements tab to see if <div id="root"> exists');
    console.log('');
    console.log('Common issues and solutions:');
    console.log('');
    console.log('❌ Console shows "Cannot read property of undefined":');
    console.log('   → Check for TypeScript errors: npm run check');
    console.log('');
    console.log('❌ Console shows "Failed to fetch" or 404 errors:');
    console.log('   → Check if assets are loading correctly');
    console.log('   → Verify base path in vite.config.ts');
    console.log('');
    console.log('❌ Console shows React errors:');
    console.log('   → Check for JSX syntax errors');
    console.log('   → Verify all components are properly exported');
    console.log('');
    console.log('❌ Root div is empty:');
    console.log('   → Check if React app is mounting');
    console.log('   → Verify main.tsx is correct');
    console.log('');
    console.log('🔧 Quick fixes to try:');
    console.log('');
    console.log('1. Clear cache and rebuild:');
    console.log('   rm -rf dist node_modules/.cache');
    console.log('   npm run build');
    console.log('   npm run preview');
    console.log('');
    console.log('2. Check for syntax errors:');
    console.log('   npm run lint');
    console.log('   npm run check');
    console.log('');
    console.log('3. Test in development mode:');
    console.log('   npm run dev');
    console.log('   # Visit http://localhost:5173');
  }
}

async function main() {
  try {
    const blankPageDebugger = new BlankPageDebugger();
    await blankPageDebugger.debug();
  } catch (error) {
    console.error('Debugging failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { BlankPageDebugger };