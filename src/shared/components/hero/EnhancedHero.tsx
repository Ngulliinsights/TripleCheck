import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  MapPin,
  Play,
  Star,
  Shield,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  Award,
  Home,
  Building,
  Globe,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { HERO_VARIANTS } from "../../config/assets";

// Type declarations for Geolocation API
declare global {
  interface GeolocationCoordinates {
    readonly accuracy: number;
    readonly altitude: number | null;
    readonly altitudeAccuracy: number | null;
    readonly heading: number | null;
    readonly latitude: number;
    readonly longitude: number;
    readonly speed: number | null;
  }

  interface GeolocationPosition {
    readonly coords: GeolocationCoordinates;
    readonly timestamp: number;
  }
}

// Enhanced trust indicators with African focus
interface TrustIndicator {
  readonly label: string;
  readonly value: string;
  readonly icon: React.ReactNode;
  readonly description?: string;
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

interface EnhancedHeroProps {
  readonly variant?: "A" | "B" | "C";
  readonly onSearchSubmit?: (query: string, location?: string) => void;
  readonly onCtaClick?: (variant: string, action: string) => void;
  readonly className?: string;
}

// Enhanced hero slides with African property focus
const ENHANCED_HERO_SLIDES: readonly HeroSlide[] = [
  {
    id: "african-property-trust",
    title: "Verified. Transparent. Trusted.",
    subtitle:
      "Africa's most comprehensive property verification platform protecting your real estate investments across 54 countries.",
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
    valueProposition: "Advanced fraud detection across all African markets",
    trustIndicators: [
      {
        label: "African Countries",
        value: "54+",
        icon: <Globe className="w-5 h-5" />,
        description: "Complete coverage across Africa",
      },
      {
        label: "Properties Verified",
        value: "250K+",
        icon: <Shield className="w-5 h-5" />,
        description: "Verified properties across Africa",
      },
      {
        label: "Fraud Cases Prevented",
        value: "15K+",
        icon: <CheckCircle className="w-5 h-5" />,
        description: "Protecting African investors",
      },
      {
        label: "Success Rate",
        value: "99.8%",
        icon: <Star className="w-5 h-5" />,
        description: "Verification accuracy",
      },
    ] as const,
  },
  {
    id: "premium-african-intelligence",
    title: "Premium African Property Intelligence",
    subtitle:
      "Access exclusive market insights and connect with verified real estate professionals across Africa's fastest-growing markets.",
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
    valueProposition:
      "Exclusive insights from Africa's top property professionals",
    trustIndicators: [
      {
        label: "Market Reports",
        value: "5K+",
        icon: <TrendingUp className="w-5 h-5" />,
        description: "African market analysis",
      },
      {
        label: "Verified Agents",
        value: "2.5K+",
        icon: <Users className="w-5 h-5" />,
        description: "Trusted African professionals",
      },
      {
        label: "Premium Listings",
        value: "50K+",
        icon: <Award className="w-5 h-5" />,
        description: "Exclusive African properties",
      },
      {
        label: "Cities Covered",
        value: "200+",
        icon: <Building className="w-5 h-5" />,
        description: "Major African cities",
      },
    ] as const,
  },
  {
    id: "african-home-finder",
    title: "Find Your Perfect African Home",
    subtitle:
      "Discover authentic properties with confidence through our verified listing network spanning from Cairo to Cape Town.",
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
    valueProposition: "Curated listings from trusted African sources",
    trustIndicators: [
      {
        label: "Active Listings",
        value: "125K+",
        icon: <Home className="w-5 h-5" />,
        description: "Properties across Africa",
      },
      {
        label: "Happy Tenants",
        value: "75K+",
        icon: <CheckCircle className="w-5 h-5" />,
        description: "Satisfied African residents",
      },
      {
        label: "African Cities",
        value: "200+",
        icon: <MapPin className="w-5 h-5" />,
        description: "From Lagos to Nairobi",
      },
      {
        label: "Success Rate",
        value: "96%",
        icon: <Star className="w-5 h-5" />,
        description: "Successful placements",
      },
    ] as const,
  },
] as const;

// Theme configurations with African-inspired colors
const THEME_CONFIGS = {
  trust: {
    gradient: "from-emerald-900/80 via-teal-800/70 to-emerald-900/80",
    accent: "text-emerald-400",
    button: "bg-emerald-600 hover:bg-emerald-700 border-emerald-500",
    glow: "shadow-emerald-500/25",
  },
  premium: {
    gradient: "from-amber-900/80 via-orange-800/70 to-amber-900/80",
    accent: "text-amber-400",
    button: "bg-amber-600 hover:bg-amber-700 border-amber-500",
    glow: "shadow-amber-500/25",
  },
  warm: {
    gradient: "from-red-900/80 via-orange-800/70 to-red-900/80",
    accent: "text-orange-400",
    button: "bg-orange-600 hover:bg-orange-700 border-orange-500",
    glow: "shadow-orange-500/25",
  },
  professional: {
    gradient: "from-slate-900/80 via-blue-800/70 to-slate-900/80",
    accent: "text-blue-400",
    button: "bg-blue-600 hover:bg-blue-700 border-blue-500",
    glow: "shadow-blue-500/25",
  },
} as const;

const SLIDE_DURATION = 8000; // 8 seconds per slide
const PAUSE_DURATION = 12000; // 12 seconds pause after manual navigation

/**
 * Enhanced Hero component with Thunes-inspired best practices
 * Features dynamic statistics, progressive disclosure, and African market focus
 */
export function EnhancedHero({
  variant: _variant = "A",
  onSearchSubmit,
  onCtaClick,
  className = "",
}: EnhancedHeroProps): JSX.Element {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchLocation, setSearchLocation] = useState<string>("");
  const [, setShowSuggestions] = useState<boolean>(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);

