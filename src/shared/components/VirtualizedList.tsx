import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeList as List, VariableSizeList, ListChildComponentProps } from 'react-window';
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { LoadingSkeleton } from './ui/loading-skeleton';

export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  height: number;
  width?: number;
  renderItem: (props: {
    item: T;
    index: number;
    style: React.CSSProperties;
    isScrolling?: boolean;
  }) => React.ReactNode;
  onLoadMore?: () => Promise<void>;
  hasNextPage?: boolean;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  scrollToIndex?: number;
  scrollToAlignment?: 'auto' | 'smart' | 'center' | 'end' | 'start';
}

export interface VirtualizedGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  columnCount: number;
  height: number;
  width: number;
  renderItem: (props: {
    item: T;
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    isScrolling?: boolean;
  }) => React.ReactNode;
  onLoadMore?: () => Promise<void>;
  hasNextPage?: boolean;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  overscan?: number;
  className?: string;
}

/**
 * Virtualized list component for efficient rendering of large datasets
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  width = 300,
  renderItem,
  onLoadMore,
  hasNextPage = false,
  isLoading = false,
  loadingComponent,
  emptyComponent,
  overscan = 5,
  className,
  onScroll,
  scrollToIndex,
  scrollToAlignment = 'auto'
}: VirtualizedListProps<T>) {
  const listRef = useRef<List | VariableSizeList>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Determine if we need variable or fixed size list
  const isVariableSize = typeof itemHeight === 'function';

  // Memoize item count for infinite loading
  const itemCount = useMemo(() => {
    return hasNextPage ? items.length + 1 : items.length;
  }, [items.length, hasNextPage]);

  // Check if item is loaded
  const isItemLoaded = useCallback((index: number) => {
    return index < items.length;
  }, [items.length]);

  // Load more items
  const loadMoreItems = useCallback(async () => {
    if (isLoading || !onLoadMore) return;
    await onLoadMore();
  }, [isLoading, onLoadMore]);

  // Handle scroll events
  const handleScroll = useCallback((props: any) => {
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set timeout to detect scroll end
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    onScroll?.(props.scrollTop);
  }, [onScroll]);

  // Scroll to specific index
  useEffect(() => {
    if (scrollToIndex !== undefined && listRef.current) {
      listRef.current.scrollToItem(scrollToIndex, scrollToAlignment);
    }
  }, [scrollToIndex, scrollToAlignment]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Render individual list item
  const renderListItem = useCallback(({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    
    // Show loading placeholder for items being loaded
    if (!item) {
      return (
        <div style={style}>
          {loadingComponent || <LoadingSkeleton variant="card" />}
        </div>
      );
    }

    return renderItem({
      item,
      index,
      style,
      isScrolling
    });
  }, [items, renderItem, isScrolling, loadingComponent]);

  // Show empty state if no items
  if (items.length === 0 && !isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        {emptyComponent || (
          <div className="text-center text-muted-foreground">
            <p>No items to display</p>
          </div>
        )}
      </div>
    );
  }

  // Render with infinite loading if onLoadMore is provided
  if (onLoadMore) {
    return (
      <div className={className}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }: any) => {
            if (isVariableSize) {
              return (
                <VariableSizeList
                  ref={(list) => {
                    ref(list);
                    (listRef as any).current = list;
                  }}
                  height={height}
                  width={width}
                  itemCount={itemCount}
                  itemSize={itemHeight as (index: number) => number}
                  onItemsRendered={onItemsRendered}
                  onScroll={handleScroll}
                  overscanCount={overscan}
                >
                  {renderListItem}
                </VariableSizeList>
              );
            } else {
              return (
                <List
                  ref={(list) => {
                    ref(list);
                    (listRef as any).current = list;
                  }}
                  height={height}
                  width={width}
                  itemCount={itemCount}
                  itemSize={itemHeight as number}
                  onItemsRendered={onItemsRendered}
                  onScroll={handleScroll}
                  overscanCount={overscan}
                >
                  {renderListItem}
                </List>
              );
            }
          }}
        </InfiniteLoader>
      </div>
    );
  }

  // Render without infinite loading
  if (isVariableSize) {
    return (
      <div className={className}>
        <VariableSizeList
          ref={listRef as any}
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={itemHeight as (index: number) => number}
          onScroll={handleScroll}
          overscanCount={overscan}
        >
          {renderListItem}
        </VariableSizeList>
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        ref={listRef as any}
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={itemHeight as number}
        onScroll={handleScroll}
        overscanCount={overscan}
      >
        {renderListItem}
      </List>
    </div>
  );
}

/**
 * Virtualized grid component for efficient rendering of large datasets in grid layout
 */
