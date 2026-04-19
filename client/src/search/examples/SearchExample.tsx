/**
 * Example of how to use the unified search functionality
 * This demonstrates the proper usage of the consolidated search system
 */

import React from 'react'
import { useSearch } from '../hooks/useSearch'
import SearchBar from '../components/SearchBar'
import AdvancedSearch from '../components/SearchFilters'

export function SearchExample() {
  // Use the unified search hook
  const {
    searchResults,
    filters,
    isLoading,
    updateFilter,
    updateFilters,
    search,
    clearFilters,
    suggestions,
    popularSearches,
  } = useSearch({
    initialFilters: {
      query: '',
      location: '',
    },
    autoSearch: false,
  });

  // Handle basic search from SearchBar
  const handleBasicSearch = (query: string, searchFilters?: any) => {
    updateFilters({
      query,
      location: searchFilters?.location || '',
      propertyType: searchFilters?.propertyType || undefined,
    });
    search();
  };

  // Handle advanced search from AdvancedSearch component
  const handleAdvancedSearch = (advancedFilters: any) => {
    // Convert advanced filters to our SearchFilters format
    updateFilters({
      query: advancedFilters.query,
      location: advancedFilters.location,
      propertyType: advancedFilters.propertyType,
      priceMin: advancedFilters.priceRange?.[0],
      priceMax: advancedFilters.priceRange?.[1],
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Search Example</h2>
      
      {/* Basic Search */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Search</h3>
        <SearchBar
          onSearch={handleBasicSearch}
          isLoading={isLoading}
          suggestions={suggestions?.map(s => s.text) || []}
          placeholder="Search for properties..."
        />
      </div>

      {/* Advanced Search */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Advanced Search</h3>
        <AdvancedSearch
          onSearch={handleAdvancedSearch}
          onReset={clearFilters}
          isLoading={isLoading}
        />
      </div>

      {/* Search Results */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Search Results</h3>
        {isLoading ? (
          <div>Loading...</div>
        ) : searchResults?.items?.length ? (
          <div>
            <p>Found {searchResults.total} properties</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {searchResults.items.map((property: any) => (
                <div key={property.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold">{property.title}</h4>
                  <p className="text-sm text-gray-600">{property.location}</p>
                  <p className="font-bold">KES {property.price?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>No results found</div>
        )}
      </div>

      {/* Popular Searches */}
      {popularSearches && popularSearches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Popular Searches</h3>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleBasicSearch(search)}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Filters */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Filters</h3>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(filters, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default SearchExample;