  const currentSlideData = useMemo<HeroSlide>(
    () => ENHANCED_HERO_SLIDES[currentSlide],
    [currentSlide]
  );

  const themeStyles = useMemo(
    () => THEME_CONFIGS[currentSlideData.theme],
    [currentSlideData.theme]
  );

  // Enhanced geolocation with African cities
  useEffect(() => {
    if (!navigator.geolocation) return;

    const handleLocationSuccess = (
      _position: globalThis.GeolocationPosition
    ): void => {
      setIsLocationEnabled(true);
      // You could implement reverse geocoding here to get African city names
      setSearchLocation("Current Location");
    };

    const handleLocationError = (): void => {
      setIsLocationEnabled(false);
    };

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        timeout: 5000,
        enableHighAccuracy: false,
        maximumAge: 300000,
      }
    );
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const intervalId = setInterval(() => {
      setCurrentSlide(
        (prevSlide) => (prevSlide + 1) % ENHANCED_HERO_SLIDES.length
      );
    }, SLIDE_DURATION);

    return () => clearInterval(intervalId);
  }, [isAutoPlaying]);

  const navigateToSlide = useCallback((index: number): void => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), PAUSE_DURATION);
  }, []);

  const navigateNext = useCallback((): void => {
    const nextIndex = (currentSlide + 1) % ENHANCED_HERO_SLIDES.length;
    navigateToSlide(nextIndex);
  }, [currentSlide, navigateToSlide]);

  const navigatePrevious = useCallback((): void => {
    const prevIndex =
      (currentSlide - 1 + ENHANCED_HERO_SLIDES.length) %
      ENHANCED_HERO_SLIDES.length;
    navigateToSlide(prevIndex);
  }, [currentSlide, navigateToSlide]);

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

  const handleCtaClick = useCallback(
    (action: string): void => {
      onCtaClick?.(currentSlideData.id, action);
    },
    [onCtaClick, currentSlideData.id]
  );

  const handleLocationClick = useCallback((): void => {
    setSearchLocation("Current Location");
    onCtaClick?.(currentSlideData.id, "location_used");
  }, [onCtaClick, currentSlideData.id]);

  const handleSearchInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setSearchQuery(event.target.value);
      setShowSuggestions(true);
    },
    []
  );

  // Enhanced title rendering with better typography
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
      aria-label="Hero section with African property search"
    >
      {/* Enhanced background with better performance */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {ENHANCED_HERO_SLIDES.map((slide, index) => (
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

      {/* Navigation controls */}
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

      {/* Slide indicators */}
      <nav
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20"
        aria-label="Slide navigation"
      >
        <div className="flex space-x-2">
          {ENHANCED_HERO_SLIDES.map((slide, index) => (
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

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-6xl mx-auto py-12">
          {/* Enhanced title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light mb-8 leading-tight text-shadow-lg animate-hero-fade-in">
            {renderedTitle}
          </h1>

          {/* Enhanced subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl mb-6 max-w-4xl mx-auto leading-relaxed text-white/95 animate-hero-slide-in text-shadow-md">
            {currentSlideData.subtitle}
          </p>

          {/* Value proposition */}
          <p
            className={`text-base md:text-lg mb-10 max-w-3xl mx-auto font-medium animate-hero-slide-in text-shadow-sm ${themeStyles.accent}`}
          >
            {currentSlideData.valueProposition}
          </p>

          {/* Enhanced search section */}
          <div className="mb-12 animate-hero-scale-in">
            <Card className="max-w-3xl mx-auto bg-white/15 backdrop-blur-md border-white/30 shadow-2xl">
              <CardContent className="p-8">
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                        <Input
                          type="text"
                          placeholder="Search properties across Africa..."
                          value={searchQuery}
                          onChange={handleSearchInputChange}
                          className="pl-10 bg-white/25 border-white/40 text-white placeholder:text-white/70 focus:bg-white/35 focus:border-white/60 text-lg py-3"
                          aria-label="Search for African properties"
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
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced trust indicators with 4-column grid */}
          <div className="mb-16 animate-hero-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {currentSlideData.trustIndicators.map((indicator) => (
                <div key={indicator.label} className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/25 mb-4 shadow-lg ${themeStyles.accent}`}
                  >
                    {indicator.icon}
                  </div>
                  <div
                    className={`text-2xl md:text-3xl font-bold mb-2 text-shadow-sm ${themeStyles.accent}`}
                  >
                    {indicator.value}
                  </div>
                  <div className="text-sm text-white/90 font-medium mb-1">
                    {indicator.label}
                  </div>
                  {indicator.description && (
                    <div className="text-xs text-white/70">
                      {indicator.description}
                    </div>
                  )}
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
