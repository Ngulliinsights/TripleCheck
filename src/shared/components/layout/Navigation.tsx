import { Search, ChevronDown, Building2 } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { MobileNavFallback } from "../fallbacks/MobileNavFallback";
import { MobileNav } from "../navigation/MobileNav";
import { SafeNavigation } from "../navigation/SafeNavigation";
import { Button } from "../ui/button";
import { Logo } from "../ui/logo";
import { Wordmark } from "../ui/wordmark";

import { cn } from "@/shared/lib/utils";

interface NavigationProps {
  readonly className?: string;
  readonly variant?: "default" | "transparent";
}

// Constants for duplicate strings
const BUTTON_HOVER_CLASSES =
  "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20";
const TRANSPARENT_BUTTON_HOVER_CLASSES =
  "hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20";
const BUTTON_DISABLED_CLASSES =
  "disabled:opacity-50 disabled:cursor-not-allowed";
const DROPDOWN_BUTTON_CLASSES =
  "w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors duration-150 mx-1 rounded-lg";
const TRANSPARENT_LIGHT_CLASSES = "text-white hover:bg-white/10 hover:text-white";
const DEFAULT_DARK_CLASSES = "text-gray-700 hover:text-primary";

// Helper function to get navigation items
function getNavigationItems() {
  return [
    {
      label: "Home",
      href: "/",
      primary: true,
      description: "Return to homepage",
    },
    {
      label: "Properties",
      href: "/properties",
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
}

// Helper function to get search suggestions
function getSearchSuggestions() {
  return [
    "Nairobi apartments",
    "Westlands properties",
    "Mombasa commercial",
    "Karen land for sale",
  ];
}

export function Navigation({
  className,
  variant = "transparent",
}: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if we're on the homepage for transparent navbar
  const isHomepage = location.pathname === "/";
  const shouldBeTransparent = isHomepage && !isScrolled;

  // Enhanced safe navigation function with proper timeout management
  const handleNavigation = useCallback(
    (href: string, event?: React.MouseEvent) => {
      // Prevent multiple simultaneous navigations
      if (isNavigating) return;

      try {
        // Prevent default link behavior if event is provided
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }

        // Validate href before navigation
        if (!href || typeof href !== "string") {
          throw new Error("Invalid navigation href");
        }

        // Set loading state
        setIsNavigating(true);

        // Clean up UI state immediately
        setActiveDropdown(null);
        setIsSearchFocused(false);

        // Clear any pending dropdown timeouts
        if (dropdownTimeoutRef.current) {
          clearTimeout(dropdownTimeoutRef.current);
          dropdownTimeoutRef.current = null;
        }

        // Use navigate with proper error handling
        navigate(href);

        // Reset loading state after a short delay
        setTimeout(() => {
          setIsNavigating(false);
        }, 100);
      } catch (error) {
        setIsNavigating(false);
        // Navigation failed, falling back to window.location
        // Navigation failed, using fallback - log in development only
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn("Navigation failed, using fallback", error);
        }

        // Fallback to direct navigation
        try {
          window.location.href = href;
        } catch (fallbackError) {
          // Complete navigation failure - log in development only
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.error("Complete navigation failure", fallbackError);
          }
          // Last resort - reload to home
          window.location.href = "/";
        }
      }
    },
    [navigate, isNavigating]
  );

  // Safe search function with proper error handling
  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim() || isNavigating) return;

      try {
        setIsNavigating(true);
        setIsSearchFocused(false);

        const searchUrl = `/search?q=${encodeURIComponent(query.trim())}`;
        navigate(searchUrl);

        // Reset navigation state
        setTimeout(() => setIsNavigating(false), 200);
      } catch (error) {
        setIsNavigating(false);
        // Search navigation failed - log in development only
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn("Search navigation failed", error);
        }

        // Fallback to direct URL navigation
        try {
          window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
        } catch (fallbackError) {
          // Search fallback failed - log in development only
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.error("Search fallback failed", fallbackError);
          }
        }
      }
    },
    [navigate, isNavigating]
  );

  // Enhanced scroll detection with proper throttling and cleanup
  useEffect(() => {
    let ticking = false;
    let rafId: number | null = null;

    const handleScroll = () => {
      if (!ticking) {
        rafId = window.requestAnimationFrame(() => {
          try {
            const scrollTop = window.scrollY;
            const shouldBeScrolled = scrollTop > 20;

            // Only update state if it actually changed to prevent unnecessary re-renders
            setIsScrolled((prev) =>
              prev !== shouldBeScrolled ? shouldBeScrolled : prev
            );

            // Update CSS custom property for scroll-aware spacing
            document.documentElement.style.setProperty(
              "--nav-height",
              shouldBeScrolled ? "72px" : "88px" // py-2 + content ≈ 72px, py-4 + content ≈ 88px
            );
          } catch (error) {
            // Scroll handler error - log in development only
            if (process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.warn("Scroll handler error", error);
            }
          } finally {
            ticking = false;
            rafId = null;
          }
        });
        ticking = true;
      }
    };

    // Set initial nav height
    document.documentElement.style.setProperty("--nav-height", "88px");

    // Initial scroll check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Debounced dropdown handlers to prevent hanging
  const handleDropdownEnter = useCallback((itemLabel: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(itemLabel);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150); // Small delay to prevent flickering
  }, []);

  // Close dropdown when clicking outside with proper cleanup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        if (
          navRef.current &&
          event.target &&
          !navRef.current.contains(event.target as Node)
        ) {
          setActiveDropdown(null);
          setIsSearchFocused(false);
          if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
            dropdownTimeoutRef.current = null;
          }
        }
      } catch (error) {
        // Click outside handler error - log in development only
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn("Click outside handler error", error);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
        dropdownTimeoutRef.current = null;
      }
    };
  }, []);

  // Reset navigation state on route change
  useEffect(() => {
    setIsNavigating(false);
    setActiveDropdown(null);
    setIsSearchFocused(false);
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
  }, [location.pathname]);

  // Comprehensive cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear all timeouts
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
        dropdownTimeoutRef.current = null;
      }

      // Reset all state
      setIsNavigating(false);
      setActiveDropdown(null);
      setIsSearchFocused(false);
      setSearchQuery("");
    };
  }, []);

  // Streamlined navigation focused on core user journeys
  const navigationItems = getNavigationItems();
  const searchSuggestions = getSearchSuggestions();

  return (
    <nav
      ref={navRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
        shouldBeTransparent ?
          "bg-transparent"
        : "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100",
        isScrolled && "py-2",
        !isScrolled && "py-4",
        className
      )}
      style={{
        // Ensure navigation doesn't interfere with content below
        willChange:
          isScrolled ? "background-color, backdrop-filter, box-shadow" : "auto",
      }}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between min-h-[64px]">
          {/* Logo and Wordmark - Single clickable unit */}
          <div className="flex-shrink-0 min-w-[200px]">
            <button
              type="button"
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity duration-200 bg-transparent border-none p-1 -m-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              onClick={() => handleNavigation("/")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleNavigation("/");
                }
              }}
              aria-label="Go to homepage"
            >
              <Logo
                size="md"
                variant={shouldBeTransparent ? "light" : "default"}
                interactive={false}
              />
              <Wordmark
                size="md"
                variant={shouldBeTransparent ? "light" : "default"}
                animated={true}
                interactive={false}
              />
            </button>
          </div>

          {/* Desktop Navigation with improved spacing */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-xl mx-12">
            {navigationItems.map((item) => (
              <div key={item.label} className="relative">
                {item.dropdown ?
                  <button
                    type="button"
                    disabled={isNavigating}
                    className={cn(
                      "flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm",
                      shouldBeTransparent ? TRANSPARENT_BUTTON_HOVER_CLASSES : BUTTON_HOVER_CLASSES,
                      BUTTON_DISABLED_CLASSES,
                      shouldBeTransparent ?
                        TRANSPARENT_LIGHT_CLASSES
                      : DEFAULT_DARK_CLASSES,
                      activeDropdown === item.label && (shouldBeTransparent ? "bg-white/10" : "bg-gray-100")
                    )}
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === item.label ? null : item.label
                      )
                    }
                    onMouseEnter={() => handleDropdownEnter(item.label)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        activeDropdown === item.label && "rotate-180"
                      )}
                    />
                  </button>
                : <button
                    type="button"
                    disabled={isNavigating}
                    onClick={(e) => handleNavigation(item.href, e)}
                    className={cn(
                      "px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm",
                      shouldBeTransparent ? TRANSPARENT_BUTTON_HOVER_CLASSES : BUTTON_HOVER_CLASSES,
                      BUTTON_DISABLED_CLASSES,
                      shouldBeTransparent ?
                        TRANSPARENT_LIGHT_CLASSES
                      : DEFAULT_DARK_CLASSES
                    )}
                  >
                    {item.label}
                  </button>
                }

                {/* Streamlined Dropdown Menu */}
                {item.dropdown && activeDropdown === item.label && (
                  <div
                    className="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                    onMouseEnter={() => {
                      if (dropdownTimeoutRef.current) {
                        clearTimeout(dropdownTimeoutRef.current);
                      }
                    }}
                    onMouseLeave={handleDropdownLeave}
                  >
                    {item.dropdown.map((dropdownItem) => (
                      <button
                        key={dropdownItem.href}
                        type="button"
                        disabled={isNavigating}
                        onClick={(e) => handleNavigation(dropdownItem.href, e)}
                        className={cn(
                          "group block w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors duration-150 mx-1 rounded-lg",
                          BUTTON_DISABLED_CLASSES,
                          dropdownItem.featured &&
                            "bg-gradient-to-r from-primary/5 to-primary/10 border-l-2 border-primary ml-1",
                          dropdownItem.highlight &&
                            "bg-gradient-to-r from-secondary/5 to-secondary/10 border-l-2 border-secondary ml-1"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div
                              className={cn(
                                "font-medium text-sm transition-colors duration-150",
                                dropdownItem.featured ? "text-primary" : (
                                  "text-gray-900 group-hover:text-primary"
                                ),
                                dropdownItem.highlight && "text-secondary"
                              )}
                            >
                              {dropdownItem.label}
                              {dropdownItem.featured && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary text-white">
                                  Popular
                                </span>
                              )}
                              {dropdownItem.highlight && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                  Sell
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {dropdownItem.description}
                            </div>
                          </div>
                          <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <span
                              className={`text-xs font-medium ${dropdownItem.highlight ? "text-secondary" : "text-primary"}`}
                            >
                              {dropdownItem.cta} →
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search and Actions */}
          <div className="hidden lg:flex items-center space-x-3 flex-shrink-0 min-w-[320px] justify-end">
            {/* Enhanced Search */}
            <div className="relative">
              <div className="relative">
                <Search className={cn(
                  "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4",
                  shouldBeTransparent ? "text-white/70" : "text-gray-400"
                )} />
                <input
                  type="search"
                  placeholder="Search properties..."
                  value={searchQuery}
                  disabled={isNavigating}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => !isNavigating && setIsSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery && !isNavigating) {
                      handleSearch(searchQuery);
                    }
                  }}
                  className={cn(
                    "w-44 pl-10 pr-4 py-2 rounded-lg border transition-all duration-200 text-sm",
                    shouldBeTransparent ?
                      "bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    BUTTON_DISABLED_CLASSES
                  )}
                />
              </div>

              {/* Search Suggestions */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
                  {searchQuery ?
                    <button
                      type="button"
                      disabled={isNavigating}
                      className={cn(
                        DROPDOWN_BUTTON_CLASSES,
                        BUTTON_DISABLED_CLASSES
                      )}
                      onClick={() => handleSearch(searchQuery)}
                    >
                      <div className="flex items-center">
                        <Search className="w-4 h-4 text-gray-400 mr-2.5" />
                        <span className="text-gray-900 text-sm">
                          Search for &quot;{searchQuery}&quot;
                        </span>
                      </div>
                    </button>
                  : <>
                      <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Popular Searches
                      </div>
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          disabled={isNavigating}
                          className={cn(
                            DROPDOWN_BUTTON_CLASSES,
                            BUTTON_DISABLED_CLASSES
                          )}
                          onClick={() => handleSearch(suggestion)}
                        >
                          <div className="flex items-center">
                            <Search className="w-4 h-4 text-gray-400 mr-2.5" />
                            <span className="text-gray-900 text-sm">
                              {suggestion}
                            </span>
                          </div>
                        </button>
                      ))}
                    </>
                  }
                </div>
              )}
            </div>

            {/* B2B API Access Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigation("/api-demo")}
              disabled={isNavigating}
              className="items-center space-x-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 text-xs font-medium px-3 py-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>API</span>
            </Button>

            {/* Separator */}
            <div className="h-5 w-px bg-gray-300" />

            {/* User Authentication/Dashboard Links */}
            {/* For MVP demo - showing login/register buttons */}
            {
              // Authentication state - currently showing unauthenticated state for MVP
              // eslint-disable-next-line no-constant-condition
              false ?
                // Authenticated user menu
                <div className="relative">
                  <button
                    type="button"
                    disabled={isNavigating}
                    className={cn(
                      "flex items-center space-x-1.5 px-2 py-1.5 rounded-lg transition-all duration-200",
                      shouldBeTransparent ? TRANSPARENT_BUTTON_HOVER_CLASSES : BUTTON_HOVER_CLASSES,
                      BUTTON_DISABLED_CLASSES,
                      shouldBeTransparent ?
                        TRANSPARENT_LIGHT_CLASSES
                      : DEFAULT_DARK_CLASSES
                    )}
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "user" ? null : "user"
                      )
                    }
                  >
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">U</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* User Dropdown */}
                  {activeDropdown === "user" && (
                    <div className="absolute top-full right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
                      <button
                        type="button"
                        disabled={isNavigating}
                        onClick={() => handleNavigation("/dashboard")}
                        className={cn(
                          DROPDOWN_BUTTON_CLASSES,
                          BUTTON_DISABLED_CLASSES
                        )}
                      >
                        <div className="font-medium text-sm text-gray-900">
                          Dashboard
                        </div>
                      </button>
                      <button
                        type="button"
                        disabled={isNavigating}
                        onClick={() => handleNavigation("/inbox")}
                        className={cn(
                          DROPDOWN_BUTTON_CLASSES,
                          BUTTON_DISABLED_CLASSES
                        )}
                      >
                        <div className="font-medium text-sm text-gray-900">
                          Messages
                        </div>
                      </button>
                      <button
                        type="button"
                        disabled={isNavigating}
                        onClick={() => handleNavigation("/team")}
                        className={cn(
                          DROPDOWN_BUTTON_CLASSES,
                          BUTTON_DISABLED_CLASSES
                        )}
                      >
                        <div className="font-medium text-sm text-gray-900">
                          Team
                        </div>
                      </button>
                      <div className="border-t border-gray-100 my-1.5 mx-2"></div>
                      <button type="button" className={DROPDOWN_BUTTON_CLASSES}>
                        <div className="font-medium text-sm text-gray-900">
                          Sign Out
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                // Unauthenticated user buttons
              : <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isNavigating}
                    onClick={() => handleNavigation("/auth/login")}
                    className="text-sm font-medium px-4 py-2"
                  >
                    {isNavigating ? "Loading..." : "Login"}
                  </Button>
                  <Button
                    size="sm"
                    disabled={isNavigating}
                    onClick={() => handleNavigation("/auth/register")}
                    className="text-sm font-medium px-4 py-2"
                  >
                    {isNavigating ? "Loading..." : "Get Started"}
                  </Button>
                </>

            }
          </div>

          {/* Tablet Navigation - Simplified */}
          <div className="hidden md:flex lg:hidden items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isNavigating}
              onClick={() => handleNavigation("/auth/login")}
              className="text-xs px-3 py-1.5"
            >
              Login
            </Button>
            <Button
              size="sm"
              disabled={isNavigating}
              onClick={() => handleNavigation("/auth/register")}
              className="text-xs px-3 py-1.5"
            >
              Get Started
            </Button>
            <SafeNavigation fallback={<MobileNavFallback />}>
              <MobileNav />
            </SafeNavigation>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center">
            <SafeNavigation fallback={<MobileNavFallback />}>
              <MobileNav />
            </SafeNavigation>
          </div>
        </div>
      </div>
    </nav>
  );
}
