import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  MapPin,
  Play,
  ArrowRight,
  Star,
  Shield,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  Award,
  Home,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { HERO_VARIANTS } from "../../config/assets";

// Enhanced type definitions with better specificity
interface SearchSuggestion {
  readonly id: string;
  readonly text: string;
  readonly type: "location" | "property" | "feature";
  readonly icon?: React.ReactNode;
}

interface TrustIndicator {
  readonly label: string;
  readonly value: string;
  readonly icon: React.ReactNode;
}

interface CTAButton {
  readonly text: string;
  readonly action: string;
  readonly icon: React.ReactNode;
}

interface HeroSlide {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly backgroundImage: string;
  readonly fallbackImage?: string;
  readonly primaryCta: CTAButton;
  readonly secondaryCta: CTAButton;
  readonly theme: "trust" | "premium" | "warm" | "professional";
  readonly valueProposition: string;
  readonly trustIndicators: readonly TrustIndicator[];
}

interface ConversionHeroProps {
  readonly variant?: "A" | "B" | "C";
  readonly onSearchSubmit?: (query: string, location?: string) => void;
  readonly onCtaClick?: (variant: string, action: string) => void;
  readonly className?: string;
}

// Theme configuration with comprehensive styling options
interface ThemeConfig {
  readonly gradient: string;
  readonly accent: string;
  readonly button: string;
  readonly glow: string;
}

// Configuration constants moved outside component to prevent recreation
const SLIDE_DURATION = 6000; // 6 seconds per slide
const PAUSE_DURATION = 10000; // 10 seconds pause after manual navigation
const GEOLOCATION_TIMEOUT = 5000; // 5 seconds for location detection
const SUGGESTION_DELAY = 200; // 200ms delay before hiding suggestions

