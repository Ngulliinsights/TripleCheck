import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useProperties, useProperty } from './property/hooks/useProperty';
import { usePropertySearch } from './property/hooks/usePropertySearch';

// Create a test query client
const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Always fetch for testing
    },
  },
});

function PropertyHooksTestComponent() {
  console.log('PropertyHooksTestComponent rendering...');

  // Test property search hook
  const {
    searchParams,
    searchResults,
    isLoading: searchLoading,
    updateSearch,
    clearSearch,
    hasActiveFilters
  } = usePropertySearch();

  // Test individual property hook
  const {
    data: singleProperty,
    isLoading: propertyLoading,
    error: propertyError,
    hasValidData
  } = useProperty('1');

  // Test properties list hook
  const {
    data: propertiesList,
    isLoading: listLoading,
    cancelRequest
  } = useProperties({ limit: 5 });

  const handleSearchTest = () => {
    updateSearch({ query: 'test property', location: 'Nairobi' });
  };

  const handleClearTest = () => {
    clearSearch();
  };

  const handleCancelTest = () => {
    cancelRequest();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'blue' }}>Property Hooks Test</h1>
      
      {/* Search Test */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Search Hook Test</h2>
        <p>Loading: {searchLoading ? 'Yes' : 'No'}</p>
        <p>Has Active Filters: {hasActiveFilters ? 'Yes' : 'No'}</p>
        <p>Results Count: {searchResults?.data?.length || 0}</p>
        <p>Current Query: "{searchParams.query}"</p>
        <p>Current Location: "{searchParams.location}"</p>
        
        <div style={{ marginTop: '10px' }}>
          <button onClick={handleSearchTest} style={{ marginRight: '10px', padding: '5px 10px' }}>
            Test Search
          </button>
          <button onClick={handleClearTest} style={{ padding: '5px 10px' }}>
            Clear Search
          </button>
        </div>
      </div>

      {/* Single Property Test */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Single Property Hook Test</h2>
        <p>Loading: {propertyLoading ? 'Yes' : 'No'}</p>
        <p>Has Valid Data: {hasValidData ? 'Yes' : 'No'}</p>
        <p>Error: {propertyError ? 'Yes' : 'No'}</p>
        {singleProperty && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
            <p>Property Title: {singleProperty.title}</p>
            <p>Property Location: {singleProperty.location}</p>
            <p>Property Price: ${singleProperty.price}</p>
          </div>
        )}
      </div>

      {/* Properties List Test */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Properties List Hook Test</h2>
        <p>Loading: {listLoading ? 'Yes' : 'No'}</p>
        <p>Properties Count: {propertiesList?.data?.length || 0}</p>
        <p>Total: {propertiesList?.total || 0}</p>
        
        <div style={{ marginTop: '10px' }}>
          <button onClick={handleCancelTest} style={{ padding: '5px 10px' }}>
            Cancel Requests
          </button>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#d4edda', 
        border: '1px solid #c3e6cb',
        borderRadius: '5px',
        color: '#155724'
      }}>
        <h3>✅ Property Hooks Test Status</h3>
        <p>If you can see this component, the property hooks are not preventing rendering!</p>
        <p>Check the browser's Network tab to verify API calls are working correctly.</p>
        <p>The hooks should prevent infinite loops and provide proper debouncing.</p>
      </div>
    </div>
  );
}

export function PropertyHooksTestApp() {
  console.log('PropertyHooksTestApp rendering...');
  
  return (
    <QueryClientProvider client={testQueryClient}>
      <PropertyHooksTestComponent />
    </QueryClientProvider>
  );
}

export default PropertyHooksTestApp;