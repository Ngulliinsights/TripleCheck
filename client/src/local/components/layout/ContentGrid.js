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
exports.ContentGrid = ContentGrid;
var react_1 = require("react");
var utils_1 = require("@/local/lib/utils");
function ContentGrid(_a) {
    var children = _a.children, _b = _a.columns, columns = _b === void 0 ? 3 : _b, _c = _a.gap, gap = _c === void 0 ? '1.5rem' : _c, _d = _a.layout, layout = _d === void 0 ? 'grid' : _d, className = _a.className, _e = _a.minItemWidth, minItemWidth = _e === void 0 ? '300px' : _e, _f = _a.autoResize, autoResize = _f === void 0 ? true : _f;
    var gridRef = (0, react_1.useRef)(null);
    var _g = (0, react_1.useState)(columns), dynamicColumns = _g[0], setDynamicColumns = _g[1];
    (0, react_1.useEffect)(function () {
        if (!autoResize || !gridRef.current)
            return;
        var updateColumns = function () {
            if (gridRef.current) {
                var containerWidth = gridRef.current.offsetWidth;
                var minWidth = parseInt(minItemWidth);
                var gapWidth = parseInt(gap) || 24;
                // Calculate optimal columns based on container width
                var calculatedColumns = Math.max(1, Math.floor((containerWidth + gapWidth) / (minWidth + gapWidth)));
                setDynamicColumns(Math.min(calculatedColumns, columns));
            }
        };
        // Initial calculation
        updateColumns();
        // Throttled resize handler
        var resizeTimer;
        var handleResize = function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(updateColumns, 150);
        };
        window.addEventListener('resize', handleResize);
        return function () {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
        };
    }, [columns, minItemWidth, gap, autoResize]);
    var getGridStyles = function () {
        var baseStyles = {
            gap: gap,
            gridTemplateColumns: "repeat(".concat(dynamicColumns, ", 1fr)")
        };
        switch (layout) {
            case 'masonry':
                return __assign(__assign({}, baseStyles), { display: 'grid', gridAutoRows: 'masonry', alignItems: 'start' });
            case 'asymmetric':
                return __assign(__assign({}, baseStyles), { display: 'grid', gridAutoRows: 'min-content', gridTemplateColumns: dynamicColumns === 1
                        ? '1fr'
                        : dynamicColumns === 2
                            ? '1.5fr 1fr'
                            : '2fr 1fr 1.5fr' });
            default: // 'grid'
                return __assign(__assign({}, baseStyles), { display: 'grid', gridAutoRows: '1fr', alignItems: 'stretch' });
        }
    };
    // Masonry fallback for browsers that don't support CSS Grid masonry
    (0, react_1.useEffect)(function () {
        if (layout !== 'masonry' || !gridRef.current)
            return function () { };
        var grid = gridRef.current;
        var items = Array.from(grid.children);
        // Check if browser supports masonry
        var supportsGridMasonry = CSS.supports('grid-template-rows', 'masonry');
        if (!supportsGridMasonry) {
            // Implement JavaScript masonry fallback
            var resizeObserver_1 = new ResizeObserver(function () {
                var columnHeights = new Array(dynamicColumns).fill(0);
                var gapValue = parseInt(gap) || 24;
                items.forEach(function (item, index) {
                    if (index < dynamicColumns) {
                        // First row
                        item.style.gridColumn = "".concat(index + 1);
                        item.style.gridRow = '1';
                    }
                    else {
                        // Find shortest column
                        var shortestColumnIndex = columnHeights.indexOf(Math.min.apply(Math, columnHeights));
                        item.style.gridColumn = "".concat(shortestColumnIndex + 1);
                        var itemHeight = item.offsetHeight;
                        columnHeights[shortestColumnIndex] += itemHeight + gapValue;
                    }
                });
            });
            items.forEach(function (item) { return resizeObserver_1.observe(item); });
            return function () { return resizeObserver_1.disconnect(); };
        }
        return function () { }; // Return empty cleanup function when masonry is supported
    }, [layout, dynamicColumns, gap]);
    return (<div ref={gridRef} className={(0, utils_1.cn)('w-full', className)} style={getGridStyles()}>
      {children}
    </div>);
}