// Optimized hero slides configuration with readonly properties
const HERO_SLIDES: readonly HeroSlide[] = [
  {
    id: "trust-verification",
    title: "Verified. Transparent. Trusted.",
    subtitle:
      "Protect yourself from fraud with our comprehensive property verification system.",
    backgroundImage: HERO_VARIANTS.A.backgroundImage,
    fallbackImage: HERO_VARIANTS.A.fallbackImage,
    primaryCta: {
      text: "Verify Property Now",
      action: "start_verification",
      icon: <Shield className="w-5 h-5" />,
    },
    secondaryCta: {
      text: "See How It Works",
      action: "watch_demo",
      icon: <Play className="w-5 h-5" />,
    },
    theme: "trust",
    valueProposition: "Advanced fraud detection and document authentication",
    trustIndicators: [
      {
        label: "Properties Verified",
        value: "50,000+",
        icon: <Shield className="w-5 h-5" />,
      },
      {
        label: "Fraud Cases Prevented",
        value: "2,500+",
        icon: <CheckCircle className="w-5 h-5" />,
      },
      {
        label: "Success Rate",
        value: "99.8%",
        icon: <Star className="w-5 h-5" />,
      },
    ] as const,
  },
  {
    id: "premium-intelligence",
    title: "Premium Property Intelligence",
    subtitle:
      "Access exclusive market insights and connect with verified real estate professionals.",
    backgroundImage: HERO_VARIANTS.B.backgroundImage,
    fallbackImage: HERO_VARIANTS.B.fallbackImage,
    primaryCta: {
      text: "Explore Premium",
      action: "premium_access",
      icon: <Award className="w-5 h-5" />,
    },
    secondaryCta: {
      text: "View Market Data",
      action: "market_insights",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    theme: "premium",
    valueProposition: "Exclusive insights from verified professionals",
    trustIndicators: [
      {
        label: "Market Reports",
        value: "1,000+",
        icon: <TrendingUp className="w-5 h-5" />,
      },
      {
        label: "Verified Agents",
        value: "500+",
        icon: <Users className="w-5 h-5" />,
      },
      {
        label: "Premium Listings",
        value: "10,000+",
        icon: <Award className="w-5 h-5" />,
      },
    ] as const,
  },
  {
    id: "perfect-home",
    title: "Find Your Perfect Home",
    subtitle:
      "Discover authentic properties with confidence through our verified listing network.",
    backgroundImage: HERO_VARIANTS.C.backgroundImage,
    fallbackImage: HERO_VARIANTS.C.fallbackImage,
    primaryCta: {
      text: "Browse Properties",
      action: "search_properties",
      icon: <Home className="w-5 h-5" />,
    },
    secondaryCta: {
      text: "Get Personalized Matches",
      action: "personalized_search",
      icon: <Star className="w-5 h-5" />,
    },
    theme: "warm",
    valueProposition: "Curated listings from trusted sources",
    trustIndicators: [
      {
        label: "Active Listings",
        value: "25,000+",
        icon: <Home className="w-5 h-5" />,
      },
      {
        label: "Happy Tenants",
        value: "15,000+",
        icon: <CheckCircle className="w-5 h-5" />,
      },
      {
        label: "Cities Covered",
        value: "50+",
        icon: <MapPin className="w-5 h-5" />,
      },
    ] as const,
  },
  {
    id: "professional-network",
    title: "Professional Network Access",
    subtitle:
      "Connect with Kenya's most trusted real estate professionals and industry experts.",
    backgroundImage:
      HERO_VARIANTS.D?.backgroundImage || HERO_VARIANTS.A.backgroundImage,
    fallbackImage:
      HERO_VARIANTS.D?.fallbackImage || HERO_VARIANTS.A.fallbackImage,
    primaryCta: {
      text: "Find Professionals",
      action: "find_professionals",
      icon: <Users className="w-5 h-5" />,
    },
    secondaryCta: {
      text: "Join Network",
      action: "join_network",
      icon: <ArrowRight className="w-5 h-5" />,
    },
    theme: "professional",
    valueProposition: "Vetted professionals with proven track records",
    trustIndicators: [
      {
        label: "Verified Professionals",
        value: "1,200+",
        icon: <Users className="w-5 h-5" />,
      },
      {
        label: "Successful Transactions",
        value: "75,000+",
        icon: <CheckCircle className="w-5 h-5" />,
      },
      {
        label: "Client Satisfaction",
        value: "98%",
        icon: <Star className="w-5 h-5" />,
      },
    ] as const,
  },
] as const;

// Search suggestions with improved accessibility
const SEARCH_SUGGESTIONS: readonly SearchSuggestion[] = [
  {
    id: "downtown-apartments",
    text: "Downtown apartments",
    type: "property",
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    id: "verified-landlords",
    text: "Verified landlords",
    type: "feature",
    icon: <Shield className="w-4 h-4" />,
  },
  {
    id: "luxury-condos",
    text: "Luxury condos",
    type: "property",
    icon: <Star className="w-4 h-4" />,
  },
  {
    id: "near-me",
    text: "Near me",
    type: "location",
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    id: "pet-friendly",
    text: "Pet-friendly rentals",
    type: "feature",
    icon: <CheckCircle className="w-4 h-4" />,
  },
] as const;

// Theme configurations moved outside component for better performance
const THEME_CONFIGS: Record<HeroSlide["theme"], ThemeConfig> = {
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
} as const;

/**
 * Enhanced ConversionHero component with optimized performance and accessibility
 * Features dynamic theming, auto-playing carousel, and intelligent search suggestions
 */
export function ConversionHero({
  variant: _variant = "A", // Unused parameter prefixed with underscore
  onSearchSubmit,
  onCtaClick,
  className = "",
}: ConversionHeroProps): JSX.Element {
  // State management with proper typing
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchLocation, setSearchLocation] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);

  // Memoized current slide data to prevent unnecessary re-renders
  const currentSlideData = useMemo<HeroSlide>(
    () => HERO_SLIDES[currentSlide],
    [currentSlide]
  );

  // Memoized theme styles based on current slide theme
  const themeStyles = useMemo<ThemeConfig>(
    () => THEME_CONFIGS[currentSlideData.theme],
    [currentSlideData.theme]
  );

  // Optimized geolocation detection with proper error handling
  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    const handleLocationSuccess = (): void => {
      setIsLocationEnabled(true);
      setSearchLocation("Current Location");
    };

    const handleLocationError = (): void => {
      setIsLocationEnabled(false);
    };

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        timeout: GEOLOCATION_TIMEOUT,
        enableHighAccuracy: false, // Optimize for performance
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  // Auto-play carousel with cleanup optimization
  useEffect(() => {
    if (!isAutoPlaying) return;

    const intervalId = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % HERO_SLIDES.length);
    }, SLIDE_DURATION);

    return () => clearInterval(intervalId);
  }, [isAutoPlaying]);

  // Optimized carousel navigation with auto-play management
  const navigateToSlide = useCallback((index: number): void => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);

    // Resume auto-play after pause duration
    setTimeout(() => setIsAutoPlaying(true), PAUSE_DURATION);
  }, []);

  const navigateNext = useCallback((): void => {
    const nextIndex = (currentSlide + 1) % HERO_SLIDES.length;
    navigateToSlide(nextIndex);
  }, [currentSlide, navigateToSlide]);

  const navigatePrevious = useCallback((): void => {
    const prevIndex =
      (currentSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
    navigateToSlide(prevIndex);
  }, [currentSlide, navigateToSlide]);

  // Enhanced search submission handler with validation
  const handleSearchSubmit = useCallback(
    (event: React.FormEvent): void => {
      event.preventDefault();

      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) return;

      onSearchSubmit?.(trimmedQuery, searchLocation);
      onCtaClick?.(currentSlideData.id, "search_submit");
    },
    [
      searchQuery,
      searchLocation,
      onSearchSubmit,
      onCtaClick,
      currentSlideData.id,
    ]
  );

  // Optimized suggestion click handler
  const handleSuggestionClick = useCallback(
    (suggestion: SearchSuggestion): void => {
      setSearchQuery(suggestion.text);
      setShowSuggestions(false);
      onSearchSubmit?.(suggestion.text, searchLocation);
      onCtaClick?.(currentSlideData.id, "suggestion_click");
    },
    [searchLocation, onSearchSubmit, onCtaClick, currentSlideData.id]
  );

  // Simplified CTA click handler
  const handleCtaClick = useCallback(
    (action: string): void => {
      onCtaClick?.(currentSlideData.id, action);
    },
    [onCtaClick, currentSlideData.id]
  );

  // Enhanced location button handler
  const handleLocationClick = useCallback((): void => {
    setSearchLocation("Current Location");
    onCtaClick?.(currentSlideData.id, "location_used");
  }, [onCtaClick, currentSlideData.id]);

  // Optimized search input handlers
  const handleSearchInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setSearchQuery(event.target.value);
      setShowSuggestions(true);
    },
    []
  );

  const handleSearchInputFocus = useCallback((): void => {
    setShowSuggestions(true);
  }, []);

  const handleSearchInputBlur = useCallback((): void => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), SUGGESTION_DELAY);
  }, []);

  // Memoized filtered suggestions with improved performance
  const filteredSuggestions = useMemo<readonly SearchSuggestion[]>(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return SEARCH_SUGGESTIONS.slice(0, 3);
    }

    return SEARCH_SUGGESTIONS.filter((suggestion) =>
      suggestion.text.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [searchQuery]);

  // Memoized title rendering for complex title parsing
  const renderedTitle = useMemo<JSX.Element>(() => {
    const { title } = currentSlideData;

    if (!title.includes(".")) {
      return <span className={`block ${themeStyles.accent}`}>{title}</span>;
    }

    const titleParts = title.split(".");
    return (
      <>
        <span className="block">{titleParts[0]}.</span>
        <span className={`block ${themeStyles.accent}`}>{titleParts[1]}.</span>
        <span className="block">{titleParts[2]}.</span>
      </>
    );
  }, [currentSlideData, themeStyles.accent]);

  return (
    <section
      className={`relative min-h-screen flex items-center justify-center overflow-hidden pt-20 ${className}`}
      role="banner"
      aria-label="Hero section with property search"
    >
      {/* Optimized background with proper accessibility */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat brightness-50 contrast-125"
              style={{
                backgroundImage: `url(${slide.backgroundImage})`,
              }}
              role="img"
              aria-label={`Background for ${slide.title}`}
            />
            <div
              className={`absolute inset-0 bg-gradient-to-br transition-all duration-1000 ${
                index === currentSlide ?
                  themeStyles.gradient
                : "from-black/70 to-black/70"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Enhanced carousel navigation with accessibility */}
      <Button
        variant="outline"
        size="icon"
        onClick={navigatePrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm"
        aria-label="Go to previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={navigateNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm"
        aria-label="Go to next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* Enhanced slide indicators */}
      <nav
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20"
        aria-label="Slide navigation"
      >
        <div className="flex space-x-2">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => navigateToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-white scale-125" : (
                  "bg-white/50 hover:bg-white/75"
                )
              }`}
              aria-label={`Go to slide ${index + 1}: ${slide.title}`}
              aria-current={index === currentSlide ? "true" : "false"}
            />
          ))}
        </div>
      </nav>

      {/* Main content with enhanced structure */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-5xl mx-auto py-12">
          {/* Enhanced title with animation */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light mb-8 leading-tight text-shadow-lg animate-hero-fade-in">
            {renderedTitle}
          </h1>

          {/* Enhanced subtitle with better semantics */}
          <p className="text-lg md:text-xl lg:text-2xl mb-6 max-w-3xl mx-auto leading-relaxed text-white/95 animate-hero-slide-in text-shadow-md">
            {currentSlideData.subtitle}
          </p>

          {/* Value proposition with dynamic styling */}
          <p
            className={`text-base md:text-lg mb-10 max-w-2xl mx-auto font-medium animate-hero-slide-in text-shadow-sm ${themeStyles.accent}`}
          >
            {currentSlideData.valueProposition}
          </p>

          {/* Enhanced search section */}
          <div className="mb-12 animate-hero-scale-in">
            <Card className="max-w-2xl mx-auto bg-white/15 backdrop-blur-md border-white/30 shadow-2xl">
              <CardContent className="p-8">
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                        <Input
                          type="text"
                          placeholder="Search properties, locations, or features..."
                          value={searchQuery}
                          onChange={handleSearchInputChange}
                          onFocus={handleSearchInputFocus}
                          onBlur={handleSearchInputBlur}
                          className="pl-10 bg-white/25 border-white/40 text-white placeholder:text-white/70 focus:bg-white/35 focus:border-white/60 text-lg py-3"
                          aria-label="Search for properties"
                        />
                      </div>
                      {isLocationEnabled && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                          onClick={handleLocationClick}
                          aria-label="Use current location"
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Enhanced search suggestions */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border z-50"
                        role="listbox"
                        aria-label="Search suggestions"
                      >
                        {filteredSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 first:rounded-t-lg last:rounded-b-lg"
                            role="option"
                            aria-label={`Search for ${suggestion.text}`}
                          >
                            {suggestion.icon}
                            <span>{suggestion.text}</span>
                            <Badge
                              variant="outline"
                              className="ml-auto text-xs"
                            >
                              {suggestion.type}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced trust indicators */}
          <div className="mb-16 animate-hero-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {currentSlideData.trustIndicators.map((indicator) => (
                <div key={indicator.label} className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/25 mb-4 shadow-lg ${themeStyles.accent}`}
                  >
                    {indicator.icon}
                  </div>
                  <div
                    className={`text-3xl font-bold mb-2 text-shadow-sm ${themeStyles.accent}`}
                  >
                    {indicator.value}
                  </div>
                  <div className="text-sm text-white/90 font-medium">
                    {indicator.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-hero-scale-in">
            <Button
              size="lg"
              className={`px-10 py-5 text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ${themeStyles.button} ${themeStyles.glow}`}
              onClick={() => handleCtaClick(currentSlideData.primaryCta.action)}
            >
              {currentSlideData.primaryCta.icon}
              <span className="ml-3">{currentSlideData.primaryCta.text}</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-10 py-5 text-lg font-semibold border-white/40 text-white hover:bg-white/25 hover:border-white/60 hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              onClick={() =>
                handleCtaClick(currentSlideData.secondaryCta.action)
              }
            >
              {currentSlideData.secondaryCta.icon}
              <span className="ml-3">{currentSlideData.secondaryCta.text}</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
