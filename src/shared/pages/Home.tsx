import { useSafePropertiesQuery } from "@shared/hooks/useSafeQuery";
import { Search, ArrowRight, CheckCircle, Globe, Star, Shield } from "lucide-react";
import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ListingCard from "../../property/components/ListingCard";
import { CompareProvider } from "../../property/contexts/CompareContext";
import { EnhancedHero } from "../components/hero/EnhancedHero";
import { NewsBlog } from "../components/NewsBlog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { ServiceCategories, Testimonials } from "../index";
import { Property } from "../types/property";

// Enhanced styles are now integrated into globals.css

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

// Enhanced type for better component props handling
interface PropertyGridProps {
  readonly properties?: Property[];
  readonly isLoading: boolean;
  readonly error?: Error | null;
}

interface PricingCardProps {
  readonly plan: PricingPlan;
  readonly index: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const PRICING_PLANS: readonly PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$29/mo",
    description: "Perfect for individual buyers & small investors",
    features: [
      "Up to 3 verifications / month",
      "10-country fraud detection",
      "24-hour email support",
    ] as const,
    africanFocus: ["Kenya, Nigeria, SA", "Mobile money ready"] as const,
    isPopular: false,
    buttonVariant: "outline",
  },
  {
    id: "professional",
    name: "Professional",
    price: "$99/mo",
    description: "Built for agents & professionals",
    features: [
      "Up to 25 verifications / month",
      "54-country fraud detection",
      "2-hour priority support",
      "White-label reports",
    ] as const,
    africanFocus: ["Pan-African coverage", "Multi-currency"] as const,
    isPopular: true,
    buttonVariant: "coral",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "For large developers & institutions",
    features: [
      "Unlimited verifications",
      "AI insights & API access",
      "Dedicated account manager",
      "24/7 support",
    ] as const,
    africanFocus: ["Government APIs", "Custom compliance"] as const,
    isPopular: false,
    buttonVariant: "outline",
    buttonText: "Contact Sales",
  },
] as const;

// Enhanced trust metrics for consistent display - Pre-launch values
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

// Extracted constants for better maintainability
const ANIMATION_DELAYS = {
  CARD_STAGGER: 150, // milliseconds between card animations
  SCROLL_OFFSET: 80, // pixels offset for smooth scrolling
} as const;

const DEMO_VIDEO_URL = "https://youtu.be/IjhSHyfQpaQ" as const;

const QUERY_CONFIG = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CONTEXT: "home",
} as const;

const SKELETON_COUNT = 6 as const;

// Animation delay class constants
const ANIMATION_DELAY_CLASSES = {
  DELAY_0: 'animation-delay-0',
  DELAY_100: 'animation-delay-100',
  DELAY_150: 'animation-delay-150',
  DELAY_200: 'animation-delay-200',
  DELAY_300: 'animation-delay-300',
  DELAY_400: 'animation-delay-400',
  DELAY_450: 'animation-delay-450',
  DELAY_500: 'animation-delay-500',
  DELAY_600: 'animation-delay-600',
} as const;

/* ------------------------------------------------------------------ */
/*  Utility Functions                                                 */
/* ------------------------------------------------------------------ */
/**
 * Safely parses search parameters from URL search string
 * @param search - The URL search string (including leading ?)
 * @returns The search query parameter value or empty string
 */
const parseSearchQuery = (search: string): string => {
  try {
    return new URLSearchParams(search.slice(1)).get("search") || "";
  } catch {
    // Fallback for malformed search strings
    return "";
  }
};

/**
 * Performs smooth scrolling to element with enhanced error handling
 * @param elementId - The ID of the target element
 */
const smoothScrollToElement = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    // In production, this would typically be logged to an error tracking service
    // For development, consider using a proper logging solution
    return;
  }

  const targetPosition = Math.max(
    0,
    element.offsetTop - ANIMATION_DELAYS.SCROLL_OFFSET
  );
  window.scrollTo({
    top: targetPosition,
    behavior: "smooth",
  });
};

