"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedHero = EnhancedHero;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var useConsolidatedPropertySearch_1 = require("../../../property/hooks/useConsolidatedPropertySearch");
var assets_1 = require("../../config/assets");
var button_1 = require("../ui/button");
var input_1 = require("../ui/input");
// Optimized hero slides - moved icons to functions to reduce memory
var getSlideData = function (index) {
    var slides = [
        {
            id: "african-property-trust",
            title: "Verified. Transparent. Trusted.",
            subtitle: "Africa's most comprehensive property verification platform protecting your real estate investments across 54 countries.",
            backgroundImage: assets_1.HERO_VARIANTS.A.backgroundImage,
            theme: "trust",
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
            subtitle: "Access exclusive market insights and connect with verified real estate professionals across Africa's fastest-growing markets.",
            backgroundImage: assets_1.HERO_VARIANTS.B.backgroundImage,
            theme: "premium",
            valueProposition: "Exclusive insights from Africa's top property professionals",
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
            subtitle: "Discover authentic properties with confidence through our verified listing network spanning from Cairo to Cape Town.",
            backgroundImage: assets_1.HERO_VARIANTS.C.backgroundImage,
            theme: "warm",
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
    // eslint-disable-next-line security/detect-object-injection
    var slide = slides[index] || slides[0];
    if (!slide) {
        throw new Error('No slide data available');
    }
    return __assign(__assign({}, slide), { primaryCta: __assign(__assign({}, slide.primaryCta), { icon: <lucide_react_1.Shield className="w-5 h-5"/> }), secondaryCta: __assign(__assign({}, slide.secondaryCta), { icon: <lucide_react_1.Play className="w-5 h-5"/> }), trustIndicators: slide.trustIndicators.map(function (indicator) { return (__assign(__assign({}, indicator), { icon: <lucide_react_1.Globe className="w-5 h-5"/> })); }) });
};
// Theme configurations with African-inspired colors
var THEME_CONFIGS = {
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
};
var SLIDE_DURATION = 8000; // 8 seconds per slide
var PAUSE_DURATION = 12000; // 12 seconds pause after manual navigation
// Helper function to get theme gradient class
function getThemeGradientClass(theme) {
    switch (theme) {
        case 'trust':
            return 'gradient-trust-balanced';
        case 'premium':
            return 'gradient-premium-balanced';
        case 'warm':
            return 'gradient-warm-balanced';
        default:
            return 'gradient-professional-balanced';
    }
}
/**
 * Enhanced Hero component with Thunes-inspired best practices
 * Features dynamic statistics, progressive disclosure, and African market focus
 */
function EnhancedHero(_a) {
    var _this = this;
    var _b = _a.variant, _variant = _b === void 0 ? "A" : _b, onSearchSubmit = _a.onSearchSubmit, onCtaClick = _a.onCtaClick, _c = _a.className, className = _c === void 0 ? "" : _c;
    var _d = (0, react_1.useState)(0), currentSlide = _d[0], setCurrentSlide = _d[1];
    var _e = (0, react_1.useState)(true), isAutoPlaying = _e[0], setIsAutoPlaying = _e[1];
    var _f = (0, react_1.useState)(""), searchQuery = _f[0], setSearchQuery = _f[1];
    var _g = (0, react_1.useState)(""), searchLocation = _g[0], setSearchLocation = _g[1];
    var _h = (0, react_1.useState)(false), setShowSuggestions = _h[1];
    var _j = (0, react_1.useState)(false), isLocationEnabled = _j[0], setIsLocationEnabled = _j[1];
    var _k = (0, react_1.useState)(""), selectedCountry = _k[0], setSelectedCountry = _k[1];
    var _l = (0, react_1.useState)(""), selectedPropertyType = _l[0], setSelectedPropertyType = _l[1];
    var _m = (0, react_1.useState)(""), selectedVerificationStatus = _m[0], setSelectedVerificationStatus = _m[1];
    var currentSlideData = (0, react_1.useMemo)(function () { return getSlideData(currentSlide); }, [currentSlide]);
    var themeStyles = (0, react_1.useMemo)(function () { return THEME_CONFIGS[currentSlideData.theme]; }, [currentSlideData.theme]);
    // Optional geolocation for enhanced UX - only when user interacts
    var enableLocationIfAvailable = (0, react_1.useCallback)(function () {
        if (navigator.geolocation) {
            // eslint-disable-next-line sonarjs/no-intrusive-permissions
            navigator.geolocation.getCurrentPosition(function () { return setIsLocationEnabled(true); }, function () { return setIsLocationEnabled(false); }, { timeout: 3000, maximumAge: 300000 });
        }
    }, []);
    // Auto-play carousel - optimized
    (0, react_1.useEffect)(function () {
        if (!isAutoPlaying)
            return;
        var intervalId = setInterval(function () {
            setCurrentSlide(function (prevSlide) { return (prevSlide + 1) % 3; });
        }, SLIDE_DURATION);
        return function () { return clearInterval(intervalId); };
    }, [isAutoPlaying]);
    var navigateToSlide = (0, react_1.useCallback)(function (index) {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        setTimeout(function () { return setIsAutoPlaying(true); }, PAUSE_DURATION);
    }, []);
    var navigateNext = (0, react_1.useCallback)(function () {
        var nextIndex = (currentSlide + 1) % 3;
        navigateToSlide(nextIndex);
    }, [currentSlide, navigateToSlide]);
    var navigatePrevious = (0, react_1.useCallback)(function () {
        var prevIndex = (currentSlide - 1 + 3) % 3;
        navigateToSlide(prevIndex);
    }, [currentSlide, navigateToSlide]);
    var navigate = (0, react_router_dom_1.useNavigate)();
    var updateSearch = (0, useConsolidatedPropertySearch_1.useConsolidatedPropertySearch)().updateSearch;
    var handleSearchSubmit = (0, react_1.useCallback)(function (event) {
        event.preventDefault();
        var trimmedQuery = searchQuery.trim();
        // Build comprehensive search parameters
        var searchParams = {
            query: trimmedQuery || "",
            location: searchLocation || "",
            propertyType: selectedPropertyType || "",
            verified: selectedVerificationStatus === "verified",
            page: 1,
            limit: 12,
            sortBy: "relevance",
            sortOrder: "desc",
        };
        // Update the search state
        updateSearch(searchParams);
        // Navigate to search results with query parameters
        var urlParams = new URLSearchParams();
        if (trimmedQuery)
            urlParams.set("q", trimmedQuery);
        if (searchLocation)
            urlParams.set("location", searchLocation);
        if (selectedCountry)
            urlParams.set("country", selectedCountry);
        if (selectedPropertyType)
            urlParams.set("type", selectedPropertyType);
        if (selectedVerificationStatus)
            urlParams.set("status", selectedVerificationStatus);
        navigate("/search?".concat(urlParams.toString()));
        // Call the optional callback
        onSearchSubmit === null || onSearchSubmit === void 0 ? void 0 : onSearchSubmit(trimmedQuery || "advanced_search", urlParams.toString());
        onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick(currentSlideData.id, "search_submit");
    }, [
        searchQuery,
        searchLocation,
        selectedCountry,
        selectedPropertyType,
        selectedVerificationStatus,
        updateSearch,
        navigate,
        onSearchSubmit,
        onCtaClick,
        currentSlideData.id,
    ]);
    var handleCtaClick = (0, react_1.useCallback)(function (action) {
        // Handle different CTA actions
        switch (action) {
            case "start_verification":
            case "verify_property":
                navigate("/land-verification");
                break;
            case "watch_demo":
                // Let the parent component handle the video modal
                onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick(currentSlideData.id, action);
                return; // Don't navigate, let parent handle
            case "premium_access":
                navigate("/pricing");
                break;
            case "market_insights":
                navigate("/analytics");
                break;
            case "search_properties":
                navigate("/properties");
                break;
            case "personalized_search":
                navigate("/search");
                break;
            case "check_fraud":
                navigate("/trust/fraud-detection");
                break;
            case "find_expert":
                navigate("/find-professionals");
                break;
            default:
                // For unknown actions, just call the callback
                break;
        }
        onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick(currentSlideData.id, action);
    }, [navigate, onCtaClick, currentSlideData.id]);
    var handleLocationClick = (0, react_1.useCallback)(function () {
        enableLocationIfAvailable();
        setSearchLocation("Current Location");
        onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick(currentSlideData.id, "location_used");
    }, [enableLocationIfAvailable, onCtaClick, currentSlideData.id]);
    var handleVerifyProperty = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!searchQuery.trim()) {
                // Use console.warn instead of alert for better UX
                console.warn("Please enter a property ID or search query to verify");
                return [2 /*return*/];
            }
            try {
                // Navigate to land verification with the search query
                navigate("/land-verification?property=".concat(encodeURIComponent(searchQuery.trim())));
                onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick(currentSlideData.id, "verify_property");
            }
            catch (error) {
                console.error("Error initiating verification:", error);
                // Use console.error instead of alert
                console.error("Failed to initiate verification. Please try again.");
            }
            return [2 /*return*/];
        });
    }); }, [searchQuery, navigate, onCtaClick, currentSlideData.id]);
    var handleFraudCheck = (0, react_1.useCallback)(function () {
        if (!searchQuery.trim()) {
            // Use console.warn instead of alert for better UX
            return;
        }
        // Navigate to fraud detection with the search query
        navigate("/trust/fraud-detection?query=".concat(encodeURIComponent(searchQuery.trim())));
        onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick(currentSlideData.id, "check_fraud");
    }, [searchQuery, navigate, onCtaClick, currentSlideData.id]);
    var handleFindExpert = (0, react_1.useCallback)(function () {
        var location = searchLocation || selectedCountry;
        var queryParams = new URLSearchParams();
        if (location)
            queryParams.set("location", location);
        if (selectedPropertyType)
            queryParams.set("specialization", selectedPropertyType);
        navigate("/find-professionals?".concat(queryParams.toString()));
        onCtaClick === null || onCtaClick === void 0 ? void 0 : onCtaClick(currentSlideData.id, "find_expert");
    }, [searchLocation, selectedCountry, selectedPropertyType, navigate, onCtaClick, currentSlideData.id]);
    var handleSearchInputChange = (0, react_1.useCallback)(function (event) {
        setSearchQuery(event.target.value);
        setShowSuggestions(true);
    }, []);
    // Enhanced title rendering with better typography
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
    return (<section className={"glass-hero relative min-h-screen flex items-center justify-center overflow-hidden hero-section-reset ".concat(className)} role="banner" aria-label="Hero section with African property search">
      {/* Balanced gradient background with preserved image areas */}
      <div className="absolute inset-0 z-0">
        {/* Original image with enhanced clarity */}
        <div className="w-full h-full bg-cover bg-center bg-no-repeat image-clarity-enhanced hero-bg-positioned" style={{
            // CSS custom property for dynamic background image - necessary for runtime image changes
            // eslint-disable-next-line react/forbid-dom-props -- CSS custom properties require inline styles
            '--hero-bg-image': "url(".concat(currentSlideData.backgroundImage, ")"),
        }}/>
        
        {/* Theme-specific balanced gradient */}
        <div className={"absolute inset-0 ".concat(getThemeGradientClass(currentSlideData.theme))}/>
        
        {/* Subtle depth vignette */}
        <div className="absolute inset-0 gradient-balanced-radial opacity-60"/>
      </div>

      {/* Navigation controls with glassmorphism */}
      <button_1.Button variant="outline" size="icon" onClick={navigatePrevious} className="glass-btn absolute left-4 top-1/2 transform -translate-y-1/2 z-20 text-white" aria-label="Go to previous slide">
        <lucide_react_1.ChevronLeft className="w-5 h-5"/>
      </button_1.Button>

      <button_1.Button variant="outline" size="icon" onClick={navigateNext} className="glass-btn absolute right-4 top-1/2 transform -translate-y-1/2 z-20 text-white" aria-label="Go to next slide">
        <lucide_react_1.ChevronRight className="w-5 h-5"/>
      </button_1.Button>

      {/* Slide indicators */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {[0, 1, 2].map(function (_index, slideIndex) { return (<button key={slideIndex} onClick={function () { return navigateToSlide(slideIndex); }} className={"w-3 h-3 rounded-full transition-all ".concat(slideIndex === currentSlide ? "bg-white scale-125" : ("bg-white/50 hover:bg-white/75"))} aria-label={"Go to slide ".concat(slideIndex + 1)} title={"Go to slide ".concat(slideIndex + 1)}/>); })}
      </div>

      {/* Main content with balanced positioning */}
      <div className="relative z-10 container mx-auto px-4 text-white">
        <div className="max-w-6xl mx-auto py-12">
          {/* Content positioned to work with gradient balance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[80vh]">
            {/* Left side content - where gradient provides strong contrast */}
            <div className="lg:col-span-7 text-left lg:text-left">
              {/* Enhanced title with better positioning */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light mb-8 leading-tight animate-hero-fade-in">
                <span className="block text-enhanced-contrast">{renderedTitle}</span>
              </h1>

              {/* Enhanced subtitle */}
              <p className="text-lg md:text-xl lg:text-2xl mb-6 max-w-2xl leading-relaxed text-enhanced-subtle animate-hero-slide-in">
                {currentSlideData.subtitle}
              </p>

              {/* Value proposition */}
              <p className={"text-base md:text-lg mb-10 max-w-xl font-medium animate-hero-slide-in text-enhanced-accent ".concat(themeStyles.accent)}>
                {currentSlideData.valueProposition}
              </p>

              {/* Enhanced CTA buttons positioned for gradient balance */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-hero-scale-in">
                <button_1.Button size="lg" className={"px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ".concat(themeStyles.button, " ").concat(themeStyles.glow)} onClick={function () { return handleCtaClick(currentSlideData.primaryCta.action); }}>
                  {currentSlideData.primaryCta.icon}
                  <span className="ml-3">{currentSlideData.primaryCta.text}</span>
                </button_1.Button>
                <button_1.Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold border-white/40 text-white hover:bg-white/25 hover:border-white/60 hover:scale-105 transition-all duration-300 backdrop-blur-sm" onClick={function () {
            return handleCtaClick(currentSlideData.secondaryCta.action);
        }}>
                  {currentSlideData.secondaryCta.icon}
                  <span className="ml-3">{currentSlideData.secondaryCta.text}</span>
                </button_1.Button>
              </div>
            </div>

            {/* Right side - where image is preserved with minimal overlay */}
            <div className="lg:col-span-5 flex items-center justify-center">
              {/* Trust indicators repositioned */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md">
                <div className="grid grid-cols-2 gap-4">
                  {currentSlideData.trustIndicators.map(function (indicator, _index) { return (<div key={indicator.label} className="text-center">
                      <div className={"text-2xl font-bold mb-1 ".concat(themeStyles.accent, " drop-shadow-lg")}>
                        {indicator.value}
                      </div>
                      <div className="text-xs text-white/90 leading-tight">{indicator.label}</div>
                    </div>); })}
                </div>
              </div>
            </div>
          </div>

          {/* Search section repositioned below main content */}
          <div className="mb-12 mt-16">
            <div className="max-w-4xl mx-auto bg-white/15 backdrop-blur-md border border-white/30 rounded-xl p-6">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                {/* Main search input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <lucide_react_1.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5"/>
                    <input_1.Input type="text" placeholder="Search properties, locations, or verification status..." value={searchQuery} onChange={handleSearchInputChange} className="pl-10 bg-white/25 border-white/40 text-white placeholder:text-white/70 focus:bg-white/35 text-lg py-3"/>
                  </div>
                  {isLocationEnabled && (<button_1.Button type="button" variant="outline" size="icon" className="bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={handleLocationClick}>
                      <lucide_react_1.MapPin className="w-4 h-4"/>
                    </button_1.Button>)}
                </div>

                {/* Quick filters */}
                <div className="grid grid-cols-3 gap-3">
                  <select value={selectedCountry} onChange={function (e) { return setSelectedCountry(e.target.value); }} className="px-3 py-2 bg-white/25 border-white/40 text-white rounded text-sm" aria-label="Select country" title="Select country">
                    <option value="">Country</option>
                    <option value="kenya">Kenya</option>
                    <option value="nigeria">Nigeria</option>
                    <option value="south-africa">South Africa</option>
                  </select>
                  <select value={selectedPropertyType} onChange={function (e) { return setSelectedPropertyType(e.target.value); }} className="px-3 py-2 bg-white/25 border-white/40 text-white rounded text-sm" aria-label="Select property type" title="Select property type">
                    <option value="">Type</option>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                  </select>
                  <select value={selectedVerificationStatus} onChange={function (e) {
            return setSelectedVerificationStatus(e.target.value);
        }} className="px-3 py-2 bg-white/25 border-white/40 text-white rounded text-sm" aria-label="Select verification status" title="Select verification status">
                    <option value="">Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <button_1.Button type="button" variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={handleVerifyProperty}>
                    <lucide_react_1.Shield className="w-4 h-4 mr-1"/>
                    Verify
                  </button_1.Button>
                  <button_1.Button type="button" variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={handleFraudCheck}>
                    <lucide_react_1.CheckCircle className="w-4 h-4 mr-1"/>
                    Check Fraud
                  </button_1.Button>
                  <button_1.Button type="button" variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={handleFindExpert}>
                    <lucide_react_1.Users className="w-4 h-4 mr-1"/>
                    Find Expert
                  </button_1.Button>
                </div>

                {/* Search button */}
                <div className="text-center">
                  <button_1.Button type="submit" size="lg" className={"px-8 py-3 text-lg font-semibold ".concat(themeStyles.button)}>
                    <lucide_react_1.Search className="w-5 h-5 mr-2"/>
                    Search & Verify
                  </button_1.Button>
                </div>
              </form>
            </div>
          </div>


        </div>
      </div>
    </section>);
}
