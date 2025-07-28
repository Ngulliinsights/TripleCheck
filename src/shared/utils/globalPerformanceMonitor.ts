import { raceConditionTester } from '../../property/utils/raceConditionTest';

// Global performance monitoring utility that works with any component
export class GlobalPerformanceMonitor {
  private static instance: GlobalPerformanceMonitor;
  private componentStats = new Map<string, {
    apiCallCount: number;
    apiCallHistory: Array<{ timestamp: number; data: string }>;
    renderCount: number;
    lastRenderTime: number;
    lastApiCallTime: number;
  }>();

  static getInstance(): GlobalPerformanceMonitor {
    if (!GlobalPerformanceMonitor.instance) {
      GlobalPerformanceMonitor.instance = new GlobalPerformanceMonitor();
    }
    return GlobalPerformanceMonitor.instance;
  }

  private getComponentStats(componentName: string) {
    if (!this.componentStats.has(componentName)) {
      this.componentStats.set(componentName, {
        apiCallCount: 0,
        apiCallHistory: [],
        renderCount: 0,
        lastRenderTime: 0,
        lastApiCallTime: 0,
      });
    }
    return this.componentStats.get(componentName)!;
  }

  trackApiCall(componentName: string, data: any): void {
    const timestamp = Date.now();
    const dataString = JSON.stringify(data);
    const stats = this.getComponentStats(componentName);
    
    // Throttle API call tracking to prevent overwhelming the monitor
    if (timestamp - stats.lastApiCallTime < 50) {
      if (import.meta.env.MODE === "development") {
        console.warn(`[${componentName}] API call tracking throttled (${timestamp - stats.lastApiCallTime}ms since last)`);
      }
      return;
    }
    
    stats.lastApiCallTime = timestamp;
    
    // Check if this is a duplicate of the last call within a short timeframe
    const lastCall = stats.apiCallHistory[stats.apiCallHistory.length - 1];
    if (lastCall && 
        lastCall.data === dataString && 
        timestamp - lastCall.timestamp < 200) {
      if (import.meta.env.MODE === "development") {
        console.warn(`[${componentName}] Duplicate API call detected within 200ms - skipping track`);
      }
      return;
    }
    
    stats.apiCallCount++;
    stats.apiCallHistory.push({ timestamp, data: dataString });

    // Keep only recent history (last 50 calls)
    if (stats.apiCallHistory.length > 50) {
      stats.apiCallHistory = stats.apiCallHistory.slice(-50);
    }

    if (import.meta.env.MODE === "development") {
      console.log(`[${componentName}] API Call #${stats.apiCallCount} (${timestamp - (lastCall?.timestamp || timestamp)}ms since last):`, data);
    }

    // Update race condition tester
    raceConditionTester.recordApiCall();
  }

  trackRender(componentName: string): void {
    const timestamp = Date.now();
    const stats = this.getComponentStats(componentName);
    
    stats.renderCount++;
    
    // Check for excessive re-renders
    if (stats.lastRenderTime && timestamp - stats.lastRenderTime < 5) {
      if (import.meta.env.MODE === "development") {
        console.warn(`[${componentName}] Potential excessive re-render detected. Time since last render: ${timestamp - stats.lastRenderTime}ms`);
      }
    }
    
    stats.lastRenderTime = timestamp;

    if (import.meta.env.MODE === "development") {
      console.log(`[${componentName}] Render #${stats.renderCount}`);
    }

    // Update race condition tester
    raceConditionTester.recordRender();
  }

  getStats(componentName: string) {
    const stats = this.getComponentStats(componentName);
    const now = Date.now();
    
    // Calculate recent API calls (last 10 seconds)
    const recentCalls = stats.apiCallHistory.filter(call => now - call.timestamp < 10000);
    
    // Calculate average time between calls
    let averageTimeBetweenCalls = 0;
    if (stats.apiCallHistory.length > 1) {
      const lastCall = stats.apiCallHistory[stats.apiCallHistory.length - 1];
      const firstCall = stats.apiCallHistory[0];
      if (lastCall && firstCall) {
        const totalTime = lastCall.timestamp - firstCall.timestamp;
        averageTimeBetweenCalls = totalTime / (stats.apiCallHistory.length - 1);
      }
    }

    return {
      totalApiCalls: stats.apiCallCount,
      totalRenders: stats.renderCount,
      recentApiCalls: recentCalls.length,
      averageTimeBetweenCalls,
      lastRenderTime: stats.lastRenderTime,
      lastApiCallTime: stats.lastApiCallTime,
    };
  }

  getAllComponentStats() {
    const allStats: Record<string, any> = {};
    for (const [componentName] of this.componentStats) {
      allStats[componentName] = this.getStats(componentName);
    }
    return allStats;
  }

  reset(componentName?: string): void {
    if (componentName) {
      this.componentStats.delete(componentName);
    } else {
      this.componentStats.clear();
    }
    raceConditionTester.reset();
  }

  // Get performance issues across all components
  getGlobalPerformanceIssues() {
    const issues: string[] = [];
    const allStats = this.getAllComponentStats();

    for (const [componentName, stats] of Object.entries(allStats)) {
      if (stats.averageTimeBetweenCalls < 300 && stats.totalApiCalls > 5) {
        issues.push(`${componentName}: Rapid API calls detected (avg ${Math.round(stats.averageTimeBetweenCalls)}ms between calls)`);
      }
      
      if (stats.recentApiCalls > 10) {
        issues.push(`${componentName}: High API call frequency (${stats.recentApiCalls} calls in last 10s)`);
      }
    }

    return issues;
  }
}

// React hook for global performance monitoring
export const useGlobalPerformanceMonitor = (componentName: string) => {
  const monitor = GlobalPerformanceMonitor.getInstance();
  
  return {
    trackApiCall: (data: any) => monitor.trackApiCall(componentName, data),
    trackRender: () => monitor.trackRender(componentName),
    getStats: () => monitor.getStats(componentName),
    reset: () => monitor.reset(componentName),
  };
};

export default GlobalPerformanceMonitor;