/**
 * Safely opens external URL in new tab with security measures
 * @param url - The URL to open
 */
const openExternalUrl = (url: string): void => {
  window.open(url, "_blank", "noopener noreferrer");
};

/**
 * Gets the appropriate animation delay class based on delay value
 * @param delay - The delay in milliseconds
 * @returns The corresponding CSS class name
 */
const getAnimationDelayClass = (delay: number): string => {
  if (delay <= 0) return ANIMATION_DELAY_CLASSES.DELAY_0;
  if (delay <= 100) return ANIMATION_DELAY_CLASSES.DELAY_100;
  if (delay <= 150) return ANIMATION_DELAY_CLASSES.DELAY_150;
  if (delay <= 200) return ANIMATION_DELAY_CLASSES.DELAY_200;
  if (delay <= 300) return ANIMATION_DELAY_CLASSES.DELAY_300;
  if (delay <= 400) return ANIMATION_DELAY_CLASSES.DELAY_400;
  if (delay <= 450) return ANIMATION_DELAY_CLASSES.DELAY_450;
  if (delay <= 500) return ANIMATION_DELAY_CLASSES.DELAY_500;
  return ANIMATION_DELAY_CLASSES.DELAY_600;
};

/**
 * Gets animation delay class for property grid items
 * @param index - The item index
 * @returns The corresponding CSS class name
 */
const getPropertyGridDelayClass = (index: number): string => {
  if (index === 0) return ANIMATION_DELAY_CLASSES.DELAY_0;
  if (index === 1) return ANIMATION_DELAY_CLASSES.DELAY_100;
  if (index === 2) return ANIMATION_DELAY_CLASSES.DELAY_200;
  if (index === 3) return ANIMATION_DELAY_CLASSES.DELAY_300;
  if (index === 4) return ANIMATION_DELAY_CLASSES.DELAY_400;
  return ANIMATION_DELAY_CLASSES.DELAY_500;
};

/**
 * Gets animation delay class for trust metrics
 * @param index - The metric index
 * @returns The corresponding CSS class name
 */
const getTrustMetricDelayClass = (index: number): string => {
  if (index === 0) return ANIMATION_DELAY_CLASSES.DELAY_0;
  if (index === 1) return ANIMATION_DELAY_CLASSES.DELAY_150;
  if (index === 2) return ANIMATION_DELAY_CLASSES.DELAY_300;
  return ANIMATION_DELAY_CLASSES.DELAY_450;
};

/* ------------------------------------------------------------------ */
/*  Memoized Components                                               */
/* ------------------------------------------------------------------ */

/**
 * Optimized pricing card component with enhanced accessibility and animations
 * Uses memo to prevent unnecessary re-renders when parent updates
 */
