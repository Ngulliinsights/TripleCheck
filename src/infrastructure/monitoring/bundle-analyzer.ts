/**
 * Bundle analyzer integration for identifying optimization opportunities
 * Provides runtime bundle analysis and optimization recommendations
 */

export interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  modules: ModuleInfo[];
  duplicates: DuplicateModule[];
  unusedExports: UnusedExport[];
  recommendations: OptimizationRecommendation[];
  timestamp: number;
}

export interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  isEntry: boolean;
  isAsync: boolean;
  loadTime?: number;
}

export interface ModuleInfo {
  name: string;
  size: number;
  chunks: string[];
  reasons: string[];
  isVendor: boolean;
  isUnused?: boolean;
}

export interface DuplicateModule {
  name: string;
  chunks: string[];
  totalSize: number;
  instances: number;
}

export interface UnusedExport {
  module: string;
  exports: string[];
  potentialSavings: number;
}

export interface OptimizationRecommendation {
  type: 'chunk-splitting' | 'tree-shaking' | 'compression' | 'lazy-loading' | 'duplicate-removal';
  priority: 'high' | 'medium' | 'low';
  description: string;
  potentialSavings: number;
  implementation: string;
}

class BundleAnalyzer {
  private metrics: BundleMetrics | null = null;
  private performanceEntries: PerformanceEntry[] = [];
  private chunkLoadTimes: Map<string, number> = new Map();

  constructor() {
    this.initializeTracking();
  }

