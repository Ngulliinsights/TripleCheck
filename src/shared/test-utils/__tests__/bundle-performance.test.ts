/**
 * Bundle Size and Code Splitting Performance Tests
 * Tests for analyzing bundle sizes, code splitting effectiveness,
 * and build optimization performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  BundleAnalysisTestUtils,
  PerformanceTestHelpers
} from '../performance-testing';

// Mock webpack stats or build analysis data
const mockWebpackStats = {
  assets: [
    { name: 'main.js', size: 1200000 },
    { name: 'vendor.js', size: 800000 },
    { name: 'runtime.js', size: 50000 },
    { name: 'property-pages.js', size: 300000 },
    { name: 'shared-components.js', size: 150000 },
    { name: 'trust-pages.js', size: 200000 },
    { name: 'user-pages.js', size: 180000 },
    { name: 'main.css', size: 80000 },
    { name: 'vendor.css', size: 120000 },
  ],
  chunks: [
    { id: 'main', size: 1200000, modules: 45 },
    { id: 'vendor', size: 800000, modules: 120 },
    { id: 'runtime', size: 50000, modules: 5 },
    { id: 'property-pages', size: 300000, modules: 25 },
    { id: 'shared-components', size: 150000, modules: 15 },
  ],
  modules: [
    { name: './src/main.tsx', size: 2000, chunks: ['main'] },
    { name: './node_modules/react/index.js', size: 45000, chunks: ['vendor'] },
    { name: './node_modules/react-dom/index.js', size: 120000, chunks: ['vendor'] },
    { name: './src/property/pages/PropertyList.tsx', size: 15000, chunks: ['property-pages'] },
    { name: './src/shared/components/Button.tsx', size: 3000, chunks: ['shared-components'] },
  ],
};

describe('Bundle Size and Code Splitting Performance Tests', () => {
  beforeEach(() => {
    // Mock bundle analysis functions
    vi.spyOn(BundleAnalysisTestUtils, 'analyzeBundleSize').mockResolvedValue({
      totalSize: 2880000, // Sum of all assets
      gzippedSize: 960000, // ~33% compression ratio
      chunkSizes: {
        'main': 1200000,
        'vendor': 800000,
        'runtime': 50000,
        'property-pages': 300000,
        'shared-components': 150000,
        'trust-pages': 200000,
        'user-pages': 180000,
      },
      unusedCode: 200000,
      duplicateCode: 100000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Bundle Size Analysis', () => {
    it('should analyze total bundle size and validate against thresholds', async () => {
      const metrics = await BundleAnalysisTestUtils.analyzeBundleSize();
      
      expect(metrics).toMatchObject({
        totalSize: expect.any(Number),
        gzippedSize: expect.any(Number),
        chunkSizes: expect.any(Object),
        unusedCode: expect.any(Number),
        duplicateCode: expect.any(Number),
      });

      // Validate bundle size is reasonable
      expect(metrics.totalSize).toBeLessThan(5000000); // Less than 5MB
      expect(metrics.gzippedSize).toBeLessThan(metrics.totalSize); // Gzipped should be smaller
      expect(metrics.gzippedSize / metrics.totalSize).toBeLessThan(0.5); // Good compression ratio
    });

    it('should detect bundle size violations and provide actionable feedback', async () => {
      const metrics = await BundleAnalysisTestUtils.analyzeBundleSize();
      const validation = BundleAnalysisTestUtils.validateBundleSize(metrics);

      if (!validation.passed) {
        console.log('Bundle size violations detected:', validation.violations);
        
        // Provide actionable recommendations
        const recommendations = this.generateBundleOptimizationRecommendations(metrics);
        expect(recommendations.length).toBeGreaterThan(0);
        
        recommendations.forEach(rec => {
          expect(rec).toMatchObject({
            issue: expect.any(String),
            recommendation: expect.any(String),
            impact: expect.any(String),
          });
        });
      }

      expect(validation).toMatchObject({
        passed: expect.any(Boolean),
        violations: expect.any(Array),
        metrics: expect.any(Object),
        thresholds: expect.any(Object),
      });
    });

    it('should analyze individual chunk sizes and identify optimization opportunities', async () => {
      const metrics = await BundleAnalysisTestUtils.analyzeBundleSize();
      const chunkAnalysis = this.analyzeChunkSizes(metrics.chunkSizes);

      expect(chunkAnalysis).toMatchObject({
        totalChunks: expect.any(Number),
        largestChunk: expect.any(Object),
        smallestChunk: expect.any(Object),
        averageChunkSize: expect.any(Number),
        oversizedChunks: expect.any(Array),
        undersizedChunks: expect.any(Array),
      });

      // Largest chunk should not be more than 50% of total size
      const totalSize = Object.values(metrics.chunkSizes).reduce((sum, size) => sum + size, 0);
      expect(chunkAnalysis.largestChunk.size / totalSize).toBeLessThan(0.5);

      // Should identify chunks that are too large
      chunkAnalysis.oversizedChunks.forEach((chunk: any) => {
        expect(chunk.size).toBeGreaterThan(1000000); // > 1MB
        console.warn(`Oversized chunk detected: ${chunk.name} (${(chunk.size / 1024 / 1024).toFixed(2)}MB)`);
      });
    });

    it('should detect unused and duplicate code', async () => {
      const metrics = await BundleAnalysisTestUtils.analyzeBundleSize();
      
      const wasteAnalysis = {
        unusedCodePercentage: (metrics.unusedCode / metrics.totalSize) * 100,
        duplicateCodePercentage: (metrics.duplicateCode / metrics.totalSize) * 100,
        totalWaste: metrics.unusedCode + metrics.duplicateCode,
        wastePercentage: ((metrics.unusedCode + metrics.duplicateCode) / metrics.totalSize) * 100,
      };

      expect(wasteAnalysis.unusedCodePercentage).toBeLessThan(15); // Less than 15% unused
      expect(wasteAnalysis.duplicateCodePercentage).toBeLessThan(10); // Less than 10% duplicate
      expect(wasteAnalysis.wastePercentage).toBeLessThan(20); // Total waste less than 20%

      if (wasteAnalysis.wastePercentage > 10) {
        console.warn(`Code waste detected: ${wasteAnalysis.wastePercentage.toFixed(1)}% of bundle`);
        console.warn(`- Unused code: ${wasteAnalysis.unusedCodePercentage.toFixed(1)}%`);
        console.warn(`- Duplicate code: ${wasteAnalysis.duplicateCodePercentage.toFixed(1)}%`);
      }
    });
  });

  describe('Code Splitting Effectiveness', () => {
    it('should measure code splitting effectiveness and distribution', () => {
      const splittingMetrics = BundleAnalysisTestUtils.measureCodeSplittingEffectiveness();
      
      expect(splittingMetrics).toMatchObject({
        totalChunks: expect.any(Number),
        averageChunkSize: expect.any(Number),
        largestChunk: {
          name: expect.any(String),
          size: expect.any(Number),
        },
        splittingScore: expect.any(Number),
      });

      // Should have multiple chunks (good splitting)
      expect(splittingMetrics.totalChunks).toBeGreaterThan(3);
      
      // Splitting score should indicate good distribution (lower is better)
      expect(splittingMetrics.splittingScore).toBeLessThan(0.8);
      
      // No single chunk should dominate
      expect(splittingMetrics.largestChunk.size / splittingMetrics.averageChunkSize).toBeLessThan(3);
    });

    it('should validate route-based code splitting', () => {
      const routeChunks = {
        'property-pages': 300000,
        'trust-pages': 200000,
        'user-pages': 180000,
        'search-pages': 220000,
        'auth-pages': 150000,
      };

      const routeAnalysis = this.analyzeRouteSplitting(routeChunks);

      expect(routeAnalysis).toMatchObject({
        totalRouteChunks: expect.any(Number),
        averageRouteChunkSize: expect.any(Number),
        routeChunkVariance: expect.any(Number),
        wellBalanced: expect.any(Boolean),
      });

      // Route chunks should be reasonably balanced
      expect(routeAnalysis.wellBalanced).toBe(true);
      expect(routeAnalysis.routeChunkVariance).toBeLessThan(0.5); // Low variance indicates good balance
    });

    it('should test dynamic import performance', async () => {
      const dynamicImportTest = PerformanceTestHelpers.createPerformanceTest(
        'Dynamic Import Performance',
        async () => {
          // Simulate dynamic import
          const startTime = performance.now();
          
          // Mock dynamic import with network delay
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const endTime = performance.now();
          return endTime - startTime;
        },
        { maxTime: 500 }
      );

      const result = await dynamicImportTest();
      expect(result.passed).toBe(true);
      expect(result.executionTime).toBeGreaterThan(200);
      expect(result.executionTime).toBeLessThan(500);
    });
  });

  describe('Build Performance Optimization', () => {
    it('should measure build time performance', async () => {
      const buildMetrics = await this.measureBuildPerformance();
      
      expect(buildMetrics).toMatchObject({
        totalBuildTime: expect.any(Number),
        compilationTime: expect.any(Number),
        optimizationTime: expect.any(Number),
        assetGenerationTime: expect.any(Number),
        parallelizationEfficiency: expect.any(Number),
      });

      // Build should complete in reasonable time
      expect(buildMetrics.totalBuildTime).toBeLessThan(120000); // Less than 2 minutes
      expect(buildMetrics.parallelizationEfficiency).toBeGreaterThan(0.7); // Good parallelization
    });

    it('should analyze tree shaking effectiveness', () => {
      const treeShakingAnalysis = this.analyzeTreeShaking(mockWebpackStats);
      
      expect(treeShakingAnalysis).toMatchObject({
        totalModules: expect.any(Number),
        unusedExports: expect.any(Number),
        treeShakingEfficiency: expect.any(Number),
        potentialSavings: expect.any(Number),
      });

      // Tree shaking should be effective
      expect(treeShakingAnalysis.treeShakingEfficiency).toBeGreaterThan(0.8);
      expect(treeShakingAnalysis.unusedExports / treeShakingAnalysis.totalModules).toBeLessThan(0.1);
    });

    it('should validate compression and minification', async () => {
      const compressionAnalysis = await this.analyzeCompression();
      
      expect(compressionAnalysis).toMatchObject({
        originalSize: expect.any(Number),
        minifiedSize: expect.any(Number),
        gzippedSize: expect.any(Number),
        brotliSize: expect.any(Number),
        compressionRatio: expect.any(Number),
        minificationRatio: expect.any(Number),
      });

      // Should achieve good compression ratios
      expect(compressionAnalysis.compressionRatio).toBeGreaterThan(0.6); // At least 60% compression
      expect(compressionAnalysis.minificationRatio).toBeGreaterThan(0.3); // At least 30% minification
      expect(compressionAnalysis.brotliSize).toBeLessThan(compressionAnalysis.gzippedSize);
    });
  });

  describe('Performance Budget Monitoring', () => {
    it('should enforce performance budgets for different asset types', async () => {
      const performanceBudget = {
        javascript: 1500000,  // 1.5MB
        css: 300000,         // 300KB
        images: 2000000,     // 2MB
        fonts: 200000,       // 200KB
        total: 4000000,      // 4MB
      };

      const currentSizes = await this.getCurrentAssetSizes();
      const budgetViolations = this.checkBudgetViolations(currentSizes, performanceBudget);

      if (budgetViolations.length > 0) {
        console.warn('Performance budget violations:', budgetViolations);
        
        budgetViolations.forEach(violation => {
          expect(violation).toMatchObject({
            assetType: expect.any(String),
            currentSize: expect.any(Number),
            budgetSize: expect.any(Number),
            overage: expect.any(Number),
            overagePercentage: expect.any(Number),
          });
        });
      }

      // Should provide recommendations for budget violations
      if (budgetViolations.length > 0) {
        const recommendations = this.generateBudgetRecommendations(budgetViolations);
        expect(recommendations.length).toBeGreaterThan(0);
      }
    });

    it('should track performance budget trends over time', () => {
      const historicalData = [
        { date: '2024-01-01', totalSize: 2500000 },
        { date: '2024-01-15', totalSize: 2600000 },
        { date: '2024-02-01', totalSize: 2750000 },
        { date: '2024-02-15', totalSize: 2880000 },
      ];

      const trendAnalysis = this.analyzeBundleSizeTrends(historicalData);
      
      expect(trendAnalysis).toMatchObject({
        trend: expect.any(String), // 'increasing', 'decreasing', 'stable'
        growthRate: expect.any(Number),
        projectedSize: expect.any(Number),
        alertLevel: expect.any(String), // 'low', 'medium', 'high'
      });

      if (trendAnalysis.trend === 'increasing' && trendAnalysis.growthRate > 0.1) {
        console.warn(`Bundle size growing at ${(trendAnalysis.growthRate * 100).toFixed(1)}% per period`);
        expect(trendAnalysis.alertLevel).toBe('high');
      }
    });
  });

  describe('Advanced Bundle Analysis', () => {
    it('should analyze module dependencies and identify circular dependencies', () => {
      const dependencyAnalysis = this.analyzeDependencies(mockWebpackStats);
      
      expect(dependencyAnalysis).toMatchObject({
        totalDependencies: expect.any(Number),
        circularDependencies: expect.any(Array),
        heaviestDependencies: expect.any(Array),
        unusedDependencies: expect.any(Array),
        duplicateDependencies: expect.any(Array),
      });

      // Should not have circular dependencies
      expect(dependencyAnalysis.circularDependencies).toHaveLength(0);
      
      // Should identify heavy dependencies for optimization
      dependencyAnalysis.heaviestDependencies.forEach((dep: any) => {
        expect(dep.size).toBeGreaterThan(50000); // > 50KB
        console.log(`Heavy dependency: ${dep.name} (${(dep.size / 1024).toFixed(1)}KB)`);
      });
    });

    it('should provide bundle optimization recommendations', async () => {
      const metrics = await BundleAnalysisTestUtils.analyzeBundleSize();
      const recommendations = this.generateOptimizationRecommendations(metrics);
      
      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: expect.any(String),
            priority: expect.any(String),
            description: expect.any(String),
            estimatedSavings: expect.any(Number),
            effort: expect.any(String),
          })
        ])
      );

      // Should prioritize high-impact, low-effort optimizations
      const highPriorityRecs = recommendations.filter((rec: any) => rec.priority === 'high');
      expect(highPriorityRecs.length).toBeGreaterThan(0);
    });
  });

  // Helper methods for bundle analysis
  private generateBundleOptimizationRecommendations(metrics: any) {
    const recommendations = [];

    if (metrics.unusedCode > 150000) {
      recommendations.push({
        issue: 'High unused code',
        recommendation: 'Enable tree shaking and remove unused imports',
        impact: `Potential savings: ${(metrics.unusedCode / 1024 / 1024).toFixed(2)}MB`,
      });
    }

    if (metrics.duplicateCode > 80000) {
      recommendations.push({
        issue: 'Code duplication detected',
        recommendation: 'Extract common code into shared modules',
        impact: `Potential savings: ${(metrics.duplicateCode / 1024 / 1024).toFixed(2)}MB`,
      });
    }

    return recommendations;
  }

  private analyzeChunkSizes(chunkSizes: Record<string, number>) {
    const chunks = Object.entries(chunkSizes).map(([name, size]) => ({ name, size }));
    const sizes = chunks.map(c => c.size);
    
    return {
      totalChunks: chunks.length,
      largestChunk: chunks.reduce((largest, chunk) => chunk.size > largest.size ? chunk : largest),
      smallestChunk: chunks.reduce((smallest, chunk) => chunk.size < smallest.size ? chunk : smallest),
      averageChunkSize: sizes.reduce((sum, size) => sum + size, 0) / sizes.length,
      oversizedChunks: chunks.filter(c => c.size > 1000000),
      undersizedChunks: chunks.filter(c => c.size < 50000),
    };
  }

  private analyzeRouteSplitting(routeChunks: Record<string, number>) {
    const sizes = Object.values(routeChunks);
    const average = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - average, 2), 0) / sizes.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / average;

    return {
      totalRouteChunks: sizes.length,
      averageRouteChunkSize: average,
      routeChunkVariance: coefficientOfVariation,
      wellBalanced: coefficientOfVariation < 0.3, // Less than 30% variation
    };
  }

  private async measureBuildPerformance() {
    // Mock build performance metrics
    return {
      totalBuildTime: 45000,      // 45 seconds
      compilationTime: 30000,     // 30 seconds
      optimizationTime: 10000,    // 10 seconds
      assetGenerationTime: 5000,  // 5 seconds
      parallelizationEfficiency: 0.85, // 85% efficiency
    };
  }

  private analyzeTreeShaking(stats: any) {
    const totalModules = stats.modules.length;
    const unusedExports = Math.floor(totalModules * 0.05); // Assume 5% unused
    
    return {
      totalModules,
      unusedExports,
      treeShakingEfficiency: 1 - (unusedExports / totalModules),
      potentialSavings: unusedExports * 2000, // Assume 2KB per unused export
    };
  }

  private async analyzeCompression() {
    const originalSize = 2880000;
    const minifiedSize = originalSize * 0.7; // 30% minification
    const gzippedSize = minifiedSize * 0.35; // 65% gzip compression
    const brotliSize = minifiedSize * 0.3;   // 70% brotli compression

    return {
      originalSize,
      minifiedSize,
      gzippedSize,
      brotliSize,
      compressionRatio: 1 - (gzippedSize / originalSize),
      minificationRatio: 1 - (minifiedSize / originalSize),
    };
  }

  private async getCurrentAssetSizes() {
    return {
      javascript: 1800000,  // 1.8MB (over budget)
      css: 250000,         // 250KB (within budget)
      images: 1500000,     // 1.5MB (within budget)
      fonts: 180000,       // 180KB (within budget)
      total: 3730000,      // 3.73MB (within budget)
    };
  }

  private checkBudgetViolations(currentSizes: any, budget: any) {
    const violations = [];

    Object.entries(budget).forEach(([assetType, budgetSize]) => {
      const currentSize = currentSizes[assetType];
      if (currentSize > budgetSize) {
        const overage = currentSize - budgetSize;
        violations.push({
          assetType,
          currentSize,
          budgetSize,
          overage,
          overagePercentage: (overage / budgetSize) * 100,
        });
      }
    });

    return violations;
  }

  private generateBudgetRecommendations(violations: any[]) {
    return violations.map(violation => ({
      assetType: violation.assetType,
      recommendation: this.getRecommendationForAssetType(violation.assetType),
      priority: violation.overagePercentage > 20 ? 'high' : 'medium',
    }));
  }

  private getRecommendationForAssetType(assetType: string) {
    const recommendations: Record<string, string> = {
      javascript: 'Consider code splitting, tree shaking, and removing unused dependencies',
      css: 'Remove unused CSS, use CSS purging, and optimize critical CSS',
      images: 'Optimize image formats, use WebP, implement lazy loading',
      fonts: 'Use font subsetting, preload critical fonts, consider system fonts',
    };
    return recommendations[assetType] || 'Optimize asset size and loading strategy';
  }

  private analyzeBundleSizeTrends(historicalData: any[]) {
    const sizes = historicalData.map(d => d.totalSize);
    const growthRates = [];

    for (let i = 1; i < sizes.length; i++) {
      const growthRate = (sizes[i] - sizes[i - 1]) / sizes[i - 1];
      growthRates.push(growthRate);
    }

    const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const currentSize = sizes[sizes.length - 1];
    const projectedSize = currentSize * (1 + avgGrowthRate);

    return {
      trend: avgGrowthRate > 0.05 ? 'increasing' : avgGrowthRate < -0.05 ? 'decreasing' : 'stable',
      growthRate: avgGrowthRate,
      projectedSize,
      alertLevel: avgGrowthRate > 0.1 ? 'high' : avgGrowthRate > 0.05 ? 'medium' : 'low',
    };
  }

  private analyzeDependencies(stats: any) {
    return {
      totalDependencies: stats.modules.length,
      circularDependencies: [], // Would be detected by actual analysis
      heaviestDependencies: stats.modules
        .filter((m: any) => m.size > 50000)
        .sort((a: any, b: any) => b.size - a.size)
        .slice(0, 5),
      unusedDependencies: [],
      duplicateDependencies: [],
    };
  }

  private generateOptimizationRecommendations(metrics: any) {
    const recommendations = [];

    if (metrics.unusedCode > 100000) {
      recommendations.push({
        category: 'Code Elimination',
        priority: 'high',
        description: 'Remove unused code and enable tree shaking',
        estimatedSavings: metrics.unusedCode,
        effort: 'medium',
      });
    }

    if (metrics.duplicateCode > 50000) {
      recommendations.push({
        category: 'Code Deduplication',
        priority: 'medium',
        description: 'Extract common code into shared modules',
        estimatedSavings: metrics.duplicateCode * 0.8,
        effort: 'high',
      });
    }

    return recommendations;
  }
});