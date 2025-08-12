import React, { forwardRef, memo, useMemo, useCallback, useState, useEffect } from 'react';
import { FixedSizeGrid as Grid, FixedSizeList as List } from 'react-window';

import type { NormalizedProperty, ViewMode } from '../types/property';

import { GridVirtualizedList, EnterpriseVirtualizedList, EnterpriseVirtualizedListHandle } from './VirtualizedList';

interface EnhancedVirtualizedPropertyListProps {
  properties: readonly NormalizedProperty[];
  viewMode: ViewMode;
  height: number | string;
  width?: number | string;
  onPropertyClick?: (property: NormalizedProperty) => void;
  onEndReached?: () => void;
  loading?: boolean;
  className?: string;
  enableCompare?: boolean;
  enablePhotoManagement?: boolean;
  CardComponent: React.ComponentType<{
    property: NormalizedProperty;
    onClick?: (property: NormalizedProperty) => void;
    className?: string;
  }>;
  // Grid-specific props
  itemsPerRow?: number;
  gridItemWidth?: number;
  gridItemHeight?: number;
  // List-specific props
  listItemHeight?: number;
}

interface PropertyItemProps {
  property: NormalizedProperty;
  index: number;
  style: React.CSSProperties;
  viewMode: ViewMode;
  onPropertyClick?: (property: NormalizedProperty) => void;
  CardComponent: React.ComponentType<{
    property: NormalizedProperty;
    onClick?: (property: NormalizedProperty) => void;
    className?: string;
  }>;
}

// Memoized property item component that works for both grid and list modes
const PropertyItem = memo<PropertyItemProps>(({
  property,
  style,
  viewMode,
  onPropertyClick,
  CardComponent,
}) => {
  const handleClick = useCallback(() => {
    onPropertyClick?.(property);
  }, [property, onPropertyClick]);

  return (
    <div style={style} className="property-item-container">
      <div className={`p-2 ${viewMode === 'list' ? 'w-full' : ''}`}>
        <CardComponent
          property={property}
          onClick={handleClick}
          className={viewMode === 'list' ? 'flex flex-row w-full' : ''}
        />
      </div>
    </div>
  );
});

PropertyItem.displayName = 'PropertyItem';

// Grid item component for react-window Grid
interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    properties: readonly NormalizedProperty[];
    itemsPerRow: number;
    onPropertyClick?: (property: NormalizedProperty) => void;
    CardComponent: React.ComponentType<{
      property: NormalizedProperty;
      onClick?: (property: NormalizedProperty) => void;
      className?: string;
    }>;
  };
}

const GridItem = memo<GridItemProps>(({ columnIndex, rowIndex, style, data }) => {
  const { properties, itemsPerRow, onPropertyClick, CardComponent } = data;
  const index = rowIndex * itemsPerRow + columnIndex;
  const property = properties[index];

  if (!property) {
    return <div style={style} />;
  }

  return (
    <PropertyItem
      property={property}
      index={index}
      style={style}
      viewMode="grid"
      onPropertyClick={onPropertyClick}
      CardComponent={CardComponent}
    />
  );
});

GridItem.displayName = 'GridItem';

// List item component for react-window List
interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    properties: readonly NormalizedProperty[];
    onPropertyClick?: (property: NormalizedProperty) => void;
    CardComponent: React.ComponentType<{
      property: NormalizedProperty;
      onClick?: (property: NormalizedProperty) => void;
      className?: string;
    }>;
  };
}

const ListItem = memo<ListItemProps>(({ index, style, data }) => {
  const { properties, onPropertyClick, CardComponent } = data;
  const property = properties[index];

  if (!property) {
    return <div style={style} />;
  }

  return (
    <PropertyItem
      property={property}
      index={index}
      style={style}
      viewMode="list"
      onPropertyClick={onPropertyClick}
      CardComponent={CardComponent}
    />
  );
});

ListItem.displayName = 'ListItem';

// Hook to calculate responsive grid dimensions
function useResponsiveGrid(
  containerWidth: number,
  itemWidth: number,
  minItemsPerRow: number = 1,
  maxItemsPerRow: number = 6
) {
  return useMemo(() => {
    const availableWidth = containerWidth - 32; // Account for padding
    const itemsPerRow = Math.max(
      minItemsPerRow,
      Math.min(maxItemsPerRow, Math.floor(availableWidth / itemWidth))
    );
    const actualItemWidth = Math.floor(availableWidth / itemsPerRow);
    
    return {
      itemsPerRow,
      actualItemWidth,
    };
  }, [containerWidth, itemWidth, minItemsPerRow, maxItemsPerRow]);
}

