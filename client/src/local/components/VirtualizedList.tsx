import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useMemo,
  memo,
  useEffect,
  type ReactNode,
} from "react";
import * as ReactWindow from "react-window";
const { VariableSizeList, FixedSizeList } = ReactWindow as any;

export interface ListOnScrollProps {
  scrollDirection: "forward" | "backward";
  scrollOffset: number;
  scrollUpdateWasRequested: boolean;
}

// Styles consolidated in design-system.css

/* -------------------------------------------------------------------------- */
/*                               Constants                                    */
/* -------------------------------------------------------------------------- */

const CSS_VARS = {
  ITEM_WIDTH:  "--item-width",
  ITEM_HEIGHT: "--item-height",
  GRID_GAP:    "--grid-gap",
} as const;

const CSS = {
  DYNAMIC_WIDTH:       "dynamic-width",
  DYNAMIC_HEIGHT:      "dynamic-height",
  GRID_ITEM:           "grid-item",
  EMPTY_ITEM:          "empty-item",
  ERROR_ITEM:          "error-item",
  GRID_ITEM_WRAPPER:   "grid-item-wrapper",
  FALLBACK_ITEM:       "fallback-item",
  LOADING_CONTAINER:   "loading-container",
  EMPTY_CONTAINER:     "empty-container",
  VIRTUALIZED_CONTAINER: "virtualized-container",
  GRID_ROW_CONTAINER:  "grid-row-container",
  GRID_ROW:            "grid-row",
  DYNAMIC_GAP:         "dynamic-gap",
  GRID_CONTAINER:      "grid-container",
} as const;

const END_REACHED_THROTTLE_MS = 500;
const END_REACHED_HYSTERESIS  = 0.1;

/* -------------------------------------------------------------------------- */
/*                               Shared Types                                 */
/* -------------------------------------------------------------------------- */

export type VirtualisedRenderFn<ItemType> = (
  item:  ItemType,
  index: number,
  style: React.CSSProperties,
) => ReactNode;

export type ScrollAlignment = "auto" | "smart" | "center" | "start" | "end";

/* -------------------------------------------------------------------------- */
/*                    EnterpriseVirtualizedList Props & Handle                */
/* -------------------------------------------------------------------------- */

export interface EnterpriseVirtualizedListProps<ItemType> {
  items:                readonly ItemType[];
  itemHeight:           number | ((index: number) => number);
  estimatedItemHeight?: number;
  containerHeight:      number | string;
  containerWidth?:      number | string;
  renderItem:           VirtualisedRenderFn<ItemType>;
  keyExtractor:         (item: ItemType, index: number) => React.Key;
  overscanCount?:       number;
  onScroll?:            (scrollTop: number) => void;
  onEndReached?:        () => void;
  onEndReachedThreshold?: number;
  loading?:             boolean;
  loadingComponent?:    ReactNode;
  emptyComponent?:      ReactNode;
  header?:              ReactNode;
  footer?:              ReactNode;
  className?:           string;
  innerClassName?:      string;
  scrollToIndex?:       number;
  scrollToAlignment?:   ScrollAlignment;
  outerRef?:            React.Ref<HTMLDivElement>;
  itemData?:            Record<string, unknown>;
  debounceMs?:          number;
}

export interface EnterpriseVirtualizedListHandle {
  scrollToItem:    (index: number, align?: ScrollAlignment) => void;
  scrollToTop:     () => void;
  recompute:       () => void;
  getScrollOffset: () => number;
  getTotalSize:    () => number;
}

/* -------------------------------------------------------------------------- */
/*                         Memoized Row                                       */
/* -------------------------------------------------------------------------- */

interface MemoizedRowData<ItemType> {
  items:      readonly ItemType[];
  renderItem: VirtualisedRenderFn<ItemType>;
  itemData?:  Record<string, unknown>;
}

