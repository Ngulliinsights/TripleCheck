
import { 
  Menu, 
  X, 
  Search, 
  User, 
  LogOut, 
  ChevronDown, 
  Home,
  Building2,
  Shield,
  HelpCircle,
  DollarSign
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Logo } from "../ui/logo";
import { Wordmark } from "../ui/wordmark";

// Simple logging utility for development
const logError = (message: string, error?: unknown) => {
  if (process.env.NODE_ENV === "development") {
    console.warn(message, error);
  }
};

// TypeScript interfaces for better type safety
interface MobileNavProps {
  readonly className?: string;
  readonly variant?: "default" | "transparent";
  readonly isOpen?: boolean;
  readonly onToggle?: () => void;
}

interface QuickAction {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly color?: string;
}

interface NavigationItem {
  readonly label: string;
  readonly href: string;
  readonly icon?: React.ReactNode;
  readonly items?: readonly { readonly label: string; readonly href: string }[];
}

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

export function MobileNav({ 
  className, 
  variant = "default", 
  isOpen: controlledIsOpen, 
  onToggle 
}: MobileNavProps) {
  const navigate = useNavigate();

  // State management - support both controlled and uncontrolled modes
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Refs for DOM manipulation
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Safe navigation with proper error handling
  const handleNavigation = useCallback(
    (href: string, event?: React.MouseEvent) => {
      try {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }

        // Close mobile menu immediately
        setIsOpen(false);

        // Navigate using React Router
        navigate(href);
      } catch (error) {
        logError("Mobile navigation error:", error);
        // Fallback to direct navigation
        window.location.href = href;
      }
    },
    [navigate, setIsOpen]
  );

  // Search functionality
  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      try {
        setIsOpen(false);
        const searchUrl = `/search?q=${encodeURIComponent(query.trim())}`;
        navigate(searchUrl);
      } catch (error) {
        logError("Mobile search navigation error:", error);
        window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
      }
    },
    [navigate, setIsOpen]
  );

  // Handle search form submission
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSearch(searchQuery);
    },
    [handleSearch, searchQuery]
  );

  // Configuration data with modern icons
  const quickActions: readonly QuickAction[] = [
    { 
      label: "Home", 
      href: "/", 
      icon: <Home className="w-5 h-5" />,
      color: "text-blue-600"
    },
    { 
      label: "Properties", 
      href: "/properties", 
      icon: <Building2 className="w-5 h-5" />,
      color: "text-green-600"
    },
    { 
      label: "Verify", 
      href: "/services/basic-checks", 
      icon: <Shield className="w-5 h-5" />,
      color: "text-purple-600"
    },
    { 
      label: "List Property", 
      href: "/services/list-property", 
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-orange-600"
    },
  ] as const;

  const navigationItems: readonly NavigationItem[] = [
    {
      label: "Properties",
      href: "/properties",
      icon: <Building2 className="w-4 h-4" />,
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
      icon: <Shield className="w-4 h-4" />,
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
      icon: <HelpCircle className="w-4 h-4" />,
      items: [
        { label: "For Buyers", href: "/solutions/buyers" },
        { label: "For Sellers", href: "/solutions/sellers" },
        { label: "For Agents", href: "/solutions/agents" },
        { label: "For Developers", href: "/solutions/developers" },
      ],
    },
  ] as const;

  // Section toggle functionality
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Handle click outside and escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && event.target === overlayRef.current) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    // Prevent background scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, setIsOpen]);

  // Reset state when menu closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedSections(new Set());
      setSearchQuery("");
    }
  }, [isOpen]);

  // Authentication state - this would typically come from a context or hook
  const isAuthenticated = false; // Replace with actual auth state check

  return (
    <>
      {/* Menu Trigger Button - Only show if not controlled */}
      {onToggle === undefined && (
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
      )}

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-nav-title"
        >
          {/* Sliding Panel */}
          <div
            ref={panelRef}
            className={cn(
              "fixed top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-md shadow-2xl transform transition-transform duration-300 ease-out",
              isOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            {/* Header Section */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary to-primary-600">
              <div className="flex items-center gap-2">
                <Logo
                  size="sm"
                  variant="light"
                  interactive={false}
                />
                <Wordmark
                  size="sm"
                  variant="light"
                  animated={true}
                  interactive={false}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/10 rounded-full"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Search Section */}
            <div className="p-4 bg-gray-50/50 border-b border-gray-200">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-200 focus:border-primary focus:ring-primary/20 rounded-lg"
                  aria-label="Search properties"
                />
              </form>
            </div>

            {/* Quick Actions Grid */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.href}
                    variant="outline"
                    className="h-20 flex-col gap-2 text-xs font-medium border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                    onClick={(e) => handleNavigation(action.href, e)}
                  >
                    <div className={cn("flex items-center justify-center", action.color)}>
                      {action.icon}
                    </div>
                    <span className="text-gray-700">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Navigation Content */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-4 space-y-2" role="navigation" aria-label="Main navigation">
                {navigationItems.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-left font-medium py-3 px-3 hover:bg-gray-50 rounded-lg"
                      onClick={() => item.items ? toggleSection(item.label) : handleNavigation(item.href)}
                      aria-expanded={item.items ? expandedSections.has(item.label) : undefined}
                      aria-controls={item.items ? `section-${item.label.toLowerCase()}` : undefined}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-gray-900">{item.label}</span>
                      </div>
                      {item.items && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200 text-gray-400",
                            expandedSections.has(item.label) && "rotate-180"
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </Button>

                    {/* Collapsible Content */}
                    {item.items && (
                      <div
                        id={`section-${item.label.toLowerCase()}`}
                        className={cn(
                          "overflow-hidden transition-all duration-300 ease-out",
                          expandedSections.has(item.label) ?
                            "max-h-64 opacity-100"
                          : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="ml-7 space-y-1 pt-1">
                          {item.items.map((subItem) => (
                            <Button
                              key={subItem.href}
                              variant="ghost"
                              className="w-full justify-start text-left text-sm py-2 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                              onClick={(e) => handleNavigation(subItem.href, e)}
                            >
                              {subItem.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Direct Navigation Links */}
                <div className="space-y-1 pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left py-3 px-3 hover:bg-gray-50 rounded-lg"
                    onClick={(e) => handleNavigation("/pricing", e)}
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">Pricing</span>
                    </div>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left py-3 px-3 hover:bg-gray-50 rounded-lg"
                    onClick={(e) => handleNavigation("/help", e)}
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">Help</span>
                    </div>
                  </Button>
                </div>
              </nav>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 bg-gray-50/50 p-4">
              {isAuthenticated ? (
                // Authenticated user actions
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-200 hover:border-primary/30"
                    onClick={(e) => handleNavigation("/dashboard", e)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3"
                    onClick={() => {
                      // Handle logout functionality here
                      setIsOpen(false);
                    }}
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                // Unauthenticated user actions
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-200 hover:border-primary/30"
                    onClick={(e) => handleNavigation("/auth/login", e)}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary-600"
                    onClick={(e) => handleNavigation("/auth/register", e)}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
