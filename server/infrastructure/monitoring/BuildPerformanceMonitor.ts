/**
 * BUILD PERFORMANCE MONITOR - CRITICAL PERFORMANCE TRACKING
 * ========================================================
 * 
 * Monitors build performance to ensure the optimizations implemented
 * are actually improving build times as promised in the audit fixes.
 * 
 * Tracks:
 * - Build duration
 * - Bundle size
 * - Dependency resolution time
 * - CSS processing time
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

interface BuildMetrics {
  timestamp: string;
  buildDuration: number;
  bundleSize: number;
  dependencyResolutionTime: number;
  cssProcessingTime: number;
  chunkCount: number;
  errors: string[];
  warnings: string[];
  environment: 'development' | 'production';
}

interface PerformanceThresholds {
  maxBuildTime: number; // milliseconds
  maxBundleSize: number; // bytes
  maxDependencyResolutionTime: number; // milliseconds
  maxCssProcessingTime: number; // milliseconds
}

export class BuildPerformanceMonitor {
  private metrics: BuildMetrics[] = [];
  private startTime: number = 0;
  private dependencyStartTime: number = 0;
  private cssStartTime: number = 0;
  
  private readonly thresholds: PerformanceThresholds = {
    maxBuildTime: 30000, // 30 seconds (audit target)
    maxBundleSize: 5 * 1024 * 1024, // 5MB
    maxDependencyResolutionTime: 5000, // 5 seconds
    maxCssProcessingTime: 3000, // 3 seconds
  };

  private readonly metricsFile = path.join(process.cwd(), 'build-metrics.json');

  /**
   * Start build performance monitoring
   */
  startBuildMonitoring(): void {
    this.startTime = performance.now();
    console.log('🚀 Build performance monitoring started');
  }

  /**
   * Start dependency resolution monitoring
   */
  startDependencyResolution(): void {
    this.dependencyStartTime = performance.now();
  }

  /**
   * End dependency resolution monitoring
   */
  endDependencyResolution(): number {
    const duration = performance.now() - this.dependencyStartTime;
    console.log(`📦 Dependency resolution completed in ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Start CSS processing monitoring
   */
  startCssProcessing(): void {
    this.cssStartTime = performance.now();
  }

  /**
   * End CSS processing monitoring
   */
  endCssProcessing(): number {
    const duration = performance.now() - this.cssStartTime;
    console.log(`🎨 CSS processing completed in ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * End build monitoring and record metrics
   */
  async endBuildMonitoring(
    bundleSize: number,
    chunkCount: number,
    errors: string[] = [],
    warnings: string[] = [],
    environment: 'development' | 'production' = 'development'
  ): Promise<BuildMetrics> {
    const buildDuration = performance.now() - this.startTime;
    const dependencyResolutionTime = this.dependencyStartTime ? 
      performance.now() - this.dependencyStartTime : 0;
    const cssProcessingTime = this.cssStartTime ? 
      performance.now() - this.cssStartTime : 0;

    const metrics: BuildMetrics = {
      timestamp: new Date().toISOString(),
      buildDuration,
      bundleSize,
      dependencyResolutionTime,
      cssProcessingTime,
      chunkCount,
      errors,
      warnings,
      environment,
    };

    this.metrics.push(metrics);
    await this.saveMetrics();
    this.analyzePerformance(metrics);

    console.log(`✅ Build completed in ${(buildDuration / 1000).toFixed(2)}s`);
    console.log(`📊 Bundle size: ${(bundleSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`🧩 Chunks: ${chunkCount}`);

    return metrics;
  }

  /**
   * Analyze performance against thresholds
   */
  private analyzePerformance(metrics: BuildMetrics): void {
    const issues: string[] = [];

    if (metrics.buildDuration > this.thresholds.maxBuildTime) {
      issues.push(`Build time ${(metrics.buildDuration / 1000).toFixed(2)}s exceeds threshold ${(this.thresholds.maxBuildTime / 1000).toFixed(2)}s`);
    }

    if (metrics.bundleSize > this.thresholds.maxBundleSize) {
      issues.push(`Bundle size ${(metrics.bundleSize / 1024 / 1024).toFixed(2)}MB exceeds threshold ${(this.thresholds.maxBundleSize / 1024 / 1024).toFixed(2)}MB`);
    }

    if (metrics.dependencyResolutionTime > this.thresholds.maxDependencyResolutionTime) {
      issues.push(`Dependency resolution ${(metrics.dependencyResolutionTime / 1000).toFixed(2)}s exceeds threshold ${(this.thresholds.maxDependencyResolutionTime / 1000).toFixed(2)}s`);
    }

    if (metrics.cssProcessingTime > this.thresholds.maxCssProcessingTime) {
      issues.push(`CSS processing ${(metrics.cssProcessingTime / 1000).toFixed(2)}s exceeds threshold ${(this.thresholds.maxCssProcessingTime / 1000).toFixed(2)}s`);
    }

    if (issues.length > 0) {
      console.warn('⚠️  Performance issues detected:');
      issues.forEach(issue => console.warn(`   - ${issue}`));
    } else {
      console.log('✅ All performance thresholds met');
    }

    // Check for improvement trends
    this.checkPerformanceTrends();
  }

  /**
   * Check performance trends over recent builds
   */
  private checkPerformanceTrends(): void {
    if (this.metrics.length < 2) return;

    const recent = this.metrics.slice(-5); // Last 5 builds
    const avgBuildTime = recent.reduce((sum, m) => sum + m.buildDuration, 0) / recent.length;
    const avgBundleSize = recent.reduce((sum, m) => sum + m.bundleSize, 0) / recent.length;

    console.log(`📈 Recent performance trends:`);
    console.log(`   Average build time: ${(avgBuildTime / 1000).toFixed(2)}s`);
    console.log(`   Average bundle size: ${(avgBundleSize / 1024 / 1024).toFixed(2)}MB`);

    // Check if we're meeting audit targets
    if (avgBuildTime <= this.thresholds.maxBuildTime) {
      console.log('🎯 Meeting audit target: Build time under 30 seconds');
    } else {
      console.warn('❌ Not meeting audit target: Build time still over 30 seconds');
    }
  }

  /**
   * Save metrics to file
   */
  private async saveMetrics(): Promise<void> {
    try {
      await fs.writeFile(this.metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error('Failed to save build metrics:', error);
    }
  }

  /**
   * Load existing metrics
   */
  async loadMetrics(): Promise<void> {
    try {
      const data = await fs.readFile(this.metricsFile, 'utf-8');
      this.metrics = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      this.metrics = [];
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: {
      totalBuilds: number;
      averageBuildTime: number;
      averageBundleSize: number;
      successRate: number;
    };
    trends: {
      buildTimeImprovement: number;
      bundleSizeImprovement: number;
    };
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        summary: { totalBuilds: 0, averageBuildTime: 0, averageBundleSize: 0, successRate: 0 },
        trends: { buildTimeImprovement: 0, bundleSizeImprovement: 0 },
        recommendations: ['No build data available yet'],
      };
    }

    const recent = this.metrics.slice(-10);
    const older = this.metrics.slice(-20, -10);

    const avgBuildTime = recent.reduce((sum, m) => sum + m.buildDuration, 0) / recent.length;
    const avgBundleSize = recent.reduce((sum, m) => sum + m.bundleSize, 0) / recent.length;
    const successRate = recent.filter(m => m.errors.length === 0).length / recent.length;

    const buildTimeImprovement = older.length > 0 ? 
      ((older.reduce((sum, m) => sum + m.buildDuration, 0) / older.length) - avgBuildTime) / 1000 : 0;
    
    const bundleSizeImprovement = older.length > 0 ?
      ((older.reduce((sum, m) => sum + m.bundleSize, 0) / older.length) - avgBundleSize) / 1024 / 1024 : 0;

    const recommendations: string[] = [];

    if (avgBuildTime > this.thresholds.maxBuildTime) {
      recommendations.push('Consider enabling more aggressive caching or reducing bundle complexity');
    }

    if (avgBundleSize > this.thresholds.maxBundleSize) {
      recommendations.push('Implement code splitting or remove unused dependencies');
    }

    if (successRate < 0.9) {
      recommendations.push('Address recurring build errors to improve reliability');
    }

    return {
      summary: {
        totalBuilds: this.metrics.length,
        averageBuildTime: avgBuildTime / 1000,
        averageBundleSize: avgBundleSize / 1024 / 1024,
        successRate,
      },
      trends: {
        buildTimeImprovement,
        bundleSizeImprovement,
      },
      recommendations,
    };
  }

  /**
   * Check if audit targets are being met
   */
  isAuditTargetMet(): boolean {
    if (this.metrics.length === 0) return false;
    
    const recent = this.metrics.slice(-3); // Last 3 builds
    const avgBuildTime = recent.reduce((sum, m) => sum + m.buildDuration, 0) / recent.length;
    
    return avgBuildTime <= this.thresholds.maxBuildTime;
  }
}

// Export singleton instance
export const buildPerformanceMonitor = new BuildPerformanceMonitor();