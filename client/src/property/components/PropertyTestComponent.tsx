import { Loader2 } from 'lucide-react'
import React from 'react'

import { Button } from '../../local/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../local/components/ui/card'
import { useProperty } from '../hooks/useProperty'
import { usePropertySearch } from '../hooks/usePropertySearch'

/**
 * Test component to verify that infinite API calls are resolved
 * This component uses all the fixed hooks to ensure they work properly
 */
export function PropertyTestComponent() {
  const [testPropertyId, setTestPropertyId] = React.useState<string>('');
  
  // Get unified property hooks
  const { usePropertyDetail, useProperties } = useProperty();
  
  // Test the property search hook with debouncing
  const {
    searchParams,
    properties: searchResults,
    isLoading: searchLoading,
    updateSearch,
    clearSearch,
    hasActiveFilters
  } = usePropertySearch();

  // Test individual property fetch
  const {
    data: singleProperty,
    isLoading: propertyLoading,
    error: propertyError
  } = usePropertyDetail(testPropertyId);

  // Test properties list
  const {
    data: propertiesList,
    isLoading: listLoading
  } = useProperties({ limit: 5 });

  const hasValidData = Boolean(singleProperty);

  const handleSearchUpdate = (field: string, value: string) => {
    updateSearch({ [field]: value });
  };

  const handleTestProperty = () => {
    // Test with a sample property ID
    setTestPropertyId('84');
  };

  const handleCancelRequests = () => {
    // Cancel functionality is now handled internally by the unified hooks
    console.log('Cancel requests - handled internally by unified hooks');
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Property API Test Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            This component tests the fixed property hooks to ensure no infinite API calls occur.
          </div>
          
          {/* Search Test */}
          <div className="space-y-2">
            <h3 className="font-semibold">Search Test (Debounced)</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search query..."
                value={searchParams.query}
                onChange={(e) => handleSearchUpdate('query', e.target.value)}
                className="border rounded px-2 py-1"
              />
              <input
                type="text"
                placeholder="Location..."
                value={searchParams.location}
                onChange={(e) => handleSearchUpdate('location', e.target.value)}
                className="border rounded px-2 py-1"
              />
              <Button onClick={clearSearch} variant="outline" size="sm">
                Clear
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              Active filters: {hasActiveFilters ? 'Yes' : 'No'} | 
              Loading: {searchLoading ? 'Yes' : 'No'} | 
              Results: {searchResults?.length || 0}
            </div>
          </div>

          {/* Single Property Test */}
          <div className="space-y-2">
            <h3 className="font-semibold">Single Property Test</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Property ID..."
                value={testPropertyId}
                onChange={(e) => setTestPropertyId(e.target.value)}
                className="border rounded px-2 py-1"
              />
              <Button onClick={handleTestProperty} size="sm">
                Test Property 84
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              Loading: {propertyLoading ? 'Yes' : 'No'} | 
              Has Data: {hasValidData ? 'Yes' : 'No'} | 
              Error: {propertyError ? 'Yes' : 'No'}
            </div>
            {singleProperty && (
              <div className="text-xs bg-gray-100 p-2 rounded">
                Property: {singleProperty.title} - {singleProperty.location}
              </div>
            )}
          </div>

          {/* Properties List Test */}
          <div className="space-y-2">
            <h3 className="font-semibold">Properties List Test</h3>
            <div className="flex gap-2">
              <Button onClick={handleCancelRequests} variant="outline" size="sm">
                Cancel Requests
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              Loading: {listLoading ? 'Yes' : 'No'} | 
              Count: {propertiesList?.data?.length || 0}
            </div>
            {listLoading && (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading properties...
              </div>
            )}
          </div>

          {/* Debug Info */}
          <div className="mt-4 p-3 bg-yellow-50 rounded">
            <h4 className="font-semibold text-sm">Debug Info</h4>
            <div className="text-xs text-gray-600 mt-1">
              Check the browser's Network tab to verify that API calls are not repeating infinitely.
              The debounced search should only trigger after you stop typing for 500ms.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PropertyTestComponent;