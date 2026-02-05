import React from "react"
import { cn } from "../../lib/utils"

interface LogoProps {
  readonly className?: string;
  readonly size?: "sm" | "md" | "lg" | "xl";
  readonly variant?: "default" | "light" | "dark";
  readonly interactive?: boolean;
  readonly priority?: boolean;
  readonly onClick?: () => void;
  readonly href?: string;
  readonly logoSrc?: string;
  readonly alt?: string;
}

// Type-safe size and variant mappings with const assertions
const SIZE_CLASSES = {
  sm: "h-6 w-auto",
  md: "h-8 w-auto",
  lg: "h-10 w-auto",
  xl: "h-12 w-auto",
} as const;

const VARIANT_FILTERS = {
  default: "",
  light: "brightness-0 invert brightness-110",
  dark: "brightness-90 contrast-110 saturate-105",
} as const;

// Interactive state classes for enhanced user feedback
const INTERACTIVE_CLASSES = [
  "cursor-pointer",
  "hover:scale-105 hover:brightness-110",
  "active:scale-95 active:transition-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:rounded-sm",
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
  // Optimized click handler with proper event typing
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (onClick) {
        e.preventDefault();
        onClick();
        return;
      }

      if (interactive && href) {
        // For external links, handle navigation
        if (
          href.startsWith("http") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:")
        ) {
          e.preventDefault();
          window.location.href = href;
        }
        // For internal links, let default behavior or router handle it
      }
    },
    [onClick, interactive, href]
  );

  // Keyboard accessibility handler
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLImageElement>) => {
      if (!interactive) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        handleClick(e as unknown as React.MouseEvent<HTMLImageElement>);
      }
    },
    [interactive, handleClick]
  );

  // Error handler for failed image loads
  const handleError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.currentTarget;
      target.style.opacity = "0";

      if (import.meta.env.DEV) {
        console.warn(`Logo image failed to load: ${logoSrc}`);
      }
    },
    [logoSrc]
  );

  // Optimized className computation - direct lookup instead of switch
  const computedClassName = React.useMemo(
    () =>
      cn(
        SIZE_CLASSES[size],
        "select-none object-contain",
        VARIANT_FILTERS[variant],
        interactive && INTERACTIVE_CLASSES,
        className
      ),
    [size, variant, interactive, className]
  );

  // Dynamic aria-label for better context
  const ariaLabel = React.useMemo(() => {
    if (!interactive) return alt;
    if (href === "/") return `${alt} - Navigate to home page`;
    return `${alt} - Navigate to ${href}`;
  }, [interactive, alt, href]);

  // Memoized interactive props
  const interactiveProps = React.useMemo(
    () =>
      interactive
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": ariaLabel,
            onClick: handleClick,
            onKeyDown: handleKeyDown,
          }
        : {},
    [interactive, ariaLabel, handleClick, handleKeyDown]
  );

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={computedClassName}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      onError={handleError}
      {...interactiveProps}
    />
  );
}

Logo.displayName = "Logo";