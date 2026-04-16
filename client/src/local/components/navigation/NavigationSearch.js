"use strict";
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
exports.NavigationSearch = NavigationSearch;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../ui/button");
var input_1 = require("../ui/input");
var utils_1 = require("../../lib/utils");
// Constants to avoid duplicate strings
var UNKNOWN_ERROR_MESSAGE = "Unknown error";
function NavigationSearch(_a) {
    var className = _a.className, _b = _a.placeholder, placeholder = _b === void 0 ? "Search properties, locations..." : _b, _c = _a.variant, variant = _c === void 0 ? "default" : _c, _d = _a.showSuggestions, showSuggestions = _d === void 0 ? true : _d, _e = _a.showRecentSearches, showRecentSearches = _e === void 0 ? true : _e, onSearch = _a.onSearch, onResultClick = _a.onResultClick;
    var _f = (0, react_1.useState)(""), query = _f[0], setQuery = _f[1];
    var _g = (0, react_1.useState)(false), isOpen = _g[0], setIsOpen = _g[1];
    var _h = (0, react_1.useState)([]), results = _h[0], setResults = _h[1];
    var _j = (0, react_1.useState)([]), recentSearches = _j[0], setRecentSearches = _j[1];
    var _k = (0, react_1.useState)(false), isLoading = _k[0], setIsLoading = _k[1];
    var _l = (0, react_1.useState)(-1), selectedIndex = _l[0], setSelectedIndex = _l[1];
    var searchRef = (0, react_1.useRef)(null);
    var inputRef = (0, react_1.useRef)(null);
    var debounceRef = (0, react_1.useRef)();
    // Memoize mock results to prevent unnecessary re-renders and satisfy dependency rules
    var mockResults = (0, react_1.useMemo)(function () { return [
        {
            id: "1",
            title: "3 Bedroom Apartment in Victoria Island",
            description: "Modern apartment with ocean view - Verified Documents",
            category: "property",
            href: "/properties/1",
            icon: <lucide_react_1.Building className="w-4 h-4"/>,
            metadata: {
                price: "KSh 50M",
                location: "Westlands",
                type: "Apartment",
                verificationStatus: "verified",
            },
        },
        {
            id: "2",
            title: "Nairobi Properties",
            description: "Browse all verified properties in Nairobi",
            category: "location",
            href: "/properties?location=nairobi&verified=true",
            icon: <lucide_react_1.MapPin className="w-4 h-4"/>,
        },
        {
            id: "3",
            title: "Document Verification Service",
            description: "AI-powered document authenticity verification",
            category: "service",
            href: "/services/document-verification",
            icon: <lucide_react_1.Search className="w-4 h-4"/>,
        },
        {
            id: "4",
            title: "Land Verification Kenya",
            description: "Comprehensive Kenya land verification with expert coordination",
            category: "service",
            href: "/services/land-verification",
            icon: <lucide_react_1.Search className="w-4 h-4"/>,
        },
        {
            id: "5",
            title: "Trust Score Dashboard",
            description: "View your community trust score and document history",
            category: "page",
            href: "/dashboard/trust",
            icon: <lucide_react_1.TrendingUp className="w-4 h-4"/>,
        },
    ]; }, []);
    // Memoize trending searches to prevent unnecessary re-renders
    var trendingSearches = (0, react_1.useMemo)(function () { return [
        "Nairobi apartments",
        "Westlands commercial",
        "Karen land for sale",
        "Property verification",
    ]; }, []);
    // Load recent searches from localStorage with error handling
    (0, react_1.useEffect)(function () {
        var _a;
        try {
            // Use optional chaining for cleaner, more readable code
            var saved = (_a = window.localStorage) === null || _a === void 0 ? void 0 : _a.getItem("recentSearches");
            if (saved) {
                var parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setRecentSearches(parsed);
                }
            }
        }
        catch (error) {
            // Proper error handling - log the error and set default state
            if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.warn("Could not load recent searches from localStorage:", error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE);
            }
            setRecentSearches([]);
        }
    }, []);
    // Memoized search handler to prevent unnecessary re-renders
    var handleSearch = (0, react_1.useCallback)(function () {
        var _a;
        if (!query.trim())
            return;
        // Add to recent searches with deduplication and length limit
        var newRecentSearches = __spreadArray([
            query
        ], recentSearches.filter(function (s) { return s !== query; }), true).slice(0, 5);
        setRecentSearches(newRecentSearches);
        // Save to localStorage with error handling
        try {
            (_a = window.localStorage) === null || _a === void 0 ? void 0 : _a.setItem("recentSearches", JSON.stringify(newRecentSearches));
        }
        catch (error) {
            // Log localStorage errors but don't let them break the search functionality
            if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.warn("Could not save recent searches to localStorage:", error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE);
            }
        }
        if (onSearch) {
            onSearch(query);
        }
        else {
            window.location.href = "/search?q=".concat(encodeURIComponent(query));
        }
        setIsOpen(false);
    }, [query, recentSearches, onSearch]);
    // Memoized result click handler
    var handleResultClick = (0, react_1.useCallback)(function (result) {
        if (onResultClick) {
            onResultClick(result);
        }
        else {
            window.location.href = result.href;
        }
        setIsOpen(false);
    }, [onResultClick]);
    // Memoized recent search click handler
    var handleRecentSearchClick = (0, react_1.useCallback)(function (searchTerm) {
        setQuery(searchTerm);
        if (onSearch) {
            onSearch(searchTerm);
        }
        else {
            window.location.href = "/search?q=".concat(encodeURIComponent(searchTerm));
        }
        setIsOpen(false);
    }, [onSearch]);
    // Debounced search with proper cleanup
    (0, react_1.useEffect)(function () {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        if (query.trim()) {
            setIsLoading(true);
            debounceRef.current = setTimeout(function () {
                // Perform search filtering with safe property access
                var filtered = mockResults.filter(function (result) {
                    var _a;
                    var titleMatch = result.title
                        .toLowerCase()
                        .includes(query.toLowerCase());
                    var descriptionMatch = (_a = result.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(query.toLowerCase());
                    return titleMatch || descriptionMatch;
                });
                setResults(filtered);
                setIsLoading(false);
            }, 300);
        }
        else {
            setResults([]);
            setIsLoading(false);
        }
        return function () {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, mockResults]);
    // Handle keyboard navigation with proper dependencies
    (0, react_1.useEffect)(function () {
        var handleKeyDown = function (e) {
            var _a;
            if (!isOpen)
                return;
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex(function (prev) {
                        return prev < results.length - 1 ? prev + 1 : prev;
                    });
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex(function (prev) { return (prev > 0 ? prev - 1 : -1); });
                    break;
                case "Enter":
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < results.length) {
                        var selectedResult = results.at(selectedIndex);
                        if (selectedResult) {
                            handleResultClick(selectedResult);
                        }
                    }
                    else if (query.trim()) {
                        handleSearch();
                    }
                    break;
                case "Escape":
                    setIsOpen(false);
                    (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.blur();
                    break;
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return function () { return document.removeEventListener("keydown", handleKeyDown); };
    }, [isOpen, selectedIndex, results, query, handleSearch, handleResultClick]);
    // Close dropdown when clicking outside
    (0, react_1.useEffect)(function () {
        var handleClickOutside = function (event) {
            if (searchRef.current &&
                !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return function () { return document.removeEventListener("mousedown", handleClickOutside); };
    }, []);
    // Memoized clear function for recent searches
    var clearRecentSearches = (0, react_1.useCallback)(function () {
        var _a;
        setRecentSearches([]);
        try {
            (_a = window.localStorage) === null || _a === void 0 ? void 0 : _a.removeItem("recentSearches");
        }
        catch (error) {
            // Log localStorage errors but don't let them break the clear functionality
            if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.warn("Could not clear recent searches from localStorage:", error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE);
            }
        }
    }, []);
    // Memoized clear query function
    var clearQuery = (0, react_1.useCallback)(function () {
        var _a;
        setQuery("");
        setResults([]);
        (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
    }, []);
    // Memoized variant classes
    var getVariantClasses = (0, react_1.useMemo)(function () {
        switch (variant) {
            case "compact":
                return "w-48";
            case "expanded":
                return "w-96";
            default:
                return "w-64";
        }
    }, [variant]);
    // Extract search results content to reduce nesting
    var renderSearchResults = (0, react_1.useMemo)(function () {
        if (isLoading) {
            return (<div className="p-4 text-center text-gray-500">
          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"/>
          Searching...
        </div>);
        }
        if (results.length > 0) {
            return (<div>
          <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
            Search Results
          </div>
          {results.map(function (result, index) { return (<button type="button" key={result.id} onClick={function () { return handleResultClick(result); }} className={(0, utils_1.cn)("w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0", selectedIndex === index && "bg-gray-50")}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">{result.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {result.title}
                  </div>
                  {result.description && (<div className="text-sm text-gray-600 truncate">
                      {result.description}
                    </div>)}
                  {result.metadata && (<div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                      {result.metadata.price && (<span>{result.metadata.price}</span>)}
                      {result.metadata.location && (<span>• {result.metadata.location}</span>)}
                      {result.metadata.type && (<span>• {result.metadata.type}</span>)}
                      {result.metadata.verificationStatus && (<span className={"\u2022 ".concat(result.metadata.verificationStatus === "verified" ? "text-green-600" : "text-yellow-600")}>
                          {result.metadata.verificationStatus === "verified" ?
                                "✓ Verified"
                                : "⏳ Pending"}
                        </span>)}
                    </div>)}
                </div>
              </div>
            </button>); })}
        </div>);
        }
        return (<div className="p-4 text-center text-gray-500">
        No results found for &ldquo;{query}&rdquo;
      </div>);
    }, [isLoading, results, query, selectedIndex, handleResultClick]);
    // Extract default state content to reduce nesting
    var renderDefaultState = (0, react_1.useMemo)(function () { return (<div>
        {showRecentSearches && recentSearches.length > 0 && (<div>
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Recent Searches
              </span>
              <button_1.Button type="button" variant="ghost" size="sm" onClick={clearRecentSearches} className="text-xs text-gray-400 hover:text-gray-600">
                Clear
              </button_1.Button>
            </div>
            {recentSearches.map(function (search, index) { return (<button type="button" key={"recent-".concat(index)} onClick={function () { return handleRecentSearchClick(search); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-3">
                <lucide_react_1.Clock className="w-4 h-4 text-gray-400"/>
                <span className="text-gray-900">{search}</span>
              </button>); })}
          </div>)}

        {showSuggestions && (<div>
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
              Trending Searches
            </div>
            {trendingSearches.map(function (search, index) { return (<button type="button" key={"trending-".concat(index)} onClick={function () { return handleRecentSearchClick(search); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-3">
                <lucide_react_1.TrendingUp className="w-4 h-4 text-gray-400"/>
                <span className="text-gray-900">{search}</span>
              </button>); })}
          </div>)}
      </div>); }, [
        showRecentSearches,
        recentSearches,
        clearRecentSearches,
        handleRecentSearchClick,
        showSuggestions,
        trendingSearches,
    ]);
    return (<div ref={searchRef} className={(0, utils_1.cn)("relative", getVariantClasses, className)}>
      {/* Search Input */}
      <div className="relative">
        <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
        <input_1.Input ref={inputRef} type="search" placeholder={placeholder} value={query} onChange={function (e) { return setQuery(e.target.value); }} onFocus={function () { return setIsOpen(true); }} className={(0, utils_1.cn)("pl-10 pr-10 transition-all duration-200", isOpen && "ring-2 ring-primary/20 border-primary")}/>
        {query && (<button_1.Button type="button" variant="ghost" size="sm" onClick={clearQuery} className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0">
            <lucide_react_1.X className="w-3 h-3"/>
          </button_1.Button>)}
      </div>

      {/* Search Dropdown */}
      {isOpen && (<div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {query.trim() ? renderSearchResults : renderDefaultState}
        </div>)}
    </div>);
}
