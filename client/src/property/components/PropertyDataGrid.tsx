import { Grid3X3, List as ListIcon, Loader2 } from 'lucide-react'
import React, { useMemo, useCallback } from 'react'
import { FixedSizeGrid as Grid, FixedSizeList as List } from 'react-window'

import { Button } from '../../local/components/ui/button'
import { Card } from '../../local/components/ui/card'

interface PropertyDataGridProps<T> {
  readonly items: T[];
  readonly loading: boolean;
  readonly viewMode: 'grid' | 'list';
  readonly onViewModeChange: (mode: 'grid' | 'list') => void;
  readonly renderItem: (item: T, style: React.CSSProperties) => React.ReactNode;
  readonly itemHeight: number;
  readonly gridItemSize: { width: number; height: number };
  readonly emptyState?: React.ReactNode;
  readonly className?: string;
  readonly containerHeight?: number;
  readonly containerWidth?: number;
}

/**
 * Generic property data grid component with virtualization support
 * Supports both grid and list view modes with consistent performance
 */
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

  // Calculate grid dimensions
  const gridConfig = useMemo(() => {
    const columnsPerRow = Math.floor(containerWidth / gridItemSize.width);
    const rowCount = Math.ceil(items.length / columnsPerRow);
    
    return {
      columnsPerRow,
      rowCount,
      columnWidth: gridItemSize.width,
      rowHeight: gridItemSize.height,
    };
  }, [items.length, containerWidth, gridItemSize]);

  // Grid cell renderer
  const GridCell = useCallback(({ columnIndex, rowIndex, style }: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
  }) => {
    const itemIndex = rowIndex * gridConfig.columnsPerRow + columnIndex;
    const item = items[itemIndex];
    
    if (!item) {
      return <div style={style} />;
    }

    return (
      <div style={style}>
        <div className="p-2">
          {renderItem(item, { width: '100%', height: '100%' })}
        </div>
      </div>
    );
  }, [items, gridConfig.columnsPerRow, renderItem]);

  // List item renderer
  const ListItem = useCallback(({ index, style }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = items[index];
    
    return (
      <div style={style}>
        <div className="px-4 py-2">
          {item && renderItem(item, { width: '100%', height: itemHeight - 16 })}
        </div>
      </div>
    );
  }, [items, renderItem, itemHeight]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading properties...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        {emptyState || (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-lg font-medium mb-2">No properties found</h3>
              <p className="text-sm">Try adjusting your filters or search criteria</p>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'property' : 'properties'} found
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="flex items-center gap-2"
          >
            <Grid3X3 className="w-4 h-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="flex items-center gap-2"
          >
            <ListIcon className="w-4 h-4" />
            List
          </Button>
        </div>
      </div>

      {/* Virtualized Content */}
      <div className="border rounded-lg overflow-hidden">
        {viewMode === 'grid' ? (
          <Grid
            columnCount={gridConfig.columnsPerRow}
            columnWidth={gridConfig.columnWidth}
            height={containerHeight}
            rowCount={gridConfig.rowCount}
            rowHeight={gridConfig.rowHeight}
            width={containerWidth}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {GridCell}
          </Grid>
        ) : (
          <List
            height={containerHeight}
            itemCount={items.length}
            itemSize={itemHeight}
            width={containerWidth}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {ListItem}
          </List>
        )}
      </div>

      {/* Performance Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <div>Virtualized: {items.length} items</div>
          <div>View: {viewMode}</div>
          {viewMode === 'grid' && (
            <div>Grid: {gridConfig.rowCount} rows × {gridConfig.columnsPerRow} columns</div>
          )}
        </div>
      )}
    </div>
  );
}

// Export with display name for debugging
PropertyDataGrid.displayName = 'PropertyDataGrid';

export default PropertyDataGrid;