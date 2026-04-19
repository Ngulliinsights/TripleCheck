import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Globe,
  MapPin,
  Play,
  Search,
  Shield,
  Users,
} from "lucide-react"
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { HERO_VARIANTS } from "../../config/assets"
import { useToast } from "../../hooks/use-toast"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrustIndicator {
  label: string
  value: string
  description?: string
}

interface SlideDefinition {
  id: string
  title: string
  subtitle: string
  backgroundImage: string
  theme: "trust" | "premium" | "warm" | "professional"
  valueProposition: string
  primaryCta: { text: string; action: string }
  secondaryCta: { text: string; action: string }
  trustIndicators: TrustIndicator[]
}

interface FilterState {
  country: string
  propertyType: string
  verificationStatus: string
}

interface EnhancedHeroProps {
  readonly onSearchSubmit?: (query: string, params: string) => void
  readonly onCtaClick?: (slideId: string, action: string) => void
  readonly className?: string
}

// ─── Slide data (static — no JSX, no runtime allocation) ─────────────────────

const SLIDES: SlideDefinition[] = [
  {
    id: "african-property-trust",
    title: "Verified. Transparent. Trusted.",
    subtitle:
      "Africa's most comprehensive property verification platform protecting your real estate investments across 54 countries.",
    backgroundImage: HERO_VARIANTS.A.backgroundImage,
    theme: "trust",
    valueProposition: "Advanced fraud detection across all African markets",
    primaryCta: { text: "Verify Property Now", action: "start_verification" },
    secondaryCta: { text: "See How It Works", action: "watch_demo" },
    trustIndicators: [
      { label: "African Countries", value: "54+", description: "Complete coverage across Africa" },
      { label: "Properties Verified", value: "250K+", description: "Verified properties across Africa" },
      { label: "Fraud Cases Prevented", value: "15K+", description: "Protecting African investors" },
      { label: "Success Rate", value: "99.8%", description: "Verification accuracy" },
    ],
  },
  {
    id: "premium-african-intelligence",
    title: "Premium African Property Intelligence",
    subtitle:
      "Access exclusive market insights and connect with verified real estate professionals across Africa's fastest-growing markets.",
    backgroundImage: HERO_VARIANTS.B.backgroundImage,
    theme: "premium",
    valueProposition: "Exclusive insights from Africa's top property professionals",
    primaryCta: { text: "Explore Premium", action: "premium_access" },
    secondaryCta: { text: "View Market Data", action: "market_insights" },
    trustIndicators: [
      { label: "Market Reports", value: "5K+", description: "African market analysis" },
      { label: "Verified Agents", value: "2.5K+", description: "Trusted African professionals" },
      { label: "Premium Listings", value: "50K+", description: "Exclusive African properties" },
      { label: "Cities Covered", value: "200+", description: "Major African cities" },
    ],
  },
  {
    id: "african-home-finder",
    title: "Find Your Perfect African Home",
    subtitle:
      "Discover authentic properties with confidence through our verified listing network spanning from Cairo to Cape Town.",
    backgroundImage: HERO_VARIANTS.C.backgroundImage,
    theme: "warm",
    valueProposition: "Curated listings from trusted African sources",
    primaryCta: { text: "Browse Properties", action: "search_properties" },
    secondaryCta: { text: "Get Personalized Matches", action: "personalized_search" },
    trustIndicators: [
      { label: "Active Listings", value: "125K+", description: "Properties across Africa" },
      { label: "Happy Tenants", value: "75K+", description: "Satisfied African residents" },
      { label: "African Cities", value: "200+", description: "From Lagos to Nairobi" },
      { label: "Success Rate", value: "96%", description: "Successful placements" },
    ],
  },
]

const SLIDE_COUNT = SLIDES.length

// ─── Theme configuration ──────────────────────────────────────────────────────

