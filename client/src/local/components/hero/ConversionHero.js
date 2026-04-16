"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversionHero = ConversionHero;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var assets_1 = require("../../config/assets");
var badge_1 = require("../ui/badge");
var button_1 = require("../ui/button");
var card_1 = require("../ui/card");
var input_1 = require("../ui/input");
// Configuration constants moved outside component to prevent recreation
var SLIDE_DURATION = 6000; // 6 seconds per slide
var PAUSE_DURATION = 10000; // 10 seconds pause after manual navigation
var GEOLOCATION_TIMEOUT = 5000; // 5 seconds for location detection
var SUGGESTION_DELAY = 200; // 200ms delay before hiding suggestions
// Optimized hero slides configuration with readonly properties
var HERO_SLIDES = [
    {
        id: "trust-verification",
        title: "Verified. Transparent. Trusted.",
        subtitle: "Protect yourself from fraud with our comprehensive property verification system.",
        backgroundImage: assets_1.HERO_VARIANTS.A.backgroundImage,
        fallbackImage: assets_1.HERO_VARIANTS.A.fallbackImage,
        primaryCta: {
            text: "Verify Property Now",
            action: "start_verification",
            icon: <lucide_react_1.Shield className="w-5 h-5"/>,
        },
        secondaryCta: {
            text: "See How It Works",
            action: "watch_demo",
            icon: <lucide_react_1.Play className="w-5 h-5"/>,
        },
        theme: "trust",
        valueProposition: "Advanced fraud detection and document authentication",
        trustIndicators: [
            {
                label: "Properties Verified",
                value: "50,000+",
                icon: <lucide_react_1.Shield className="w-5 h-5"/>,
            },
            {
                label: "Fraud Cases Prevented",
                value: "2,500+",
                icon: <lucide_react_1.CheckCircle className="w-5 h-5"/>,
            },
            {
                label: "Success Rate",
                value: "99.8%",
                icon: <lucide_react_1.Star className="w-5 h-5"/>,
            },
        ],
    },
    {
        id: "premium-intelligence",
        title: "Premium Property Intelligence",
        subtitle: "Access exclusive market insights and connect with verified real estate professionals.",
        backgroundImage: assets_1.HERO_VARIANTS.B.backgroundImage,
        fallbackImage: assets_1.HERO_VARIANTS.B.fallbackImage,
        primaryCta: {
            text: "Explore Premium",
            action: "premium_access",
            icon: <lucide_react_1.Award className="w-5 h-5"/>,
        },
        secondaryCta: {
            text: "View Market Data",
            action: "market_insights",
            icon: <lucide_react_1.TrendingUp className="w-5 h-5"/>,
        },
        theme: "premium",
        valueProposition: "Exclusive insights from verified professionals",
        trustIndicators: [
            {
                label: "Market Reports",
                value: "1,000+",
                icon: <lucide_react_1.TrendingUp className="w-5 h-5"/>,
            },
            {
                label: "Verified Agents",
                value: "500+",
                icon: <lucide_react_1.Users className="w-5 h-5"/>,
            },
            {
                label: "Premium Listings",
                value: "10,000+",
                icon: <lucide_react_1.Award className="w-5 h-5"/>,
            },
        ],
    },
    {
        id: "perfect-home",
        title: "Find Your Perfect Home",
        subtitle: "Discover authentic properties with confidence through our verified listing network.",
        backgroundImage: assets_1.HERO_VARIANTS.C.backgroundImage,
        fallbackImage: assets_1.HERO_VARIANTS.C.fallbackImage,
        primaryCta: {
            text: "Browse Properties",
            action: "search_properties",
            icon: <lucide_react_1.Home className="w-5 h-5"/>,
        },
        secondaryCta: {
            text: "Get Personalized Matches",
            action: "personalized_search",
            icon: <lucide_react_1.Star className="w-5 h-5"/>,
        },
        theme: "warm",
        valueProposition: "Curated listings from trusted sources",
        trustIndicators: [
            {
                label: "Active Listings",
                value: "25,000+",
                icon: <lucide_react_1.Home className="w-5 h-5"/>,
            },
            {
                label: "Happy Tenants",
                value: "15,000+",
                icon: <lucide_react_1.CheckCircle className="w-5 h-5"/>,
            },
            {
                label: "Cities Covered",
                value: "50+",
                icon: <lucide_react_1.MapPin className="w-5 h-5"/>,
            },
        ],
    },
    {
        id: "professional-network",
        title: "Professional Network Access",
        subtitle: "Connect with Kenya's most trusted real estate professionals and industry experts.",
        backgroundImage: ((_a = assets_1.HERO_VARIANTS.D) === null || _a === void 0 ? void 0 : _a.backgroundImage) || assets_1.HERO_VARIANTS.A.backgroundImage,
        fallbackImage: ((_b = assets_1.HERO_VARIANTS.D) === null || _b === void 0 ? void 0 : _b.fallbackImage) || assets_1.HERO_VARIANTS.A.fallbackImage,
        primaryCta: {
            text: "Find Professionals",
            action: "find_professionals",
            icon: <lucide_react_1.Users className="w-5 h-5"/>,
        },
        secondaryCta: {
            text: "Join Network",
            action: "join_network",
            icon: <lucide_react_1.ArrowRight className="w-5 h-5"/>,
        },
        theme: "professional",
        valueProposition: "Vetted professionals with proven track records",
        trustIndicators: [
            {
                label: "Verified Professionals",
                value: "1,200+",
                icon: <lucide_react_1.Users className="w-5 h-5"/>,
            },
            {
                label: "Successful Transactions",
                value: "75,000+",
                icon: <lucide_react_1.CheckCircle className="w-5 h-5"/>,
            },
            {
                label: "Client Satisfaction",
                value: "98%",
                icon: <lucide_react_1.Star className="w-5 h-5"/>,
            },
        ],
    },
];
// Search suggestions with improved accessibility
var SEARCH_SUGGESTIONS = [
    {
        id: "downtown-apartments",
        text: "Downtown apartments",
        type: "property",
        icon: <lucide_react_1.MapPin className="w-4 h-4"/>,
    },
    {
        id: "verified-landlords",
        text: "Verified landlords",
        type: "feature",
        icon: <lucide_react_1.Shield className="w-4 h-4"/>,
    },
    {
        id: "luxury-condos",
        text: "Luxury condos",
        type: "property",
        icon: <lucide_react_1.Star className="w-4 h-4"/>,
    },
    {
        id: "near-me",
        text: "Near me",
        type: "location",
        icon: <lucide_react_1.MapPin className="w-4 h-4"/>,
    },
    {
        id: "pet-friendly",
        text: "Pet-friendly rentals",
        type: "feature",
        icon: <lucide_react_1.CheckCircle className="w-4 h-4"/>,
    },
];
// Theme configurations moved outside component for better performance
var THEME_CONFIGS = {
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
};
/**
 * Enhanced ConversionHero component with optimized performance and accessibility
 * Features dynamic theming, auto-playing carousel, and intelligent search suggestions
 */
