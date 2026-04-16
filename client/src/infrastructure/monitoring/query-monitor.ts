/**
 * Query Monitor - Detects and prevents infinite API queries
 * 
 * This utility monitors TanStack Query behavior and provides
 * early warning for potential infinite query loops.
 */

import { QueryClient, QueryCache } from '@tanstack/react-query'

interface QueryMetrics {
  queryKey: string;
  fetchCount: number;
  lastFetch: number;
  averageInterval: number;
  isInfiniteLoop: boolean;
}

class QueryMonitor {
  private metrics = new Map<string, QueryMetrics>();
  private readonly INFINITE_LOOP_THRESHOLD = 5; // 5 fetches in rapid succession
  private readonly RAPID_FETCH_WINDOW = 10000; // 10 seconds
  private readonly MAX_TRACKED_QUERIES = 100;

  constructor(private queryClient: QueryClient) {
    this.setupMonitoring();
  }

  private setupMonitoring(): void {
    if (process.env.NODE_ENV !== 'development') return;

    const queryCache = this.queryClient.getQueryCache();
    
    queryCache.subscribe((event) => {
      if (event.type === 'updated' && event.query.state.fetchStatus === 'fetching') {
        this.trackQuery(event.query.queryKey);
      }
    });

    // Cleanup old metrics periodically
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Every minute
  }

  private trackQuery(queryKey: readonly unknown[]): void {
    const keyString = JSON.stringify(queryKey);
    const now = Date.now();
    
    const existing = this.metrics.get(keyString);
    
    if (existing) {
      // Update existing metrics
      const timeSinceLastFetch = now - existing.lastFetch;
      const newFetchCount = existing.fetchCount + 1;
      
      // Calculate average interval
      const newAverageInterval = (existing.averageInterval + timeSinceLastFetch) / 2;
      
      // Check for infinite loop pattern
      const isInfiniteLoop = this.detectInfiniteLoop(existing, timeSinceLastFetch);
      
      this.metrics.set(keyString, {
        queryKey: keyString,
        fetchCount: newFetchCount,
        lastFetch: now,
        averageInterval: newAverageInterval,
        isInfiniteLoop,
      });
      
      if (isInfiniteLoop) {
        this.handleInfiniteLoop(keyString, newFetchCount);
      }
    } else {
      // Create new metrics entry
      if (this.metrics.size >= this.MAX_TRACKED_QUERIES) {
        this.cleanupOldMetrics();
      }
      
      this.metrics.set(keyString, {
        queryKey: keyString,
        fetchCount: 1,
        lastFetch: now,
        averageInterval: 0,
        isInfiniteLoop: false,
      });
    }
  }

  private detectInfiniteLoop(metrics: QueryMetrics, timeSinceLastFetch: number): boolean {
    // Check if we have rapid successive fetches
    if (metrics.fetchCount >= this.INFINITE_LOOP_THRESHOLD) {
      // If the last few fetches happened very quickly
      if (timeSinceLastFetch < 1000 && metrics.averageInterval < 2000) {
        return true;
      }
    }
    
    // Check for consistent rapid fetching over time window
    const fetchesInWindow = this.getFetchesInWindow(metrics);
    return fetchesInWindow >= this.INFINITE_LOOP_THRESHOLD;
  }

  private getFetchesInWindow(metrics: QueryMetrics): number {
    const now = Date.now();
    const windowStart = now - this.RAPID_FETCH_WINDOW;
    
    // Estimate fetches in window based on average interval
    if (metrics.averageInterval > 0) {
      const estimatedFetches = this.RAPID_FETCH_WINDOW / metrics.averageInterval;
      return Math.min(estimatedFetches, metrics.fetchCount);
    }
    
    return metrics.fetchCount;
  }

