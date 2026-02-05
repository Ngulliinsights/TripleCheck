/**
 * Performance Monitoring Service
 * 
 * Provides comprehensive performance monitoring, optimization recommendations,
 * and real-time performance analytics for the African Property Trust platform.
 * 
 * Features:
 * - Core Web Vitals monitoring (LCP, FID, CLS)
 * - Resource timing and network performance
 * - Component render performance tracking
 * - Memory usage monitoring and leak detection
 * - Bundle size analysis and optimization suggestions
 * - Real-time performance alerts and recommendations
 */

import { EventEmitter } from 'events'
import { auditTrailService, AuditEventType } from './audit-trail-service'

// Performance Types and Interfaces
export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  type: MetricType;
  name: string;
  value: number;
  unit: string;
  context: PerformanceContext;
  threshold?: PerformanceThreshold;
  rating: PerformanceRating;
}

export enum MetricType {
  CORE_WEB_VITAL = 'CORE_WEB_VITAL',
  RESOURCE_TIMING = 'RESOURCE_TIMING',
  COMPONENT_RENDER = 'COMPONENT_RENDER',
  MEMORY_USAGE = 'MEMORY_USAGE',
  NETWORK_REQUEST = 'NETWORK_REQUEST',
  USER_INTERACTION = 'USER_INTERACTION',
  BUNDLE_SIZE = 'BUNDLE_SIZE',
  CUSTOM = 'CUSTOM'
}

export enum PerformanceRating {
  GOOD = 'GOOD',
  NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT',
  POOR = 'POOR'
}

export interface PerformanceContext {
  url?: string;
  component?: string;
  feature?: string;
  userId?: string;
  sessionId?: string;
  deviceType?: string;
  connectionType?: string;
  viewport?: { width: number; height: number };
  additionalData?: Record<string, any>;
}

export interface PerformanceThreshold {
  good: number;
  needsImprovement: number;
  poor: number;
}

export interface CoreWebVitals {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
  startTime: number;
  endTime: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
}

export interface ComponentPerformance {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
  propsSize: number;
  stateSize: number;
  childrenCount: number;
}

export interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: Date;
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  recommendations: string[];
  context: PerformanceContext;
}

export interface PerformanceReport {
  summary: PerformanceSummary;
  coreWebVitals: CoreWebVitals;
  resourceTimings: ResourceTiming[];
  componentPerformance: ComponentPerformance[];
  memoryUsage: MemoryUsage[];
  alerts: PerformanceAlert[];
  recommendations: PerformanceRecommendation[];
  timeRange: { start: Date; end: Date };
}

export interface PerformanceSummary {
  totalMetrics: number;
  averagePageLoadTime: number;
  averageRenderTime: number;
  memoryLeakDetected: boolean;
  performanceScore: number;
  topIssues: string[];
}

export interface PerformanceRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'loading' | 'rendering' | 'memory' | 'network' | 'bundle';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string[];
  estimatedImprovement: string;
}

