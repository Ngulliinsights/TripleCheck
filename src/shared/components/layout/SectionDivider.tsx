import React, { useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';

// Constants to avoid duplicate strings
const BORDER_CLASS = 'border-t';
const BORDER_T2_CLASS = 'border-t-2';

interface SectionDividerProps {
  readonly variant?: 'line' | 'wave' | 'zigzag' | 'dots' | 'gradient';
  readonly color?: 'primary' | 'secondary' | 'accent' | 'muted';
  readonly thickness?: 'thin' | 'medium' | 'thick';
  readonly spacing?: 'sm' | 'md' | 'lg' | 'xl';
  readonly animated?: boolean;
  readonly className?: string;
  readonly children?: React.ReactNode;
}

export function SectionDivider({
  variant = 'line',
  color = 'muted',
  thickness = 'medium',
  spacing = 'md',
  animated = false,
  className,
  children
}: SectionDividerProps) {
  const dividerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!animated || !dividerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting || false);
      },
      { threshold: 0.1 }
    );

    observer.observe(dividerRef.current);
    return () => observer.disconnect();
  }, [animated]);

  // Helper functions to reduce complexity and eliminate nested ternaries
  const getSpacingClass = (): string => {
    const spacingMap = {
      sm: 'my-8',
      md: 'my-12',
      lg: 'my-16',
      xl: 'my-24'
    } as const;
    // Type-safe object access to prevent injection
    if (spacing in spacingMap) {
      return spacingMap[spacing as keyof typeof spacingMap];
    }
    return 'my-12';
  };

  const getColorClass = (): string => {
    const colorMap = {
      primary: 'text-primary border-primary',
      secondary: 'text-secondary border-secondary',
      accent: 'text-accent border-accent',
      muted: 'text-muted-foreground border-border'
    } as const;
    // Type-safe object access to prevent injection
    if (color in colorMap) {
      return colorMap[color as keyof typeof colorMap];
    }
    return 'text-muted-foreground border-border';
  };

  const getThicknessValue = (): string => {
    const thicknessMap = {
      thin: '1px',
      medium: '2px',
      thick: '4px'
    } as const;
    // Type-safe object access to prevent injection
    if (thickness in thicknessMap) {
      return thicknessMap[thickness as keyof typeof thicknessMap];
    }
    return '2px';
  };

  const getBorderThicknessClass = (): string => {
    if (thickness === 'thick') return BORDER_T2_CLASS;
    return BORDER_CLASS;
  };

  const getDotSize = (): string => {
    const sizeMap = {
      thin: 'w-1 h-1',
      medium: 'w-2 h-2',
      thick: 'w-3 h-3'
    } as const;
    // Type-safe object access to prevent injection
    if (thickness in sizeMap) {
      return sizeMap[thickness as keyof typeof sizeMap];
    }
    return 'w-2 h-2';
  };

  const getGradientHeight = (): string => {
    const heightMap = {
      thin: 'h-px',
      medium: 'h-0.5',
      thick: 'h-1'
    } as const;
    // Type-safe object access to prevent injection
    if (thickness in heightMap) {
      return heightMap[thickness as keyof typeof heightMap];
    }
    return 'h-0.5';
  };

  // Animation styles are now handled via CSS classes

  // Base classes used across all variants
  const getBaseClasses = (): string => {
    return cn(
      'w-full flex items-center justify-center',
      getSpacingClass(),
      getColorClass(),
      animated && 'transition-all duration-1000 ease-out',
      animated && (isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'),
      className
    );
  };

  // Individual variant renderers - breaking down the large switch statement
  const renderWaveVariant = (): JSX.Element => (
    <div className={getBaseClasses()}>
      <svg
        className="w-full h-4"
        viewBox="0 0 400 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 10 Q100 0 200 10 T400 10"
          stroke="currentColor"
          strokeWidth={getThicknessValue()}
          fill="none"
          className={animated && isVisible ? 'animate-pulse' : ''}
        />
      </svg>
    </div>
  );

  const renderZigzagVariant = (): JSX.Element => (
    <div className={getBaseClasses()}>
      <svg
        className="w-full h-4"
        viewBox="0 0 400 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 10 L50 0 L100 10 L150 0 L200 10 L250 0 L300 10 L350 0 L400 10"
          stroke="currentColor"
          strokeWidth={getThicknessValue()}
          fill="none"
          strokeLinejoin="round"
          className={animated && isVisible ? 'animate-pulse' : ''}
        />
      </svg>
    </div>
  );

  const renderDotsVariant = (): JSX.Element => (
    <div className={getBaseClasses()}>
      <div className="flex items-center space-x-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-current',
              getDotSize(),
              animated && isVisible && 'animate-bounce',
              animated ? `animate-delay-${i}` : ''
            )}
          />
        ))}
      </div>
    </div>
  );

  const renderGradientVariant = (): JSX.Element => (
    <div className={getBaseClasses()}>
      <div
        className={cn(
          'w-full bg-gradient-to-r from-transparent via-current to-transparent',
          getGradientHeight(),
          animated && isVisible ? 'animate-pulse' : ''
        )}
      />
    </div>
  );

  const renderLineVariant = (): JSX.Element => {
    const baseClasses = getBaseClasses();
    const borderClass = getBorderThicknessClass();

    if (children) {
      return (
        <div className={baseClasses}>
          <div className="flex items-center w-full">
            <div
              className={cn('flex-1 border-t', borderClass)}
            />
            <div className="px-4 text-sm font-medium bg-background">
              {children}
            </div>
            <div
              className={cn('flex-1 border-t', borderClass)}
            />
          </div>
        </div>
      );
    }

    return (
      <div className={baseClasses}>
        <div
          className={cn(
            'w-full border-t', 
            borderClass, 
            getBorderThicknessClass(),
            animated && isVisible ? 'animate-pulse' : ''
          )}
        />
      </div>
    );
  };

  // Main render function - now much simpler
  const renderDivider = (): JSX.Element => {
    const variantRenderers = {
      wave: renderWaveVariant,
      zigzag: renderZigzagVariant,
      dots: renderDotsVariant,
      gradient: renderGradientVariant,
      line: renderLineVariant
    } as const;

    // Type-safe object access to prevent injection
    const renderer = (variant in variantRenderers) 
      ? variantRenderers[variant as keyof typeof variantRenderers]
      : renderLineVariant;
    return renderer();
  };

  return (
    <div ref={dividerRef}>
      {renderDivider()}
    </div>
  );
}