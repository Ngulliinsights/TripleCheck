import { useEffect, useState } from 'react';

/**
 * Hook for managing navigation-aware spacing
 * 
 * This hook provides utilities for components that need to account for
 * the fixed navigation bar's dynamic height changes during scroll.
 */
export function useNavigationSpacing() {
  const [navHeight, setNavHeight] = useState(88); // Default height
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateNavHeight = () => {
      const scrollTop = window.scrollY;
      const scrolled = scrollTop > 20;
      const height = scrolled ? 72 : 88; // Matches Navigation component logic
      
      setIsScrolled(scrolled);
      setNavHeight(height);
      
      // Update CSS custom property
      document.documentElement.style.setProperty('--nav-height', `${height}px`);
    };

    // Initial setup
    updateNavHeight();

    // Listen for scroll events
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateNavHeight();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    navHeight,
    isScrolled,
    // Utility functions for common spacing needs
    getTopSpacing: (additionalSpacing = 0) => navHeight + additionalSpacing,
    getScrollMargin: (additionalMargin = 16) => navHeight + additionalMargin,
    // CSS class names for common patterns
    navAwareSpacing: 'nav-aware-spacing',
    scrollMarginNav: 'scroll-margin-nav',
  };
}

/**
 * Hook specifically for page components that need top padding
 */
export function usePageSpacing() {
  const { navHeight, isScrolled } = useNavigationSpacing();
  
  return {
    navHeight,
    isScrolled,
    // Dynamic padding-top style for page containers
    pageStyle: {
      paddingTop: `${navHeight}px`,
    },
    // Class name for pages that prefer CSS approach
    pageClassName: 'nav-aware-spacing',
  };
}