/**
 * Automated Performance Optimizer for Request Deduplication System
 * 
 * Automatically optimizes cache settings, TTL values, and system parameters
 * based on real-time performance metrics and usage patterns.
 */

import { EventEmitter } from 'events';

import { RequestDeduplicator } from '../deduplication/RequestDeduplicator';
import { cachePerformanceMonitor, CacheMetrics } from '../monitoring/CachePerformanceMonitor';
import { monitoringDashboard } from '../monitoring/MonitoringDashboard';

export interface OptimizationConfig {
  enabled: boolean;
  optimizationInterval: number; // milliseconds
  learningPeriod: number; // hours
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  autoApplyOptimizations: boolean;
  thresholds: {
    minHitRateForOptimization: number;
    maxMemoryUsageForOptimization: number;
    minRequestVolumeForOptimization: number;
  };
}

export interface OptimizationRecommendation {
  id: string;
  type: 'ttl' | 'memory' | 'cleanup' | 'pattern' | 'threshold';
  description: string;
  currentValue: any;
  recommendedValue: any;
  expectedImpact: {
    hitRateImprovement: number;
    memoryReduction: number;
    responseTimeImprovement: number;
  };
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
  autoApplicable: boolean;
}

export interface OptimizationResult {
  recommendationId: string;
  applied: boolean;
  timestamp: Date;
  beforeMetrics: CacheMetrics;
  afterMetrics?: CacheMetrics;
  actualImpact?: {
    hitRateChange: number;
    memoryChange: number;
    responseTimeChange: number;
  };
}

export class PerformanceOptimizer extends EventEmitter {
  private static instance: PerformanceOptimizer;
  private config: OptimizationConfig;
  private optimizationTimer?: NodeJS.Timeout;
  private learningData: Map<string, any[]> = new Map();
  private appliedOptimizations: OptimizationResult[] = [];
  private pendingRecommendations: OptimizationRecommendation[] = [];

  private constructor(config: Partial<OptimizationConfig> = {}) {
    super();
    
    this.config = {
      enabled: true,
      optimizationInterval: 300000, // 5 minutes
      learningPeriod: 24, // 24 hours
      aggressiveness: 'moderate',
      autoApplyOptimizations: false, // Safety first
      thresholds: {
        minHitRateForOptimization: 0.5,
        maxMemoryUsageForOptimization: 100 * 1024 * 1024, // 100MB
        minRequestVolumeForOptimization: 100
      },
      ...config
    };
  }