// Core Web Vitals Monitor
export class CoreWebVitalsMonitor {
  private vitals: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor(private onMetric: (metric: PerformanceMetric) => void) {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
    
    // First Contentful Paint (FCP)
    this.observeFCP();
    
    // Time to First Byte (TTFB)
    this.observeTTFB();
  }

  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        if (lastEntry) {
          const lcp = lastEntry.startTime;
          this.vitals.set('lcp', lcp);
          
          this.onMetric({
            id: `lcp_${Date.now()}`,
            timestamp: new Date(),
            type: MetricType.CORE_WEB_VITAL,
            name: 'Largest Contentful Paint',
            value: lcp,
            unit: 'ms',
            context: this.getContext(),
            threshold: { good: 2500, needsImprovement: 4000, poor: Infinity },
            rating: this.rateMetric(lcp, { good: 2500, needsImprovement: 4000, poor: Infinity })
          });
        }
      });
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP observation not supported:', error);
    }
  }

  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          const fid = (entry as any).processingStart - entry.startTime;
          this.vitals.set('fid', fid);
          
          this.onMetric({
            id: `fid_${Date.now()}`,
            timestamp: new Date(),
            type: MetricType.CORE_WEB_VITAL,
            name: 'First Input Delay',
            value: fid,
            unit: 'ms',
            context: this.getContext(),
            threshold: { good: 100, needsImprovement: 300, poor: Infinity },
            rating: this.rateMetric(fid, { good: 100, needsImprovement: 300, poor: Infinity })
          });
        }
      });
      
      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID observation not supported:', error);
    }
  }

  private observeCLS(): void {
    try {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        this.vitals.set('cls', clsValue);
        
        this.onMetric({
          id: `cls_${Date.now()}`,
          timestamp: new Date(),
          type: MetricType.CORE_WEB_VITAL,
          name: 'Cumulative Layout Shift',
          value: clsValue,
          unit: 'score',
          context: this.getContext(),
          threshold: { good: 0.1, needsImprovement: 0.25, poor: Infinity },
          rating: this.rateMetric(clsValue, { good: 0.1, needsImprovement: 0.25, poor: Infinity })
        });
      });
      
      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS observation not supported:', error);
    }
  }

  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            const fcp = entry.startTime;
            this.vitals.set('fcp', fcp);
            
            this.onMetric({
              id: `fcp_${Date.now()}`,
              timestamp: new Date(),
              type: MetricType.CORE_WEB_VITAL,
              name: 'First Contentful Paint',
              value: fcp,
              unit: 'ms',
              context: this.getContext(),
              threshold: { good: 1800, needsImprovement: 3000, poor: Infinity },
              rating: this.rateMetric(fcp, { good: 1800, needsImprovement: 3000, poor: Infinity })
            });
          }
        }
      });
      
      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP observation not supported:', error);
    }
  }

  private observeTTFB(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            const ttfb = navEntry.responseStart - navEntry.requestStart;
            this.vitals.set('ttfb', ttfb);
            
            this.onMetric({
              id: `ttfb_${Date.now()}`,
              timestamp: new Date(),
              type: MetricType.CORE_WEB_VITAL,
              name: 'Time to First Byte',
              value: ttfb,
              unit: 'ms',
              context: this.getContext(),
              threshold: { good: 800, needsImprovement: 1800, poor: Infinity },
              rating: this.rateMetric(ttfb, { good: 800, needsImprovement: 1800, poor: Infinity })
            });
          }
        }
      });
      
      observer.observe({ type: 'navigation', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('TTFB observation not supported:', error);
    }
  }

  private rateMetric(value: number, threshold: PerformanceThreshold): PerformanceRating {
    if (value <= threshold.good) return PerformanceRating.GOOD;
    if (value <= threshold.needsImprovement) return PerformanceRating.NEEDS_IMPROVEMENT;
    return PerformanceRating.POOR;
  }

  private getContext(): PerformanceContext {
    return {
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight
      } : undefined,
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType()
    };
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getConnectionType(): string {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  getVitals(): CoreWebVitals {
    return {
      lcp: this.vitals.get('lcp'),
      fid: this.vitals.get('fid'),
      cls: this.vitals.get('cls'),
      fcp: this.vitals.get('fcp'),
      ttfb: this.vitals.get('ttfb')
    };
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Resource Performance Monitor
export class ResourcePerformanceMonitor {
  private resourceTimings: ResourceTiming[] = [];

  constructor(private onMetric: (metric: PerformanceMetric) => void) {
    this.initializeObserver();
  }

  private initializeObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          if (entry.entryType === 'resource') {
            this.processResourceEntry(entry as PerformanceResourceTiming);
          }
        }
      });
      
      observer.observe({ type: 'resource', buffered: true });
    } catch (error) {
      console.warn('Resource timing observation not supported:', error);
    }
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const resourceTiming: ResourceTiming = {
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize || 0,
      type: this.getResourceType(entry.name),
      startTime: entry.startTime,
      endTime: entry.startTime + entry.duration,
      transferSize: entry.transferSize || 0,
      encodedBodySize: entry.encodedBodySize || 0,
      decodedBodySize: entry.decodedBodySize || 0
    };

    this.resourceTimings.push(resourceTiming);

    // Emit metric for slow resources
    if (entry.duration > 1000) { // Resources taking more than 1 second
      this.onMetric({
        id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: MetricType.RESOURCE_TIMING,
        name: `Slow Resource: ${this.getResourceName(entry.name)}`,
        value: entry.duration,
        unit: 'ms',
        context: {
          url: entry.name,
          additionalData: {
            resourceType: resourceTiming.type,
            size: resourceTiming.size
          }
        },
        threshold: { good: 500, needsImprovement: 1000, poor: Infinity },
        rating: entry.duration > 2000 ? PerformanceRating.POOR : 
                entry.duration > 1000 ? PerformanceRating.NEEDS_IMPROVEMENT : 
                PerformanceRating.GOOD
      });
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private getResourceName(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || url;
    } catch {
      return url;
    }
  }

  getResourceTimings(): ResourceTiming[] {
    return [...this.resourceTimings];
  }

  getSlowResources(threshold = 1000): ResourceTiming[] {
    return this.resourceTimings.filter(r => r.duration > threshold);
  }

  getLargeResources(threshold = 100000): ResourceTiming[] { // 100KB
    return this.resourceTimings.filter(r => r.size > threshold);
  }
}

