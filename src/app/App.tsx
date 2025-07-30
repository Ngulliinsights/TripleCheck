import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, Suspense } from "react";

import { RouterFallback } from "../shared/components/fallbacks/RouterFallback";

import { ErrorBoundary } from "./error-boundary";
import { AppRouter } from "./router";

import { queryClient } from "@/infrastructure/api/queryClient";
import { PerformanceMonitoringProvider, PerformanceDebugger } from "@/infrastructure/monitoring";
import { Toaster } from "@/shared/components/ui/toaster";

/**
 * Root application component optimized for performance
 *
 * Performance optimizations:
 * - Lazy loads non-critical components
 * - Defers system health monitoring initialization
 * - Minimizes initial bundle size
 * - Uses efficient error boundaries
 */
export function App() {
  // Defer non-critical initialization to avoid blocking initial render
  useEffect(() => {
    // Use requestIdleCallback for non-critical initialization
    const initializeNonCritical = () => {
      import("@/infrastructure/monitoring/system-health")
        .then((module) => {
          module.initializeHealthMonitoring();
          return undefined; // Explicit return to satisfy ESLint
        })
        .catch((_error) => {
          // Silently handle initialization errors in production
          // In development, errors would be visible in the browser console anyway
        });
    };

    if ("requestIdleCallback" in window) {
      const windowWithCallback = window as Window & {
        requestIdleCallback: (
          callback: () => void,
          options?: { timeout: number }
        ) => void;
      };
      windowWithCallback.requestIdleCallback(initializeNonCritical, {
        timeout: 2000,
      });
    } else {
      setTimeout(initializeNonCritical, 100);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary level="page" fallback={<RouterFallback />}>
        <PerformanceMonitoringProvider
          config={{
            enableAutoPreloading: false, // Disabled to prevent performance issues
            preconnectOrigins: [
              "https://fonts.googleapis.com",
              "https://fonts.gstatic.com",
            ],
            criticalAssets: {
              fonts: ["/fonts/inter-var.woff2"],
              images: ["/images/logo.webp"],
            },
          }}
        >
          <ErrorBoundary level="route" fallback={<RouterFallback />}>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading router...</div>}>
              <AppRouter />
            </Suspense>
          </ErrorBoundary>
          
          <Toaster />
          
          {import.meta.env.MODE === "development" && (
            <PerformanceDebugger />
          )}
        </PerformanceMonitoringProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
