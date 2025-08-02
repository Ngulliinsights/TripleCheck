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
} from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo } from "react";

import { HERO_VARIANTS } from "../../config/assets";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

// Simplified types
interface TrustIndicator {
  label: string;
  value: string;
  description?: string;
}

interface CTAButton {
  text: string;
  action: string;
  icon: React.ReactNode;
}

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  backgroundImage: string;
  primaryCta: CTAButton;
  secondaryCta: CTAButton;
  theme: "trust" | "premium" | "warm" | "professional";
  valueProposition: string;
  trustIndicators: TrustIndicator[];
}

interface EnhancedHeroProps {
  readonly variant?: "A" | "B" | "C";
  readonly onSearchSubmit?: (query: string, location?: string) => void;
  readonly onCtaClick?: (variant: string, action: string) => void;
  readonly className?: string;
}

// Optimized hero slides - moved icons to functions to reduce memory
const getSlideData = (index: number): HeroSlide => {
  const slides = [
    {
      id: "african-property-trust",
      title: "Verified. Transparent. Trusted.",
      subtitle:
        "Africa's most comprehensive property verification platform protecting your real estate investments across 54 countries.",
      backgroundImage: HERO_VARIANTS.A.backgroundImage,
      theme: "trust" as const,
      valueProposition: "Advanced fraud detection across all African markets",
      primaryCta: { text: "Verify Property Now", action: "start_verification" },
      secondaryCta: { text: "See How It Works", action: "watch_demo" },
      trustIndicators: [
        {
          label: "African Countries",
          value: "54+",
          description: "Complete coverage across Africa",
        },
        {
          label: "Properties Verified",
          value: "250K+",
          description: "Verified properties across Africa",
        },
        {
          label: "Fraud Cases Prevented",
          value: "15K+",
          description: "Protecting African investors",
        },
        {
          label: "Success Rate",
          value: "99.8%",
          description: "Verification accuracy",
        },
      ],
    },
    {
      id: "premium-african-intelligence",
      title: "Premium African Property Intelligence",
      subtitle:
        "Access exclusive market insights and connect with verified real estate professionals across Africa's fastest-growing markets.",
      backgroundImage: HERO_VARIANTS.B.backgroundImage,
      theme: "premium" as const,
      valueProposition:
        "Exclusive insights from Africa's top property professionals",
      primaryCta: { text: "Explore Premium", action: "premium_access" },
      secondaryCta: { text: "View Market Data", action: "market_insights" },
      trustIndicators: [
        {
          label: "Market Reports",
          value: "5K+",
          description: "African market analysis",
        },
        {
          label: "Verified Agents",
          value: "2.5K+",
          description: "Trusted African professionals",
        },
        {
          label: "Premium Listings",
          value: "50K+",
          description: "Exclusive African properties",
        },
        {
          label: "Cities Covered",
          value: "200+",
          description: "Major African cities",
        },
      ],
    },
    {
      id: "african-home-finder",
      title: "Find Your Perfect African Home",
      subtitle:
        "Discover authentic properties with confidence through our verified listing network spanning from Cairo to Cape Town.",
      backgroundImage: HERO_VARIANTS.C.backgroundImage,
      theme: "warm" as const,
      valueProposition: "Curated listings from trusted African sources",
      primaryCta: { text: "Browse Properties", action: "search_properties" },
      secondaryCta: {
        text: "Get Personalized Matches",
        action: "personalized_search",
      },
      trustIndicators: [
        {
          label: "Active Listings",
          value: "125K+",
          description: "Properties across Africa",
        },
        {
          label: "Happy Tenants",
          value: "75K+",
          description: "Satisfied African residents",
        },
        {
          label: "African Cities",
          value: "200+",
          description: "From Lagos to Nairobi",
        },
        {
          label: "Success Rate",
          value: "96%",
          description: "Successful placements",
        },
      ],
    },
  ];

  const slide = slides[index] || slides[0]!;
  return {
    ...slide,
    primaryCta: {
      ...slide.primaryCta,
      icon: <Shield className="w-5 h-5" />,
    },
    secondaryCta: {
      ...slide.secondaryCta,
      icon: <Play className="w-5 h-5" />,
    },
    trustIndicators: slide.trustIndicators.map((indicator) => ({
      ...indicator,
      icon: <Globe className="w-5 h-5" />,
    })),
  } as HeroSlide;
};

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
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("");
  const [selectedVerificationStatus, setSelectedVerificationStatus] =
    useState<string>("");

  const currentSlideData = useMemo<HeroSlide>(
    () => getSlideData(currentSlide),
    [currentSlide]
  );

  const themeStyles = useMemo(
    () => THEME_CONFIGS[currentSlideData.theme],
    [currentSlideData.theme]
  );

  // Simplified geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setIsLocationEnabled(true),
        () => setIsLocationEnabled(false),
        { timeout: 3000, maximumAge: 300000 }
      );
    }
  }, []);

  // Auto-play carousel - optimized
  useEffect(() => {
    if (!isAutoPlaying) return;

    const intervalId = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % 3);
    }, SLIDE_DURATION);

    return () => clearInterval(intervalId);
  }, [isAutoPlaying]);

  const navigateToSlide = useCallback((index: number): void => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), PAUSE_DURATION);
  }, []);

  const navigateNext = useCallback((): void => {
    const nextIndex = (currentSlide + 1) % 3;
    navigateToSlide(nextIndex);
  }, [currentSlide, navigateToSlide]);

  const navigatePrevious = useCallback((): void => {
    const prevIndex = (currentSlide - 1 + 3) % 3;
    navigateToSlide(prevIndex);
  }, [currentSlide, navigateToSlide]);

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent): void => {
      event.preventDefault();
      const trimmedQuery = searchQuery.trim();

      // Build comprehensive search parameters
      const searchParams = new URLSearchParams();
      if (trimmedQuery) searchParams.set("q", trimmedQuery);
      if (searchLocation) searchParams.set("location", searchLocation);
      if (selectedCountry) searchParams.set("country", selectedCountry);
      if (selectedPropertyType) searchParams.set("type", selectedPropertyType);
      if (selectedVerificationStatus)
        searchParams.set("status", selectedVerificationStatus);

      // Pass the full search query with filters
      const fullSearchQuery = trimmedQuery || "advanced_search";
      const searchLocationWithFilters = searchParams.toString();

      onSearchSubmit?.(fullSearchQuery, searchLocationWithFilters);
      onCtaClick?.(currentSlideData.id, "search_submit");
    },
    [
      searchQuery,
      searchLocation,
      selectedCountry,
      selectedPropertyType,
      selectedVerificationStatus,
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
      className={`relative min-h-screen flex items-center justify-center overflow-hidden ${className}`}
      role="banner"
      aria-label="Hero section with African property search"
      style={{
        // Remove hardcoded padding since parent container now handles navigation spacing
        paddingTop: 0
      }}
    >
      {/* Optimized background */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center brightness-50"
          style={{
            backgroundImage: `url(${currentSlideData.backgroundImage})`,
          }}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-br ${themeStyles.gradient}`}
        />
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
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => navigateToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-white scale-125" : (
                "bg-white/50 hover:bg-white/75"
              )
            }`}
            aria-label={`Go to slide ${index + 1}`}
            title={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

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

          {/* Optimized search section */}
          <div className="mb-12">
            <div className="max-w-4xl mx-auto bg-white/15 backdrop-blur-md border border-white/30 rounded-xl p-6">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                {/* Main search input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search properties, locations, or verification status..."
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      className="pl-10 bg-white/25 border-white/40 text-white placeholder:text-white/70 focus:bg-white/35 text-lg py-3"
                    />
                  </div>
                  {isLocationEnabled && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                      onClick={handleLocationClick}
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Quick filters */}
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="px-3 py-2 bg-white/25 border-white/40 text-white rounded text-sm"
                    aria-label="Select country"
                    title="Select country"
                  >
                    <option value="">Country</option>
                    <option value="kenya">Kenya</option>
                    <option value="nigeria">Nigeria</option>
                    <option value="south-africa">South Africa</option>
                  </select>
                  <select
                    value={selectedPropertyType}
                    onChange={(e) => setSelectedPropertyType(e.target.value)}
                    className="px-3 py-2 bg-white/25 border-white/40 text-white rounded text-sm"
                    aria-label="Select property type"
                    title="Select property type"
                  >
                    <option value="">Type</option>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                  </select>
                  <select
                    value={selectedVerificationStatus}
                    onChange={(e) =>
                      setSelectedVerificationStatus(e.target.value)
                    }
                    className="px-3 py-2 bg-white/25 border-white/40 text-white rounded text-sm"
                    aria-label="Select verification status"
                    title="Select verification status"
                  >
                    <option value="">Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={() => handleCtaClick("verify_property")}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Verify
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={() => handleCtaClick("check_fraud")}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Check Fraud
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={() => handleCtaClick("find_expert")}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Find Expert
                  </Button>
                </div>

                {/* Search button */}
                <div className="text-center">
                  <Button
                    type="submit"
                    size="lg"
                    className={`px-8 py-3 text-lg font-semibold ${themeStyles.button}`}
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Search & Verify
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {currentSlideData.trustIndicators.map((indicator) => (
                <div key={indicator.label} className="text-center">
                  <div
                    className={`text-2xl font-bold mb-1 ${themeStyles.accent}`}
                  >
                    {indicator.value}
                  </div>
                  <div className="text-sm text-white/90">{indicator.label}</div>
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
