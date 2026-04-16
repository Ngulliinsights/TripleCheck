"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterprisePropertyList = exports.EnhancedVirtualizedPropertyList = exports.VirtualizedPropertyList = void 0;
exports.useVirtualizedPropertyList = useVirtualizedPropertyList;
var react_1 = require("react");
var react_window_1 = require("react-window");
var GridCell = (0, react_1.memo)(function (_a) {
    var columnIndex = _a.columnIndex, rowIndex = _a.rowIndex, style = _a.style, properties = _a.properties, itemsPerRow = _a.itemsPerRow, onPropertyClick = _a.onPropertyClick, CardComponent = _a.CardComponent;
    var index = rowIndex * itemsPerRow + columnIndex;
    var property = properties[index];
    var handleClick = (0, react_1.useCallback)(function () { return onPropertyClick === null || onPropertyClick === void 0 ? void 0 : onPropertyClick(property); }, [property, onPropertyClick]);
    if (!property)
        return <div style={style}/>;
    return (<div style={style}>
        <div className="p-2">
          <CardComponent property={property} onClick={handleClick}/>
        </div>
      </div>);
});
GridCell.displayName = "GridCell";
var ListRow = (0, react_1.memo)(function (_a) {
    var index = _a.index, style = _a.style, properties = _a.properties, onPropertyClick = _a.onPropertyClick, CardComponent = _a.CardComponent;
    var property = properties[index];
    var handleClick = (0, react_1.useCallback)(function () { return onPropertyClick === null || onPropertyClick === void 0 ? void 0 : onPropertyClick(property); }, [property, onPropertyClick]);
    if (!property)
        return <div style={style}/>;
    return (<div style={style}>
        <div className="p-2 w-full">
          <CardComponent property={property} onClick={handleClick} className="flex flex-row w-full"/>
        </div>
      </div>);
});
ListRow.displayName = "ListRow";
// ─── Responsive grid hook ─────────────────────────────────────────────────────
function useResponsiveGrid(containerWidth, itemWidth, minItemsPerRow, maxItemsPerRow) {
    if (minItemsPerRow === void 0) { minItemsPerRow = 1; }
    if (maxItemsPerRow === void 0) { maxItemsPerRow = 6; }
    return (0, react_1.useMemo)(function () {
        var available = Math.max(0, containerWidth - 32);
        var count = Math.max(minItemsPerRow, Math.min(maxItemsPerRow, Math.floor(available / itemWidth)));
        return {
            itemsPerRow: count,
            actualItemWidth: Math.floor(available / count),
        };
    }, [containerWidth, itemWidth, minItemsPerRow, maxItemsPerRow]);
}
// ─── Loading / empty states ───────────────────────────────────────────────────
var LoadingState = (0, react_1.memo)(function () { return (<div className="flex items-center justify-center h-full">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/>
    <span className="ml-3 text-sm text-muted-foreground">Loading properties…</span>
  </div>); });
LoadingState.displayName = "LoadingState";
var EmptyState = (0, react_1.memo)(function () { return (<div className="flex flex-col items-center justify-center h-full text-muted-foreground">
    <div className="w-24 h-24 mb-4 bg-muted rounded-full flex items-center justify-center">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </svg>
    </div>
    <p className="font-medium text-base mb-2">No properties found</p>
    <p className="text-sm">Try adjusting your search or filters.</p>
  </div>); });
