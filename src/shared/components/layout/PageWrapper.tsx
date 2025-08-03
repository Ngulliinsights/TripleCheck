/**
 * PageWrapper Component
 * 
 * A wrapper component that provides consistent layout and spacing for pages,
 * ensuring proper navbar clearance and responsive behavior.
 */

import React from 'react';

import { NavbarSpacer } from './NavbarSpacer';

import { cn } from '@/shared/lib/utils';

interface PageWrapperProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly hasHero?: boolean;
  readonly fullHeight?: boolean;
  readonly navbarSpacing?: 'default' | 'hero' | 'minimal' | 'none';
}

/**
 * PageWrapper provides consistent page layout with proper navbar spacing
 * 
 * @param hasHero - Whether the page has a hero section (affects spacing)
 * @param fullHeight - Whether the page should take full viewport height
 * @param navbarSpacing - Type of navbar spacing to apply
 */
export function PageWrapper({ 
  children, 
  className,
  hasHero = false,
  fullHeight = false,
  navbarSpacing = 'default'
}: PageWrapperProps) {
  return (
    <div 
      className={cn(
        'w-full',
        fullHeight && 'min-h-screen',
        className
      )}
    >
      {/* Add navbar spacing unless explicitly disabled */}
      {navbarSpacing !== 'none' && (
        <NavbarSpacer 
          variant={hasHero ? 'hero' : navbarSpacing} 
        />
      )}
      
      {children}
    </div>
  );
}

/**
 * HeroSection component with built-in navbar spacing
 */
interface HeroSectionProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly backgroundClassName?: string;
}

export function HeroSection({ 
  children, 
  className,
  backgroundClassName 
}: HeroSectionProps) {
  return (
    <div className={cn('relative', backgroundClassName)}>
      {/* Navbar spacing specifically for hero sections */}
      <NavbarSpacer variant="hero" />
      
      <div className={cn(
        'relative isolate overflow-hidden',
        className
      )}>
        {children}
      </div>
    </div>
  );
}