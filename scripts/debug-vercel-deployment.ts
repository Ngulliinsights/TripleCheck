#!/usr/bin/env tsx

/**
 * VERCEL DEPLOYMENT DEBUGGING SCRIPT
 * ==================================
 * 
 * Helps identify and fix common Vercel deployment issues
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

class VercelDeploymentDebugger {
  private rootDir: string;

  constructor() {
    this.rootDir = process.cwd();
  }

  /**
   * Run comprehensive deployment debugging
   */
  async debug(): Promise<void> {
    console.log('🔍 Debugging Vercel deployment issues...\n');

    // Check build output
    await this.checkBuildOutput();
    
    // Check routing configuration
    await this.checkRoutingConfig();
    
    // Check index.html
    await this.checkIndexHtml();
    
    // Check for common issues
    await this.checkCommonIssues();
    
    // Provide recommendations
    await this.provideRecommendations();
  }

  /**
   * Check build output structure
   */
  private async checkBuildOutput(): Promise<void> {
    console.log('📁 Checking build output...');
    
    const distDir = join(this.rootDir, 'dist/public');
    
    if (!existsSync(distDir)) {
      console.log('❌ Build output directory not found: dist/public');
      console.log('   Run: npm run build');
      return;
    }
    
    console.log('✅ Build output directory exists');
    
    // Check for index.html
    const indexPath = join(distDir, 'index.html');
    if (!existsSync(indexPath)) {
      console.log('❌ index.html not found in build output');
      return;
    }
    
    console.log('✅ index.html found');
    
    // Check for JavaScript files
    const jsDir = join(distDir, 'js');
    if (existsSync(jsDir)) {
      const jsFiles = readdirSync(jsDir).filter(f => f.endsWith('.js'));
      console.log(`✅ Found ${jsFiles.length} JavaScript files`);
    } else {
      console.log('⚠️  No js directory found - checking for assets');
      const files = readdirSync(distDir);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      console.log(`   Found ${jsFiles.length} JavaScript files in root`);
    }
    
    // Check build size
    try {
      const stats = execSync(`du -sh "${distDir}"`, { encoding: 'utf8' });
      console.log(`📊 Build size: ${stats.trim()}`);
    } catch {
      console.log('📊 Could not determine build size');
    }
    
    console.log('');
  }

  /**
   * Check routing configuration
   */
  private async checkRoutingConfig(): Promise<void> {
    console.log('🛣️  Checking routing configuration...');
    
    // Check vercel.json
    const vercelConfigPath = join(this.rootDir, 'vercel.json');
    if (!existsSync(vercelConfigPath)) {
      console.log('❌ vercel.json not found');
      return;
    }
    
    try {
      const config = JSON.parse(readFileSync(vercelConfigPath, 'utf8'));
      
      // Check for rewrites (modern approach)
      if (config.rewrites) {
        const hasIndexRewrite = config.rewrites.some((r: any) => 
          r.source === '/(.*)'  && r.destination === '/index.html'
        );
        
        if (hasIndexRewrite) {
          console.log('✅ Correct rewrite rule found for SPA routing');
        } else {
          console.log('❌ Missing SPA rewrite rule');
          console.log('   Add: {"source": "/(.*)", "destination": "/index.html"}');
        }
      }
      
      // Check for old routes format
      if (config.routes) {
        console.log('⚠️  Using legacy routes format - consider upgrading to rewrites');
        const hasCatchAll = config.routes.some((r: any) => 
          r.src === '/(.*)'  && r.dest === '/index.html'
        );
        
        if (hasCatchAll) {
          console.log('✅ Catch-all route found');
        } else {
          console.log('❌ Missing catch-all route for SPA');
        }
      }
      
      // Check output directory
      if (config.outputDirectory) {
        console.log(`📂 Output directory: ${config.outputDirectory}`);
        if (config.outputDirectory !== 'dist/public') {
          console.log('⚠️  Output directory might not match Vite build output');
        }
      }
      
    } catch (error) {
      console.log('❌ Error reading vercel.json:', error.message);
    }
    
    console.log('');
  }

  /**
   * Check index.html content
   */
  private async checkIndexHtml(): Promise<void> {
    console.log('📄 Checking index.html...');
    
    const indexPath = join(this.rootDir, 'index.html');
    if (!existsSync(indexPath)) {
      console.log('❌ index.html not found in root');
      return;
    }
    
    const content = readFileSync(indexPath, 'utf8');
    
    // Check for root div
    if (content.includes('<div id="root">')) {
      console.log('✅ Root div found');
    } else {
      console.log('❌ Root div not found - React needs <div id="root"></div>');
    }
    
    // Check for script tag
    if (content.includes('src="/src/main.tsx"') || content.includes('src="/src/main.jsx"')) {
      console.log('✅ Main script reference found');
    } else {
      console.log('❌ Main script reference not found');
    }
    
    // Check for base tag (can cause issues)
    if (content.includes('<base')) {
      console.log('⚠️  Base tag found - this can cause routing issues');
    }
    
    console.log('');
  }

  /**
   * Check for common issues
   */
  private async checkCommonIssues(): Promise<void> {
    console.log('🔧 Checking for common issues...');
    
    // Check main.tsx/jsx
    const mainTsxPath = join(this.rootDir, 'src/main.tsx');
    const mainJsxPath = join(this.rootDir, 'src/main.jsx');
    
    const mainPath = existsSync(mainTsxPath) ? mainTsxPath : 
                     existsSync(mainJsxPath) ? mainJsxPath : null;
    
    if (!mainPath) {
      console.log('❌ Main entry file not found (src/main.tsx or src/main.jsx)');
      return;
    }
    
    const mainContent = readFileSync(mainPath, 'utf8');
    
    // Check for BrowserRouter
    if (mainContent.includes('BrowserRouter') || mainContent.includes('Router')) {
      console.log('✅ Router setup found in main file');
    } else {
      console.log('⚠️  Router setup not found in main file - check App component');
    }
    
    // Check for root element access
    if (mainContent.includes('getElementById("root")')) {
      console.log('✅ Root element access found');
    } else {
      console.log('❌ Root element access not found');
    }
    
    // Check package.json scripts
    const packagePath = join(this.rootDir, 'package.json');
    if (existsSync(packagePath)) {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      if (pkg.scripts?.build) {
        console.log(`✅ Build script: ${pkg.scripts.build}`);
      } else {
        console.log('❌ No build script found');
      }
      
      if (pkg.scripts?.preview) {
        console.log(`✅ Preview script: ${pkg.scripts.preview}`);
      }
    }
    
    console.log('');
  }

  /**
   * Provide specific recommendations
   */
  private async provideRecommendations(): Promise<void> {
    console.log('💡 Recommendations:');
    console.log('');
    
    console.log('1. 🔧 Fix vercel.json (if using modern format):');
    console.log('   {');
    console.log('     "buildCommand": "npm run build",');
    console.log('     "outputDirectory": "dist/public",');
    console.log('     "rewrites": [');
    console.log('       {"source": "/(.*)", "destination": "/index.html"}');
    console.log('     ]');
    console.log('   }');
    console.log('');
    
    console.log('2. 🏗️  Test build locally:');
    console.log('   npm run build');
    console.log('   npm run preview');
    console.log('   # Visit http://localhost:4173 and test routing');
    console.log('');
    
    console.log('3. 🔍 Debug in browser:');
    console.log('   • Open browser dev tools');
    console.log('   • Check Console for JavaScript errors');
    console.log('   • Check Network tab for failed requests');
    console.log('   • Verify index.html loads correctly');
    console.log('');
    
    console.log('4. 📱 Test deployment:');
    console.log('   • Visit your Vercel URL');
    console.log('   • Try navigating to /about or other routes');
    console.log('   • Refresh the page on a sub-route');
    console.log('   • Check if it shows your app or 404');
    console.log('');
    
    console.log('5. 🚀 Redeploy:');
    console.log('   vercel --prod');
    console.log('   # Or push to your connected Git repository');
    console.log('');
    
    console.log('6. 🆘 If still having issues:');
    console.log('   • Check Vercel build logs for errors');
    console.log('   • Try deploying with: vercel --debug');
    console.log('   • Verify environment variables are set');
    console.log('   • Check if the issue is build-related or routing-related');
  }
}

/**
 * CLI Interface
 */
async function main() {
  try {
    const vercelDebugger = new VercelDeploymentDebugger();
    await vercelDebugger.debug();
  } catch (error) {
    console.error('Debugging failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { VercelDeploymentDebugger };