// Main enhanced virtualized property list component
export const EnhancedVirtualizedPropertyList = memo(
  forwardRef<EnterpriseVirtualizedListHandle, EnhancedVirtualizedPropertyListProps>(
    (
      {
        properties,
        viewMode,
        height,
        width = '100%',
        onPropertyClick,
        onEndReached,
        loading = false,
        className = '',
        enableCompare = true,
        enablePhotoManagement = true,
        CardComponent,
        itemsPerRow: propItemsPerRow,
        gridItemWidth = 320,
        gridItemHeight = 400,
        listItemHeight = 200,
      },
      ref
    ) => {
      const [containerWidth, setContainerWidth] = useState(1200);

      // Calculate responsive grid dimensions
      const { itemsPerRow, actualItemWidth } = useResponsiveGrid(
        typeof width === 'number' ? width : containerWidth,
        gridItemWidth,
        1,
        6
      );

      const finalItemsPerRow = propItemsPerRow || itemsPerRow;

      // Update container width when it changes
      useEffect(() => {
        if (typeof width === 'number') {
          setContainerWidth(width);
        }
      }, [width]);

      // Memoized data for grid mode
      const gridData = useMemo(() => ({
        properties,
        itemsPerRow: finalItemsPerRow,
        onPropertyClick,
        CardComponent,
      }), [properties, finalItemsPerRow, onPropertyClick, CardComponent]);

      // Memoized data for list mode
      const listData = useMemo(() => ({
        properties,
        onPropertyClick,
        CardComponent,
      }), [properties, onPropertyClick, CardComponent]);

      // Calculate grid dimensions
      const rowCount = Math.ceil(properties.length / finalItemsPerRow);
      const columnCount = finalItemsPerRow;

      // Handle end reached for grid mode
      const handleGridEndReached = useCallback(() => {
        onEndReached?.();
      }, [onEndReached]);

      // Handle end reached for list mode
      const handleListEndReached = useCallback(() => {
        onEndReached?.();
      }, [onEndReached]);

      // Loading component
      const loadingComponent = useMemo(
        () => (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-muted-foreground">Loading properties...</span>
          </div>
        ),
        []
      );

      // Empty component
      const emptyComponent = useMemo(
        () => (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-24 h-24 mb-4 bg-muted rounded-full flex items-center justify-center">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="font-medium text-base mb-2">No properties found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ),
        []
      );

      if (loading) {
        return <div className={`${className} h-full`}>{loadingComponent}</div>;
      }

      if (properties.length === 0) {
        return <div className={`${className} h-full`}>{emptyComponent}</div>;
      }

      // Render grid mode
      if (viewMode === 'grid') {
        return (
          <div className={`${className} w-full`} style={{ height }}>
            <Grid
              columnCount={columnCount}
              columnWidth={actualItemWidth}
              height={typeof height === 'number' ? height : 600}
              rowCount={rowCount}
              rowHeight={gridItemHeight}
              width={typeof width === 'number' ? width : containerWidth}
              itemData={gridData}
              overscanRowCount={2}
              overscanColumnCount={1}
            >
              {GridItem}
            </Grid>
          </div>
        );
      }

      // Render list mode
      return (
        <div className={`${className} w-full`} style={{ height }}>
          <List
            height={typeof height === 'number' ? height : 600}
            itemCount={properties.length}
            itemSize={listItemHeight}
            width={typeof width === 'number' ? width : containerWidth}
            itemData={listData}
            overscanCount={5}
          >
            {ListItem}
          </List>
        </div>
      );
    }
  )
);

EnhancedVirtualizedPropertyList.displayName = 'EnhancedVirtualizedPropertyList';

// Hook for managing virtualized property list state
export function useVirtualizedPropertyList(
  properties: readonly NormalizedProperty[],
  viewMode: ViewMode,
  containerRef?: React.RefObject<HTMLDivElement>
) {
  const [dimensions, setDimensions] = useState({
    width: 1200,
    height: 600,
  });

  useEffect(() => {
    if (!containerRef?.current) return;

    const updateDimensions = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setDimensions({
        width: rect.width,
        height: Math.max(400, window.innerHeight - rect.top - 100),
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [containerRef]);

  const itemsPerRow = useMemo(() => {
    if (viewMode === 'list') return 1;
    
    const itemWidth = 320;
    const availableWidth = dimensions.width - 32;
    return Math.max(1, Math.min(6, Math.floor(availableWidth / itemWidth)));
  }, [viewMode, dimensions.width]);

  return {
    dimensions,
    itemsPerRow,
    isEmpty: properties.length === 0,
  };
}