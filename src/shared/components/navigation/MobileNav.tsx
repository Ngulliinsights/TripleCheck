import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Logo } from "@shared/components/ui/logo";
import { Wordmark } from "@shared/components/ui/wordmark";
import { cn } from "@shared/lib/utils";
import { Menu, X, Search, User, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Safe accessibility hook - moved outside component to avoid conditional hook calls
const createSafeAccessibilityHook = () => {
  return {
    trapFocus: (element: HTMLElement) => {
      // Basic focus trap implementation
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement?.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement?.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener("keydown", handleTabKey);
      firstElement?.focus();

      return () => {
        document.removeEventListener("keydown", handleTabKey);
      };
    },
    announceLiveRegion: (
      message: string,
      priority: "polite" | "assertive" = "polite"
    ) => {
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", priority);
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = message;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    },
  };
};

// TypeScript interfaces for better type safety
interface MobileNavProps {
  readonly className?: string;
  readonly variant?: "default" | "transparent";
}

// Removed unused NavigationItem interface

interface QuickAction {
  readonly label: string;
  readonly href: string;
  readonly icon: string;
}

interface MainSection {
  readonly title: string;
  readonly items: readonly { readonly label: string; readonly href: string }[];
}

export function MobileNav({ className, variant = "default" }: MobileNavProps) {
  const navigate = useNavigate();

  // State management with proper typing
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<readonly string[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Refs for DOM manipulation
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);

  // Accessibility features with safe loading
  const { trapFocus, announceLiveRegion } = createSafeAccessibilityHook();

  // Enhanced safe navigation function with better error handling
  const handleNavigation = useCallback(
    (href: string, event?: React.MouseEvent) => {
      try {
        // Prevent default behavior if event is provided
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }

        // Validate href parameter for safety
        if (!href || typeof href !== "string") {
          throw new Error("Invalid navigation href provided");
        }

        // Close mobile menu and navigate
        setIsOpen(false);
        navigate(href);
      } catch (error) {
        // Graceful fallback with detailed logging in development
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn(
            "Mobile navigation failed, falling back to window.location:",
            error
          );
        }

        setIsOpen(false);

        try {
          // Fallback to native navigation
          window.location.href = href;
        } catch (fallbackError) {
          // Ultimate fallback to home page
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.error("Complete mobile navigation failure:", fallbackError);
          }
          window.location.href = "/";
        }
      }
    },
    [navigate]
  );

  // Search functionality with proper error handling
  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      try {
        const searchUrl = `/search?q=${encodeURIComponent(query.trim())}`;
        setIsOpen(false);
        navigate(searchUrl);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn("Search navigation failed:", error);
        }
        // Fallback to direct URL navigation
        window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
      }
    },
    [navigate]
  );

  // Handle search form submission
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSearch(searchQuery);
    },
    [handleSearch, searchQuery]
  );

  // Configuration data with proper readonly typing
  const quickActions: readonly QuickAction[] = [
    { label: "Home", href: "/", icon: "🏠" },
    { label: "Properties", href: "/properties", icon: "🏢" },
    { label: "Verify", href: "/services/basic-checks", icon: "✅" },
    { label: "List Property", href: "/services/list-property", icon: "📝" },
  ] as const;

  const mainSections: readonly MainSection[] = [
    {
      title: "Properties",
      items: [
        { label: "All Properties", href: "/properties" },
        { label: "Residential", href: "/properties/residential" },
        { label: "Commercial", href: "/properties/commercial" },
        { label: "Land", href: "/properties/land" },
      ],
    },
    {
      title: "Services",
      items: [
        { label: "Property Verification", href: "/services/basic-checks" },
        { label: "Fraud Detection", href: "/services/fraud-detection" },
        { label: "Document Auth", href: "/services/document-auth" },
      ],
    },
  ] as const;

  // Touch gesture handlers with proper null checking and TypeScript compatibility
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!panelRef.current) return;

    // Access first touch safely for TypeScript compatibility
    const touch = e.touches.item(0);
    if (!touch) return; // Guard against undefined touch

    startXRef.current = touch.clientX;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !panelRef.current) return;

      // Access first touch safely for TypeScript compatibility
      const touch = e.touches.item(0);
      if (!touch) return;

      const deltaX = touch.clientX - startXRef.current;

      // Only allow leftward swipes (closing gesture)
      if (deltaX < 0) {
        setDragOffset(Math.max(deltaX, -300)); // Limit drag distance
      }
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    const deltaTime = Date.now() - startTimeRef.current;
    const velocity = Math.abs(dragOffset) / deltaTime;

    // Close if dragged more than 100px or fast swipe detected
    if (Math.abs(dragOffset) > 100 || velocity > 0.5) {
      setIsOpen(false);
    }

    // Reset drag state
    setDragOffset(0);
    setIsDragging(false);
  }, [isDragging, dragOffset]);

  // Section toggle functionality
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ?
        prev.filter((id) => id !== sectionId)
      : [...prev, sectionId]
    );
  }, []);

  // Enhanced accessibility and focus management
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (overlayRef.current && event.target === overlayRef.current) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Add event listeners
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden"; // Prevent background scroll

      // Announce menu opening to screen readers
      announceLiveRegion("Navigation menu opened", "polite");

      // Set up focus trap for accessibility
      if (panelRef.current) {
        const cleanup = trapFocus(panelRef.current);
        return () => {
          cleanup();
          document.removeEventListener("mousedown", handleClickOutside);
          document.removeEventListener("keydown", handleEscapeKey);
          document.body.style.overflow = "unset";
        };
      }
    }

    // Cleanup function for when component unmounts or dependencies change
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, trapFocus, announceLiveRegion]);

  // Reset state when menu closes
  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      setIsDragging(false);
      setExpandedSections([]);
      setSearchQuery("");
    }
  }, [isOpen]);

  // Authentication state - this would typically come from a context or hook
  const isAuthenticated = false; // Replace with actual auth state check

  return (
    <>
      {/* Menu Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn(
          "lg:hidden transition-colors duration-200",
          variant === "transparent" ?
            "text-white hover:bg-white/10"
          : "text-gray-700 hover:bg-gray-100",
          className
        )}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          ref={overlayRef}
          className={cn(
            "fixed inset-0 z-50 bg-black/70 backdrop-blur-md transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-nav-title"
        >
          {/* Sliding Panel */}
          <div
            ref={panelRef}
            className={cn(
              "fixed top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-lg shadow-2xl border-r border-gray-200/50 transform transition-transform duration-300 ease-out",
              isOpen ? "translate-x-0" : "-translate-x-full",
              isDragging && "transition-none",
              dragOffset !== 0 && "mobile-nav-drag"
            )}
            style={dragOffset !== 0 ? { '--drag-offset': `${dragOffset}px` } as React.CSSProperties : undefined}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header Section */}
            <div className="flex items-center justify-between p-4 border-b bg-primary/95 backdrop-blur-sm text-white shadow-sm">
              <div className="flex items-center gap-2">
                <Logo
                  size="sm"
                  variant="light"
                  interactive={true}
                  href="/"
                  onClick={() => handleNavigation("/")}
                />
                <Wordmark
                  size="sm"
                  variant="light"
                  animated={true}
                  interactive={true}
                  href="/"
                  onClick={() => handleNavigation("/")}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/10"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Section */}
            <div className="p-4 border-b bg-gray-50/80 backdrop-blur-sm">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/90 backdrop-blur-sm border-gray-300/50 focus:bg-white focus:border-primary"
                  aria-label="Search properties"
                />
              </form>
            </div>

            {/* Navigation Content - Optimized for Mobile */}
            <div className="flex-1 overflow-y-auto bg-white/50 backdrop-blur-sm">
              {/* Quick Actions Grid */}
              <div className="p-4 border-b border-gray-200/50">
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.href}
                      variant="outline"
                      className="h-16 flex-col gap-1 text-xs"
                      onClick={(e) => handleNavigation(action.href, e)}
                    >
                      <span className="text-lg" role="img" aria-hidden="true">
                        {action.icon}
                      </span>
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Main Navigation Sections */}
              <nav
                className="p-4 space-y-3"
                role="navigation"
                aria-label="Main navigation"
              >
                {mainSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-left font-medium"
                      onClick={() => toggleSection(section.title)}
                      aria-expanded={expandedSections.includes(section.title)}
                      aria-controls={`section-${section.title.toLowerCase()}`}
                    >
                      <span>{section.title}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          expandedSections.includes(section.title) &&
                            "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </Button>

                    {/* Collapsible Content with Smooth Animation */}
                    <div
                      id={`section-${section.title.toLowerCase()}`}
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-out",
                        expandedSections.includes(section.title) ?
                          "max-h-48 opacity-100"
                        : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="pl-4 space-y-1">
                        {section.items.map((item) => (
                          <Button
                            key={item.href}
                            variant="ghost"
                            className="w-full justify-start text-left text-sm py-2"
                            onClick={(e) => handleNavigation(item.href, e)}
                          >
                            {item.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Direct Navigation Links */}
                <div className="space-y-1 pt-2 border-t border-gray-200/50">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={(e) => handleNavigation("/pricing", e)}
                  >
                    Pricing
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={(e) => handleNavigation("/help", e)}
                  >
                    Help
                  </Button>
                </div>
              </nav>
            </div>

            {/* Footer Actions - Authentication-aware */}
            <div className="border-t bg-gray-50/90 backdrop-blur-sm p-3 shadow-inner">
              {
                isAuthenticated ?
                  // Authenticated user actions
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => handleNavigation("/dashboard", e)}
                    >
                      <User className="w-4 h-4 mr-1" aria-hidden="true" />
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        // Handle logout functionality here
                        setIsOpen(false);
                      }}
                      aria-label="Sign out"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>
                  // Unauthenticated user actions
                : <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => handleNavigation("/auth/login", e)}
                    >
                      Login
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={(e) => handleNavigation("/auth/register", e)}
                    >
                      Get Started
                    </Button>
                  </div>

              }
            </div>

            {/* Visual Swipe Indicator */}
            <div className="absolute top-1/2 -right-4 transform -translate-y-1/2">
              <div
                className="w-1 h-12 bg-white/20 rounded-full"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