export function VirtualizedGrid<T>({
  items,
  itemWidth,
  itemHeight,
  columnCount,
  height,
  width,
  renderItem,
  onLoadMore,
  hasNextPage = false,
  isLoading = false,
  loadingComponent,
  emptyComponent,
  overscan = 5,
  className
}: VirtualizedGridProps<T>) {
  const gridRef = useRef<Grid>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate row count
  const rowCount = useMemo(() => {
    const totalItems = hasNextPage ? items.length + columnCount : items.length;
    return Math.ceil(totalItems / columnCount);
  }, [items.length, columnCount, hasNextPage]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Render individual grid item
  const renderGridItem = useCallback(({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
    const itemIndex = rowIndex * columnCount + columnIndex;
    const item = items[itemIndex];
    
    // Don't render if beyond items length
    if (itemIndex >= items.length && !hasNextPage) {
      return null;
    }

    // Show loading placeholder for items being loaded
    if (!item) {
      return (
        <div style={style}>
          {loadingComponent || <LoadingSkeleton variant="card" />}
        </div>
      );
    }

    return renderItem({
      item,
      columnIndex,
      rowIndex,
      style,
      isScrolling
    });
  }, [items, columnCount, renderItem, isScrolling, loadingComponent, hasNextPage]);

  // Load more items when scrolling near the end
  const handleItemsRendered = useCallback(({ visibleRowStopIndex }: any) => {
    if (hasNextPage && !isLoading && onLoadMore && visibleRowStopIndex >= rowCount - 2) {
      onLoadMore();
    }
  }, [hasNextPage, isLoading, onLoadMore, rowCount]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Show empty state if no items
  if (items.length === 0 && !isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        {emptyComponent || (
          <div className="text-center text-muted-foreground">
            <p>No items to display</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Grid
        ref={gridRef}
        columnCount={columnCount}
        columnWidth={itemWidth}
        height={height}
        rowCount={rowCount}
        rowHeight={itemHeight}
        width={width}
        onScroll={handleScroll}
        onItemsRendered={handleItemsRendered}
        overscanRowCount={overscan}
        overscanColumnCount={overscan}
      >
        {renderGridItem}
      </Grid>
    </div>
  );
}

/**
 * Hook for managing virtualized list state
 */
export function useVirtualizedList<T>(
  initialItems: T[] = [],
  loadMoreFn?: () => Promise<T[]>
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !loadMoreFn || !hasNextPage) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const newItems = await loadMoreFn();
      
      if (newItems.length === 0) {
        setHasNextPage(false);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, loadMoreFn, hasNextPage]);

  const reset = useCallback(() => {
    setItems(initialItems);
    setHasNextPage(true);
    setError(null);
    setIsLoading(false);
  }, [initialItems]);

  const addItems = useCallback((newItems: T[]) => {
    setItems(prev => [...prev, ...newItems]);
  }, []);

  const updateItem = useCallback((index: number, updatedItem: T) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = updatedItem;
      return newItems;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    items,
    isLoading,
    hasNextPage,
    error,
    loadMore,
    reset,
    addItems,
    updateItem,
    removeItem
  };
}

export default VirtualizedList;