const PricingCard = memo<PricingCardProps>(({ plan, index }) => {
  // Memoize computed values to avoid recalculation on each render
  const cardClasses = useMemo(() => {
    const baseClasses =
      "h-full relative hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group";
    const popularClasses =
      plan.isPopular ?
        "border-2 border-secondary shadow-xl ring-2 ring-secondary/20"
      : "border border-border shadow-sm hover:border-primary/30";

    return `${baseClasses} ${popularClasses}`;
  }, [plan.isPopular]);

  const animationDelayClass = useMemo(() => {
    const delay = index * ANIMATION_DELAYS.CARD_STAGGER;
    return getAnimationDelayClass(delay);
  }, [index]);

  const buttonText = plan.buttonText ?? "Get Started";

  return (
    <Card
      className={`${cardClasses} ${animationDelayClass}`}
      // Enhanced accessibility
      role="article"
      aria-label={`${plan.name} pricing plan`}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge
            variant="coral"
            className="px-4 py-1 text-xs font-semibold shadow-lg"
            aria-label="Most popular plan"
          >
            MOST POPULAR
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
          {plan.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {plan.description}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-foreground" aria-label={`Price: ${plan.price}`}>
            {plan.price}
          </span>
          {plan.price !== "Custom" && (
            <span className="text-sm text-muted-foreground">/month</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ul className="space-y-3 text-sm mb-6">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <CheckCircle
                className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0"
                aria-hidden="true"
              />
              <span className="text-muted-foreground leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        {plan.africanFocus && (
          <div className="mb-6 p-3 bg-muted/30 rounded-lg border border-border/50">
            <h4 className="text-xs font-semibold mb-2 text-foreground flex items-center gap-1">
              <Globe className="w-3 h-3" />
              African Focus
            </h4>
            <ul className="space-y-1 text-xs">
              {plan.africanFocus.map((focus) => (
                <li key={focus} className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1 h-1 bg-secondary rounded-full flex-shrink-0" />
                  <span>{focus}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          variant={plan.buttonVariant}
          size="lg"
          className="w-full font-semibold hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
          aria-label={`Select ${plan.name} plan`}
        >
          {buttonText}
          <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  );
});

// Display name for better debugging and React DevTools
PricingCard.displayName = "PricingCard";

/**
 * Enhanced property grid with better loading states and error handling
 * Memoized to prevent re-renders when properties data hasn't changed
 */
const PropertyGrid = memo<PropertyGridProps>(
  ({ properties, isLoading, error }) => {
    // Memoize skeleton array to prevent recreation on each render
    const skeletonItems = useMemo(
      () => Array.from({ length: SKELETON_COUNT }, (_, i) => i),
      []
    );

    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skeletonItems.map((index) => (
            <Card key={index} className="overflow-hidden">
              <div className="space-y-4 p-6">
                <Skeleton className="h-48 w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-16" role="alert">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-destructive" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Unable to Load Properties
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {error.message || "We're having trouble loading properties. Please try again."}
            </p>
            <Button
              onClick={() => window.location.reload()}
              aria-label="Retry loading properties"
              className="hover:scale-105 transition-all duration-300"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    if (!properties?.length) {
      return (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              No Properties Found
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Try adjusting your search criteria or browse all available properties
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((property, index) => {
          const delayClass = getPropertyGridDelayClass(index);
          return (
            <div
              key={property.id}
              className={`animate-fade-in ${delayClass}`}
            >
              <ListingCard property={property} />
            </div>
          );
        })}
      </div>
    );
  }
);

PropertyGrid.displayName = "PropertyGrid";

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const { search } = useLocation();
  const navigate = useNavigate();

  // Initialize search query from URL parameters
  const [searchQuery, setSearchQuery] = useState(() =>
    parseSearchQuery(search)
  );

  // Sync search query with URL changes
  useEffect(() => {
    const newQuery = parseSearchQuery(search);
    setSearchQuery(newQuery);
  }, [search]);

  // Fetch properties data with optimized query configuration
  const {
    data: properties,
    isLoading,
    error,
  } = useSafePropertiesQuery(
    { search: searchQuery },
    {
      staleTime: QUERY_CONFIG.STALE_TIME,
      context: QUERY_CONFIG.CONTEXT,
    }
  );

  /* ---------------------------------------------------------------- */
  /*  Event Handlers                                                  */
  /* ---------------------------------------------------------------- */

  /**
   * Handles search submission from hero component
   * Updates URL with search parameters while preserving browser history
   */
  const handleHeroSearch = useCallback(
    (query: string, location?: string) => {
      const params = new URLSearchParams();
      const trimmedQuery = query.trim();
      const trimmedLocation = location?.trim();

      if (trimmedQuery) {
        params.set("search", trimmedQuery);
      }
      if (trimmedLocation) {
        params.set("location", trimmedLocation);
      }

      // Use replace to avoid cluttering browser history with intermediate search states
      navigate(`/?${params.toString()}`, { replace: true });
    },
    [navigate]
  );

  /**
   * Handles call-to-action clicks from hero component
   * Provides smooth navigation and external link handling
   */
  const handleHeroCta = useCallback((_searchTerm: string, action: string) => {
    switch (action) {
      case "primary_cta":
      case "start_verification":
        smoothScrollToElement("featured-properties");
        break;
      case "watch_demo":
        openExternalUrl(DEMO_VIDEO_URL);
        break;
      default:
        // In production, this would be logged to an error tracking service
        // Development logging removed to comply with no-console ESLint rule
        break;
    }
  }, []);

  /**
   * Handles service category selection
   * Navigates to appropriate service pages
   */
  const handleServiceSelect = useCallback(
    (_serviceName: string, action: string) => {
      navigate(`/${action}`);
    },
    [navigate]
  );

  /* ---------------------------------------------------------------- */
  /*  Memoized Values                                                 */
  /* ---------------------------------------------------------------- */

  // Memoize property grid props to prevent unnecessary re-renders
  const propertyGridProps = useMemo(
    () => ({
      properties,
      isLoading,
      error,
    }),
    [properties, isLoading, error]
  );

  // Memoize search results section visibility
  const showSearchResults = Boolean(searchQuery);

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <CompareProvider>
      <div className="min-h-screen bg-background">
      {/* Hero Section with Enhanced Search */}
      <EnhancedHero
        variant="A"
        onSearchSubmit={handleHeroSearch}
        onCtaClick={handleHeroCta}
      />

      {/* Conditional Search Results Section */}
      {showSearchResults && (
        <section className="py-20 bg-muted/30" aria-label="Search results">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Results for &ldquo;{searchQuery}&rdquo;
              </h2>
              <p className="text-muted-foreground">
                Found {Array.isArray(properties) ? properties.length : 0} properties matching your search (verification system launching soon)
              </p>
            </div>
            <PropertyGrid {...propertyGridProps} />
          </div>
        </section>
      )}

      {/* Trust Indicators Section - Consistent with design system */}
      <section className="py-20 bg-background" aria-label="Trust indicators">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Launching Soon Across Africa
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our comprehensive verification platform is preparing to protect property investments across the continent
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
            {TRUST_METRICS.map((metric, index) => {
              const delayClass = getTrustMetricDelayClass(index);
              return (
                <div 
                  key={metric.id} 
                  className={`text-center group ${delayClass}`}
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10 ${metric.color}`}>
                    {metric.icon}
                  </div>
                  <div className={`text-3xl font-bold mb-2 ${metric.color}`}>
                    {metric.value}
                  </div>
                  <div className="text-sm font-medium mb-1 text-foreground">
                    {metric.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metric.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Categories Section */}
      <ServiceCategories
        variant="hover-cards"
        showStats
        onCategorySelect={handleServiceSelect}
      />

      {/* Pricing Section - Enhanced with consistent spacing */}
      <section
        id="pricing"
        className="py-24 bg-background"
        aria-label="Pricing plans"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Select the perfect plan for your property verification needs across Africa
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {PRICING_PLANS.map((plan, index) => (
              <PricingCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>
          
          {/* Trust badge for pricing */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-status-success/10 rounded-full border border-status-success/20">
              <CheckCircle className="w-5 h-5 text-status-success" />
              <span className="text-sm font-medium text-status-success">
                30-day money-back guarantee • Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials variant="carousel" showStats autoPlay />

      {/* News & Blog Section - Wrapped for consistency */}
      <section className="py-24 bg-muted/30" aria-label="Latest news and insights">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Latest News & Insights
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Stay updated with the latest trends in African property verification and market insights
          </p>
        </div>
        <NewsBlog />
      </section>

      {/* Featured Properties Section - Enhanced with better visual hierarchy */}
      <section
        id="featured-properties"
        className="py-24 bg-background"
        aria-label="Featured properties"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-property-featured/10 rounded-full border border-property-featured/20 mb-6">
              <Star className="w-4 h-4 text-property-featured" />
              <span className="text-sm font-medium text-property-featured">Featured Properties</span>
            </div>
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Verified African Properties
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Discover verified investment opportunities across Africa&apos;s most promising markets
            </p>
          </div>
          <PropertyGrid {...propertyGridProps} />
          
          {/* Call to action */}
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="px-8 py-3 hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/properties')}
            >
              View All Properties
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
      </div>
    </CompareProvider>
  );
}
