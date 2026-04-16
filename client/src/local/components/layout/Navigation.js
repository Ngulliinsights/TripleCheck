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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Navigation = Navigation;
/* global requestAnimationFrame, cancelAnimationFrame */
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var MobileNavFallback_1 = require("../fallbacks/MobileNavFallback");
var MobileNav_1 = require("../navigation/MobileNav");
var SafeNavigation_1 = require("../navigation/SafeNavigation");
var button_1 = require("../ui/button");
var logo_1 = require("../ui/logo");
var wordmark_1 = require("../ui/wordmark");
var utils_1 = require("@/local/lib/utils");
// Enhanced style constants with selective blur effects
var STYLE_CONSTANTS = {
    BUTTON_HOVER: "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20",
    TRANSPARENT_HOVER: "hover:bg-white/10 hover:backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white/30",
    BUTTON_DISABLED: "disabled:opacity-50 disabled:cursor-not-allowed",
    DROPDOWN_ITEM: "w-full text-left px-4 py-3 hover:bg-primary/5 hover:text-primary transition-all duration-200 mx-2 rounded-lg group",
    TRANSPARENT_LIGHT: "text-white drop-shadow-lg hover:bg-white/10 hover:text-white hover:backdrop-blur-md",
    DEFAULT_DARK: "text-gray-700 hover:text-primary hover:bg-primary/5",
    NAV_HEIGHTS: {
        expanded: "88px",
        compact: "72px",
    },
    TIMEOUTS: {
        dropdown: 100, // Reduced for more responsive feel
        navigation: 100,
        search: 200,
    },
};
// Navigation data with proper typing - memoized to prevent recreation
var NAVIGATION_ITEMS = [
    {
        label: "Home",
        href: "/",
        primary: true,
        description: "Return to homepage",
    },
    {
        label: "Properties",
        href: "/properties",
        description: "Explore property listings",
        dropdown: [
            {
                label: "Browse Properties",
                href: "/properties",
                description: "Explore verified listings",
                cta: "Browse Now",
            },
            {
                label: "Residential",
                href: "/properties/residential",
                description: "Houses and apartments",
                cta: "View Homes",
            },
            {
                label: "Commercial",
                href: "/properties/commercial",
                description: "Office and retail spaces",
                cta: "View Commercial",
            },
            {
                label: "Land",
                href: "/properties/land",
                description: "Development opportunities",
                cta: "View Land",
            },
        ],
    },
    {
        label: "Services",
        href: "/services",
        description: "Our verification services",
        dropdown: [
            {
                label: "Property Verification",
                href: "/services/basic-checks",
                description: "Complete property checks",
                cta: "Start Now",
                featured: true,
            },
            {
                label: "Fraud Detection",
                href: "/services/fraud-detection",
                description: "AI-powered protection",
                cta: "Check Property",
            },
            {
                label: "Document Authentication",
                href: "/services/document-auth",
                description: "Secure verification",
                cta: "Verify Documents",
            },
            {
                label: "List Your Property",
                href: "/services/list-property",
                description: "Verified listings",
                cta: "List Now",
                highlight: true,
            },
        ],
    },
    {
        label: "Help",
        href: "/help",
        description: "Get support and information",
        dropdown: [
            {
                label: "Help Center",
                href: "/help",
                description: "Get support",
                cta: "Get Help",
            },
            {
                label: "Contact Us",
                href: "/contact",
                description: "Talk to experts",
                cta: "Contact",
            },
            {
                label: "About Us",
                href: "/our-story",
                description: "Our story",
                cta: "Learn More",
            },
            {
                label: "Plans & Pricing",
                href: "/pricing",
                description: "View our service plans",
                cta: "View Plans",
            },
        ],
    },
];
var SEARCH_SUGGESTIONS = [
    "Nairobi apartments",
    "Westlands properties",
    "Mombasa commercial",
    "Karen land for sale",
];
// Type guard function to safely check for dropdown items
function hasDropdown(item) {
    return "dropdown" in item && Array.isArray(item.dropdown);
}
function Navigation(_a) {
    var className = _a.className;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var location = (0, react_router_dom_1.useLocation)();
    // Core state with better organization
    var _b = (0, react_1.useState)({
        isScrolled: false,
        activeDropdown: null,
        isNavigating: false,
        hoveredDropdown: null, // New state for hover tracking
    }), navigationState = _b[0], setNavigationState = _b[1];
    var _c = (0, react_1.useState)({
        query: "",
        isFocused: false,
    }), searchState = _c[0], setSearchState = _c[1];
    // Refs for cleanup and DOM manipulation
    var navRef = (0, react_1.useRef)(null);
    var dropdownTimeoutRef = (0, react_1.useRef)(null);
    var scrollRafRef = (0, react_1.useRef)(null);
    // Memoized computed values to prevent unnecessary recalculations
    var isHomepage = (0, react_1.useMemo)(function () { return location.pathname === "/"; }, [location.pathname]);
    var shouldBeTransparent = (0, react_1.useMemo)(function () { return isHomepage && !navigationState.isScrolled; }, [isHomepage, navigationState.isScrolled]);
    // Optimized navigation handler with proper error handling
    var handleNavigation = (0, react_1.useCallback)(function (href, event) {
        if (navigationState.isNavigating || !href)
            return;
        event === null || event === void 0 ? void 0 : event.preventDefault();
        event === null || event === void 0 ? void 0 : event.stopPropagation();
        // Immediate UI cleanup - prevents race conditions
        setNavigationState(function (prev) { return (__assign(__assign({}, prev), { isNavigating: true, activeDropdown: null, hoveredDropdown: null })); });
        setSearchState(function (prev) { return (__assign(__assign({}, prev), { isFocused: false })); });
        // Clear any pending timeouts
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
            dropdownTimeoutRef.current = null;
        }
        try {
            navigate(href);
            // Reset navigation state after successful navigation
            setTimeout(function () {
                setNavigationState(function (prev) { return (__assign(__assign({}, prev), { isNavigating: false })); });
            }, STYLE_CONSTANTS.TIMEOUTS.navigation);
        }
        catch (error) {
            // Fallback navigation without console logging
            setNavigationState(function (prev) { return (__assign(__assign({}, prev), { isNavigating: false })); });
            window.location.href = href;
        }
    }, [navigate, navigationState.isNavigating]);
    // Optimized search handler with proper error handling
    var handleSearch = (0, react_1.useCallback)(function (query) {
        var trimmedQuery = query.trim();
        if (!trimmedQuery || navigationState.isNavigating)
            return;
        setNavigationState(function (prev) { return (__assign(__assign({}, prev), { isNavigating: true })); });
        setSearchState(function (prev) { return (__assign(__assign({}, prev), { isFocused: false })); });
        try {
            var searchUrl = "/search?q=".concat(encodeURIComponent(trimmedQuery));
            navigate(searchUrl);
            setTimeout(function () {
                setNavigationState(function (prev) { return (__assign(__assign({}, prev), { isNavigating: false })); });
            }, STYLE_CONSTANTS.TIMEOUTS.search);
        }
        catch (error) {
            // Fallback navigation without console logging
            setNavigationState(function (prev) { return (__assign(__assign({}, prev), { isNavigating: false })); });
            window.location.href = "/search?q=".concat(encodeURIComponent(trimmedQuery));
        }
    }, [navigate, navigationState.isNavigating]);
    // Scroll state update function
    var updateScrollState = (0, react_1.useCallback)(function () {
        var scrollTop = window.scrollY;
        var shouldBeScrolled = scrollTop > 20;
        var navHeight = shouldBeScrolled ?
            STYLE_CONSTANTS.NAV_HEIGHTS.compact
            : STYLE_CONSTANTS.NAV_HEIGHTS.expanded;
        setNavigationState(function (prev) {
            return prev.isScrolled !== shouldBeScrolled ? __assign(__assign({}, prev), { isScrolled: shouldBeScrolled }) : prev;
        });
        document.documentElement.style.setProperty("--nav-height", navHeight);
    }, []);
    // Highly optimized scroll handler with RAF throttling
    (0, react_1.useEffect)(function () {
        var handleScroll = function () {
            if (scrollRafRef.current)
                return;
            scrollRafRef.current = requestAnimationFrame(function () {
                updateScrollState();
                scrollRafRef.current = null;
            });
        };
        // Initialize scroll state
        updateScrollState();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return function () {
            window.removeEventListener("scroll", handleScroll);
            if (scrollRafRef.current) {
                cancelAnimationFrame(scrollRafRef.current);
            }
        };
    }, [updateScrollState]);
    // Enhanced dropdown handlers with immediate response and mutual exclusion
    var dropdownHandlers = (0, react_1.useMemo)(function () { return ({
        enter: function (itemLabel) {
            if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
                dropdownTimeoutRef.current = null;
            }
            // Close any other open dropdown and open this one
            setNavigationState(function (prev) { return (__assign(__assign({}, prev), { activeDropdown: itemLabel, hoveredDropdown: itemLabel })); });
        },
        leave: function () {
            setNavigationState(function (prev) { return (__assign(__assign({}, prev), { hoveredDropdown: null })); });
            if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
            }
            dropdownTimeoutRef.current = setTimeout(function () {
                setNavigationState(function (prev) { return (__assign(__assign({}, prev), { activeDropdown: null })); });
            }, STYLE_CONSTANTS.TIMEOUTS.dropdown);
        },
        toggle: function (itemLabel) {
            // Ensure only one dropdown is open at a time
            setNavigationState(function (prev) { return (__assign(__assign({}, prev), { activeDropdown: prev.activeDropdown === itemLabel ? null : itemLabel, hoveredDropdown: prev.activeDropdown === itemLabel ? null : itemLabel })); });
        },
    }); }, []);
    // Outside click handler function
    var handleOutsideClick = (0, react_1.useCallback)(function (event) {
        var _a;
        if ((_a = navRef.current) === null || _a === void 0 ? void 0 : _a.contains(event.target))
            return;
        setNavigationState(function (prev) { return (__assign(__assign({}, prev), { activeDropdown: null, hoveredDropdown: null })); });
        setSearchState(function (prev) { return (__assign(__assign({}, prev), { isFocused: false })); });
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
            dropdownTimeoutRef.current = null;
        }
    }, []);
    // Consolidated outside click handler
    (0, react_1.useEffect)(function () {
        document.addEventListener("mousedown", handleOutsideClick, {
            passive: true,
        });
        return function () { return document.removeEventListener("mousedown", handleOutsideClick); };
    }, [handleOutsideClick]);
    // Route change cleanup
    (0, react_1.useEffect)(function () {
        setNavigationState(function (prev) { return (__assign(__assign({}, prev), { isNavigating: false, activeDropdown: null, hoveredDropdown: null })); });
        setSearchState(function (prev) { return (__assign(__assign({}, prev), { isFocused: false })); });
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
            dropdownTimeoutRef.current = null;
        }
    }, [location.pathname]);
    // Comprehensive cleanup on unmount
    (0, react_1.useEffect)(function () {
        return function () {
            if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
            }
            if (scrollRafRef.current) {
                cancelAnimationFrame(scrollRafRef.current);
            }
        };
    }, []);
    // Enhanced class calculations with complete transparency and selective blur
    var navClasses = (0, react_1.useMemo)(function () {
        return (0, utils_1.cn)("fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out", 
        // Always transparent background - no backdrop blur on the nav itself
        "bg-transparent", navigationState.isScrolled ? "py-2" : "py-4", className);
    }, [navigationState.isScrolled, className]);
    var buttonBaseClasses = (0, react_1.useMemo)(function () { return ({
        hover: shouldBeTransparent ?
            "hover:bg-white/10 hover:backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white/30"
            : STYLE_CONSTANTS.BUTTON_HOVER,
        color: shouldBeTransparent ?
            "text-white drop-shadow-lg"
            : STYLE_CONSTANTS.DEFAULT_DARK,
    }); }, [shouldBeTransparent]);
    return (<nav ref={navRef} className={navClasses}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between min-h-[64px]">
          {/* Logo Section - Optimized for accessibility */}
          <div className="flex-shrink-0 min-w-[200px]">
            <button type="button" className={(0, utils_1.cn)("flex items-center gap-2.5 cursor-pointer transition-all duration-200 bg-transparent border-none p-1 -m-1 rounded-md focus:outline-none focus:ring-2", shouldBeTransparent ?
            "hover:bg-white/10 hover:backdrop-blur-md focus:ring-white/30 drop-shadow-lg"
            : "hover:bg-primary/5 focus:ring-primary/20")} onClick={function () { return handleNavigation("/"); }} disabled={navigationState.isNavigating} aria-label="Go to homepage">
              <logo_1.Logo size="md" variant={shouldBeTransparent ? "light" : "default"} interactive={false}/>
              <wordmark_1.Wordmark size="md" variant={shouldBeTransparent ? "light" : "default"} animated={true} interactive={false}/>
            </button>
          </div>

          {/* Desktop Navigation - Enhanced with better responsiveness */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-xl mx-12">
            {NAVIGATION_ITEMS.map(function (item) { return (<div key={item.label} className="relative">
                {hasDropdown(item) ?
                <button type="button" disabled={navigationState.isNavigating} className={(0, utils_1.cn)("flex items-center space-x-1.5 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm relative", buttonBaseClasses.hover, buttonBaseClasses.color, STYLE_CONSTANTS.BUTTON_DISABLED, (navigationState.activeDropdown === item.label ||
                        navigationState.hoveredDropdown === item.label) &&
                        (shouldBeTransparent ?
                            "bg-white/15 backdrop-blur-md"
                            : "bg-primary/10 text-primary"))} onClick={function () { return dropdownHandlers.toggle(item.label); }} onMouseEnter={function () { return dropdownHandlers.enter(item.label); }} onMouseLeave={dropdownHandlers.leave} aria-expanded={navigationState.activeDropdown === item.label ?
                        "true"
                        : "false"} aria-haspopup="true">
                    <span>{item.label}</span>
                    <lucide_react_1.ChevronDown className={(0, utils_1.cn)("w-3.5 h-3.5 transition-all duration-200", navigationState.activeDropdown === item.label &&
                        "rotate-180", navigationState.hoveredDropdown === item.label &&
                        !shouldBeTransparent &&
                        "text-primary")}/>
                  </button>
                : <button type="button" disabled={navigationState.isNavigating} onClick={function (e) { return handleNavigation(item.href, e); }} className={(0, utils_1.cn)("px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm", buttonBaseClasses.hover, buttonBaseClasses.color, STYLE_CONSTANTS.BUTTON_DISABLED)}>
                    {item.label}
                  </button>}

                {/* Enhanced Dropdown Menu with reduced width and better styling */}
                {hasDropdown(item) &&
                navigationState.activeDropdown === item.label && (<div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 py-3 z-50 animate-in slide-in-from-top-2 duration-200" onMouseEnter={function () { return dropdownHandlers.enter(item.label); }} onMouseLeave={dropdownHandlers.leave} role="menu" aria-orientation="vertical" tabIndex={-1}>
                      {item.dropdown.map(function (dropdownItem) { return (<button key={dropdownItem.href} type="button" disabled={navigationState.isNavigating} onClick={function (e) {
                        return handleNavigation(dropdownItem.href, e);
                    }} className={(0, utils_1.cn)("group block w-full text-left px-4 py-3 transition-all duration-200 mx-2 rounded-lg", "hover:bg-primary/8 hover:scale-[1.02] hover:shadow-sm", STYLE_CONSTANTS.BUTTON_DISABLED, dropdownItem.featured &&
                        "bg-gradient-to-r from-primary/8 to-primary/12 border-l-3 border-primary ml-2", dropdownItem.highlight &&
                        "bg-gradient-to-r from-secondary/8 to-secondary/12 border-l-3 border-secondary ml-2")} role="menuitem">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className={(0, utils_1.cn)("font-semibold text-sm transition-all duration-200 mb-1", "text-primary group-hover:text-primary/90", // All subheadings use primary color
                    dropdownItem.highlight &&
                        "text-secondary group-hover:text-secondary/90")}>
                                {dropdownItem.label}
                                {dropdownItem.featured && (<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                                    Popular
                                  </span>)}
                                {dropdownItem.highlight && (<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary border border-secondary/30">
                                    Sell
                                  </span>)}
                              </div>
                              <div className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                                {dropdownItem.description}
                              </div>
                            </div>
                            <div className="ml-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1">
                              <span className={(0, utils_1.cn)("text-xs font-semibold inline-flex items-center", dropdownItem.highlight ? "text-secondary" : ("text-primary"))}>
                                {dropdownItem.cta}
                                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                                </svg>
                              </span>
                            </div>
                          </div>
                        </button>); })}
                    </div>)}
              </div>); })}
          </div>

          {/* Enhanced Search Section with better transparency */}
          <div className="hidden lg:flex items-center space-x-3 flex-shrink-0 min-w-[320px] justify-end">
            <div className="relative">
              <div className="relative">
                <lucide_react_1.Search className={(0, utils_1.cn)("absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200", shouldBeTransparent ? "text-white/90 drop-shadow-lg" : "text-gray-400")}/>
                <input type="search" placeholder="Search properties..." value={searchState.query} disabled={navigationState.isNavigating} onChange={function (e) {
            return setSearchState(function (prev) { return (__assign(__assign({}, prev), { query: e.target.value })); });
        }} onFocus={function () {
            return !navigationState.isNavigating &&
                setSearchState(function (prev) { return (__assign(__assign({}, prev), { isFocused: true })); });
        }} onKeyDown={function (e) {
            if (e.key === "Enter" &&
                searchState.query &&
                !navigationState.isNavigating) {
                handleSearch(searchState.query);
            }
            if (e.key === "Escape") {
                setSearchState(function (prev) { return (__assign(__assign({}, prev), { isFocused: false })); });
            }
        }} className={(0, utils_1.cn)("w-44 pl-10 pr-4 py-2.5 rounded-lg border transition-all duration-200 text-sm", shouldBeTransparent ?
            "bg-white/10 backdrop-blur-md border-white/30 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:bg-white/15 focus:backdrop-blur-lg drop-shadow-lg"
            : "bg-white/90 backdrop-blur-sm border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white", STYLE_CONSTANTS.BUTTON_DISABLED)} aria-label="Search for properties"/>
              </div>

              {/* Enhanced Search Suggestions */}
              {searchState.isFocused && (<div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  {searchState.query ?
                <button type="button" disabled={navigationState.isNavigating} className="w-full text-left px-4 py-3 hover:bg-primary/5 hover:text-primary transition-all duration-200 mx-2 rounded-lg group" onClick={function () { return handleSearch(searchState.query); }}>
                      <div className="flex items-center">
                        <lucide_react_1.Search className="w-4 h-4 text-gray-400 group-hover:text-primary mr-3 transition-colors duration-200"/>
                        <span className="text-gray-900 group-hover:text-primary text-sm font-medium transition-colors duration-200">
                          Search for &quot;{searchState.query}&quot;
                        </span>
                      </div>
                    </button>
                : <>
                      <div className="px-4 py-2 text-xs font-semibold text-primary uppercase tracking-wide">
                        Popular Searches
                      </div>
                      {SEARCH_SUGGESTIONS.map(function (suggestion) { return (<button key={suggestion} type="button" disabled={navigationState.isNavigating} className="w-full text-left px-4 py-3 hover:bg-primary/5 hover:text-primary transition-all duration-200 mx-2 rounded-lg group" onClick={function () { return handleSearch(suggestion); }}>
                          <div className="flex items-center">
                            <lucide_react_1.Search className="w-4 h-4 text-gray-400 group-hover:text-primary mr-3 transition-colors duration-200"/>
                            <span className="text-gray-900 group-hover:text-primary text-sm transition-colors duration-200">
                              {suggestion}
                            </span>
                          </div>
                        </button>); })}
                    </>}
                </div>)}
            </div>

            {/* Enhanced B2B API Access */}
            <button_1.Button variant="outline" size="sm" onClick={function () { return handleNavigation("/api-demo"); }} disabled={navigationState.isNavigating} className={(0, utils_1.cn)("items-center space-x-1.5 text-xs font-medium px-3 py-2 transition-all duration-200", shouldBeTransparent ?
            "border-white/30 text-white hover:bg-white/10 hover:border-white/40 hover:backdrop-blur-md drop-shadow-lg"
            : "border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/40")}>
              <lucide_react_1.Building2 className="w-3.5 h-3.5"/>
              <span>API</span>
            </button_1.Button>

            <div className={(0, utils_1.cn)("h-5 w-px transition-colors duration-200", shouldBeTransparent ? "bg-white/40 drop-shadow-sm" : "bg-gray-300")}/>

            {/* Enhanced Authentication Buttons */}
            <button_1.Button variant="outline" size="sm" disabled={navigationState.isNavigating} onClick={function () { return handleNavigation("/auth/login"); }} className={(0, utils_1.cn)("text-sm font-medium px-4 py-2 transition-all duration-200", shouldBeTransparent ?
            "border-white/30 text-white hover:bg-white/10 hover:border-white/40 hover:backdrop-blur-md drop-shadow-lg"
            : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400")}>
              {navigationState.isNavigating ? "Loading..." : "Login"}
            </button_1.Button>
            <button_1.Button size="sm" disabled={navigationState.isNavigating} onClick={function () { return handleNavigation("/auth/register"); }} className={(0, utils_1.cn)("text-sm font-medium px-4 py-2 transition-all duration-200", shouldBeTransparent && "hover:backdrop-blur-md drop-shadow-lg")}>
              {navigationState.isNavigating ? "Loading..." : "Get Started"}
            </button_1.Button>
          </div>

          {/* Responsive Navigation */}
          <div className="hidden md:flex lg:hidden items-center space-x-2">
            <button_1.Button variant="outline" size="sm" disabled={navigationState.isNavigating} onClick={function () { return handleNavigation("/auth/login"); }} className={(0, utils_1.cn)("text-xs px-3 py-1.5 transition-all duration-200", shouldBeTransparent &&
            "border-white/30 text-white hover:bg-white/10 backdrop-blur-sm")}>
              Login
            </button_1.Button>
            <button_1.Button size="sm" disabled={navigationState.isNavigating} onClick={function () { return handleNavigation("/auth/register"); }} className={(0, utils_1.cn)("text-xs px-3 py-1.5 transition-all duration-200", shouldBeTransparent && "backdrop-blur-sm")}>
              Get Started
            </button_1.Button>
            <SafeNavigation_1.SafeNavigation fallback={<MobileNavFallback_1.MobileNavFallback />}>
              <MobileNav_1.MobileNav />
            </SafeNavigation_1.SafeNavigation>
          </div>

          <div className="md:hidden flex items-center">
            <SafeNavigation_1.SafeNavigation fallback={<MobileNavFallback_1.MobileNavFallback />}>
              <MobileNav_1.MobileNav />
            </SafeNavigation_1.SafeNavigation>
          </div>
        </div>
      </div>
    </nav>);
}
