import React, { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/utils';

interface LayoutContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fluidTypography?: boolean;
  responsiveBreakpoints?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  centerContent?: boolean;
}

export function LayoutContainer({
  children,
  maxWidth = 'xl',
  padding = 'md',
  className,
  fluidTypography = true,
  responsiveBreakpoints,
  centerContent = false
}: LayoutContainerProps) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('xl');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setCurrentBreakpoint('sm');
      } else if (width < 768) {
        setCurrentBreakpoint('md');
      } else if (width < 1024) {
        setCurrentBreakpoint('lg');
      } else {
        setCurrentBreakpoint('xl');
      }
    };

    // Initial check
    updateBreakpoint();

    // Throttled resize handler
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateBreakpoint, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-4xl';
      case 'xl':
        return 'max-w-6xl';
      case '2xl':
        return 'max-w-7xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-6xl';
    }
  };

  const getPaddingClass = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'px-4 py-2';
      case 'md':
        return 'px-6 py-4 sm:px-8 sm:py-6';
      case 'lg':
        return 'px-8 py-6 sm:px-12 sm:py-8';
      case 'xl':
        return 'px-12 py-8 sm:px-16 sm:py-12';
      default:
        return 'px-6 py-4 sm:px-8 sm:py-6';
    }
  };

  const getFluidTypographyStyles = () => {
    if (!fluidTypography) return {};

    const breakpointStyles = responsiveBreakpoints || {
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem'
    };

    return {
      fontSize: `clamp(${breakpointStyles.sm || '0.875rem'}, 2.5vw, ${breakpointStyles.xl || '1.25rem'})`,
      lineHeight: 'clamp(1.4, 1.5, 1.6)'
    };
  };

  return (
    <div
      className={cn(
        'mx-auto w-full',
        getMaxWidthClass(),
        getPaddingClass(),
        centerContent && 'flex flex-col items-center justify-center min-h-full',
        className
      )}
      style={getFluidTypographyStyles()}
      data-breakpoint={currentBreakpoint}
    >
      {children}
    </div>
  );
}

// Responsive breakpoint hook for child components
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl'>('xl');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setBreakpoint('sm');
      } else if (width < 768) {
        setBreakpoint('md');
      } else if (width < 1024) {
        setBreakpoint('lg');
      } else {
        setBreakpoint('xl');
      }
    };

    updateBreakpoint();

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateBreakpoint, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return breakpoint;
}