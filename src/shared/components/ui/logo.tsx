import React from "react";

import { cn } from "../../lib/utils";

// Styles are now consolidated in design-system.css

interface LogoProps {
  readonly className?: string;
  readonly size?: "sm" | "md" | "lg" | "xl";
  readonly variant?: "default" | "light" | "dark";
  readonly interactive?: boolean;
  readonly priority?: boolean;
  readonly onClick?: () => void;
  readonly href?: string;
  readonly logoSrc?: string; // Allow custom logo source
  readonly alt?: string; // Allow custom alt text
}

// Using const assertions for better TypeScript inference and immutability
const SIZE_CLASSES = {
  sm: "h-6 w-auto",
  md: "h-8 w-auto",
  lg: "h-10 w-auto",
  xl: "h-12 w-auto",
} as const;

// Optimized filter combinations with more semantic naming for better readability
const VARIANT_FILTERS = {
  // Default state - no modifications to preserve original logo appearance
  default: "",
  // Light variant - creates white/light version optimized for dark backgrounds
  // Uses invert + brightness adjustment for clean white conversion
  light: "brightness-0 invert brightness-110",
  // Dark variant - enhances contrast and depth for light backgrounds
  // Subtle adjustments to maintain logo integrity while improving visibility
  dark: "brightness-90 contrast-110 saturate-105",
} as const;

// Enhanced interactive state classes for better visual feedback
const INTERACTIVE_CLASSES = [
  "cursor-pointer",
  // Smooth hover effects with subtle scale and brightness changes
  "hover:scale-105 hover:brightness-110",
  // Gentle press feedback for better user experience
  "active:scale-95 active:transition-none",
  // Accessible focus states with proper ring styling
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:rounded-sm",
  // Optimized transition timing for natural feel
  "transition-all duration-200 ease-out",
] as const;

export function Logo({
  className,
  size = "md",
  variant = "default",
  interactive = true,
  priority = false,
  onClick,
  href = "/",
  logoSrc = "/assets/Artmark.svg",
  alt = "Artmark Logo",
}: LogoProps) {
  // Optimized click handler with dependency array refinement
  // Only recreates when actual dependencies change, not on every render
  const handleClick = React.useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }

    // Simple navigation - let React Router handle SPA navigation if present
    if (interactive && href) {
      try {
        // For external links or when no router is present, use standard navigation
        if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
          window.location.href = href;
        } else {
          // For internal links, use standard navigation and let React Router intercept if present
          window.location.href = href;
        }
      } catch (error) {
        // Fallback to standard navigation
        window.location.href = href;
      }
    }
  }, [onClick, interactive, href]);

  // Enhanced keyboard handler with better event management
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLImageElement>) => {
      // Only handle interaction when component is actually interactive
      if (!interactive) return;

      // Support both Enter and Space for accessibility standards
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        handleClick();
      }
    },
    [interactive, handleClick]
  );

  // Memoize the computed className to prevent unnecessary recalculations
  // This is especially beneficial when the component re-renders frequently
  const computedClassName = React.useMemo(() => {
    const sizeClass = (() => {
      switch (size) {
        case "sm": return SIZE_CLASSES.sm;
        case "md": return SIZE_CLASSES.md;
        case "lg": return SIZE_CLASSES.lg;
        case "xl": return SIZE_CLASSES.xl;
        default: return SIZE_CLASSES.md;
      }
    })();
    
    const variantFilter = (() => {
      switch (variant) {
        case "default": return VARIANT_FILTERS.default;
        case "light": return VARIANT_FILTERS.light;
        case "dark": return VARIANT_FILTERS.dark;
        default: return VARIANT_FILTERS.default;
      }
    })();

    return cn(
      // Core sizing with consistent aspect ratio handling
      sizeClass,

      // Base styles optimized for crisp SVG rendering
      "select-none object-contain",

      // Apply variant-specific visual treatments
      variantFilter,

      // Conditional interactive styling with performance consideration
      interactive && INTERACTIVE_CLASSES,

      // Custom className override capability
      className
    );
  }, [size, variant, interactive, className]);

  // Memoize interactive props object to prevent unnecessary re-renders
  // This optimization helps when Logo is used in frequently updating components
  const interactiveProps = React.useMemo(
    () =>
      interactive ?
        {
          role: "button",
          tabIndex: 0,
          "aria-label": `Artmark Logo${href ? " - Navigate to home page" : ""}`,
          onClick: handleClick,
          onKeyDown: handleKeyDown,
          // Enhanced ARIA attributes for better screen reader support
          "aria-pressed": false,
          "aria-describedby": href ? "logo-navigation-hint" : undefined,
        }
      : {},
    [interactive, href, handleClick, handleKeyDown]
  );

  return (
    <>
      <img
        src={logoSrc}
        alt={alt}
        className={cn(computedClassName, "logo-image")}
        loading={priority ? "eager" : "lazy"}
        // Enhanced accessibility and interaction handling
        {...interactiveProps}
        // Prevent dragging for better UX
        draggable={false}
        // Add error handling for missing images
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          // Simple fallback - hide the broken image
          target.style.display = "none";
          // Log error in development
          if (process.env.NODE_ENV === "development") {
            console.warn(`Logo image failed to load: ${logoSrc}`);
          }
        }}
      />

      {/* Hidden accessibility helper for screen readers when interactive */}
      {interactive && href && (
        <span id="logo-navigation-hint" className="sr-only" aria-hidden="true">
          Press Enter or Space to navigate to {href}
        </span>
      )}
    </>
  );
}
