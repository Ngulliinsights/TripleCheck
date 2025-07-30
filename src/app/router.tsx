import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";
import {
  Routes,
  Route,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { AppLayout } from "../shared/components/layout/AppLayout";
import { Button } from "../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../shared/components/ui/card";
import { LoadingSkeleton } from "../shared/components/ui/loading-skeleton";

import { ErrorBoundary } from "./error-boundary";
import { WorkingRoutes } from "./lazy-routes";

/**
 * Enhanced wrapper components for handling URL parameters with react-router-dom v6
 * Includes proper parameter validation, loading states, and error handling
 */

// Enhanced interface for route parameters with validation
interface RouteParams {
  readonly id?: string;
  readonly [key: string]: string | undefined;
}

// Enhanced component props interface - compatible with LazyComponent
// Fixed to handle undefined id properly for TypeScript exactOptionalPropertyTypes
interface ComponentWithParams extends Record<string, unknown> {
  readonly id?: string | undefined;
  readonly params?: RouteParams;
  readonly isLoading?: boolean;
  readonly error?: Error | null;
}

// Utility function to validate route parameters
const validateRouteParams = (
  params: RouteParams,
  requiredParams: readonly string[] = []
): { readonly isValid: boolean; readonly errors: readonly string[] } => {
  const errors: string[] = [];

  for (const param of requiredParams) {
    const paramValue = params[param];
    if (!paramValue || paramValue.trim() === "") {
      errors.push(`Missing required parameter: ${param}`);
    }
  }

  // Validate ID format if present
  if (params.id && !/^[a-zA-Z0-9_-]+$/.test(params.id)) {
    errors.push("Invalid ID format");
  }

  return {
    isValid: errors.length === 0,
    errors: Object.freeze(errors),
  };
};

// Component for displaying parameter validation errors
const ParameterValidationError: React.FC<{
  readonly title: string;
  readonly description: string;
  readonly errors: readonly string[];
}> = ({ title, description, errors }) => (
  <ErrorBoundary level="route">
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          <ul className="text-sm text-red-600 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  </ErrorBoundary>
);

// Generic wrapper for components that require ID parameter validation
const createParameterWrapper = (
  requiredParams: readonly string[],
  errorConfig: {
    readonly title: string;
    readonly description: string;
  }
) => {
  return function ParameterWrapper({
    component: Component,
  }: {
    readonly component: React.ComponentType<ComponentWithParams>;
  }) {
    const params = useParams<{ readonly id: string }>();

    // Validate parameters
    const validation = validateRouteParams(params, requiredParams);

    // Handle parameter validation errors
    if (!validation.isValid) {
      return (
        <ParameterValidationError
          title={errorConfig.title}
          description={errorConfig.description}
          errors={validation.errors}
        />
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
  };
};

// Specialized wrappers using the generic factory
const PropertyDetailsWrapper = createParameterWrapper(["id"], {
  title: "Invalid Route Parameters",
  description: "The URL parameters are invalid or missing:",
});

const PropertyEditWrapper = createParameterWrapper(["id"], {
  title: "Invalid Property ID",
  description: "Cannot edit property with invalid parameters:",
});

const BlogPostWrapper = createParameterWrapper(["id"], {
  title: "Blog Post Not Found",
  description: "The blog post ID is invalid or missing.",
});

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
export function AppRouter(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const [routeError, setRouteError] = useState<Error | null>(null);

  // Safe navigation helper to prevent crashes
  const safeNavigate = React.useCallback(
    (path: string): void => {
      try {
        setRouteError(null);
        navigate(path);
      } catch (error) {
        // Log navigation error in development only
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error("Navigation failed:", error);
        }
        setRouteError(
          error instanceof Error ? error : new Error("Navigation failed")
        );
        // Fallback to window.location
        window.location.href = path;
      }
    },
    [navigate]
  );

  // Simple route change handling without complex preloading
  useEffect(() => {
    // Reset error state on route change
    setRouteError(null);
  }, [location.pathname]);

  // Route error recovery component
  const RouteErrorRecovery = (): JSX.Element => (
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
            {routeError?.message ||
              "Something went wrong while navigating. This is usually temporary."}
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
                safeNavigate("/");
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

  // Add production debugging
  useEffect(() => {
    console.log('Router rendering, current path:', location.pathname);
    
  }, [location.pathname, routeError]);

  return (
    <div className="min-h-screen bg-background">
      <AppLayout>
        <main>
          <ErrorBoundary
            level="route"
            onError={(error) => {
              
              setRouteError(error);
            }}
          >
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
                {/* Core application pages */}
                <Route path="/" element={<WorkingRoutes.Home />} />
                <Route path="/features" element={<WorkingRoutes.Features />} />
                <Route path="/pricing" element={<WorkingRoutes.Pricing />} />

                {/* Authentication routes */}
                <Route path="/auth/login" element={<WorkingRoutes.Login />} />
                <Route path="/auth/register" element={<WorkingRoutes.Register />} />

                {/* User dashboard and management */}
                <Route path="/dashboard" element={<WorkingRoutes.Dashboard />} />
                <Route path="/team" element={<WorkingRoutes.Team />} />
                <Route path="/tenants" element={<WorkingRoutes.Tenants />} />

                {/* Property routes with parameter handling */}
                <Route
                  path="/property/:id"
                  element={
                    <PropertyDetailsWrapper
                      component={WorkingRoutes.PropertyDetails}
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
                  path="/property/:id/photos"
                  element={
                    <PropertyDetailsWrapper
                      component={WorkingRoutes.PropertyPhotos}
                    />
                  }
                />
                <Route
                  path="/property/:id/optimize"
                  element={
                    <PropertyDetailsWrapper
                      component={WorkingRoutes.PropertyOptimize}
                    />
                  }
                />
                <Route path="/compare" element={<WorkingRoutes.PropertyCompare />} />
                <Route path="/list-property" element={<WorkingRoutes.ListProperty />} />
                <Route path="/services/list-property" element={<WorkingRoutes.ListProperty />} />

                {/* Property browsing routes */}
                <Route path="/properties" element={<WorkingRoutes.Properties />} />
                <Route path="/properties/my" element={<WorkingRoutes.MyProperties />} />
                <Route path="/properties/residential" element={<WorkingRoutes.PropertiesResidential />} />
                <Route path="/properties/commercial" element={<WorkingRoutes.PropertiesCommercial />} />
                <Route path="/properties/land" element={<WorkingRoutes.PropertiesLand />} />

                {/* Services and trust features */}
                <Route path="/services" element={<WorkingRoutes.Services />} />
                <Route path="/services/basic-checks" element={<WorkingRoutes.BasicChecks />} />
                <Route path="/services/fraud-detection" element={<WorkingRoutes.FraudDetection />} />
                <Route path="/services/document-auth" element={<WorkingRoutes.DocumentAuth />} />
                <Route path="/services/reports" element={<WorkingRoutes.Reports />} />
                <Route path="/services/alerts" element={<WorkingRoutes.Alerts />} />
                <Route path="/services/karma" element={<WorkingRoutes.Karma />} />
                <Route path="/services/reputation" element={<WorkingRoutes.Reputation />} />
                <Route path="/services/trust-points" element={<WorkingRoutes.TrustPoints />} />
                <Route path="/services/reviews" element={<WorkingRoutes.Reviews />} />

                {/* Solutions for different user types */}
                <Route path="/solutions" element={<WorkingRoutes.Solutions />} />
                <Route path="/solutions/buyers" element={<WorkingRoutes.SolutionsBuyers />} />
                <Route path="/solutions/sellers" element={<WorkingRoutes.SolutionsSellers />} />
                <Route path="/solutions/agents" element={<WorkingRoutes.SolutionsAgents />} />
                <Route path="/solutions/developers" element={<WorkingRoutes.SolutionsDevelopers />} />
                <Route path="/solutions/legal-experts" element={<WorkingRoutes.SolutionsLegalExperts />} />

                {/* Land Verification System - Kenya-specific */}
                <Route path="/land-verification/*" element={<WorkingRoutes.LandVerification />} />
                <Route path="/land-verification/dashboard" element={<WorkingRoutes.LandVerificationDashboard />} />
                <Route path="/land-verification/new" element={<WorkingRoutes.NewLandVerification />} />

                {/* Search and discovery */}
                <Route path="/search" element={<WorkingRoutes.SearchResults />} />

                {/* Communication */}
                <Route path="/inbox" element={<WorkingRoutes.Inbox />} />

                {/* Help and support */}
                <Route path="/help" element={<WorkingRoutes.Help />} />
                <Route path="/help/getting-started" element={<WorkingRoutes.HelpGettingStarted />} />
                <Route path="/help/verification-guide" element={<WorkingRoutes.HelpVerification />} />
                <Route path="/help/faq" element={<WorkingRoutes.HelpFAQ />} />
                <Route path="/contact" element={<WorkingRoutes.Contact />} />

                {/* Content and resources */}
                <Route path="/resources" element={<WorkingRoutes.Resources />} />
                <Route path="/blog" element={<WorkingRoutes.Blog />} />
                <Route
                  path="/blog/:id"
                  element={<BlogPostWrapper component={WorkingRoutes.BlogPost} />}
                />

                {/* Community and fraud resources */}
                <Route path="/community-resources" element={<WorkingRoutes.CommunityAndResources />} />
                <Route path="/community" element={<WorkingRoutes.Community />} />
                <Route path="/fraud-guide" element={<WorkingRoutes.FraudResourcesStandalone />} />
                <Route path="/fraud-resources" element={<WorkingRoutes.FraudResourcesStandalone />} />
                <Route path="/resources/fraud" element={<WorkingRoutes.FraudResourcesStandalone />} />

                {/* Company information */}
                <Route path="/about" element={<WorkingRoutes.OurStory />} />
                <Route path="/static/our-story" element={<WorkingRoutes.OurStory />} />
                <Route path="/static/partners" element={<WorkingRoutes.Partners />} />
                <Route path="/static/press-media" element={<WorkingRoutes.PressMedia />} />

                {/* Legal pages */}
                <Route path="/privacy" element={<WorkingRoutes.Privacy />} />
                <Route path="/terms" element={<WorkingRoutes.Terms />} />
                <Route path="/cookies" element={<WorkingRoutes.Cookies />} />
                <Route path="/security" element={<WorkingRoutes.Security />} />

                {/* Demo and development */}
                <Route path="/mvp-demo" element={<WorkingRoutes.MVPDemo />} />
                <Route
                  path="/dev"
                  element={
                    import.meta.env.MODE === "development" ?
                      <WorkingRoutes.DeveloperDashboard />
                    : <WorkingRoutes.NotFound />
                  }
                />

                {/* 404 fallback */}
                <Route path="*" element={<WorkingRoutes.NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </AppLayout>
    </div>
  );
}
