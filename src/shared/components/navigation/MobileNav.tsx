
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Logo } from "@shared/components/ui/logo";
import { Wordmark } from "@shared/components/ui/wordmark";
import { cn } from "@shared/lib/utils";
import {
  safeNavigate,
  safeSearchNavigate,
  NAVIGATION_TIMEOUTS,
} from "@shared/utils/safe-navigation";
import { Menu, X, Search, User, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Simple logging utility for development
const logError = (message: string, error?: unknown) => {
  if (process.env.NODE_ENV === "development") {
    // Only log in development mode
    // eslint-disable-next-line no-console
    console.warn(message, error);
  }
};

// Safe accessibility hook - moved outside component to avoid conditional hook calls
const createSafeAccessibilityHook = () => {
  return {
    trapFocus: (element: HTMLElement) => {
      try {
        // Basic focus trap implementation with error handling
        const focusableElements = element.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          logError("No focusable elements found for focus trap");
          return () => {}; // Return empty cleanup function
        }

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key === "Tab") {
            try {
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
            } catch (focusError) {
              logError("Focus trap tab handling error:", focusError);
            }
          }
        };

        document.addEventListener("keydown", handleTabKey, { passive: false });

        // Focus first element safely
        try {
          firstElement?.focus();
        } catch (focusError) {
          logError("Failed to focus first element:", focusError);
        }

        return () => {
          document.removeEventListener("keydown", handleTabKey);
        };
      } catch (error) {
        logError("Focus trap setup error:", error);
        return () => {}; // Return empty cleanup function
      }
    },
    announceLiveRegion: (
      message: string,
      priority: "polite" | "assertive" = "polite"
    ) => {
      try {
        const announcement = document.createElement("div");
        announcement.setAttribute("aria-live", priority);
        announcement.setAttribute("aria-atomic", "true");
        announcement.className = "sr-only";
        announcement.textContent = message;

        if (document.body) {
          document.body.appendChild(announcement);

          // Use a more reliable cleanup method
          const timeoutId = setTimeout(() => {
            try {
              if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
              }
            } catch (cleanupError) {
              logError("Failed to cleanup announcement element:", cleanupError);
            }
          }, 1000);

          // Store timeout ID for potential cleanup
          announcement.setAttribute("data-timeout-id", timeoutId.toString());
        }
      } catch (error) {
        logError("Failed to create live region announcement:", error);
      }
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

  // Simplified state management
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<readonly string[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Refs for DOM manipulation
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);

  // Accessibility features with safe loading
  const { trapFocus, announceLiveRegion } = createSafeAccessibilityHook();

  // Safe navigation with timeout protection
  const handleNavigation = useCallback(
    (href: string, event?: React.MouseEvent) => {
      // Prevent default behavior if event is provided
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Close mobile menu immediately
      setIsOpen(false);

      // Use safe navigation utility
      safeNavigate(navigate, href, {
        timeout: NAVIGATION_TIMEOUTS.NORMAL,
        fallbackUrl: "/",
        onError: (error) => {
          logError("Mobile navigation error:", error);
        },
        onTimeout: () => {
          logError("Mobile navigation timeout");
        },
      });
    },
    [navigate]
  );

  // Search functionality with timeout protection
  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      setIsOpen(false);

      // Use safe search navigation utility
      safeSearchNavigate(navigate, query, {
        timeout: NAVIGATION_TIMEOUTS.NORMAL,
        fallbackUrl: "/search",
        onError: (error) => {
          logError("Mobile search navigation error:", error);
        },
        onTimeout: () => {
          logError("Mobile search navigation timeout");
        },
      });
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

  // Simplified touch handlers - removed complex drag gestures to prevent crashes
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Simple touch start tracking without complex drag logic
    try {
      const touch = e.touches.item(0);
      if (touch) {
        startXRef.current = touch.clientX;
        startTimeRef.current = Date.now();
      }
    } catch (error) {
      logError("Touch start error:", error);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Simple swipe-to-close detection
    try {
      const touch = e.changedTouches.item(0);
      if (!touch) return;

      const deltaX = touch.clientX - startXRef.current;
      const deltaTime = Date.now() - startTimeRef.current;

      // Simple left swipe detection to close menu
      if (deltaX < -50 && deltaTime < 500) {
        setIsOpen(false);
      }
    } catch (error) {
      logError("Touch end error:", error);
    }
  }, []);

  // Section toggle functionality
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ?
        prev.filter((id) => id !== sectionId)
      : [...prev, sectionId]
    );
  }, []);

  // Simplified accessibility and focus management
  useEffect(() => {
    let focusCleanup: (() => void) | null = null;
    let isActive = true;

    const handleClickOutside = (event: Event) => {
      if (
        isActive &&
        overlayRef.current &&
        event.target === overlayRef.current
      ) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (isActive && keyboardEvent.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      try {
        // Add event listeners with better error handling
        document.addEventListener("mousedown", handleClickOutside, {
          passive: true,
        });
        document.addEventListener("keydown", handleEscapeKey, {
          passive: true,
        });

        // Prevent background scroll safely
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        // Announce menu opening to screen readers safely
        try {
          announceLiveRegion("Navigation menu opened", "polite");
        } catch (error) {
          logError("Failed to announce menu opening:", error);
        }

        // Set up focus trap for accessibility with error handling
        if (panelRef.current) {
          try {
            focusCleanup = trapFocus(panelRef.current);
          } catch (error) {
            logError("Failed to set up focus trap:", error);
          }
        }

        // Return cleanup function
        return () => {
          isActive = false;
          try {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscapeKey);
            document.body.style.overflow = originalOverflow;
          } catch (error) {
            logError("Failed to cleanup event listeners:", error);
          }

          if (focusCleanup) {
            try {
              focusCleanup();
            } catch (error) {
              logError("Failed to cleanup focus trap:", error);
            }
          }
        };
      } catch (error) {
        logError("Failed to set up mobile nav listeners:", error);
        return () => {
          isActive = false;
        };
      }
    }

    // Cleanup function for when component unmounts or dependencies change
    return () => {
      isActive = false;
    };
  }, [isOpen, trapFocus, announceLiveRegion]);

  // Reset state when menu closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedSections([]);
      setSearchQuery("");
    }
  }, [isOpen]);

  // Component cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      try {
        // Clean up any remaining timeouts or intervals
        const announcements = document.querySelectorAll("[data-timeout-id]");
        announcements.forEach((announcement) => {
          try {
            const timeoutId = announcement.getAttribute("data-timeout-id");
            if (timeoutId) {
              clearTimeout(parseInt(timeoutId, 10));
            }
            if (announcement.parentNode) {
              announcement.parentNode.removeChild(announcement);
            }
          } catch (error) {
            logError("Failed to cleanup announcement:", error);
          }
        });

        // Reset body overflow in case component unmounts while menu is open
        document.body.style.overflow = "unset";
      } catch (error) {
        logError("Failed to cleanup mobile nav component:", error);
      }
    };
  }, []);

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
            "fixed inset-0 z-50 mobile-nav-overlay transition-opacity duration-300",
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
              "fixed top-0 left-0 h-full w-80 mobile-nav-panel shadow-2xl border-r border-gray-300 transform transition-transform duration-300 ease-out",
              isOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header Section */}
            <div className="flex items-center justify-between pl-1 pr-4 py-4 border-b mobile-nav-header text-white shadow-sm">
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
            <div className="p-4 border-b bg-gray-50 backdrop-blur-sm">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white backdrop-blur-sm border-gray-300 focus:bg-white focus:border-primary"
                  aria-label="Search properties"
                />
              </form>
            </div>

            {/* Navigation Content - Optimized for Mobile */}
            <div className="flex-1 overflow-y-auto bg-white backdrop-blur-sm">
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
            <div className="border-t bg-gray-50 backdrop-blur-sm p-3 shadow-inner">
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
