import React, { useEffect, memo } from "react"

import { Footer } from '../local/components/layout/Footer"
import { Navigation } from '../local/components/layout/Navigation"
import { NavigationErrorBoundary } from '../local/components/navigation/NavigationErrorBoundary"

import { ErrorBoundary } from "./error-boundary"
import { AppRouter } from "./router"

/**
 * Core Application Shell & Layout
 *
 * Responsibilities:
 * - Application initialization and global setup
 * - Main application layout structure
 * - Navigation and footer integration
 * - Global and layout-level error boundaries
 * - Performance monitoring and debugging
 *
 * Does NOT handle:
 * - Routing logic (delegated to AppRouter)
 * - Individual page layouts (handled by page components)
 * - Reusable layout components (handled by shared/components/layout)
 */

interface AppLayoutProps {
  readonly children: React.ReactNode;
}

/**
 * Main Application Layout
 *
 * Provides the core structure for the entire application including:
 * - Header navigation with error boundaries
 * - Main content area
 * - Footer with error boundaries
 * - Responsive layout structure
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header with dedicated error boundary */}
      <ErrorBoundary>
        <NavigationErrorBoundary>
          <Navigation />
        </NavigationErrorBoundary>
      </ErrorBoundary>

      {/* Main Content Area */}
      <ErrorBoundary>
        <main className="flex-1 transparent-navbar-content">{children}</main>
      </ErrorBoundary>

      {/* Footer with error boundary */}
      <ErrorBoundary>
        <Footer />
      </ErrorBoundary>
    </div>
  );
}

function useApplicationInitialization(): void {
  useEffect(() => {
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

export const App = memo(() => {
  useApplicationInitialization();

  return (
    <ErrorBoundary>
      <AppLayout>
        <AppRouter />
      </AppLayout>
    </ErrorBoundary>
  );
});

App.displayName = "App";

export default App;
