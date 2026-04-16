"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSafeHooksApp = TestSafeHooksApp;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
var useSafeQuery_1 = require("./local/hooks/useSafeQuery");
// Create a simple query client for testing
var testQueryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
        },
    },
});
// Simple test component using safe hooks
function TestSafeHooksComponent() {
    console.log('TestSafeHooksComponent rendering...');
    // Test basic safe query
    var _a = (0, useSafeQuery_1.useSafeQuery)({
        endpoint: '/api/test',
        method: 'GET',
        fallbackData: { message: 'Fallback data working!' },
        validator: function (data) {
            console.log('Validator called with:', data);
            return data || null;
        },
        enabled: true,
        context: 'test',
    }), data = _a.data, isLoading = _a.isLoading, error = _a.error, hasValidData = _a.hasValidData;
    console.log('Hook results:', { data: data, isLoading: isLoading, error: error, hasValidData: hasValidData });
    return (<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>Safe Hooks Test</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Hook Status:</h2>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Has Valid Data: {hasValidData ? 'Yes' : 'No'}</p>
        <p>Error: {error ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Data:</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px', color: 'blue' }}>
        <p>If you can see this, the safe hooks are working and not preventing component rendering!</p>
      </div>
    </div>);
}
// Wrapper with QueryClient provider
function TestSafeHooksApp() {
    console.log('TestSafeHooksApp rendering...');
    return (<react_query_1.QueryClientProvider client={testQueryClient}>
      <TestSafeHooksComponent />
    </react_query_1.QueryClientProvider>);
}
exports.default = TestSafeHooksApp;
