/**
 * Bundle Optimizer - Intelligent bundle analysis and optimization
 * Implements aggressive optimization strategies for production builds
 */

import { promises as fs } from 'fs';
import path from '..\..\..\scripts\cleanup-redundancies';
import { gzipSync } from 'zlib';
import { glob } from 'glob';

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  recommendations: OptimizationRecommendation[];
}

interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  isAsync: boolean;
}

interface DependencyInfo {
  name: string;
  size: number;
  version: string;
  usage: 'critical' | 'important' | 'optional';
  alternatives?: string[];
}

interface OptimizationRecommendation {
  type: 'dependency' | 'chunk' | 'code';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedSavings: number;
  implementation: string;
}

export class BundleOptimizer {
  private distPath: string;
  private packageJsonPath: string;

  constructor(distPath = 'dist', packageJsonPath = 'package.json') {
    this.distPath = distPath;
    this.packageJsonPath = packageJsonPath;
  }

  /**
   * Analyze current bundle and provide optimization recommendations
   */
  async analyzeBundleOptimization(): Promise<BundleAnalysis> {
    const chunks = await this.analyzeChunks();
    const dependencies = await this.analyzeDependencies();
    const recommendations = this.generateRecommendations(chunks, dependencies);

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const gzippedSize = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);

    return {
      totalSize,
      gzippedSize,
      chunks,
      dependencies,
      recommendations
    };
  }

  /**
   * Analyze individual chunks for optimization opportunities
   */
  private async analyzeChunks(): Promise<ChunkInfo[]> {
    const chunks: ChunkInfo[] = [];
    
    try {
      const jsFiles = await glob(`${this.distPath}/**/*.js`);
      
      for (const filePath of jsFiles) {
        const content = await fs.readFile(filePath, 'utf-8');
        const size = Buffer.byteLength(content, 'utf-8');
        const gzippedSize = gzipSync(content).length;
        
        const fileName = path.basename(filePath);
        const isAsync = fileName.includes('async') || fileName.includes('lazy');
        
        // Extract module information from the bundle
        const modules = this.extractModulesFromChunk(content);
        
        chunks.push({
          name: fileName,
          size,
          gzippedSize,
          modules,
          isAsync
        });
      }
    } catch (error) {
      console.warn('Could not analyze chunks:', error);
    }

    return chunks.sort((a, b) => b.size - a.size);
  }

  /**
   * Analyze dependencies for optimization opportunities
   */
  private async analyzeDependencies(): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = [];
    
    try {
      const packageJson = JSON.parse(await fs.readFile(this.packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Known heavy dependencies and their alternatives
      const heavyDependencies = {
        'moment': {
          size: 70000,
          alternatives: ['dayjs', 'date-fns'],
          usage: 'optional' as const
        },
        'lodash': {
          size: 142000,
          alternatives: ['lodash-es', 'ramda'],
          usage: 'important' as const
        },
        'three': {
          size: 500000,
          alternatives: ['@babylonjs/core'],
          usage: 'optional' as const
        },
        'chart.js': {
          size: 180000,
          alternatives: ['recharts', 'victory'],
          usage: 'important' as const
        },
        'react-router-dom': {
          size: 45000,
          alternatives: ['wouter', '@reach/router'],
          usage: 'critical' as const
        }
      };

      for (const [name, version] of Object.entries(deps)) {
        const depInfo = heavyDependencies[name as keyof typeof heavyDependencies];
        
        if (depInfo) {
          dependencies.push({
            name,
            size: depInfo.size,
            version: version as string,
            usage: depInfo.usage,
            alternatives: depInfo.alternatives
          });
        }
      }
    } catch (error) {
      console.warn('Could not analyze dependencies:', error);
    }

    return dependencies.sort((a, b) => b.size - a.size);
  }

  /**
   * Generate optimization recommendations based on analysis
   */
  private generateRecommendations(
    chunks: ChunkInfo[], 
    dependencies: DependencyInfo[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Dependency optimization recommendations
    for (const dep of dependencies) {
      if (dep.size > 50000 && dep.alternatives && dep.alternatives.length > 0) {
        recommendations.push({
          type: 'dependency',
          priority: dep.usage === 'optional' ? 'high' : 'medium',
          description: `Replace ${dep.name} with lighter alternative`,
          estimatedSavings: dep.size * 0.7, // Estimate 70% savings
          implementation: `npm uninstall ${dep.name} && npm install ${dep.alternatives[0]}`
        });
      }
    }

    // Chunk optimization recommendations
    const largeChunks = chunks.filter(chunk => chunk.size > 100000 && !chunk.isAsync);
    for (const chunk of largeChunks) {
      recommendations.push({
        type: 'chunk',
        priority: 'medium',
        description: `Split large chunk ${chunk.name} into smaller async chunks`,
        estimatedSavings: chunk.size * 0.3, // Estimate 30% improvement in loading
        implementation: 'Implement dynamic imports for heavy components'
      });
    }

    // Code optimization recommendations
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    if (totalSize > 1000000) { // 1MB threshold
      recommendations.push({
        type: 'code',
        priority: 'high',
        description: 'Bundle size exceeds 1MB - implement tree shaking and dead code elimination',
        estimatedSavings: totalSize * 0.2, // Estimate 20% savings
        implementation: 'Configure Vite with aggressive tree shaking and minification'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Extract module names from a bundled chunk
   */
  private extractModulesFromChunk(content: string): string[] {
    const modules: string[] = [];
    
    // Look for common module patterns in bundled code
    const modulePatterns = [
      /node_modules\/([^\/]+)/g,
      /from\s+["']([^"']+)["']/g,
      /import\s+.*?from\s+["']([^"']+)["']/g
    ];

    for (const pattern of modulePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const moduleName = match[1];
        if (moduleName && !modules.includes(moduleName)) {
          modules.push(moduleName);
        }
      }
    }

    return modules.slice(0, 20); // Limit to top 20 modules
  }

  /**
   * Generate optimized Vite configuration
   */
  generateOptimizedViteConfig(): string {
    return `
import { defineConfig } from '..\..\..\scripts\generate-test-chunks';
import react from '..\..\..\scripts\cleanup-redundancies';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: {
        safari10: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for stable dependencies
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('three') || id.includes('chart')) {
              return 'heavy-libs';
            }
            if (id.includes('lodash') || id.includes('date-fns')) {
              return 'utils';
            }
            return 'vendor';
          }
          
          // Feature-based chunks
          if (id.includes('fraud-detection')) {
            return 'fraud-detection';
          }
          if (id.includes('land-verification')) {
            return 'land-verification';
          }
          if (id.includes('property')) {
            return 'property';
          }
        }
      }
    },
    chunkSizeWarningLimit: 500,
    reportCompressedSize: false // Faster builds
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query'
    ],
    exclude: [
      'three', // Load dynamically
      '@tensorflow/tfjs-node' // Optional dependency
    ]
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    __DEV__: process.env.NODE_ENV === 'development'
  }
});`;
  }

  /**
   * Generate package.json optimization script
   */
  generateOptimizationScript(): string {
    return `
{
  "scripts": {
    "analyze:bundle": "npm run build && npx vite-bundle-analyzer dist",
    "optimize:deps": "npm-check-updates -u && npm install",
    "optimize:bundle": "npm run build && node scripts/bundle-optimizer.js",
    "build:optimized": "NODE_ENV=production npm run build && npm run optimize:bundle"
  }
}`;
  }

  /**
   * Execute bundle optimization
   */
  async optimizeBundle(): Promise<void> {
    console.log('🚀 Starting bundle optimization...');
    
    const analysis = await this.analyzeBundleOptimization();
    
    console.log(`📊 Bundle Analysis:`);
    console.log(`   Total Size: ${(analysis.totalSize / 1024).toFixed(2)} KB`);
    console.log(`   Gzipped: ${(analysis.gzippedSize / 1024).toFixed(2)} KB`);
    console.log(`   Chunks: ${analysis.chunks.length}`);
    
    console.log(`\n💡 Optimization Recommendations:`);
    for (const rec of analysis.recommendations.slice(0, 5)) {
      const savings = (rec.estimatedSavings / 1024).toFixed(2);
      console.log(`   ${rec.priority.toUpperCase()}: ${rec.description}`);
      console.log(`   Estimated savings: ${savings} KB`);
      console.log(`   Implementation: ${rec.implementation}\n`);
    }

    // Generate optimized configuration files
    const viteConfig = this.generateOptimizedViteConfig();
    await fs.writeFile('vite.config.optimized.ts', viteConfig);
    
    console.log('✅ Bundle optimization analysis complete!');
    console.log('📝 Generated vite.config.optimized.ts');
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new BundleOptimizer();
  optimizer.optimizeBundle().catch(console.error);
}