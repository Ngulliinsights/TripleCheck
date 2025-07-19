/**
 * Debug utilities for troubleshooting race conditions and API issues
 */

interface QueryDebugInfo {
  queryKey: any[];
  status: string;
  fetchStatus: string;
  isLoading: boolean;
  isError: boolean;
  error: any;
  data: any;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
}

interface MutationDebugInfo {
  status: string;
  isLoading: boolean;
  isError: boolean;
  error: any;
  data: any;
  variables: any;
}

/**
 * Debug React Query state to identify race conditions
 */
export function debugQuery(queryInfo: QueryDebugInfo, label?: string) {
  if (process.env.NODE_ENV !== 'development') return;
  
  const prefix = label ? `[${label}]` : '[Query Debug]';
  
  console.group(`${prefix} Query State`);
  console.log('Query Key:', queryInfo.queryKey);
  console.log('Status:', queryInfo.status);
  console.log('Fetch Status:', queryInfo.fetchStatus);
  console.log('Is Loading:', queryInfo.isLoading);
  console.log('Is Error:', queryInfo.isError);
  console.log('Data Updated At:', new Date(queryInfo.dataUpdatedAt));
  
  if (queryInfo.isError) {
    console.error('Error:', queryInfo.error);
    console.log('Error Updated At:', new Date(queryInfo.errorUpdatedAt));
  }
  
  if (queryInfo.data) {
    console.log('Data:', queryInfo.data);
  }
  
  console.groupEnd();
}

/**
 * Debug React Query mutations to identify race conditions
 */
export function debugMutation(mutationInfo: MutationDebugInfo, label?: string) {
  if (process.env.NODE_ENV !== 'development') return;
  
  const prefix = label ? `[${label}]` : '[Mutation Debug]';
  
  console.group(`${prefix} Mutation State`);
  console.log('Status:', mutationInfo.status);
  console.log('Is Loading:', mutationInfo.isLoading);
  console.log('Is Error:', mutationInfo.isError);
  
  if (mutationInfo.variables) {
    console.log('Variables:', mutationInfo.variables);
  }
  
  if (mutationInfo.isError) {
    console.error('Error:', mutationInfo.error);
  }
  
  if (mutationInfo.data) {
    console.log('Data:', mutationInfo.data);
  }
  
  console.groupEnd();
}

/**
 * Debug API calls to identify infinite loops
 */
export function debugApiCall(url: string, method: string, data?: any) {
  if (process.env.NODE_ENV !== 'development') return;
  
  const timestamp = new Date().toISOString();
  console.log(`[API Call ${timestamp}] ${method} ${url}`, data ? { data } : '');
}

/**
 * Debug component re-renders to identify UI flickering
 */
export function debugRender(componentName: string, props?: any) {
  if (process.env.NODE_ENV !== 'development') return;
  
  const timestamp = new Date().toISOString();
  console.log(`[Render ${timestamp}] ${componentName}`, props ? { props } : '');
}

/**
 * Debug race condition by tracking concurrent operations
 */
class RaceConditionTracker {
  private operations = new Map<string, number>();
  
  start(operationId: string) {
    if (process.env.NODE_ENV !== 'development') return;
    
    const count = this.operations.get(operationId) || 0;
    this.operations.set(operationId, count + 1);
    
    if (count > 0) {
      console.warn(`[Race Condition Warning] Operation "${operationId}" started ${count + 1} times concurrently`);
    }
    
    console.log(`[Operation Start] ${operationId} (concurrent: ${count + 1})`);
  }
  
  end(operationId: string) {
    if (process.env.NODE_ENV !== 'development') return;
    
    const count = this.operations.get(operationId) || 0;
    if (count > 0) {
      this.operations.set(operationId, count - 1);
    }
    
    console.log(`[Operation End] ${operationId} (remaining: ${count - 1})`);
  }
}

export const raceTracker = new RaceConditionTracker();

/**
 * Performance monitoring for API calls
 */
export class PerformanceMonitor {
  private timers = new Map<string, number>();
  
  start(label: string) {
    if (process.env.NODE_ENV !== 'development') return;
    
    this.timers.set(label, performance.now());
    console.time(label);
  }
  
  end(label: string) {
    if (process.env.NODE_ENV !== 'development') return;
    
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.timeEnd(label);
      
      if (duration > 1000) {
        console.warn(`[Performance Warning] ${label} took ${duration.toFixed(2)}ms`);
      }
      
      this.timers.delete(label);
    }
  }
}

export const perfMonitor = new PerformanceMonitor();

/**
 * Memory leak detector for React Query
 */
export function detectMemoryLeaks(queryClient: any) {
  if (process.env.NODE_ENV !== 'development') return;
  
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  
  console.group('[Memory Leak Detection]');
  console.log(`Total queries in cache: ${queries.length}`);
  
  const staleQueries = queries.filter((query: any) => 
    query.state.dataUpdatedAt < Date.now() - 10 * 60 * 1000 // 10 minutes
  );
  
  if (staleQueries.length > 0) {
    console.warn(`Found ${staleQueries.length} stale queries that might indicate memory leaks:`);
    staleQueries.forEach((query: any) => {
      console.log('- Query Key:', query.queryKey);
      console.log('  Last Updated:', new Date(query.state.dataUpdatedAt));
    });
  }
  
  console.groupEnd();
}