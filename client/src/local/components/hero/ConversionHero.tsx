import {
  ArrowRight,
  Award,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  Play,
  Search,
  Shield,
  Star,
  TrendingUp,
  Users,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { HERO_VARIANTS } from "../../config/assets"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Input } from "../ui/input"

// ─── Types ────────────────────────────────────────────────────────────────────

type SlideTheme = "trust" | "premium" | "warm" | "professional"
type SuggestionType = "location" | "property" | "feature"

interface SearchSuggestion {
  readonly id: string
  readonly text: string
  readonly type: SuggestionType
  readonly icon: React.ReactNode
}

interface TrustIndicator {
  readonly label: string
  readonly value: string
  readonly icon: React.ReactNode
}

interface CtaButton {
  readonly text: string
  readonly action: string
  readonly icon: React.ReactNode
}

interface HeroSlide {
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly backgroundImage: string
  readonly fallbackImage?: string
  readonly primaryCta: CtaButton
  readonly secondaryCta: CtaButton
  readonly theme: SlideTheme
  readonly valueProposition: string
  readonly trustIndicators: readonly TrustIndicator[]
}

interface ThemeConfig {
  readonly gradient: string
  readonly accent: string
  readonly button: string
  readonly glow: string
}

export interface ConversionHeroProps {
  readonly onSearchSubmit?: (query: string, location?: string) => void
  readonly onCtaClick?: (slideId: string, action: string) => void
  readonly className?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SLIDE_DURATION = 6_000
const PAUSE_DURATION = 10_000
const GEOLOCATION_TIMEOUT = 5_000
const SUGGESTION_BLUR_DELAY = 150

const THEME_CONFIGS: Record<SlideTheme, ThemeConfig> = {
  trust: {
    gradient: "from-blue-900/80 via-teal-800/70 to-blue-900/80",
    accent: "text-teal-400",
    button: "bg-teal-600 hover:bg-teal-700 border-teal-500",
    glow: "shadow-teal-500/25",
  },
  premium: {
    gradient: "from-purple-900/80 via-amber-800/70 to-purple-900/80",
    accent: "text-amber-400",
    button: "bg-amber-600 hover:bg-amber-700 border-amber-500",
    glow: "shadow-amber-500/25",
  },
  warm: {
    gradient: "from-orange-900/80 via-red-800/70 to-orange-900/80",
    accent: "text-coral",
    button: "bg-coral hover:bg-coral-dark border-coral",
    glow: "shadow-coral/25",
  },
  professional: {
    gradient: "from-slate-900/80 via-blue-800/70 to-slate-900/80",
    accent: "text-blue-400",
    button: "bg-blue-600 hover:bg-blue-700 border-blue-500",
    glow: "shadow-blue-500/25",
  },
} as const

const HERO_SLIDES: readonly HeroSlide[] = [
  {
    id: "trust-verification",
    title: "Verified. Transparent. Trusted.",
    subtitle: "Protect yourself from fraud with our comprehensive property verification system.",
    backgroundImage: HERO_VARIANTS.A.backgroundImage,
    fallbackImage: HERO_VARIANTS.A.fallbackImage,
    primaryCta: { text: "Verify Property Now", action: "start_verification", icon: <Shield className="w-5 h-5" /> },
    secondaryCta: { text: "See How It Works", action: "watch_demo", icon: <Play className="w-5 h-5" /> },
    theme: "trust",
    valueProposition: "Advanced fraud detection and document authentication",
    trustIndicators: [
      { label: "Properties Verified", value: "50,000+", icon: <Shield className="w-5 h-5" /> },
      { label: "Fraud Cases Prevented", value: "2,500+", icon: <CheckCircle className="w-5 h-5" /> },
      { label: "Success Rate", value: "99.8%", icon: <Star className="w-5 h-5" /> },
    ],
  },
  {
    id: "premium-intelligence",
    title: "Premium Property Intelligence",
    subtitle: "Access exclusive market insights and connect with verified real estate professionals.",
    backgroundImage: HERO_VARIANTS.B.backgroundImage,
    fallbackImage: HERO_VARIANTS.B.fallbackImage,
    primaryCta: { text: "Explore Premium", action: "premium_access", icon: <Award className="w-5 h-5" /> },
    secondaryCta: { text: "View Market Data", action: "market_insights", icon: <TrendingUp className="w-5 h-5" /> },
    theme: "premium",
    valueProposition: "Exclusive insights from verified professionals",
    trustIndicators: [
      { label: "Market Reports", value: "1,000+", icon: <TrendingUp className="w-5 h-5" /> },
      { label: "Verified Agents", value: "500+", icon: <Users className="w-5 h-5" /> },
      { label: "Premium Listings", value: "10,000+", icon: <Award className="w-5 h-5" /> },
    ],
  },
  {
    id: "perfect-home",
    title: "Find Your Perfect Home",
    subtitle: "Discover authentic properties with confidence through our verified listing network.",
    backgroundImage: HERO_VARIANTS.C.backgroundImage,
    fallbackImage: HERO_VARIANTS.C.fallbackImage,
    primaryCta: { text: "Browse Properties", action: "search_properties", icon: <Home className="w-5 h-5" /> },
    secondaryCta: { text: "Get Personalized Matches", action: "personalized_search", icon: <Star className="w-5 h-5" /> },
    theme: "warm",
    valueProposition: "Curated listings from trusted sources",
    trustIndicators: [
      { label: "Active Listings", value: "25,000+", icon: <Home className="w-5 h-5" /> },
      { label: "Happy Tenants", value: "15,000+", icon: <CheckCircle className="w-5 h-5" /> },
      { label: "Cities Covered", value: "50+", icon: <MapPin className="w-5 h-5" /> },
    ],
  },
  {
    id: "professional-network",
    title: "Professional Network Access",
    subtitle: "Connect with Kenya's most trusted real estate professionals and industry experts.",
    backgroundImage: HERO_VARIANTS.D?.backgroundImage ?? HERO_VARIANTS.A.backgroundImage,
    fallbackImage: HERO_VARIANTS.D?.fallbackImage ?? HERO_VARIANTS.A.fallbackImage,
    primaryCta: { text: "Find Professionals", action: "find_professionals", icon: <Users className="w-5 h-5" /> },
    secondaryCta: { text: "Join Network", action: "join_network", icon: <ArrowRight className="w-5 h-5" /> },
    theme: "professional",
    valueProposition: "Vetted professionals with proven track records",
    trustIndicators: [
      { label: "Verified Professionals", value: "1,200+", icon: <Users className="w-5 h-5" /> },
      { label: "Successful Transactions", value: "75,000+", icon: <CheckCircle className="w-5 h-5" /> },
      { label: "Client Satisfaction", value: "98%", icon: <Star className="w-5 h-5" /> },
    ],
  },
] as const

const SEARCH_SUGGESTIONS: readonly SearchSuggestion[] = [
  { id: "downtown-apartments", text: "Downtown apartments", type: "property", icon: <MapPin className="w-4 h-4" /> },
  { id: "verified-landlords", text: "Verified landlords", type: "feature", icon: <Shield className="w-4 h-4" /> },
  { id: "luxury-condos", text: "Luxury condos", type: "property", icon: <Star className="w-4 h-4" /> },
  { id: "near-me", text: "Near me", type: "location", icon: <MapPin className="w-4 h-4" /> },
  { id: "pet-friendly", text: "Pet-friendly rentals", type: "feature", icon: <CheckCircle className="w-4 h-4" /> },
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Renders a period-delimited title ("A. B. C.") with accent coloring on the
 * middle segment, falling back to a plain block for titles without periods.
 */
function SlideTitle({ title, accent }: { title: string; accent: string }) {
  const parts = title.split(".").map((p) => p.trim()).filter(Boolean)

  if (parts.length !== 3) {
    return <span className={`block ${accent}`}>{title}</span>
  }

  return (
    <>
      <span className="block">{parts[0]}.</span>
      <span className={`block ${accent}`}>{parts[1]}.</span>
      <span className="block">{parts[2]}.</span>
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConversionHero({
  onSearchSubmit,
  onCtaClick,
  className = "",
}: ConversionHeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLocation, setSearchLocation] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLocationEnabled, setIsLocationEnabled] = useState(false)

  // Refs for timers that need cleanup to avoid memory leaks
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const slide = HERO_SLIDES[currentSlide]!
  const theme = THEME_CONFIGS[slide.theme]

  // ── Geolocation ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      () => {
        setIsLocationEnabled(true)
        setSearchLocation("Current Location")
      },
      () => setIsLocationEnabled(false),
      { timeout: GEOLOCATION_TIMEOUT, enableHighAccuracy: false, maximumAge: 300_000 }
    )
  }, [])

  // ── Auto-play ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAutoPlaying) return
    const id = setInterval(
      () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length),
      SLIDE_DURATION
    )
    return () => clearInterval(id)
  }, [isAutoPlaying])

  // Cleanup dangling timers on unmount
  useEffect(
    () => () => {
      resumeTimerRef.current && clearTimeout(resumeTimerRef.current)
      blurTimerRef.current && clearTimeout(blurTimerRef.current)
    },
    []
  )

  // ── Navigation ───────────────────────────────────────────────────────────────
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    resumeTimerRef.current && clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => setIsAutoPlaying(true), PAUSE_DURATION)
  }, [])

  const goNext = useCallback(
    () => goToSlide((currentSlide + 1) % HERO_SLIDES.length),
    [currentSlide, goToSlide]
  )

  const goPrevious = useCallback(
    () => goToSlide((currentSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length),
    [currentSlide, goToSlide]
  )

  // ── Search ───────────────────────────────────────────────────────────────────
  const filteredSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return q
      ? SEARCH_SUGGESTIONS.filter((s) => s.text.toLowerCase().includes(q)).slice(0, 5)
      : SEARCH_SUGGESTIONS.slice(0, 3)
  }, [searchQuery])

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const q = searchQuery.trim()
      if (!q) return
      onSearchSubmit?.(q, searchLocation)
      onCtaClick?.(slide.id, "search_submit")
    },
    [searchQuery, searchLocation, onSearchSubmit, onCtaClick, slide.id]
  )

  const handleSuggestionClick = useCallback(
    (suggestion: SearchSuggestion) => {
      setSearchQuery(suggestion.text)
      setShowSuggestions(false)
      onSearchSubmit?.(suggestion.text, searchLocation)
      onCtaClick?.(slide.id, "suggestion_click")
    },
    [searchLocation, onSearchSubmit, onCtaClick, slide.id]
  )

  const handleLocationClick = useCallback(() => {
    setSearchLocation("Current Location")
    onCtaClick?.(slide.id, "location_used")
  }, [onCtaClick, slide.id])

  const handleBlur = useCallback(() => {
    blurTimerRef.current && clearTimeout(blurTimerRef.current)
    blurTimerRef.current = setTimeout(() => setShowSuggestions(false), SUGGESTION_BLUR_DELAY)
  }, [])

  const handleCtaClick = useCallback(
    (action: string) => onCtaClick?.(slide.id, action),
    [onCtaClick, slide.id]
  )

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <section
      className={`relative flex min-h-screen items-center justify-center overflow-hidden pt-20 ${className}`}
      role="banner"
      aria-label="Hero section with property search"
    >
      {/* Background layers */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {HERO_SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="h-full w-full bg-cover bg-center bg-no-repeat brightness-50 contrast-125"
              style={{ backgroundImage: `url(${s.backgroundImage})` }}
              role="img"
              aria-label={`Background for ${s.title}`}
            />
            <div
              className={`absolute inset-0 bg-linear-to-br transition-all duration-1000 ${
                i === currentSlide ? theme.gradient : "from-black/70 to-black/70"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Prev / Next controls */}
      {(["prev", "next"] as const).map((dir) => (
        <Button
          key={dir}
          variant="outline"
          size="icon"
          onClick={dir === "prev" ? goPrevious : goNext}
          className={`absolute top-1/2 z-20 -translate-y-1/2 bg-white/10 border-white/30 text-white
            hover:bg-white/20 hover:border-white/50 backdrop-blur-sm ${dir === "prev" ? "left-4" : "right-4"}`}
          aria-label={dir === "prev" ? "Previous slide" : "Next slide"}
        >
          {dir === "prev" ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </Button>
      ))}

      {/* Dot navigation */}
      <nav
        className="absolute bottom-20 left-1/2 z-20 -translate-x-1/2"
        aria-label="Slide navigation"
      >
        <div className="flex gap-2" role="tablist">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === currentSlide}
              aria-label={`Slide ${i + 1}: ${s.title}`}
              onClick={() => goToSlide(i)}
              className={`h-3 w-3 rounded-full transition-all duration-300 ${
                i === currentSlide ? "scale-125 bg-white" : "bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="mx-auto max-w-5xl py-12">

          {/* Headline */}
          <h1 className="mb-8 text-4xl font-light leading-tight text-shadow-lg animate-hero-fade-in md:text-6xl lg:text-7xl">
            <SlideTitle title={slide.title} accent={theme.accent} />
          </h1>

          {/* Subtitle */}
          <p className="mb-6 max-w-3xl mx-auto text-lg leading-relaxed text-white/95 text-shadow-md animate-hero-slide-in md:text-xl lg:text-2xl">
            {slide.subtitle}
          </p>

          {/* Value proposition */}
          <p className={`mb-10 max-w-2xl mx-auto text-base font-medium text-shadow-sm animate-hero-slide-in md:text-lg ${theme.accent}`}>
            {slide.valueProposition}
          </p>

          {/* Search */}
          <div className="mb-12 animate-hero-scale-in">
            <Card className="mx-auto max-w-2xl border-white/30 bg-white/15 shadow-2xl backdrop-blur-md">
              <CardContent className="p-8">
                <form onSubmit={handleSearchSubmit} noValidate>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" aria-hidden="true" />
                      <Input
                        type="search"
                        placeholder="Search properties, locations, or features…"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true) }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={handleBlur}
                        className="pl-10 bg-white/25 border-white/40 text-white placeholder:text-white/70 focus:bg-white/35 focus:border-white/60 text-lg py-3"
                        aria-label="Search for properties"
                        aria-autocomplete="list"
                        aria-controls="search-suggestions"
                        aria-expanded={showSuggestions && filteredSuggestions.length > 0}
                      />
                    </div>

                    {isLocationEnabled && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleLocationClick}
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                        aria-label="Use current location"
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Suggestions dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <ul
                        id="search-suggestions"
                        role="listbox"
                        aria-label="Search suggestions"
                        className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border bg-white shadow-xl"
                      >
                        {filteredSuggestions.map((s) => (
                          <li key={s.id} role="option">
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()} // keeps input focused; blur fires after
                              onClick={() => handleSuggestionClick(s)}
                              aria-selected={searchQuery === s.text}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50"
                            >
                              {s.icon}
                              <span>{s.text}</span>
                              <Badge variant="outline" className="ml-auto text-xs capitalize">
                                {s.type}
                              </Badge>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Trust indicators */}
          <div className="mb-16 animate-hero-fade-in">
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
              {slide.trustIndicators.map((indicator) => (
                <div key={indicator.label} className="text-center">
                  <div className={`mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/25 shadow-lg ${theme.accent}`}>
                    {indicator.icon}
                  </div>
                  <div className={`mb-2 text-3xl font-bold text-shadow-sm ${theme.accent}`}>
                    {indicator.value}
                  </div>
                  <div className="text-sm font-medium text-white/90">{indicator.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col items-center gap-6 animate-hero-scale-in sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className={`px-10 py-5 text-lg font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl ${theme.button} ${theme.glow}`}
              onClick={() => handleCtaClick(slide.primaryCta.action)}
            >
              {slide.primaryCta.icon}
              <span className="ml-3">{slide.primaryCta.text}</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-10 py-5 text-lg font-semibold border-white/40 text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/60 hover:bg-white/25"
              onClick={() => handleCtaClick(slide.secondaryCta.action)}
            >
              {slide.secondaryCta.icon}
              <span className="ml-3">{slide.secondaryCta.text}</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}