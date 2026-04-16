"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyHooksTestApp = PropertyHooksTestApp;
var react_query_1 = require("@tanstack/react-query");
var useUnifiedProperty_1 = require("./property/hooks/useUnifiedProperty");
var useConsolidatedPropertySearch_1 = require("./property/hooks/useConsolidatedPropertySearch");
// Create a test query client
var testQueryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: 0, // Always fetch for testing
        },
    },
});
// CSS classes for styling
var styles = {
    container: "p-5 font-sans",
    title: "text-blue-600 text-2xl font-bold mb-4",
    section: "mt-5 p-4 border border-gray-300 rounded-lg",
    sectionTitle: "text-lg font-semibold mb-2",
    button: "mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600",
    buttonSecondary: "px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600",
    propertyInfo: "mt-2 p-2 bg-gray-100 rounded",
    status: "mt-5 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800",
};
function PropertyHooksTestComponent() {
    var _a;
    // Development logging for debugging
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("PropertyHooksTestComponent rendering...");
    }
    // Get unified property hooks
    var _b = (0, useUnifiedProperty_1.useUnifiedProperty)(), usePropertyDetail = _b.usePropertyDetail, useProperties = _b.useProperties;
    // Test consolidated property search hook
    var _c = (0, useConsolidatedPropertySearch_1.useConsolidatedPropertySearch)(), searchParams = _c.searchParams, searchResults = _c.properties, searchLoading = _c.isLoading, updateSearch = _c.updateSearch, clearSearch = _c.clearSearch, hasActiveFilters = _c.hasActiveFilters;
    // Test individual property hook
    var _d = usePropertyDetail("1"), singleProperty = _d.data, propertyLoading = _d.isLoading, propertyError = _d.error;
    // Test properties list hook with proper search params
    var _e = useProperties({
        query: "",
        page: 1,
        sortBy: "date",
        sortOrder: "desc",
        limit: 5,
    }), propertiesList = _e.data, listLoading = _e.isLoading;
    var hasValidData = Boolean(singleProperty);
    var handleSearchTest = function () {
        updateSearch({ query: "test property", location: "Nairobi" });
    };
    var handleClearTest = function () {
        clearSearch();
    };
    var handleCancelTest = function () {
        // Cancel functionality is now handled internally by the unified hooks
        console.log('Cancel requests - handled internally by unified hooks');
    };
    return (<div className={styles.container}>
      <h1 className={styles.title}>Property Hooks Test</h1>

      {/* Search Test */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Search Hook Test</h2>
        <p>Loading: {searchLoading ? "Yes" : "No"}</p>
        <p>Has Active Filters: {hasActiveFilters ? "Yes" : "No"}</p>
        <p>Results Count: {(searchResults === null || searchResults === void 0 ? void 0 : searchResults.length) || 0}</p>
        <p>Current Query: &quot;{searchParams.query}&quot;</p>
        <p>Current Location: &quot;{searchParams.location}&quot;</p>

        <div className="mt-2">
          <button type="button" onClick={handleSearchTest} className={styles.button}>
            Test Search
          </button>
          <button type="button" onClick={handleClearTest} className={styles.buttonSecondary}>
            Clear Search
          </button>
        </div>
      </div>

      {/* Single Property Test */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Single Property Hook Test</h2>
        <p>Loading: {propertyLoading ? "Yes" : "No"}</p>
        <p>Has Valid Data: {hasValidData ? "Yes" : "No"}</p>
        <p>Error: {propertyError ? "Yes" : "No"}</p>
        {singleProperty && (<div className={styles.propertyInfo}>
            <p>Property Title: {singleProperty.title}</p>
            <p>
              Property Location:{" "}
              {typeof singleProperty.location === "string" ?
                singleProperty.location
                : JSON.stringify(singleProperty.location)}
            </p>
            <p>Property Price: ${singleProperty.price}</p>
          </div>)}
      </div>

      {/* Properties List Test */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Properties List Hook Test</h2>
        <p>Loading: {listLoading ? "Yes" : "No"}</p>
        <p>Properties Count: {((_a = propertiesList === null || propertiesList === void 0 ? void 0 : propertiesList.data) === null || _a === void 0 ? void 0 : _a.length) || 0}</p>
        <p>Total: {(propertiesList === null || propertiesList === void 0 ? void 0 : propertiesList.total) || 0}</p>

        <div className="mt-2">
          <button type="button" onClick={handleCancelTest} className={styles.buttonSecondary}>
            Cancel Requests
          </button>
        </div>
      </div>

      {/* Status */}
      <div className={styles.status}>
        <h3>✅ Property Hooks Test Status</h3>
        <p>
          If you can see this component, the property hooks are not preventing
          rendering!
        </p>
        <p>
          Check the browser&apos;s Network tab to verify API calls are working
          correctly.
        </p>
        <p>
          The hooks should prevent infinite loops and provide proper debouncing.
        </p>
      </div>
    </div>);
}
function PropertyHooksTestApp() {
    // Development logging for debugging
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("PropertyHooksTestApp rendering...");
    }
    return (<react_query_1.QueryClientProvider client={testQueryClient}>
      <PropertyHooksTestComponent />
    </react_query_1.QueryClientProvider>);
}
exports.default = PropertyHooksTestApp;
