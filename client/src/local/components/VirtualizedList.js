"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridVirtualizedList = exports.EnterpriseVirtualizedList = void 0;
var react_1 = require("react");
var react_window_1 = require("react-window");
// Styles are now consolidated in design-system.css
// CSS classes are now consolidated in design-system.css
/* -------------------------------------------------------------------------- */
/*                               Constants                                    */
/* -------------------------------------------------------------------------- */
var CSS_CUSTOM_PROPERTIES = {
    ITEM_WIDTH: "--item-width",
    ITEM_HEIGHT: "--item-height",
    GRID_GAP: "--grid-gap",
};
var CSS_CLASSES = {
    DYNAMIC_WIDTH: "dynamic-width",
    DYNAMIC_HEIGHT: "dynamic-height",
    GRID_ITEM: "grid-item",
    EMPTY_ITEM: "empty-item",
    ERROR_ITEM: "error-item",
    GRID_ITEM_WRAPPER: "grid-item-wrapper",
    FALLBACK_ITEM: "fallback-item",
    LOADING_CONTAINER: "loading-container",
    EMPTY_CONTAINER: "empty-container",
    VIRTUALIZED_CONTAINER: "virtualized-container",
    GRID_ROW_CONTAINER: "grid-row-container",
    GRID_ROW: "grid-row",
    DYNAMIC_GAP: "dynamic-gap",
    GRID_CONTAINER: "grid-container",
};
// Enhanced memoized row with consistent return type and better error boundaries
var MemoizedRow = (0, react_1.memo)(function (_a) {
    var _b;
    var index = _a.index, style = _a.style, data = _a.data;
    var items = data.items, renderItem = data.renderItem;
    // Create a fallback div element for all error cases to ensure consistent return type
    var fallbackElement = (<div style={style} className={CSS_CLASSES.FALLBACK_ITEM} data-testid={"fallback-item-".concat(index)}/>);
    // Early return for invalid indices - consistent ReactNode return type
    if (index < 0 || index >= items.length) {
        return fallbackElement;
    }
    // Safe array access using bracket notation instead of object injection pattern
    var item = (_b = items[index]) !== null && _b !== void 0 ? _b : null;
    // Use null check instead of undefined for better performance
    if (item == null) {
        return fallbackElement;
    }
    // Wrap in try-catch to prevent render crashes from propagating
    try {
        var renderedItem = renderItem(item, index, style);
        // Ensure we always return a ReactElement, never undefined
        if (react_1.default.isValidElement(renderedItem)) {
            return renderedItem;
        }
        return fallbackElement;
    }
    catch (error) {
        // Use structured logging instead of console.warn for production environments
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.warn("Failed to render item at index ".concat(index, ":"), error);
        }
        return (<div style={style} className={CSS_CLASSES.ERROR_ITEM}>
        Error rendering item
      </div>);
    }
});
MemoizedRow.displayName = "VirtualizedRow";
/* -------------------------------------------------------------------------- */
/*                    Optimized Debounce Hook                                 */
/* -------------------------------------------------------------------------- */
// Enhanced debounce hook with cleanup on unmount and better memory management
function useDebounceCallback(callback, delay) {
    var timeoutRef = (0, react_1.useRef)();
    var callbackRef = (0, react_1.useRef)(callback);
    // Keep callback reference fresh without recreating the debounced function
    (0, react_1.useEffect)(function () {
        callbackRef.current = callback;
    }, [callback]);
    var debouncedCallback = (0, react_1.useCallback)(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(function () {
            callbackRef.current.apply(callbackRef, args);
        }, delay);
    }, [delay] // Only depend on delay, not callback
    );
    var cancel = (0, react_1.useCallback)(function () {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }
    }, []);
    // Cleanup on unmount
    (0, react_1.useEffect)(function () {
        return function () {
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
/* -------------------------------------------------------------------------- */
/*                  EnterpriseVirtualizedList Component                       */
/* -------------------------------------------------------------------------- */
function EnterpriseVirtualizedListInner(props, ref) {
    var items = props.items, itemHeight = props.itemHeight, _a = props.estimatedItemHeight, estimatedItemHeight = _a === void 0 ? 50 : _a, containerHeight = props.containerHeight, _b = props.containerWidth, containerWidth = _b === void 0 ? "100%" : _b, renderItem = props.renderItem, keyExtractor = props.keyExtractor, _c = props.overscanCount, overscanCount = _c === void 0 ? 5 : _c, // cspell:disable-line
    onScroll = props.onScroll, onEndReached = props.onEndReached, _d = props.onEndReachedThreshold, onEndReachedThreshold = _d === void 0 ? 0.8 : _d, _e = props.loading, loading = _e === void 0 ? false : _e, loadingComponent = props.loadingComponent, emptyComponent = props.emptyComponent, header = props.header, footer = props.footer, className = props.className, innerClassName = props.innerClassName, scrollToIndex = props.scrollToIndex, _f = props.scrollToAlignment, scrollToAlignment = _f === void 0 ? "auto" : _f, forwardedOuterRef = props.outerRef, itemData = props.itemData, _g = props.debounceMs, debounceMs = _g === void 0 ? 150 : _g;
    var variableListRef = (0, react_1.useRef)(null);
    var fixedListRef = (0, react_1.useRef)(null);
    var outerRef = (0, react_1.useRef)(null);
    var scrollTopRef = (0, react_1.useRef)(0);
    var lastEndReachedCall = (0, react_1.useRef)(0);
    var endReachedTriggered = (0, react_1.useRef)(false);
    var isVariableSize = typeof itemHeight === "function";
    // Memoize total size calculation for better performance
    var calculateTotalSize = (0, react_1.useCallback)(function () {
        if (isVariableSize && typeof itemHeight === "function") {
            var total = 0;
            // Use cached calculation if items haven't changed
            for (var i = 0; i < items.length; i += 1) {
                total += itemHeight(i);
            }
            return total;
        }
        var height = typeof itemHeight === "number" ? itemHeight : estimatedItemHeight;
        return items.length * height;
    }, [items.length, itemHeight, estimatedItemHeight, isVariableSize]);
    // Memoize the total size to avoid recalculation on every scroll
    var totalSize = (0, react_1.useMemo)(function () { return calculateTotalSize(); }, [calculateTotalSize]);
    (0, react_1.useImperativeHandle)(ref, function () { return ({
        scrollToItem: function (idx, align) {
            if (align === void 0) { align = "auto"; }
            if (idx >= 0 && idx < items.length) {
                var list = isVariableSize ? variableListRef.current : fixedListRef.current;
                list === null || list === void 0 ? void 0 : list.scrollToItem(idx, align);
            }
        },
        scrollToTop: function () {
            var list = isVariableSize ? variableListRef.current : fixedListRef.current;
            list === null || list === void 0 ? void 0 : list.scrollToItem(0, "start");
        },
        recompute: function () {
            var _a;
            (_a = variableListRef.current) === null || _a === void 0 ? void 0 : _a.resetAfterIndex(0, true);
        },
        getScrollOffset: function () { return scrollTopRef.current; },
        getTotalSize: function () { return totalSize; },
    }); }, [items.length, totalSize, isVariableSize]);
    // Optimized scroll handler with better end-reached detection
    var handleScroll = (0, react_1.useCallback)(function (scrollProps) {
        var _a, _b;
        var scrollOffset = scrollProps.scrollOffset, scrollUpdateWasRequested = scrollProps.scrollUpdateWasRequested;
        scrollTopRef.current = scrollOffset;
        // Only trigger end-reached for user-initiated scrolls
        if (!scrollUpdateWasRequested && onEndReached) {
            var now = Date.now();
            // Throttle end-reached calls more efficiently
            if (now - lastEndReachedCall.current > 500) {
                var viewportHeight = (_b = (_a = outerRef.current) === null || _a === void 0 ? void 0 : _a.clientHeight) !== null && _b !== void 0 ? _b : 0;
                var ratio = (scrollOffset + viewportHeight) / totalSize;
                if (ratio >= onEndReachedThreshold && !endReachedTriggered.current) {
                    endReachedTriggered.current = true;
                    lastEndReachedCall.current = now;
                    onEndReached();
                }
                else if (ratio < onEndReachedThreshold - 0.1) {
                    // Add hysteresis to prevent flapping
                    endReachedTriggered.current = false;
                }
            }
        }
    }, [onEndReached, onEndReachedThreshold, totalSize]);
    // Improved debounced scroll callback
    var debouncedOnScroll = useDebounceCallback(function (scrollTop) {
        onScroll === null || onScroll === void 0 ? void 0 : onScroll(scrollTop);
    }, debounceMs)[0];
    // Only call debounced scroll when scroll position actually changes
    (0, react_1.useEffect)(function () {
        if (onScroll) {
            debouncedOnScroll(scrollTopRef.current);
        }
    }, [debouncedOnScroll, onScroll]);
    // Optimized item key extraction with better fallback and consistent return type
    var itemKey = (0, react_1.useCallback)(function (index) {
        var _a;
        if (index >= 0 && index < items.length && Array.isArray(items)) {
            // Safe array access using bracket notation
            var item = (_a = items[index]) !== null && _a !== void 0 ? _a : null;
            if (item != null) {
                try {
                    var key = keyExtractor(item, index);
                    // Ensure we always return a valid React.Key
                    return key !== null && key !== void 0 ? key : "fallback-".concat(index);
                }
                catch (error) {
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.warn("Key extraction failed for index ".concat(index, ":"), error);
                    }
                    return "fallback-".concat(index);
                }
            }
        }
        return "fallback-".concat(index);
    }, [items, keyExtractor]);
    // Stable memoized item data to prevent unnecessary re-renders
    var memoizedItemData = (0, react_1.useMemo)(function () { return ({
        items: items,
        renderItem: renderItem,
        itemData: itemData,
    }); }, [items, renderItem, itemData]);
    // Enhanced outer ref handling with reduced complexity
    var combinedOuterRef = (0, react_1.useCallback)(function (node) {
        // This assignment is always safe - it's our own ref
        outerRef.current = node;
        // Handle the forwarded ref safely with proper type checking
        if (forwardedOuterRef) {
            if (typeof forwardedOuterRef === "function") {
                // Function refs are always safe to call
                forwardedOuterRef(node);
            }
            else if (forwardedOuterRef &&
                typeof forwardedOuterRef === "object" &&
                "current" in forwardedOuterRef) {
                try {
                    // Check if the current property is writable before attempting assignment
                    var descriptor = Object.getOwnPropertyDescriptor(forwardedOuterRef, "current");
                    if (!descriptor || descriptor.writable !== false) {
                        // Safe assignment with explicit type assertion after validation
                        forwardedOuterRef.current = node;
                    }
                }
                catch (error) {
                    // Graceful fallback if ref assignment fails
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.warn("Failed to assign forwarded outer ref:", error);
                    }
                }
            }
        }
    }, [forwardedOuterRef]);
    // Optimized scroll-to-index effect with validation
    (0, react_1.useEffect)(function () {
        if (scrollToIndex !== undefined &&
            scrollToIndex >= 0 &&
            scrollToIndex < items.length) {
            // Use setTimeout as a cross-platform alternative to requestAnimationFrame
            var timeoutId_1 = setTimeout(function () {
                var list = isVariableSize ? variableListRef.current : fixedListRef.current;
                list === null || list === void 0 ? void 0 : list.scrollToItem(scrollToIndex, scrollToAlignment);
            }, 0);
            return function () { return clearTimeout(timeoutId_1); };
        }
        return undefined;
    }, [scrollToIndex, scrollToAlignment, items.length, isVariableSize]);
    // Always call useMemo at the top level to avoid conditional hook calls
    var commonProps = (0, react_1.useMemo)(function () { return ({
        outerRef: combinedOuterRef,
        height: containerHeight,
        width: containerWidth,
        itemCount: items.length,
        itemKey: itemKey,
        itemData: memoizedItemData,
        overscanCount: overscanCount,
        onScroll: handleScroll,
        className: innerClassName,
        children: MemoizedRow,
    }); }, [
        combinedOuterRef,
        containerHeight,
        containerWidth,
        items.length,
        itemKey,
        memoizedItemData,
        overscanCount,
        handleScroll,
        innerClassName,
    ]);
    // Early returns for loading and empty states - ensure consistent ReactNode return
    if (loading && loadingComponent) {
        return (<div className={"".concat(CSS_CLASSES.LOADING_CONTAINER, " ").concat(className || "")} data-testid="loading-container">
        {loadingComponent}
      </div>);
    }
    if (!loading && items.length === 0 && emptyComponent) {
        return (<div className={"".concat(CSS_CLASSES.EMPTY_CONTAINER, " ").concat(className || "")} data-testid="empty-container">
        {emptyComponent}
      </div>);
    }
    return (<div className={"".concat(CSS_CLASSES.VIRTUALIZED_CONTAINER, " ").concat(className || "")} data-testid="virtualized-container">
      {header}
      {isVariableSize ?
            <react_window_1.VariableSizeList {...commonProps} ref={variableListRef} itemSize={itemHeight} estimatedItemSize={estimatedItemHeight}/>
            : <react_window_1.FixedSizeList {...commonProps} ref={fixedListRef} itemSize={itemHeight}/>}
      {footer}
    </div>);
}
/* -------------------------------------------------------------------------- */
/*                          Forward Ref With Generics                         */
/* -------------------------------------------------------------------------- */
exports.EnterpriseVirtualizedList = (0, react_1.forwardRef)(EnterpriseVirtualizedListInner);
// Memoized grid styles to prevent recreation
var createGridStyles = function (itemWidth, itemHeight, gap) {
    var _a;
    var rowStyle = {
        gap: "".concat(gap, "px"),
        height: itemHeight,
    };
    var itemStyle = (_a = {
            width: itemWidth,
            height: itemHeight
        },
        _a[CSS_CUSTOM_PROPERTIES.ITEM_WIDTH] = "".concat(itemWidth, "px"),
        _a[CSS_CUSTOM_PROPERTIES.ITEM_HEIGHT] = "".concat(itemHeight, "px"),
        _a);
    return { row: rowStyle, item: itemStyle };
};
function GridVirtualizedListInner(props, ref) {
    var items = props.items, itemWidth = props.itemWidth, itemHeight = props.itemHeight, containerWidth = props.containerWidth, containerHeight = props.containerHeight, renderItem = props.renderItem, keyExtractor = props.keyExtractor, _a = props.gap, gap = _a === void 0 ? 16 : _a, _b = props.overscanCount, overscanCount = _b === void 0 ? 1 : _b, // cspell:disable-line
    onScroll = props.onScroll, onEndReached = props.onEndReached, _c = props.onEndReachedThreshold, onEndReachedThreshold = _c === void 0 ? 0.8 : _c, _d = props.loading, loading = _d === void 0 ? false : _d, loadingComponent = props.loadingComponent, emptyComponent = props.emptyComponent, className = props.className;
    var listRef = (0, react_1.useRef)(null);
    var scrollTopRef = (0, react_1.useRef)(0);
    // Memoize grid calculations
    var gridConfig = (0, react_1.useMemo)(function () {
        var columnsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
        var rowCount = Math.ceil(items.length / columnsPerRow);
        var rowHeight = itemHeight + gap;
        var gridStyles = createGridStyles(itemWidth, itemHeight, gap);
        return { columnsPerRow: columnsPerRow, rowCount: rowCount, rowHeight: rowHeight, styles: gridStyles };
    }, [containerWidth, itemWidth, itemHeight, gap, items.length]);
    (0, react_1.useImperativeHandle)(ref, function () { return ({
        scrollToItem: function (index, align) {
            if (align === void 0) { align = "auto"; }
            var rowIndex = Math.floor(index / gridConfig.columnsPerRow);
            if (listRef.current &&
                rowIndex >= 0 &&
                rowIndex < gridConfig.rowCount) {
                listRef.current.scrollToItem(rowIndex, align);
            }
        },
        scrollToTop: function () { var _a; return (_a = listRef.current) === null || _a === void 0 ? void 0 : _a.scrollToItem(0, "start"); },
        getScrollOffset: function () { return scrollTopRef.current; },
    }); }, [gridConfig.columnsPerRow, gridConfig.rowCount]);
    // Helper function to render individual grid items with better type safety
    var renderGridItem = (0, react_1.useCallback)(function (itemIndex, endIndex, createItemStyleWithVars, emptyItemClasses, errorItemClasses, wrapperItemClasses) {
        var _a;
        if (itemIndex > endIndex) {
            return (<div key={"empty-".concat(itemIndex)} style={createItemStyleWithVars()} className={emptyItemClasses} data-testid={"grid-empty-item-".concat(itemIndex)}/>);
        }
        // Safe array access using bracket notation
        var item = (_a = items[itemIndex]) !== null && _a !== void 0 ? _a : null;
        if (item == null) {
            return (<div key={"empty-".concat(itemIndex)} style={createItemStyleWithVars()} className={emptyItemClasses} data-testid={"grid-empty-item-".concat(itemIndex)}/>);
        }
        try {
            var itemStyleWithVars = createItemStyleWithVars();
            var renderedItem = renderItem(item, itemIndex, itemStyleWithVars);
            return (<div key={keyExtractor(item, itemIndex)} style={itemStyleWithVars} className={wrapperItemClasses} data-testid={"grid-item-".concat(itemIndex)}>
            {renderedItem}
          </div>);
        }
        catch (error) {
            if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.warn("Failed to render grid item at index ".concat(itemIndex, ":"), error);
            }
            return (<div key={"error-".concat(itemIndex)} style={createItemStyleWithVars()} className={errorItemClasses} data-testid={"grid-error-item-".concat(itemIndex)}>
            Error rendering item
          </div>);
        }
    }, [items, renderItem, keyExtractor]);
    // Memoized row renderer for better performance with consistent return type
    var renderRow = (0, react_1.useCallback)(function (_a) {
        var _b, _c;
        var rowIndex = _a.index, style = _a.style;
        var columnsPerRow = gridConfig.columnsPerRow, gridStyles = gridConfig.styles;
        var startIndex = rowIndex * columnsPerRow;
        var endIndex = Math.min(startIndex + columnsPerRow - 1, items.length - 1);
        var rowStyleWithVars = __assign(__assign({}, style), (_b = {}, _b[CSS_CUSTOM_PROPERTIES.GRID_GAP] = "".concat(gap, "px"), _b[CSS_CUSTOM_PROPERTIES.ITEM_HEIGHT] = "".concat(itemHeight, "px"), _b));
        var gridRowStyleWithVars = __assign(__assign({}, gridStyles.row), (_c = {}, _c[CSS_CUSTOM_PROPERTIES.GRID_GAP] = "".concat(gap, "px"), _c));
        // Create reusable item style with CSS custom properties
        var createItemStyleWithVars = function () {
            var _a;
            return (__assign(__assign({}, gridStyles.item), (_a = {}, _a[CSS_CUSTOM_PROPERTIES.ITEM_WIDTH] = "".concat(itemWidth, "px"), _a[CSS_CUSTOM_PROPERTIES.ITEM_HEIGHT] = "".concat(itemHeight, "px"), _a)));
        };
        // Create reusable class names
        var baseItemClasses = "".concat(CSS_CLASSES.GRID_ITEM, " ").concat(CSS_CLASSES.DYNAMIC_WIDTH, " ").concat(CSS_CLASSES.DYNAMIC_HEIGHT);
        var emptyItemClasses = "".concat(baseItemClasses, " ").concat(CSS_CLASSES.EMPTY_ITEM);
        var errorItemClasses = "".concat(baseItemClasses, " ").concat(CSS_CLASSES.ERROR_ITEM);
        var wrapperItemClasses = "".concat(baseItemClasses, " ").concat(CSS_CLASSES.GRID_ITEM_WRAPPER);
        return (<div style={rowStyleWithVars} className={CSS_CLASSES.GRID_ROW_CONTAINER} data-testid={"grid-row-".concat(rowIndex)}>
          <div style={gridRowStyleWithVars} className={"".concat(CSS_CLASSES.GRID_ROW, " ").concat(CSS_CLASSES.DYNAMIC_GAP)}>
            {Array.from({ length: columnsPerRow }, function (_, columnIndex) {
                var itemIndex = startIndex + columnIndex;
                return renderGridItem(itemIndex, endIndex, createItemStyleWithVars, emptyItemClasses, errorItemClasses, wrapperItemClasses);
            })}
          </div>
        </div>);
    }, [gridConfig, gap, itemHeight, itemWidth, renderGridItem]);
    // Enhanced scroll handler with end-reached detection
    var handleScroll = (0, react_1.useCallback)(function (scrollProps) {
        var scrollOffset = scrollProps.scrollOffset;
        scrollTopRef.current = scrollOffset;
        onScroll === null || onScroll === void 0 ? void 0 : onScroll(scrollOffset);
        if (onEndReached) {
            var totalHeight = gridConfig.rowCount * gridConfig.rowHeight;
            var ratio = (scrollOffset + containerHeight) / totalHeight;
            if (ratio >= onEndReachedThreshold) {
                onEndReached();
            }
        }
    }, [onScroll, onEndReached, onEndReachedThreshold, gridConfig, containerHeight]);
    if (loading && loadingComponent) {
        return (<div className={"".concat(CSS_CLASSES.LOADING_CONTAINER, " ").concat(className || "")} data-testid="grid-loading-container">
        {loadingComponent}
      </div>);
    }
    if (!loading && items.length === 0 && emptyComponent) {
        return (<div className={"".concat(CSS_CLASSES.EMPTY_CONTAINER, " ").concat(className || "")} data-testid="grid-empty-container">
        {emptyComponent}
      </div>);
    }
    return (<div className={"".concat(CSS_CLASSES.GRID_CONTAINER, " ").concat(className || "")} data-testid="grid-container">
      <react_window_1.FixedSizeList ref={listRef} height={containerHeight} width={containerWidth} itemCount={gridConfig.rowCount} itemSize={gridConfig.rowHeight} overscanCount={overscanCount} // cspell:disable-line
     onScroll={handleScroll}>
        {renderRow}
      </react_window_1.FixedSizeList>
    </div>);
}
exports.GridVirtualizedList = (0, react_1.forwardRef)(GridVirtualizedListInner);
