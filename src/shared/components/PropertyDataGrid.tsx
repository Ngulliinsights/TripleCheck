import { Grid, List } from "lucide-react";
import React, { memo, useCallback, useMemo } from "react";

import { Property } from "../types/property";

import { Button } from "./ui/button";
import { EnterprisePropertyList } from "./VirtualizedPropertyList";

export interface PropertyDataGridProps {
  items: Property[];
  loading: boolean;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  renderItem: (
    property: Property,
    style: React.CSSProperties
  ) => React.ReactNode;
  itemHeight: number;
  gridItemSize: { width: number; height: number };
  containerHeight: number;
  containerWidth: number | string;
  emptyState?: React.ReactNode;
  className?: string;
}

/**
 * PropertyDataGrid component that handles both grid and list view modes
 * for property listings with proper virtualization and containment
 */
export const PropertyDataGrid = memo<PropertyDataGridProps>(
  ({
    items,
    loading,
    viewMode,
    onViewModeChange,
    renderItem,
    itemHeight,
    gridItemSize,
    containerHeight,
    containerWidth,
    emptyState,
    className = "",
  }) => {
    // View mode toggle handlers
    const handleGridMode = useCallback(() => {
      onViewModeChange("grid");
    }, [onViewModeChange]);

    const handleListMode = useCallback(() => {
      onViewModeChange("list");
    }, [onViewModeChange]);

    // Container class based on view mode
    const containerClass = useMemo(() => {
      const baseClass = `property-data-grid ${className}`;
      return viewMode === "grid" ?
          `${baseClass} property-grid-virtualized`
        : `${baseClass} property-list-virtualized`;
    }, [viewMode, className]);

    // Calculate item height based on view mode
    const calculatedItemHeight = useMemo(() => {
      return viewMode === "grid" ? gridItemSize.height : itemHeight;
    }, [viewMode, gridItemSize.height, itemHeight]);

    return (
      <div className={containerClass}>
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              View:
            </span>
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={handleGridMode}
                className="h-8 px-3"
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={handleListMode}
                className="h-8 px-3"
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "property" : "properties"}
          </div>
        </div>

        {/* Virtualized Property List */}
        <div className="property-grid-container">
          <EnterprisePropertyList
            properties={items}
            height={containerHeight}
            width={containerWidth}
            itemHeight={calculatedItemHeight}
            onPropertyClick={(property) => {
              // This will be handled by the renderItem function
              // Property click handling is delegated to the renderItem function
            }}
            loading={loading}
            className="w-full"
            enableAnalytics={true}
          />
        </div>

        {/* Empty State */}
        {!loading && items.length === 0 && emptyState && (
          <div className="flex items-center justify-center h-64">
            {emptyState}
          </div>
        )}
      </div>
    );
  }
);

PropertyDataGrid.displayName = "PropertyDataGrid";

export default PropertyDataGrid;
