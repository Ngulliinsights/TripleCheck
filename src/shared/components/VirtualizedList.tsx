import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
  memo,
  useEffect,
} from "react";
import {
  VariableSizeList,
  FixedSizeList,
  ListOnScrollProps,
} from "react-window";

// Styles are now consolidated in design-system.css

// CSS classes are now consolidated in design-system.css

/* -------------------------------------------------------------------------- */
/*                               Constants                                    */
/* -------------------------------------------------------------------------- */

const CSS_CUSTOM_PROPERTIES = {
  ITEM_WIDTH: "--item-width",
  ITEM_HEIGHT: "--item-height",
  GRID_GAP: "--grid-gap",
} as const;

const CSS_CLASSES = {
  DYNAMIC_WIDTH: "dynamic-width",
  DYNAMIC_HEIGHT: "dynamic-height",
  GRID_ITEM: "grid-item",
  EMPTY_ITEM: "empty-item",
  ERROR_ITEM: "error-item",
  GRID_ITEM_WRAPPER: "grid-item-wrapper",
} as const;

/* -------------------------------------------------------------------------- */
/*                               Shared Types                                 */
/* -------------------------------------------------------------------------- */

export type VirtualisedRenderFn<ItemType> = (
  item: ItemType,
  index: number,
  style: React.CSSProperties
) => ReactNode;

export type ScrollAlignment = "auto" | "smart" | "center" | "start" | "end";

/* -------------------------------------------------------------------------- */
/*                        Enterprise List Props & Handle                      */
/* -------------------------------------------------------------------------- */

export interface EnterpriseVirtualizedListProps<ItemType> {
  items: readonly ItemType[];
  itemHeight: number | ((index: number) => number);
  estimatedItemHeight?: number;
  containerHeight: number | string;
  containerWidth?: number | string;
  renderItem: VirtualisedRenderFn<ItemType>;
  keyExtractor: (item: ItemType, index: number) => React.Key;
  overscanCount?: number;
  onScroll?: (scrollTop: number) => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  loading?: boolean;
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string | undefined;
  innerClassName?: string | undefined;
  scrollToIndex?: number | undefined;
  scrollToAlignment?: ScrollAlignment | undefined;
  outerRef?:
    | React.Ref<HTMLDivElement>
    | React.MutableRefObject<HTMLDivElement | null>;
  itemData?: Record<string, unknown>;
  debounceMs?: number;
}

export interface EnterpriseVirtualizedListHandle {
  scrollToItem: (index: number, align?: ScrollAlignment) => void;
  scrollToTop: () => void;
  recompute: () => void;
  getScrollOffset: () => number;
  getTotalSize: () => number;
}

/* -------------------------------------------------------------------------- */
/*                         Memoized Row & Helpers                             */
/* -------------------------------------------------------------------------- */

interface MemoizedRowData<ItemType> {
  items: readonly ItemType[];
  renderItem: VirtualisedRenderFn<ItemType>;
  itemData?: Record<string, unknown> | undefined;
}

// Enhanced memoized row with consistent return type and better error boundaries
const MemoizedRow = memo<{
  index: number;
  style: React.CSSProperties;
  data: MemoizedRowData<unknown>;
}>(({ index, style, data }): React.ReactElement => {
  const { items, renderItem } = data;

  // Create a fallback div element for all error cases to ensure consistent return type
  const fallbackElement = (
    <div
      style={style}
      className={CSS_CLASSES.FALLBACK_ITEM}
      data-testid={`fallback-item-${index}`}
    />
  );

  // Early return for invalid indices - consistent ReactNode return type
  if (index < 0 || index >= items.length) {
    return fallbackElement;
  }

  // Safe array access using bracket notation instead of object injection pattern
  const item = items[index] ?? null;

  // Use null check instead of undefined for better performance
  if (item == null) {
    return fallbackElement;
  }

  // Wrap in try-catch to prevent render crashes from propagating
  try {
    const renderedItem = renderItem(item, index, style);
    // Ensure we always return a ReactElement, never undefined
    if (React.isValidElement(renderedItem)) {
      return renderedItem;
    }
    return fallbackElement;
  } catch (error) {
    // Use structured logging instead of console.warn for production environments
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(`Failed to render item at index ${index}:`, error);
    }
    return (
      <div style={style} className={CSS_CLASSES.ERROR_ITEM}>
        Error rendering item
      </div>
    );
  }
}) as React.NamedExoticComponent<{
  index: number;
  style: React.CSSProperties;
  data: MemoizedRowData<unknown>;
}> & { displayName?: string };

