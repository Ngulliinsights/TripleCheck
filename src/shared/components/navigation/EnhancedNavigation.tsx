
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Logo } from "@shared/components/ui/logo";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@shared/components/ui/navigation-menu";
import { Wordmark } from "@shared/components/ui/wordmark";
import { cn } from "@shared/lib/utils";
import {
  Search,
  HelpCircle,
  User,
  Building,
  BarChart3,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";

// Type definitions moved to the top for better organization and reusability
interface NavigationItem {
  title: string;
  href: string;
  description: string;
  keywords?: string[];
}

interface NavigationSection {
  title: string;
  // Use proper LucideIcon type for better type safety
  icon: LucideIcon;
  items: NavigationItem[];
}

interface SearchResult extends NavigationItem {
  section: string;
}

// Enhanced navigation with context awareness and micro-interactions
export function EnhancedNavigation() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Optimized scroll handler with throttling to improve performance
  const handleScroll = useCallback(() => {
    const shouldBeScrolled = window.scrollY > 20;
    if (shouldBeScrolled !== scrolled) {
      setScrolled(shouldBeScrolled);
    }
  }, [scrolled]);

  // Simplified scroll effect with better cleanup
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isActive = true;

    const throttledScrollHandler = () => {
      if (!isActive || timeoutId) return;
      
      timeoutId = setTimeout(() => {
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
    } catch (error) {
      console.warn("Failed to add scroll listener:", error);
    }

    return () => {
      isActive = false;
      try {
        window.removeEventListener("scroll", throttledScrollHandler);
      } catch (error) {
        console.warn("Failed to remove scroll listener:", error);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, [handleScroll]);

  // Memoized navigation sections to prevent unnecessary re-renders
  const navigationSections = useMemo(
    (): NavigationSection[] => [
      {
        title: "Properties",
        icon: Building,
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
        icon: BarChart3,
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
            title: "Fraud Resources",
            href: "/fraud-resources",
            description: "Complete guide to preventing and reporting fraud",
            keywords: [
              "fraud",
              "prevention",
              "reporting",
              "guide",
              "resources",
            ],
          },
          {
            title: "Community",
            href: "/community",
            description: "Share experiences and learn from others",
            keywords: ["community", "experiences", "stories", "support"],
          },
        ],
      },
    ],
    []
  );

  // Enhanced search functionality with better UX
  const handleSearchFocus = useCallback(() => setSearchFocused(true), []);
  const handleSearchBlur = useCallback(() => {
    // Small delay to allow clicking on search suggestions
    setTimeout(() => setSearchFocused(false), 200);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  // Helper function to check if an item matches the search query
  const itemMatchesQuery = useCallback((item: NavigationItem, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    const matchesTitle = item.title.toLowerCase().includes(lowerQuery);
    const matchesDescription = item.description.toLowerCase().includes(lowerQuery);
    const matchesKeywords = item.keywords?.some((keyword) =>
      keyword.toLowerCase().includes(lowerQuery)
    ) ?? false;
    
    return matchesTitle || matchesDescription || matchesKeywords;
  }, []);

  // Filter navigation items based on search query for better search experience
  const filteredSuggestions = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return [];

    const results: SearchResult[] = [];
    
    navigationSections.forEach((section) => {
      section.items.forEach((item) => {
        if (itemMatchesQuery(item, searchQuery)) {
          results.push({
            ...item,
            section: section.title,
          });
        }
      });
    });

    return results.slice(0, 5); // Limit to 5 results for better UX
  }, [searchQuery, navigationSections, itemMatchesQuery]);

  // Removed complex animations to prevent crashes

  // Extract search dropdown content to reduce nesting and improve readability
  const renderSearchSuggestions = () => {
    if (!searchQuery.trim()) {
      return (
        <div className="px-4 py-3">
          <div className="text-sm text-gray-600 mb-2">
            Popular searches:
          </div>
          <div className="flex flex-wrap gap-2">
            {["Apartments", "Office Space", "Land", "Commercial"].map((term) => (
              <button
                key={term}
                type="button"
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                onClick={() => setSearchQuery(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (filteredSuggestions.length === 0) {
      return (
        <div className="px-4 py-3 text-sm text-gray-500">
          No results found for &quot;{searchQuery}&quot;
        </div>
      );
    }

    return (
      <div className="max-h-64 overflow-y-auto">
        {filteredSuggestions.map((item, index) => (
          <a
            key={`${item.href}-${index}`}
            href={item.href}
            className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
          >
            <div className="font-medium text-gray-900">{item.title}</div>
            <div className="text-sm text-gray-600">{item.section}</div>
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
              {item.description}
            </div>
          </a>
        ))}
      </div>
    );
  };

  // Use location for conditional styling or active states
  const isCurrentPath = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "bg-transparent"
      )}
    >
      <nav
        className="container mx-auto px-4 py-3"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between">
          {/* Logo and main navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            
              <Logo
                size="md"
                variant={scrolled ? "default" : "light"}
                interactive={true}
                href="/"
              />
              <Wordmark
                size="md"
                variant={scrolled ? "default" : "light"}
                animated={true}
                interactive={true}
                href="/"
              />
            </div>

            <NavigationMenu>
              <NavigationMenuList>
                {navigationSections.map((section) => (
                  <NavigationMenuItem key={section.title}>
                    <NavigationMenuTrigger
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                      aria-label={`${section.title} menu`}
                    >
                      <section.icon className="w-4 h-4" aria-hidden="true" />
                      {section.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul
                        className="grid gap-3 p-4 w-[400px] md:w-[500px] lg:w-[600px]"
                        aria-label={`${section.title} navigation options`}
                      >
                        {section.items.map((item) => (
                          <li key={item.title}>
                            <NavigationMenuLink
                              href={item.href}
                              className={cn(
                                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
                                "hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900",
                                "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                                // Add active state styling using location
                                isCurrentPath(item.href) && "bg-blue-100 text-blue-900"
                              )}
                              role="link"
                              tabIndex={0}
                            >
                              <div className="text-sm font-medium leading-none">
                                {item.title}
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                                {item.description}
                              </p>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Enhanced search and user actions */}
          <div className="flex items-center space-x-4">
            <div 
              className={cn(
                "relative transition-all duration-200",
                searchFocused ? "w-96" : "w-64"
              )}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search properties, locations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  aria-label="Search properties and locations"
                />
              </div>

              {searchFocused && (
                <div
                  className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10 opacity-100 transition-opacity duration-200"
                >
                  {renderSearchSuggestions()}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                className="relative hover:bg-gray-100"
              >
                <Bell className="w-5 h-5" />
                {/* Notification indicator */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Help and support"
                className="hover:bg-gray-100"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                className="hidden md:flex items-center gap-2 hover:bg-gray-50"
                aria-label="User account"
              >
                <User className="w-4 h-4" />
                Account
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}