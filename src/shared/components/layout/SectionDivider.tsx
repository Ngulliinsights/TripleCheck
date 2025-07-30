import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/utils';

interface SectionDividerProps {
  variant?: 'line' | 'wave' | 'zigzag' | 'dots' | 'gradient';
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
  thickness?: 'thin' | 'medium' | 'thick';
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  children?: React.ReactNode;
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

  const getSpacingClass = () => {
    switch (spacing) {
      case 'sm':
        return 'my-8';
      case 'md':
        return 'my-12';
      case 'lg':
        return 'my-16';
      case 'xl':
        return 'my-24';
      default:
        return 'my-12';
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return 'text-primary border-primary';
      case 'secondary':
        return 'text-secondary border-secondary';
      case 'accent':
        return 'text-accent border-accent';
      default:
        return 'text-muted-foreground border-border';
    }
  };

  const getThicknessValue = () => {
    switch (thickness) {
      case 'thin':
        return '1px';
      case 'thick':
        return '4px';
      default:
        return '2px';
    }
  };

  const renderDivider = () => {
    const baseClasses = cn(
      'w-full flex items-center justify-center',
      getSpacingClass(),
      getColorClass(),
      animated && 'transition-all duration-1000 ease-out',
      animated && (isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'),
      className
    );

    switch (variant) {
      case 'wave':
        return (
          <div className={baseClasses}>
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

      case 'zigzag':
        return (
          <div className={baseClasses}>
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

      case 'dots':
        return (
          <div className={baseClasses}>
            <div className="flex items-center space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-full bg-current',
                    thickness === 'thin' ? 'w-1 h-1' : thickness === 'thick' ? 'w-3 h-3' : 'w-2 h-2',
                    animated && isVisible && 'animate-bounce'
                  )}
                  style={{
                    animationDelay: animated ? `${i * 0.1}s` : undefined
                  }}
                />
              ))}
            </div>
          </div>
        );

      case 'gradient':
        return (
          <div className={baseClasses}>
            <div
              className={cn(
                'w-full bg-gradient-to-r from-transparent via-current to-transparent',
                thickness === 'thin' ? 'h-px' : thickness === 'thick' ? 'h-1' : 'h-0.5'
              )}
              style={{
                opacity: animated && isVisible ? 1 : animated ? 0 : 1,
                transform: animated && isVisible ? 'scaleX(1)' : animated ? 'scaleX(0)' : 'scaleX(1)',
                transition: animated ? 'all 1s ease-out' : undefined
              }}
            />
          </div>
        );

      default: // 'line'
        return (
          <div className={baseClasses}>
            {children ? (
              <div className="flex items-center w-full">
                <div
                  className={cn(
                    'flex-1 border-t',
                    thickness === 'thin' ? 'border-t' : thickness === 'thick' ? 'border-t-2' : 'border-t'
                  )}
                  style={{
                    borderWidth: getThicknessValue()
                  }}
                />
                <div className="px-4 text-sm font-medium bg-background">
                  {children}
                </div>
                <div
                  className={cn(
                    'flex-1 border-t',
                    thickness === 'thin' ? 'border-t' : thickness === 'thick' ? 'border-t-2' : 'border-t'
                  )}
                  style={{
                    borderWidth: getThicknessValue()
                  }}
                />
              </div>
            ) : (
              <div
                className={cn(
                  'w-full border-t',
                  thickness === 'thin' ? 'border-t' : thickness === 'thick' ? 'border-t-2' : 'border-t'
                )}
                style={{
                  borderWidth: getThicknessValue(),
                  transform: animated && isVisible ? 'scaleX(1)' : animated ? 'scaleX(0)' : 'scaleX(1)',
                  transition: animated ? 'transform 1s ease-out' : undefined
                }}
              />
            )}
          </div>
        );
    }
  };

  return (
    <div ref={dividerRef}>
      {renderDivider()}
    </div>
  );
}