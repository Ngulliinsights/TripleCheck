/* ------------------------------------------------------------------ */
/*  Imports                                                           */
/* ------------------------------------------------------------------ */
import {
  ArrowRight,
  CheckCircle,
  Globe,
  Search,
  Shield,
  Star,
} from "lucide-react"
import { memo, useCallback, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { CompareBar } from "../../property/components/CompareBar"
import { CompareModal } from "../../property/components/CompareModal"
import FraudIntelligence from "../components/CommunityInsights"
import { EnhancedHero } from "../components/hero/Hero"
import { NewsBlog } from "../components/NewsBlog"
import { PropertyCard } from "../components/property"
import { ServiceCategories } from "../components/ServiceCategories"
import { Testimonials } from "../components/Testimonials"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Skeleton } from "../components/ui/skeleton"
import { VideoModal } from "../components/VideoModal"
import { usePageSpacing } from "../hooks/useNavigationSpacing"
import { useSafePropertiesQuery } from "../hooks/useSafeQuery"
import type { NormalizedProperty, Property } from "../types/property"

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface PricingPlan {
  readonly id: string
  readonly name: string
  readonly price: string
  readonly description: string
  readonly features: readonly string[]
  readonly isPopular: boolean
  readonly buttonVariant: "default" | "outline" | "coral"
  readonly buttonText?: string
  readonly africanFocus?: readonly string[]
}

interface PropertyGridProps {
  readonly properties?: readonly Property[]
  readonly isLoading: boolean
  readonly error?: Error | null
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const DEMO_VIDEO_URL = "https://youtu.be/IjhSHyfQpaQ"
const SKELETON_COUNT = 6
const STALE_TIME = 5 * 60 * 1000

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
] as const

const ANIMATION_DELAYS = [
  "animation-delay-0",
  "animation-delay-100",
  "animation-delay-200",
  "animation-delay-300",
  "animation-delay-400",
  "animation-delay-500",
] as const

/** Validated action → route map. Prevents object-injection attacks. */
const ROUTE_MAP = new Map([
  ["primary_cta",       "/land-verification"],
  ["premium_access",    "/pricing"],
  ["market_insights",   "/analytics"],
  ["search_properties", "/properties"],
  ["check_fraud",       "/trust/fraud-detection"],
] as const)

/* ------------------------------------------------------------------ */
/*  Utility Functions                                                 */
/* ------------------------------------------------------------------ */
const getDelayClass = (idx: number): string =>
  ANIMATION_DELAYS[idx % ANIMATION_DELAYS.length] ?? ANIMATION_DELAYS[0]

const parseSearchQuery = (search: string): string =>
  new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("search") ?? ""

const getRoute = (action: string): string =>
  ROUTE_MAP.get(action as Parameters<typeof ROUTE_MAP.get>[0]) ?? "/"