  private handleInfiniteLoop(queryKey: string, fetchCount: number): void {
    console.error(`🚨 [QueryMonitor] Infinite loop detected for query: ${queryKey}`);
    console.error(`   Fetch count: ${fetchCount}`);
    console.error(`   This query has been fetching repeatedly in a short time window.`);
    
    // Try to cancel the problematic query
    try {
      const parsedKey = JSON.parse(queryKey);
      this.queryClient.cancelQueries({ queryKey: parsedKey });
      console.log(`   ✅ Cancelled query: ${queryKey}`);
    } catch (error) {
      console.error(`   ❌ Failed to cancel query: ${error}`);
    }
    
    // Provide debugging information
    this.logDebuggingInfo(queryKey);
  }

  private logDebuggingInfo(queryKey: string): void {
    console.group(`🔍 [QueryMonitor] Debugging info for: ${queryKey}`);
    
    const metrics = this.metrics.get(queryKey);
    if (metrics) {
      console.log('Metrics:', {
        fetchCount: metrics.fetchCount,
        averageInterval: `${metrics.averageInterval.toFixed(2)}ms`,
        lastFetch: new Date(metrics.lastFetch).toISOString(),
      });
    }
    
    // Show all active queries
    const activeQueries = this.queryClient.getQueryCache()
      .getAll()
      .filter(q => q.state.fetchStatus === 'fetching');
    
    console.log('Active queries:', activeQueries.length);
    activeQueries.forEach(query => {
      console.log(`  - ${JSON.stringify(query.queryKey)}`);
    });
    
    // Show query state
    try {
      const parsedKey = JSON.parse(queryKey);
      const queryState = this.queryClient.getQueryState(parsedKey);
      console.log('Query state:', queryState);
    } catch (error) {
      console.log('Could not get query state:', error);
    }
    
    console.groupEnd();
  }

  private cleanupOldMetrics(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [key, metrics] of this.metrics.entries()) {
      if (now - metrics.lastFetch > maxAge) {
        this.metrics.delete(key);
      }
    }
  }

  // Public methods for debugging
  public getMetrics(): Map<string, QueryMetrics> {
    return new Map(this.metrics);
  }

  public getProblematicQueries(): QueryMetrics[] {
    return Array.from(this.metrics.values())
      .filter(m => m.isInfiniteLoop || m.fetchCount > 10);
  }

  public resetMetrics(queryKey?: string): void {
    if (queryKey) {
      this.metrics.delete(queryKey);
    } else {
      this.metrics.clear();
    }
  }

  public generateReport(): string {
    const allMetrics = Array.from(this.metrics.values());
    const problematicQueries = this.getProblematicQueries();
    
    return `
# Query Monitor Report

## Summary
- Total tracked queries: ${allMetrics.length}
- Problematic queries: ${problematicQueries.length}
- Generated at: ${new Date().toISOString()}

## Problematic Queries
${problematicQueries.map(m => `
### ${m.queryKey}
- Fetch count: ${m.fetchCount}
- Average interval: ${m.averageInterval.toFixed(2)}ms
- Last fetch: ${new Date(m.lastFetch).toISOString()}
- Infinite loop detected: ${m.isInfiniteLoop ? 'YES' : 'NO'}
`).join('\n')}

## All Queries (Top 10 by fetch count)
${allMetrics
  .sort((a, b) => b.fetchCount - a.fetchCount)
  .slice(0, 10)
  .map(m => `- ${m.queryKey}: ${m.fetchCount} fetches`)
  .join('\n')}
`;
  }
}

// Global instance for development
let globalQueryMonitor: QueryMonitor | null = null;

export function setupQueryMonitoring(queryClient: QueryClient): QueryMonitor | null {
  if (process.env.NODE_ENV !== 'development') return null;
  
  if (!globalQueryMonitor) {
    globalQueryMonitor = new QueryMonitor(queryClient);
    
    // Add to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).__queryMonitor = globalQueryMonitor;
    }
  }
  
  return globalQueryMonitor;
}

export function getQueryMonitor(): QueryMonitor | null {
  return globalQueryMonitor;
}

export { QueryMonitor };