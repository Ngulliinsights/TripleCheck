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
import ListingCard from "../../property/components/ListingCard";
import { CompareProvider } from "../../property/contexts/CompareContext";
import FraudIntelligence from "../components/CommunityInsights";
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
import { VideoModal } from "../components/VideoModal";
import { usePageSpacing } from "../hooks/useNavigationSpacing";
import { useSafePropertiesQuery } from "../hooks/useSafeQuery";
import { ServiceCategories, Testimonials } from "../index";
import type { Property } from "../types/property";

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
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const APP = {
  DEMO_VIDEO_URL: "https://youtu.be/IjhSHyfQpaQ",
  SKELETON_COUNT: 6,
  STALE_TIME: 5 * 60 * 1000, // 5 min
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

// Secure route mapping to prevent object injection
// Define allowed action types for type safety
type RouteAction =
  | "primary_cta"
  | "premium_access"
  | "market_insights"
  | "search_properties"
  | "check_fraud";

// Using Map instead of object to prevent prototype pollution and injection attacks
const ROUTE_MAPPING = new Map<RouteAction, string>([
  ["primary_cta", "/land-verification"],
  ["premium_access", "/pricing"],
  ["market_insights", "/analytics"],
  ["search_properties", "/properties"],
  ["check_fraud", "/trust/fraud-detection"],
]);

/* ------------------------------------------------------------------ */
/*  Pure Utilities                                                    */
/* ------------------------------------------------------------------ */
const parseSearchQuery = (search: string): string =>
  new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(
    "search"
  ) ?? "";

const getDelayClass = (idx: number) => DELAY_MAP[idx % DELAY_MAP.length];

// Type guard function to check if a string is a valid route action
const isValidRouteAction = (action: string): action is RouteAction => {
  return ROUTE_MAPPING.has(action as RouteAction);
};

// Safe route getter that prevents object injection by using Map.get() instead of bracket notation
const getSecureRoute = (action: string): string => {
  // First check if the action is valid using our type guard
  if (isValidRouteAction(action)) {
    return ROUTE_MAPPING.get(action) ?? "/";
  }
  // Return default route for invalid actions, preventing any injection attempts
  return "/";
};

/* ------------------------------------------------------------------ */
/*  Memoised Sub-Components                                           */
/* ------------------------------------------------------------------ */
const PricingCard = memo(
  ({ plan, index }: { plan: PricingPlan; index: number }) => {
    // Removed unused hovered state and simplified hover handling
    const cn = useMemo(
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
        className={cn}
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
            {plan.features.map((f) => (
              <li key={f} className="flex gap-3">
                <CheckCircle className="w-4 h-4 text-status-success mt-0.5" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
          {plan.africanFocus && (
            <div className="mb-6 p-3 bg-muted/30 rounded-lg">
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                <Globe className="w-3 h-3" /> African Focus
              </h4>
              <ul className="space-y-1 text-xs">
                {plan.africanFocus.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-secondary rounded-full" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button variant={plan.buttonVariant} className="w-full font-semibold">
            {plan.buttonText ?? "Get Started"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }
);
PricingCard.displayName = "PricingCard";

const PropertyGrid = memo(
  ({ properties, isLoading, error }: PropertyGridProps) => {
    const skeletons = useMemo(
      () => Array.from({ length: APP.SKELETON_COUNT }, (_, i) => i),
      []
    );

    if (isLoading) {
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skeletons.map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full rounded-lg" />
              <div className="p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-16" role="alert">
          <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-destructive" aria-hidden />
          </div>
          <h3 className="text-xl font-semibold">Unable to Load Properties</h3>
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
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground" aria-hidden />
          </div>
          <h3 className="text-xl font-semibold">No Properties Found</h3>
          <p className="text-muted-foreground">
            Adjust your filters or browse all.
          </p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((p, i) => (
          <div key={p.id} className={`animate-fade-in ${getDelayClass(i)}`}>
            <ListingCard property={p} />
          </div>
        ))}
      </div>
    );
  }
);
PropertyGrid.displayName = "PropertyGrid";

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
/*  Page Component                                                    */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { pageClassName } = usePageSpacing();

  const [modals, setModals] = useState({ video: false, compare: false });

  const searchQuery = useMemo(() => parseSearchQuery(search), [search]);

  const {
    data: properties,
    isLoading,
    error,
  } = useSafePropertiesQuery(searchQuery ? { search: searchQuery } : {}, {
    staleTime: APP.STALE_TIME,
    context: "home",
    enabled: true,
  });

  const handleHeroSearch = useCallback(
    (q: string, loc?: string) => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("search", q.trim());
      if (loc?.trim()) params.set("location", loc.trim());
      navigate(`/?${params}`, { replace: true });
    },
    [navigate]
  );

  const handleHeroCta = useCallback(
    (_: string, action: string) => {
      if (action === "watch_demo") {
        setModals((m) => ({ ...m, video: true }));
        return;
      }
      // Use secure route mapping to prevent object injection
      const route = getSecureRoute(action);
      navigate(route);
    },
    [navigate]
  );

  // Remove unused handleService since ServiceCategories doesn't need it

  const toggleModal = useCallback((key: keyof typeof modals) => {
    setModals((prevModals) => ({ ...prevModals, [key]: !prevModals[key] }));
  }, []);

  const showResults = Boolean(searchQuery);

  return (
    <CompareProvider>
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
              {TRUST_METRICS.map((m, i) => (
                <TrustMetric key={m.id} metric={m} idx={i} />
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
              <Button size="lg" onClick={() => navigate("/properties")}>
                View All Properties
                <ArrowRight className="w-4 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-24 bg-dark-gradient-accent">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Secure Your Investment?
            </h2>
            <Button size="lg" onClick={() => navigate("/demo")}>
              Try Live Demo
            </Button>
          </div>
        </section>
      </div>

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
    </CompareProvider>
  );
}