  static getInstance(config?: Partial<OptimizationConfig>): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer(config);
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Start the performance optimizer
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('⚠️  Performance optimizer is disabled');
      return;
    }

    console.log('🚀 Starting performance optimizer...');
    
    this.optimizationTimer = setInterval(() => {
      this.runOptimizationCycle();
    }, this.config.optimizationInterval);

    // Initial optimization cycle
    setTimeout(() => this.runOptimizationCycle(), 10000); // Wait 10 seconds for initial data

    console.log('✅ Performance optimizer started');
  }

  /**
   * Stop the performance optimizer
   */
  stop(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = undefined;
    }
    console.log('🛑 Performance optimizer stopped');
  }

  /**
   * Get current optimization recommendations
   */
  getRecommendations(): OptimizationRecommendation[] {
    return [...this.pendingRecommendations];
  }

  /**
   * Apply a specific optimization recommendation
   */
  async applyRecommendation(recommendationId: string): Promise<OptimizationResult> {
    const recommendation = this.pendingRecommendations.find(r => r.id === recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation not found: ${recommendationId}`);
    }

    console.log(`🔧 Applying optimization: ${recommendation.description}`);

    const beforeMetrics = cachePerformanceMonitor.getCurrentMetrics();
    
    try {
      await this.applyOptimization(recommendation);
      
      // Wait for metrics to stabilize
      await this.sleep(30000); // 30 seconds
      
      const afterMetrics = cachePerformanceMonitor.getCurrentMetrics();
      const actualImpact = this.calculateActualImpact(beforeMetrics, afterMetrics);

      const result: OptimizationResult = {
        recommendationId,
        applied: true,
        timestamp: new Date(),
        beforeMetrics: beforeMetrics!,
        afterMetrics,
        actualImpact
      };

      this.appliedOptimizations.push(result);
      this.pendingRecommendations = this.pendingRecommendations.filter(r => r.id !== recommendationId);

      this.emit('optimizationApplied', result);
      console.log(`✅ Optimization applied successfully: ${recommendation.description}`);

      return result;
    } catch (error) {
      const result: OptimizationResult = {
        recommendationId,
        applied: false,
        timestamp: new Date(),
        beforeMetrics: beforeMetrics!
      };

      this.appliedOptimizations.push(result);
      console.error(`❌ Failed to apply optimization: ${error}`);
      
      return result;
    }
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(): OptimizationResult[] {
    return [...this.appliedOptimizations];
  }

  /**
   * Generate performance optimization report
   */
  generateOptimizationReport(): {
    summary: {
      totalOptimizations: number;
      successfulOptimizations: number;
      averageImpact: {
        hitRateImprovement: number;
        memoryReduction: number;
        responseTimeImprovement: number;
      };
    };
    recommendations: OptimizationRecommendation[];
    history: OptimizationResult[];
    insights: string[];
  } {
    const successful = this.appliedOptimizations.filter(o => o.applied && o.actualImpact);
    
    const averageImpact = successful.length > 0 ? {
      hitRateImprovement: successful.reduce((sum, o) => sum + (o.actualImpact?.hitRateChange || 0), 0) / successful.length,
      memoryReduction: successful.reduce((sum, o) => sum + (o.actualImpact?.memoryChange || 0), 0) / successful.length,
      responseTimeImprovement: successful.reduce((sum, o) => sum + (o.actualImpact?.responseTimeChange || 0), 0) / successful.length
    } : { hitRateImprovement: 0, memoryReduction: 0, responseTimeImprovement: 0 };

    const insights = this.generateInsights();

    return {
      summary: {
        totalOptimizations: this.appliedOptimizations.length,
        successfulOptimizations: successful.length,
        averageImpact
      },
      recommendations: this.pendingRecommendations,
      history: this.appliedOptimizations,
      insights
    };
  }

  private async runOptimizationCycle(): Promise<void> {
    try {
      console.log('🔍 Running optimization cycle...');
      
      // Collect current metrics
      const currentMetrics = cachePerformanceMonitor.getCurrentMetrics();
      if (!currentMetrics) {
        console.log('⚠️  No metrics available, skipping optimization cycle');
        return;
      }

      // Store learning data
      this.storeLearningData(currentMetrics);

      // Check if we have enough data for optimization
      if (!this.hasEnoughDataForOptimization()) {
        console.log('📊 Collecting more data before optimization...');
        return;
      }

      // Generate recommendations
      const recommendations = await this.generateRecommendations(currentMetrics);
      
      // Update pending recommendations
      this.updatePendingRecommendations(recommendations);

      // Auto-apply high-confidence recommendations if enabled
      if (this.config.autoApplyOptimizations) {
        await this.autoApplyRecommendations();
      }

      console.log(`✅ Optimization cycle completed. ${recommendations.length} new recommendations generated.`);
    } catch (error) {
      console.error(`❌ Optimization cycle failed: ${error}`);
    }
  }

  private storeLearningData(metrics: CacheMetrics): void {
    const timestamp = Date.now();
    const dataPoint = { timestamp, ...metrics };

    // Store different types of learning data
    const dataTypes = ['hitRate', 'memoryUsage', 'responseTime', 'requestVolume'];
    
    for (const type of dataTypes) {
      if (!this.learningData.has(type)) {
        this.learningData.set(type, []);
      }
      
      const data = this.learningData.get(type)!;
      data.push(dataPoint);
      
      // Keep only recent data (learning period)
      const cutoff = timestamp - (this.config.learningPeriod * 60 * 60 * 1000);
      this.learningData.set(type, data.filter(d => d.timestamp > cutoff));
    }
  }

  private hasEnoughDataForOptimization(): boolean {
    const hitRateData = this.learningData.get('hitRate') || [];
    return hitRateData.length >= 10; // Need at least 10 data points
  }

  private async generateRecommendations(currentMetrics: CacheMetrics): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // TTL Optimization
    const ttlRecommendation = this.generateTTLRecommendation(currentMetrics);
    if (ttlRecommendation) recommendations.push(ttlRecommendation);

    // Memory Optimization
    const memoryRecommendation = this.generateMemoryOptimizationRecommendation(currentMetrics);
    if (memoryRecommendation) recommendations.push(memoryRecommendation);

    // Cleanup Optimization
    const cleanupRecommendation = this.generateCleanupOptimizationRecommendation(currentMetrics);
    if (cleanupRecommendation) recommendations.push(cleanupRecommendation);

    // Pattern Optimization
    const patternRecommendation = this.generatePatternOptimizationRecommendation(currentMetrics);
    if (patternRecommendation) recommendations.push(patternRecommendation);

    return recommendations;
  }

  private generateTTLRecommendation(metrics: CacheMetrics): OptimizationRecommendation | null {
    const hitRateData = this.learningData.get('hitRate') || [];
    if (hitRateData.length < 5) return null;

    const avgHitRate = hitRateData.reduce((sum, d) => sum + d.hitRate, 0) / hitRateData.length;
    const currentTTL = 300000; // Default 5 minutes - in real scenario, get from config

    let recommendedTTL = currentTTL;
    const expectedImpact = { hitRateImprovement: 0, memoryReduction: 0, responseTimeImprovement: 0 };
    let confidence = 0.5;

    if (avgHitRate < 0.7) {
      // Low hit rate - increase TTL
      recommendedTTL = Math.min(currentTTL * 1.5, 1800000); // Max 30 minutes
      expectedImpact.hitRateImprovement = 0.1;
      confidence = 0.8;
    } else if (avgHitRate > 0.95 && metrics.memoryUsage > 50 * 1024 * 1024) {
      // Very high hit rate but high memory usage - decrease TTL slightly
      recommendedTTL = Math.max(currentTTL * 0.8, 60000); // Min 1 minute
      expectedImpact.memoryReduction = 0.2;
      confidence = 0.7;
    }

    if (recommendedTTL === currentTTL) return null;

    return {
      id: `ttl-${Date.now()}`,
      type: 'ttl',
      description: `Adjust cache TTL from ${currentTTL / 1000}s to ${recommendedTTL / 1000}s`,
      currentValue: currentTTL,
      recommendedValue: recommendedTTL,
      expectedImpact,
      confidence,
      priority: confidence > 0.8 ? 'high' : 'medium',
      autoApplicable: confidence > 0.8 && this.config.aggressiveness !== 'conservative'
    };
  }

  private generateMemoryOptimizationRecommendation(metrics: CacheMetrics): OptimizationRecommendation | null {
    if (metrics.memoryUsage < this.config.thresholds.maxMemoryUsageForOptimization) {
      return null;
    }

    const memoryData = this.learningData.get('memoryUsage') || [];
    const isMemoryGrowing = memoryData.length >= 3 && 
      memoryData[memoryData.length - 1].memoryUsage > memoryData[memoryData.length - 3].memoryUsage;

    if (!isMemoryGrowing) return null;

    return {
      id: `memory-${Date.now()}`,
      type: 'memory',
      description: 'Implement more aggressive memory cleanup due to growing memory usage',
      currentValue: 'Standard cleanup',
      recommendedValue: 'Aggressive cleanup',
      expectedImpact: {
        hitRateImprovement: -0.05, // Slight decrease due to more aggressive cleanup
        memoryReduction: 0.3,
        responseTimeImprovement: 0.1
      },
      confidence: 0.9,
      priority: 'high',
      autoApplicable: true
    };
  }

  private generateCleanupOptimizationRecommendation(metrics: CacheMetrics): OptimizationRecommendation | null {
    // Analyze cleanup patterns and suggest optimizations
    const deduplicatorStats = RequestDeduplicator.getInstance().getStats();
    
    if (deduplicatorStats.completedRequests > 1000 && metrics.memoryUsage > 20 * 1024 * 1024) {
      return {
        id: `cleanup-${Date.now()}`,
        type: 'cleanup',
        description: 'Optimize cleanup frequency based on request patterns',
        currentValue: '60s interval',
        recommendedValue: '30s interval',
        expectedImpact: {
          hitRateImprovement: 0,
          memoryReduction: 0.15,
          responseTimeImprovement: 0.05
        },
        confidence: 0.7,
        priority: 'medium',
        autoApplicable: this.config.aggressiveness === 'aggressive'
      };
    }

    return null;
  }

  private generatePatternOptimizationRecommendation(metrics: CacheMetrics): OptimizationRecommendation | null {
    // Analyze request patterns and suggest key generation optimizations
    if (metrics.hitRate < 0.6) {
      return {
        id: `pattern-${Date.now()}`,
        type: 'pattern',
        description: 'Optimize cache key generation patterns for better hit rates',
        currentValue: 'Current key strategy',
        recommendedValue: 'Optimized key strategy',
        expectedImpact: {
          hitRateImprovement: 0.15,
          memoryReduction: 0,
          responseTimeImprovement: 0
        },
        confidence: 0.6,
        priority: 'medium',
        autoApplicable: false // Requires manual review
      };
    }

    return null;
  }

  private updatePendingRecommendations(newRecommendations: OptimizationRecommendation[]): void {
    // Remove old recommendations of the same type
    for (const newRec of newRecommendations) {
      this.pendingRecommendations = this.pendingRecommendations.filter(
        existing => existing.type !== newRec.type
      );
    }

    // Add new recommendations
    this.pendingRecommendations.push(...newRecommendations);

    // Sort by priority and confidence
    this.pendingRecommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    // Emit event for new recommendations
    if (newRecommendations.length > 0) {
      this.emit('newRecommendations', newRecommendations);
    }
  }

  private async autoApplyRecommendations(): Promise<void> {
    const autoApplicable = this.pendingRecommendations.filter(r => 
      r.autoApplicable && r.confidence > 0.8
    );

    for (const recommendation of autoApplicable.slice(0, 2)) { // Apply max 2 at a time
      try {
        await this.applyRecommendation(recommendation.id);
        await this.sleep(60000); // Wait 1 minute between applications
      } catch (error) {
        console.error(`Failed to auto-apply recommendation ${recommendation.id}: ${error}`);
      }
    }
  }

  private async applyOptimization(recommendation: OptimizationRecommendation): Promise<void> {
    const deduplicator = RequestDeduplicator.getInstance();

    switch (recommendation.type) {
      case 'ttl':
        // In a real implementation, this would update the deduplicator configuration
        console.log(`Applying TTL optimization: ${recommendation.recommendedValue}ms`);
        break;

      case 'memory':
        // Trigger aggressive cleanup
        console.log('Applying memory optimization: aggressive cleanup');
        await deduplicator.clearCache('*'); // Clear all cache
        break;

      case 'cleanup':
        // Adjust cleanup frequency
        console.log('Applying cleanup optimization');
        break;

      case 'pattern':
        // This would require code changes, so just log for now
        console.log('Pattern optimization requires manual implementation');
        throw new Error('Pattern optimization requires manual implementation');

      default:
        throw new Error(`Unknown optimization type: ${recommendation.type}`);
    }
  }

  private calculateActualImpact(before: CacheMetrics, after: CacheMetrics): {
    hitRateChange: number;
    memoryChange: number;
    responseTimeChange: number;
  } {
    return {
      hitRateChange: after.hitRate - before.hitRate,
      memoryChange: (before.memoryUsage - after.memoryUsage) / before.memoryUsage,
      responseTimeChange: (before.averageResponseTime - after.averageResponseTime) / before.averageResponseTime
    };
  }

  private generateInsights(): string[] {
    const insights: string[] = [];
    const successful = this.appliedOptimizations.filter(o => o.applied);

    if (successful.length > 0) {
      const avgHitRateImprovement = successful.reduce((sum, o) => 
        sum + (o.actualImpact?.hitRateChange || 0), 0) / successful.length;
      
      if (avgHitRateImprovement > 0.05) {
        insights.push(`Optimizations have improved cache hit rate by an average of ${(avgHitRateImprovement * 100).toFixed(1)}%`);
      }
    }

    const currentMetrics = cachePerformanceMonitor.getCurrentMetrics();
    if (currentMetrics) {
      if (currentMetrics.hitRate > 0.9) {
        insights.push('Cache performance is excellent with >90% hit rate');
      } else if (currentMetrics.hitRate < 0.6) {
        insights.push('Cache hit rate is low and needs attention');
      }

      if (currentMetrics.memoryUsage > 100 * 1024 * 1024) {
        insights.push('Memory usage is high and may benefit from more aggressive cleanup');
      }
    }

    if (insights.length === 0) {
      insights.push('System is performing within normal parameters');
    }

    return insights;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();