/* ------------------------------------------------------------------ */
/*  Property Transformer                                              */
/* ------------------------------------------------------------------ */
const toNormalized = (p: Property): NormalizedProperty => {
  const location =
    typeof p.location === "string" ? p.location : p.location?.address ?? "Location not specified"

  const category: NormalizedProperty["category"] =
    p.type === "commercial" ? "commercial"
    : p.type === "land"      ? "land"
    :                          "residential"

  const toDateStr = (d: Date | string | undefined): string =>
    !d ? new Date().toISOString() : d instanceof Date ? d.toISOString() : d

  const normalizeStatus = (s?: string): NormalizedProperty["status"] => {
    const valid = ["available", "under-offer", "sold", "rented", "pending"] as const
    return valid.includes(s as (typeof valid)[number])
      ? (s as NormalizedProperty["status"])
      : "available"
  }

  const normalizeVerification = (
    s?: string,
  ): NormalizedProperty["verificationStatus"] | undefined => {
    if (!s) return undefined
    if (s === "draft") return "pending"
    const valid = ["verified", "pending", "unverified", "flagged"] as const
    return valid.includes(s as (typeof valid)[number])
      ? (s as (typeof valid)[number])
      : "unverified"
  }

  const base: NormalizedProperty = {
    id:          String(p.id),
    title:       p.title,
    description: p.description,
    price:       typeof p.price === "string" ? parseFloat(p.price) || 0 : p.price,
    location,
    images:      p.images ?? p.imageUrls ?? [],
    verified:    p.verificationStatus === "verified",
    type:        p.type ?? p.propertyType ?? "property",
    category,
    features: {
      bedrooms:     p.bedrooms,
      bathrooms:    p.bathrooms,
      squareFeet:   p.size ?? p.area,
      propertyType: p.propertyType ?? p.type,
      ...p.features,
    },
    createdAt: toDateStr(p.createdAt),
    status:    normalizeStatus(p.status),
  }

  // Append optional fields only when defined (satisfies exactOptionalPropertyTypes)
  if (p.updatedAt)                 base.updatedAt          = toDateStr(p.updatedAt)
  if (p.viewCount  !== undefined)  base.views              = p.viewCount
  if (p.trustScore !== undefined)  base.trustScore         = p.trustScore
  if (p.coordinates)               base.coordinates        = p.coordinates

  const vs = normalizeVerification(p.verificationStatus)
  if (vs !== undefined)            base.verificationStatus = vs

  return base
}

/* ------------------------------------------------------------------ */
/*  Sub-Components                                                    */
/* ------------------------------------------------------------------ */
const PricingCard = memo(({ plan, index }: { plan: PricingPlan; index: number }) => (
  <Card
    className={`h-full relative transition-all duration-300 hover:scale-[1.02] group ${
      plan.isPopular
        ? "border-2 border-secondary shadow-xl ring-2 ring-secondary/20"
        : "border shadow-sm hover:border-primary/30"
    } ${getDelayClass(index)}`}
    role="article"
    aria-label={`${plan.name} pricing plan`}
  >
    {plan.isPopular && (
      <Badge
        variant="coral"
        className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold"
      >
        MOST POPULAR
      </Badge>
    )}

    <CardHeader className="pb-4">
      <CardTitle className="text-2xl font-bold group-hover:text-primary duration-300">
        {plan.name}
      </CardTitle>
      <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
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
            <CheckCircle className="w-4 h-4 text-status-success mt-0.5 shrink-0" aria-hidden="true" />
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
                <div className="w-1 h-1 bg-secondary rounded-full" aria-hidden="true" />
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
))
PricingCard.displayName = "PricingCard"

/* ------------------------------------------------------------------ */
const skeletonKeys = Array.from({ length: SKELETON_COUNT }, (_, i) => i)

