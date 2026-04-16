"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SearchBar;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var input_1 = require("../../local/components/ui/input");
var select_1 = require("../../local/components/ui/select");
var useDebounce_1 = require("../../local/hooks/useDebounce");
// Kenya-specific property types and price ranges
var PROPERTY_TYPES = [
    { value: "house", label: "House" },
    { value: "apartment", label: "Apartment" },
    { value: "maisonette", label: "Maisonette" },
    { value: "bungalow", label: "Bungalow" },
    { value: "villa", label: "Villa" },
    { value: "townhouse", label: "Townhouse" },
    { value: "studio", label: "Studio" },
    { value: "commercial", label: "Commercial" },
    { value: "land", label: "Land" },
];
var PRICE_RANGES = [
    { value: "under-1m", label: "Under KES 1M" },
    { value: "1m-5m", label: "KES 1M - 5M" },
    { value: "5m-10m", label: "KES 5M - 10M" },
    { value: "10m-20m", label: "KES 10M - 20M" },
    { value: "20m-50m", label: "KES 20M - 50M" },
    { value: "over-50m", label: "Over KES 50M" },
];
function SearchBar(_a) {
    var _b, _c;
    var onSearch = _a.onSearch, onSuggestionSelect = _a.onSuggestionSelect, _d = _a.isLoading, isLoading = _d === void 0 ? false : _d, _e = _a.error, error = _e === void 0 ? null : _e, _f = _a.suggestions, suggestions = _f === void 0 ? [] : _f, _g = _a.placeholder, placeholder = _g === void 0 ? "Search properties (e.g., 3 bedroom house in Westlands...)" : _g, _h = _a.className, className = _h === void 0 ? "" : _h;
    var _j = (0, react_1.useState)(""), searchQuery = _j[0], setSearchQuery = _j[1];
    var _k = (0, react_1.useState)(""), location = _k[0], setLocation = _k[1];
    var _l = (0, react_1.useState)(""), propertyType = _l[0], setPropertyType = _l[1];
    var _m = (0, react_1.useState)(""), priceRange = _m[0], setPriceRange = _m[1];
    var _o = (0, react_1.useState)(false), showSuggestions = _o[0], setShowSuggestions = _o[1];
    var _p = (0, react_1.useState)({}), validationErrors = _p[0], setValidationErrors = _p[1];
    // Debounce search query for auto-search functionality
    var debouncedSearchQuery = (0, useDebounce_1.useDebounce)(searchQuery, 300);
    // Auto-search when debounced query changes (if enabled)
    (0, react_1.useEffect)(function () {
        if (debouncedSearchQuery.trim() && debouncedSearchQuery.length >= 2) {
            handleSearch(true); // Pass true for auto-search
        }
    }, [debouncedSearchQuery]);
    // Validate search inputs
    var validateInputs = (0, react_1.useCallback)(function () {
        var errors = {};
        if (searchQuery.trim().length > 0 && searchQuery.trim().length < 2) {
            errors.searchQuery = "Search query must be at least 2 characters";
        }
        if (location.trim().length > 0 && location.trim().length < 2) {
            errors.location = "Location must be at least 2 characters";
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [searchQuery, location]);
    // Enhanced search handler with validation and structured data
    var handleSearch = (0, react_1.useCallback)(function (isAutoSearch) {
        if (isAutoSearch === void 0) { isAutoSearch = false; }
        if (!isAutoSearch && !validateInputs()) {
            return;
        }
        var trimmedQuery = searchQuery.trim();
        var filters = {
            location: location.trim(),
            propertyType: propertyType,
            priceRange: priceRange,
        };
        // Only call onSearch if we have a meaningful query or filters
        if (trimmedQuery ||
            filters.location ||
            filters.propertyType ||
            filters.priceRange) {
            onSearch(trimmedQuery, filters);
        }
    }, [searchQuery, location, propertyType, priceRange, onSearch, validateInputs]);
    // Handle Enter key press for better user experience
    var handleKeyPress = (0, react_1.useCallback)(function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
            setShowSuggestions(false);
        }
        else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    }, [handleSearch]);
    // Handle suggestion selection
    var handleSuggestionClick = (0, react_1.useCallback)(function (suggestion) {
        setSearchQuery(suggestion);
        setShowSuggestions(false);
        onSuggestionSelect === null || onSuggestionSelect === void 0 ? void 0 : onSuggestionSelect(suggestion);
    }, [onSuggestionSelect]);
    // Clear all search filters
    var handleClear = (0, react_1.useCallback)(function () {
        setSearchQuery("");
        setLocation("");
        setPropertyType("");
        setPriceRange("");
        setValidationErrors({});
        setShowSuggestions(false);
    }, []);
    // Handle input focus for suggestions
    var handleInputFocus = (0, react_1.useCallback)(function () {
        if (suggestions.length > 0) {
            setShowSuggestions(true);
        }
    }, [suggestions.length]);
    // Memoize active filters count for performance
    var activeFiltersCount = (0, react_1.useMemo)(function () {
        return [location, propertyType, priceRange].filter(Boolean).length;
    }, [location, propertyType, priceRange]);
    // Memoize search preview text
    var searchPreviewText = (0, react_1.useMemo)(function () {
        var terms = [searchQuery, location, propertyType, priceRange].filter(Boolean);
        return terms.length > 0 ? terms.join(" • ") : "No search terms entered";
    }, [searchQuery, location, propertyType, priceRange]);
    return (<div className={"w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg ".concat(className)}>
      <div className="space-y-4">
        {/* Error Alert */}
        {error && (<alert_1.Alert variant="destructive">
            <lucide_react_1.AlertCircle className="h-4 w-4"/>
            <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
          </alert_1.Alert>)}

        {/* Main search input with icon and suggestions */}
        <div className="relative">
          <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"/>
          <input_1.Input placeholder={placeholder} value={searchQuery} onChange={function (e) {
            setSearchQuery(e.target.value);
            setShowSuggestions(e.target.value.length >= 2 && suggestions.length > 0);
        }} onKeyPress={handleKeyPress} onFocus={handleInputFocus} onBlur={function () { return setTimeout(function () { return setShowSuggestions(false); }, 200); }} // Delay to allow suggestion clicks
     className={"pl-10 h-12 text-lg ".concat(validationErrors.searchQuery ? "border-red-500" : "")} aria-describedby={validationErrors.searchQuery ? "search-error" : undefined}/>

          {/* Loading indicator */}
          {isLoading && (<lucide_react_1.Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin"/>)}

          {/* Clear button */}
          {searchQuery && !isLoading && (<button type="button" onClick={function () { return setSearchQuery(""); }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Clear search">
              <lucide_react_1.X className="h-4 w-4"/>
            </button>)}

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {suggestions.map(function (suggestion, index) { return (<button key={index} type="button" onClick={function () { return handleSuggestionClick(suggestion); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors">
                  <lucide_react_1.Search className="inline h-3 w-3 mr-2 text-gray-400"/>
                  {suggestion}
                </button>); })}
            </div>)}

          {/* Validation error */}
          {validationErrors.searchQuery && (<p id="search-error" className="text-sm text-red-600 mt-1">
              {validationErrors.searchQuery}
            </p>)}
        </div>

        {/* Filter row with enhanced styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location filter */}
          <div className="relative">
            <lucide_react_1.MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10"/>
            <input_1.Input placeholder="Location (e.g., Westlands, Karen, CBD)" value={location} onChange={function (e) { return setLocation(e.target.value); }} onKeyPress={handleKeyPress} className={"pl-10 ".concat(validationErrors.location ? "border-red-500" : "")} aria-describedby={validationErrors.location ? "location-error" : undefined}/>
            {validationErrors.location && (<p id="location-error" className="text-sm text-red-600 mt-1">
                {validationErrors.location}
              </p>)}
          </div>

          {/* Property type selector */}
          <div className="relative">
            <lucide_react_1.Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10"/>
            <select_1.Select value={propertyType} onValueChange={setPropertyType}>
              <select_1.SelectTrigger className="pl-10">
                <select_1.SelectValue placeholder="Property Type"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                {PROPERTY_TYPES.map(function (type) { return (<select_1.SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </select_1.SelectItem>); })}
              </select_1.SelectContent>
            </select_1.Select>
          </div>

          {/* Price range selector */}
          <div className="relative">
            <lucide_react_1.DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10"/>
            <select_1.Select value={priceRange} onValueChange={setPriceRange}>
              <select_1.SelectTrigger className="pl-10">
                <select_1.SelectValue placeholder="Price Range"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                {PRICE_RANGES.map(function (range) { return (<select_1.SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </select_1.SelectItem>); })}
              </select_1.SelectContent>
            </select_1.Select>
          </div>
        </div>

        {/* Active filters display */}
        {activeFiltersCount > 0 && (<div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {location && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                <lucide_react_1.MapPin className="h-3 w-3"/>
                {location}
                <button type="button" onClick={function () { return setLocation(""); }} className="ml-1 hover:text-red-600 transition-colors" aria-label="Remove location filter">
                  <lucide_react_1.X className="h-3 w-3"/>
                </button>
              </badge_1.Badge>)}
            {propertyType && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                <lucide_react_1.Home className="h-3 w-3"/>
                {(_b = PROPERTY_TYPES.find(function (t) { return t.value === propertyType; })) === null || _b === void 0 ? void 0 : _b.label}
                <button type="button" onClick={function () { return setPropertyType(""); }} className="ml-1 hover:text-red-600 transition-colors" aria-label="Remove property type filter">
                  <lucide_react_1.X className="h-3 w-3"/>
                </button>
              </badge_1.Badge>)}
            {priceRange && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                <lucide_react_1.DollarSign className="h-3 w-3"/>
                {(_c = PRICE_RANGES.find(function (r) { return r.value === priceRange; })) === null || _c === void 0 ? void 0 : _c.label}
                <button type="button" onClick={function () { return setPriceRange(""); }} className="ml-1 hover:text-red-600 transition-colors" aria-label="Remove price range filter">
                  <lucide_react_1.X className="h-3 w-3"/>
                </button>
              </badge_1.Badge>)}
          </div>)}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button_1.Button type="button" onClick={function () { return handleSearch(); }} disabled={isLoading || Object.keys(validationErrors).length > 0} className="flex-1 h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ?
            <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
            : <lucide_react_1.Search className="mr-2 h-4 w-4"/>}
            {isLoading ? "Searching..." : "Search Properties"}
          </button_1.Button>
          <button_1.Button type="button" onClick={handleClear} variant="outline" className="px-6 h-12" disabled={isLoading}>
            Clear All
          </button_1.Button>
        </div>

        {/* Search preview (shows what will be searched) */}
        {(searchQuery || location || propertyType || priceRange) && (<div className="mt-4 p-3 bg-gray-50 rounded-md border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Search preview:</span>{" "}
              <span className="text-gray-800">{searchPreviewText}</span>
            </p>
            {activeFiltersCount > 0 && (<p className="text-xs text-gray-500 mt-1">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""}{" "}
                applied
              </p>)}
          </div>)}
      </div>
    </div>);
}
