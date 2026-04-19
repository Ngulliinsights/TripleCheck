/**
 * PropertyDataGrid
 *
 * Generic, virtualized data grid for property listings.
 * Supports grid and list view modes via react-window with consistent performance
 * regardless of item count.
 */

import { Grid3X3, List as ListIcon, Loader2 } from 'lucide-react'
import React, { useMemo, useCallback } from 'react'
import { Grid, List } from 'react-window'
import type { CellComponentProps, RowComponentProps } from 'react-window'

import { Button } from '../../local/components/ui/button'
import { Card } from '../../local/components/ui/card'

// =============================================================================
// Types
// =============================================================================

export interface PropertyDataGridProps<T> {
  readonly items: T[]
  readonly loading: boolean
  readonly viewMode: 'grid' | 'list'
  readonly onViewModeChange: (mode: 'grid' | 'list') => void
  /**
   * Renders a single item. The `innerStyle` argument provides computed inner
   * dimensions so the item can fill its cell correctly.
   */
  readonly renderItem: (item: T, innerStyle: React.CSSProperties) => React.ReactNode
  /** Row height used by the list virtualiser (px). */
  readonly itemHeight: number
  readonly gridItemSize: { width: number; height: number }
  readonly emptyState?: React.ReactNode
  readonly className?: string
  /** Pixel height of the scrollable viewport (default: 600). */
  readonly containerHeight?: number
  /** Pixel width of the scrollable viewport (default: 1200). */
  readonly containerWidth?: number
}

// =============================================================================
// Component
// =============================================================================

export function PropertyDataGrid<T>({
  items,
  loading,
  viewMode,
  onViewModeChange,
  renderItem,
  itemHeight,
  gridItemSize,
  emptyState,
  className = '',
  containerHeight = 600,
  containerWidth = 1200,
}: PropertyDataGridProps<T>): React.ReactElement {

  // ---------------------------------------------------------------------------
  // Derived grid geometry
  // ---------------------------------------------------------------------------

  const gridConfig = useMemo(() => {
    // Clamp to ≥1 to prevent division-by-zero when containerWidth is very small.
    const columnsPerRow = Math.max(1, Math.floor(containerWidth / gridItemSize.width))
    const rowCount = Math.ceil(items.length / columnsPerRow)

    return {
      columnsPerRow,
      rowCount,
      columnWidth: gridItemSize.width,
      rowHeight: gridItemSize.height,
    }
  }, [items.length, containerWidth, gridItemSize])

  // ---------------------------------------------------------------------------
  // Cell / row renderers (stable references via useCallback)
  // ---------------------------------------------------------------------------

  const GridCell = useCallback(
    ({ columnIndex, rowIndex, style, ariaAttributes }: CellComponentProps) => {
      const itemIndex = rowIndex * gridConfig.columnsPerRow + columnIndex
      const item = items[itemIndex]

      if (!item) return <div style={style} {...ariaAttributes} />

      return (
        <div style={style} {...ariaAttributes}>
          <div className="p-2 h-full">
            {renderItem(item, { width: '100%', height: '100%' })}
          </div>
        </div>
      )
    },
    [items, gridConfig.columnsPerRow, renderItem],
  )

  const ListRow = useCallback(
    ({ index, style, ariaAttributes }: RowComponentProps) => {
      const item = items[index]
      if (!item) return <div style={style} {...ariaAttributes} />

      return (
        <div style={style} {...ariaAttributes}>
          <div className="px-4 py-2">
            {renderItem(item, { width: '100%', height: itemHeight - 16 })}
          </div>
        </div>
      )
    },
    [items, renderItem, itemHeight],
  )

  // ---------------------------------------------------------------------------
  // Early-return states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
          <span>Loading properties…</span>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        {emptyState ?? (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">
              <div className="text-4xl mb-4" aria-hidden>🏠</div>
              <h3 className="text-lg font-medium mb-2">No properties found</h3>
              <p className="text-sm">Try adjusting your filters or search criteria</p>
            </div>
          </Card>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const itemLabel = items.length === 1 ? 'property' : 'properties'

  return (
    <div className={`space-y-4 ${className}`}>

      {/* View-mode toggle + item count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {itemLabel} found
        </p>

        <div className="flex items-center gap-2" role="group" aria-label="View mode">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            aria-pressed={viewMode === 'grid'}
            className="flex items-center gap-2"
          >
            <Grid3X3 className="w-4 h-4" aria-hidden />
            Grid
          </Button>

          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            aria-pressed={viewMode === 'list'}
            className="flex items-center gap-2"
          >
            <ListIcon className="w-4 h-4" aria-hidden />
            List
          </Button>
        </div>
      </div>

      {/* Virtualised viewport */}
      <div className="border rounded-lg overflow-hidden">
        {viewMode === 'grid' ? (
          <Grid
            columnCount={gridConfig.columnsPerRow}
            columnWidth={gridConfig.columnWidth}
            rowCount={gridConfig.rowCount}
            rowHeight={gridConfig.rowHeight}
            cellComponent={GridCell}
            cellProps={{}}
            style={{ height: containerHeight, width: containerWidth }}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          />
        ) : (
          <List
            rowCount={items.length}
            rowHeight={itemHeight}
            rowComponent={ListRow}
            rowProps={{}}
            style={{ height: containerHeight, width: containerWidth }}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          />
        )}
      </div>

      {/* Dev-only debug strip */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded font-mono">
          <span>virtualised · {items.length} items · {viewMode} view</span>
          {viewMode === 'grid' && (
            <span>
              {' '}· {gridConfig.rowCount}r × {gridConfig.columnsPerRow}c
            </span>
          )}
        </div>
      )}
    </div>
  )
}

PropertyDataGrid.displayName = 'PropertyDataGrid'

export default PropertyDataGrid