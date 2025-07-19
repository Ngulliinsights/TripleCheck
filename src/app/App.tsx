import React, { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/infrastructure/api/queryClient";
import { initializeHealthMonitoring } from "@/infrastructure/monitoring/system-health";
import { Toaster } from "@/shared/components/ui/toaster";
import { ErrorBoundary } from "./error-boundary";
import { TutorialProvider } from "@/shared/components/TutorialProvider";
import { AppRouter } from "./router";

/**
 * Root application component that sets up global providers
 * and initializes system-wide functionality
 * 
 * This component:
 * - Sets up React Query for data fetching and caching
 * - Initializes error boundaries for graceful error handling
 * - Provides tutorial context for user onboarding
 * - Initializes system health monitoring
 * - Renders the main router with all application routes
 */
export function App() {
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