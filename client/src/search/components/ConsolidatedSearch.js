"use strict";
/**
 * Consolidated Search Component
 * Combines SearchBar, SearchFilters, and search results functionality
 * Eliminates redundancy across search components
 */
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
exports.ConsolidatedSearch = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var input_1 = require("../../local/components/ui/input");
var select_1 = require("../../local/components/ui/select");
var useSearch_1 = require("../hooks/useSearch");
// ============================================================================
// Constants
// ============================================================================
var PROPERTY_TYPES = [
    { value: "", label: "Any Type" },
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "condo", label: "Condo" },
    { value: "townhouse", label: "Townhouse" },
    { value: "villa", label: "Villa" },
];
var PRICE_RANGES = [
    { value: "", label: "Any Price" },
    { value: "0-1000000", label: "Under KES 1M" },
    { value: "1000000-5000000", label: "KES 1M - 5M" },
    { value: "5000000-10000000", label: "KES 5M - 10M" },
    { value: "10000000-20000000", label: "KES 10M - 20M" },
    { value: "20000000-", label: "Over KES 20M" },
];
var SORT_OPTIONS = [
    { value: "relevance", label: "Most Relevant" },
    { value: "price", label: "Price" },
    { value: "date", label: "Newest First" },
    { value: "size", label: "Size" },
];
var BEDROOM_OPTIONS = [1, 2, 3, 4, 5];
var BATHROOM_OPTIONS = [1, 2, 3, 4, 5];
var PARKING_OPTIONS = [0, 1, 2, 3, 4];
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Parse price range string into min and max values
 */
function parsePriceRange(value) {
    if (!value)
        return { min: undefined, max: undefined };
    var _a = value.split("-"), minStr = _a[0], maxStr = _a[1];
    return {
        min: minStr ? parseInt(minStr, 10) : undefined,
        max: maxStr ? parseInt(maxStr, 10) : undefined,
    };
}
/**
 * Format price range for display
 */
