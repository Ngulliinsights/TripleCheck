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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyListingPage = PropertyListingPage;
var react_query_1 = require("@tanstack/react-query");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var useDebounce_1 = require("../../hooks/useDebounce");
var useFilterState_1 = require("../../hooks/useFilterState");
var VirtualizedPropertyList_1 = require("../VirtualizedPropertyList");
var Pagination_1 = require("../Pagination");
var button_1 = require("../ui/button");
var card_1 = require("../ui/card");
var collapsible_1 = require("../ui/collapsible");
var input_1 = require("../ui/input");
var skeleton_1 = require("../ui/skeleton");
var PropertySkeletonGrid_1 = require("./PropertySkeletonGrid");
/**
 * Generic property listing page component
 * Provides consistent layout and functionality across all property types
 */
function PropertyListingPage(_a) {
    var _this = this;
    var config = _a.config, _b = _a.className, className = _b === void 0 ? "" : _b, _c = _a.enableCompare, _enableCompare = _c === void 0 ? true : _c, _d = _a.enablePhotoManagement, _enablePhotoManagement = _d === void 0 ? true : _d, heroConfig = _a.heroConfig;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var containerRef = (0, react_1.useRef)(null);
    // State management
    var _e = (0, react_1.useState)("grid"), viewMode = _e[0], setViewMode = _e[1];
    var _f = (0, react_1.useState)("newest"), sortBy = _f[0], setSortBy = _f[1];
    var _g = (0, react_1.useState)(1), currentPage = _g[0], setCurrentPage = _g[1];
    var _h = (0, react_1.useState)(false), showFilters = _h[0], setShowFilters = _h[1];
    var _j = (0, react_1.useState)(false), useVirtualization = _j[0], setUseVirtualization = _j[1];
    // Search state with debouncing
    var _k = (0, react_1.useState)(""), searchQuery = _k[0], setSearchQuery = _k[1];
    var _l = (0, react_1.useState)(""), locationQuery = _l[0], setLocationQuery = _l[1];
    var debouncedSearchQuery = (0, useDebounce_1.useDebounce)(searchQuery, 300);
    var debouncedLocationQuery = (0, useDebounce_1.useDebounce)(locationQuery, 300);
    // Filter state management
    var _m = (0, useFilterState_1.useFilterState)({
        defaultFilters: config.defaultFilters,
        debounceMs: 300,
        syncWithUrl: true,
    }), filters = _m.filters, setFilters = _m.setFilters, updateFilter = _m.updateFilter, resetFilters = _m.reset, debouncedFilters = _m.debouncedFilters, filtersValid = _m.isValid, hasActiveFilters = _m.hasActiveFilters;
    // Simple clear filter function
    var clearFilter = (0, react_1.useCallback)(function (key) {
        var _a, _b;
        var clearedFilters = __assign({}, filters);
        var keyStr = String(key);
        if (keyStr === "query" || keyStr === "location") {
            // Use safe property assignment
            Object.assign(clearedFilters, (_a = {}, _a[keyStr] = "", _a));
            // Also clear local search state
            if (keyStr === "query")
                setSearchQuery("");
            if (keyStr === "location")
                setLocationQuery("");
        }
        else {
            // Use safe property assignment
            Object.assign(clearedFilters, (_b = {}, _b[keyStr] = null, _b));
        }
        setFilters(clearedFilters);
    }, [filters, setFilters]);
    // Enhanced search parameters combining filters with debounced search
    var searchParams = (0, react_1.useMemo)(function () {
        var params = __assign(__assign({}, debouncedFilters), { page: currentPage, pageSize: 12, sortBy: sortBy });
        // Override with debounced search queries
        if (debouncedSearchQuery) {
            params.query = debouncedSearchQuery;
        }
        if (debouncedLocationQuery) {
            params.location = debouncedLocationQuery;
        }
        return params;
    }, [
        debouncedFilters,
        currentPage,
        sortBy,
        debouncedSearchQuery,
        debouncedLocationQuery,
    ]);
    // Data fetching using React Query with the configuration's fetcher function
    var _o = (0, react_query_1.useQuery)({
        queryKey: __spreadArray(__spreadArray([], config.queryKey, true), [searchParams], false),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var page, pageSize, filters, filtersObj, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (process.env.NODE_ENV === "development") {
                            // eslint-disable-next-line no-console
                            console.log("🔍 Fetching properties with params:", searchParams);
                        }
                        page = searchParams.page || 1;
                        pageSize = searchParams.pageSize || 12;
                        filters = __assign({}, searchParams);
                        filtersObj = filters;
                        delete filtersObj.page;
                        delete filtersObj.pageSize;
                        delete filtersObj.sortBy;
                        if (process.env.NODE_ENV === "development") {
                            // eslint-disable-next-line no-console
                            console.log("📋 Calling fetcher with filters:", filters, "page:", page, "pageSize:", pageSize);
                        }
                        return [4 /*yield*/, config.fetcher(filters, page, pageSize)];
                    case 1:
                        result = _a.sent();
                        if (process.env.NODE_ENV === "development") {
                            // eslint-disable-next-line no-console
                            console.log("✅ Fetcher result:", result);
                        }
                        return [2 /*return*/, result]; // Return the full result object
                }
            });
        }); },
        enabled: filtersValid,
        staleTime: 30000, // 30 seconds cache
    }), propertiesResult = _o.data, isLoading = _o.isLoading, error = _o.error, refetch = _o.refetch, isRefetching = _o.isRefetching;
    // Mock the additional properties that were expected from useSafePropertiesQuery
    var hasValidData = !!(propertiesResult === null || propertiesResult === void 0 ? void 0 : propertiesResult.items);
    var requestStats = null;
    // Extract data properties with safe defaults
    var items = (0, react_1.useMemo)(function () {
        var result = (propertiesResult === null || propertiesResult === void 0 ? void 0 : propertiesResult.items) || [];
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log("📊 Items extracted:", result.length, "items");
        }
        return result;
    }, [propertiesResult]);
    var totalCount = (0, react_1.useMemo)(function () {
        var count = (propertiesResult === null || propertiesResult === void 0 ? void 0 : propertiesResult.totalCount) || 0;
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log("📈 Total count:", count);
        }
        return count;
    }, [propertiesResult]);
    var totalPages = (propertiesResult === null || propertiesResult === void 0 ? void 0 : propertiesResult.totalPages) || Math.ceil(totalCount / 12);
    var isEmpty = items.length === 0;
    var isError = !!error;
    var isFetching = isLoading || isRefetching;
    // Determine if virtualization should be used (1000+ items)
    var shouldUseVirtualization = totalCount >= 1000 || useVirtualization;
    // Pagination function
    var setPage = (0, react_1.useCallback)(function (page) {
        setCurrentPage(page);
    }, []);
    // Adapt properties to normalized format with enhanced memoization
    var normalizedProperties = (0, react_1.useMemo)(function () {
        if (!items || !Array.isArray(items)) {
            return [];
        }
        return items.map(function (item) { return config.adapter(item); });
    }, [items, config]); // Include full config to satisfy dependency
    // Virtualized list hook
    var _p = (0, VirtualizedPropertyList_1.useVirtualizedPropertyList)(normalizedProperties, viewMode, containerRef), dimensions = _p.dimensions, itemsPerRow = _p.itemsPerRow;
    // Event handlers - removed unused handleFilterChange
    var handleSortChange = (0, react_1.useCallback)(function (newSortBy) {
        setSortBy(newSortBy);
        setCurrentPage(1);
    }, []);
    var handlePropertyClick = (0, react_1.useCallback)(function (property) {
        // All properties (including land) now use the unified /property/:id route
        // The PropertyDetails component handles different property types internally
        var route = "/property/".concat(property.id);
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log("🔗 Navigating to property:", {
                propertyId: property.id,
                propertyTitle: property.title,
                propertyCategory: property.category,
                route: route,
            });
        }
        navigate(route);
    }, [navigate]);
    var handleViewModeChange = (0, react_1.useCallback)(function (mode) {
        setViewMode(mode);
    }, []);
    var handleSearchSubmit = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        refetch();
    }, [refetch]);
    var toggleFilters = (0, react_1.useCallback)(function () {
        setShowFilters(function (prev) { return !prev; });
    }, []);
    var toggleVirtualization = (0, react_1.useCallback)(function () {
        setUseVirtualization(function (prev) { return !prev; });
    }, []);
    // Enhanced reset function that clears all state
    var handleResetFilters = (0, react_1.useCallback)(function () {
        resetFilters();
        setSearchQuery("");
        setLocationQuery("");
        setCurrentPage(1);
    }, [resetFilters]);
    return (<div className={"min-h-screen bg-background ".concat(className)}>
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
              {(heroConfig === null || heroConfig === void 0 ? void 0 : heroConfig.title) || config.title}
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              {(heroConfig === null || heroConfig === void 0 ? void 0 : heroConfig.subtitle) || config.description}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <card_1.Card className="p-6 border-muted/60 shadow-sm backdrop-blur-sm bg-card/80">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                    <input_1.Input type="text" placeholder="Search properties..." value={searchQuery} onChange={function (e) {
            setSearchQuery(e.target.value);
            updateFilter("query", e.target.value);
        }} className="pl-10"/>
                  </div>
                  <div className="relative">
                    <input_1.Input type="text" placeholder="Location" value={locationQuery} onChange={function (e) {
            setLocationQuery(e.target.value);
            updateFilter("location", e.target.value);
        }}/>
                  </div>
                  <div className="flex gap-2">
                    <button_1.Button type="submit" className="flex-1" disabled={isLoading}>
                      <lucide_react_1.Search className="w-4 h-4 mr-2"/>
                      {isLoading ? "Searching..." : "Search"}
                    </button_1.Button>
                  </div>
                </div>
              </form>
            </card_1.Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">
                {config.title}
                {!isLoading && totalCount > 0 && (<span className="ml-2 text-lg font-normal text-muted-foreground">
                    ({totalCount.toLocaleString()} properties)
                  </span>)}
              </h2>
              {shouldUseVirtualization && (<div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"/>
                  Virtualized View
                </div>)}
              {process.env.NODE_ENV === "development" && requestStats && (<div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"/>
                  Debug info
                </div>)}
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Toggle */}
              <button_1.Button variant={showFilters ? "default" : "outline"} size="sm" onClick={toggleFilters} className="flex items-center gap-2">
                <lucide_react_1.Filter className="w-4 h-4"/>
                Filters
                {hasActiveFilters && (<span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                    {Object.values(filters).filter(function (v) {
                return v !== "" &&
                    v !== null &&
                    v !== false &&
                    (!Array.isArray(v) || v.length > 0);
            }).length}
                  </span>)}
              </button_1.Button>

              {/* Virtualization Toggle (for testing/performance) */}
              {totalCount >= 500 && (<button_1.Button variant={useVirtualization ? "default" : "outline"} size="sm" onClick={toggleVirtualization} title="Toggle virtualization for better performance with large datasets">
                  {useVirtualization ? "Virtual" : "Standard"}
                </button_1.Button>)}

              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <button_1.Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={function () { return handleViewModeChange("grid"); }} className="px-3">
                  <lucide_react_1.Grid className="w-4 h-4"/>
                </button_1.Button>
                <button_1.Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={function () { return handleViewModeChange("list"); }} className="px-3">
                  <lucide_react_1.List className="w-4 h-4"/>
                </button_1.Button>
              </div>

              {/* Sort Dropdown */}
              <select value={sortBy} onChange={function (e) { return handleSortChange(e.target.value); }} className="px-3 py-2 border border-input rounded-md bg-background text-sm" aria-label="Sort properties by">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="views">Most Viewed</option>
              </select>
            </div>
          </div>

          {/* Filters Section */}
          <collapsible_1.Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <collapsible_1.CollapsibleContent className="space-y-4">
              <card_1.Card className="border-muted/60">
                <card_1.CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <lucide_react_1.Filter className="w-5 h-5"/>
                      Property Filters
                    </h3>
                    <button_1.Button variant="ghost" size="sm" onClick={toggleFilters} className="text-muted-foreground">
                      <lucide_react_1.X className="w-4 h-4"/>
                    </button_1.Button>
                  </div>

                  {/* Render the appropriate filter component */}
                  <react_1.default.Suspense fallback={<div className="space-y-4">
                        <skeleton_1.Skeleton className="h-10 w-full"/>
                        <skeleton_1.Skeleton className="h-10 w-full"/>
                        <skeleton_1.Skeleton className="h-20 w-full"/>
                      </div>}>
                    <config.filterComponent filters={filters} onChange={function (newFilters) {
            return setFilters(newFilters);
        }} onReset={handleResetFilters} errors={{}}/>
                  </react_1.default.Suspense>
                </card_1.CardContent>
              </card_1.Card>
            </collapsible_1.CollapsibleContent>
          </collapsible_1.Collapsible>

          {/* Active Filters */}
          {hasActiveFilters && (<div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {searchQuery && (<button_1.Button variant="outline" size="sm" onClick={function () { return clearFilter("query"); }} className="h-7">
                  Query: &ldquo;{searchQuery}&rdquo; ×
                </button_1.Button>)}
              {locationQuery && (<button_1.Button variant="outline" size="sm" onClick={function () { return clearFilter("location"); }} className="h-7">
                  Location: &ldquo;{locationQuery}&rdquo; ×
                </button_1.Button>)}
              <button_1.Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-7 text-muted-foreground">
                Clear all
              </button_1.Button>
            </div>)}
        </div>

        {/* Loading State */}
        {isLoading && <PropertySkeletonGrid_1.PropertySkeletonGrid count={12} viewMode={viewMode}/>}

        {/* Error State */}
        {isError && (<div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <lucide_react_1.AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Unable to Load Properties
              </h3>
              <p className="text-red-600 mb-4">
                {error instanceof Error ?
                error.message
                : "An error occurred while loading properties."}
              </p>
              <button_1.Button onClick={function () { return refetch(); }} disabled={isFetching}>
                <lucide_react_1.RefreshCw className={"w-4 h-4 mr-2 ".concat(isFetching ? "animate-spin" : "")}/>
                Try Again
              </button_1.Button>
            </div>
          </div>)}

        {/* Empty State */}
        {!isLoading && !isError && isEmpty && (<div className="text-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <lucide_react_1.Grid className="w-8 h-8 text-gray-400"/>
              </div>
              <h3 className="text-xl font-medium mb-2">No Properties Found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or browse all properties.
              </p>
              <button_1.Button onClick={handleResetFilters}>Clear All Filters</button_1.Button>
            </div>
          </div>)}

        {/* Properties Display */}
        {!isLoading && !isError && !isEmpty && (<div ref={containerRef} className="mb-8">
            {shouldUseVirtualization ?
                // Virtualized view for large datasets
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Using virtualized rendering for optimal performance
                    </span>
                    <div className="flex items-center gap-4">
                      <span>{normalizedProperties.length} items loaded</span>
                      {hasValidData && (<span className="flex items-center gap-1 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"/>
                          Live data
                        </span>)}
                    </div>
                  </div>
                  <VirtualizedPropertyList_1.EnhancedVirtualizedPropertyList properties={normalizedProperties} viewMode={viewMode} height={dimensions.height} width={dimensions.width} onPropertyClick={handlePropertyClick} CardComponent={config.cardComponent} itemsPerRow={itemsPerRow} gridItemWidth={320} gridItemHeight={400} listItemHeight={200} className="border rounded-lg overflow-hidden"/>
                </div>
                // Standard grid/list view
                : <div className={"grid gap-6 ".concat(viewMode === "grid" ?
                        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        : "grid-cols-1")}>
                  {normalizedProperties.map(function (property) { return (<react_1.default.Suspense key={property.id} fallback={<card_1.Card className="overflow-hidden">
                          <skeleton_1.Skeleton className="aspect-video w-full"/>
                          <card_1.CardContent className="p-4 space-y-2">
                            <skeleton_1.Skeleton className="h-4 w-3/4"/>
                            <skeleton_1.Skeleton className="h-4 w-1/2"/>
                            <skeleton_1.Skeleton className="h-6 w-1/3"/>
                          </card_1.CardContent>
                        </card_1.Card>}>
                      <config.cardComponent property={property} onClick={handlePropertyClick} className={viewMode === "list" ? "flex flex-row" : ""}/>
                    </react_1.default.Suspense>); })}
                </div>}
          </div>)}

        {/* Enhanced Pagination */}
        {!isLoading && !isError && totalPages > 1 && (<div className="mt-8">
            <Pagination_1.Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} disabled={isFetching} showPageInfo={true} showFirstLast={totalPages > 7} className="justify-center"/>
          </div>)}
      </div>
    </div>);
}