// Memory Monitor
export class MemoryMonitor {
  private memoryUsage: MemoryUsage[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  constructor(private onMetric: (metric: PerformanceMetric) => void) {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    if (typeof window === 'undefined' || !('performance' in window) || !(window.performance as any).memory) {
      return;
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMemoryUsage();
    }, 30000); // Every 30 seconds

    // Initial collection
    this.collectMemoryUsage();
  }

  private collectMemoryUsage(): void {
    if (typeof window === 'undefined' || !(window.performance as any).memory) {
      return;
    }

    const memory = (window.performance as any).memory;
    const usage: MemoryUsage = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: new Date()
    };

    this.memoryUsage.push(usage);

    // Keep only last 100 measurements
    if (this.memoryUsage.length > 100) {
      this.memoryUsage = this.memoryUsage.slice(-100);
    }

    // Check for memory issues
    const memoryUtilization = usage.usedJSHeapSize / usage.jsHeapSizeLimit;
    
    if (memoryUtilization > 0.8) { // 80% memory usage
      this.onMetric({
        id: `memory_${Date.now()}`,
        timestamp: new Date(),
        type: MetricType.MEMORY_USAGE,
        name: 'High Memory Usage',
        value: memoryUtilization * 100,
        unit: '%',
        context: {
          additionalData: {
            usedJSHeapSize: usage.usedJSHeapSize,
            totalJSHeapSize: usage.totalJSHeapSize,
            jsHeapSizeLimit: usage.jsHeapSizeLimit
          }
        },
        threshold: { good: 60, needsImprovement: 80, poor: Infinity },
        rating: memoryUtilization > 0.9 ? PerformanceRating.POOR : PerformanceRating.NEEDS_IMPROVEMENT
      });
    }

    // Detect potential memory leaks
    if (this.memoryUsage.length >= 10) {
      const recentUsage = this.memoryUsage.slice(-10);
      const trend = this.calculateMemoryTrend(recentUsage);
      
      if (trend > 1000000) { // 1MB increase trend
        this.onMetric({
          id: `memory_leak_${Date.now()}`,
          timestamp: new Date(),
          type: MetricType.MEMORY_USAGE,
          name: 'Potential Memory Leak',
          value: trend,
          unit: 'bytes/measurement',
          context: {
            additionalData: {
              trendOverMeasurements: 10,
              currentUsage: usage.usedJSHeapSize
            }
          },
          rating: PerformanceRating.POOR
        });
      }
    }
  }

  private calculateMemoryTrend(usage: MemoryUsage[]): number {
    if (usage.length < 2) return 0;
    
    const first = usage[0].usedJSHeapSize;
    const last = usage[usage.length - 1].usedJSHeapSize;
    
    return (last - first) / usage.length;
  }

  getMemoryUsage(): MemoryUsage[] {
    return [...this.memoryUsage];
  }

  getCurrentMemoryUsage(): MemoryUsage | null {
    return this.memoryUsage.length > 0 ? this.memoryUsage[this.memoryUsage.length - 1] : null;
  }

  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

// Main Performance Monitoring Service
export class PerformanceMonitoringService extends EventEmitter {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private coreWebVitalsMonitor: CoreWebVitalsMonitor;
  private resourceMonitor: ResourcePerformanceMonitor;
  private memoryMonitor: MemoryMonitor;
  private readonly maxMetrics = 10000;

