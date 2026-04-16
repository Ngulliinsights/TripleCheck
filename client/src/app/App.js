"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
exports.AppLayout = AppLayout;
var react_1 = require("react");
var Footer_1 = require("../local/components/layout/Footer");
var Navigation_1 = require("../local/components/layout/Navigation");
var NavigationErrorBoundary_1 = require("../local/components/navigation/NavigationErrorBoundary");
var error_boundary_1 = require("./error-boundary");
var router_1 = require("./router");
/**
 * Main Application Layout
 *
 * Provides the core structure for the entire application including:
 * - Header navigation with error boundaries
 * - Main content area
 * - Footer with error boundaries
 * - Responsive layout structure
 */
function AppLayout(_a) {
    var children = _a.children;
    return (<div className="min-h-screen flex flex-col">
      {/* Navigation Header with dedicated error boundary */}
      <error_boundary_1.ErrorBoundary>
        <NavigationErrorBoundary_1.NavigationErrorBoundary>
          <Navigation_1.Navigation />
        </NavigationErrorBoundary_1.NavigationErrorBoundary>
      </error_boundary_1.ErrorBoundary>

      {/* Main Content Area */}
      <error_boundary_1.ErrorBoundary>
        <main className="flex-1 transparent-navbar-content">{children}</main>
      </error_boundary_1.ErrorBoundary>

      {/* Footer with error boundary */}
      <error_boundary_1.ErrorBoundary>
        <Footer_1.Footer />
      </error_boundary_1.ErrorBoundary>
    </div>);
}
function useApplicationInitialization() {
    (0, react_1.useEffect)(function () {
        // eslint-disable-next-line no-console
        console.log("TripleCheck Application Shell initialized");
        // Global application setup
        if (typeof window !== "undefined") {
            // eslint-disable-next-line no-console
            console.log("Environment:", import.meta.env.MODE);
            // eslint-disable-next-line no-console
            console.log("Base URL:", import.meta.env.BASE_URL);
            // eslint-disable-next-line no-console
            console.log("Window location:", window.location.href);
            // eslint-disable-next-line no-console
            console.log("Document ready state:", document.readyState);
            // eslint-disable-next-line no-console
            console.log("Root element exists:", !!document.getElementById("root"));
        }
    }, []);
}
exports.App = (0, react_1.memo)(function () {
    useApplicationInitialization();
    return (<error_boundary_1.ErrorBoundary>
      <AppLayout>
        <router_1.AppRouter />
      </AppLayout>
    </error_boundary_1.ErrorBoundary>);
});
exports.App.displayName = "App";
exports.default = exports.App;
