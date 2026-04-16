"use strict";
/**
 * Example of how to use the unified search functionality
 * This demonstrates the proper usage of the consolidated search system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchExample = SearchExample;
var react_1 = require("react");
var useSearch_1 = require("../hooks/useSearch");
var SearchBar_1 = require("../components/SearchBar");
var SearchFilters_1 = require("../components/SearchFilters");
function SearchExample() {
    var _a;
    // Use the unified search hook
    var _b = (0, useSearch_1.useSearch)({
        initialFilters: {
            query: '',
            location: '',
        },
        autoSearch: false,
    }), searchResults = _b.searchResults, filters = _b.filters, isLoading = _b.isLoading, updateFilter = _b.updateFilter, updateFilters = _b.updateFilters, search = _b.search, clearFilters = _b.clearFilters, suggestions = _b.suggestions, popularSearches = _b.popularSearches;
    // Handle basic search from SearchBar
    var handleBasicSearch = function (query, searchFilters) {
        updateFilters({
            query: query,
            location: (searchFilters === null || searchFilters === void 0 ? void 0 : searchFilters.location) || '',
            propertyType: (searchFilters === null || searchFilters === void 0 ? void 0 : searchFilters.propertyType) || undefined,
        });
        search();
    };
    // Handle advanced search from AdvancedSearch component
    var handleAdvancedSearch = function (advancedFilters) {
        var _a, _b;
        // Convert advanced filters to our SearchFilters format
        updateFilters({
            query: advancedFilters.query,
            location: advancedFilters.location,
            propertyType: advancedFilters.propertyType,
            priceMin: (_a = advancedFilters.priceRange) === null || _a === void 0 ? void 0 : _a[0],
            priceMax: (_b = advancedFilters.priceRange) === null || _b === void 0 ? void 0 : _b[1],
            bedrooms: advancedFilters.bedrooms,
            bathrooms: advancedFilters.bathrooms,
            amenities: advancedFilters.amenities,
            verificationStatus: advancedFilters.verificationStatus,
            furnished: advancedFilters.furnished,
            petFriendly: advancedFilters.petFriendly,
            parkingSpaces: advancedFilters.parkingSpaces,
        });
        search();
    };
    return (<div className="space-y-6">
      <h2 className="text-2xl font-bold">Search Example</h2>
      
      {/* Basic Search */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Search</h3>
        <SearchBar_1.SearchBar onSearch={handleBasicSearch} isLoading={isLoading} suggestions={(suggestions === null || suggestions === void 0 ? void 0 : suggestions.map(function (s) { return s.text; })) || []} placeholder="Search for properties..."/>
      </div>

      {/* Advanced Search */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Advanced Search</h3>
        <SearchFilters_1.AdvancedSearch onSearch={handleAdvancedSearch} onReset={clearFilters} isLoading={isLoading}/>
      </div>

      {/* Search Results */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Search Results</h3>
        {isLoading ? (<div>Loading...</div>) : ((_a = searchResults === null || searchResults === void 0 ? void 0 : searchResults.properties) === null || _a === void 0 ? void 0 : _a.length) ? (<div>
            <p>Found {searchResults.total} properties</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {searchResults.properties.map(function (property) {
                var _a;
                return (<div key={property.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold">{property.title}</h4>
                  <p className="text-sm text-gray-600">{property.location}</p>
                  <p className="font-bold">KES {(_a = property.price) === null || _a === void 0 ? void 0 : _a.toLocaleString()}</p>
                </div>);
            })}
            </div>
          </div>) : (<div>No results found</div>)}
      </div>

      {/* Popular Searches */}
      {popularSearches && popularSearches.length > 0 && (<div>
          <h3 className="text-lg font-semibold mb-4">Popular Searches</h3>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map(function (search, index) { return (<button key={index} onClick={function () { return handleBasicSearch(search); }} className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200">
                {search}
              </button>); })}
          </div>
        </div>)}

      {/* Current Filters */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Filters</h3>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(filters, null, 2)}
        </pre>
      </div>
    </div>);
}
exports.default = SearchExample;