function ConversionHero(_a) {
    var _b = _a.variant, _variant = _b === void 0 ? "A" : _b, // Unused parameter prefixed with underscore
    onSearchSubmit = _a.onSearchSubmit, onCtaClick = _a.onCtaClick, _c = _a.className, className = _c === void 0 ? "" : _c;
    // State management with proper typing
    var _d = (0, react_1.useState)(0), currentSlide = _d[0], setCurrentSlide = _d[1];
    var _e = (0, react_1.useState)(true), isAutoPlaying = _e[0], setIsAutoPlaying = _e[1];
    var _f = (0, react_1.useState)(""), searchQuery = _f[0], setSearchQuery = _f[1];
    var _g = (0, react_1.useState)(""), searchLocation = _g[0], setSearchLocation = _g[1];
    var _h = (0, react_1.useState)(false), showSuggestions = _h[0], setShowSuggestions = _h[1];
    var _j = (0, react_1.useState)(false), isLocationEnabled = _j[0], setIsLocationEnabled = _j[1];
    // Memoized current slide data to prevent unnecessary re-renders
    var currentSlideData = (0, react_1.useMemo)(function () { return HERO_SLIDES[currentSlide] || HERO_SLIDES[0] || { title: '', subtitle: '', image: '', cta: '' }; }, [currentSlide]);
    // Memoized theme styles based on current slide theme
    var themeStyles = (0, react_1.useMemo)(function () { return THEME_CONFIGS[currentSlideData.theme]; }, [currentSlideData.theme]);
    // Optimized geolocation detection with proper error handling
    (0, react_1.useEffect)(function () {
        if (!navigator.geolocation) {
            return;
        }
        var handleLocationSuccess = function () {
            setIsLocationEnabled(true);
            setSearchLocation("Current Location");
        };
        var handleLocationError = function () {
            setIsLocationEnabled(false);
        };
        navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError, {
            timeout: GEOLOCATION_TIMEOUT,
            enableHighAccuracy: false, // Optimize for performance
            maximumAge: 300000, // Cache for 5 minutes
        });
    }, []);
    // Auto-play carousel with cleanup optimization
    (0, react_1.useEffect)(function () {
        if (!isAutoPlaying)
            return;
        var intervalId = setInterval(function () {
            setCurrentSlide(function (prevSlide) { return (prevSlide + 1) % HERO_SLIDES.length; });
        }, SLIDE_DURATION);
        return function () { return clearInterval(intervalId); };
    }, [isAutoPlaying]);
    // Optimized carousel navigation with auto-play management
    var navigateToSlide = (0, react_1.useCallback)(function (index) {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        // Resume auto-play after pause duration
        setTimeout(function () { return setIsAutoPlaying(true); }, PAUSE_DURATION);
    }, []);
    var navigateNext = (0, react_1.useCallback)(function () {
        var nextIndex = (currentSlide + 1) % HERO_SLIDES.length;
        navigateToSlide(nextIndex);
    }, [currentSlide, navigateToSlide]);
    var navigatePrevious = (0, react_1.useCallback)(function () {
        var prevIndex = (currentSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
        navigateToSlide(prevIndex);
    }, [currentSlide, navigateToSlide]);
    // Enhanced search submission handler with validation
    var handleSearchSubmit = (0, react_1.useCallback)(function (event) {
        event.preventDefault();
        var trimmedQuery = searchQuery.trim();
        if (!trimmedQuery)
            return;
        onSearchSubmit === null || onSearchSubmit === void 0 ? void 0 : onSearchSubmit(trimmedQuery, searchLocation);
        onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick(currentSlideData.id, "search_submit");
    }, [
        searchQuery,
        searchLocation,
        onSearchSubmit,
        onCtaClick,
        currentSlideData.id,
    ]);
    // Optimized suggestion click handler
    var handleSuggestionClick = (0, react_1.useCallback)(function (suggestion) {
        setSearchQuery(suggestion.text);
        setShowSuggestions(false);
        onSearchSubmit === null || onSearchSubmit === void 0 ? void 0 : onSearchSubmit(suggestion.text, searchLocation);
        onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick(currentSlideData.id, "suggestion_click");
    }, [searchLocation, onSearchSubmit, onCtaClick, currentSlideData.id]);
    // Simplified CTA click handler
    var handleCtaClick = (0, react_1.useCallback)(function (action) {
        onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick(currentSlideData.id, action);
    }, [onCtaClick, currentSlideData.id]);
    // Enhanced location button handler
    var handleLocationClick = (0, react_1.useCallback)(function () {
        setSearchLocation("Current Location");
        onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick(currentSlideData.id, "location_used");
    }, [onCtaClick, currentSlideData.id]);
    // Optimized search input handlers
    var handleSearchInputChange = (0, react_1.useCallback)(function (event) {
        setSearchQuery(event.target.value);
        setShowSuggestions(true);
    }, []);
    var handleSearchInputFocus = (0, react_1.useCallback)(function () {
        setShowSuggestions(true);
    }, []);
    var handleSearchInputBlur = (0, react_1.useCallback)(function () {
        // Delay hiding suggestions to allow for clicks
        setTimeout(function () { return setShowSuggestions(false); }, SUGGESTION_DELAY);
    }, []);
    // Memoized filtered suggestions with improved performance
    var filteredSuggestions = (0, react_1.useMemo)(function () {
        var query = searchQuery.trim().toLowerCase();
        if (!query) {
            return SEARCH_SUGGESTIONS.slice(0, 3);
        }
        return SEARCH_SUGGESTIONS.filter(function (suggestion) {
            return suggestion.text.toLowerCase().includes(query);
        }).slice(0, 5);
    }, [searchQuery]);
    // Memoized title rendering for complex title parsing
    var renderedTitle = (0, react_1.useMemo)(function () {
        var title = currentSlideData.title;
        if (!title.includes(".")) {
            return <span className={"block ".concat(themeStyles.accent)}>{title}</span>;
        }
        var titleParts = title.split(".");
        return (<>
        <span className="block">{titleParts[0]}.</span>
        <span className={"block ".concat(themeStyles.accent)}>{titleParts[1]}.</span>
        <span className="block">{titleParts[2]}.</span>
      </>);
    }, [currentSlideData, themeStyles.accent]);
    return (<section className={"relative min-h-screen flex items-center justify-center overflow-hidden pt-20 ".concat(className)} role="banner" aria-label="Hero section with property search">
      {/* Optimized background with proper accessibility */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {HERO_SLIDES.map(function (slide, index) { return (<div key={slide.id} className={"absolute inset-0 transition-opacity duration-1000 ".concat(index === currentSlide ? "opacity-100" : "opacity-0")}>
            <div className="w-full h-full bg-cover bg-center bg-no-repeat brightness-50 contrast-125" style={{
                backgroundImage: "url(".concat(slide.backgroundImage, ")"),
            }} role="img" aria-label={"Background for ".concat(slide.title)}/>
            <div className={"absolute inset-0 bg-gradient-to-br transition-all duration-1000 ".concat(index === currentSlide ?
                themeStyles.gradient
                : "from-black/70 to-black/70")}/>
          </div>); })}
      </div>

      {/* Enhanced carousel navigation with accessibility */}
      <button_1.Button variant="outline" size="icon" onClick={navigatePrevious} className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm" aria-label="Go to previous slide">
        <lucide_react_1.ChevronLeft className="w-5 h-5"/>
      </button_1.Button>

      <button_1.Button variant="outline" size="icon" onClick={navigateNext} className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm" aria-label="Go to next slide">
        <lucide_react_1.ChevronRight className="w-5 h-5"/>
      </button_1.Button>

      {/* Enhanced slide indicators */}
      <nav className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20" aria-label="Slide navigation">
        <div className="flex space-x-2">
          {HERO_SLIDES.map(function (slide, index) { return (<button key={slide.id} type="button" onClick={function () { return navigateToSlide(index); }} className={"w-3 h-3 rounded-full transition-all duration-300 ".concat(index === currentSlide ? "bg-white scale-125" : ("bg-white/50 hover:bg-white/75"))} aria-label={"Go to slide ".concat(index + 1, ": ").concat(slide.title)} aria-current={index === currentSlide ? "true" : "false"}/>); })}
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
          <p className={"text-base md:text-lg mb-10 max-w-2xl mx-auto font-medium animate-hero-slide-in text-shadow-sm ".concat(themeStyles.accent)}>
            {currentSlideData.valueProposition}
          </p>

          {/* Enhanced search section */}
          <div className="mb-12 animate-hero-scale-in">
            <card_1.Card className="max-w-2xl mx-auto bg-white/15 backdrop-blur-md border-white/30 shadow-2xl">
              <card_1.CardContent className="p-8">
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5"/>
                        <input_1.Input type="text" placeholder="Search properties, locations, or features..." value={searchQuery} onChange={handleSearchInputChange} onFocus={handleSearchInputFocus} onBlur={handleSearchInputBlur} className="pl-10 bg-white/25 border-white/40 text-white placeholder:text-white/70 focus:bg-white/35 focus:border-white/60 text-lg py-3" aria-label="Search for properties"/>
                      </div>
                      {isLocationEnabled && (<button_1.Button type="button" variant="outline" size="icon" className="bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={handleLocationClick} aria-label="Use current location">
                          <lucide_react_1.MapPin className="w-4 h-4"/>
                        </button_1.Button>)}
                    </div>

                    {/* Enhanced search suggestions */}
                    {showSuggestions && filteredSuggestions.length > 0 && (<div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border z-50" role="listbox" aria-label="Search suggestions">
                        {filteredSuggestions.map(function (suggestion) { return (<button key={suggestion.id} type="button" onClick={function () { return handleSuggestionClick(suggestion); }} className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 first:rounded-t-lg last:rounded-b-lg" role="option" aria-label={"Search for ".concat(suggestion.text)}>
                            {suggestion.icon}
                            <span>{suggestion.text}</span>
                            <badge_1.Badge variant="outline" className="ml-auto text-xs">
                              {suggestion.type}
                            </badge_1.Badge>
                          </button>); })}
                      </div>)}
                  </div>
                </form>
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* Enhanced trust indicators */}
          <div className="mb-16 animate-hero-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {currentSlideData.trustIndicators.map(function (indicator) { return (<div key={indicator.label} className="text-center">
                  <div className={"inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/25 mb-4 shadow-lg ".concat(themeStyles.accent)}>
                    {indicator.icon}
                  </div>
                  <div className={"text-3xl font-bold mb-2 text-shadow-sm ".concat(themeStyles.accent)}>
                    {indicator.value}
                  </div>
                  <div className="text-sm text-white/90 font-medium">
                    {indicator.label}
                  </div>
                </div>); })}
            </div>
          </div>

          {/* Enhanced CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-hero-scale-in">
            <button_1.Button size="lg" className={"px-10 py-5 text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ".concat(themeStyles.button, " ").concat(themeStyles.glow)} onClick={function () { return handleCtaClick(currentSlideData.primaryCta.action); }}>
              {currentSlideData.primaryCta.icon}
              <span className="ml-3">{currentSlideData.primaryCta.text}</span>
            </button_1.Button>
            <button_1.Button size="lg" variant="outline" className="px-10 py-5 text-lg font-semibold border-white/40 text-white hover:bg-white/25 hover:border-white/60 hover:scale-105 transition-all duration-300 backdrop-blur-sm" onClick={function () {
            return handleCtaClick(currentSlideData.secondaryCta.action);
        }}>
              {currentSlideData.secondaryCta.icon}
              <span className="ml-3">{currentSlideData.secondaryCta.text}</span>
            </button_1.Button>
          </div>
        </div>
      </div>
    </section>);
}
