/* ------------------------------------------------------------------ */
/*  Imports                                                           */
/* ------------------------------------------------------------------ */
import {
  Search,
  ArrowRight,
  CheckCircle,
  Globe,
  Star,
  Shield,
} from "lucide-react";
import { useState, useCallback, memo, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Fixed import order to satisfy eslint import/order rule
import { CompareBar } from "../../property/components/CompareBar";
import { CompareModal } from "../../property/components/CompareModal";
import FraudIntelligence from "../components/CommunityInsights";
import { EnhancedHero } from "../components/hero/EnhancedHero";
import { NewsBlog } from "../components/NewsBlog";
import { PropertyCard } from "../components/property";
import { ServiceCategories } from "../components/ServiceCategories";
import { EnhancedTestimonials as Testimonials } from "../components/Testimonials";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { VideoModal } from "../components/VideoModal";
import { usePageSpacing } from "../hooks/useNavigationSpacing";
import { useSafePropertiesQuery } from "../hooks/useSafeQuery";
import type { Property, NormalizedProperty } from "../types/property";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface PricingPlan {
  readonly id: string;
  readonly name: string;
  readonly price: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly isPopular: boolean;
  readonly buttonVariant: "default" | "outline" | "coral";
  readonly buttonText?: string;
  readonly africanFocus?: readonly string[];
}

interface PropertyGridProps {
  readonly properties?: readonly Property[];
  readonly isLoading: boolean;
  readonly error?: Error | null;
}

/* ------------------------------------------------------------------ */
/*  Utility Functions                                                 */
/* ------------------------------------------------------------------ */

/**
 * Transform Property to NormalizedProperty with exact type safety
 * This function carefully handles optional properties to satisfy exactOptionalPropertyTypes
 */
const transformToNormalizedProperty = (
  property: Property
): NormalizedProperty => {
  // Extract location string safely
  const locationString =
    typeof property.location === "string" ?
      property.location
    : property.location?.address || "Location not specified";

  // Determine category safely with explicit type assertion
  let category: "residential" | "commercial" | "land" = "residential";
  if (property.type === "commercial") {
    category = "commercial";
  } else if (property.type === "land") {
    category = "land";
  }

  // Handle date conversion safely
  const getDateString = (date: Date | string | undefined): string => {
    if (!date) return new Date().toISOString();
    return date instanceof Date ? date.toISOString() : date;
  };

  // Handle status conversion with better type safety
  const normalizeStatus = (
    status: string | undefined
  ): "available" | "under-offer" | "sold" | "rented" | "pending" => {
    if (!status) return "available";
    const validStatuses = [
      "available",
      "under-offer",
      "sold",
      "rented",
      "pending",
    ] as const;
    return validStatuses.includes(status as (typeof validStatuses)[number]) ?
        (status as (typeof validStatuses)[number])
      : "available";
  };

  // Handle verification status with improved type safety
  const normalizeVerificationStatus = (
    status: string | undefined
  ): "verified" | "pending" | "unverified" | "flagged" | undefined => {
    if (!status) return undefined;
    if (status === "draft") return "pending";
    const validStatuses = [
      "verified",
      "pending",
      "unverified",
      "flagged",
    ] as const;
    return validStatuses.includes(status as (typeof validStatuses)[number]) ?
        (status as (typeof validStatuses)[number])
      : "unverified";
  };

  // Build the base object with required properties
  const baseProperties: NormalizedProperty = {
    id: String(property.id),
    title: property.title,
    description: property.description,
    price:
      typeof property.price === "string" ?
        parseFloat(property.price) || 0
      : property.price,
    location: locationString,
    images: property.images || property.imageUrls || [],
    verified: property.verificationStatus === "verified",
    type: property.type || property.propertyType || "property",
    category,
    features: {
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFeet: property.size || property.area,
      propertyType: property.propertyType || property.type,
      ...property.features,
    },
    createdAt: getDateString(property.createdAt),
    status: normalizeStatus(property.status),
  };

  // Add optional properties only if they have valid values
  // This approach satisfies exactOptionalPropertyTypes by not setting undefined values
  const result = { ...baseProperties };

  if (property.updatedAt) {
    result.updatedAt = getDateString(property.updatedAt);
  }

  if (property.viewCount !== undefined) {
    result.views = property.viewCount;
  }

  if (property.trustScore !== undefined) {
    result.trustScore = property.trustScore;
  }

  const verificationStatus = normalizeVerificationStatus(
    property.verificationStatus
  );
  if (verificationStatus !== undefined) {
    result.verificationStatus = verificationStatus;
  }

  // Handle coordinates properly - only add if they exist
  if (property.coordinates) {
    result.coordinates = property.coordinates;
  }

  return result;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const APP = {
  DEMO_VIDEO_URL: "https://youtu.be/IjhSHyfQpaQ",
  SKELETON_COUNT: 6,
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
} as const;

const TRUST_METRICS = [
  {
    id: "countries",
    label: "African Countries",
    value: "0",
    icon: <Globe className="w-5 h-5" />,
    color: "text-emerald-500",
    description: "Preparing for Africa-wide coverage",
  },
  {
    id: "properties",
    label: "Properties Verified",
    value: "0",
    icon: <Shield className="w-5 h-5" />,
    color: "text-blue-500",
    description: "Ready to verify properties",
  },
  {
    id: "fraud",
    label: "Fraud Cases Prevented",
    value: "0",
    icon: <CheckCircle className="w-5 h-5" />,
    color: "text-red-500",
    description: "Fraud prevention system ready",
  },
  {
    id: "success",
    label: "Success Rate",
    value: "0%",
    icon: <Star className="w-5 h-5" />,
    color: "text-yellow-500",
    description: "Verification system launching soon",
  },
] as const;

const DELAY_MAP = [
  "animation-delay-0",
  "animation-delay-100",
  "animation-delay-200",
  "animation-delay-300",
  "animation-delay-400",
  "animation-delay-500",
] as const;

/**
 * Secure route mapping using Map to prevent object injection attacks
 * Maps predefined actions to their corresponding routes safely
 */
type RouteAction =
  | "primary_cta"
  | "premium_access"
  | "market_insights"
  | "search_properties"
  | "check_fraud";

const ROUTE_MAPPING = new Map<RouteAction, string>([
  ["primary_cta", "/land-verification"],
  ["premium_access", "/pricing"],
  ["market_insights", "/analytics"],
  ["search_properties", "/properties"],
  ["check_fraud", "/trust/fraud-detection"],
]);

/* ------------------------------------------------------------------ */
/*  Pure Utility Functions                                            */
/* ------------------------------------------------------------------ */

/**
 * Safely parse search query from URL parameters
 */
const parseSearchQuery = (search: string): string =>
  new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(
    "search"
  ) ?? "";

/**
 * Get animation delay class with safe array bounds checking
 */
const getDelayClass = (idx: number): string => {
  const index = Math.max(
    0,
    Math.min(idx % DELAY_MAP.length, DELAY_MAP.length - 1)
  );
  return DELAY_MAP[index] ?? DELAY_MAP[0];
};

/**
 * Type guard to validate route actions and prevent injection
 */
const isValidRouteAction = (action: string): action is RouteAction => {
  return ROUTE_MAPPING.has(action as RouteAction);
};

/**
 * Secure route getter that prevents object injection by using Map.get()
 */
const getSecureRoute = (action: string): string => {
  if (isValidRouteAction(action)) {
    return ROUTE_MAPPING.get(action) ?? "/";
  }
  return "/"; // Safe fallback for invalid actions
};

/* ------------------------------------------------------------------ */
/*  Memoized Sub-Components                                           */
/* ------------------------------------------------------------------ */

/**
 * Optimized pricing card component with improved accessibility
 */
const PricingCard = memo(
  ({ plan, index }: { plan: PricingPlan; index: number }) => {
    const cardClassName = useMemo(
      () =>
        `h-full relative transition-all duration-300 hover:scale-[1.02] group ${
          plan.isPopular ?
            "border-2 border-secondary shadow-xl ring-2 ring-secondary/20"
          : "border shadow-sm hover:border-primary/30"
        } ${getDelayClass(index)}`,
      [plan.isPopular, index]
    );

    return (
      <Card
        className={cardClassName}
        role="article"
        aria-label={`${plan.name} pricing plan`}
      >
        {plan.isPopular && (
          <Badge
            variant="coral"
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold"
            aria-label="Most popular plan"
          >
            MOST POPULAR
          </Badge>
        )}
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold group-hover:text-primary duration-300">
            {plan.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground mb-4">
            {plan.description}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{plan.price}</span>
            {plan.price !== "Custom" && (
              <span className="text-sm text-muted-foreground">/month</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm mb-6">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-3">
                <CheckCircle
                  className="w-4 h-4 text-status-success mt-0.5"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          {plan.africanFocus && (
            <div className="mb-6 p-3 bg-muted/30 rounded-lg">
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                <Globe className="w-3 h-3" aria-hidden="true" />
                African Focus
              </h4>
              <ul className="space-y-1 text-xs">
                {plan.africanFocus.map((focus) => (
                  <li key={focus} className="flex items-center gap-2">
                    <div
                      className="w-1 h-1 bg-secondary rounded-full"
                      aria-hidden="true"
                    />
                    <span>{focus}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button
            variant={plan.buttonVariant}
            className="w-full font-semibold"
            aria-label={`Get started with ${plan.name} plan`}
          >
            {plan.buttonText ?? "Get Started"}
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>
    );
  }
);
PricingCard.displayName = "PricingCard";

/**
 * Optimized property grid with better error handling and accessibility
 */
const PropertyGrid = memo(
  ({ properties, isLoading, error }: PropertyGridProps) => {
    // Memoize skeleton array to prevent unnecessary re-renders
    const skeletonItems = useMemo(
      () => Array.from({ length: APP.SKELETON_COUNT }, (_, i) => i),
      []
    );

    if (isLoading) {
      return (
        <div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          role="status"
          aria-label="Loading properties"
        >
          {skeletonItems.map((i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden">
              <Skeleton className="h-48 w-full rounded-lg" />
              <div className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-16" role="alert" aria-live="polite">
          <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-destructive" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Unable to Load Properties
          </h3>
          <p className="text-muted-foreground mb-6">
            {error.message ||
              "We're having trouble loading properties. Please try again."}
          </p>
          <Button
            onClick={() => window.location.reload()}
            aria-label="Retry loading properties"
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (!properties?.length) {
      return (
        <div className="text-center py-16" role="status">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
            <Search
              className="w-8 h-8 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
          <p className="text-muted-foreground">
            Adjust your filters or browse all available properties.
          </p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((property, index) => (
          <div
            key={property.id}
            className={`animate-fade-in ${getDelayClass(index)}`}
          >
            <PropertyCard property={transformToNormalizedProperty(property)} />
          </div>
        ))}
      </div>
    );
  }
);
PropertyGrid.displayName = "PropertyGrid";

/**
 * Trust metric display component with enhanced accessibility
 */
const TrustMetric = memo(
  ({
    metric,
    idx,
  }: {
    metric: (typeof TRUST_METRICS)[number];
    idx: number;
  }) => (
    <div className={`text-center group ${getDelayClass(idx)}`}>
      <div className="glass-card p-6 hover:glass-card-hover transition-all duration-300">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-glass-secondary mb-4 transition-transform duration-300 group-hover:scale-110 ${metric.color}`}
          aria-hidden="true"
        >
          {metric.icon}
        </div>
        <div className={`text-3xl font-bold mb-2 ${metric.color}`}>
          {metric.value}
        </div>
        <div className="text-sm font-medium">{metric.label}</div>
        <div className="text-xs text-glass-medium">{metric.description}</div>
      </div>
    </div>
  )
);
TrustMetric.displayName = "TrustMetric";

/* ------------------------------------------------------------------ */
/*  Main Page Component                                               */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { pageClassName } = usePageSpacing();

  // State for modal visibility with better typing
  const [modals, setModals] = useState<{
    video: boolean;
    compare: boolean;
  }>({
    video: false,
    compare: false,
  });

  // Memoize search query parsing to prevent unnecessary re-computations
  const searchQuery = useMemo(() => parseSearchQuery(search), [search]);

  // Query properties with proper error handling
  const {
    data: properties,
    isLoading,
    error,
  } = useSafePropertiesQuery(searchQuery ? { search: searchQuery } : {}, {
    staleTime: APP.STALE_TIME,
    context: "home",
    enabled: true,
  });

  /**
   * Handle hero search with improved URL parameter handling
   */
  const handleHeroSearch = useCallback(
    (query: string, location?: string) => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (location?.trim()) params.set("location", location.trim());
      navigate(`/?${params}`, { replace: true });
    },
    [navigate]
  );

  /**
   * Handle hero CTA clicks with secure routing
   */
  const handleHeroCta = useCallback(
    (_: string, action: string) => {
      if (action === "watch_demo") {
        setModals((prevModals) => ({ ...prevModals, video: true }));
        return;
      }
      // Use secure route mapping to prevent injection attacks
      const route = getSecureRoute(action);
      navigate(route);
    },
    [navigate]
  );

  /**
   * Optimized modal toggle with better type safety
   */
  const toggleModal = useCallback((key: keyof typeof modals) => {
    setModals((prevModals) => {
      if (key === "video") {
        return { ...prevModals, video: !prevModals.video };
      } else if (key === "compare") {
        return { ...prevModals, compare: !prevModals.compare };
      }
      return prevModals;
    });
  }, []);

  // Determine if search results should be shown
  const showResults = Boolean(searchQuery);

  return (
    <>
      <div className={`min-h-screen bg-dark-gradient-primary ${pageClassName}`}>
        <EnhancedHero
          variant="A"
          onSearchSubmit={handleHeroSearch}
          onCtaClick={handleHeroCta}
        />

        {showResults && (
          <section
            className="py-20 bg-dark-gradient-secondary"
            aria-label="Search results"
          >
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-4 text-center">
                Results for &ldquo;{searchQuery}&rdquo;
              </h2>
              <PropertyGrid
                properties={properties}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </section>
        )}

        <section
          className="py-20 bg-dark-gradient-accent"
          aria-label="Trust indicators"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6 text-center">
              Launching Soon Across Africa
            </h2>
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {TRUST_METRICS.map((metric, index) => (
                <TrustMetric key={metric.id} metric={metric} idx={index} />
              ))}
            </div>
          </div>
        </section>

        <ServiceCategories />
        <FraudIntelligence />
        <Testimonials variant="carousel" showStats autoPlay />
        <NewsBlog />

        <section
          className="py-24 bg-dark-gradient-primary"
          aria-label="Featured properties"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6 text-center">
              Verified African Properties
            </h2>
            <PropertyGrid
              properties={properties}
              isLoading={isLoading}
              error={error}
            />
            <div className="text-center mt-12">
              <Button
                size="lg"
                onClick={() => navigate("/properties")}
                aria-label="View all available properties"
              >
                View All Properties
                <ArrowRight className="w-4 h-5 ml-2" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>

        <section
          className="py-24 bg-dark-gradient-accent"
          aria-label="Call to action"
        >
          <div className="text-center max-w-3xl mx-auto px-4">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Secure Your Investment?
            </h2>
            <Button
              size="lg"
              onClick={() => navigate("/demo")}
              aria-label="Try our live demo"
            >
              Try Live Demo
            </Button>
          </div>
        </section>
      </div>

      {/* Modal components */}
      <CompareBar onQuickCompare={() => toggleModal("compare")} />
      <CompareModal
        isOpen={modals.compare}
        onClose={() => toggleModal("compare")}
      />
      <VideoModal
        isOpen={modals.video}
        onClose={() => toggleModal("video")}
        videoUrl={APP.DEMO_VIDEO_URL}
        title="TripleCheck Demo"
      />
    </>
  );
}
