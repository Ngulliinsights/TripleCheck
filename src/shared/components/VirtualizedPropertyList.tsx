import React, {
  forwardRef,
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
} from "react"
import { Grid, List } from "react-window"

import type { NormalizedProperty, ViewMode } from "../types/property"
import type { EnterpriseVirtualizedListHandle } from "./VirtualizedList"

// ─── Types ───────────────────────────────────────────────────────────────────

interface CardComponentProps {
  property: NormalizedProperty
  onClick?: (property: NormalizedProperty) => void
  className?: string
}

interface VirtualizedPropertyListProps {
  properties: readonly NormalizedProperty[]
  viewMode: ViewMode
  height: number
  width?: number
  onPropertyClick?: (property: NormalizedProperty) => void
  onEndReached?: () => void
  loading?: boolean
  className?: string
  CardComponent: React.ComponentType<CardComponentProps>
  // Grid-specific
  itemsPerRow?: number
  gridItemWidth?: number
  gridItemHeight?: number
  // List-specific
  listItemHeight?: number
}

// ─── Shared item data shapes ──────────────────────────────────────────────────

interface GridItemData {
  properties: readonly NormalizedProperty[]
  itemsPerRow: number
  onPropertyClick?: (property: NormalizedProperty) => void
  CardComponent: React.ComponentType<CardComponentProps>
}

interface ListItemData {
  properties: readonly NormalizedProperty[]
  onPropertyClick?: (property: NormalizedProperty) => void
  CardComponent: React.ComponentType<CardComponentProps>
}

// ─── Grid cell ────────────────────────────────────────────────────────────────

interface GridCellProps {
  ariaAttributes: {
    "aria-colindex": number;
    role: "gridcell";
  };
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  properties: readonly NormalizedProperty[];
  itemsPerRow: number;
  onPropertyClick?: (property: NormalizedProperty) => void;
  CardComponent: React.ComponentType<CardComponentProps>;
}

const GridCell = memo<GridCellProps>(
  ({ columnIndex, rowIndex, style, properties, itemsPerRow, onPropertyClick, CardComponent }) => {
    const index = rowIndex * itemsPerRow + columnIndex
    const property = properties[index]

    const handleClick = useCallback(
      () => onPropertyClick?.(property),
      [property, onPropertyClick]
    )

    if (!property) return <div style={style} />

    return (
      <div style={style}>
        <div className="p-2">
          <CardComponent property={property} onClick={handleClick} />
        </div>
      </div>
    )
  }
)
GridCell.displayName = "GridCell"

// ─── List row ─────────────────────────────────────────────────────────────────

interface ListRowProps {
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number;
  style: React.CSSProperties;
  properties: readonly NormalizedProperty[];
  onPropertyClick?: (property: NormalizedProperty) => void;
  CardComponent: React.ComponentType<CardComponentProps>;
}

const ListRow = memo<ListRowProps>(
  ({ index, style, properties, onPropertyClick, CardComponent }) => {
    const property = properties[index]

    const handleClick = useCallback(
      () => onPropertyClick?.(property),
      [property, onPropertyClick]
    )

    if (!property) return <div style={style} />

    return (
      <div style={style}>
        <div className="p-2 w-full">
          <CardComponent
            property={property}
            onClick={handleClick}
            className="flex flex-row w-full"
          />
        </div>
      </div>
    )
  }
)
ListRow.displayName = "ListRow"

// ─── Responsive grid hook ─────────────────────────────────────────────────────

function useResponsiveGrid(
  containerWidth: number,
  itemWidth: number,
  minItemsPerRow = 1,
  maxItemsPerRow = 6
) {
  return useMemo(() => {
    const available = Math.max(0, containerWidth - 32)
    const count = Math.max(
      minItemsPerRow,
      Math.min(maxItemsPerRow, Math.floor(available / itemWidth))
    )
    return {
      itemsPerRow: count,
      actualItemWidth: Math.floor(available / count),
    }
  }, [containerWidth, itemWidth, minItemsPerRow, maxItemsPerRow])
}

// ─── Loading / empty states ───────────────────────────────────────────────────

const LoadingState = memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    <span className="ml-3 text-sm text-muted-foreground">Loading properties…</span>
  </div>
))
LoadingState.displayName = "LoadingState"

const EmptyState = memo(() => (
  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
    <div className="w-24 h-24 mb-4 bg-muted rounded-full flex items-center justify-center">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    </div>
    <p className="font-medium text-base mb-2">No properties found</p>
    <p className="text-sm">Try adjusting your search or filters.</p>
  </div>
))
EmptyState.displayName = "EmptyState"

// ─── Main component ───────────────────────────────────────────────────────────