MemoizedRow.displayName = "VirtualizedRow";

/* -------------------------------------------------------------------------- */
/*                    Optimized Debounce Hook                                 */
/* -------------------------------------------------------------------------- */

// Enhanced debounce hook with cleanup on unmount and better memory management
function useDebounceCallback<FunctionArgs extends unknown[]>(
  callback: (...args: FunctionArgs) => void,
  delay: number
): [(...args: FunctionArgs) => void, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Keep callback reference fresh without recreating the debounced function
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: FunctionArgs) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay] // Only depend on delay, not callback
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedCallback, cancel];
}

/* -------------------------------------------------------------------------- */
/*                      Ref Assignment Utility                               */
/* -------------------------------------------------------------------------- */

// Helper function to safely handle ref assignments and reduce cognitive complexity
const assignOuterRef = (
  node: HTMLDivElement | null,
  forwardedRef:
    | React.Ref<HTMLDivElement>
    | React.MutableRefObject<HTMLDivElement | null>
    | undefined
): void => {
  if (!forwardedRef) return;

  if (typeof forwardedRef === "function") {
    forwardedRef(node);
    return;
  }

  if (
    typeof forwardedRef === "object" &&
    forwardedRef != null &&
    "current" in forwardedRef
  ) {
    try {
      // Type guard to ensure we have a mutable ref
      const mutableRef =
        forwardedRef as React.MutableRefObject<HTMLDivElement | null>;
      if (
        mutableRef &&
        typeof mutableRef === "object" &&
        "current" in mutableRef
      ) {
        mutableRef.current = node;
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn("Failed to assign outer ref:", error);
      }
    }
  }
};

/* -------------------------------------------------------------------------- */
/*                  EnterpriseVirtualizedList Component                       */
/* -------------------------------------------------------------------------- */

