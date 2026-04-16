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
exports.default = SearchResults;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var CompareBar_1 = require("../../property/components/CompareBar");
var CompareModal_1 = require("../../property/components/CompareModal");
var property_1 = require("../../local/components/property");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var ConsolidatedSearch_1 = require("../components/ConsolidatedSearch");
// Constants moved outside component to prevent recreation on each render
var SORT_OPTIONS = [
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
    { label: "Newest First", value: "newest" },
    { label: "Most Relevant", value: "relevance" },
];
var BEDROOM_OPTIONS = [
    { label: "Any", value: "" },
    { label: "1+", value: "1" },
    { label: "2+", value: "2" },
    { label: "3+", value: "3" },
    { label: "4+", value: "4" },
];
var PROPERTY_TYPE_OPTIONS = [
    { label: "Any", value: "" },
    { label: "Apartment", value: "apartment" },
    { label: "House", value: "house" },
    { label: "Condo", value: "condo" },
    { label: "Townhouse", value: "townhouse" },
];
// Initial filter state - extracted for reusability
var INITIAL_FILTERS = {
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    propertyType: "",
    location: "",
};
// Mock data with enhanced TypeScript compliance
var mockProperties = [
    {
        id: "1",
        title: "Modern 3-Bedroom Apartment in Westlands",
        description: "Beautiful modern apartment with city views and premium amenities",
        location: "Westlands, Nairobi",
        price: 150000,
        images: [
            "/assets/apartment-luxury-1.jpg",
            "/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg",
        ],
        verified: true,
        type: "apartment",
        category: "residential",
        features: {
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1200,
            parkingSpaces: 2,
            yearBuilt: 2020,
            amenities: ["Swimming Pool", "Gym", "24/7 Security"],
            propertyType: "Apartment",
            petFriendly: true,
            furnished: false,
        },
        status: "available",
        createdAt: new Date().toISOString(),
        verificationStatus: "verified",
    },
    {
        id: "2",
        title: "Spacious Family Home in Karen",
        description: "Perfect family home with large garden and quiet neighborhood setting",
        location: "Karen, Nairobi",
        price: 280000,
        images: [
            "/assets/house-executive-1.jpg",
            "/assets/Residential/luke-van-zyl-koH7IVuwRLw-unsplash.jpg",
        ],
        verified: true,
        type: "house",
        category: "residential",
        features: {
            bedrooms: 4,
            bathrooms: 3,
            squareFeet: 2500,
            parkingSpaces: 3,
            yearBuilt: 2018,
            amenities: ["Private Garden", "Gated Community", "Covered Parking"],
            propertyType: "House",
            petFriendly: true,
            furnished: false,
        },
        status: "available",
        createdAt: new Date().toISOString(),
        verificationStatus: "verified",
    },
];
// Helper function to safely parse location string
var getLocationString = function (location) {
    return location || "";
};
// Helper function to safely convert price to number for comparison
var getPriceAsNumber = function (price) {
    return price || 0;
};
// Enhanced filter input component extracted for better reusability and type safety
var FilterInput = react_1.default.memo(function (_a) {
    var label = _a.label, _b = _a.type, type = _b === void 0 ? "text" : _b, value = _a.value, onChange = _a.onChange, placeholder = _a.placeholder, options = _a.options;
    return (<div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {type === "select" ?
            <select value={value} onChange={function (e) { return onChange(e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors" aria-label={label} title={label}>
          {options === null || options === void 0 ? void 0 : options.map(function (option) { return (<option key={option.value} value={option.value}>
              {option.label}
            </option>); })}
        </select>
            : <input type={type} value={value} onChange={function (e) { return onChange(e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder={placeholder} aria-label={label}/>}
    </div>);
});
// Set display name for better debugging experience
FilterInput.displayName = "FilterInput";
function SearchResults() {
    // State management with proper TypeScript typing
    var _a = (0, react_1.useState)(""), searchQuery = _a[0], setSearchQuery = _a[1];
    var _b = (0, react_1.useState)(false), showFilters = _b[0], setShowFilters = _b[1];
    var _c = (0, react_1.useState)(INITIAL_FILTERS), filters = _c[0], setFilters = _c[1];
    var _d = (0, react_1.useState)("relevance"), sortBy = _d[0], setSortBy = _d[1];
    var _e = (0, react_1.useState)(false), showCompareModal = _e[0], setShowCompareModal = _e[1];
    // Optimized event handlers using useCallback to prevent unnecessary re-renders
    var handleSearch = (0, react_1.useCallback)(function (query) {
        setSearchQuery(query);
        // In a real application, this would trigger an API call with debouncing
        // Example: debouncedSearchAPI(query, filters)
    }, []);
    var handleFilterChange = (0, react_1.useCallback)(function (key, value) {
        setFilters(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    }, []);
    var handleClearFilters = (0, react_1.useCallback)(function () {
        setFilters(INITIAL_FILTERS);
    }, []);
    var handleShowCompareModal = (0, react_1.useCallback)(function () {
        setShowCompareModal(true);
    }, []);
    var handleCloseCompareModal = (0, react_1.useCallback)(function () {
        setShowCompareModal(false);
    }, []);
    var handleSortChange = (0, react_1.useCallback)(function (event) {
        setSortBy(event.target.value);
    }, []);
    var toggleFilters = (0, react_1.useCallback)(function () {
        setShowFilters(function (prev) { return !prev; });
    }, []);
    // Memoized check for active filters to improve performance
    var hasActiveFilters = (0, react_1.useMemo)(function () {
        return Object.values(filters).some(function (value) { return value !== ""; });
    }, [filters]);
    // Memoized filtered and sorted results to prevent unnecessary recalculations
    var processedProperties = (0, react_1.useMemo)(function () {
        var filtered = __spreadArray([], mockProperties, true); // Create a shallow copy to avoid mutating the original array
        // Apply filters - in a real app, this would be handled by the backend
        if (filters.minPrice) {
            var minPrice_1 = parseInt(filters.minPrice, 10);
            if (!isNaN(minPrice_1)) {
                filtered = filtered.filter(function (property) { return getPriceAsNumber(property.price) >= minPrice_1; });
            }
        }
        if (filters.maxPrice) {
            var maxPrice_1 = parseInt(filters.maxPrice, 10);
            if (!isNaN(maxPrice_1)) {
                filtered = filtered.filter(function (property) { return getPriceAsNumber(property.price) <= maxPrice_1; });
            }
        }
        if (filters.bedrooms) {
            var minBedrooms_1 = parseInt(filters.bedrooms, 10);
            if (!isNaN(minBedrooms_1)) {
                filtered = filtered.filter(function (property) {
                    var _a;
                    return ((_a = property.features) === null || _a === void 0 ? void 0 : _a.bedrooms) !== undefined &&
                        property.features.bedrooms >= minBedrooms_1;
                });
            }
        }
        if (filters.propertyType) {
            filtered = filtered.filter(function (property) { var _a; return ((_a = property.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === filters.propertyType.toLowerCase(); });
        }
        if (filters.location) {
            var locationQuery_1 = filters.location.toLowerCase();
            filtered = filtered.filter(function (property) {
                return getLocationString(property.location)
                    .toLowerCase()
                    .includes(locationQuery_1);
            });
        }
        // Apply sorting with improved type safety and null checking
        return filtered.sort(function (a, b) {
            switch (sortBy) {
                case "price-asc":
                    return getPriceAsNumber(a.price) - getPriceAsNumber(b.price);
                case "price-desc":
                    return getPriceAsNumber(b.price) - getPriceAsNumber(a.price);
                case "newest":
                    return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                case "relevance":
                default:
                    // In a real app, this would use a relevance score from the search API
                    return 0;
            }
        });
    }, [filters, sortBy]);
    // Memoized results count to prevent unnecessary recalculations
    var resultCount = (0, react_1.useMemo)(function () { return processedProperties.length; }, [processedProperties]);
    // Memoized search description for better UX
    var searchDescription = (0, react_1.useMemo)(function () {
        var propertyText = resultCount === 1 ? "property" : "properties";
        var baseText = "".concat(resultCount, " ").concat(propertyText, " found");
        if (searchQuery.trim()) {
            return "".concat(baseText, " for \"").concat(searchQuery, "\"");
        }
        return baseText;
    }, [resultCount, searchQuery]);
    return (<>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 navbar-offset pb-8">
          {/* Enhanced search header with better accessibility */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">
              Search Properties
            </h1>
            <ConsolidatedSearch_1.default onResults={function (results) {
            // Handle search results if needed
            console.log("Search results:", results);
        }} onFiltersChange={function (filters) {
            // Handle filter changes if needed
            console.log("Filters changed:", filters);
        }} showAdvancedFilters={showFilters}/>
          </header>

          {/* Enhanced search results section */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Results list with improved header */}
            <main className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Search Results
                  </h2>
                  <p className="text-gray-600">{searchDescription}</p>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-sm text-gray-600 whitespace-nowrap">
                    Sort by:
                  </label>
                  <select id="sort-select" value={sortBy} onChange={handleSortChange} className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors" title="Sort search results by different criteria" aria-label="Sort search results">
                    {SORT_OPTIONS.map(function (option) { return (<option key={option.value} value={option.value}>
                        {option.label}
                      </option>); })}
                  </select>
                </div>
              </div>

              {/* Results grid with conditional rendering */}
              {resultCount > 0 ?
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {processedProperties.map(function (property) { return (<property_1.PropertyCard key={property.id} property={property}/>); })}
                </div>
            : <card_1.Card className="text-center py-12">
                  <card_1.CardContent>
                    <p className="text-gray-600 mb-4">
                      No properties found matching your criteria.
                    </p>
                    <button_1.Button variant="outline" onClick={handleClearFilters}>
                      Clear Filters
                    </button_1.Button>
                  </card_1.CardContent>
                </card_1.Card>}

              {/* Enhanced pagination with proper accessibility */}
              {resultCount > 0 && (<nav className="flex justify-center mt-8" aria-label="Search results pagination">
                  <div className="flex items-center gap-2">
                    <button_1.Button variant="outline" disabled aria-label="Previous page">
                      Previous
                    </button_1.Button>
                    <button_1.Button variant="outline" className="bg-blue-600 text-white" aria-current="page">
                      1
                    </button_1.Button>
                    <button_1.Button variant="outline" aria-label="Go to page 2">
                      2
                    </button_1.Button>
                    <button_1.Button variant="outline" aria-label="Go to page 3">
                      3
                    </button_1.Button>
                    <button_1.Button variant="outline" aria-label="Next page">
                      Next
                    </button_1.Button>
                  </div>
                </nav>)}
            </main>

            {/* Enhanced map sidebar */}
            <aside className="lg:w-96">
              <card_1.Card className="sticky top-4">
                <card_1.CardHeader>
                  <card_1.CardTitle className="flex items-center">
                    <lucide_react_1.MapPin className="w-5 h-5 mr-2 text-blue-600"/>
                    Map View
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <lucide_react_1.MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2"/>
                      <p className="text-gray-600 text-sm">
                        Interactive map will display here
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Showing {resultCount} properties
                      </p>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </aside>
          </div>
        </div>

        {/* Floating Compare Bar */}
        <CompareBar_1.CompareBar onQuickCompare={handleShowCompareModal}/>

        {/* Compare Modal */}
        <CompareModal_1.CompareModal isOpen={showCompareModal} onClose={handleCloseCompareModal}/>
      </div>
    </>);
}
