import { raceConditionTester } from './raceConditionTest';

// Performance monitoring utility for detecting race conditions and infinite API calls
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private apiCallCount = 0;
  private apiCallHistory: Array<{ timestamp: number; filters: string }> = [];
  private renderCount = 0;
  private lastRenderTime = 0;
  private componentName = '';
  private lastApiCallTime = 0;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  setComponentName(name: string): void {
    this.componentName = name;
  }

  trackApiCall(filters: any): void {
    const timestamp = Date.now();
    const filterString = JSON.stringify(filters);
    
    // Throttle API call tracking to prevent overwhelming the monitor
    if (timestamp - this.lastApiCallTime < 50) {
      if (import.meta.env.MODE === "development") {
        console.warn(`[${this.componentName}] API call tracking throttled (${timestamp - this.lastApiCallTime}ms since last)`);
      }
      return;
    }
    
    this.lastApiCallTime = timestamp;
    
    // Check if this is a duplicate of the last call within a short timeframe
    const lastCall = this.apiCallHistory[this.apiCallHistory.length - 1];
    if (lastCall && 
        lastCall.filters === filterString && 
        timestamp - lastCall.timestamp < 200) {
      if (import.meta.env.MODE === "development") {
        console.warn(`[${this.componentName}] Duplicate API call detected within 200ms - skipping track`);
      }
      return;
    }
    
    this.apiCallCount++;
    this.apiCallHistory.push({ timestamp, filters: filterString });
    
    // Record in race condition tester
    raceConditionTester.recordApiCall();
    
    // Keep only last 50 calls for memory efficiency
    if (this.apiCallHistory.length > 50) {
      this.apiCallHistory = this.apiCallHistory.slice(-50);
    }

    // Detect potential infinite API calls
    this.detectInfiniteApiCalls();
    
    if (import.meta.env.MODE === "development") {
      const timeSinceLastCall = lastCall ? timestamp - lastCall.timestamp : 0;
      console.log(`[${this.componentName}] API Call #${this.apiCallCount} (${timeSinceLastCall}ms since last):`, filterString);
    }
  }

  trackRender(): void {
    this.renderCount++;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - this.lastRenderTime;
    
    // Record in race condition tester
    raceConditionTester.recordRender();
    
    // Only warn if we have a previous render time and it's very recent
    if (this.lastRenderTime > 0 && timeSinceLastRender < 16) { // Less than 1 frame (60fps)
      console.warn(`[${this.componentName}] Potential excessive re-render detected. Time since last render: ${timeSinceLastRender}ms`);
    }
    
    this.lastRenderTime = currentTime;

    if (import.meta.env.MODE === "development") {
      console.log(`[${this.componentName}] Render #${this.renderCount}`);
    }
  }

  private detectInfiniteApiCalls(): void {
    const now = Date.now();
    const recentCalls = this.apiCallHistory.filter(call => now - call.timestamp < 5000); // Last 5 seconds
    
    if (recentCalls.length > 10) {
      console.error(`[${this.componentName}] PERFORMANCE WARNING: ${recentCalls.length} API calls in the last 5 seconds. Possible infinite loop!`);
      
      // Check for identical consecutive calls
      const identicalCalls = recentCalls.filter((call, index) => 
        index > 0 && call.filters === recentCalls[index - 1].filters
      );
      
      if (identicalCalls.length > 3) {
        console.error(`[${this.componentName}] RACE CONDITION DETECTED: ${identicalCalls.length} identical consecutive API calls!`);
      }
    }

    // Check for calls that are too frequent (less than 300ms apart)
    const recentCallsWithTiming = this.apiCallHistory.slice(-5);
    if (recentCallsWithTiming.length >= 2) {
      const intervals = [];
      for (let i = 1; i < recentCallsWithTiming.length; i++) {
        intervals.push(recentCallsWithTiming[i].timestamp - recentCallsWithTiming[i - 1].timestamp);
      }
      
      const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      if (averageInterval < 300 && recentCallsWithTiming.length >= 3) {
        console.warn(`[${this.componentName}] API calls too frequent. Average interval: ${averageInterval.toFixed(0)}ms (expected: 300ms+)`);
      }
    }
  }

  detectRaceConditions(): void {
    const recentCalls = this.apiCallHistory.slice(-10);
    const duplicateFilters = new Map<string, number>();
    
    recentCalls.forEach(call => {
      const count = duplicateFilters.get(call.filters) || 0;
      duplicateFilters.set(call.filters, count + 1);
    });

    duplicateFilters.forEach((count, filters) => {
      if (count > 2) {
        console.warn(`[${this.componentName}] Potential race condition: Same filters called ${count} times:`, filters);
      }
    });
  }

  getStats(): {
    totalApiCalls: number;
    totalRenders: number;
    recentApiCalls: number;
    averageTimeBetweenCalls: number;
  } {
    const now = Date.now();
    const recentCalls = this.apiCallHistory.filter(call => now - call.timestamp < 60000); // Last minute
    
    let averageTimeBetweenCalls = 0;
    if (this.apiCallHistory.length > 1) {
      const timeSpan = this.apiCallHistory[this.apiCallHistory.length - 1].timestamp - this.apiCallHistory[0].timestamp;
      averageTimeBetweenCalls = timeSpan / (this.apiCallHistory.length - 1);
    }

    return {
      totalApiCalls: this.apiCallCount,
      totalRenders: this.renderCount,
      recentApiCalls: recentCalls.length,
      averageTimeBetweenCalls
    };
  }

  reset(): void {
    this.apiCallCount = 0;
    this.apiCallHistory = [];
    this.renderCount = 0;
    this.lastRenderTime = 0;
    this.lastApiCallTime = 0;
    
    // Reset race condition tester as well
    raceConditionTester.reset();
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  monitor.setComponentName(componentName);

  return {
    trackApiCall: (filters: any) => monitor.trackApiCall(filters),
    trackRender: () => monitor.trackRender(),
    detectRaceConditions: () => monitor.detectRaceConditions(),
    getStats: () => monitor.getStats(),
    reset: () => monitor.reset()
  };
};