"use strict";
/**
 * Comprehensive Lazy Loading Components
 *
 * Strategic consolidation: This file combines basic lazy loading with advanced
 * performance optimization features including virtualization, infinite scroll,
 * and progressive image loading.
 *
 * Features:
 * - Basic lazy loading with intersection observer
 * - Virtualized lists for large datasets
 * - Infinite scroll implementation
 * - Progressive image loading
 * - Lazy route components
 * - Performance optimized rendering
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressiveImage = exports.LazyRoute = exports.LazyComponent = exports.LazyImage = void 0;
exports.VirtualizedList = VirtualizedList;
exports.InfiniteScroll = InfiniteScroll;
var react_1 = require("react");
var usePerformanceOptimization_1 = require("../hooks/usePerformanceOptimization");
var LoadingStates_1 = require("./LoadingStates");
var LazyImage = function (_a) {
    var src = _a.src, alt = _a.alt, _b = _a.className, className = _b === void 0 ? '' : _b, placeholder = _a.placeholder, onLoad = _a.onLoad, onError = _a.onError;
    var _c = (0, usePerformanceOptimization_1.useLazyLoading)({
        threshold: 0.1,
        rootMargin: '50px'
    }), elementRef = _c.elementRef, isVisible = _c.isVisible;
    var _d = react_1.default.useState(false), imageLoaded = _d[0], setImageLoaded = _d[1];
    var _e = react_1.default.useState(false), imageError = _e[0], setImageError = _e[1];
    var handleLoad = function () {
        setImageLoaded(true);
        onLoad === null || onLoad === void 0 ? void 0 : onLoad();
    };
    var handleError = function () {
        setImageError(true);
        onError === null || onError === void 0 ? void 0 : onError();
    };
    return (<div ref={elementRef} className={"relative ".concat(className)}>
      {!isVisible && (<div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (<img src={placeholder} alt={alt} className="opacity-50"/>) : (<div className="text-gray-400">Loading...</div>)}
        </div>)}
      
      {isVisible && (<>
          {!imageLoaded && !imageError && (<div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <LoadingStates_1.LoadingSpinner size="sm"/>
            </div>)}
          
          {imageError && (<div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500">
              Failed to load image
            </div>)}
          
          <img src={src} alt={alt} className={"transition-opacity duration-300 ".concat(imageLoaded ? 'opacity-100' : 'opacity-0')} onLoad={handleLoad} onError={handleError} loading="lazy"/>
        </>)}
    </div>);
};
exports.LazyImage = LazyImage;
var LazyComponent = function (_a) {
    var children = _a.children, _b = _a.fallback, fallback = _b === void 0 ? <LoadingStates_1.Skeleton className="h-32 w-full"/> : _b, _c = _a.threshold, threshold = _c === void 0 ? 0.1 : _c, _d = _a.rootMargin, rootMargin = _d === void 0 ? '100px' : _d;
    var _e = (0, usePerformanceOptimization_1.useLazyLoading)({
        threshold: threshold,
        rootMargin: rootMargin,
        triggerOnce: true
    }), elementRef = _e.elementRef, isVisible = _e.isVisible;
    return (<div ref={elementRef}>
      {isVisible ? children : fallback}
    </div>);
};
exports.LazyComponent = LazyComponent;
function VirtualizedList(_a) {
    var items = _a.items, itemHeight = _a.itemHeight, containerHeight = _a.containerHeight, renderItem = _a.renderItem, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.overscan, overscan = _c === void 0 ? 5 : _c;
    var _d = react_1.default.useState(0), scrollTop = _d[0], setScrollTop = _d[1];
    var startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    var endIndex = Math.min(items.length - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);
    var visibleItems = items.slice(startIndex, endIndex + 1);
    var totalHeight = items.length * itemHeight;
    var offsetY = startIndex * itemHeight;
    var handleScroll = function (event) {
        setScrollTop(event.currentTarget.scrollTop);
    };
    return (<div className={"overflow-auto ".concat(className)} style={{ height: containerHeight }} onScroll={handleScroll}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: "translateY(".concat(offsetY, "px)") }}>
          {visibleItems.map(function (item, index) { return (<div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>); })}
        </div>
      </div>
    </div>);
}
var LazyRoute = function (_a) {
    var component = _a.component, _b = _a.fallback, fallback = _b === void 0 ? <LoadingStates_1.LoadingSpinner size="lg"/> : _b, _c = _a.preload, preload = _c === void 0 ? false : _c;
    var LazyComponent = react_1.default.useMemo(function () { return (0, react_1.lazy)(component); }, [component]);
    var preloadScript = (0, usePerformanceOptimization_1.usePreloader)().preloadScript;
    react_1.default.useEffect(function () {
        if (preload) {
            // Preload the component
            component().catch(console.error);
        }
    }, [component, preload]);
    return (<react_1.Suspense fallback={fallback}>
      <LazyComponent />
    </react_1.Suspense>);
};
exports.LazyRoute = LazyRoute;
function InfiniteScroll(_a) {
    var _this = this;
    var items = _a.items, renderItem = _a.renderItem, loadMore = _a.loadMore, hasMore = _a.hasMore, isLoading = _a.isLoading, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.threshold, threshold = _c === void 0 ? 0.8 : _c;
    var _d = react_1.default.useState(false), isLoadingMore = _d[0], setIsLoadingMore = _d[1];
    var containerRef = react_1.default.useRef(null);
    var handleScroll = react_1.default.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var container, scrollTop, scrollHeight, clientHeight, scrollPercentage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    container = containerRef.current;
                    if (!container || isLoadingMore || !hasMore)
                        return [2 /*return*/];
                    scrollTop = container.scrollTop, scrollHeight = container.scrollHeight, clientHeight = container.clientHeight;
                    scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
                    if (!(scrollPercentage >= threshold)) return [3 /*break*/, 4];
                    setIsLoadingMore(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, loadMore()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    setIsLoadingMore(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [loadMore, hasMore, isLoadingMore, threshold]);
    react_1.default.useEffect(function () {
        var container = containerRef.current;
        if (!container)
            return;
        container.addEventListener('scroll', handleScroll);
        return function () { return container.removeEventListener('scroll', handleScroll); };
    }, [handleScroll]);
    return (<div ref={containerRef} className={"overflow-auto ".concat(className)}>
      {items.map(function (item, index) { return (<div key={index}>
          {renderItem(item, index)}
        </div>); })}
      
      {(isLoading || isLoadingMore) && (<div className="flex justify-center py-4">
          <LoadingStates_1.LoadingSpinner />
        </div>)}
      
      {!hasMore && items.length > 0 && (<div className="text-center py-4 text-gray-500">
          No more items to load
        </div>)}
    </div>);
}
var ProgressiveImage = function (_a) {
    var src = _a.src, placeholder = _a.placeholder, alt = _a.alt, _b = _a.className, className = _b === void 0 ? '' : _b;
    var _c = react_1.default.useState(false), imageLoaded = _c[0], setImageLoaded = _c[1];
    var _d = react_1.default.useState(placeholder), currentSrc = _d[0], setCurrentSrc = _d[1];
    react_1.default.useEffect(function () {
        var img = new Image();
        img.onload = function () {
            setCurrentSrc(src);
            setImageLoaded(true);
        };
        img.src = src;
    }, [src]);
    return (<div className={"relative overflow-hidden ".concat(className)}>
      <img src={currentSrc} alt={alt} className={"transition-all duration-300 ".concat(imageLoaded ? 'filter-none' : 'filter blur-sm scale-110')}/>
      
      {!imageLoaded && (<div className="absolute inset-0 bg-gray-200 animate-pulse"/>)}
    </div>);
};
exports.ProgressiveImage = ProgressiveImage;
