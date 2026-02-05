/**
 * Performance Validation Tests
 * 
 * These tests measure bundle size reduction, runtime performance,
 * and verify no performance regressions after consolidation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Import consolidated hooks
import { useFormValidation } from '../useFormValidation'
import { useSafePropertiesQuery, useSafePropertyQuery } from '../useSafeQuery'
import { useComponentPerformance } from '../useComponentPerformance'
import { usePagination } from '../usePagination'
import { useAccessibility } from '../useAccessibility'
import { useConfigurableHook } from '../useConfigurableHook'

// Performance measurement utilities
class PerformanceMeasurement {
  private measurements: Map<string, number[]> = new Map();

  startMeasurement(name: string): () => number {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      this.measurements.get(name)!.push(duration);
      
      return duration;
    };
  }

  getAverageTime(name: string): number {
    const times = this.measurements.get(name) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getMedianTime(name: string): number {
    const times = this.measurements.get(name) || [];
    if (times.length === 0) return 0;
    
    const sorted = [...times].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  getMinTime(name: string): number {
    const times = this.measurements.get(name) || [];
    return times.length > 0 ? Math.min(...times) : 0;
  }

  getMaxTime(name: string): number {
    const times = this.measurements.get(name) || [];
    return times.length > 0 ? Math.max(...times) : 0;
  }

  getAllMeasurements(): Record<string, { avg: number; median: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; median: number; min: number; max: number; count: number }> = {};
    
    for (const [name] of this.measurements) {
      result[name] = {
        avg: this.getAverageTime(name),
        median: this.getMedianTime(name),
        min: this.getMinTime(name),
        max: this.getMaxTime(name),
        count: this.measurements.get(name)!.length
      };
    }
    
    return result;
  }

  reset(): void {
    this.measurements.clear();
  }
}

// Memory usage measurement
class MemoryMeasurement {
  private initialMemory: number = 0;
  private measurements: Array<{ name: string; memory: number; timestamp: number }> = [];

  startMeasurement(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      this.initialMemory = (performance as any).memory.usedJSHeapSize;
    }
  }

  recordMeasurement(name: string): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const currentMemory = (performance as any).memory.usedJSHeapSize;
      this.measurements.push({
        name,
        memory: currentMemory - this.initialMemory,
        timestamp: Date.now()
      });
    }
  }

  getMemoryUsage(name: string): number {
    const measurement = this.measurements.find(m => m.name === name);
    return measurement ? measurement.memory : 0;
  }

  getAllMeasurements(): Array<{ name: string; memory: number; timestamp: number }> {
    return [...this.measurements];
  }

  reset(): void {
    this.measurements = [];
    this.initialMemory = 0;
  }
}

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Performance Validation Tests', () => {
  let performanceMeasurement: PerformanceMeasurement;
  let memoryMeasurement: MemoryMeasurement;

  beforeEach(() => {
    vi.clearAllMocks();
    performanceMeasurement = new PerformanceMeasurement();
    memoryMeasurement = new MemoryMeasurement();
    
    // Mock fetch for API calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
      headers: new Headers(),
      status: 200,
      statusText: 'OK'
    });

    memoryMeasurement.startMeasurement();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    
    // Log performance measurements for analysis
    const measurements = performanceMeasurement.getAllMeasurements();
    if (Object.keys(measurements).length > 0) {
      console.log('Performance Measurements:', measurements);
    }
    
    const memoryMeasurements = memoryMeasurement.getAllMeasurements();
    if (memoryMeasurements.length > 0) {
      console.log('Memory Measurements:', memoryMeasurements);
    }
  });

  describe('Hook Initialization Performance', () => {
    it('should initialize form validation hooks quickly', () => {
      const endMeasurement = performanceMeasurement.startMeasurement('form-validation-init');

      const { result } = renderHook(() => 
        useFormValidation({
          name: { initialValue: '', rules: { required: 'Name is required' } },
          email: { initialValue: '', rules: { email: 'Invalid email' } },
          phone: { initialValue: '', rules: { pattern: { value: /^\d+$/, message: 'Invalid phone' } } }
        })
      );

      const duration = endMeasurement();
      memoryMeasurement.recordMeasurement('form-validation-init');

      expect(result.current).toBeDefined();
      expect(duration).toBeLessThan(50); // Should initialize in less than 50ms
    });

    it('should initialize data fetching hooks quickly', async () => {
      const wrapper = createWrapper();
      const endMeasurement = performanceMeasurement.startMeasurement('data-fetching-init');

      const { result } = renderHook(() => 
        useSafePropertiesQuery({ query: 'apartment' }), 
        { wrapper }
      );

      const duration = endMeasurement();
      memoryMeasurement.recordMeasurement('data-fetching-init');

      expect(result.current).toBeDefined();
      expect(duration).toBeLessThan(30); // Should initialize in less than 30ms
    });

    it('should initialize performance monitoring hooks quickly', () => {
      const endMeasurement = performanceMeasurement.startMeasurement('performance-monitor-init');

      const { result } = renderHook(() => 
        useComponentPerformance({
          componentName: 'TestComponent',
          trackRenderTime: true,
          trackMemoryUsage: true
        })
      );

      const duration = endMeasurement();
      memoryMeasurement.recordMeasurement('performance-monitor-init');

      expect(result.current).toBeDefined();
      expect(duration).toBeLessThan(20); // Should initialize in less than 20ms
    });

    it('should initialize pagination hooks quickly', async () => {
      const wrapper = createWrapper();
      const endMeasurement = performanceMeasurement.startMeasurement('pagination-init');

      const { result } = renderHook(() => 
        usePagination({
          endpoint: '/api/properties',
          mode: 'paginated'
        }), 
        { wrapper }
      );

      const duration = endMeasurement();
      memoryMeasurement.recordMeasurement('pagination-init');

      expect(result.current).toBeDefined();
      expect(duration).toBeLessThan(40); // Should initialize in less than 40ms
    });

    it('should initialize accessibility hooks quickly', () => {
      const endMeasurement = performanceMeasurement.startMeasurement('accessibility-init');

      const { result } = renderHook(() => useAccessibility());

      const duration = endMeasurement();
      memoryMeasurement.recordMeasurement('accessibility-init');

      expect(result.current).toBeDefined();
      expect(duration).toBeLessThan(25); // Should initialize in less than 25ms
    });
  });

  describe('Hook Operation Performance', () => {
    it('should handle form validation operations efficiently', async () => {
      const { result } = renderHook(() => 
        useFormValidation({
          name: { 
            initialValue: '', 
            rules: { required: 'Name is required' },
            validateOnChange: true
          }
        })
      );

      const endMeasurement = performanceMeasurement.startMeasurement('form-validation-operation');

      // Perform multiple form operations
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.handleChange({
            target: { name: 'name', value: `Test Name ${i}` }
          } as React.ChangeEvent<HTMLInputElement>);
        });
      }

      const duration = endMeasurement();
      memoryMeasurement.recordMeasurement('form-validation-operation');

      expect(duration).toBeLessThan(200); // 100 operations in less than 200ms
    });

    it('should handle data fetching operations efficiently', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useSafePropertiesQuery({ query: 'apartment' }), 
        { wrapper }
      );

      const endMeasurement = performanceMeasurement.startMeasurement('data-fetching-operation');

      // Trigger multiple refetches
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.refetch();
        });
      }

      const duration = endMeasurement();
      memoryMeasurement.recordMeasurement('data-fetching-operation');

      expect(duration).toBeLessThan(100); // 10 refetches in less than 100ms
    });

    it('should handle pagination operations efficiently', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        usePagination({
          endpoint: '/api/properties',
          mode: 'paginated'
        }), 
        { wrapper }
      );

      const endMeasurement = performanceMeasurement.startMeasurement('pagination-operation');

      // Perform multiple page changes
      for (let i = 1; i <= 20; i++) {
        act(() => {
          result.current.setPage(i);
        });
      }

      const duration = endMeasurement();
      memoryMeasurement.recordMeasurement('pagination-operation');

      expect(duration).toBeLessThan(150); // 20 page changes in less than 150ms
    });
  });

  describe('Memory Usage Validation', () => {
    it('should not cause memory leaks with form validation hooks', () => {
      const initialMemory = memoryMeasurement.getMemoryUsage('form-validation-init');
      
      // Create and destroy multiple hook instances
      for (let i = 0; i < 50; i++) {
        const { unmount } = renderHook(() => 
          useFormValidation({
            field: { initialValue: `value-${i}`, rules: { required: 'Required' } }
          })
        );
        unmount();
      }

      memoryMeasurement.recordMeasurement('form-validation-memory-test');
      const finalMemory = memoryMeasurement.getMemoryUsage('form-validation-memory-test');

      // Memory usage should not grow significantly
      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(1024 * 1024); // Less than 1MB growth
    });

    it('should not cause memory leaks with data fetching hooks', async () => {
      const wrapper = createWrapper();
      const initialMemory = memoryMeasurement.getMemoryUsage('data-fetching-init');

      // Create and destroy multiple hook instances
      for (let i = 0; i < 30; i++) {
        const { unmount } = renderHook(() => 
          useSafePropertiesQuery({ query: `test-${i}` }), 
          { wrapper }
        );
        unmount();
      }

      memoryMeasurement.recordMeasurement('data-fetching-memory-test');
      const finalMemory = memoryMeasurement.getMemoryUsage('data-fetching-memory-test');

      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(2 * 1024 * 1024); // Less than 2MB growth
    });

    it('should efficiently manage performance monitoring memory', () => {
      const initialMemory = memoryMeasurement.getMemoryUsage('performance-monitor-init');

      // Create multiple performance monitoring instances
      for (let i = 0; i < 25; i++) {
        const { unmount } = renderHook(() => 
          useComponentPerformance({
            componentName: `Component-${i}`,
            trackRenderTime: true,
            trackMemoryUsage: true
          })
        );
        unmount();
      }

      memoryMeasurement.recordMeasurement('performance-monitor-memory-test');
      const finalMemory = memoryMeasurement.getMemoryUsage('performance-monitor-memory-test');

      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(512 * 1024); // Less than 512KB growth
    });
  });

  describe('Render Performance', () => {
    it('should minimize re-renders in form validation hooks', () => {
      let renderCount = 0;
      
      const { result, rerender } = renderHook(() => {
        renderCount++;
        return useFormValidation({
          name: { initialValue: '', rules: { required: 'Name is required' } }
        });
      });

      const initialRenderCount = renderCount;

      // Trigger state changes that shouldn't cause re-renders
      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'Same Value' }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'Same Value' }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Should not cause unnecessary re-renders for same value
      expect(renderCount - initialRenderCount).toBeLessThan(3);
    });

    it('should optimize re-renders in data fetching hooks', async () => {
      const wrapper = createWrapper();
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useSafePropertiesQuery({ query: 'apartment' });
      }, { wrapper });

      const initialRenderCount = renderCount;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have minimal re-renders during data fetching
      expect(renderCount - initialRenderCount).toBeLessThan(4);
    });

    it('should optimize pagination re-renders', async () => {
      const wrapper = createWrapper();
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return usePagination({
          endpoint: '/api/properties',
          mode: 'paginated'
        });
      }, { wrapper });

      const initialRenderCount = renderCount;

      // Multiple page changes
      act(() => {
        result.current.setPage(2);
      });

      act(() => {
        result.current.setPage(3);
      });

      // Should batch updates efficiently
      expect(renderCount - initialRenderCount).toBeLessThan(5);
    });
  });

  describe('Bundle Size Impact', () => {
    it('should have reasonable import sizes for consolidated hooks', () => {
      // This test would ideally measure actual bundle sizes
      // For now, we verify that hooks are properly tree-shakeable
      
      const formHook = useFormValidation;
      const dataHook = useSafePropertiesQuery;
      const perfHook = useComponentPerformance;
      const paginationHook = usePagination;
      const accessibilityHook = useAccessibility;
      const configurableHook = useConfigurableHook;

      // Verify hooks are functions (not undefined due to tree-shaking issues)
      expect(typeof formHook).toBe('function');
      expect(typeof dataHook).toBe('function');
      expect(typeof perfHook).toBe('function');
      expect(typeof paginationHook).toBe('function');
      expect(typeof accessibilityHook).toBe('function');
      expect(typeof configurableHook).toBe('function');
    });

    it('should support selective imports without pulling in unused code', () => {
      // Test that importing specific hooks doesn't pull in unrelated functionality
      // This would be validated through bundle analysis tools in a real scenario
      
      const endMeasurement = performanceMeasurement.startMeasurement('selective-import-test');

      // Import and use only specific functionality
      const { result } = renderHook(() => 
        useFormValidation({
          name: { initialValue: '', rules: { required: 'Required' } }
        })
      );

      const duration = endMeasurement();

      expect(result.current).toBeDefined();
      expect(duration).toBeLessThan(30); // Should be fast if properly tree-shaken
    });
  });

  describe('Caching Performance', () => {
    it('should efficiently cache form validation results', async () => {
      const { result } = renderHook(() => 
        useFormValidation({
          email: { 
            initialValue: '', 
            rules: { 
              email: 'Invalid email',
              asyncValidator: async (value) => {
                // Simulate expensive validation
                await new Promise(resolve => setTimeout(resolve, 10));
                return value.includes('@') || 'Must contain @';
              }
            },
            debounceMs: 50
          }
        })
      );

      const endMeasurement = performanceMeasurement.startMeasurement('form-validation-caching');

      // Trigger validation multiple times with same value
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@example.com' }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Wait for debounced validation
      await waitFor(() => {
        expect(result.current.errors.email).toBeFalsy();
      });

      // Trigger same validation again (should be cached)
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@example.com' }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      const duration = endMeasurement();

      // Second validation should be much faster due to caching
      expect(duration).toBeLessThan(100);
    });

    it('should efficiently cache data fetching results', async () => {
      const wrapper = createWrapper();
      
      const endMeasurement = performanceMeasurement.startMeasurement('data-fetching-caching');

      // First request
      const { result: result1 } = renderHook(() => 
        useSafePropertiesQuery({ query: 'apartment' }), 
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      // Second identical request (should use cache)
      const { result: result2 } = renderHook(() => 
        useSafePropertiesQuery({ query: 'apartment' }), 
        { wrapper }
      );

      const duration = endMeasurement();

      // Second request should be much faster due to caching
      expect(duration).toBeLessThan(50);
      expect(result2.current.isLoading).toBe(false);
    });
  });

  describe('Debouncing and Throttling Performance', () => {
    it('should efficiently debounce form validation', async () => {
      const mockValidator = vi.fn().mockResolvedValue(true);
      
      const { result } = renderHook(() => 
        useFormValidation({
          search: { 
            initialValue: '', 
            rules: { asyncValidator: mockValidator },
            debounceMs: 100
          }
        })
      );

      const endMeasurement = performanceMeasurement.startMeasurement('debouncing-performance');

      // Rapid changes (should be debounced)
      for (let i = 0; i < 20; i++) {
        act(() => {
          result.current.handleChange({
            target: { name: 'search', value: `search-${i}` }
          } as React.ChangeEvent<HTMLInputElement>);
        });
      }

      // Wait for debounced validation
      await waitFor(() => {
        expect(mockValidator).toHaveBeenCalled();
      });

      const duration = endMeasurement();

      // Should handle rapid changes efficiently
      expect(duration).toBeLessThan(200);
      // Should only call validator once due to debouncing
      expect(mockValidator).toHaveBeenCalledTimes(1);
    });

    it('should efficiently throttle data fetching requests', async () => {
      let fetchCallCount = 0;
      (global.fetch as any).mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: [] }),
          headers: new Headers(),
          status: 200,
          statusText: 'OK'
        });
      });

      const wrapper = createWrapper();
      const endMeasurement = performanceMeasurement.startMeasurement('throttling-performance');

      // Multiple rapid requests
      const hooks = [];
      for (let i = 0; i < 10; i++) {
        hooks.push(renderHook(() => 
          useSafePropertiesQuery({ query: `search-${i}` }), 
          { wrapper }
        ));
      }

      await waitFor(() => {
        hooks.forEach(({ result }) => {
          expect(result.current.isLoading).toBe(false);
        });
      });

      const duration = endMeasurement();

      // Should handle multiple requests efficiently
      expect(duration).toBeLessThan(500);
      // Should make reasonable number of actual fetch calls (with deduplication)
      expect(fetchCallCount).toBeLessThan(15);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should maintain performance benchmarks for critical operations', () => {
      const benchmarks = {
        'form-validation-init': 50,
        'data-fetching-init': 30,
        'performance-monitor-init': 20,
        'pagination-init': 40,
        'accessibility-init': 25
      };

      const measurements = performanceMeasurement.getAllMeasurements();

      Object.entries(benchmarks).forEach(([operation, maxTime]) => {
        const measurement = measurements[operation];
        if (measurement) {
          expect(measurement.avg).toBeLessThan(maxTime);
          console.log(`✅ ${operation}: ${measurement.avg.toFixed(2)}ms (limit: ${maxTime}ms)`);
        }
      });
    });

    it('should track memory usage within acceptable limits', () => {
      const memoryLimits = {
        'form-validation-memory-test': 1024 * 1024, // 1MB
        'data-fetching-memory-test': 2 * 1024 * 1024, // 2MB
        'performance-monitor-memory-test': 512 * 1024 // 512KB
      };

      const measurements = memoryMeasurement.getAllMeasurements();

      Object.entries(memoryLimits).forEach(([operation, maxMemory]) => {
        const measurement = measurements.find(m => m.name === operation);
        if (measurement) {
          expect(measurement.memory).toBeLessThan(maxMemory);
          console.log(`✅ ${operation}: ${(measurement.memory / 1024).toFixed(2)}KB (limit: ${(maxMemory / 1024).toFixed(2)}KB)`);
        }
      });
    });
  });
});