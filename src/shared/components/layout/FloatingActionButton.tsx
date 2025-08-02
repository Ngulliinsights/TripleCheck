import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';

// Enhanced type definitions for better TypeScript safety
type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
type Variant = 'primary' | 'secondary' | 'accent';
type Size = 'sm' | 'md' | 'lg';

// Constants to avoid duplicate strings
const DEFAULT_POSITION: Position = 'bottom-right';

interface Offset {
  x: number;
  y: number;
}

interface FloatingActionButtonProps {
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
  readonly position?: Position;
  readonly offset?: Offset;
  readonly className?: string;
  readonly variant?: Variant;
  readonly size?: Size;
  readonly tooltip?: string;
  readonly hideOnScroll?: boolean;
  readonly showAfterScroll?: number;
  readonly disabled?: boolean; // Added for better UX
  readonly 'aria-label'?: string; // Explicit aria-label prop for better a11y
}

export function FloatingActionButton({
  children,
  onClick,
  position = DEFAULT_POSITION,
  offset = { x: 24, y: 24 },
  className,
  variant = 'primary',
  size = 'md',
  tooltip,
  hideOnScroll = false,
  showAfterScroll = 100,
  disabled = false,
  'aria-label': ariaLabel
}: FloatingActionButtonProps) {
  const [isVisible, setIsVisible] = useState(!hideOnScroll);
  const [isHovered, setIsHovered] = useState(false);
  
  // Use ref to track if component is mounted to prevent memory leaks
  const mountedRef = useRef(true);
  
  // Memoize scroll handler to prevent unnecessary re-renders
  const handleScroll = useCallback(() => {
    if (!mountedRef.current) return;
    
    const scrolled = window.scrollY; // Use scrollY instead of deprecated pageYOffset
    
    if (hideOnScroll) {
      // Hide when scrolling down past threshold
      setIsVisible(scrolled < 50);
    } else {
      // Show after scrolling past specified amount
      setIsVisible(scrolled > showAfterScroll);
    }
  }, [hideOnScroll, showAfterScroll]);

  // Optimized throttled scroll handler using requestAnimationFrame
  const throttledScrollHandler = useMemo(() => {
    let ticking = false;
    
    return () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    // Early return if no scroll behavior is needed
    if (!hideOnScroll && showAfterScroll === 0) return;

    // Add event listener with passive option for better performance
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
    // Initial visibility check
    handleScroll();

    // Cleanup function
    return () => {
      mountedRef.current = false;
      window.removeEventListener('scroll', throttledScrollHandler);
    };
  }, [throttledScrollHandler, handleScroll, hideOnScroll, showAfterScroll]);

  // Memoize position classes to prevent recalculation on every render
  const positionClasses = useMemo(() => {
    const baseClasses = 'fixed z-[1000]';
    
    // Use explicit conditional logic instead of dynamic object access for security
    if (position === DEFAULT_POSITION) {
      return `${baseClasses} bottom-6 right-6`;
    } else if (position === 'bottom-left') {
      return `${baseClasses} bottom-6 left-6`;
    } else if (position === 'top-right') {
      return `${baseClasses} top-6 right-6`;
    } else if (position === 'top-left') {
      return `${baseClasses} top-6 left-6`;
    }
    
    return `${baseClasses} bottom-6 right-6`; // default
  }, [position]);

  // Custom offset styles only when needed (non-default offsets)
  const customOffsetStyles = useMemo((): React.CSSProperties | undefined => {
    // Only use inline styles for custom offsets that can't be handled by Tailwind
    if (offset.x === 24 && offset.y === 24) return undefined;
    
    const styles: React.CSSProperties = {};
    
    if (position === DEFAULT_POSITION) {
      styles.bottom = offset.y;
      styles.right = offset.x;
    } else if (position === 'bottom-left') {
      styles.bottom = offset.y;
      styles.left = offset.x;
    } else if (position === 'top-right') {
      styles.top = offset.y;
      styles.right = offset.x;
    } else if (position === 'top-left') {
      styles.top = offset.y;
      styles.left = offset.x;
    }
    
    return styles;
  }, [position, offset]);

  // Memoize CSS classes to prevent string concatenation on every render
  const sizeClasses = useMemo(() => {
    // Use explicit conditionals instead of dynamic object access for security
    if (size === 'sm') return 'w-12 h-12 text-sm';
    if (size === 'lg') return 'w-16 h-16 text-lg';
    return 'w-14 h-14 text-base'; // default 'md' case
  }, [size]);

  const variantClasses = useMemo(() => {
    // Use explicit conditionals instead of dynamic object access for security
    if (variant === 'secondary') {
      return 'bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white shadow-lg hover:shadow-xl';
    }
    if (variant === 'accent') {
      return 'bg-accent text-accent-foreground hover:bg-accent-hover shadow-lg hover:shadow-xl';
    }
    // default 'primary' case
    return 'bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-lg hover:shadow-xl';
  }, [variant]);

  // Memoize tooltip positioning classes and minimal styles
  const tooltipPositioning = useMemo(() => {
    const isRightSide = position.includes('right');
    const baseClasses = 'fixed z-[1001] top-1/2 -translate-y-1/2';
    
    // Use Tailwind classes for common positions
    let positionClasses = '';
    let customStyles: React.CSSProperties | undefined = undefined;
    
    if (isRightSide) {
      if (offset.x === 24) {
        positionClasses = `${baseClasses} right-20`; // Standard offset
      } else {
        positionClasses = `${baseClasses}`;
        customStyles = { right: offset.x + 60 };
      }
    } else {
      if (offset.x === 24) {
        positionClasses = `${baseClasses} left-20`; // Standard offset
      } else {
        positionClasses = `${baseClasses}`;
        customStyles = { left: offset.x + 60 };
      }
    }
    
    return { classes: positionClasses, styles: customStyles };
  }, [position, offset]);

  // Early return for better performance when not visible
  if (!isVisible) return null;

  // Enhanced accessibility with proper ARIA attributes
  const accessibilityProps = {
    'aria-label': ariaLabel || tooltip || 'Floating action button',
    'aria-disabled': disabled,
    'aria-describedby': tooltip && isHovered ? 'fab-tooltip' : undefined,
  };

  return (
    <>
      <button
        {...accessibilityProps}
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => !disabled && setIsHovered(false)}
        disabled={disabled}
        className={cn(
          // Base styles
          'rounded-full flex items-center justify-center',
          'transition-all duration-300 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50',
          'will-change-transform',
          // Conditional styles based on disabled state
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'transform hover:scale-110 active:scale-95 cursor-pointer',
          // Dynamic classes
          sizeClasses,
          variantClasses,
          positionClasses,
          className
        )}
        style={customOffsetStyles}
      >
        {children}
      </button>

      {/* Enhanced tooltip with better positioning and accessibility */}
      {tooltip && isHovered && !disabled && (
        <div
          id="fab-tooltip"
          role="tooltip"
          className={cn(
            'px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg',
            'pointer-events-none transition-opacity duration-200',
            'whitespace-nowrap opacity-100',
            tooltipPositioning.classes
          )}
          style={tooltipPositioning.styles}
        >
          {tooltip}
          {/* Tooltip arrow with improved positioning */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-900 rotate-45 top-1/2 -translate-y-1/2',
              position.includes('right') ? '-right-1' : '-left-1'
            )}
          />
        </div>
      )}
    </>
  );
}