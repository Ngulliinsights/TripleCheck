import React, { useState, useEffect, useRef, useCallback, createContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from '../ui/button';
import { Logo } from '../ui/logo';
import { Wordmark } from '../ui/wordmark';
import { Shield, Menu, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { MobileNav } from '../navigation/MobileNav';
import { SafeNavigation } from '../navigation/SafeNavigation';
import { ErrorBoundary } from '../../../app/error-boundary';
import { MobileNavFallback } from '../fallbacks/MobileNavFallback';

interface NavigationProps {
  className?: string;
  variant?: 'default' | 'transparent';
}

export function Navigation({ className, variant = 'default' }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced safe navigation function with proper timeout management
  const handleNavigation = useCallback((href: string, event?: React.MouseEvent) => {
    // Prevent multiple simultaneous navigations
    if (isNavigating) return;
    
    try {
      // Prevent default link behavior if event is provided
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      // Validate href before navigation
      if (!href || typeof href !== 'string') {
        throw new Error('Invalid navigation href');
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
      console.warn('Navigation failed, falling back to window.location:', error);
      
      // Fallback to direct navigation
      try {
        window.location.href = href;
      } catch (fallbackError) {
        console.error('Complete navigation failure:', fallbackError);
        // Last resort - reload to home
        window.location.href = '/';
      }
    }
  }, [navigate, isNavigating]);

  // Safe search function with proper error handling
  const handleSearch = useCallback((query: string) => {
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
      console.warn('Search navigation failed:', error);
      
      // Fallback to direct URL navigation
      try {
        window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
      } catch (fallbackError) {
        console.error('Search fallback failed:', fallbackError);
      }
    }
  }, [navigate, isNavigating]);

  // Enhanced scroll detection with proper throttling and cleanup
  useEffect(() => {
    let ticking = false;
    let rafId: number | null = null;
    
    const handleScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          try {
            const scrollTop = window.pageYOffset;
            setIsScrolled(scrollTop > 20);
          } catch (error) {
            console.warn('Scroll handler error:', error);
          } finally {
            ticking = false;
            rafId = null;
          }
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
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
        if (navRef.current && event.target && !navRef.current.contains(event.target as Node)) {
          setActiveDropdown(null);
          setIsSearchFocused(false);
          if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
            dropdownTimeoutRef.current = null;
          }
        }
      } catch (error) {
        console.warn('Click outside handler error:', error);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
      setSearchQuery('');
    };
  }, []);

  // Streamlined navigation focused on core user journeys
  const navigationItems = [
    {
      label: 'Home',
      href: '/',
      primary: true, // Primary CTA in navigation
      description: 'Return to homepage'
    },
    {
      label: 'Properties',
      href: '/properties',
      dropdown: [
        { 
          label: 'Browse Properties', 
          href: '/properties', 
          description: 'Explore verified listings',
          cta: 'Browse Now'
        },
        { 
          label: 'Residential', 
          href: '/properties/residential', 
          description: 'Houses and apartments',
          cta: 'View Homes'
        },
        { 
          label: 'Commercial', 
          href: '/properties/commercial', 
          description: 'Office and retail spaces',
          cta: 'View Commercial'
        },
        { 
          label: 'Land', 
          href: '/properties/land', 
          description: 'Development opportunities',
          cta: 'View Land'
        }
      ]
    },
    {
      label: 'Services',
      href: '/services',
      dropdown: [
        { 
          label: 'Property Verification', 
          href: '/services/basic-checks', 
          description: 'Complete property checks',
          cta: 'Start Now',
          featured: true
        },
        { 
          label: 'Fraud Detection', 
          href: '/services/fraud-detection', 
          description: 'AI-powered protection',
          cta: 'Check Property'
        },
        { 
          label: 'Document Authentication', 
          href: '/services/document-auth', 
          description: 'Secure verification',
          cta: 'Verify Documents'
        },
        { 
          label: 'List Your Property', 
          href: '/services/list-property', 
          description: 'Verified listings',
          cta: 'List Now',
          highlight: true
        }
      ]
    },
    { 
      label: 'Pricing', 
      href: '/pricing'
    },
    {
      label: 'Help',
      href: '/help',
      dropdown: [
        { 
          label: 'Help Center', 
          href: '/help', 
          description: 'Get support',
          cta: 'Get Help'
        },
        { 
          label: 'Contact Us', 
          href: '/contact', 
          description: 'Talk to experts',
          cta: 'Contact'
        },
        { 
          label: 'About Us', 
          href: '/about', 
          description: 'Our story',
          cta: 'Learn More'
        }
      ]
    }
  ];

  const searchSuggestions = [
    'Nairobi apartments',
    'Westlands properties',
    'Mombasa commercial',
    'Karen land for sale'
  ];

  return (
    <nav
      ref={navRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out',
        variant === 'transparent' && !isScrolled
          ? 'bg-transparent'
          : 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100',
        isScrolled && 'py-2',
        !isScrolled && 'py-4',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Logo 
              size="md"
              variant={variant === 'transparent' && !isScrolled ? 'light' : 'default'}
              interactive={true}
              href="/"
              onClick={() => handleNavigation('/')}
            />
            <Wordmark 
              size="md"
              variant={variant === 'transparent' && !isScrolled ? 'light' : 'default'}
              animated={true}
              interactive={true}
              href="/"
              onClick={() => handleNavigation('/')}
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <div key={item.label} className="relative">
                {item.dropdown ? (
                  <button
                    type="button"
                    disabled={isNavigating}
                    className={cn(
                      'flex items-center space-x-1 px-3 py-2 rounded-md transition-all duration-200',
                      'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      variant === 'transparent' && !isScrolled
                        ? 'text-white hover:bg-white/10'
                        : 'text-gray-700 hover:text-primary',
                      activeDropdown === item.label && 'bg-gray-100'
                    )}
                    onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                    onMouseEnter={() => handleDropdownEnter(item.label)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      activeDropdown === item.label && 'rotate-180'
                    )} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isNavigating}
                    onClick={(e) => handleNavigation(item.href, e)}
                    className={cn(
                      'px-3 py-2 rounded-md transition-all duration-200',
                      'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      variant === 'transparent' && !isScrolled
                        ? 'text-white hover:bg-white/10'
                        : 'text-gray-700 hover:text-primary'
                    )}
                  >
                    {item.label}
                  </button>
                )}

                {/* Streamlined Dropdown Menu */}
                {item.dropdown && activeDropdown === item.label && (
                  <div
                    className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
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
                          "group block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          dropdownItem.featured && "bg-gradient-to-r from-primary/5 to-primary/10 border-l-2 border-primary",
                          dropdownItem.highlight && "bg-gradient-to-r from-secondary/5 to-secondary/10 border-l-2 border-secondary"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className={cn(
                              "font-medium transition-colors duration-150",
                              dropdownItem.featured ? "text-primary" : "text-gray-900 group-hover:text-primary",
                              dropdownItem.highlight && "text-secondary"
                            )}>
                              {dropdownItem.label}
                              {dropdownItem.featured && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-white">
                                  Popular
                                </span>
                              )}
                              {dropdownItem.highlight && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                  Sell
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{dropdownItem.description}</div>
                          </div>
                          <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <span className={`text-xs font-medium ${dropdownItem.highlight ? 'text-secondary' : 'text-primary'}`}>
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
          <div className="hidden lg:flex items-center space-x-4">
            {/* Enhanced Search */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search properties..."
                  value={searchQuery}
                  disabled={isNavigating}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => !isNavigating && setIsSearchFocused(true)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery && !isNavigating) {
                      handleSearch(searchQuery);
                    }
                  }}
                  className={cn(
                    'w-64 pl-10 pr-4 py-2 rounded-lg border transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    variant === 'transparent' && !isScrolled
                      ? 'bg-white/10 border-white/20 text-white placeholder-white/70'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  )}
                />
              </div>

              {/* Search Suggestions */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {searchQuery ? (
                    <button
                      type="button"
                      disabled={isNavigating}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleSearch(searchQuery)}
                    >
                      <div className="flex items-center">
                        <Search className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-900">Search for "{searchQuery}"</span>
                      </div>
                    </button>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Popular Searches
                      </div>
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          disabled={isNavigating}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleSearch(suggestion)}
                        >
                          <div className="flex items-center">
                            <Search className="w-4 h-4 text-gray-400 mr-3" />
                            <span className="text-gray-900">{suggestion}</span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* User Authentication/Dashboard Links */}
            {/* TODO: Replace with actual auth state check */}
            {false ? (
              // Authenticated user menu
              <div className="relative">
                <button
                  type="button"
                  disabled={isNavigating}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200',
                    'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    variant === 'transparent' && !isScrolled
                      ? 'text-white hover:bg-white/10'
                      : 'text-gray-700 hover:text-primary'
                  )}
                  onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">U</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* User Dropdown */}
                {activeDropdown === 'user' && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button 
                      type="button"
                      disabled={isNavigating}
                      onClick={() => handleNavigation('/dashboard')} 
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-gray-900">Dashboard</div>
                    </button>
                    <button 
                      type="button"
                      disabled={isNavigating}
                      onClick={() => handleNavigation('/inbox')} 
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-gray-900">Messages</div>
                    </button>
                    <button 
                      type="button"
                      disabled={isNavigating}
                      onClick={() => handleNavigation('/team')} 
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-gray-900">Team</div>
                    </button>
                    <div className="border-t border-gray-100 my-2"></div>
                    <button 
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="font-medium text-gray-900">Sign Out</div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Unauthenticated user buttons
              <>
                <Button 
                  variant="outline" 
                  className="hidden xl:flex"
                  disabled={isNavigating}
                  onClick={() => handleNavigation('/auth/login')}
                >
                  {isNavigating ? 'Loading...' : 'Login'}
                </Button>
                <Button 
                  className="hidden xl:flex"
                  disabled={isNavigating}
                  onClick={() => handleNavigation('/auth/register')}
                >
                  {isNavigating ? 'Loading...' : 'Get Started'}
                </Button>
              </>
            )}
          </div>

          {/* Tablet Navigation - Simplified */}
          <div className="hidden md:flex lg:hidden items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              disabled={isNavigating}
              onClick={() => handleNavigation('/auth/login')}
            >
              Login
            </Button>
            <Button 
              size="sm"
              disabled={isNavigating}
              onClick={() => handleNavigation('/auth/register')}
            >
              Get Started
            </Button>
            <SafeNavigation fallback={<MobileNavFallback />}>
              <MobileNav />
            </SafeNavigation>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <SafeNavigation fallback={<MobileNavFallback />}>
              <MobileNav />
            </SafeNavigation>
          </div>
        </div>
      </div>
    </nav>
  );
}