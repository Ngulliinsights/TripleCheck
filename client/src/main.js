"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
var client_1 = require("react-dom/client");
var react_router_dom_1 = require("react-router-dom");
var App_1 = require("./app/App");
var providers_1 = require("./app/providers");
// TODO: Locate and import globals CSS after directory restructuring
// import "./shared/styles/globals.css";
// Initialize MSW for development (non-blocking)
if (import.meta.env.DEV) {
    // Missing module: ./shared/test-utils/msw-browser
    // import('./shared/test-utils/msw-browser').then(({ startMswWorker }) => {
    //   startMswWorker().catch((error: unknown) => {
    //     console.warn('MSW worker failed to start:', error);
    //   });
    // }).catch((error: unknown) => {
    //   console.warn('Failed to load MSW:', error);
    // });
}
// Development logging
if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("Starting TripleCheck application...");
    // eslint-disable-next-line no-console
    console.log("Environment:", import.meta.env.MODE);
    // eslint-disable-next-line no-console
    console.log("Base URL:", import.meta.env.BASE_URL);
}
// Create query client for the full app
var queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
// Add error boundary for production debugging
var rootElement = document.getElementById("root");
if (!rootElement) {
    // eslint-disable-next-line no-console
    console.error("Root element not found!");
    document.body.innerHTML = "\n    <div style=\"padding: 20px; color: red; font-family: monospace;\">\n      <h2>Critical Error: Root element not found</h2>\n      <p>The application failed to find the root element.</p>\n    </div>\n  ";
    throw new Error("Root element not found");
}
// Using full TripleCheck app with proper React Router bundling
if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("Loading full TripleCheck application for competition...");
}
// Initialize theme preference (let ThemeProvider handle the actual theme application)
if (typeof window !== 'undefined') {
    // Clear any conflicting theme state and let ThemeProvider handle initialization
    // The ThemeProvider default is already set to 'dark' in ThemeContext.tsx
}
// Simple React availability check
if (!react_1.default || !client_1.default) {
    console.error("React or ReactDOM not loaded");
    document.body.innerHTML = "\n    <div style=\"padding: 20px; color: red; font-family: monospace;\">\n      <h2>Application Loading Error</h2>\n      <p>Failed to load React libraries. Please refresh the page.</p>\n    </div>\n  ";
    throw new Error("React or ReactDOM not available");
}
// Render with better error handling for production builds
var renderApp = function () {
    try {
        var root = client_1.default.createRoot(rootElement);
        root.render(<react_1.default.StrictMode>
        <react_query_1.QueryClientProvider client={queryClient}>
          <react_router_dom_1.BrowserRouter>
            <providers_1.AppProviders>
              <App_1.default />
            </providers_1.AppProviders>
          </react_router_dom_1.BrowserRouter>
        </react_query_1.QueryClientProvider>
      </react_1.default.StrictMode>);
        if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log("Full TripleCheck app rendered successfully");
        }
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to render TripleCheck app:", error);
        // More robust fallback error display
        var errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'padding: 20px; color: red; font-family: monospace; background: white; margin: 20px; border: 1px solid red;';
        errorDiv.innerHTML = "\n      <h2>TripleCheck Failed to Load</h2>\n      <p><strong>Error:</strong> ".concat(error instanceof Error ? error.message : 'Unknown error', "</p>\n      <p><strong>Environment:</strong> ").concat(import.meta.env.MODE, "</p>\n      <p><strong>Suggestion:</strong> Try refreshing the page or clearing your browser cache</p>\n      <details>\n        <summary>Technical Details</summary>\n        <pre>").concat(error instanceof Error ? error.stack : 'No stack trace available', "</pre>\n      </details>\n    ");
        rootElement.appendChild(errorDiv);
        // Also try to render a minimal fallback
        setTimeout(function () {
            try {
                var fallbackRoot = client_1.default.createRoot(rootElement);
                fallbackRoot.render(<div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Loading...</h1>
            <p>If this message persists, please refresh the page.</p>
          </div>);
            }
            catch (fallbackError) {
                // eslint-disable-next-line no-console
                console.error("Even fallback render failed:", fallbackError);
            }
        }, 1000);
    }
};
renderApp();