function formatPriceRange(priceMin, priceMax) {
    if (!priceMin && !priceMax)
        return "";
    if (priceMin && !priceMax)
        return "".concat(priceMin, "-");
    if (!priceMin && priceMax)
        return "0-".concat(priceMax);
    return "".concat(priceMin, "-").concat(priceMax);
}
// ============================================================================
// Main Component
// ============================================================================
exports.ConsolidatedSearch = react_1.default.memo(function (_a) {
    var _b, _c, _d;
    var onResults = _a.onResults, onFiltersChange = _a.onFiltersChange, _e = _a.initialFilters, initialFilters = _e === void 0 ? {} : _e, _f = _a.showAdvancedFilters, showAdvancedFilters = _f === void 0 ? false : _f, _g = _a.className, className = _g === void 0 ? "" : _g;
    var _h = (0, react_1.useState)(showAdvancedFilters), showFilters = _h[0], setShowFilters = _h[1];
    var _j = (0, react_1.useState)("relevance"), sortBy = _j[0], setSortBy = _j[1];
    var _k = (0, react_1.useState)("desc"), sortOrder = _k[0], setSortOrder = _k[1];
    // Use the consolidated search hook
    var _l = (0, useSearch_1.useSearch)({
        initialFilters: initialFilters,
        autoSearch: true,
    }), filters = _l.filters, searchResults = _l.searchResults, isLoading = _l.isLoading, updateFilter = _l.updateFilter, updateFilters = _l.updateFilters, clearFilters = _l.clearFilters, search = _l.search, activeFilterCount = _l.activeFilterCount;
    // ========================================================================
    // Memoized Values
    // ========================================================================
    var currentPriceRange = (0, react_1.useMemo)(function () { return formatPriceRange(filters.priceMin, filters.priceMax); }, [filters.priceMin, filters.priceMax]);
    var propertyTypeValue = (0, react_1.useMemo)(function () {
        return Array.isArray(filters.propertyType)
            ? filters.propertyType[0] || ""
            : filters.propertyType || "";
    }, [filters.propertyType]);
    var resultsText = (0, react_1.useMemo)(function () {
        if (!searchResults)
            return null;
        return "".concat(searchResults.total, " properties found").concat(searchResults.searchTime ? " in ".concat(searchResults.searchTime, "ms") : "");
    }, [searchResults]);
    var showingText = (0, react_1.useMemo)(function () {
        var _a;
        if (!(searchResults === null || searchResults === void 0 ? void 0 : searchResults.hasMore))
            return null;
        return "Showing ".concat(((_a = searchResults.items) === null || _a === void 0 ? void 0 : _a.length) || 0, " of ").concat(searchResults.total);
    }, [searchResults]);
    // ========================================================================
    // Event Handlers
    // ========================================================================
    var handleSearch = (0, react_1.useCallback)(function () {
        search();
        if (searchResults === null || searchResults === void 0 ? void 0 : searchResults.items) {
            onResults === null || onResults === void 0 ? void 0 : onResults(searchResults.items);
        }
    }, [search, searchResults, onResults]);
    var handleFilterChange = (0, react_1.useCallback)(function (key, value) {
        var _a;
        updateFilter(key, value);
        onFiltersChange === null || onFiltersChange === void 0 ? void 0 : onFiltersChange(__assign(__assign({}, filters), (_a = {}, _a[key] = value, _a)));
    }, [updateFilter, filters, onFiltersChange]);
    var handlePriceRangeChange = (0, react_1.useCallback)(function (value) {
        var _a = parsePriceRange(value), min = _a.min, max = _a.max;
        updateFilters({ priceMin: min, priceMax: max });
    }, [updateFilters]);
    var handleSortChange = (0, react_1.useCallback)(function (value) {
        setSortBy(value);
        // In a real implementation, this would trigger a new search with sort options
        console.log("Sort changed to:", value);
    }, []);
    var toggleSortOrder = (0, react_1.useCallback)(function () {
        setSortOrder(function (prev) { return (prev === "asc" ? "desc" : "asc"); });
        // In a real implementation, this would trigger a new search
    }, []);
    var toggleFilters = (0, react_1.useCallback)(function () {
        setShowFilters(function (prev) { return !prev; });
    }, []);
    var handleQueryChange = (0, react_1.useCallback)(function (e) {
        handleFilterChange("query", e.target.value);
    }, [handleFilterChange]);
    var handleLocationChange = (0, react_1.useCallback)(function (e) {
        handleFilterChange("location", e.target.value);
    }, [handleFilterChange]);
    var handlePropertyTypeChange = (0, react_1.useCallback)(function (value) {
        handleFilterChange("propertyType", value);
    }, [handleFilterChange]);
    var handleBedroomsChange = (0, react_1.useCallback)(function (value) {
        handleFilterChange("bedrooms", value ? parseInt(value, 10) : undefined);
    }, [handleFilterChange]);
    var handleBathroomsChange = (0, react_1.useCallback)(function (value) {
        handleFilterChange("bathrooms", value ? parseInt(value, 10) : undefined);
    }, [handleFilterChange]);
    var handleParkingChange = (0, react_1.useCallback)(function (value) {
        handleFilterChange("parkingSpaces", value ? parseInt(value, 10) : undefined);
    }, [handleFilterChange]);
    var handleFurnishedChange = (0, react_1.useCallback)(function (value) {
        handleFilterChange("furnished", value === "" ? undefined : value === "true");
    }, [handleFilterChange]);
    var handlePetFriendlyChange = (0, react_1.useCallback)(function (value) {
        handleFilterChange("petFriendly", value === "" ? undefined : value === "true");
    }, [handleFilterChange]);
    var handleVerifiedChange = (0, react_1.useCallback)(function (value) {
        handleFilterChange("verified", value === "" ? undefined : value === "true");
    }, [handleFilterChange]);
    // ========================================================================
    // Render
    // ========================================================================
    return (<div className={"space-y-6 ".concat(className)}>
        {/* Main Search Bar */}
        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="space-y-4">
              {/* Primary search input */}
              <div className="relative">
                <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true"/>
                <input_1.Input placeholder="Search properties by location, type, or features..." value={filters.query || ""} onChange={handleQueryChange} className="pl-10 h-12 text-lg" aria-label="Search properties"/>
                {isLoading && (<lucide_react_1.Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 animate-spin" aria-label="Loading"/>)}
              </div>

              {/* Quick filters row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <lucide_react_1.MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" aria-hidden="true"/>
                  <input_1.Input placeholder="Location" value={filters.location || ""} onChange={handleLocationChange} className="pl-10" aria-label="Location"/>
                </div>

                <select_1.Select value={propertyTypeValue} onValueChange={handlePropertyTypeChange}>
                  <select_1.SelectTrigger aria-label="Property type">
                    <select_1.SelectValue placeholder="Property Type"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    {PROPERTY_TYPES.map(function (type) { return (<select_1.SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </select_1.SelectItem>); })}
                  </select_1.SelectContent>
                </select_1.Select>

                <select_1.Select value={currentPriceRange} onValueChange={handlePriceRangeChange}>
                  <select_1.SelectTrigger aria-label="Price range">
                    <select_1.SelectValue placeholder="Price Range"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    {PRICE_RANGES.map(function (range) { return (<select_1.SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </select_1.SelectItem>); })}
                  </select_1.SelectContent>
                </select_1.Select>

                <div className="flex gap-2">
                  <select_1.Select value={sortBy} onValueChange={handleSortChange}>
                    <select_1.SelectTrigger className="flex-1" aria-label="Sort by">
                      <select_1.SelectValue />
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {SORT_OPTIONS.map(function (option) { return (<select_1.SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                  <button_1.Button size="sm" onClick={toggleSortOrder} aria-label={"Sort ".concat(sortOrder === "asc" ? "ascending" : "descending")} title={"Sort ".concat(sortOrder === "asc" ? "ascending" : "descending")}>
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button_1.Button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button_1.Button onClick={toggleFilters} className="flex items-center gap-2">
                    <lucide_react_1.Sliders className="h-4 w-4" aria-hidden="true"/>
                    Advanced Filters
                    {activeFilterCount > 0 && (<badge_1.Badge className="ml-1">{activeFilterCount}</badge_1.Badge>)}
                  </button_1.Button>

                  {activeFilterCount > 0 && (<button_1.Button onClick={clearFilters} className="flex items-center gap-2">
                      <lucide_react_1.X className="h-4 w-4" aria-hidden="true"/>
                      Clear All
                    </button_1.Button>)}
                </div>

                <button_1.Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (<lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true"/>) : (<lucide_react_1.Search className="h-4 w-4 mr-2" aria-hidden="true"/>)}
                  Search
                </button_1.Button>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Advanced Filters Panel */}
        {showFilters && (<card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.Filter className="h-5 w-5" aria-hidden="true"/>
                Advanced Filters
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bedrooms */}
                <div>
                  <label htmlFor="bedrooms-select" className="block text-sm font-medium mb-2">
                    Bedrooms
                  </label>
                  <select_1.Select value={((_b = filters.bedrooms) === null || _b === void 0 ? void 0 : _b.toString()) || ""} onValueChange={handleBedroomsChange}>
                    <select_1.SelectTrigger id="bedrooms-select">
                      <select_1.SelectValue placeholder="Any"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="">Any</select_1.SelectItem>
                      {BEDROOM_OPTIONS.map(function (num) { return (<select_1.SelectItem key={num} value={num.toString()}>
                          {num}+ bedroom{num > 1 ? "s" : ""}
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>

                {/* Bathrooms */}
                <div>
                  <label htmlFor="bathrooms-select" className="block text-sm font-medium mb-2">
                    Bathrooms
                  </label>
                  <select_1.Select value={((_c = filters.bathrooms) === null || _c === void 0 ? void 0 : _c.toString()) || ""} onValueChange={handleBathroomsChange}>
                    <select_1.SelectTrigger id="bathrooms-select">
                      <select_1.SelectValue placeholder="Any"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="">Any</select_1.SelectItem>
                      {BATHROOM_OPTIONS.map(function (num) { return (<select_1.SelectItem key={num} value={num.toString()}>
                          {num}+ bathroom{num > 1 ? "s" : ""}
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>

                {/* Parking */}
                <div>
                  <label htmlFor="parking-select" className="block text-sm font-medium mb-2">
                    Parking Spaces
                  </label>
                  <select_1.Select value={((_d = filters.parkingSpaces) === null || _d === void 0 ? void 0 : _d.toString()) || ""} onValueChange={handleParkingChange}>
                    <select_1.SelectTrigger id="parking-select">
                      <select_1.SelectValue placeholder="Any"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="">Any</select_1.SelectItem>
                      {PARKING_OPTIONS.map(function (num) { return (<select_1.SelectItem key={num} value={num.toString()}>
                          {num === 0
                    ? "No parking"
                    : "".concat(num, "+ space").concat(num > 1 ? "s" : "")}
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>

                {/* Furnished */}
                <div>
                  <label htmlFor="furnished-select" className="block text-sm font-medium mb-2">
                    Furnished
                  </label>
                  <select_1.Select value={filters.furnished === undefined
                ? ""
                : filters.furnished.toString()} onValueChange={handleFurnishedChange}>
                    <select_1.SelectTrigger id="furnished-select">
                      <select_1.SelectValue placeholder="Any"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="">Any</select_1.SelectItem>
                      <select_1.SelectItem value="true">Furnished</select_1.SelectItem>
                      <select_1.SelectItem value="false">Unfurnished</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>

                {/* Pet Friendly */}
                <div>
                  <label htmlFor="pet-friendly-select" className="block text-sm font-medium mb-2">
                    Pet Friendly
                  </label>
                  <select_1.Select value={filters.petFriendly === undefined
                ? ""
                : filters.petFriendly.toString()} onValueChange={handlePetFriendlyChange}>
                    <select_1.SelectTrigger id="pet-friendly-select">
                      <select_1.SelectValue placeholder="Any"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="">Any</select_1.SelectItem>
                      <select_1.SelectItem value="true">Pet Friendly</select_1.SelectItem>
                      <select_1.SelectItem value="false">No Pets</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>

                {/* Verification Status */}
                <div>
                  <label htmlFor="verified-select" className="block text-sm font-medium mb-2">
                    Verification
                  </label>
                  <select_1.Select value={filters.verified === undefined
                ? ""
                : filters.verified.toString()} onValueChange={handleVerifiedChange}>
                    <select_1.SelectTrigger id="verified-select">
                      <select_1.SelectValue placeholder="Any"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="">Any</select_1.SelectItem>
                      <select_1.SelectItem value="true">Verified Only</select_1.SelectItem>
                      <select_1.SelectItem value="false">Include Unverified</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>)}

        {/* Search Results Summary */}
        {searchResults && (<div className="flex items-center justify-between text-sm text-gray-600">
            <span>{resultsText}</span>
            {showingText && <span>{showingText}</span>}
          </div>)}
      </div>);
});
exports.ConsolidatedSearch.displayName = "ConsolidatedSearch";
exports.default = exports.ConsolidatedSearch;