function EnterpriseVirtualizedListInner<ItemType>(
  props: EnterpriseVirtualizedListProps<ItemType>,
  ref: React.Ref<EnterpriseVirtualizedListHandle>
): React.ReactElement {
  const {
    items,
    itemHeight,
    estimatedItemHeight = 50,
    containerHeight,
    containerWidth = "100%",
    renderItem,
    keyExtractor,
    overscanCount = 5,
    onScroll,
    onEndReached,
    onEndReachedThreshold = 0.8,
    loading = false,
    loadingComponent,
    emptyComponent,
    header,
    footer,
    className,
    innerClassName,
    scrollToIndex,
    scrollToAlignment = "auto",
    outerRef: forwardedOuterRef,
    itemData,
    debounceMs = 150,
  } = props;

  const variableListRef =
    useRef<VariableSizeList<MemoizedRowData<ItemType>>>(null);
  const fixedListRef = useRef<FixedSizeList<MemoizedRowData<ItemType>>>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);
  const lastEndReachedCall = useRef(0);
  const endReachedTriggered = useRef(false);

  const isVariableSize = typeof itemHeight === "function";

  // Memoize total size calculation for better performance
  const calculateTotalSize = useCallback((): number => {
    if (isVariableSize && typeof itemHeight === "function") {
      let total = 0;
      // Use cached calculation if items haven't changed
      for (let i = 0; i < items.length; i += 1) {
        total += itemHeight(i);
      }
      return total;
    }
    const height =
      typeof itemHeight === "number" ? itemHeight : estimatedItemHeight;
    return items.length * height;
  }, [items.length, itemHeight, estimatedItemHeight, isVariableSize]);

  // Memoize the total size to avoid recalculation on every scroll
  const totalSize = useMemo(() => calculateTotalSize(), [calculateTotalSize]);

  useImperativeHandle(
    ref,
    (): EnterpriseVirtualizedListHandle => ({
      scrollToItem: (idx: number, align: ScrollAlignment = "auto"): void => {
        if (idx >= 0 && idx < items.length) {
          const list =
            isVariableSize ? variableListRef.current : fixedListRef.current;
          list?.scrollToItem(idx, align);
        }
      },
      scrollToTop: (): void => {
        const list =
          isVariableSize ? variableListRef.current : fixedListRef.current;
        list?.scrollToItem(0, "start");
      },
      recompute: (): void => {
        variableListRef.current?.resetAfterIndex(0, true);
      },
      getScrollOffset: (): number => scrollTopRef.current,
      getTotalSize: (): number => totalSize,
    }),
    [items.length, totalSize, isVariableSize]
  );

  // Optimized scroll handler with better end-reached detection
  const handleScroll = useCallback(
    (scrollProps: ListOnScrollProps): void => {
      const { scrollOffset, scrollUpdateWasRequested } = scrollProps;
      scrollTopRef.current = scrollOffset;

      // Only trigger end-reached for user-initiated scrolls
      if (!scrollUpdateWasRequested && onEndReached) {
        const now = Date.now();
        // Throttle end-reached calls more efficiently
        if (now - lastEndReachedCall.current > 500) {
          const viewportHeight = outerRef.current?.clientHeight ?? 0;
          const ratio = (scrollOffset + viewportHeight) / totalSize;

          if (ratio >= onEndReachedThreshold && !endReachedTriggered.current) {
            endReachedTriggered.current = true;
            lastEndReachedCall.current = now;
            onEndReached();
          } else if (ratio < onEndReachedThreshold - 0.1) {
            // Add hysteresis to prevent flapping
            endReachedTriggered.current = false;
          }
        }
      }
    },
    [onEndReached, onEndReachedThreshold, totalSize]
  );

  // Improved debounced scroll callback
  const [debouncedOnScroll] = useDebounceCallback((scrollTop: number): void => {
    onScroll?.(scrollTop);
  }, debounceMs);

  // Only call debounced scroll when scroll position actually changes
  useEffect(() => {
    if (onScroll) {
      debouncedOnScroll(scrollTopRef.current);
    }
  }, [debouncedOnScroll, onScroll]);

  // Optimized item key extraction with better fallback and consistent return type
  const itemKey = useCallback(
    (index: number): React.Key => {
      if (index >= 0 && index < items.length && Array.isArray(items)) {
        // Safe array access using bracket notation
        const item = items[index] ?? null;
        if (item != null) {
          try {
            const key = keyExtractor(item, index);
            // Ensure we always return a valid React.Key
            return key ?? `fallback-${index}`;
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.warn(`Key extraction failed for index ${index}:`, error);
            }
            return `fallback-${index}`;
          }
        }
      }
      return `fallback-${index}`;
    },
    [items, keyExtractor]
  );

  // Stable memoized item data to prevent unnecessary re-renders
  const memoizedItemData = useMemo(
    (): MemoizedRowData<ItemType> => ({
      items,
      renderItem,
      itemData,
    }),
    [items, renderItem, itemData]
  );

  // Enhanced outer ref handling with reduced complexity
  const combinedOuterRef = useCallback(
    (node: HTMLDivElement | null): void => {
      // This assignment is always safe - it's our own ref
      outerRef.current = node;

      // Handle the forwarded ref safely with proper type checking
      if (forwardedOuterRef) {
        if (typeof forwardedOuterRef === "function") {
          // Function refs are always safe to call
          forwardedOuterRef(node);
        } else if (
          forwardedOuterRef &&
          typeof forwardedOuterRef === "object" &&
          "current" in forwardedOuterRef
        ) {
          try {
            // Check if the current property is writable before attempting assignment
            const descriptor = Object.getOwnPropertyDescriptor(
              forwardedOuterRef,
              "current"
            );
            if (!descriptor || descriptor.writable !== false) {
              // Safe assignment with explicit type assertion after validation
              (
                forwardedOuterRef as { current: HTMLDivElement | null }
              ).current = node;
            }
          } catch (error) {
            // Graceful fallback if ref assignment fails
            if (process.env.NODE_ENV === "development") {
              console.warn("Failed to assign forwarded outer ref:", error);
            }
          }
        }
      }
    },
    [forwardedOuterRef]
  );

  // Optimized scroll-to-index effect with validation
  useEffect(() => {
    if (
      scrollToIndex !== undefined &&
      scrollToIndex >= 0 &&
      scrollToIndex < items.length
    ) {
      // Use setTimeout as a cross-platform alternative to requestAnimationFrame
      const timeoutId = setTimeout(() => {
        const list =
          isVariableSize ? variableListRef.current : fixedListRef.current;
        list?.scrollToItem(scrollToIndex, scrollToAlignment);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [scrollToIndex, scrollToAlignment, items.length, isVariableSize]);

  // Always call useMemo at the top level to avoid conditional hook calls
  const commonProps = useMemo(
    () => ({
      outerRef: combinedOuterRef,
      height: containerHeight,
      width: containerWidth,
      itemCount: items.length,
      itemKey,
      itemData: memoizedItemData as MemoizedRowData<unknown>,
      overscanCount,
      onScroll: handleScroll,
      className: innerClassName,
      children: MemoizedRow,
    }),
    [
      combinedOuterRef,
      containerHeight,
      containerWidth,
      items.length,
      itemKey,
      memoizedItemData,
      overscanCount,
      handleScroll,
      innerClassName,
    ]
  );

  // Early returns for loading and empty states - ensure consistent ReactNode return
  if (loading && loadingComponent) {
    return (
      <div
        className={`${CSS_CLASSES.LOADING_CONTAINER} ${className || ""}`}
        data-testid="loading-container"
      >
        {loadingComponent}
      </div>
    );
  }

  if (!loading && items.length === 0 && emptyComponent) {
    return (
      <div
        className={`${CSS_CLASSES.EMPTY_CONTAINER} ${className || ""}`}
        data-testid="empty-container"
      >
        {emptyComponent}
      </div>
    );
  }

  return (
    <div
      className={`${CSS_CLASSES.VIRTUALIZED_CONTAINER} ${className || ""}`}
      data-testid="virtualized-container"
    >
      {header}
      {isVariableSize ?
        <VariableSizeList
          {...commonProps}
          ref={
            variableListRef as React.Ref<
              VariableSizeList<MemoizedRowData<unknown>>
            >
          }
          itemSize={itemHeight as (index: number) => number}
          estimatedItemSize={estimatedItemHeight}
        />
      : <FixedSizeList
          {...commonProps}
          ref={
            fixedListRef as React.Ref<FixedSizeList<MemoizedRowData<unknown>>>
          }
          itemSize={itemHeight as number}
        />
      }
      {footer}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Forward Ref With Generics                         */
/* -------------------------------------------------------------------------- */

export const EnterpriseVirtualizedList = forwardRef(
  EnterpriseVirtualizedListInner
) as <ItemType>(
  p: EnterpriseVirtualizedListProps<ItemType> & {
    ref?: React.Ref<EnterpriseVirtualizedListHandle>;
  }
) => React.ReactElement;

/* -------------------------------------------------------------------------- */
/*                           Grid Virtualization                              */
/* -------------------------------------------------------------------------- */

export interface GridVirtualizedListProps<ItemType> {
  items: readonly ItemType[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (
    item: ItemType,
    index: number,
    style: React.CSSProperties
  ) => ReactNode;
  keyExtractor: (item: ItemType, index: number) => React.Key;
  gap?: number;
  overscanCount?: number;
  onScroll?: (scrollTop: number) => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  loading?: boolean;
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode;
  className?: string;
}

export interface GridVirtualizedListHandle {
  scrollToItem: (index: number, align?: ScrollAlignment) => void;
  scrollToTop: () => void;
  getScrollOffset: () => number;
}

// Create CSS custom properties object type for better type safety
interface GridItemStyles extends React.CSSProperties {
  [CSS_CUSTOM_PROPERTIES.ITEM_WIDTH]?: string;
  [CSS_CUSTOM_PROPERTIES.ITEM_HEIGHT]?: string;
  [CSS_CUSTOM_PROPERTIES.GRID_GAP]?: string;
}

// Memoized grid styles to prevent recreation
const createGridStyles = (
  itemWidth: number,
  itemHeight: number,
  gap: number
) => {
  const rowStyle: React.CSSProperties = {
    gap: `${gap}px`,
    height: itemHeight,
  };

  const itemStyle: GridItemStyles = {
    width: itemWidth,
    height: itemHeight,
    [CSS_CUSTOM_PROPERTIES.ITEM_WIDTH]: `${itemWidth}px`,
    [CSS_CUSTOM_PROPERTIES.ITEM_HEIGHT]: `${itemHeight}px`,
  };

  return { row: rowStyle, item: itemStyle };
};

function GridVirtualizedListInner<ItemType>(
  props: GridVirtualizedListProps<ItemType>,
  ref: React.Ref<GridVirtualizedListHandle>
): React.ReactElement {
  const {
    items,
    itemWidth,
    itemHeight,
    containerWidth,
    containerHeight,
    renderItem,
    keyExtractor,
    gap = 16,
    overscanCount = 1,
    onScroll,
    onEndReached,
    onEndReachedThreshold = 0.8,
    loading = false,
    loadingComponent,
    emptyComponent,
    className,
  } = props;

  const listRef = useRef<FixedSizeList>(null);
  const scrollTopRef = useRef(0);

  // Memoize grid calculations
  const gridConfig = useMemo(() => {
    const columnsPerRow = Math.max(
      1,
      Math.floor((containerWidth + gap) / (itemWidth + gap))
    );
    const rowCount = Math.ceil(items.length / columnsPerRow);
    const rowHeight = itemHeight + gap;
    const gridStyles = createGridStyles(itemWidth, itemHeight, gap);

    return { columnsPerRow, rowCount, rowHeight, styles: gridStyles };
  }, [containerWidth, itemWidth, itemHeight, gap, items.length]);

  useImperativeHandle(
    ref,
    (): GridVirtualizedListHandle => ({
      scrollToItem: (index: number, align: ScrollAlignment = "auto"): void => {
        const rowIndex = Math.floor(index / gridConfig.columnsPerRow);
        if (
          listRef.current &&
          rowIndex >= 0 &&
          rowIndex < gridConfig.rowCount
        ) {
          listRef.current.scrollToItem(rowIndex, align);
        }
      },
      scrollToTop: (): void => listRef.current?.scrollToItem(0, "start"),
      getScrollOffset: (): number => scrollTopRef.current,
    }),
    [gridConfig.columnsPerRow, gridConfig.rowCount]
  );

  // Helper function to render individual grid items with better type safety
  const renderGridItem = useCallback(
    (
      itemIndex: number,
      endIndex: number,
      createItemStyleWithVars: () => GridItemStyles,
      emptyItemClasses: string,
      errorItemClasses: string,
      wrapperItemClasses: string
    ): React.ReactElement => {
      if (itemIndex > endIndex) {
        return (
          <div
            key={`empty-${itemIndex}`}
            style={createItemStyleWithVars()}
            className={emptyItemClasses}
            data-testid={`grid-empty-item-${itemIndex}`}
          />
        );
      }

      // Safe array access using bracket notation
      const item = items[itemIndex] ?? null;
      if (item == null) {
        return (
          <div
            key={`empty-${itemIndex}`}
            style={createItemStyleWithVars()}
            className={emptyItemClasses}
            data-testid={`grid-empty-item-${itemIndex}`}
          />
        );
      }

      try {
        const itemStyleWithVars = createItemStyleWithVars();
        const renderedItem = renderItem(item, itemIndex, itemStyleWithVars);
        return (
          <div
            key={keyExtractor(item, itemIndex)}
            style={itemStyleWithVars}
            className={wrapperItemClasses}
            data-testid={`grid-item-${itemIndex}`}
          >
            {renderedItem}
          </div>
        );
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn(
            `Failed to render grid item at index ${itemIndex}:`,
            error
          );
        }
        return (
          <div
            key={`error-${itemIndex}`}
            style={createItemStyleWithVars()}
            className={errorItemClasses}
            data-testid={`grid-error-item-${itemIndex}`}
          >
            Error rendering item
          </div>
        );
      }
    },
    [items, renderItem, keyExtractor]
  );

  // Memoized row renderer for better performance with consistent return type
  const renderRow = useCallback(
    ({
      index: rowIndex,
      style,
    }: {
      index: number;
      style: React.CSSProperties;
    }): React.ReactElement => {
      const { columnsPerRow, styles: gridStyles } = gridConfig;
      const startIndex = rowIndex * columnsPerRow;
      const endIndex = Math.min(
        startIndex + columnsPerRow - 1,
        items.length - 1
      );

      const rowStyleWithVars: GridItemStyles = {
        ...style,
        [CSS_CUSTOM_PROPERTIES.GRID_GAP]: `${gap}px`,
        [CSS_CUSTOM_PROPERTIES.ITEM_HEIGHT]: `${itemHeight}px`,
      };

      const gridRowStyleWithVars: GridItemStyles = {
        ...gridStyles.row,
        [CSS_CUSTOM_PROPERTIES.GRID_GAP]: `${gap}px`,
      };

      // Create reusable item style with CSS custom properties
      const createItemStyleWithVars = (): GridItemStyles => ({
        ...gridStyles.item,
        [CSS_CUSTOM_PROPERTIES.ITEM_WIDTH]: `${itemWidth}px`,
        [CSS_CUSTOM_PROPERTIES.ITEM_HEIGHT]: `${itemHeight}px`,
      });

      // Create reusable class names
      const baseItemClasses = `${CSS_CLASSES.GRID_ITEM} ${CSS_CLASSES.DYNAMIC_WIDTH} ${CSS_CLASSES.DYNAMIC_HEIGHT}`;
      const emptyItemClasses = `${baseItemClasses} ${CSS_CLASSES.EMPTY_ITEM}`;
      const errorItemClasses = `${baseItemClasses} ${CSS_CLASSES.ERROR_ITEM}`;
      const wrapperItemClasses = `${baseItemClasses} ${CSS_CLASSES.GRID_ITEM_WRAPPER}`;

      return (
        <div
          style={rowStyleWithVars}
          className={CSS_CLASSES.GRID_ROW_CONTAINER}
          data-testid={`grid-row-${rowIndex}`}
        >
          <div
            style={gridRowStyleWithVars}
            className={`${CSS_CLASSES.GRID_ROW} ${CSS_CLASSES.DYNAMIC_GAP}`}
          >
            {Array.from({ length: columnsPerRow }, (_, columnIndex) => {
              const itemIndex = startIndex + columnIndex;
              return renderGridItem(
                itemIndex,
                endIndex,
                createItemStyleWithVars,
                emptyItemClasses,
                errorItemClasses,
                wrapperItemClasses
              );
            })}
          </div>
        </div>
      );
    },
    [gridConfig, gap, itemHeight, itemWidth, renderGridItem]
  );

  // Enhanced scroll handler with end-reached detection
  const handleScroll = useCallback(
    (scrollProps: ListOnScrollProps): void => {
      const { scrollOffset } = scrollProps;
      scrollTopRef.current = scrollOffset;
      onScroll?.(scrollOffset);

      if (onEndReached) {
        const totalHeight = gridConfig.rowCount * gridConfig.rowHeight;
        const ratio = (scrollOffset + containerHeight) / totalHeight;
        if (ratio >= onEndReachedThreshold) {
          onEndReached();
        }
      }
    },
    [onScroll, onEndReached, onEndReachedThreshold, gridConfig, containerHeight]
  );

  if (loading && loadingComponent) {
    return (
      <div
        className={`${CSS_CLASSES.LOADING_CONTAINER} ${className || ""}`}
        data-testid="grid-loading-container"
      >
        {loadingComponent}
      </div>
    );
  }

  if (!loading && items.length === 0 && emptyComponent) {
    return (
      <div
        className={`${CSS_CLASSES.EMPTY_CONTAINER} ${className || ""}`}
        data-testid="grid-empty-container"
      >
        {emptyComponent}
      </div>
    );
  }

  return (
    <div
      className={`${CSS_CLASSES.GRID_CONTAINER} ${className || ""}`}
      data-testid="grid-container"
    >
      <FixedSizeList
        ref={listRef}
        height={containerHeight}
        width={containerWidth}
        itemCount={gridConfig.rowCount}
        itemSize={gridConfig.rowHeight}
        overscanCount={overscanCount}
        onScroll={handleScroll}
      >
        {renderRow}
      </FixedSizeList>
    </div>
  );
}

export const GridVirtualizedList = forwardRef(GridVirtualizedListInner) as <
  ItemType,
>(
  p: GridVirtualizedListProps<ItemType> & {
    ref?: React.Ref<GridVirtualizedListHandle>;
  }
) => React.ReactElement;
