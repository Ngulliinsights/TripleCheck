"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyTestComponent = PropertyTestComponent;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var useUnifiedProperty_1 = require("../hooks/useUnifiedProperty");
var useConsolidatedPropertySearch_1 = require("../hooks/useConsolidatedPropertySearch");
/**
 * Test component to verify that infinite API calls are resolved
 * This component uses all the fixed hooks to ensure they work properly
 */
function PropertyTestComponent() {
    var _a;
    var _b = react_1.default.useState(''), testPropertyId = _b[0], setTestPropertyId = _b[1];
    // Get unified property hooks
    var _c = (0, useUnifiedProperty_1.useUnifiedProperty)(), usePropertyDetail = _c.usePropertyDetail, useProperties = _c.useProperties;
    // Test the consolidated property search hook with debouncing
    var _d = (0, useConsolidatedPropertySearch_1.useConsolidatedPropertySearch)(), searchParams = _d.searchParams, searchResults = _d.properties, searchLoading = _d.isLoading, updateSearch = _d.updateSearch, clearSearch = _d.clearSearch, hasActiveFilters = _d.hasActiveFilters;
    // Test individual property fetch
    var _e = usePropertyDetail(testPropertyId), singleProperty = _e.data, propertyLoading = _e.isLoading, propertyError = _e.error;
    // Test properties list
    var _f = useProperties({ limit: 5 }), propertiesList = _f.data, listLoading = _f.isLoading;
    var hasValidData = Boolean(singleProperty);
    var handleSearchUpdate = function (field, value) {
        var _a;
        updateSearch((_a = {}, _a[field] = value, _a));
    };
    var handleTestProperty = function () {
        // Test with a sample property ID
        setTestPropertyId('84');
    };
    var handleCancelRequests = function () {
        // Cancel functionality is now handled internally by the unified hooks
        console.log('Cancel requests - handled internally by unified hooks');
    };
    return (<div className="p-6 space-y-6">
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Property API Test Component</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            This component tests the fixed property hooks to ensure no infinite API calls occur.
          </div>
          
          {/* Search Test */}
          <div className="space-y-2">
            <h3 className="font-semibold">Search Test (Debounced)</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Search query..." value={searchParams.query} onChange={function (e) { return handleSearchUpdate('query', e.target.value); }} className="border rounded px-2 py-1"/>
              <input type="text" placeholder="Location..." value={searchParams.location} onChange={function (e) { return handleSearchUpdate('location', e.target.value); }} className="border rounded px-2 py-1"/>
              <button_1.Button onClick={clearSearch} variant="outline" size="sm">
                Clear
              </button_1.Button>
            </div>
            <div className="text-xs text-gray-500">
              Active filters: {hasActiveFilters ? 'Yes' : 'No'} | 
              Loading: {searchLoading ? 'Yes' : 'No'} | 
              Results: {(searchResults === null || searchResults === void 0 ? void 0 : searchResults.length) || 0}
            </div>
          </div>

          {/* Single Property Test */}
          <div className="space-y-2">
            <h3 className="font-semibold">Single Property Test</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Property ID..." value={testPropertyId} onChange={function (e) { return setTestPropertyId(e.target.value); }} className="border rounded px-2 py-1"/>
              <button_1.Button onClick={handleTestProperty} size="sm">
                Test Property 84
              </button_1.Button>
            </div>
            <div className="text-xs text-gray-500">
              Loading: {propertyLoading ? 'Yes' : 'No'} | 
              Has Data: {hasValidData ? 'Yes' : 'No'} | 
              Error: {propertyError ? 'Yes' : 'No'}
            </div>
            {singleProperty && (<div className="text-xs bg-gray-100 p-2 rounded">
                Property: {singleProperty.title} - {singleProperty.location}
              </div>)}
          </div>

          {/* Properties List Test */}
          <div className="space-y-2">
            <h3 className="font-semibold">Properties List Test</h3>
            <div className="flex gap-2">
              <button_1.Button onClick={handleCancelRequests} variant="outline" size="sm">
                Cancel Requests
              </button_1.Button>
            </div>
            <div className="text-xs text-gray-500">
              Loading: {listLoading ? 'Yes' : 'No'} | 
              Count: {((_a = propertiesList === null || propertiesList === void 0 ? void 0 : propertiesList.data) === null || _a === void 0 ? void 0 : _a.length) || 0}
            </div>
            {listLoading && (<div className="flex items-center gap-2 text-sm">
                <lucide_react_1.Loader2 className="w-4 h-4 animate-spin"/>
                Loading properties...
              </div>)}
          </div>

          {/* Debug Info */}
          <div className="mt-4 p-3 bg-yellow-50 rounded">
            <h4 className="font-semibold text-sm">Debug Info</h4>
            <div className="text-xs text-gray-600 mt-1">
              Check the browser's Network tab to verify that API calls are not repeating infinitely.
              The debounced search should only trigger after you stop typing for 500ms.
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
exports.default = PropertyTestComponent;
