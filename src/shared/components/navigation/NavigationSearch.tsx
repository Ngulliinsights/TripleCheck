import { Search, X, Clock, TrendingUp, MapPin, Building } from "lucide-react";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

// Constants to avoid duplicate strings
const UNKNOWN_ERROR_MESSAGE = "Unknown error";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: "property" | "location" | "service" | "page";
  href: string;
  icon?: React.ReactNode;
  metadata?: {
    price?: string;
    location?: string;
    type?: string;
  };
}

interface NavigationSearchProps {
  readonly className?: string;
  readonly placeholder?: string;
  readonly variant?: "default" | "compact" | "expanded";
  readonly showSuggestions?: boolean;
  readonly showRecentSearches?: boolean;
  readonly onSearch?: (query: string) => void;
  readonly onResultClick?: (result: SearchResult) => void;
}

export function NavigationSearch({
  className,
  placeholder = "Search properties, locations...",
  variant = "default",
  showSuggestions = true,
  showRecentSearches = true,
  onSearch,
  onResultClick,
}: NavigationSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Memoize mock results to prevent unnecessary re-renders and satisfy dependency rules
  const mockResults = useMemo(
    (): SearchResult[] => [
      {
        id: "1",
        title: "3 Bedroom Apartment in Victoria Island",
        description: "Modern apartment with ocean view - Verified Documents",
        category: "property",
        href: "/properties/1",
        icon: <Building className="w-4 h-4" />,
        metadata: {
          price: "KSh 50M",
          location: "Westlands",
          type: "Apartment",
          verificationStatus: "verified",
        },
      },
      {
        id: "2",
        title: "Nairobi Properties",
        description: "Browse all verified properties in Nairobi",
        category: "location",
        href: "/properties?location=nairobi&verified=true",
        icon: <MapPin className="w-4 h-4" />,
      },
      {
        id: "3",
        title: "Document Verification Service",
        description: "AI-powered document authenticity verification",
        category: "service",
        href: "/services/document-verification",
        icon: <Search className="w-4 h-4" />,
      },
      {
        id: "4",
        title: "Land Verification Kenya",
        description:
          "Comprehensive Kenya land verification with expert coordination",
        category: "service",
        href: "/services/land-verification",
        icon: <Search className="w-4 h-4" />,
      },
      {
        id: "5",
        title: "Trust Score Dashboard",
        description: "View your community trust score and document history",
        category: "page",
        href: "/dashboard/trust",
        icon: <TrendingUp className="w-4 h-4" />,
      },
    ],
    []
  );

  // Memoize trending searches to prevent unnecessary re-renders
  const trendingSearches = useMemo(
    () => [
      "Nairobi apartments",
      "Westlands commercial",
      "Karen land for sale",
      "Property verification",
    ],
    []
  );

  // Load recent searches from localStorage with error handling
  useEffect(() => {
    try {
      // Use optional chaining for cleaner, more readable code
      const saved = window.localStorage?.getItem("recentSearches");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      }
    } catch (error) {
      // Proper error handling - log the error and set default state
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(
          "Could not load recent searches from localStorage:",
          error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
        );
      }
      setRecentSearches([]);
    }
  }, []);

  // Memoized search handler to prevent unnecessary re-renders
  const handleSearch = useCallback(() => {
    if (!query.trim()) return;

    // Add to recent searches with deduplication and length limit
    const newRecentSearches = [
      query,
      ...recentSearches.filter((s) => s !== query),
    ].slice(0, 5);
    setRecentSearches(newRecentSearches);

    // Save to localStorage with error handling
    try {
      window.localStorage?.setItem(
        "recentSearches",
        JSON.stringify(newRecentSearches)
      );
    } catch (error) {
      // Log localStorage errors but don't let them break the search functionality
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(
          "Could not save recent searches to localStorage:",
          error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
        );
      }
    }

    if (onSearch) {
      onSearch(query);
    } else {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }

    setIsOpen(false);
  }, [query, recentSearches, onSearch]);

  // Memoized result click handler
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      if (onResultClick) {
        onResultClick(result);
      } else {
        window.location.href = result.href;
      }
      setIsOpen(false);
    },
    [onResultClick]
  );

  // Memoized recent search click handler
  const handleRecentSearchClick = useCallback(
    (searchTerm: string) => {
      setQuery(searchTerm);
      if (onSearch) {
        onSearch(searchTerm);
      } else {
        window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
      }
      setIsOpen(false);
    },
    [onSearch]
  );

  // Debounced search with proper cleanup
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim()) {
      setIsLoading(true);
      debounceRef.current = setTimeout(() => {
        // Perform search filtering with safe property access
        const filtered = mockResults.filter((result) => {
          const titleMatch = result.title
            .toLowerCase()
            .includes(query.toLowerCase());
          const descriptionMatch = result.description
            ?.toLowerCase()
            .includes(query.toLowerCase());
          return titleMatch || descriptionMatch;
        });
        setResults(filtered);
        setIsLoading(false);
      }, 300);
    } else {
      setResults([]);
      setIsLoading(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, mockResults]);

  // Handle keyboard navigation with proper dependencies
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            const selectedResult = results.at(selectedIndex);
            if (selectedResult) {
              handleResultClick(selectedResult);
            }
          } else if (query.trim()) {
            handleSearch();
          }
          break;
        case "Escape":
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, results, query, handleSearch, handleResultClick]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Memoized clear function for recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      window.localStorage?.removeItem("recentSearches");
    } catch (error) {
      // Log localStorage errors but don't let them break the clear functionality
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(
          "Could not clear recent searches from localStorage:",
          error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
        );
      }
    }
  }, []);

  // Memoized clear query function
  const clearQuery = useCallback(() => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  }, []);

  // Memoized variant classes
  const getVariantClasses = useMemo(() => {
    switch (variant) {
      case "compact":
        return "w-48";
      case "expanded":
        return "w-96";
      default:
        return "w-64";
    }
  }, [variant]);

  // Extract search results content to reduce nesting
  const renderSearchResults = useMemo(() => {
    if (isLoading) {
      return (
        <div className="p-4 text-center text-gray-500">
          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          Searching...
        </div>
      );
    }

    if (results.length > 0) {
      return (
        <div>
          <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
            Search Results
          </div>
          {results.map((result, index) => (
            <button
              type="button"
              key={result.id}
              onClick={() => handleResultClick(result)}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0",
                selectedIndex === index && "bg-gray-50"
              )}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">{result.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {result.title}
                  </div>
                  {result.description && (
                    <div className="text-sm text-gray-600 truncate">
                      {result.description}
                    </div>
                  )}
                  {result.metadata && (
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                      {result.metadata.price && (
                        <span>{result.metadata.price}</span>
                      )}
                      {result.metadata.location && (
                        <span>• {result.metadata.location}</span>
                      )}
                      {result.metadata.type && (
                        <span>• {result.metadata.type}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="p-4 text-center text-gray-500">
        No results found for &ldquo;{query}&rdquo;
      </div>
    );
  }, [isLoading, results, query, selectedIndex, handleResultClick]);

  // Extract default state content to reduce nesting
  const renderDefaultState = useMemo(
    () => (
      <div>
        {showRecentSearches && recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Recent Searches
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearRecentSearches}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </Button>
            </div>
            {recentSearches.map((search, index) => (
              <button
                type="button"
                key={`recent-${index}`}
                onClick={() => handleRecentSearchClick(search)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-3"
              >
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{search}</span>
              </button>
            ))}
          </div>
        )}

        {showSuggestions && (
          <div>
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
              Trending Searches
            </div>
            {trendingSearches.map((search, index) => (
              <button
                type="button"
                key={`trending-${index}`}
                onClick={() => handleRecentSearchClick(search)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-3"
              >
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{search}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    ),
    [
      showRecentSearches,
      recentSearches,
      clearRecentSearches,
      handleRecentSearchClick,
      showSuggestions,
      trendingSearches,
    ]
  );

  return (
    <div
      ref={searchRef}
      className={cn("relative", getVariantClasses, className)}
    >
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className={cn(
            "pl-10 pr-10 transition-all duration-200",
            isOpen && "ring-2 ring-primary/20 border-primary"
          )}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearQuery}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {query.trim() ? renderSearchResults : renderDefaultState}
        </div>
      )}
    </div>
  );
}
