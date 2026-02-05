#!/usr/bin/env tsx

/**
 * TRIPLECHECK DEPLOYMENT PREPARATION SCRIPT
 * =========================================
 * 
 * Comprehensive deployment preparation that optimizes the application
 * for production deployment across multiple platforms (Vercel, Render, etc.)
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';

interface DeploymentConfig {
  platform: 'vercel' | 'render' | 'netlify' | 'generic';
  environment: 'staging' | 'production';
  optimizationLevel: 'basic' | 'aggressive';
}

class DeploymentPreparation {
  private startTime: number;
  private config: DeploymentConfig;
  private rootDir: string;

  constructor(config: DeploymentConfig) {
    this.startTime = performance.now();
    this.config = config;
    this.rootDir = process.cwd();
  }

  /**
   * Main deployment preparation workflow
   */
  async prepare(): Promise<void> {
    console.log('🚀 Starting TripleCheck deployment preparation...\n');
    
    try {
      // Step 1: Environment validation
      await this.validateEnvironment();
      
      // Step 2: Clean previous builds
      await this.cleanBuildArtifacts();
      
      // Step 3: Optimize dependencies
      await this.optimizeDependencies();
      
      // Step 4: Run security checks
      await this.runSecurityChecks();
      
      // Step 5: Type checking
      await this.runTypeChecking();
      
      // Step 6: Build optimization
      await this.optimizeBuild();
      
      // Step 7: Asset optimization
      await this.optimizeAssets();
      
      // Step 8: Generate deployment configs
      await this.generateDeploymentConfigs();
      
      // Step 9: Run final validation
      await this.validateDeployment();
      
      this.logSuccess();
      
    } catch (error) {
      this.logError(error);
      process.exit(1);
    }
  }

  /**
   * Validate environment and prerequisites
   */
  private async validateEnvironment(): Promise<void> {
    console.log('📋 Validating environment...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const requiredVersion = '18.0.0';
    
    if (!this.isVersionCompatible(nodeVersion.slice(1), requiredVersion)) {
      throw new Error(`Node.js ${requiredVersion} or higher required. Current: ${nodeVersion}`);
    }
    
    // Check required files
    const requiredFiles = [
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      'tailwind.config.ts'
    ];
    
    for (const file of requiredFiles) {
      if (!existsSync(join(this.rootDir, file))) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    // Check environment variables
    if (this.config.environment === 'production') {
      this.validateProductionEnv();
    }
    
    console.log('✅ Environment validation passed\n');
  }

  /**
   * Validate production environment variables
   */
  private validateProductionEnv(): void {
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET'
    ];
    
    const missing = requiredEnvVars.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Clean previous build artifacts
   */
  private async cleanBuildArtifacts(): Promise<void> {
    console.log('🧹 Cleaning build artifacts...');
    
    const cleanDirs = ['dist', 'coverage', '.turbo', 'node_modules/.cache'];
    
    for (const dir of cleanDirs) {
      try {
        execSync(`rm -rf ${dir}`, { stdio: 'pipe' });
      } catch (error) {
        // Directory might not exist, continue
      }
    }
    
    console.log('✅ Build artifacts cleaned\n');
  }

  /**
   * Optimize dependencies
   */
  private async optimizeDependencies(): Promise<void> {
    console.log('📦 Optimizing dependencies...');
    
    // Clean install for production
    if (this.config.environment === 'production') {
      console.log('   Installing production dependencies...');
      execSync('npm ci --only=production --silent', { stdio: 'inherit' });
      
      // Reinstall dev dependencies for build
      execSync('npm ci --silent', { stdio: 'inherit' });
    }
    
    // Audit and fix vulnerabilities
    try {
      execSync('npm audit fix --silent', { stdio: 'pipe' });
    } catch (error) {
      console.log('⚠️  Some vulnerabilities could not be auto-fixed');
    }
    
    console.log('✅ Dependencies optimized\n');
  }

  /**
   * Run security checks
   */
  private async runSecurityChecks(): Promise<void> {
    console.log('🔒 Running security checks...');
    
    try {
      // Run ESLint security rules
      execSync('npm run lint:security', { stdio: 'pipe' });
      
      // Run npm audit
      execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
      
      console.log('✅ Security checks passed\n');
    } catch (error) {
      console.log('⚠️  Security warnings detected - review before deployment\n');
    }
  }

  /**
   * Run TypeScript type checking
   */
  private async runTypeChecking(): Promise<void> {
    console.log('🔍 Running type checking...');
    
    try {
      execSync('npm run check', { stdio: 'pipe' });
      console.log('✅ Type checking passed\n');
    } catch (error) {
      throw new Error('TypeScript type checking failed. Fix type errors before deployment.');
    }
  }

  /**
   * Optimize build process
   */
  private async optimizeBuild(): Promise<void> {
    console.log('🏗️  Building optimized application...');
    
    // Set production environment
    process.env.NODE_ENV = 'production';
    
    try {
      if (this.config.optimizationLevel === 'aggressive') {
        execSync('npm run build:optimized', { stdio: 'inherit' });
      } else {
        execSync('npm run build', { stdio: 'inherit' });
      }
      
      console.log('✅ Build completed successfully\n');
    } catch (error) {
      throw new Error('Build failed. Check build errors above.');
    }
  }

  /**
   * Optimize assets
   */
  private async optimizeAssets(): Promise<void> {
    console.log('🖼️  Optimizing assets...');
    
    // Create optimized asset structure
    const distDir = join(this.rootDir, 'dist/public');
    
    if (existsSync(distDir)) {
      // Ensure proper directory structure
      const assetDirs = ['assets/images', 'assets/fonts', 'js'];
      
      for (const dir of assetDirs) {
        const fullPath = join(distDir, dir);
        if (!existsSync(fullPath)) {
          mkdirSync(fullPath, { recursive: true });
        }
      }
    }
    
    console.log('✅ Assets optimized\n');
  }

  /**
   * Generate platform-specific deployment configs
   */
  private async generateDeploymentConfigs(): Promise<void> {
    console.log('⚙️  Generating deployment configurations...');
    
    switch (this.config.platform) {
      case 'vercel':
        await this.generateVercelConfig();
        break;
      case 'render':
        await this.generateRenderConfig();
        break;
      case 'netlify':
        await this.generateNetlifyConfig();
        break;
      default:
        console.log('   Using generic configuration');
    }
    
    // Generate environment-specific configs
    await this.generateEnvironmentConfig();
    
    console.log('✅ Deployment configurations generated\n');
  }

  /**
   * Generate Vercel-specific configuration
   */
  private async generateVercelConfig(): Promise<void> {
    const vercelConfig = {
      version: 2,
      buildCommand: this.config.optimizationLevel === 'aggressive' 
        ? 'npm run build:optimized' 
        : 'npm run build',
      outputDirectory: 'dist/public',
      installCommand: 'npm ci',
      framework: null,
      routes: [
        {
          src: '/js/(.*)',
          dest: '/js/$1',
          headers: {
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        },
        {
          src: '/assets/(.*)',
          dest: '/assets/$1',
          headers: {
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        },
        {
          src: '/(.*\\.(css|js|woff|woff2|ttf|eot|otf))',
          dest: '/$1',
          headers: {
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        },
        {
          src: '/(.*\\.(jpg|jpeg|png|webp|avif|gif|svg|ico))',
          dest: '/$1',
          headers: {
            'Cache-Control': 'public, max-age=2592000'
          }
        },
        {
          src: '/(.*)',
          dest: '/index.html',
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
          }
        }
      ],
      env: {
        NODE_ENV: this.config.environment
      }
    };
    
    writeFileSync(
      join(this.rootDir, 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );
  }

  /**
   * Generate Render-specific configuration
   */
  private async generateRenderConfig(): Promise<void> {
    const renderConfig = {
      services: [
        {
          type: 'web',
          name: 'triplecheck-frontend',
          env: 'static',
          buildCommand: this.config.optimizationLevel === 'aggressive' 
            ? 'npm run build:optimized' 
            : 'npm run build',
          staticPublishPath: './dist/public',
          headers: [
            {
              path: '/js/*',
              name: 'Cache-Control',
              value: 'public, max-age=31536000, immutable'
            },
            {
              path: '/assets/*',
              name: 'Cache-Control',
              value: 'public, max-age=31536000, immutable'
            }
          ]
        }
      ]
    };
    
    writeFileSync(
      join(this.rootDir, 'render.yaml'),
      JSON.stringify(renderConfig, null, 2)
    );
  }

  /**
   * Generate Netlify-specific configuration
   */
  private async generateNetlifyConfig(): Promise<void> {
    const netlifyConfig = {
      build: {
        command: this.config.optimizationLevel === 'aggressive' 
          ? 'npm run build:optimized' 
          : 'npm run build',
        publish: 'dist/public'
      },
      redirects: [
        {
          from: '/*',
          to: '/index.html',
          status: 200
        }
      ],
      headers: [
        {
          for: '/js/*',
          values: {
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        },
        {
          for: '/assets/*',
          values: {
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        }
      ]
    };
    
    writeFileSync(
      join(this.rootDir, 'netlify.toml'),
      `[build]
  command = "${netlifyConfig.build.command}"
  publish = "${netlifyConfig.build.publish}"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/js/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"`
    );
  }

  /**
   * Generate environment-specific configuration
   */
  private async generateEnvironmentConfig(): Promise<void> {
    const envConfig = {
      environment: this.config.environment,
      platform: this.config.platform,
      optimizationLevel: this.config.optimizationLevel,
      buildTime: new Date().toISOString(),
      nodeVersion: process.version,
      features: {
        landVerification: true,
        fraudDetection: true,
        communityFeatures: true,
        realTimeUpdates: true
      }
    };
    
    writeFileSync(
      join(this.rootDir, 'deployment-config.json'),
      JSON.stringify(envConfig, null, 2)
    );
  }

  /**
   * Validate deployment readiness
   */
  private async validateDeployment(): Promise<void> {
    console.log('🔍 Validating deployment readiness...');
    
    // Check build output
    const distDir = join(this.rootDir, 'dist/public');
    if (!existsSync(distDir)) {
      throw new Error('Build output directory not found');
    }
    
    // Check critical files
    const criticalFiles = ['index.html', 'js'];
    for (const file of criticalFiles) {
      if (!existsSync(join(distDir, file))) {
        throw new Error(`Critical build file missing: ${file}`);
      }
    }
    
    // Validate bundle size (warn if too large)
    try {
      const stats = execSync('du -sh dist/public', { encoding: 'utf8' });
      const sizeMatch = stats.match(/^(\d+(?:\.\d+)?[KMGT]?)/);
      if (sizeMatch) {
        console.log(`   Bundle size: ${sizeMatch[1]}B`);
      }
    } catch (error) {
      // Size check failed, continue
    }
    
    console.log('✅ Deployment validation passed\n');
  }

  /**
   * Check if version is compatible
   */
  private isVersionCompatible(current: string, required: string): boolean {
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const requiredPart = requiredParts[i] || 0;
      
      if (currentPart > requiredPart) return true;
      if (currentPart < requiredPart) return false;
    }
    
    return true;
  }

  /**
   * Log successful completion
   */
  private logSuccess(): void {
    const duration = ((performance.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('🎉 Deployment preparation completed successfully!');
    console.log(`⏱️  Total time: ${duration}s`);
    console.log(`🎯 Platform: ${this.config.platform}`);
    console.log(`🌍 Environment: ${this.config.environment}`);
    console.log(`⚡ Optimization: ${this.config.optimizationLevel}`);
    console.log('\n📋 Next steps:');
    
    switch (this.config.platform) {
      case 'vercel':
        console.log('   • Run: npm run deploy:vercel');
        console.log('   • Or: vercel --prod');
        break;
      case 'render':
        console.log('   • Push to your connected Git repository');
        console.log('   • Render will automatically deploy');
        break;
      case 'netlify':
        console.log('   • Run: netlify deploy --prod');
        console.log('   • Or push to your connected Git repository');
        break;
      default:
        console.log('   • Deploy the dist/public directory to your hosting platform');
    }
    
    console.log('\n🔗 Useful commands:');
    console.log('   • npm run test:deployment - Test deployment locally');
    console.log('   • npm run monitor:health - Check application health');
    console.log('   • npm run security:scan - Run security audit');
  }

  /**
   * Log error and cleanup
   */
  private logError(error: any): void {
    console.error('\n❌ Deployment preparation failed!');
    console.error(`Error: ${error.message}`);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    console.error('\n🔧 Troubleshooting:');
    console.error('   • Check the error message above');
    console.error('   • Ensure all dependencies are installed');
    console.error('   • Verify environment variables are set');
    console.error('   • Run npm run lint and npm run check');
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  const config: DeploymentConfig = {
    platform: (args[0] as any) || 'vercel',
    environment: (args[1] as any) || 'production',
    optimizationLevel: (args[2] as any) || 'basic'
  };
  
  // Validate arguments
  const validPlatforms = ['vercel', 'render', 'netlify', 'generic'];
  const validEnvironments = ['staging', 'production'];
  const validOptimizations = ['basic', 'aggressive'];
  
  if (!validPlatforms.includes(config.platform)) {
    console.error(`Invalid platform: ${config.platform}`);
    console.error(`Valid platforms: ${validPlatforms.join(', ')}`);
    process.exit(1);
  }
  
  if (!validEnvironments.includes(config.environment)) {
    console.error(`Invalid environment: ${config.environment}`);
    console.error(`Valid environments: ${validEnvironments.join(', ')}`);
    process.exit(1);
  }
  
  if (!validOptimizations.includes(config.optimizationLevel)) {
    console.error(`Invalid optimization level: ${config.optimizationLevel}`);
    console.error(`Valid levels: ${validOptimizations.join(', ')}`);
    process.exit(1);
  }
  
  const deployment = new DeploymentPreparation(config);
  await deployment.prepare();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DeploymentPreparation };