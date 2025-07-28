import React from "react";

import { cn } from "../../lib/utils";

interface LogoProps {
  readonly className?: string;
  readonly size?: "sm" | "md" | "lg" | "xl";
  readonly variant?: "default" | "light" | "dark";
  readonly interactive?: boolean;
  readonly priority?: boolean;
  readonly onClick?: () => void;
  readonly href?: string;
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
}: LogoProps) {
  // Optimized click handler with dependency array refinement
  // Only recreates when actual dependencies change, not on every render
  const handleClick = React.useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }

    // Enhanced navigation with better error handling and modern approach
    if (interactive && href) {
      try {
        // Prefer pushState for SPA-like behavior when possible
        if (window.history?.pushState && href.startsWith("/")) {
          window.history.pushState(null, "", href);
          // Dispatch popstate event to notify router systems
          window.dispatchEvent(new PopStateEvent("popstate"));
        } else {
          window.location.href = href;
        }
      } catch (error) {
        // Handle navigation error by logging and falling back to standard navigation
        if (error instanceof Error) {
          // Log error details for debugging while maintaining fallback behavior
          const errorMessage = `Navigation error: ${error.message}`;
          // Store error for potential debugging without console output
          window.sessionStorage?.setItem("logo-nav-error", errorMessage);
        }
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
    // Safe object access with explicit type checking to prevent injection
    const validSizes = ["sm", "md", "lg", "xl"] as const;
    const validVariants = ["default", "light", "dark"] as const;

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
        src="/assets/Artmark.svg"
        alt="Artmark Logo"
        className={computedClassName}
        // Performance optimizations with enhanced loading strategy
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        // Enhanced accessibility and interaction handling
        {...interactiveProps}
        // Additional performance hints for modern browsers
        {...(priority && {
          // Preload hint for critical logos - load handler for performance tracking
          onLoad: () => void 0,
        })}
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