  private initializeTracking(): void {
    if (typeof window === 'undefined') return;

    // Track resource loading
    this.trackResourceLoading();
    
    // Track dynamic imports
    this.trackDynamicImports();
    
    // Analyze bundle on page load
    if (document.readyState === 'complete') {
      this.analyzeBundleMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.analyzeBundleMetrics(), 1000);
      });
    }
  }

  private trackResourceLoading(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.performanceEntries.push(...entries);
        
        entries.forEach((entry) => {
          if (entry.name.includes('.js') && entry.name.includes('chunk')) {
            const chunkName = this.extractChunkName(entry.name);
            if (chunkName) {
              this.chunkLoadTimes.set(chunkName, entry.duration || 0);
            }
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Failed to track resource loading:', error);
    }
  }

  private trackDynamicImports(): void {
    // Override dynamic import to track chunk loading
    if (typeof window !== 'undefined' && 'import' in window) {
      const originalImport = window.import;
      
      // Note: This is a conceptual implementation
      // In practice, this would be handled by the bundler
      console.log('Dynamic import tracking initialized');
    }
  }

  private extractChunkName(url: string): string | null {
    const match = url.match(/\/([^\/]+)\.chunk\.[a-f0-9]+\.js$/);
    return match ? match[1] : null;
  }

  public async analyzeBundleMetrics(): Promise<BundleMetrics> {
    const chunks = this.analyzeChunks();
    const modules = this.analyzeModules();
    const duplicates = this.findDuplicateModules(modules);
    const unusedExports = this.findUnusedExports();
    const recommendations = this.generateRecommendations(chunks, modules, duplicates);

    this.metrics = {
      totalSize: this.calculateTotalSize(chunks),
      gzippedSize: this.estimateGzippedSize(chunks),
      chunks,
      modules,
      duplicates,
      unusedExports,
      recommendations,
      timestamp: Date.now(),
    };

    // Send metrics to analytics
    this.sendMetricsToAnalytics();

    return this.metrics;
  }

  private analyzeChunks(): ChunkInfo[] {
    const chunks: ChunkInfo[] = [];
    
    // Analyze loaded scripts
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    
    scripts.forEach((script) => {
      const src = (script as HTMLScriptElement).src;
      if (!src) return;

      const chunkName = this.extractChunkName(src) || this.extractFileName(src);
      const size = this.estimateScriptSize(script as HTMLScriptElement);
      const loadTime = this.chunkLoadTimes.get(chunkName) || 0;

      chunks.push({
        name: chunkName,
        size,
        gzippedSize: Math.round(size * 0.7), // Estimate
        modules: [], // Would be populated by bundler analysis
        isEntry: src.includes('main') || src.includes('index'),
        isAsync: (script as HTMLScriptElement).async,
        loadTime,
      });
    });

    return chunks;
  }

  private analyzeModules(): ModuleInfo[] {
    // This would typically be populated by bundler analysis
    // For runtime analysis, we can only estimate based on available data
    const modules: ModuleInfo[] = [];
    
    // Analyze performance entries for module information
    this.performanceEntries.forEach((entry) => {
      if (entry.name.includes('node_modules') || entry.name.includes('.js')) {
        const moduleName = this.extractModuleName(entry.name);
        const size = (entry as any).transferSize || 0;
        
        modules.push({
          name: moduleName,
          size,
          chunks: [], // Would be populated by bundler
          reasons: [], // Would be populated by bundler
          isVendor: entry.name.includes('node_modules'),
        });
      }
    });

    return modules;
  }

  private findDuplicateModules(modules: ModuleInfo[]): DuplicateModule[] {
    const duplicates: DuplicateModule[] = [];
    const moduleMap = new Map<string, ModuleInfo[]>();

    // Group modules by name
    modules.forEach((module) => {
      const baseName = module.name.split('/').pop() || module.name;
      if (!moduleMap.has(baseName)) {
        moduleMap.set(baseName, []);
      }
      moduleMap.get(baseName)!.push(module);
    });

    // Find duplicates
    moduleMap.forEach((moduleList, name) => {
      if (moduleList.length > 1) {
        duplicates.push({
          name,
          chunks: moduleList.flatMap(m => m.chunks),
          totalSize: moduleList.reduce((sum, m) => sum + m.size, 0),
          instances: moduleList.length,
        });
      }
    });

    return duplicates;
  }

  private findUnusedExports(): UnusedExport[] {
    // This would require static analysis or bundler integration
    // For now, return empty array as this is complex to implement at runtime
    return [];
  }

  private generateRecommendations(
    chunks: ChunkInfo[],
    modules: ModuleInfo[],
    duplicates: DuplicateModule[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Large chunk recommendations
    chunks.forEach((chunk) => {
      if (chunk.size > 500000) { // 500KB
        recommendations.push({
          type: 'chunk-splitting',
          priority: 'high',
          description: `Chunk "${chunk.name}" is large (${this.formatSize(chunk.size)}). Consider splitting it.`,
          potentialSavings: Math.round(chunk.size * 0.3),
          implementation: 'Use dynamic imports or configure chunk splitting in your bundler',
        });
      }
    });

    // Duplicate module recommendations
    duplicates.forEach((duplicate) => {
      if (duplicate.instances > 1) {
        recommendations.push({
          type: 'duplicate-removal',
          priority: 'medium',
          description: `Module "${duplicate.name}" is duplicated ${duplicate.instances} times`,
          potentialSavings: Math.round(duplicate.totalSize * 0.8),
          implementation: 'Configure bundler to deduplicate modules or use a shared chunk',
        });
      }
    });

    // Vendor chunk recommendations
    const vendorModules = modules.filter(m => m.isVendor);
    const totalVendorSize = vendorModules.reduce((sum, m) => sum + m.size, 0);
    
    if (totalVendorSize > 1000000) { // 1MB
      recommendations.push({
        type: 'chunk-splitting',
        priority: 'high',
        description: `Vendor bundle is large (${this.formatSize(totalVendorSize)}). Consider splitting by usage frequency.`,
        potentialSavings: Math.round(totalVendorSize * 0.4),
        implementation: 'Split vendor chunks by framework, utilities, and rarely-used libraries',
      });
    }

    // Compression recommendations
    const uncompressedSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const compressedSize = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);
    const compressionRatio = compressedSize / uncompressedSize;

    if (compressionRatio > 0.8) {
      recommendations.push({
        type: 'compression',
        priority: 'medium',
        description: 'Bundle compression ratio is low. Consider enabling better compression.',
        potentialSavings: Math.round(uncompressedSize * 0.3),
        implementation: 'Enable Brotli compression or optimize gzip settings',
      });
    }

    // Lazy loading recommendations
    const syncChunks = chunks.filter(chunk => !chunk.isAsync && !chunk.isEntry);
    if (syncChunks.length > 3) {
      recommendations.push({
        type: 'lazy-loading',
        priority: 'medium',
        description: `${syncChunks.length} chunks are loaded synchronously. Consider lazy loading.`,
        potentialSavings: syncChunks.reduce((sum, chunk) => sum + chunk.size, 0) * 0.5,
        implementation: 'Use React.lazy() or dynamic imports for route-based code splitting',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private calculateTotalSize(chunks: ChunkInfo[]): number {
    return chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  }

  private estimateGzippedSize(chunks: ChunkInfo[]): number {
    return chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);
  }

  private estimateScriptSize(script: HTMLScriptElement): number {
    // This is an estimation - in practice, you'd get this from bundler stats
    const src = script.src;
    if (src.includes('vendor') || src.includes('node_modules')) {
      return 300000; // 300KB estimate for vendor chunks
    }
    if (src.includes('main') || src.includes('index')) {
      return 150000; // 150KB estimate for main chunks
    }
    return 50000; // 50KB estimate for other chunks
  }

  private extractFileName(url: string): string {
    return url.split('/').pop()?.split('.')[0] || 'unknown';
  }

  private extractModuleName(url: string): string {
    if (url.includes('node_modules')) {
      const match = url.match(/node_modules\/([^\/]+)/);
      return match ? match[1] : 'unknown-vendor';
    }
    return this.extractFileName(url);
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private sendMetricsToAnalytics(): void {
    if (!this.metrics || typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return;
    }

    fetch('/api/analytics/bundle-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...this.metrics,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(error => {
      console.warn('Failed to send bundle metrics to analytics:', error);
    });
  }

  public getMetrics(): BundleMetrics | null {
    return this.metrics;
  }

  public async generateReport(): Promise<{
    summary: {
      totalSize: string;
      gzippedSize: string;
      compressionRatio: string;
      chunkCount: number;
      moduleCount: number;
      duplicateCount: number;
    };
    recommendations: OptimizationRecommendation[];
    potentialSavings: string;
  }> {
    if (!this.metrics) {
      await this.analyzeBundleMetrics();
    }

    if (!this.metrics) {
      throw new Error('Failed to analyze bundle metrics');
    }

    const compressionRatio = ((this.metrics.gzippedSize / this.metrics.totalSize) * 100).toFixed(1);
    const totalPotentialSavings = this.metrics.recommendations.reduce(
      (sum, rec) => sum + rec.potentialSavings,
      0
    );

    return {
      summary: {
        totalSize: this.formatSize(this.metrics.totalSize),
        gzippedSize: this.formatSize(this.metrics.gzippedSize),
        compressionRatio: `${compressionRatio}%`,
        chunkCount: this.metrics.chunks.length,
        moduleCount: this.metrics.modules.length,
        duplicateCount: this.metrics.duplicates.length,
      },
      recommendations: this.metrics.recommendations,
      potentialSavings: this.formatSize(totalPotentialSavings),
    };
  }
}

// Singleton instance
export const bundleAnalyzer = new BundleAnalyzer();

// Development helper for manual analysis
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__bundleAnalyzer = bundleAnalyzer;
}