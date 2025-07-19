import React, { useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../infrastructure/api/queryClient";
import { initializeHealthMonitoring } from "../infrastructure/monitoring/system-health";
import { Toaster } from "../shared/components/ui/toaster";
import { ErrorBoundary } from "./error-boundary";
import { TutorialProvider } from "../../client/src/components/tutorial/TutorialProvider";

// Import the new layout component that handles navigation
import { AppLayout } from "../../client/src/app/applayout";

// Eager-loaded components for critical user paths
import HomePage from "../../client/src/pages/home";
import DashboardPage from "../user/pages/Dashboard";
import InboxPage from "../communication/pages/Inbox";
import PropertyComparePage from "../property/pages/PropertyCompare";
import PropertyPhotosPage from "../../client/src/pages/properties/photos";
import PropertyOptimizePage from "../../client/src/pages/properties/optimize";
import PropertyEditPage from "../property/pages/PropertyEdit";
import PropertyPage from "../property/pages/PropertyDetails";
import BlogPage from "../../client/src/pages/blog";
import NotFound from "../../client/src/pages/not-found";

// Lazy-loaded components for less critical features
const TestFunctionalityPage = React.lazy(() => import("../../client/src/pages/test-functionality"));

// Nested routing modules for organized feature areas
import AuthRoutes from "../../client/src/pages/auth/index";
import ServicesRoutes from "../../client/src/pages/services/index";
import StaticRoutes from "../../client/src/pages/static/index";

/**
 * Main routing component that handles all application routes
 * Uses React.Suspense for lazy-loaded components and proper error boundaries
 */
function AppRouter() {
  return (
    <div className="min-h-screen bg-background">
      <AppLayout>
        <main>
          <Switch>
            {/* Critical user paths - eagerly loaded */}
            <Route path="/" component={HomePage} />
            
            {/* Property-related routes with proper parameter handling */}
            <Route path="/property/:id">
              {(params) => <PropertyPage id={params.id} />}
            </Route>
            <Route path="/property/:id/edit">
              {(params) => <PropertyEditPage id={params.id} />}
            </Route>
            
            {/* Core application features */}
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/inbox" component={InboxPage} />
            <Route path="/compare" component={PropertyComparePage} />
            
            {/* Property management tools */}
            <Route path="/properties/photos" component={PropertyPhotosPage} />
            <Route path="/properties/optimize" component={PropertyOptimizePage} />
            
            {/* Blog with optional post parameter */}
            <Route path="/blog" component={BlogPage} />
            <Route path="/blog/:id" component={BlogPage} />
            
            {/* Nested routing for organized feature areas */}
            <Route path="/auth/*">
              <AuthRoutes />
            </Route>
            
            <Route path="/services/*">
              <ServicesRoutes />
            </Route>
            
            <Route path="/static/*">
              <StaticRoutes />
            </Route>
            
            {/* Test functionality - lazy loaded with proper error handling */}
            <Route path="/test-functionality">
              <React.Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                }
              >
                <TestFunctionalityPage />
              </React.Suspense>
            </Route>
            
            {/* Catch-all route for 404 handling */}
            <Route component={NotFound} />
          </Switch>
        </main>
      </AppLayout>
    </div>
  );
}

/**
 * Root application component that sets up global providers
 * and initializes system-wide functionality
 */
function App() {
  // Initialize system health monitoring on app startup
  // This runs once when the app mounts, not on every render
  useEffect(() => {
    initializeHealthMonitoring();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TutorialProvider>
          <AppRouter />
          <Toaster />
        </TutorialProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;