const PropertyGrid = memo(({ properties, isLoading, error }: PropertyGridProps) => {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" role="status" aria-label="Loading properties">
        {skeletonKeys.map((i) => (
          <Card key={`skeleton-${i}`} className="overflow-hidden">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16" role="alert" aria-live="polite">
        <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
          <Search className="w-8 h-8 text-destructive" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Unable to Load Properties</h3>
        <p className="text-muted-foreground mb-6">
          {error.message ?? "We're having trouble loading properties. Please try again."}
        </p>
        <Button onClick={() => window.location.reload()} aria-label="Retry loading properties">
          Try Again
        </Button>
      </div>
    )
  }

  if (!properties?.length) {
    return (
      <div className="text-center py-16" role="status">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
          <Search className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
        <p className="text-muted-foreground">
          Adjust your filters or browse all available properties.
        </p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {properties.map((property, index) => (
        <div key={property.id} className={`animate-fade-in ${getDelayClass(index)}`}>
          <PropertyCard property={toNormalized(property)} />
        </div>
      ))}
    </div>
  )
})
PropertyGrid.displayName = "PropertyGrid"

/* ------------------------------------------------------------------ */
const TrustMetric = memo(
  ({ metric, idx }: { metric: (typeof TRUST_METRICS)[number]; idx: number }) => (
    <div className={`text-center group ${getDelayClass(idx)}`}>
      <div className="glass-card p-6 hover:glass-card-hover transition-all duration-300">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-glass-secondary mb-4 transition-transform duration-300 group-hover:scale-110 ${metric.color}`}
          aria-hidden="true"
        >
          {metric.icon}
        </div>
        <div className={`text-3xl font-bold mb-2 ${metric.color}`}>{metric.value}</div>
        <div className="text-sm font-medium">{metric.label}</div>
        <div className="text-xs text-glass-medium">{metric.description}</div>
      </div>
    </div>
  ),
)
TrustMetric.displayName = "TrustMetric"

/* ------------------------------------------------------------------ */
/*  Main Page Component                                               */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const { pageClassName } = usePageSpacing()

  const [modals, setModals] = useState({ video: false, compare: false })

  const searchQuery = useMemo(() => parseSearchQuery(search), [search])

  const { data: properties, isLoading, error } = useSafePropertiesQuery(
    searchQuery ? { search: searchQuery } : {},
    { staleTime: STALE_TIME, context: "home", enabled: true },
  )

  const handleHeroSearch = useCallback(
    (query: string, location?: string) => {
      const params = new URLSearchParams()
      if (query.trim())    params.set("search",   query.trim())
      if (location?.trim()) params.set("location", location.trim())
      navigate(`/?${params}`, { replace: true })
    },
    [navigate],
  )

  const handleHeroCta = useCallback(
    (_: string, action: string) => {
      if (action === "watch_demo") {
        setModals((prev) => ({ ...prev, video: true }))
        return
      }
      navigate(getRoute(action))
    },
    [navigate],
  )

  const closeModal = useCallback(
    (key: keyof typeof modals) => setModals((prev) => ({ ...prev, [key]: false })),
    [],
  )

  const propertyGridProps = { properties, isLoading, error }

  return (
    <>
      <div className={`min-h-screen bg-dark-gradient-primary ${pageClassName}`}>
        <EnhancedHero
          variant="A"
          onSearchSubmit={handleHeroSearch}
          onCtaClick={handleHeroCta}
        />

        {searchQuery && (
          <section className="py-20 bg-dark-gradient-secondary" aria-label="Search results">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-4 text-center">
                Results for &ldquo;{searchQuery}&rdquo;
              </h2>
              <PropertyGrid {...propertyGridProps} />
            </div>
          </section>
        )}

        <section className="py-20 bg-dark-gradient-accent" aria-label="Trust indicators">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6 text-center">
              Launching Soon Across Africa
            </h2>
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {TRUST_METRICS.map((metric, idx) => (
                <TrustMetric key={metric.id} metric={metric} idx={idx} />
              ))}
            </div>
          </div>
        </section>

        <ServiceCategories />
        <FraudIntelligence />
        <Testimonials variant="carousel" showStats autoPlay />
        <NewsBlog />

        <section className="py-24 bg-dark-gradient-primary" aria-label="Featured properties">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6 text-center">
              Verified African Properties
            </h2>
            <PropertyGrid {...propertyGridProps} />
            <div className="text-center mt-12">
              <Button
                size="lg"
                onClick={() => navigate("/properties")}
                aria-label="View all available properties"
              >
                View All Properties
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-24 bg-dark-gradient-accent" aria-label="Call to action">
          <div className="text-center max-w-3xl mx-auto px-4">
            <h2 className="text-4xl font-bold mb-4">Ready to Secure Your Investment?</h2>
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

      <CompareBar onQuickCompare={() => setModals((prev) => ({ ...prev, compare: true }))} />
      <CompareModal isOpen={modals.compare} onClose={() => closeModal("compare")} />
      <VideoModal
        isOpen={modals.video}
        onClose={() => closeModal("video")}
        videoUrl={DEMO_VIDEO_URL}
        title="TripleCheck Demo"
      />
    </>
  )
}