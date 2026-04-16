"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyDataGrid = PropertyDataGrid;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_window_1 = require("react-window");
var button_1 = require("../ui/button");
var card_1 = require("../ui/card");
/**
 * Generic property data grid component with virtualization support
 * Supports both grid and list view modes with consistent performance
 */
function PropertyDataGrid(_a) {
    var items = _a.items, loading = _a.loading, viewMode = _a.viewMode, onViewModeChange = _a.onViewModeChange, renderItem = _a.renderItem, itemHeight = _a.itemHeight, gridItemSize = _a.gridItemSize, emptyState = _a.emptyState, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.containerHeight, containerHeight = _c === void 0 ? 600 : _c, _d = _a.containerWidth, containerWidth = _d === void 0 ? 1200 : _d;
    // Calculate grid dimensions
    var gridConfig = (0, react_1.useMemo)(function () {
        var columnsPerRow = Math.floor(containerWidth / gridItemSize.width);
        var rowCount = Math.ceil(items.length / columnsPerRow);
        return {
            columnsPerRow: columnsPerRow,
            rowCount: rowCount,
            columnWidth: gridItemSize.width,
            rowHeight: gridItemSize.height,
        };
    }, [items.length, containerWidth, gridItemSize]);
    // Grid cell renderer
    var GridCell = (0, react_1.useCallback)(function (_a) {
        var columnIndex = _a.columnIndex, rowIndex = _a.rowIndex, style = _a.style;
        var itemIndex = rowIndex * gridConfig.columnsPerRow + columnIndex;
        var item = items[itemIndex];
        if (!item) {
            return <div style={style}/>;
        }
        return (<div style={style}>
        <div className="p-2">
          {renderItem(item, { width: '100%', height: '100%' })}
        </div>
      </div>);
    }, [items, gridConfig.columnsPerRow, renderItem]);
    // List item renderer
    var ListItem = (0, react_1.useCallback)(function (_a) {
        var index = _a.index, style = _a.style;
        var item = items[index];
        return (<div style={style}>
        <div className="px-4 py-2">
          {item && renderItem(item, { width: '100%', height: itemHeight - 16 })}
        </div>
      </div>);
    }, [items, renderItem, itemHeight]);
    // Loading state
    if (loading) {
        return (<div className={"flex items-center justify-center h-64 ".concat(className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <lucide_react_1.Loader2 className="w-5 h-5 animate-spin"/>
          <span>Loading properties...</span>
        </div>
      </div>);
    }
    // Empty state
    if (items.length === 0) {
        return (<div className={"flex items-center justify-center h-64 ".concat(className)}>
        {emptyState || (<card_1.Card className="p-8 text-center">
            <div className="text-muted-foreground">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-lg font-medium mb-2">No properties found</h3>
              <p className="text-sm">Try adjusting your filters or search criteria</p>
            </div>
          </card_1.Card>)}
      </div>);
    }
    return (<div className={"space-y-4 ".concat(className)}>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'property' : 'properties'} found
        </div>
        <div className="flex items-center gap-2">
          <button_1.Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={function () { return onViewModeChange('grid'); }} className="flex items-center gap-2">
            <lucide_react_1.Grid3X3 className="w-4 h-4"/>
            Grid
          </button_1.Button>
          <button_1.Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={function () { return onViewModeChange('list'); }} className="flex items-center gap-2">
            <lucide_react_1.List className="w-4 h-4"/>
            List
          </button_1.Button>
        </div>
      </div>

      {/* Virtualized Content */}
      <div className="border rounded-lg overflow-hidden">
        {viewMode === 'grid' ? (<react_window_1.FixedSizeGrid columnCount={gridConfig.columnsPerRow} columnWidth={gridConfig.columnWidth} height={containerHeight} rowCount={gridConfig.rowCount} rowHeight={gridConfig.rowHeight} width={containerWidth} className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {GridCell}
          </react_window_1.FixedSizeGrid>) : (<react_window_1.FixedSizeList height={containerHeight} itemCount={items.length} itemSize={itemHeight} width={containerWidth} className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {ListItem}
          </react_window_1.FixedSizeList>)}
      </div>

      {/* Performance Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (<div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <div>Virtualized: {items.length} items</div>
          <div>View: {viewMode}</div>
          {viewMode === 'grid' && (<div>Grid: {gridConfig.rowCount} rows × {gridConfig.columnsPerRow} columns</div>)}
        </div>)}
    </div>);
}
// Export with display name for debugging
PropertyDataGrid.displayName = 'PropertyDataGrid';
exports.default = PropertyDataGrid;
