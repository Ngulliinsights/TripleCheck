"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileNav = MobileNav;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var utils_1 = require("../../lib/utils");
var button_1 = require("../ui/button");
var input_1 = require("../ui/input");
var logo_1 = require("../ui/logo");
var wordmark_1 = require("../ui/wordmark");
// Simple logging utility for development
var logError = function (message, error) {
    if (process.env.NODE_ENV === "development") {
        console.warn(message, error);
    }
};
/**
 * Enhanced MobileNav Component
 *
 * Strategic consolidation: This component combines the best features from both
 * layout and navigation versions, providing a comprehensive mobile navigation solution.
 *
 * Features:
 * - Advanced search functionality
 * - Collapsible navigation sections
 * - Authentication state handling
 * - Quick action buttons
 * - Smooth animations and transitions
 * - Accessibility compliance
 */
function MobileNav(_a) {
    var className = _a.className, _b = _a.variant, variant = _b === void 0 ? "default" : _b, controlledIsOpen = _a.isOpen, onToggle = _a.onToggle;
    var navigate = (0, react_router_dom_1.useNavigate)();
    // State management - support both controlled and uncontrolled modes
    var _c = (0, react_1.useState)(false), internalIsOpen = _c[0], setInternalIsOpen = _c[1];
    var isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    var setIsOpen = onToggle || setInternalIsOpen;
    var _d = (0, react_1.useState)(new Set()), expandedSections = _d[0], setExpandedSections = _d[1];
    var _e = (0, react_1.useState)(""), searchQuery = _e[0], setSearchQuery = _e[1];
    // Refs for DOM manipulation
    var overlayRef = (0, react_1.useRef)(null);
    var panelRef = (0, react_1.useRef)(null);
    // Safe navigation with proper error handling
    var handleNavigation = (0, react_1.useCallback)(function (href, event) {
        try {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            // Close mobile menu immediately
            setIsOpen(false);
            // Navigate using React Router
            navigate(href);
        }
        catch (error) {
            logError("Mobile navigation error:", error);
            // Fallback to direct navigation
            window.location.href = href;
        }
    }, [navigate, setIsOpen]);
    // Search functionality
    var handleSearch = (0, react_1.useCallback)(function (query) {
        if (!query.trim())
            return;
        try {
            setIsOpen(false);
            var searchUrl = "/search?q=".concat(encodeURIComponent(query.trim()));
            navigate(searchUrl);
        }
        catch (error) {
            logError("Mobile search navigation error:", error);
            window.location.href = "/search?q=".concat(encodeURIComponent(query.trim()));
        }
    }, [navigate, setIsOpen]);
    // Handle search form submission
    var handleSearchSubmit = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        handleSearch(searchQuery);
    }, [handleSearch, searchQuery]);
    // Configuration data with modern icons
    var quickActions = [
        {
            label: "Home",
            href: "/",
            icon: <lucide_react_1.Home className="w-5 h-5"/>,
            color: "text-blue-600"
        },
        {
            label: "Properties",
            href: "/properties",
            icon: <lucide_react_1.Building2 className="w-5 h-5"/>,
            color: "text-green-600"
        },
        {
            label: "Verify",
            href: "/services/basic-checks",
            icon: <lucide_react_1.Shield className="w-5 h-5"/>,
            color: "text-purple-600"
        },
        {
            label: "List Property",
            href: "/services/list-property",
            icon: <lucide_react_1.DollarSign className="w-5 h-5"/>,
            color: "text-orange-600"
        },
    ];
    var navigationItems = [
        {
            label: "Properties",
            href: "/properties",
            icon: <lucide_react_1.Building2 className="w-4 h-4"/>,
            items: [
                { label: "All Properties", href: "/properties" },
                { label: "Residential", href: "/properties/residential" },
                { label: "Commercial", href: "/properties/commercial" },
                { label: "Land", href: "/properties/land" },
            ],
        },
        {
            label: "Services",
            href: "/services",
            icon: <lucide_react_1.Shield className="w-4 h-4"/>,
            items: [
                { label: "Property Verification", href: "/services/basic-checks" },
                { label: "Fraud Detection", href: "/services/fraud-detection" },
                { label: "Document Authentication", href: "/services/document-auth" },
                { label: "Trust & Reputation", href: "/services/reputation" },
            ],
        },
        {
            label: "Solutions",
            href: "/solutions",
            icon: <lucide_react_1.HelpCircle className="w-4 h-4"/>,
            items: [
                { label: "For Buyers", href: "/solutions/buyers" },
                { label: "For Sellers", href: "/solutions/sellers" },
                { label: "For Agents", href: "/solutions/agents" },
                { label: "For Developers", href: "/solutions/developers" },
            ],
        },
    ];
    // Section toggle functionality
    var toggleSection = (0, react_1.useCallback)(function (sectionId) {
        setExpandedSections(function (prev) {
            var newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            }
            else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    }, []);
    // Handle click outside and escape key
    (0, react_1.useEffect)(function () {
        if (!isOpen)
            return;
        var handleClickOutside = function (event) {
            if (overlayRef.current && event.target === overlayRef.current) {
                setIsOpen(false);
            }
        };
        var handleEscapeKey = function (event) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };
        // Prevent background scroll
        var originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscapeKey);
        return function () {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscapeKey);
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen, setIsOpen]);
    // Reset state when menu closes
    (0, react_1.useEffect)(function () {
        if (!isOpen) {
            setExpandedSections(new Set());
            setSearchQuery("");
        }
    }, [isOpen]);
    // Authentication state - this would typically come from a context or hook
    var isAuthenticated = false; // Replace with actual auth state check
    return (<>
      {/* Menu Trigger Button - Only show if not controlled */}
      {onToggle === undefined && (<button_1.Button variant="ghost" size="sm" onClick={function () { return setIsOpen(true); }} className={(0, utils_1.cn)("lg:hidden transition-colors duration-200", variant === "transparent" ?
                "text-white hover:bg-white/10"
                : "text-gray-700 hover:bg-gray-100", className)} aria-label="Open navigation menu">
          <lucide_react_1.Menu className="h-5 w-5"/>
        </button_1.Button>)}

      {/* Mobile Menu Overlay */}
      {isOpen && (<div ref={overlayRef} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-nav-title">
          {/* Sliding Panel */}
          <div ref={panelRef} className={(0, utils_1.cn)("fixed top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-md shadow-2xl transform transition-transform duration-300 ease-out", isOpen ? "translate-x-0" : "translate-x-full")}>
            {/* Header Section */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary to-primary-600">
              <div className="flex items-center gap-2">
                <logo_1.Logo size="sm" variant="light" interactive={false}/>
                <wordmark_1.Wordmark size="sm" variant="light" animated={true} interactive={false}/>
              </div>
              <button_1.Button variant="ghost" size="sm" onClick={function () { return setIsOpen(false); }} className="text-white hover:bg-white/10 rounded-full" aria-label="Close navigation menu">
                <lucide_react_1.X className="h-5 w-5"/>
              </button_1.Button>
            </div>

            {/* Search Section */}
            <div className="p-4 bg-gray-50/50 border-b border-gray-200">
              <form onSubmit={handleSearchSubmit} className="relative">
                <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                <input_1.Input type="search" placeholder="Search properties..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }} className="pl-10 bg-white border-gray-200 focus:border-primary focus:ring-primary/20 rounded-lg" aria-label="Search properties"/>
              </form>
            </div>

            {/* Quick Actions Grid */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map(function (action) { return (<button_1.Button key={action.href} variant="outline" className="h-20 flex-col gap-2 text-xs font-medium border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200" onClick={function (e) { return handleNavigation(action.href, e); }}>
                    <div className={(0, utils_1.cn)("flex items-center justify-center", action.color)}>
                      {action.icon}
                    </div>
                    <span className="text-gray-700">{action.label}</span>
                  </button_1.Button>); })}
              </div>
            </div>

            {/* Navigation Content */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-4 space-y-2" role="navigation" aria-label="Main navigation">
                {navigationItems.map(function (item) { return (<div key={item.label} className="space-y-1">
                    <button_1.Button variant="ghost" className="w-full justify-between text-left font-medium py-3 px-3 hover:bg-gray-50 rounded-lg" onClick={function () { return item.items ? toggleSection(item.label) : handleNavigation(item.href); }} aria-expanded={item.items ? expandedSections.has(item.label) : undefined} aria-controls={item.items ? "section-".concat(item.label.toLowerCase()) : undefined}>
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-gray-900">{item.label}</span>
                      </div>
                      {item.items && (<lucide_react_1.ChevronDown className={(0, utils_1.cn)("h-4 w-4 transition-transform duration-200 text-gray-400", expandedSections.has(item.label) && "rotate-180")} aria-hidden="true"/>)}
                    </button_1.Button>

                    {/* Collapsible Content */}
                    {item.items && (<div id={"section-".concat(item.label.toLowerCase())} className={(0, utils_1.cn)("overflow-hidden transition-all duration-300 ease-out", expandedSections.has(item.label) ?
                        "max-h-64 opacity-100"
                        : "max-h-0 opacity-0")}>
                        <div className="ml-7 space-y-1 pt-1">
                          {item.items.map(function (subItem) { return (<button_1.Button key={subItem.href} variant="ghost" className="w-full justify-start text-left text-sm py-2 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md" onClick={function (e) { return handleNavigation(subItem.href, e); }}>
                              {subItem.label}
                            </button_1.Button>); })}
                        </div>
                      </div>)}
                  </div>); })}

                {/* Direct Navigation Links */}
                <div className="space-y-1 pt-4 border-t border-gray-200">
                  <button_1.Button variant="ghost" className="w-full justify-start text-left py-3 px-3 hover:bg-gray-50 rounded-lg" onClick={function (e) { return handleNavigation("/pricing", e); }}>
                    <div className="flex items-center gap-3">
                      <lucide_react_1.DollarSign className="w-4 h-4 text-gray-500"/>
                      <span className="text-gray-900">Pricing</span>
                    </div>
                  </button_1.Button>
                  <button_1.Button variant="ghost" className="w-full justify-start text-left py-3 px-3 hover:bg-gray-50 rounded-lg" onClick={function (e) { return handleNavigation("/help", e); }}>
                    <div className="flex items-center gap-3">
                      <lucide_react_1.HelpCircle className="w-4 h-4 text-gray-500"/>
                      <span className="text-gray-900">Help</span>
                    </div>
                  </button_1.Button>
                </div>
              </nav>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 bg-gray-50/50 p-4">
              {isAuthenticated ? (
            // Authenticated user actions
            <div className="flex gap-3">
                  <button_1.Button variant="outline" size="sm" className="flex-1 border-gray-200 hover:border-primary/30" onClick={function (e) { return handleNavigation("/dashboard", e); }}>
                    <lucide_react_1.User className="w-4 h-4 mr-2"/>
                    Dashboard
                  </button_1.Button>
                  <button_1.Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3" onClick={function () {
                    // Handle logout functionality here
                    setIsOpen(false);
                }} aria-label="Sign out">
                    <lucide_react_1.LogOut className="w-4 h-4"/>
                  </button_1.Button>
                </div>) : (
            // Unauthenticated user actions
            <div className="flex gap-3">
                  <button_1.Button variant="outline" size="sm" className="flex-1 border-gray-200 hover:border-primary/30" onClick={function (e) { return handleNavigation("/auth/login", e); }}>
                    Sign In
                  </button_1.Button>
                  <button_1.Button size="sm" className="flex-1 bg-primary hover:bg-primary-600" onClick={function (e) { return handleNavigation("/auth/register", e); }}>
                    Get Started
                  </button_1.Button>
                </div>)}
            </div>
          </div>
        </div>)}
    </>);
}
