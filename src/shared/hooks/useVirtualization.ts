import { useCallback, useMemo, useRef, useState } from 'react';

import { useEnhancedCleanupManager } from '../../infrastructure/hooks/useCleanupManager';
import { useSafeEffect } from '../../infrastructure/hooks/useSafeEffect';

interface VirtualItem {
  index: number;
  start: number;
  size: number;
  end: number;
  key: string;
}

interface UseVirtualizationOptions {
  itemCount: number;
  itemSize: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number; // Number of items to render outside visible area
  scrollingDelay?: number; // Delay before stopping scroll state
  getItemKey?: (index: number) => string;
  horizontal?: boolean;
  paddingStart?: number;
  paddingEnd?: number;
}

interface UseVirtualizationReturn {
  virtualItems: VirtualItem[];
  totalSize: number;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => void;
  scrollToOffset: (offset: number) => void;
  isScrolling: boolean;
  containerProps: {
    ref: React.RefObject<HTMLElement>;
    style: React.CSSProperties;
  };
  innerProps: {
    style: React.CSSProperties;
  };
}

/**
 * High-performance virtualization hook for large lists
 * Essential for property listings with hundreds/thousands of items
 */
export function useVirtualization({
  itemCount,
  itemSize,
  containerHeight,
  overscan = 5,
  scrollingDelay = 150,
  getItemKey = (index) => index.toString(),
  horizontal = false,
  paddingStart = 0,
  paddingEnd = 0,
}: UseVirtualizationOptions): UseVirtualizationReturn {
  const containerRef = useRef<HTMLElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef<NodeJS.Timeout>();

  // Memoize item size function
  const getItemSize = useCallback(
    (index: number): number => {
      return typeof itemSize === 'function' ? itemSize(index) : itemSize;
    },
    [itemSize]
  );

  // Calculate item positions
  const itemOffsets = useMemo(() => {
    const offsets: number[] = [paddingStart];
    
    for (let i = 0; i < itemCount; i++) {
      offsets[i + 1] = (offsets[i] || 0) + getItemSize(i);
    }
    
    return offsets;
  }, [itemCount, getItemSize, paddingStart]);

  // Total size including padding
  const totalSize = useMemo(() => {
    return (itemOffsets[itemCount] || 0) + paddingEnd;
  }, [itemOffsets, itemCount, paddingEnd]);

  // Find visible range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, scrollOffset);
    const end = start + containerHeight;

    // Binary search for start index
    let startIndex = 0;
    let endIndex = itemCount - 1;
    
    while (startIndex <= endIndex) {
      const mid = Math.floor((startIndex + endIndex) / 2);
      const offset = itemOffsets[mid] || 0;
      
      if (offset < start) {
        startIndex = mid + 1;
      } else {
        endIndex = mid - 1;
      }
    }
    
    const visibleStartIndex = Math.max(0, endIndex);

    // Binary search for end index
    startIndex = visibleStartIndex;
    endIndex = itemCount - 1;
    
    while (startIndex <= endIndex) {
      const mid = Math.floor((startIndex + endIndex) / 2);
      const offset = itemOffsets[mid] || 0;
      
      if (offset <= end) {
        startIndex = mid + 1;
      } else {
        endIndex = mid - 1;
      }
    }
    
    const visibleEndIndex = Math.min(itemCount - 1, startIndex);

    return {
      startIndex: Math.max(0, visibleStartIndex - overscan),
      endIndex: Math.min(itemCount - 1, visibleEndIndex + overscan),
    };
  }, [scrollOffset, containerHeight, itemOffsets, itemCount, overscan]);

  // Generate virtual items
  const virtualItems = useMemo((): VirtualItem[] => {
    const items: VirtualItem[] = [];
    
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      const start = itemOffsets[i];
      const size = getItemSize(i);
      
      items.push({
        index: i,
        start: start || 0,
        size,
        end: (start || 0) + size,
        key: getItemKey(i),
      });
    }
    
    return items;
  }, [visibleRange, itemOffsets, getItemSize, getItemKey]);

  // Handle scroll events
  const handleScroll = useCallback((event: Event) => {
    const element = event.target as HTMLElement;
    const offset = horizontal ? element.scrollLeft : element.scrollTop;
    
    setScrollOffset(offset);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollingTimeoutRef.current) {
      clearTimeout(scrollingTimeoutRef.current);
    }

    // Set new timeout to stop scrolling state
    scrollingTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, scrollingDelay);
  }, [horizontal, scrollingDelay]);

  const cleanupManager = useEnhancedCleanupManager();

  // Attach scroll listener
  useSafeEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    cleanupManager.addEventListener(element, 'scroll', handleScroll, { passive: true }, 'scroll-listener');
    
    cleanupManager.addCleanup(() => {
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
    }, 'scroll-timeout');
  }, [handleScroll, cleanupManager]);

  // Scroll to index function
  const scrollToIndex = useCallback(
    (index: number, align: 'start' | 'center' | 'end' | 'auto' = 'auto') => {
      const element = containerRef.current;
      if (!element || index < 0 || index >= itemCount) return;

      const itemStart = itemOffsets[index];
      if (itemStart === undefined) return;
      
      const itemSize = getItemSize(index);
      const itemEnd = itemStart + itemSize;

      let scrollTo = itemStart;

      if (align === 'center') {
        scrollTo = itemStart - (containerHeight - itemSize) / 2;
      } else if (align === 'end') {
        scrollTo = itemEnd - containerHeight;
      } else if (align === 'auto') {
        const currentStart = scrollOffset;
        const currentEnd = scrollOffset + containerHeight;

        if (itemStart < currentStart) {
          scrollTo = itemStart;
        } else if (itemEnd > currentEnd) {
          scrollTo = itemEnd - containerHeight;
        } else {
          return; // Item is already visible
        }
      }

      const property = horizontal ? 'scrollLeft' : 'scrollTop';
      element[property] = Math.max(0, Math.min(scrollTo, totalSize - containerHeight));
    },
    [itemOffsets, getItemSize, containerHeight, scrollOffset, horizontal, totalSize, itemCount]
  );

  // Scroll to offset function
  const scrollToOffset = useCallback(
    (offset: number) => {
      const element = containerRef.current;
      if (!element) return;

      const property = horizontal ? 'scrollLeft' : 'scrollTop';
      element[property] = Math.max(0, Math.min(offset, totalSize - containerHeight));
    },
    [horizontal, totalSize, containerHeight]
  );

  return {
    virtualItems,
    totalSize,
    scrollToIndex,
    scrollToOffset,
    isScrolling,
    containerProps: {
      ref: containerRef,
      style: {
        height: horizontal ? '100%' : containerHeight,
        width: horizontal ? containerHeight : '100%',
        overflow: 'auto',
        position: 'relative',
      },
    },
    innerProps: {
      style: {
        height: horizontal ? '100%' : totalSize,
        width: horizontal ? totalSize : '100%',
        position: 'relative',
      },
    },
  };
}