const THEME_CONFIGS = {
  trust: {
    gradient: "from-emerald-900/80 via-teal-800/70 to-emerald-900/80",
    accent: "text-emerald-400",
    button: "bg-emerald-600 hover:bg-emerald-700 border-emerald-500",
    glow: "shadow-emerald-500/25",
    gradientClass: "gradient-trust-balanced",
  },
  premium: {
    gradient: "from-amber-900/80 via-orange-800/70 to-amber-900/80",
    accent: "text-amber-400",
    button: "bg-amber-600 hover:bg-amber-700 border-amber-500",
    glow: "shadow-amber-500/25",
    gradientClass: "gradient-premium-balanced",
  },
  warm: {
    gradient: "from-red-900/80 via-orange-800/70 to-red-900/80",
    accent: "text-orange-400",
    button: "bg-orange-600 hover:bg-orange-700 border-orange-500",
    glow: "shadow-orange-500/25",
    gradientClass: "gradient-warm-balanced",
  },
  professional: {
    gradient: "from-slate-900/80 via-blue-800/70 to-slate-900/80",
    accent: "text-blue-400",
    button: "bg-blue-600 hover:bg-blue-700 border-blue-500",
    glow: "shadow-blue-500/25",
    gradientClass: "gradient-professional-balanced",
  },
} as const

// ─── Timing constants ─────────────────────────────────────────────────────────

const SLIDE_DURATION = 8_000   // ms between auto-advances
const PAUSE_DURATION = 12_000  // ms to pause auto-play after manual navigation

// ─── CTA navigation map ───────────────────────────────────────────────────────

