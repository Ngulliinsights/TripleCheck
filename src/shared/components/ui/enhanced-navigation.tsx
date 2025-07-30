import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { 
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink 
} from "./navigation-menu";
import { Button } from "./button";
import { Input } from "./input";
import { Logo } from "./logo";
import { Wordmark } from "./wordmark";
import { Search, HelpCircle, User, LogOut, Home, Building, BarChart3, Bell } from "lucide-react";
import { cn } from "@shared/lib/utils";

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
  const navigationSections = useMemo((): NavigationSection[] => [
    {
      title: "Properties",
      icon: Building,
      items: [
        { 
          title: "Browse Properties", 
          href: "/properties", 
          description: "Find your next property investment",
          keywords: ["apartments", "houses", "commercial"]
        },
        { 
          title: "Compare", 
          href: "/compare", 
          description: "Side-by-side property comparison",
          keywords: ["analysis", "evaluation", "metrics"]
        },
        { 
          title: "Market Analysis", 
          href: "/market", 
          description: "Real-time market insights",
          keywords: ["trends", "pricing", "forecasts"]
        },
      ]
    },
    {
      title: "Services",
      icon: BarChart3,
      items: [
        { 
          title: "Property Verification", 
          href: "/services/verification", 
          description: "Verify property authenticity",
          keywords: ["documents", "legal", "validation"]
        },
        { 
          title: "Document Authentication", 
          href: "/services/documents", 
          description: "Secure document verification",
          keywords: ["certificates", "titles", "permits"]
        },
        { 
          title: "Trust Score", 
          href: "/services/trust-score", 
          description: "Property trust metrics",
          keywords: ["rating", "reliability", "assessment"]
        },
      ]
    }
  ], []);

  // Types for better type safety
  interface NavigationItem {
    title: string;
    href: string;
    description: string;
    keywords?: string[];
  }

  interface NavigationSection {
    title: string;
    icon: React.ComponentType<any>;
    items: NavigationItem[];
  }

  interface SearchResult extends NavigationItem {
    section: string;
  }

  // Enhanced search functionality with better UX
  const handleSearchFocus = useCallback(() => setSearchFocused(true), []);
  const handleSearchBlur = useCallback(() => {
    // Small delay to allow clicking on search suggestions
    setTimeout(() => setSearchFocused(false), 200);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Filter navigation items based on search query for better search experience
  const filteredSuggestions = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    
    const results: SearchResult[] = [];
    navigationSections.forEach(section => {
      section.items.forEach(item => {
        const matchesTitle = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDescription = item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesKeywords = item.keywords?.some(keyword => 
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (matchesTitle || matchesDescription || matchesKeywords) {
          results.push({
            ...item,
            section: section.title
          });
        }
      });
    });
    
    return results.slice(0, 5); // Limit to 5 results for better UX
  }, [searchQuery, navigationSections]);

  // Animation variants for better performance and reusability
  const headerVariants = {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { type: "spring", stiffness: 100, damping: 20 }
  };

  const searchDropdownVariants = {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
    transition: { duration: 0.2, ease: "easeOut" }
  };

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled 
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" 
          : "bg-transparent"
      )}
      {...headerVariants}
    >
      <nav className="container mx-auto px-4 py-3" role="navigation" aria-label="Main navigation">
        <div className="flex items-center justify-between">
          {/* Logo and main navigation */}
          <div className="flex items-center space-x-8">
            <div
              className="flex items-center gap-3"
            >
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
                        role="list"
                        aria-label={`${section.title} navigation options`}
                      >
                        {section.items.map((item) => (
                          <li key={item.title} role="listitem">
                            <NavigationMenuLink
                              href={item.href}
                              className={cn(
                                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
                                "hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900",
                                "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              )}
                              role="link"
                              tabIndex={0}
                            >
                              <div className="text-sm font-medium leading-none">{item.title}</div>
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
              className="relative"
              style={{ width: searchFocused ? 384 : 256 }}
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
              
              <div>
                {searchFocused && (
                  <div
                    className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10"
                    {...searchDropdownVariants}
                  >
                    {searchQuery.trim() ? (
                      filteredSuggestions.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto">
                          {filteredSuggestions.map((item, index) => (
                            <a
                              key={`${item.href}-${index}`}
                              href={item.href}
                              className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{item.title}</div>
                              <div className="text-sm text-gray-600">{item.section}</div>
                              <div className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No results found for "{searchQuery}"
                        </div>
                      )
                    ) : (
                      <div className="px-4 py-3">
                        <div className="text-sm text-gray-600 mb-2">Popular searches:</div>
                        <div className="flex flex-wrap gap-2">
                          {["Apartments", "Office Space", "Land", "Commercial"].map((term) => (
                            <button
                              key={term}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                              onClick={() => setSearchQuery(term)}
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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