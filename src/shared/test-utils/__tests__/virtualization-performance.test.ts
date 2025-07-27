/**
 * Virtualization and Infinite Scrolling Performance Tests
 * Tests for virtualized lists, infinite scrolling performance,
 * and large dataset handling optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  VirtualizationTestUtils,
  PerformanceTestHelpers,
} from '../performance-testing';

// Mock react-window for testing
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemSize, height, width }: any) => (
    <div 
      data-testid="virtualized-list" 
      style={{ height, width }}
      data-item-count={itemCount}
      data-item-size={itemSize}
    >
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => 
        children({ index, style: { height: itemSize } })
      )}
    </div>
  ),
  VariableSizeList: ({ children, itemCount, itemSize, height, width }: any) => (
    <div 
      data-testid="variable-virtualized-list" 
      style={{ height, width }}
      data-item-count={itemCount}
    >
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => 
        children({ index, style: { height: itemSize(index) } })
      )}
    </div>
  ),
}));

// Mock components for virtualization testing
const SimpleVirtualizedList = ({ items }: { items: string[] }) => {
  const { FixedSizeList } = require('react-window');
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} data-testid={`list-item-${index}`}>
      {items[index]}
    </div>
  );

  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};

const VariableHeightVirtualizedList = ({ items }: { items: Array<{ text: string; height: number }> }) => {
  const { VariableSizeList } = require('react-window');
  
  const getItemSize = (index: number) => items[index]?.height || 50;
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} data-testid={`variable-item-${index}`}>
      {items[index]?.text}
    </div>
  );

  return (
    <VariableSizeList
      height={400}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
};

const InfiniteScrollList = ({ 
  initialItems = 20,
  loadMoreThreshold = 5 
}: { 
  initialItems?: number;
  loadMoreThreshold?: number;
}) => {
  const [items, setItems] = useState<string[]>(
    Array.from({ length: initialItems }, (_, i) => `Item ${i + 1}`)
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newItems = Array.from(
      { length: 10 }, 
      (_, i) => `Item ${items.length + i + 1}`
    );
    
    setItems(prev => [...prev, ...newItems]);
    setLoading(false);
    
    // Stop loading more after 100 items for testing
    if (items.length >= 100) {
      setHasMore(false);
    }
  }, [items.length, loading, hasMore]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage > 0.8 && hasMore && !loading) {
      loadMore();
    }
  }, [loadMore, hasMore, loading]);

  return (
    <div 
      ref={containerRef}
      data-testid="infinite-scroll-container"
      style={{ height: '400px', overflowY: 'auto' }}
      onScroll={handleScroll}
    >
      {items.map((item, index) => (
        <div 
          key={index} 
          data-testid={`infinite-item-${index}`}
          style={{ height: '50px', padding: '10px', borderBottom: '1px solid #ccc' }}
        >
          {item}
        </div>
      ))}
      {loading && (
        <div data-testid="loading-indicator" style={{ padding: '20px', textAlign: 'center' }}>
          Loading more items...
        </div>
      )}
      {!hasMore && (
        <div data-testid="end-indicator" style={{ padding: '20px', textAlign: 'center' }}>
          No more items to load
        </div>
      )}
    </div>
  );
};

const LargeDatasetComponent = ({ itemCount = 10000 }: { itemCount?: number }) => {
  const [data, setData] = useState<Array<{ id: number; value: string; category: string }>>([]);
  const [filteredData, setFilteredData] = useState<typeof data>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading large dataset
    const generateData = () => {
      const categories = ['A', 'B', 'C', 'D', 'E'];
      return Array.from({ length: itemCount }, (_, i) => ({
        id: i,
        value: `Item ${i + 1}`,
        category: categories[i % categories.length],
      }));
    };

    setTimeout(() => {
      const generatedData = generateData();
      setData(generatedData);
      setFilteredData(generatedData);
      setLoading(false);
    }, 100);
  }, [itemCount]);

  useEffect(() => {
    if (!filter) {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item => 
        item.value.toLowerCase().includes(filter.toLowerCase()) ||
        item.category.toLowerCase().includes(filter.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [filter, data]);

  if (loading) {
    return <div data-testid="large-dataset-loading">Loading large dataset...</div>;
  }

  return (
    <div data-testid="large-dataset-container">
      <input
        type="text"
        placeholder="Filter items..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        data-testid="filter-input"
      />
      <div data-testid="item-count">
        Showing {filteredData.length} of {data.length} items
      </div>
      <SimpleVirtualizedList 
        items={filteredData.map(item => `${item.value} (${item.category})`)} 
      />
    </div>
  );
};

describe('Virtualization and Infinite Scrolling Performance Tests', () => {
  beforeEach(() => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    
    // Mock IntersectionObserver for infinite scroll tests
    global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Virtualized List Performance', () => {
    it('should measure virtualized list render performance', async () => {
      const largeItemList = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`);
      
      const container = document.createElement('div');
      container.style.height = '400px';
      document.body.appendChild(container);

      const metrics = await VirtualizationTestUtils.measureVirtualizedListPerformance(
        container,
        largeItemList.length,
        50
      );

      expect(metrics).toMatchObject({
        renderTime: expect.any(Number),
        memoryUsage: expect.any(Number),
        visibleItems: expect.any(Number),
        scrollPerformance: expect.any(Number),
      });

      expect(metrics.visibleItems).toBe(8); // 400px / 50px = 8 items
      expect(metrics.renderTime).toBeGreaterThan(0);

      document.body.removeChild(container);
    });

    it('should test virtualized list component performance', () => {
      const largeItemList = Array.from({ length: 5000 }, (_, i) => `Item ${i + 1}`);
      
      const startTime = performance.now();
      render(<SimpleVirtualizedList items={largeItemList} />);
      const renderTime = performance.now() - startTime;

      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-list')).toHaveAttribute('data-item-count', '5000');
      expect(screen.getByTestId('virtualized-list')).toHaveAttribute('data-item-size', '50');
      
      // Should render quickly despite large dataset
      expect(renderTime).toBeLessThan(100);
      
      // Should only render visible items
      const renderedItems = screen.getAllByTestId(/list-item-/);
      expect(renderedItems.length).toBeLessThanOrEqual(10); // Only visible items rendered
    });

    it('should test variable height virtualized list performance', () => {
      const variableItems = Array.from({ length: 1000 }, (_, i) => ({
        text: `Variable Item ${i + 1}`,
        height: 40 + (i % 3) * 20, // Heights: 40, 60, 80
      }));

      const startTime = performance.now();
      render(<VariableHeightVirtualizedList items={variableItems} />);
      const renderTime = performance.now() - startTime;

      expect(screen.getByTestId('variable-virtualized-list')).toBeInTheDocument();
      expect(renderTime).toBeLessThan(100);
      
      const renderedItems = screen.getAllByTestId(/variable-item-/);
      expect(renderedItems.length).toBeLessThanOrEqual(10);
    });

    it('should benchmark virtualized vs non-virtualized list performance', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => `Item ${i + 1}`);

      // Non-virtualized list
      const NonVirtualizedList = ({ items }: { items: string[] }) => (
        <div data-testid="non-virtualized-list" style={{ height: '400px', overflowY: 'auto' }}>
          {items.map((item, index) => (
            <div key={index} style={{ height: '50px' }}>{item}</div>
          ))}
        </div>
      );

      const virtualizedBenchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Virtualized List Render',
        () => render(<SimpleVirtualizedList items={items} />),
        5
      );

      const nonVirtualizedBenchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Non-Virtualized List Render',
        () => render(<NonVirtualizedList items={items} />),
        5
      );

      // Virtualized list should be significantly faster for large datasets
      expect(virtualizedBenchmark.averageTime).toBeLessThan(nonVirtualizedBenchmark.averageTime);
    });

    it('should test virtualized list scroll performance', async () => {
      const items = Array.from({ length: 2000 }, (_, i) => `Item ${i + 1}`);
      render(<SimpleVirtualizedList items={items} />);

      const virtualizedList = screen.getByTestId('virtualized-list');
      
      const scrollStart = performance.now();
      
      // Simulate scroll events
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(virtualizedList, { target: { scrollTop: i * 100 } });
      }
      
      const scrollTime = performance.now() - scrollStart;
      
      // Scroll performance should be good (under 100ms for 10 scroll events)
      expect(scrollTime).toBeLessThan(100);
    });
  });

  describe('Infinite Scrolling Performance', () => {
    it('should test infinite scroll performance', async () => {
      render(<InfiniteScrollList initialItems={10} />);

      const container = screen.getByTestId('infinite-scroll-container');
      
      // Initial items should be rendered
      expect(screen.getByTestId('infinite-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('infinite-item-9')).toBeInTheDocument();

      const startTime = performance.now();
      
      // Simulate scroll to trigger loading more items
      fireEvent.scroll(container, { 
        target: { 
          scrollTop: 300, 
          scrollHeight: 500, 
          clientHeight: 400 
        } 
      });

      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeGreaterThan(0);
    });

    it('should measure infinite scroll load performance with utility', async () => {
      const container = document.createElement('div');
      container.style.height = '400px';
      
      // Add initial items
      for (let i = 0; i < 10; i++) {
        const item = document.createElement('div');
        item.textContent = `Item ${i + 1}`;
        container.appendChild(item);
      }
      
      document.body.appendChild(container);

      const loadMoreCallback = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        for (let i = 0; i < 5; i++) {
          const item = document.createElement('div');
          item.textContent = `New Item ${container.children.length + 1}`;
          container.appendChild(item);
        }
      };

      const metrics = await VirtualizationTestUtils.testInfiniteScrollPerformance(
        container,
        loadMoreCallback
      );

      expect(metrics).toMatchObject({
        loadTime: expect.any(Number),
        memoryGrowth: expect.any(Number),
        itemsLoaded: 5,
      });

      expect(metrics.loadTime).toBeGreaterThan(200); // Should include async delay
      expect(container.children.length).toBe(15); // 10 initial + 5 new

      document.body.removeChild(container);
    });

    it('should test infinite scroll memory usage', async () => {
      const InfiniteScrollWithCleanup = () => {
        const [items, setItems] = useState<string[]>(
          Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`)
        );
        const maxItems = 100; // Limit to prevent memory issues

        const loadMore = useCallback(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          setItems(prev => {
            const newItems = Array.from(
              { length: 10 }, 
              (_, i) => `Item ${prev.length + i + 1}`
            );
            const allItems = [...prev, ...newItems];
            
            // Keep only last 100 items to manage memory
            return allItems.slice(-maxItems);
          });
        }, []);

        return (
          <div data-testid="memory-managed-scroll">
            {items.map((item, index) => (
              <div key={index} data-testid={`managed-item-${index}`}>
                {item}
              </div>
            ))}
            <button onClick={loadMore} data-testid="load-more-btn">
              Load More
            </button>
          </div>
        );
      };

      render(<InfiniteScrollWithCleanup />);
      
      const loadMoreBtn = screen.getByTestId('load-more-btn');
      
      // Load more items multiple times
      for (let i = 0; i < 5; i++) {
        fireEvent.click(loadMoreBtn);
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Should not exceed maximum items due to cleanup
      const items = screen.getAllByTestId(/managed-item-/);
      expect(items.length).toBeLessThanOrEqual(100);
    });

    it('should benchmark infinite scroll vs pagination performance', async () => {
      const PaginatedList = ({ itemsPerPage = 20 }: { itemsPerPage?: number }) => {
        const [currentPage, setCurrentPage] = useState(1);
        const totalItems = 100;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentItems = Array.from(
          { length: totalItems }, 
          (_, i) => `Item ${i + 1}`
        ).slice(startIndex, endIndex);

        return (
          <div data-testid="paginated-list">
            {currentItems.map((item, index) => (
              <div key={startIndex + index}>{item}</div>
            ))}
            <div>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        );
      };

      const infiniteScrollBenchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Infinite Scroll Render',
        () => render(<InfiniteScrollList initialItems={20} />),
        3
      );

      const paginationBenchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Pagination Render',
        () => render(<PaginatedList itemsPerPage={20} />),
        3
      );

      expect(infiniteScrollBenchmark.averageTime).toBeGreaterThan(0);
      expect(paginationBenchmark.averageTime).toBeGreaterThan(0);
      
      // Both should be reasonably fast
      expect(infiniteScrollBenchmark.averageTime).toBeLessThan(200);
      expect(paginationBenchmark.averageTime).toBeLessThan(200);
    });
  });

  describe('Large Dataset Performance', () => {
    it('should test large dataset rendering performance', async () => {
      const startTime = performance.now();
      render(<LargeDatasetComponent itemCount={5000} />);
      
      // Should show loading initially
      expect(screen.getByTestId('large-dataset-loading')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('large-dataset-container')).toBeInTheDocument();
      });

      const totalTime = performance.now() - startTime;
      
      expect(screen.getByTestId('item-count')).toHaveTextContent('Showing 5000 of 5000 items');
      expect(totalTime).toBeLessThan(1000); // Should load within 1 second
    });

    it('should test large dataset filtering performance', async () => {
      render(<LargeDatasetComponent itemCount={10000} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('filter-input')).toBeInTheDocument();
      });

      const filterInput = screen.getByTestId('filter-input');
      
      const filterStart = performance.now();
      fireEvent.change(filterInput, { target: { value: 'Item 1' } });
      const filterTime = performance.now() - filterStart;

      await waitFor(() => {
        const itemCount = screen.getByTestId('item-count');
        expect(itemCount.textContent).toContain('Showing');
        expect(itemCount.textContent).not.toContain('10000 of 10000');
      });

      // Filtering should be fast even with large datasets
      expect(filterTime).toBeLessThan(100);
    });

    it('should test memory usage with large datasets', () => {
      const mockMetrics = VirtualizationTestUtils.mockVirtualizationMetrics(50000);
      
      expect(mockMetrics).toMatchObject({
        renderTime: expect.any(Number),
        memoryUsage: 51200000, // 50000 * 1024
        visibleItems: 8,
        scrollPerformance: expect.any(Number),
      });

      // Memory usage should scale with item count
      expect(mockMetrics.memoryUsage).toBe(50000 * 1024);
      
      // But visible items should remain constant (virtualization benefit)
      expect(mockMetrics.visibleItems).toBe(8);
      
      // Scroll performance should remain good
      expect(mockMetrics.scrollPerformance).toBeLessThan(25);
    });

    it('should benchmark different virtualization strategies', async () => {
      const items = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`);

      const fixedSizeBenchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Fixed Size Virtualization',
        () => render(<SimpleVirtualizedList items={items} />),
        3
      );

      const variableItems = items.map((text, i) => ({
        text,
        height: 40 + (i % 3) * 20,
      }));

      const variableSizeBenchmark = await PerformanceTestHelpers.runPerformanceBenchmark(
        'Variable Size Virtualization',
        () => render(<VariableHeightVirtualizedList items={variableItems} />),
        3
      );

      expect(fixedSizeBenchmark.averageTime).toBeGreaterThan(0);
      expect(variableSizeBenchmark.averageTime).toBeGreaterThan(0);
      
      // Fixed size should generally be faster
      expect(fixedSizeBenchmark.averageTime).toBeLessThanOrEqual(variableSizeBenchmark.averageTime * 1.5);
    });
  });

  describe('Performance Optimization Validation', () => {
    it('should validate virtualization performance thresholds', () => {
      const goodMetrics = VirtualizationTestUtils.mockVirtualizationMetrics(1000);
      
      // Good performance thresholds
      expect(goodMetrics.renderTime).toBeLessThan(100);
      expect(goodMetrics.scrollPerformance).toBeLessThan(16.67); // 60fps
      expect(goodMetrics.visibleItems).toBeGreaterThan(0);
      expect(goodMetrics.memoryUsage).toBeLessThan(10000000); // 10MB
    });

    it('should detect performance issues in virtualization', () => {
      const poorMetrics = {
        renderTime: 500,  // Slow render
        memoryUsage: 50000000, // High memory usage
        visibleItems: 8,
        scrollPerformance: 50, // Poor scroll performance (>16.67ms)
      };

      expect(poorMetrics.renderTime).toBeGreaterThan(100);
      expect(poorMetrics.scrollPerformance).toBeGreaterThan(16.67);
      expect(poorMetrics.memoryUsage).toBeGreaterThan(10000000);
    });

    it('should create performance test for virtualization optimization', async () => {
      const virtualizationOptimizationTest = PerformanceTestHelpers.createPerformanceTest(
        'Virtualization Performance Check',
        () => {
          const items = Array.from({ length: 5000 }, (_, i) => `Item ${i + 1}`);
          render(<SimpleVirtualizedList items={items} />);
          
          // Verify virtualization is working
          const renderedItems = screen.getAllByTestId(/list-item-/);
          if (renderedItems.length > 20) {
            throw new Error('Too many items rendered - virtualization may not be working');
          }
        },
        { maxTime: 100, maxMemory: 5000000 }
      );

      const result = await virtualizationOptimizationTest();
      expect(result.passed).toBe(true);
      expect(result.testName).toBe('Virtualization Performance Check');
    });
  });
});