const CTA_ROUTES: Record<string, string> = {
  start_verification: "/land-verification",
  verify_property: "/land-verification",
  premium_access: "/pricing",
  market_insights: "/analytics",
  search_properties: "/properties",
  personalized_search: "/search",
  check_fraud: "/trust/fraud-detection",
  find_expert: "/find-professionals",
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TitleProps {
  title: string
  accentClass: string
}

/**
 * Splits dot-delimited titles so each segment can be individually styled.
 * Falls back to rendering the whole string with the accent class applied.
 */
function SlideTitle({ title, accentClass }: TitleProps) {
  const parts = title.split(".")
  if (parts.length < 3) {
    return <span className={`block ${accentClass}`}>{title}</span>
  }
  return (
    <>
      <span className="block">{parts[0]}.</span>
      <span className={`block ${accentClass}`}>{parts[1]}.</span>
      <span className="block">{parts[2]}.</span>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EnhancedHero({
  onSearchSubmit,
  onCtaClick,
  className = "",
}: EnhancedHeroProps): JSX.Element {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLocation, setSearchLocation] = useState("")
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    country: "",
    propertyType: "",
    verificationStatus: "",
  })

  // Ref for the pause timeout so it can be cancelled on unmount
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const slide = SLIDES[currentSlide]!
  const theme = THEME_CONFIGS[slide.theme]

  // ── Auto-play ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAutoPlaying) return
    const id = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_COUNT)
    }, SLIDE_DURATION)
    return () => clearInterval(id)
  }, [isAutoPlaying])

  // Cleanup any pending pause timer on unmount
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
  }, [])

  // ── Navigation ─────────────────────────────────────────────────────────────

  const navigateToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)

    // Cancel any existing resume timer before scheduling a new one
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    pauseTimerRef.current = setTimeout(() => setIsAutoPlaying(true), PAUSE_DURATION)
  }, [])

  const navigatePrevious = useCallback(() => {
    setCurrentSlide((prev) => {
      const next = (prev - 1 + SLIDE_COUNT) % SLIDE_COUNT
      navigateToSlide(next)
      return next
    })
  }, [navigateToSlide])

  const navigateNext = useCallback(() => {
    setCurrentSlide((prev) => {
      const next = (prev + 1) % SLIDE_COUNT
      navigateToSlide(next)
      return next
    })
  }, [navigateToSlide])

  // ── Search & actions ───────────────────────────────────────────────────────

  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
    []
  )

  const handleFilterChange = useCallback(
    (key: keyof FilterState) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilters((prev) => ({ ...prev, [key]: e.target.value }))
    },
    []
  )

  const handleLocationClick = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationEnabled(true)
        setSearchLocation("Current Location")
        onCtaClick?.(slide.id, "location_used")
      },
      () => setLocationEnabled(false),
      { timeout: 5000, maximumAge: 300_000 }
    )
  }, [slide.id, onCtaClick])

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = searchQuery.trim()

      const params = new URLSearchParams()
      if (trimmed) params.set("q", trimmed)
      if (searchLocation) params.set("location", searchLocation)
      if (filters.country) params.set("country", filters.country)
      if (filters.propertyType) params.set("type", filters.propertyType)
      if (filters.verificationStatus) params.set("status", filters.verificationStatus)

      navigate(`/search?${params}`)
      onSearchSubmit?.(trimmed || "advanced_search", params.toString())
      onCtaClick?.(slide.id, "search_submit")
    },
    [searchQuery, searchLocation, filters, navigate, onSearchSubmit, onCtaClick, slide.id]
  )

  const handleCtaClick = useCallback(
    (action: string) => {
      if (action === "watch_demo") {
        // Delegate to parent — no navigation
        onCtaClick?.(slide.id, action)
        return
      }
      const route = CTA_ROUTES[action]
      if (route) navigate(route)
      onCtaClick?.(slide.id, action)
    },
    [slide.id, navigate, onCtaClick]
  )

  const handleVerifyProperty = useCallback(() => {
    const query = searchQuery.trim()
    if (!query) {
      toast({ title: "Enter a property ID or address to verify", variant: "destructive" })
      return
    }
    navigate(`/land-verification?property=${encodeURIComponent(query)}`)
    onCtaClick?.(slide.id, "verify_property")
  }, [searchQuery, navigate, slide.id, onCtaClick, toast])

  const handleFraudCheck = useCallback(() => {
    const query = searchQuery.trim()
    if (!query) {
      toast({ title: "Enter a property ID or address to check", variant: "destructive" })
      return
    }
    navigate(`/trust/fraud-detection?query=${encodeURIComponent(query)}`)
    onCtaClick?.(slide.id, "check_fraud")
  }, [searchQuery, navigate, slide.id, onCtaClick, toast])

  const handleFindExpert = useCallback(() => {
    const params = new URLSearchParams()
    const loc = searchLocation || filters.country
    if (loc) params.set("location", loc)
    if (filters.propertyType) params.set("specialization", filters.propertyType)
    navigate(`/find-professionals?${params}`)
    onCtaClick?.(slide.id, "find_expert")
  }, [searchLocation, filters, navigate, slide.id, onCtaClick])

  // ── Derived values ─────────────────────────────────────────────────────────

  // Memoize only the icon-injected CTA shape so buttons don't recreate on every render
  const primaryCta = useMemo(
    () => ({ ...slide.primaryCta, icon: <Shield className="w-5 h-5 shrink-0" aria-hidden /> }),
    [slide.primaryCta]
  )
  const secondaryCta = useMemo(
    () => ({ ...slide.secondaryCta, icon: <Play className="w-5 h-5 shrink-0" aria-hidden /> }),
    [slide.secondaryCta]
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section
      className={`glass-hero relative min-h-screen flex items-center justify-center overflow-hidden hero-section-reset ${className}`}
      role="banner"
      aria-label="African property search hero"
    >
      {/* ── Background ── */}
      <div className="absolute inset-0 z-0" aria-hidden>
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat image-clarity-enhanced hero-bg-positioned"
          style={{ backgroundImage: `url(${slide.backgroundImage})` }}
        />
        <div className={`absolute inset-0 ${theme.gradientClass}`} />
        <div className="absolute inset-0 gradient-balanced-radial opacity-60" />
      </div>

      {/* ── Prev / Next controls ── */}
      <Button
        variant="outline"
        size="icon"
        onClick={navigatePrevious}
        className="glass-btn absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={navigateNext}
        className="glass-btn absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" aria-hidden />
      </Button>

      {/* ── Slide indicators ── */}
      <div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2"
        role="tablist"
        aria-label="Slide navigation"
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={i === currentSlide}
            aria-label={`Slide ${i + 1}`}
            onClick={() => navigateToSlide(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === currentSlide ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 container mx-auto px-4 text-white">
        <div className="max-w-6xl mx-auto py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[80vh]">

            {/* Left: copy & CTAs */}
            <div className="lg:col-span-7">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light mb-8 leading-tight animate-hero-fade-in text-white dark:text-white drop-shadow-lg">
                <SlideTitle title={slide.title} accentClass={theme.accent} />
              </h1>

              <p className="text-lg md:text-xl lg:text-2xl mb-6 max-w-2xl leading-relaxed text-white/95 dark:text-enhanced-subtle animate-hero-slide-in drop-shadow-md">
                {slide.subtitle}
              </p>

              <p className={`text-base md:text-lg mb-10 max-w-xl font-medium animate-hero-slide-in text-white/90 dark:${theme.accent} drop-shadow-md ${theme.accent}`}>
                {slide.valueProposition}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-hero-scale-in">
                <Button
                  size="lg"
                  className={`px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 gap-3 ${theme.button} ${theme.glow}`}
                  onClick={() => handleCtaClick(primaryCta.action)}
                >
                  {primaryCta.icon}
                  {primaryCta.text}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold border-white/40 text-white hover:bg-white/25 hover:border-white/60 hover:scale-105 transition-all duration-300 backdrop-blur-sm gap-3"
                  onClick={() => handleCtaClick(secondaryCta.action)}
                >
                  {secondaryCta.icon}
                  {secondaryCta.text}
                </Button>
              </div>
            </div>

            {/* Right: trust indicators */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-sm">
                <div className="grid grid-cols-2 gap-4">
                  {slide.trustIndicators.map((indicator) => (
                    <div key={indicator.label} className="text-center">
                      <Globe className={`w-4 h-4 mx-auto mb-1 ${theme.accent}`} aria-hidden />
                      <div className={`text-2xl font-bold mb-0.5 ${theme.accent} drop-shadow-lg`} style={{ fontVariantNumeric: "tabular-nums" }}>
                        {indicator.value}
                      </div>
                      <div className="text-xs text-white/85 leading-tight">{indicator.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Search panel ── */}
          <div className="mt-16 mb-12">
            <div className="max-w-4xl mx-auto bg-white/15 backdrop-blur-md border border-white/30 rounded-xl p-6">
              <form onSubmit={handleSearchSubmit} className="space-y-4" noValidate>
                {/* Query input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5 pointer-events-none" aria-hidden />
                    <Input
                      type="text"
                      placeholder="Search properties, locations, or verification status…"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      className="pl-10 bg-white/25 border-white/40 text-white placeholder:text-white/60 focus:bg-white/35 text-base py-3"
                      aria-label="Property search query"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 shrink-0"
                    onClick={handleLocationClick}
                    title={locationEnabled ? "Using current location" : "Use current location"}
                    aria-label="Use current location"
                  >
                    <MapPin className={`w-4 h-4 ${locationEnabled ? theme.accent : ""}`} aria-hidden />
                  </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      {
                        key: "country" as const,
                        label: "Country",
                        options: [
                          { value: "kenya", label: "Kenya" },
                          { value: "nigeria", label: "Nigeria" },
                          { value: "south-africa", label: "South Africa" },
                        ],
                      },
                      {
                        key: "propertyType" as const,
                        label: "Type",
                        options: [
                          { value: "residential", label: "Residential" },
                          { value: "commercial", label: "Commercial" },
                          { value: "land", label: "Land" },
                        ],
                      },
                      {
                        key: "verificationStatus" as const,
                        label: "Status",
                        options: [
                          { value: "verified", label: "Verified" },
                          { value: "pending", label: "Pending" },
                        ],
                      },
                    ] as const
                  ).map(({ key, label, options }) => (
                    <select
                      key={key}
                      value={filters[key]}
                      onChange={handleFilterChange(key)}
                      className="px-3 py-2 bg-white/25 border border-white/40 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                      aria-label={`Filter by ${label.toLowerCase()}`}
                    >
                      <option value="">{label}</option>
                      {options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>

                {/* Quick action buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 gap-1.5"
                    onClick={handleVerifyProperty}
                  >
                    <Shield className="w-4 h-4" aria-hidden />
                    Verify Property
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 gap-1.5"
                    onClick={handleFraudCheck}
                  >
                    <CheckCircle className="w-4 h-4" aria-hidden />
                    Check Fraud
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 gap-1.5"
                    onClick={handleFindExpert}
                  >
                    <Users className="w-4 h-4" aria-hidden />
                    Find Expert
                  </Button>
                </div>

                {/* Primary submit */}
                <div className="text-center">
                  <Button
                    type="submit"
                    size="lg"
                    className={`px-8 py-3 text-lg font-semibold gap-2 ${theme.button}`}
                  >
                    <Search className="w-5 h-5" aria-hidden />
                    Search & Verify
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}