const MemoizedRow = memo<{
  index: number;
  style: React.CSSProperties;
  data:  MemoizedRowData<unknown>;
}>(({ index, style, data }): React.ReactElement => {
  const { items, renderItem } = data;

  const fallback = (
    <div
      style={style}
      className={CSS.FALLBACK_ITEM}
      data-testid={`fallback-item-${index}`}
    />
  );

  if (index < 0 || index >= items.length) return fallback;

  const item = items[index] ?? null;
  if (item == null) return fallback;

  try {
    // Accept any valid ReactNode — React.isValidElement rejects strings,
    // numbers, fragments, and portals which are all legitimate render output.
    const rendered = renderItem(item, index, style);
    if (rendered == null) return fallback;
    return rendered as React.ReactElement;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Failed to render item at index ${index}:`, error);
    }
    return (
      <div style={style} className={CSS.ERROR_ITEM}>
        Error rendering item
      </div>
    );
  }
}) as React.NamedExoticComponent<{
  index: number;
  style: React.CSSProperties;
  data:  MemoizedRowData<unknown>;
}> & { displayName?: string };

MemoizedRow.displayName = "VirtualizedRow";

/* -------------------------------------------------------------------------- */
/*                         Debounce Hook                                      */
/* -------------------------------------------------------------------------- */

function useDebounceCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay:    number,
): [(...args: A) => void, () => void] {
  const timeoutRef  = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(callback);

  useEffect(() => { callbackRef.current = callback; }, [callback]);

  const debouncedFn = useCallback(
    (...args: A) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay],
  );

  const cancel = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = undefined;
  }, []);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return [debouncedFn, cancel];
}

/* -------------------------------------------------------------------------- */
/*                  EnterpriseVirtualizedList Component                       */
/* -------------------------------------------------------------------------- */

function EnterpriseVirtualizedListInner<ItemType>(
  props: EnterpriseVirtualizedListProps<ItemType>,
  ref:   React.Ref<EnterpriseVirtualizedListHandle>,
): React.ReactElement {
  const {
    items,
    itemHeight,
    estimatedItemHeight = 50,
    containerHeight,
    containerWidth     = "100%",
    renderItem,
    keyExtractor,
    overscanCount      = 5,
    onScroll,
    onEndReached,
    onEndReachedThreshold = 0.8,
    loading            = false,
    loadingComponent,
    emptyComponent,
    header,
    footer,
    className,
    innerClassName,
    scrollToIndex,
    scrollToAlignment  = "auto",
    outerRef:          forwardedOuterRef,
    itemData,
    debounceMs         = 150,
  } = props;

  const variableListRef = useRef<any>(null);
  const fixedListRef    = useRef<any>(null);
  const outerRef        = useRef<HTMLDivElement | null>(null);
  const scrollTopRef    = useRef(0);
  const lastEndReachedTs  = useRef(0);
  const endReachedFired = useRef(false);

  const isVariableSize = typeof itemHeight === "function";

  // Single useMemo — no intermediate useCallback needed
  const totalSize = useMemo((): number => {
    if (isVariableSize) {
      let total = 0;
      for (let i = 0; i < items.length; i++) total += (itemHeight as (i: number) => number)(i);
      return total;
    }
    return items.length * (itemHeight as number);
  }, [items.length, itemHeight, isVariableSize]);

  const activeList = isVariableSize ? variableListRef.current : fixedListRef.current;

  useImperativeHandle(ref, (): EnterpriseVirtualizedListHandle => ({
    scrollToItem: (idx, align = "auto") => {
      if (idx >= 0 && idx < items.length) activeList?.scrollToItem(idx, align);
    },
    scrollToTop:     () => activeList?.scrollToItem(0, "start"),
    recompute:       () => variableListRef.current?.resetAfterIndex(0, true),
    getScrollOffset: () => scrollTopRef.current,
    getTotalSize:    () => totalSize,
  }), [items.length, totalSize, activeList]);

  const handleScroll = useCallback((scrollProps: ListOnScrollProps): void => {
    const { scrollOffset, scrollUpdateWasRequested } = scrollProps;
    scrollTopRef.current = scrollOffset;

    if (!scrollUpdateWasRequested && onEndReached) {
      const now = Date.now();
      if (now - lastEndReachedTs.current > END_REACHED_THROTTLE_MS) {
        const viewportHeight = outerRef.current?.clientHeight ?? 0;
        const ratio = (scrollOffset + viewportHeight) / totalSize;

        if (ratio >= onEndReachedThreshold && !endReachedFired.current) {
          endReachedFired.current = true;
          lastEndReachedTs.current = now;
          onEndReached();
        } else if (ratio < onEndReachedThreshold - END_REACHED_HYSTERESIS) {
          endReachedFired.current = false; // hysteresis reset
        }
      }
    }
  }, [onEndReached, onEndReachedThreshold, totalSize]);

  // Debounced external scroll callback — called inside handleScroll, not via effect
  const [debouncedOnScroll] = useDebounceCallback((scrollTop: number) => {
    onScroll?.(scrollTop);
  }, debounceMs);

  // Merged scroll handler: internal tracking + debounced external notification
  const mergedScroll = useCallback((scrollProps: ListOnScrollProps) => {
    handleScroll(scrollProps);
    if (onScroll) debouncedOnScroll(scrollProps.scrollOffset);
  }, [handleScroll, debouncedOnScroll, onScroll]);

  // Ref merger — React refs are always plain writable objects; no descriptor check needed
  const combinedOuterRef = useCallback((node: HTMLDivElement | null) => {
    outerRef.current = node;
    if (!forwardedOuterRef) return;
    if (typeof forwardedOuterRef === "function") {
      forwardedOuterRef(node);
    } else {
      (forwardedOuterRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [forwardedOuterRef]);

  useEffect(() => {
    if (scrollToIndex === undefined || scrollToIndex < 0 || scrollToIndex >= items.length) return;
    const id = setTimeout(() => activeList?.scrollToItem(scrollToIndex, scrollToAlignment), 0);
    return () => clearTimeout(id);
  }, [scrollToIndex, scrollToAlignment, items.length, activeList]);

  const itemKey = useCallback((index: number): React.Key => {
    const item = items[index] ?? null;
    if (item == null) return `fallback-${index}`;
    try {
      return keyExtractor(item, index) ?? `fallback-${index}`;
    } catch {
      return `fallback-${index}`;
    }
  }, [items, keyExtractor]);

  const memoizedItemData = useMemo(
    (): MemoizedRowData<ItemType> => ({ items, renderItem, itemData }),
    [items, renderItem, itemData],
  );

  const commonProps = useMemo(() => ({
    outerRef:     combinedOuterRef,
    height:       containerHeight,
    width:        containerWidth,
    itemCount:    items.length,
    itemKey,
    itemData:     memoizedItemData as MemoizedRowData<unknown>,
    overscanCount,
    onScroll:     mergedScroll,
    className:    innerClassName,
    children:     MemoizedRow,
  }), [
    combinedOuterRef, containerHeight, containerWidth,
    items.length, itemKey, memoizedItemData, overscanCount,
    mergedScroll, innerClassName,
  ]);

  if (loading && loadingComponent) {
    return (
      <div className={`${CSS.LOADING_CONTAINER} ${className ?? ""}`} data-testid="loading-container">
        {loadingComponent}
      </div>
    );
  }

  if (!loading && items.length === 0 && emptyComponent) {
    return (
      <div className={`${CSS.EMPTY_CONTAINER} ${className ?? ""}`} data-testid="empty-container">
        {emptyComponent}
      </div>
    );
  }

  return (
    <div className={`${CSS.VIRTUALIZED_CONTAINER} ${className ?? ""}`} data-testid="virtualized-container">
      {header}
      {isVariableSize ? (
        <VariableSizeList
          {...commonProps}
          ref={variableListRef}
          itemSize={itemHeight as (index: number) => number}
          estimatedItemSize={estimatedItemHeight}
        />
      ) : (
        <FixedSizeList
          {...commonProps}
          ref={fixedListRef}
          itemSize={itemHeight as number}
        />
      )}
      {footer}
    </div>
  );
}

export const EnterpriseVirtualizedList = forwardRef(EnterpriseVirtualizedListInner) as <ItemType>(
  p: EnterpriseVirtualizedListProps<ItemType> & { ref?: React.Ref<EnterpriseVirtualizedListHandle> }
) => React.ReactElement;

/* -------------------------------------------------------------------------- */
/*                           Grid Virtualization                              */
/* -------------------------------------------------------------------------- */

export interface GridVirtualizedListProps<ItemType> {
  items:            readonly ItemType[];
  itemWidth:        number;
  itemHeight:       number;
  containerWidth:   number;
  containerHeight:  number;
  renderItem:       (item: ItemType, index: number, style: React.CSSProperties) => ReactNode;
  keyExtractor:     (item: ItemType, index: number) => React.Key;
  gap?:             number;
  overscanCount?:   number;
  onScroll?:        (scrollTop: number) => void;
  onEndReached?:    () => void;
  onEndReachedThreshold?: number;
  loading?:         boolean;
  loadingComponent?: ReactNode;
  emptyComponent?:  ReactNode;
  className?:       string;
}

export interface GridVirtualizedListHandle {
  scrollToItem:    (index: number, align?: ScrollAlignment) => void;
  scrollToTop:     () => void;
  getScrollOffset: () => number;
}

interface GridItemStyles extends React.CSSProperties {
  [CSS_VARS.ITEM_WIDTH]?:  string;
  [CSS_VARS.ITEM_HEIGHT]?: string;
  [CSS_VARS.GRID_GAP]?:   string;
}

function GridVirtualizedListInner<ItemType>(
  props: GridVirtualizedListProps<ItemType>,
  ref:   React.Ref<GridVirtualizedListHandle>,
): React.ReactElement {
  const {
    items,
    itemWidth,
    itemHeight,
    containerWidth,
    containerHeight,
    renderItem,
    keyExtractor,
    gap               = 16,
    overscanCount     = 1,
    onScroll,
    onEndReached,
    onEndReachedThreshold = 0.8,
    loading           = false,
    loadingComponent,
    emptyComponent,
    className,
  } = props;

  const listRef       = useRef<any>(null);
  const scrollTopRef  = useRef(0);
  const lastEndReachedTs = useRef(0);
  const endReachedFired  = useRef(false);

  const gridConfig = useMemo(() => {
    const columnsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
    const rowCount      = Math.ceil(items.length / columnsPerRow);
    const rowHeight     = itemHeight + gap;

    // Stable style objects — computed once per config change, not per render
    const rowStyle: GridItemStyles = {
      gap:      `${gap}px`,
      height:   itemHeight,
      [CSS_VARS.GRID_GAP]:   `${gap}px`,
      [CSS_VARS.ITEM_HEIGHT]: `${itemHeight}px`,
    };
    const itemStyle: GridItemStyles = {
      width:  itemWidth,
      height: itemHeight,
      [CSS_VARS.ITEM_WIDTH]:  `${itemWidth}px`,
      [CSS_VARS.ITEM_HEIGHT]: `${itemHeight}px`,
    };

    return { columnsPerRow, rowCount, rowHeight, rowStyle, itemStyle };
  }, [containerWidth, itemWidth, itemHeight, gap, items.length]);

  useImperativeHandle(ref, (): GridVirtualizedListHandle => ({
    scrollToItem: (index, align = "auto") => {
      const rowIndex = Math.floor(index / gridConfig.columnsPerRow);
      if (rowIndex >= 0 && rowIndex < gridConfig.rowCount) {
        listRef.current?.scrollToItem(rowIndex, align);
      }
    },
    scrollToTop:     () => listRef.current?.scrollToItem(0, "start"),
    getScrollOffset: () => scrollTopRef.current,
  }), [gridConfig.columnsPerRow, gridConfig.rowCount]);

  // Shared renderGridItem — no per-call factory fn, stable style from gridConfig
  const renderGridItem = useCallback((
    itemIndex: number,
    endIndex:  number,
  ): React.ReactElement => {
    const { itemStyle } = gridConfig;

    if (itemIndex > endIndex) {
      return (
        <div
          key={`empty-${itemIndex}`}
          style={itemStyle}
          className={`${CSS.GRID_ITEM} ${CSS.DYNAMIC_WIDTH} ${CSS.DYNAMIC_HEIGHT} ${CSS.EMPTY_ITEM}`}
          data-testid={`grid-empty-item-${itemIndex}`}
        />
      );
    }

    const item = items[itemIndex] ?? null;
    if (item == null) {
      return (
        <div
          key={`empty-${itemIndex}`}
          style={itemStyle}
          className={`${CSS.GRID_ITEM} ${CSS.DYNAMIC_WIDTH} ${CSS.DYNAMIC_HEIGHT} ${CSS.EMPTY_ITEM}`}
          data-testid={`grid-empty-item-${itemIndex}`}
        />
      );
    }

    try {
      return (
        <div
          key={keyExtractor(item, itemIndex)}
          style={itemStyle}
          className={`${CSS.GRID_ITEM} ${CSS.DYNAMIC_WIDTH} ${CSS.DYNAMIC_HEIGHT} ${CSS.GRID_ITEM_WRAPPER}`}
          data-testid={`grid-item-${itemIndex}`}
        >
          {renderItem(item, itemIndex, itemStyle)}
        </div>
      );
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Failed to render grid item at index ${itemIndex}:`, error);
      }
      return (
        <div
          key={`error-${itemIndex}`}
          style={itemStyle}
          className={`${CSS.GRID_ITEM} ${CSS.DYNAMIC_WIDTH} ${CSS.DYNAMIC_HEIGHT} ${CSS.ERROR_ITEM}`}
          data-testid={`grid-error-item-${itemIndex}`}
        >
          Error rendering item
        </div>
      );
    }
  }, [gridConfig, items, renderItem, keyExtractor]);

  const renderRow = useCallback(({
    index: rowIndex,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }): React.ReactElement => {
    const { columnsPerRow, rowStyle } = gridConfig;
    const startIndex = rowIndex * columnsPerRow;
    const endIndex   = Math.min(startIndex + columnsPerRow - 1, items.length - 1);

    const rowWrapperStyle: GridItemStyles = {
      ...style,
      [CSS_VARS.GRID_GAP]:    `${gap}px`,
      [CSS_VARS.ITEM_HEIGHT]: `${itemHeight}px`,
    };

    return (
      <div style={rowWrapperStyle} className={CSS.GRID_ROW_CONTAINER} data-testid={`grid-row-${rowIndex}`}>
        <div style={rowStyle} className={`${CSS.GRID_ROW} ${CSS.DYNAMIC_GAP}`}>
          {Array.from({ length: columnsPerRow }, (_, col) =>
            renderGridItem(startIndex + col, endIndex),
          )}
        </div>
      </div>
    );
  }, [gridConfig, gap, itemHeight, items.length, renderGridItem]);

  // Throttled + hysteresis end-reached — matches enterprise list behaviour
  const handleScroll = useCallback((scrollProps: ListOnScrollProps): void => {
    const { scrollOffset } = scrollProps;
    scrollTopRef.current = scrollOffset;
    onScroll?.(scrollOffset);

    if (onEndReached) {
      const now = Date.now();
      if (now - lastEndReachedTs.current > END_REACHED_THROTTLE_MS) {
        const totalHeight = gridConfig.rowCount * gridConfig.rowHeight;
        const ratio = (scrollOffset + containerHeight) / totalHeight;

        if (ratio >= onEndReachedThreshold && !endReachedFired.current) {
          endReachedFired.current  = true;
          lastEndReachedTs.current = now;
          onEndReached();
        } else if (ratio < onEndReachedThreshold - END_REACHED_HYSTERESIS) {
          endReachedFired.current = false;
        }
      }
    }
  }, [onScroll, onEndReached, onEndReachedThreshold, gridConfig, containerHeight]);

  if (loading && loadingComponent) {
    return (
      <div className={`${CSS.LOADING_CONTAINER} ${className ?? ""}`} data-testid="grid-loading-container">
        {loadingComponent}
      </div>
    );
  }

  if (!loading && items.length === 0 && emptyComponent) {
    return (
      <div className={`${CSS.EMPTY_CONTAINER} ${className ?? ""}`} data-testid="grid-empty-container">
        {emptyComponent}
      </div>
    );
  }

  return (
    <div className={`${CSS.GRID_CONTAINER} ${className ?? ""}`} data-testid="grid-container">
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

export const GridVirtualizedList = forwardRef(GridVirtualizedListInner) as <ItemType>(
  p: GridVirtualizedListProps<ItemType> & { ref?: React.Ref<GridVirtualizedListHandle> }
) => React.ReactElement;