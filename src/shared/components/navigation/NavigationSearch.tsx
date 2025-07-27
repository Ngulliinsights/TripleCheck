import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, MapPin, Building } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: 'property' | 'location' | 'service' | 'page';
  href: string;
  icon?: React.ReactNode;
  metadata?: {
    price?: string;
    location?: string;
    type?: string;
  };
}

interface NavigationSearchProps {
  className?: string;
  placeholder?: string;
  variant?: 'default' | 'compact' | 'expanded';
  showSuggestions?: boolean;
  showRecentSearches?: boolean;
  onSearch?: (query: string) => void;
  onResultClick?: (result: SearchResult) => void;
}

export function NavigationSearch({
  className,
  placeholder = 'Search properties, locations...',
  variant = 'default',
  showSuggestions = true,
  showRecentSearches = true,
  onSearch,
  onResultClick
}: NavigationSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Mock search data - in real app, this would come from API
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: '3 Bedroom Apartment in Victoria Island',
      description: 'Modern apartment with ocean view',
      category: 'property',
      href: '/properties/1',
      icon: <Building className="w-4 h-4" />,
      metadata: { price: 'KSh 50M', location: 'Westlands', type: 'Apartment' }
    },
    {
      id: '2',
      title: 'Nairobi Properties',
      description: 'Browse all properties in Nairobi',
      category: 'location',
      href: '/properties?location=nairobi',
      icon: <MapPin className="w-4 h-4" />
    },
    {
      id: '3',
      title: 'Property Verification Service',
      description: 'Verify property authenticity',
      category: 'service',
      href: '/services/verification',
      icon: <Search className="w-4 h-4" />
    }
  ];

  const trendingSearches = [
    'Nairobi apartments',
    'Westlands commercial',
    'Karen land for sale',
    'Property verification'
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim()) {
      setIsLoading(true);
      debounceRef.current = setTimeout(() => {
        // Mock search - replace with actual API call
        const filtered = mockResults.filter(result =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description?.toLowerCase().includes(query.toLowerCase())
        );
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
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          } else if (query.trim()) {
            handleSearch();
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results, query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      // Add to recent searches
      const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
      
      if (onSearch) {
        onSearch(query);
      } else {
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
      }
      
      setIsOpen(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      window.location.href = result.href;
    }
    setIsOpen(false);
  };

  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm);
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
    }
    setIsOpen(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'w-48';
      case 'expanded':
        return 'w-96';
      default:
        return 'w-64';
    }
  };

  return (
    <div ref={searchRef} className={cn('relative', getVariantClasses(), className)}>
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
            'pl-10 pr-10 transition-all duration-200',
            isOpen && 'ring-2 ring-primary/20 border-primary'
          )}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {query.trim() ? (
            // Search Results
            <div>
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
                    Search Results
                  </div>
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0',
                        selectedIndex === index && 'bg-gray-50'
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {result.icon}
                        </div>
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
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No results found for "{query}"
                </div>
              )}
            </div>
          ) : (
            // Default state with recent searches and suggestions
            <div>
              {showRecentSearches && recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Recent Searches
                    </span>
                    <Button
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
                      key={index}
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
                      key={index}
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
          )}
        </div>
      )}
    </div>
  );
}