/**
 * Property list virtualization hook
 */
export function usePropertyListVirtualization(
  properties: any[],
  containerHeight: number,
  itemHeight: number = 120
) {
  return useVirtualization({
    itemCount: properties.length,
    itemSize: itemHeight,
    containerHeight,
    overscan: 3,
    getItemKey: (index) => properties[index]?.id || index.toString(),
  });
}

/**
 * Message list virtualization hook with dynamic sizing
 */
export function useMessageListVirtualization(
  messages: any[],
  containerHeight: number,
  getMessageHeight: (message: any) => number
) {
  return useVirtualization({
    itemCount: messages.length,
    itemSize: (index) => getMessageHeight(messages[index]),
    containerHeight,
    overscan: 2,
    getItemKey: (index) => messages[index]?.id || index.toString(),
  });
}

/**
 * Grid virtualization hook for property cards
 */
export function useGridVirtualization({
  itemCount,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  gap = 16,
}: {
  itemCount: number;
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  gap?: number;
}) {
  const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowCount = Math.ceil(itemCount / columnsPerRow);
  const rowHeight = itemHeight + gap;

  const virtualization = useVirtualization({
    itemCount: rowCount,
    itemSize: rowHeight,
    containerHeight,
    overscan: 1,
  });

  // Transform virtual items to include column information
  const virtualItems = useMemo(() => {
    return virtualization.virtualItems.flatMap((virtualRow) => {
      const rowIndex = virtualRow.index;
      const startIndex = rowIndex * columnsPerRow;
      const endIndex = Math.min(startIndex + columnsPerRow - 1, itemCount - 1);
      
      const items = [];
      for (let i = startIndex; i <= endIndex; i++) {
        const columnIndex = i % columnsPerRow;
        items.push({
          index: i,
          rowIndex,
          columnIndex,
          top: virtualRow.start,
          left: columnIndex * (itemWidth + gap),
          width: itemWidth,
          height: itemHeight,
          key: `${rowIndex}-${columnIndex}`,
        });
      }
      
      return items;
    });
  }, [virtualization.virtualItems, columnsPerRow, itemCount, itemWidth, itemHeight, gap]);

  return {
    ...virtualization,
    virtualItems,
    columnsPerRow,
    rowCount,
  };
}

/**
 * Property grid virtualization hook
 */
export function usePropertyGridVirtualization(
  properties: any[],
  containerWidth: number,
  containerHeight: number,
  cardWidth: number = 280,
  cardHeight: number = 320
) {
  return useGridVirtualization({
    itemCount: properties.length,
    itemWidth: cardWidth,
    itemHeight: cardHeight,
    containerWidth,
    containerHeight,
    gap: 16,
  });
}