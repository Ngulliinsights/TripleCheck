import React, { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/utils';

interface FloatingActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offset?: { x: number; y: number };
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
  hideOnScroll?: boolean;
  showAfterScroll?: number;
}

export function FloatingActionButton({
  children,
  onClick,
  position = 'bottom-right',
  offset = { x: 24, y: 24 },
  className,
  variant = 'primary',
  size = 'md',
  tooltip,
  hideOnScroll = false,
  showAfterScroll = 100
}: FloatingActionButtonProps) {
  const [isVisible, setIsVisible] = useState(!hideOnScroll);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!hideOnScroll && showAfterScroll === 0) return;

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      
      if (hideOnScroll) {
        setIsVisible(scrolled < 50); // Hide when scrolling down
      } else {
        setIsVisible(scrolled > showAfterScroll);
      }
    };

    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', throttledScroll);
  }, [hideOnScroll, showAfterScroll]);

  const getPositionStyles = () => {
    const styles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
    };

    switch (position) {
      case 'bottom-right':
        styles.bottom = offset.y;
        styles.right = offset.x;
        break;
      case 'bottom-left':
        styles.bottom = offset.y;
        styles.left = offset.x;
        break;
      case 'top-right':
        styles.top = offset.y;
        styles.right = offset.x;
        break;
      case 'top-left':
        styles.top = offset.y;
        styles.left = offset.x;
        break;
    }

    return styles;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-12 h-12 text-sm';
      case 'lg':
        return 'w-16 h-16 text-lg';
      default:
        return 'w-14 h-14 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white shadow-lg hover:shadow-xl';
      case 'accent':
        return 'bg-accent text-accent-foreground hover:bg-accent-hover shadow-lg hover:shadow-xl';
      default:
        return 'bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-lg hover:shadow-xl';
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'rounded-full flex items-center justify-center',
          'transition-all duration-300 ease-out',
          'transform hover:scale-110 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50',
          'will-change-transform',
          getSizeClasses(),
          getVariantClasses(),
          className
        )}
        style={getPositionStyles()}
        aria-label={tooltip}
      >
        {children}
      </button>

      {/* Tooltip */}
      {tooltip && isHovered && (
        <div
          className={cn(
            'fixed z-[1001] px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg',
            'pointer-events-none transition-opacity duration-200',
            'whitespace-nowrap'
          )}
          style={{
            ...getPositionStyles(),
            [position.includes('right') ? 'right' : 'left']: 
              position.includes('right') ? offset.x + 60 : offset.x + 60,
            transform: 'translateY(-50%)',
            top: '50%'
          }}
        >
          {tooltip}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-900 transform rotate-45',
              position.includes('right') ? '-right-1' : '-left-1'
            )}
            style={{ top: '50%', transform: 'translateY(-50%) rotate(45deg)' }}
          />
        </div>
      )}
    </>
  );
}