EmptyState.displayName = "EmptyState";
// ─── Main component ───────────────────────────────────────────────────────────
exports.VirtualizedPropertyList = (0, react_1.memo)((0, react_1.forwardRef)(function (_a, ref) {
    var properties = _a.properties, viewMode = _a.viewMode, height = _a.height, width = _a.width, onPropertyClick = _a.onPropertyClick, onEndReached = _a.onEndReached, _b = _a.loading, loading = _b === void 0 ? false : _b, _c = _a.className, className = _c === void 0 ? "" : _c, CardComponent = _a.CardComponent, propItemsPerRow = _a.itemsPerRow, _d = _a.gridItemWidth, gridItemWidth = _d === void 0 ? 320 : _d, _e = _a.gridItemHeight, gridItemHeight = _e === void 0 ? 400 : _e, _f = _a.listItemHeight, listItemHeight = _f === void 0 ? 200 : _f;
    var containerRef = (0, react_1.useRef)(null);
    var _g = (0, react_1.useState)(width !== null && width !== void 0 ? width : 1200), containerWidth = _g[0], setContainerWidth = _g[1];
    // Sync container width via ResizeObserver when width is not explicitly provided
    (0, react_1.useEffect)(function () {
        if (width !== undefined) {
            setContainerWidth(width);
            return;
        }
        if (!containerRef.current)
            return;
        var observer = new ResizeObserver(function (_a) {
            var entry = _a[0];
            setContainerWidth(entry.contentRect.width);
        });
        observer.observe(containerRef.current);
        return function () { return observer.disconnect(); };
    }, [width]);
    // Expose scroll-to-top for parent consumers via ref
    (0, react_1.useImperativeHandle)(ref, function () { return ({
        scrollToTop: function () { var _a; return (_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.scrollTo({ top: 0 }); },
        scrollToItem: function (index) {
            var _a, _b;
            // For grid mode, calculate row and scroll to it
            if (viewMode === "grid") {
                var row = Math.floor(index / (propItemsPerRow !== null && propItemsPerRow !== void 0 ? propItemsPerRow : 1));
                (_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.scrollTo({ top: row * gridItemHeight });
            }
            else {
                // For list mode, scroll to the item
                (_b = containerRef.current) === null || _b === void 0 ? void 0 : _b.scrollTo({ top: index * listItemHeight });
            }
        },
        recompute: function () {
            // No-op for fixed size lists
        },
        getScrollOffset: function () { var _a, _b; return (_b = (_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.scrollTop) !== null && _b !== void 0 ? _b : 0; },
        getTotalSize: function () {
            if (viewMode === "grid") {
                var rows = Math.ceil(properties.length / (propItemsPerRow !== null && propItemsPerRow !== void 0 ? propItemsPerRow : 1));
                return rows * gridItemHeight;
            }
            return properties.length * listItemHeight;
        },
    }); });
    var _h = useResponsiveGrid(containerWidth, gridItemWidth, 1, 6), calculatedItemsPerRow = _h.itemsPerRow, actualItemWidth = _h.actualItemWidth;
    var finalItemsPerRow = propItemsPerRow !== null && propItemsPerRow !== void 0 ? propItemsPerRow : calculatedItemsPerRow;
    var numericWidth = width !== null && width !== void 0 ? width : containerWidth;
    var rowCount = Math.ceil(properties.length / finalItemsPerRow);
    // Fire onEndReached when the last row is rendered
    var handleGridItemsRendered = (0, react_1.useCallback)(function (_a) {
        var visibleRowStopIndex = _a.visibleRowStopIndex;
        if (onEndReached && visibleRowStopIndex >= rowCount - 1) {
            onEndReached();
        }
    }, [onEndReached, rowCount]);
    var handleListItemsRendered = (0, react_1.useCallback)(function (_a) {
        var visibleStopIndex = _a.visibleStopIndex;
        if (onEndReached && visibleStopIndex >= properties.length - 1) {
            onEndReached();
        }
    }, [onEndReached, properties.length]);
    var gridData = (0, react_1.useMemo)(function () { return ({ properties: properties, itemsPerRow: finalItemsPerRow, onPropertyClick: onPropertyClick, CardComponent: CardComponent }); }, [properties, finalItemsPerRow, onPropertyClick, CardComponent]);
    var listData = (0, react_1.useMemo)(function () { return ({ properties: properties, onPropertyClick: onPropertyClick, CardComponent: CardComponent }); }, [properties, onPropertyClick, CardComponent]);
    if (loading) {
        return (<div ref={containerRef} className={"".concat(className, " h-full")}>
            <LoadingState />
          </div>);
    }
    if (properties.length === 0) {
        return (<div ref={containerRef} className={"".concat(className, " h-full")}>
            <EmptyState />
          </div>);
    }
    if (viewMode === "grid") {
        return (<div ref={containerRef} className={"".concat(className, " w-full")}>
            <react_window_1.Grid columnCount={finalItemsPerRow} columnWidth={actualItemWidth} rowCount={rowCount} rowHeight={gridItemHeight} cellComponent={GridCell} cellProps={gridData} overscanCount={2} style={{
                width: numericWidth,
                height: height,
            }}/>
          </div>);
    }
    return (<div ref={containerRef} className={"".concat(className, " w-full")}>
          <react_window_1.List rowCount={properties.length} rowHeight={listItemHeight} rowComponent={ListRow} rowProps={listData} overscanCount={5} style={{
            width: numericWidth,
            height: height,
        }}/>
        </div>);
}));
exports.VirtualizedPropertyList.displayName = "VirtualizedPropertyList";
// Export with both names for backward compatibility
exports.EnhancedVirtualizedPropertyList = exports.VirtualizedPropertyList;
exports.EnterprisePropertyList = exports.VirtualizedPropertyList;
// ─── Hook ─────────────────────────────────────────────────────────────────────
function useVirtualizedPropertyList(properties, viewMode, containerRef) {
    var _a = (0, react_1.useState)({ width: 1200, height: 600 }), dimensions = _a[0], setDimensions = _a[1];
    (0, react_1.useEffect)(function () {
        if (!(containerRef === null || containerRef === void 0 ? void 0 : containerRef.current))
            return;
        var updateDimensions = function () {
            if (!containerRef.current)
                return;
            var _a = containerRef.current.getBoundingClientRect(), width = _a.width, top = _a.top;
            setDimensions({
                width: width,
                height: Math.max(400, window.innerHeight - top - 100),
            });
        };
        var observer = new ResizeObserver(updateDimensions);
        observer.observe(containerRef.current);
        updateDimensions();
        return function () { return observer.disconnect(); };
    }, [containerRef]);
    var itemsPerRow = (0, react_1.useMemo)(function () {
        if (viewMode === "list")
            return 1;
        var available = Math.max(0, dimensions.width - 32);
        return Math.max(1, Math.min(6, Math.floor(available / 320)));
    }, [viewMode, dimensions.width]);
    return {
        dimensions: dimensions,
        itemsPerRow: itemsPerRow,
        isEmpty: properties.length === 0,
    };
}
