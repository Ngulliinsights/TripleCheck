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
var button_1 = require("../ui/button");
var input_1 = require("../ui/input");
var logo_1 = require("../ui/logo");
var navigation_menu_1 = require("../ui/navigation-menu");
var wordmark_1 = require("../ui/wordmark");
var utils_1 = require("../../lib/utils");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
// Navigation with context awareness and micro-interactions
function Navigation() {
    var location = (0, react_router_dom_1.useLocation)();
    var _a = (0, react_1.useState)(false), scrolled = _a[0], setScrolled = _a[1];
    var _b = (0, react_1.useState)(false), searchFocused = _b[0], setSearchFocused = _b[1];
    var _c = (0, react_1.useState)(""), searchQuery = _c[0], setSearchQuery = _c[1];
    // Optimized scroll handler with throttling to improve performance
    var handleScroll = (0, react_1.useCallback)(function () {
        var shouldBeScrolled = window.scrollY > 20;
        if (shouldBeScrolled !== scrolled) {
            setScrolled(shouldBeScrolled);
        }
    }, [scrolled]);
    // Simplified scroll effect with better cleanup
    (0, react_1.useEffect)(function () {
        var timeoutId = null;
        var isActive = true;
        var throttledScrollHandler = function () {
            if (!isActive || timeoutId)
                return;
            timeoutId = setTimeout(function () {
                if (isActive) {
                    handleScroll();
                }
                timeoutId = null;
            }, 32); // Reduced frequency to prevent performance issues
        };
        try {
            window.addEventListener("scroll", throttledScrollHandler, {
                passive: true,
            });
        }
        catch (_a) {
            // Failed to add scroll listener - continue without scroll optimization
        }
        return function () {
            isActive = false;
            try {
                window.removeEventListener("scroll", throttledScrollHandler);
            }
            catch (_a) {
                // Failed to remove scroll listener - continue cleanup
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };
    }, [handleScroll]);
    // Memoized navigation sections to prevent unnecessary re-renders
    var navigationSections = (0, react_1.useMemo)(function () { return [
        {
            title: "Properties",
            icon: lucide_react_1.Building,
            items: [
                {
                    title: "Browse Properties",
                    href: "/properties",
                    description: "Find your next property investment",
                    keywords: ["apartments", "houses", "commercial"],
                },
                {
                    title: "Compare",
                    href: "/compare",
                    description: "Side-by-side property comparison",
                    keywords: ["analysis", "evaluation", "metrics"],
                },
                {
                    title: "Residential Properties",
                    href: "/properties/residential",
                    description: "Houses and apartments",
                    keywords: ["homes", "apartments", "residential"],
                },
            ],
        },
        {
            title: "Services",
            icon: lucide_react_1.BarChart3,
            items: [
                {
                    title: "Basic Checks",
                    href: "/services/basic-checks",
                    description: "Essential property verification",
                    keywords: ["documents", "legal", "validation"],
                },
                {
                    title: "Document Authentication",
                    href: "/services/document-auth",
                    description: "Secure document verification",
                    keywords: ["certificates", "titles", "permits"],
                },
                {
                    title: "Fraud Detection",
                    href: "/services/fraud-detection",
                    description: "AI-powered fraud protection",
                    keywords: ["security", "protection", "analysis"],
                },
                {
                    title: "Community & Resources",
                    href: "/community-resources",
                    description: "Share experiences and access fraud prevention resources",
                    keywords: [
                        "community",
                        "fraud",
                        "resources",
                        "prevention",
                        "reporting",
                        "guide",
                        "experiences",
                        "stories",
                        "support",
                        "emergency",
                    ],
                },
            ],
        },
    ]; }, []);
    // Enhanced search functionality with better UX
    var handleSearchFocus = (0, react_1.useCallback)(function () { return setSearchFocused(true); }, []);
    var handleSearchBlur = (0, react_1.useCallback)(function () {
        // Small delay to allow clicking on search suggestions
        setTimeout(function () { return setSearchFocused(false); }, 200);
    }, []);
    var handleSearchChange = (0, react_1.useCallback)(function (e) {
        setSearchQuery(e.target.value);
    }, []);
    // Helper function to check if an item matches the search query
    var itemMatchesQuery = (0, react_1.useCallback)(function (item, query) {
        var _a, _b;
        var lowerQuery = query.toLowerCase();
        var matchesTitle = item.title.toLowerCase().includes(lowerQuery);
        var matchesDescription = item.description.toLowerCase().includes(lowerQuery);
        var matchesKeywords = (_b = (_a = item.keywords) === null || _a === void 0 ? void 0 : _a.some(function (keyword) {
            return keyword.toLowerCase().includes(lowerQuery);
        })) !== null && _b !== void 0 ? _b : false;
        return matchesTitle || matchesDescription || matchesKeywords;
    }, []);
    // Filter navigation items based on search query for better search experience
    var filteredSuggestions = (0, react_1.useMemo)(function () {
        if (!searchQuery.trim())
            return [];
        var results = [];
        navigationSections.forEach(function (section) {
            section.items.forEach(function (item) {
                if (itemMatchesQuery(item, searchQuery)) {
                    results.push(__assign(__assign({}, item), { section: section.title }));
                }
            });
        });
        return results.slice(0, 5); // Limit to 5 results for better UX
    }, [searchQuery, navigationSections, itemMatchesQuery]);
    // Removed complex animations to prevent crashes
    // Extract search dropdown content to reduce nesting and improve readability
    var renderSearchSuggestions = function () {
        if (!searchQuery.trim()) {
            return (<div className="px-4 py-3">
          <div className="text-sm text-gray-600 mb-2">
            Popular searches:
          </div>
          <div className="flex flex-wrap gap-2">
            {["Apartments", "Office Space", "Land", "Commercial"].map(function (term) { return (<button key={term} type="button" className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors" onClick={function () { return setSearchQuery(term); }}>
                {term}
              </button>); })}
          </div>
        </div>);
        }
        if (filteredSuggestions.length === 0) {
            return (<div className="px-4 py-3 text-sm text-gray-500">
          No results found for &quot;{searchQuery}&quot;
        </div>);
        }
        return (<div className="max-h-64 overflow-y-auto">
        {filteredSuggestions.map(function (item, index) { return (<a key={"".concat(item.href, "-").concat(index)} href={item.href} className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
            <div className="font-medium text-gray-900">{item.title}</div>
            <div className="text-sm text-gray-600">{item.section}</div>
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
              {item.description}
            </div>
          </a>); })}
      </div>);
    };
    // Use location for conditional styling or active states
    var isCurrentPath = (0, react_1.useCallback)(function (path) { return location.pathname === path; }, [location.pathname]);
    return (<header className={(0, utils_1.cn)("fixed top-0 w-full z-50 transition-all duration-300", scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
            : "bg-transparent")}>
      <nav className="py-3" role="navigation" aria-label="Main navigation">
        <div className="container mx-auto px-1 flex items-center justify-between">
          {/* Logo with reduced padding - 4px instead of 16px */}
          <div className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <logo_1.Logo size="md" variant={scrolled ? "default" : "light"} interactive={true} href="/"/>
            <wordmark_1.Wordmark size="md" variant={scrolled ? "default" : "light"} animated={true} interactive={true} href="/"/>
          </div>

          {/* Main navigation moved to center */}
          <div className="flex items-center space-x-8 flex-1 justify-center">
            <navigation_menu_1.NavigationMenu>
              <navigation_menu_1.NavigationMenuList>
                {navigationSections.map(function (section) { return (<navigation_menu_1.NavigationMenuItem key={section.title}>
                    <navigation_menu_1.NavigationMenuTrigger className="flex items-center gap-2 text-gray-700 hover:text-gray-900" aria-label={"".concat(section.title, " menu")}>
                      <section.icon className="w-4 h-4" aria-hidden="true"/>
                      {section.title}
                    </navigation_menu_1.NavigationMenuTrigger>
                    <navigation_menu_1.NavigationMenuContent>
                      <ul className="grid gap-3 p-4 w-[400px] md:w-[500px] lg:w-[600px]" aria-label={"".concat(section.title, " navigation options")}>
                        {section.items.map(function (item) { return (<li key={item.title}>
                            <navigation_menu_1.NavigationMenuLink href={item.href} className={(0, utils_1.cn)("block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors", "hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900", "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", 
                // Add active state styling using location
                isCurrentPath(item.href) && "bg-blue-100 text-blue-900")} role="link" tabIndex={0}>
                              <div className="text-sm font-medium leading-none">
                                {item.title}
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                                {item.description}
                              </p>
                            </navigation_menu_1.NavigationMenuLink>
                          </li>); })}
                      </ul>
                    </navigation_menu_1.NavigationMenuContent>
                  </navigation_menu_1.NavigationMenuItem>); })}
              </navigation_menu_1.NavigationMenuList>
            </navigation_menu_1.NavigationMenu>
          </div>

          {/* Enhanced search and user actions */}
          <div className="flex items-center space-x-4">
            <div className={(0, utils_1.cn)("relative transition-all duration-200", searchFocused ? "w-96" : "w-64")}>
              <div className="relative">
                <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input_1.Input type="search" placeholder="Search properties, locations..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={searchQuery} onChange={handleSearchChange} onFocus={handleSearchFocus} onBlur={handleSearchBlur} aria-label="Search properties and locations"/>
              </div>

              {searchFocused && (<div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10 opacity-100 transition-opacity duration-200">
                  {renderSearchSuggestions()}
                </div>)}
            </div>

            <div className="flex items-center space-x-2">
              <button_1.Button variant="ghost" size="icon" aria-label="Notifications" className="relative hover:bg-gray-100">
                <lucide_react_1.Bell className="w-5 h-5"/>
                {/* Notification indicator */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button_1.Button>

              <button_1.Button variant="ghost" size="icon" aria-label="Help and support" className="hover:bg-gray-100">
                <lucide_react_1.HelpCircle className="w-5 h-5"/>
              </button_1.Button>

              {/* Developer Dashboard - Only show in development */}
              {import.meta.env.MODE === "development" && (<button_1.Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2 hover:bg-gray-100 text-xs" aria-label="Developer Dashboard" onClick={function () { return window.location.href = '/dev'; }}>
                  <lucide_react_1.BarChart3 className="w-3 h-3"/>
                  Dev
                </button_1.Button>)}

              <button_1.Button variant="outline" className="hidden md:flex items-center gap-2 hover:bg-gray-50" aria-label="User account">
                <lucide_react_1.User className="w-4 h-4"/>
                Account
              </button_1.Button>
            </div>
          </div>
        </div>
      </nav>
    </header>);
}
