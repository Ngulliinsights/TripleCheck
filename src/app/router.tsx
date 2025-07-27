import React from "react";
import { Routes, Route, useParams, useLocation, useNavigate } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { LoadingSkeleton } from "../shared/components/ui/loading-skeleton";
import { AppLayout } from "../shared/components/layout/AppLayout";
import { ErrorBoundary } from "./error-boundary";
import { RoutePerformanceMonitor } from "../infrastructure/routing/RoutePerformanceMonitor";
import { useRoutePreloader } from "../infrastructure/routing/useRoutePreloader";
import { WorkingRoutes, preloadRoutes } from "./lazy-routes";
import { routePreloader } from "../infrastructure/routing/route-preloader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../shared/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "../shared/components/ui/button";
import { logger } from "../shared/utils/logger";

/**
 * Enhanced wrapper components for handling URL parameters with react-router-dom v6
 * Includes proper parameter validation, loading states, and error handling
 */

// Enhanced interface for route parameters with validation
interface RouteParams {
  id?: string;
  [key: string]: string | undefined;
}

// Enhanced component props interface - compatible with LazyComponent
interface ComponentWithParams extends Record<string, unknown> {
  id?: string;
  params?: RouteParams;
  isLoading?: boolean;
  error?: Error | null;
}

// Utility function to validate route parameters
const validateRouteParams = (
  params: RouteParams,
  requiredParams: string[] = []
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const param of requiredParams) {
    if (!params[param] || params[param]?.trim() === "") {
      errors.push(`Missing required parameter: ${param}`);
    }
  }

  // Validate ID format if present
  if (params.id) {
    // Check if ID is a valid format (numbers, letters, hyphens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(params.id)) {
      errors.push("Invalid ID format");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Enhanced PropertyDetailsWrapper with comprehensive parameter handling
function PropertyDetailsWrapper({
  component: Component,
  preload,
}: {
  component: React.ComponentType<ComponentWithParams>;
  preload: () => void;
}) {
  const params = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [preloadCompleted, setPreloadCompleted] = React.useState(false);

  // Validate parameters
  const validation = validateRouteParams(params, ["id"]);

  // Handle preloading with error handling
  React.useEffect(() => {
    const handlePreload = async () => {
      if (preloadCompleted) return;

      try {
        setIsLoading(true);
        setError(null);
        preload();
        setPreloadCompleted(true);
      } catch (preloadError) {
        logger.warn("Preload failed for property details:", preloadError);
        setError(
          preloadError instanceof Error ? preloadError : (
            new Error("Preload failed")
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

    handlePreload();
  }, [preload, preloadCompleted]);

  // Handle parameter validation errors
  if (!validation.isValid) {
    return (
      <ErrorBoundary level="route">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Invalid Route Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                The URL parameters are invalid or missing:
              </p>
              <ul className="text-sm text-red-600 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  // Show loading state while preloading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSkeleton
          variant="detailed"
          className="w-full max-w-4xl mx-auto p-6"
        />
      </div>
    );
  }

  // Show error state if preloading failed
  if (error) {
    return (
      <ErrorBoundary level="route" showErrorDetails={true}>
        <div>Error loading property details</div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="component">
      <Component
        id={params.id}
        params={params}
        isLoading={false}
        error={null}
      />
    </ErrorBoundary>
  );
}

// Enhanced PropertyEditWrapper with parameter validation and error handling
function PropertyEditWrapper({
  component: Component,
}: {
  component: React.ComponentType<ComponentWithParams>;
}) {
  const params = useParams<{ id: string }>();

  // Validate parameters
  const validation = validateRouteParams(params, ["id"]);

  // Handle parameter validation errors
  if (!validation.isValid) {
    return (
      <ErrorBoundary level="route">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Invalid Property ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Cannot edit property with invalid parameters:
              </p>
              <ul className="text-sm text-red-600 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="component">
      <Component
        id={params.id}
        params={params}
        isLoading={false}
        error={null}
      />
    </ErrorBoundary>
  );
}

// Enhanced BlogPostWrapper with parameter validation
function BlogPostWrapper({
  component: Component,
}: {
  component: React.ComponentType<ComponentWithParams>;
}) {
  const params = useParams<{ id: string }>();

  // Validate parameters
  const validation = validateRouteParams(params, ["id"]);

  // Handle parameter validation errors
  if (!validation.isValid) {
    return (
      <ErrorBoundary level="route">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Blog Post Not Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The blog post ID is invalid or missing.
              </p>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="component">
      <Component id={params.id} params={params} />
    </ErrorBoundary>
  );
}

/**
 * Enhanced routing component with comprehensive error handling
 * Uses React.Suspense for lazy-loaded components and proper error boundaries
 * Integrates with AppLayout for consistent navigation and structure
 *
 * Features:
 * - Route-level error boundaries with recovery options
 * - Enhanced loading states with timeout handling
 * - Navigation crash prevention
 * - Route preloading optimization for improved performance
 */
export function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const [routeError, setRouteError] = useState<Error | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  // Enhanced route preloader with comprehensive error handling
  const { preloadDomainRoutes, preloadByUserBehavior } = useRoutePreloader({
    enableHoverPreloading: true,
    enableViewportPreloading: false, // Disabled to prevent crashes
    preloadOnMount: ["/features", "/pricing"],
    strategy: "hover",
  });

  // Safe navigation helper to prevent crashes
  const safeNavigate = React.useCallback((path: string) => {
    try {
      setRouteError(null);
      navigate(path);
    } catch (error) {
      console.error('Navigation failed:', error);
      setRouteError(error instanceof Error ? error : new Error('Navigation failed'));
      // Fallback to window.location
      window.location.href = path;
    }
  }, [navigate]);

  // Initialize route preloader with error handling
  useEffect(() => {
    try {
      routePreloader.initialize();
    } catch (error) {
      logger.warn("Route preloader initialization failed:", error);
      // Continue without preloading if initialization fails
    }
  }, []);

  // Simplified route loading without hanging issues
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Reset states immediately
    setIsRouteLoading(false);
    setRouteError(null);

    // Optional background preloading (non-blocking)
    const preloadInBackground = async () => {
      try {
        if (currentPath.startsWith("/property")) {
          await preloadDomainRoutes("property").catch(() => {
            // Silently fail - don't block navigation
          });
        } else if (currentPath.startsWith("/services") || currentPath.startsWith("/trust")) {
          await preloadDomainRoutes("trust").catch(() => {
            // Silently fail - don't block navigation
          });
        } else if (currentPath.startsWith("/dashboard") || currentPath.startsWith("/user")) {
          await preloadDomainRoutes("user").catch(() => {
            // Silently fail - don't block navigation
          });
        } else if (currentPath === "/") {
          await preloadByUserBehavior(["/features", "/pricing"]).catch(() => {
            // Silently fail - don't block navigation
          });
        }
      } catch (error) {
        // Silently handle preload errors - don't affect navigation
        logger.warn("Background preload failed:", error);
      }
    };

    // Run preloading in background without blocking
    preloadInBackground();
  }, [location.pathname, preloadDomainRoutes, preloadByUserBehavior]);

  // Route error recovery component
  const RouteErrorRecovery = () => (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Navigation Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {routeError?.message || 'Something went wrong while navigating. This is usually temporary.'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRouteError(null);
                window.location.reload();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload
            </Button>
            <Button
              onClick={() => {
                setRouteError(null);
                safeNavigate('/');
              }}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Show route error if present
  if (routeError) {
    return (
      <div className="min-h-screen bg-background">
        <AppLayout>
          <RouteErrorRecovery />
        </AppLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Route Performance Monitor - only visible in development */}
      <RoutePerformanceMonitor position="bottom-right" minimized={true} />

      <AppLayout>
        <main>
          <ErrorBoundary level="route" onError={(error) => setRouteError(error)}>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <LoadingSkeleton
                    variant="page"
                    className="w-full max-w-6xl mx-auto p-6"
                    showSpinner={true}
                    itemCount={6}
                  />
                </div>
              }
            >
              <Routes>
                {/* Critical user paths - Home and marketing pages */}
                <Route path="/" element={<WorkingRoutes.Home />} />
                <Route path="/features" element={<WorkingRoutes.Features />} />
                <Route path="/pricing" element={<WorkingRoutes.Pricing />} />

                {/* Authentication routes */}
                <Route path="/auth/login" element={<WorkingRoutes.Login />} />
                <Route
                  path="/auth/register"
                  element={<WorkingRoutes.Register />}
                />

                {/* Property routes with parameter handling and preloading */}
                <Route
                  path="/property/:id"
                  element={
                    <PropertyDetailsWrapper
                      component={WorkingRoutes.PropertyDetails}
                      preload={() => {
                        // Enhanced preloading with error handling
                        try {
                          preloadRoutes.property().catch((error) => {
                            logger.warn(
                              "Failed to preload property routes:",
                              error
                            );
                          });
                        } catch (error) {
                          logger.warn("Property preload error:", error);
                        }
                      }}
                    />
                  }
                />
                <Route
                  path="/property/:id/edit"
                  element={
                    <PropertyEditWrapper
                      component={WorkingRoutes.PropertyEdit}
                    />
                  }
                />
                <Route
                  path="/compare"
                  element={<WorkingRoutes.PropertyCompare />}
                />

                {/* User management routes */}
                <Route
                  path="/dashboard"
                  element={<WorkingRoutes.Dashboard />}
                />
                <Route path="/team" element={<WorkingRoutes.Team />} />

                {/* Services landing and individual service routes */}
                <Route path="/services" element={<WorkingRoutes.Services />} />
                <Route
                  path="/services/basic-checks"
                  element={<WorkingRoutes.BasicChecks />}
                />
                <Route
                  path="/services/fraud-detection"
                  element={<WorkingRoutes.FraudDetection />}
                />
                <Route
                  path="/services/document-auth"
                  element={<WorkingRoutes.DocumentAuth />}
                />
                <Route
                  path="/services/reports"
                  element={<WorkingRoutes.Reports />}
                />
                <Route
                  path="/services/alerts"
                  element={<WorkingRoutes.Alerts />}
                />
                <Route
                  path="/services/karma"
                  element={<WorkingRoutes.Karma />}
                />
                <Route
                  path="/services/reputation"
                  element={<WorkingRoutes.Reputation />}
                />
                <Route
                  path="/services/trust-points"
                  element={<WorkingRoutes.TrustPoints />}
                />
                <Route
                  path="/services/reviews"
                  element={<WorkingRoutes.Reviews />}
                />
                <Route
                  path="/services/list-property"
                  element={<WorkingRoutes.ListProperty />}
                />
                <Route
                  path="/services/resources"
                  element={<WorkingRoutes.Resources />}
                />
                <Route
                  path="/services/tenants"
                  element={<WorkingRoutes.Tenants />}
                />

                {/* Solution-specific routes for different user types */}
                <Route
                  path="/solutions"
                  element={<WorkingRoutes.Solutions />}
                />
                <Route
                  path="/solutions/buyers"
                  element={<WorkingRoutes.SolutionsBuyers />}
                />
                <Route
                  path="/solutions/sellers"
                  element={<WorkingRoutes.SolutionsSellers />}
                />
                <Route
                  path="/solutions/agents"
                  element={<WorkingRoutes.SolutionsAgents />}
                />
                <Route
                  path="/solutions/developers"
                  element={<WorkingRoutes.SolutionsDevelopers />}
                />

                {/* Help and support routes */}
                <Route path="/help" element={<WorkingRoutes.Help />} />
                <Route
                  path="/help/getting-started"
                  element={<WorkingRoutes.HelpGettingStarted />}
                />
                <Route
                  path="/help/verification-guide"
                  element={<WorkingRoutes.HelpVerification />}
                />
                <Route path="/help/faq" element={<WorkingRoutes.HelpFAQ />} />
                <Route path="/contact" element={<WorkingRoutes.Contact />} />

                {/* Property browsing routes */}
                <Route
                  path="/properties"
                  element={<WorkingRoutes.Properties />}
                />
                <Route
                  path="/properties/my"
                  element={<WorkingRoutes.MyProperties />}
                />
                <Route
                  path="/properties/residential"
                  element={<WorkingRoutes.PropertiesResidential />}
                />
                <Route
                  path="/properties/commercial"
                  element={<WorkingRoutes.PropertiesCommercial />}
                />
                <Route
                  path="/properties/land"
                  element={<WorkingRoutes.PropertiesLand />}
                />

                {/* Additional property management routes */}
                <Route
                  path="/property/:id/photos"
                  element={
                    <PropertyDetailsWrapper
                      component={WorkingRoutes.PropertyPhotos}
                      preload={() => {
                        // Enhanced preloading with error handling for property photos
                        try {
                          preloadRoutes.property().catch((error) => {
                            logger.warn(
                              "Failed to preload property photo routes:",
                              error
                            );
                          });
                        } catch (error) {
                          logger.warn("Property photos preload error:", error);
                        }
                      }}
                    />
                  }
                />
                <Route
                  path="/property/:id/optimize"
                  element={
                    <PropertyDetailsWrapper
                      component={WorkingRoutes.PropertyOptimize}
                      preload={() => {
                        // Enhanced preloading with error handling for property optimization
                        try {
                          preloadRoutes.property().catch((error) => {
                            logger.warn(
                              "Failed to preload property optimization routes:",
                              error
                            );
                          });
                        } catch (error) {
                          logger.warn(
                            "Property optimization preload error:",
                            error
                          );
                        }
                      }}
                    />
                  }
                />

                {/* Search functionality routes */}
                <Route
                  path="/search"
                  element={<WorkingRoutes.SearchResults />}
                />

                {/* Land Verification routes - Kenya-specific land verification system */}
                <Route
                  path="/land-verification/*"
                  element={<WorkingRoutes.LandVerification />}
                />
                <Route
                  path="/land-verification/dashboard"
                  element={<WorkingRoutes.LandVerificationDashboard />}
                />
                <Route
                  path="/land-verification/new"
                  element={<WorkingRoutes.NewLandVerification />}
                />

                {/* Communication and messaging routes */}
                <Route path="/inbox" element={<WorkingRoutes.Inbox />} />

                {/* Static content and informational routes */}
                <Route path="/about" element={<WorkingRoutes.OurStory />} />
                <Route
                  path="/static/our-story"
                  element={<WorkingRoutes.OurStory />}
                />
                <Route
                  path="/static/partners"
                  element={<WorkingRoutes.Partners />}
                />
                <Route
                  path="/static/press-media"
                  element={<WorkingRoutes.PressMedia />}
                />
                <Route path="/blog" element={<WorkingRoutes.Blog />} />
                <Route
                  path="/blog/:id"
                  element={
                    <BlogPostWrapper component={WorkingRoutes.BlogPost} />
                  }
                />

                {/* Community and fraud resources */}
                <Route
                  path="/community"
                  element={<WorkingRoutes.Community />}
                />
                <Route
                  path="/fraud-resources"
                  element={<WorkingRoutes.FraudResources />}
                />
                <Route
                  path="/resources/fraud"
                  element={<WorkingRoutes.FraudResources />}
                />

                {/* Catch all route for 404 handling */}
                <Route path="*" element={<WorkingRoutes.NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </AppLayout>
    </div>
  );
}