  constructor() {
    super();
    
    this.coreWebVitalsMonitor = new CoreWebVitalsMonitor(this.handleMetric.bind(this));
    this.resourceMonitor = new ResourcePerformanceMonitor(this.handleMetric.bind(this));
    this.memoryMonitor = new MemoryMonitor(this.handleMetric.bind(this));
    
    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 300000); // Every 5 minutes
  }

  private handleMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    this.emit('metric', metric);

    // Check for performance alerts
    if (metric.rating === PerformanceRating.POOR) {
      this.createAlert(metric);
    }

    // Log significant performance issues to audit trail
    if (metric.rating === PerformanceRating.POOR || 
        (metric.type === MetricType.CORE_WEB_VITAL && metric.value > (metric.threshold?.needsImprovement || 0))) {
      this.logPerformanceIssue(metric);
    }
  }

  private createAlert(metric: PerformanceMetric): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      severity: this.determineSeverity(metric),
      metric: metric.name,
      value: metric.value,
      threshold: metric.threshold?.needsImprovement || 0,
      message: this.generateAlertMessage(metric),
      recommendations: this.generateRecommendations(metric),
      context: metric.context
    };

    this.alerts.push(alert);
    this.emit('alert', alert);
  }

  private determineSeverity(metric: PerformanceMetric): 'low' | 'medium' | 'high' | 'critical' {
    if (metric.type === MetricType.CORE_WEB_VITAL) {
      if (metric.name.includes('Layout Shift') && metric.value > 0.25) return 'high';
      if (metric.name.includes('Input Delay') && metric.value > 300) return 'high';
      if (metric.name.includes('Contentful Paint') && metric.value > 4000) return 'high';
      return 'medium';
    }
    
    if (metric.type === MetricType.MEMORY_USAGE) {
      if (metric.name.includes('Memory Leak')) return 'critical';
      if (metric.value > 90) return 'high';
      return 'medium';
    }
    
    return 'low';
  }

  private generateAlertMessage(metric: PerformanceMetric): string {
    switch (metric.type) {
      case MetricType.CORE_WEB_VITAL:
        return `${metric.name} is ${metric.value}${metric.unit}, which exceeds the recommended threshold`;
      case MetricType.MEMORY_USAGE:
        return `Memory usage is at ${metric.value}${metric.unit}, indicating potential performance issues`;
      case MetricType.RESOURCE_TIMING:
        return `Resource loading time of ${metric.value}${metric.unit} is slower than expected`;
      default:
        return `Performance metric ${metric.name} is performing poorly`;
    }
  }

  private generateRecommendations(metric: PerformanceMetric): string[] {
    const recommendations: string[] = [];
    
    switch (metric.name) {
      case 'Largest Contentful Paint':
        recommendations.push('Optimize images and use modern formats (WebP, AVIF)');
        recommendations.push('Implement lazy loading for below-the-fold content');
        recommendations.push('Use a Content Delivery Network (CDN)');
        break;
      case 'First Input Delay':
        recommendations.push('Reduce JavaScript execution time');
        recommendations.push('Split large bundles and load code on demand');
        recommendations.push('Use web workers for heavy computations');
        break;
      case 'Cumulative Layout Shift':
        recommendations.push('Set explicit dimensions for images and videos');
        recommendations.push('Avoid inserting content above existing content');
        recommendations.push('Use CSS transforms instead of changing layout properties');
        break;
      case 'High Memory Usage':
        recommendations.push('Check for memory leaks in event listeners');
        recommendations.push('Properly clean up component subscriptions');
        recommendations.push('Optimize large data structures and caching');
        break;
      default:
        recommendations.push('Monitor performance metrics regularly');
        recommendations.push('Consider code splitting and lazy loading');
    }
    
    return recommendations;
  }

  private async logPerformanceIssue(metric: PerformanceMetric): Promise<void> {
    try {
      await auditTrailService.logEvent(
        AuditEventType.PERFORMANCE_ISSUE,
        'performance_degradation',
        {
          metricName: metric.name,
          metricValue: metric.value,
          metricUnit: metric.unit,
          rating: metric.rating,
          component: metric.context.component,
          url: metric.context.url
        },
        {
          userId: metric.context.userId,
          sessionId: metric.context.sessionId,
          roles: [],
          permissions: [],
          isAuthenticated: !!metric.context.userId
        }
      );
    } catch (error) {
      console.error('Failed to log performance issue to audit trail:', error);
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    context?: Partial<PerformanceContext>
  ): void {
    const metric: PerformanceMetric = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: MetricType.CUSTOM,
      name,
      value,
      unit,
      context: { ...context } as PerformanceContext,
      rating: PerformanceRating.GOOD // Default for custom metrics
    };

    this.handleMetric(metric);
  }

  /**
   * Record component render performance
   */
  recordComponentPerformance(componentPerf: ComponentPerformance): void {
    const metric: PerformanceMetric = {
      id: `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: MetricType.COMPONENT_RENDER,
      name: `Component Render: ${componentPerf.componentName}`,
      value: componentPerf.renderTime,
      unit: 'ms',
      context: {
        component: componentPerf.componentName,
        additionalData: {
          mountTime: componentPerf.mountTime,
          updateCount: componentPerf.updateCount,
          propsSize: componentPerf.propsSize,
          stateSize: componentPerf.stateSize,
          childrenCount: componentPerf.childrenCount
        }
      },
      threshold: { good: 16, needsImprovement: 50, poor: Infinity }, // 60fps = 16ms per frame
      rating: componentPerf.renderTime > 50 ? PerformanceRating.POOR :
              componentPerf.renderTime > 16 ? PerformanceRating.NEEDS_IMPROVEMENT :
              PerformanceRating.GOOD
    };

    this.handleMetric(metric);
  }

  /**
   * Get performance report for a specific time range
   */
  getPerformanceReport(timeRange?: { start: Date; end: Date }): PerformanceReport {
    let metrics = this.metrics;
    let alerts = this.alerts;

    if (timeRange) {
      metrics = metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
      alerts = alerts.filter(a => 
        a.timestamp >= timeRange.start && a.timestamp <= timeRange.end
      );
    }

    const coreWebVitals = this.coreWebVitalsMonitor.getVitals();
    const resourceTimings = this.resourceMonitor.getResourceTimings();
    const memoryUsage = this.memoryMonitor.getMemoryUsage();

    // Calculate summary
    const renderMetrics = metrics.filter(m => m.type === MetricType.COMPONENT_RENDER);
    const loadMetrics = metrics.filter(m => m.type === MetricType.CORE_WEB_VITAL);
    
    const averageRenderTime = renderMetrics.length > 0 
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length 
      : 0;
    
    const averagePageLoadTime = coreWebVitals.lcp || 0;
    
    const memoryLeakDetected = metrics.some(m => 
      m.type === MetricType.MEMORY_USAGE && m.name.includes('Memory Leak')
    );

    const performanceScore = this.calculatePerformanceScore(coreWebVitals, metrics);
    
    const topIssues = alerts
      .filter(a => a.severity === 'high' || a.severity === 'critical')
      .map(a => a.message)
      .slice(0, 5);

    const summary: PerformanceSummary = {
      totalMetrics: metrics.length,
      averagePageLoadTime,
      averageRenderTime,
      memoryLeakDetected,
      performanceScore,
      topIssues
    };

    const recommendations = this.generatePerformanceRecommendations(metrics, coreWebVitals);

    return {
      summary,
      coreWebVitals,
      resourceTimings: resourceTimings.slice(-50), // Last 50 resources
      componentPerformance: [], // Would be populated from component metrics
      memoryUsage: memoryUsage.slice(-20), // Last 20 measurements
      alerts: alerts.slice(-20), // Last 20 alerts
      recommendations,
      timeRange: timeRange || { 
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), 
        end: new Date() 
      }
    };
  }

  private calculatePerformanceScore(vitals: CoreWebVitals, metrics: PerformanceMetric[]): number {
    let score = 100;
    
    // Deduct points for poor Core Web Vitals
    if (vitals.lcp && vitals.lcp > 4000) score -= 20;
    else if (vitals.lcp && vitals.lcp > 2500) score -= 10;
    
    if (vitals.fid && vitals.fid > 300) score -= 20;
    else if (vitals.fid && vitals.fid > 100) score -= 10;
    
    if (vitals.cls && vitals.cls > 0.25) score -= 20;
    else if (vitals.cls && vitals.cls > 0.1) score -= 10;
    
    // Deduct points for performance issues
    const poorMetrics = metrics.filter(m => m.rating === PerformanceRating.POOR);
    score -= poorMetrics.length * 5;
    
    const needsImprovementMetrics = metrics.filter(m => m.rating === PerformanceRating.NEEDS_IMPROVEMENT);
    score -= needsImprovementMetrics.length * 2;
    
    return Math.max(0, Math.min(100, score));
  }

  private generatePerformanceRecommendations(
    metrics: PerformanceMetric[], 
    vitals: CoreWebVitals
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    
    // LCP recommendations
    if (vitals.lcp && vitals.lcp > 2500) {
      recommendations.push({
        id: 'lcp_optimization',
        priority: vitals.lcp > 4000 ? 'high' : 'medium',
        category: 'loading',
        title: 'Optimize Largest Contentful Paint',
        description: 'Your LCP is slower than recommended, affecting user experience',
        impact: 'Faster page loading and better user engagement',
        effort: 'medium',
        implementation: [
          'Optimize and compress images',
          'Use modern image formats (WebP, AVIF)',
          'Implement lazy loading',
          'Use a CDN for static assets'
        ],
        estimatedImprovement: `Reduce LCP by 20-40% (${Math.round(vitals.lcp * 0.3)}ms)`
      });
    }
    
    // Memory recommendations
    const memoryIssues = metrics.filter(m => 
      m.type === MetricType.MEMORY_USAGE && m.rating === PerformanceRating.POOR
    );
    
    if (memoryIssues.length > 0) {
      recommendations.push({
        id: 'memory_optimization',
        priority: 'high',
        category: 'memory',
        title: 'Optimize Memory Usage',
        description: 'High memory usage detected, which may cause performance issues',
        impact: 'Improved application stability and performance',
        effort: 'high',
        implementation: [
          'Audit for memory leaks',
          'Optimize component lifecycle methods',
          'Implement proper cleanup in useEffect hooks',
          'Use React.memo for expensive components'
        ],
        estimatedImprovement: 'Reduce memory usage by 30-50%'
      });
    }
    
    // Bundle size recommendations
    const largeResources = this.resourceMonitor.getLargeResources(200000); // 200KB
    if (largeResources.length > 0) {
      recommendations.push({
        id: 'bundle_optimization',
        priority: 'medium',
        category: 'bundle',
        title: 'Optimize Bundle Size',
        description: 'Large JavaScript bundles detected',
        impact: 'Faster initial page load and reduced bandwidth usage',
        effort: 'medium',
        implementation: [
          'Implement code splitting',
          'Use dynamic imports for route-based splitting',
          'Remove unused dependencies',
          'Use tree shaking to eliminate dead code'
        ],
        estimatedImprovement: 'Reduce bundle size by 20-30%'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): {
    coreWebVitals: CoreWebVitals;
    memoryUsage: MemoryUsage | null;
    recentAlerts: PerformanceAlert[];
  } {
    return {
      coreWebVitals: this.coreWebVitalsMonitor.getVitals(),
      memoryUsage: this.memoryMonitor.getCurrentMemoryUsage(),
      recentAlerts: this.alerts.slice(-5)
    };
  }

  /**
   * Clear all performance data
   */
  clearData(): void {
    this.metrics = [];
    this.alerts = [];
  }

  private cleanup(): void {
    // Remove old metrics (keep last 24 hours)
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > twentyFourHoursAgo);
    this.alerts = this.alerts.filter(a => a.timestamp.getTime() > twentyFourHoursAgo);

    // Limit memory usage
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  destroy(): void {
    this.coreWebVitalsMonitor.destroy();
    this.memoryMonitor.destroy();
  }
}

// Singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();

// Convenience functions
export const performanceMonitor = {
  recordMetric: (name: string, value: number, unit: string, context?: Partial<PerformanceContext>) =>
    performanceMonitoringService.recordMetric(name, value, unit, context),
  
  recordComponentPerformance: (componentPerf: ComponentPerformance) =>
    performanceMonitoringService.recordComponentPerformance(componentPerf),
  
  getReport: (timeRange?: { start: Date; end: Date }) =>
    performanceMonitoringService.getPerformanceReport(timeRange),
  
  getCurrentMetrics: () =>
    performanceMonitoringService.getCurrentMetrics()
};