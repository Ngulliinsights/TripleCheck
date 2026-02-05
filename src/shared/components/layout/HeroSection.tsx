import React, { useEffect, useRef, useState } from 'react'

import { cn } from '@/shared/lib/utils'

interface HeroSectionProps {
  backgroundImage?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  parallaxIntensity?: number;
  overlayOpacity?: number;
  minHeight?: string;
}

export function HeroSection({
  backgroundImage,
  title,
  subtitle,
  children,
  className,
  parallaxIntensity = 0.5,
  overlayOpacity = 0.4,
  minHeight = '100vh'
}: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * -parallaxIntensity;
        
        if (rect.bottom >= 0) {
          setScrollY(rate);
        }
      }
    };

    // Throttle scroll events for performance
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
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [parallaxIntensity]);

  return (
    <section
      ref={heroRef}
      className={cn(
        'relative overflow-hidden flex items-center justify-center',
        className
      )}
      style={{ minHeight }}
    >
      {/* Background Image with Parallax */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            transform: `translateY(${scrollY}px)`,
            scale: '1.1' // Slight scale to prevent gaps during parallax
          }}
        />
      )}

      {/* Dynamic Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60 transition-opacity duration-300"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-fluid-4xl font-bold leading-tight tracking-tight">
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-fluid-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
          
          {children && (
            <div className="mt-8">
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}