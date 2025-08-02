/**
 * NavbarSpacer Component
 * 
 * Provides consistent spacing to prevent fixed navbar overlap with page content.
 * Automatically adjusts based on navbar height and scroll state.
 */

import React from 'react';
import { cn } from '@/shared/lib/utils';

interface NavbarSpacerProps {
  readonly className?: string;
  readonly variant?: 'default' | 'hero' | 'minimal';
}

/**
 * NavbarSpacer component that provides consistent top spacing for page content
 * to prevent overlap with the fixed navigation bar.
 * 
 * @param variant - Controls the amount of spacing:
 *   - 'default': Standard spacing for regular pages
 *   - 'hero': Larger spacing for hero sections
 *   - 'minimal': Minimal spacing for compact layouts
 */
export function NavbarSpacer({ className, variant = 'default' }: NavbarSpacerProps) {
  const spacingClasses = {
    default: 'h-20 md:h-24', // Standard navbar height + some breathing room
    hero: 'h-16 md:h-20',    // Less spacing for hero sections that want to be closer to navbar
    minimal: 'h-16',         // Minimal spacing for compact layouts
  };

  return (
    <div 
      className={cn(
        'w-full flex-shrink-0',
        spacingClasses[variant],
        className
      )}
      aria-hidden="true"
      role="presentation"
    />
  );
}

/**
 * Hook to get the current navbar height for dynamic calculations
 */
export function useNavbarHeight() {
  const [navbarHeight, setNavbarHeight] = React.useState(80); // Default height

  React.useEffect(() => {
    const updateNavbarHeight = () => {
      // Get the CSS custom property set by the Navigation component
      const height = getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-height')
        .trim();
      
      if (height) {
        setNavbarHeight(parseInt(height, 10));
      }
    };

    // Initial check
    updateNavbarHeight();

    // Listen for changes (when user scrolls and navbar height changes)
    const observer = new MutationObserver(updateNavbarHeight);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, []);

  return navbarHeight;
}