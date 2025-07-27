// Performance monitoring utility for detecting race conditions and infinite API calls
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private apiCallCount = 0;
  private apiCallHistory: Array<{ timestamp: number; filters: string }> = [];
  private renderCount = 0;
  private lastRenderTime = 0;
  private componentName = '';

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
    this.apiCallCount++;
    const timestamp = Date.now();
    const filterString = JSON.stringify(filters);
    
    this.apiCallHistory.push({ timestamp, filters: filterString });
    
    // Keep only last 50 calls for memory efficiency
    if (this.apiCallHistory.length > 50) {
      this.apiCallHistory = this.apiCallHistory.slice(-50);
    }

    // Detect potential infinite API calls
    this.detectInfiniteApiCalls();
    
    console.log(`[${this.componentName}] API Call #${this.apiCallCount}:`, filterString);
  }

  trackRender(): void {
    this.renderCount++;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - this.lastRenderTime;
    this.lastRenderTime = currentTime;

    // Detect excessive re-renders
    if (timeSinceLastRender < 16) { // Less than 1 frame (60fps)
      console.warn(`[${this.componentName}] Potential excessive re-render detected. Time since last render: ${timeSinceLastRender}ms`);
    }

    console.log(`[${this.componentName}] Render #${this.renderCount}`);
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