export const VirtualizedPropertyList = memo(
  forwardRef<EnterpriseVirtualizedListHandle, VirtualizedPropertyListProps>(
    (
      {
        properties,
        viewMode,
        height,
        width,
        onPropertyClick,
        onEndReached,
        loading = false,
        className = "",
        CardComponent,
        itemsPerRow: propItemsPerRow,
        gridItemWidth = 320,
        gridItemHeight = 400,
        listItemHeight = 200,
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement>(null)
      const [containerWidth, setContainerWidth] = useState(width ?? 1200)

      // Sync container width via ResizeObserver when width is not explicitly provided
      useEffect(() => {
        if (width !== undefined) {
          setContainerWidth(width)
          return
        }
        if (!containerRef.current) return

        const observer = new ResizeObserver(([entry]) => {
          setContainerWidth(entry.contentRect.width)
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
      }, [width])

      // Expose scroll-to-top for parent consumers via ref
      useImperativeHandle(ref, () => ({
        scrollToTop: () => containerRef.current?.scrollTo({ top: 0 }),
        scrollToItem: (index: number) => {
          // For grid mode, calculate row and scroll to it
          if (viewMode === "grid") {
            const row = Math.floor(index / (propItemsPerRow ?? 1));
            containerRef.current?.scrollTo({ top: row * gridItemHeight });
          } else {
            // For list mode, scroll to the item
            containerRef.current?.scrollTo({ top: index * listItemHeight });
          }
        },
        recompute: () => {
          // No-op for fixed size lists
        },
        getScrollOffset: () => containerRef.current?.scrollTop ?? 0,
        getTotalSize: () => {
          if (viewMode === "grid") {
            const rows = Math.ceil(properties.length / (propItemsPerRow ?? 1));
            return rows * gridItemHeight;
          }
          return properties.length * listItemHeight;
        },
      }))

      const { itemsPerRow: calculatedItemsPerRow, actualItemWidth } =
        useResponsiveGrid(containerWidth, gridItemWidth, 1, 6)

      const finalItemsPerRow = propItemsPerRow ?? calculatedItemsPerRow
      const numericWidth = width ?? containerWidth

      const rowCount = Math.ceil(properties.length / finalItemsPerRow)

      // Fire onEndReached when the last row is rendered
      const handleGridItemsRendered = useCallback(
        ({ visibleRowStopIndex }: { visibleRowStopIndex: number }) => {
          if (onEndReached && visibleRowStopIndex >= rowCount - 1) {
            onEndReached()
          }
        },
        [onEndReached, rowCount]
      )

      const handleListItemsRendered = useCallback(
        ({ visibleStopIndex }: { visibleStopIndex: number }) => {
          if (onEndReached && visibleStopIndex >= properties.length - 1) {
            onEndReached()
          }
        },
        [onEndReached, properties.length]
      )

      const gridData = useMemo<GridItemData>(
        () => ({ properties, itemsPerRow: finalItemsPerRow, onPropertyClick, CardComponent }),
        [properties, finalItemsPerRow, onPropertyClick, CardComponent]
      )

      const listData = useMemo<ListItemData>(
        () => ({ properties, onPropertyClick, CardComponent }),
        [properties, onPropertyClick, CardComponent]
      )

      if (loading) {
        return (
          <div ref={containerRef} className={`${className} h-full`}>
            <LoadingState />
          </div>
        )
      }

      if (properties.length === 0) {
        return (
          <div ref={containerRef} className={`${className} h-full`}>
            <EmptyState />
          </div>
        )
      }

      if (viewMode === "grid") {
        return (
          <div ref={containerRef} className={`${className} w-full`}>
            <Grid
              columnCount={finalItemsPerRow}
              columnWidth={actualItemWidth}
              rowCount={rowCount}
              rowHeight={gridItemHeight}
              cellComponent={GridCell as any}
              cellProps={gridData}
              overscanCount={2}
              style={{
                width: numericWidth,
                height: height,
              }}
            />
          </div>
        )
      }

      return (
        <div ref={containerRef} className={`${className} w-full`}>
          <List
            rowCount={properties.length}
            rowHeight={listItemHeight}
            rowComponent={ListRow as any}
            rowProps={listData}
            overscanCount={5}
            style={{
              width: numericWidth,
              height: height,
            }}
          />
        </div>
      )
    }
  )
)
VirtualizedPropertyList.displayName = "VirtualizedPropertyList"

// Export with both names for backward compatibility
export const EnhancedVirtualizedPropertyList = VirtualizedPropertyList
export const EnterprisePropertyList = VirtualizedPropertyList
export type EnhancedVirtualizedPropertyListProps = VirtualizedPropertyListProps
export type EnterprisePropertyListProps = VirtualizedPropertyListProps

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVirtualizedPropertyList(
  properties: readonly NormalizedProperty[],
  viewMode: ViewMode,
  containerRef?: React.RefObject<HTMLDivElement>
) {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 })

  useEffect(() => {
    if (!containerRef?.current) return

    const updateDimensions = () => {
      if (!containerRef.current) return
      const { width, top } = containerRef.current.getBoundingClientRect()
      setDimensions({
        width,
        height: Math.max(400, window.innerHeight - top - 100),
      })
    }

    const observer = new ResizeObserver(updateDimensions)
    observer.observe(containerRef.current)
    updateDimensions()
    return () => observer.disconnect()
  }, [containerRef])

  const itemsPerRow = useMemo(() => {
    if (viewMode === "list") return 1
    const available = Math.max(0, dimensions.width - 32)
    return Math.max(1, Math.min(6, Math.floor(available / 320)))
  }, [viewMode, dimensions.width])

  return {
    dimensions,
    itemsPerRow,
    isEmpty: properties.length === 0,
  }
}