import React from "react";

import { cn } from "../../lib/utils";

// Define size type more explicitly for better TypeScript inference
type WordmarkSize = "sm" | "md" | "lg" | "xl";
type WordmarkVariant = "default" | "light" | "dark" | "gradient";

// Make props interfaces readonly to satisfy ESLint rules
interface WordmarkProps {
  readonly size?: WordmarkSize;
  readonly variant?: WordmarkVariant;
  readonly className?: string;
  readonly animated?: boolean;
  readonly interactive?: boolean;
  readonly onClick?: () => void;
  readonly href?: string;
}

// Extract common constants to satisfy ESLint rule sonarjs/no-duplicate-string
const TRANSITION_ALL_DURATION_300 = "transition-all duration-300";
const SECONDARY_COLOR = "text-secondary";
const BG_SECONDARY = "bg-secondary";

// Extract style configurations into constants for better maintainability
const SIZE_CLASSES: Record<WordmarkSize, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
} as const;

// Define the variant styles structure more explicitly
interface VariantStyle {
  triple: string;
  check: string;
  pulse: string;
}

const VARIANT_STYLES: Record<WordmarkVariant, VariantStyle> = {
  default: {
    triple: "text-foreground",
    check: SECONDARY_COLOR,
    pulse: BG_SECONDARY,
  },
  light: {
    triple: "text-white",
    check: "text-teal-400",
    pulse: "bg-teal-400",
  },
  dark: {
    triple: "text-gray-900",
    check: SECONDARY_COLOR,
    pulse: BG_SECONDARY,
  },
  gradient: {
    triple:
      "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent",
    check:
      "bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent",
    pulse: "bg-gradient-to-r from-secondary to-secondary/80",
  },
} as const;

// Extract pulse size mapping for consistency across components
const PULSE_SIZE_CLASSES: Record<WordmarkSize, string> = {
  sm: "w-1 h-1",
  md: "w-1.5 h-1.5",
  lg: "w-2 h-2",
  xl: "w-2.5 h-2.5",
} as const;

// Type-safe helper function for simple string mappings
function getStringValue<K extends string>(
  obj: Record<K, string>,
  key: K
): string {
  return obj[key];
}

// Type-safe helper function for variant styles
function getVariantStyle(variant: WordmarkVariant): VariantStyle {
  return VARIANT_STYLES[variant];
}

export function Wordmark({
  size = "md",
  variant = "default",
  className,
  animated = true,
  interactive = false,
  onClick,
  href = "/",
}: WordmarkProps) {
  // Get styles using type-safe accessors
  const styles = getVariantStyle(variant);
  const sizeClass = getStringValue(SIZE_CLASSES, size);
  const pulseSize = getStringValue(PULSE_SIZE_CLASSES, size);

  // Memoize click handler to prevent unnecessary re-renders
  const handleClick = React.useCallback(() => {
    if (onClick) {
      onClick();
    } else if (interactive && href) {
      window.location.href = href;
    }
  }, [onClick, interactive, href]);

  // Memoize keyboard handler for better performance
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (interactive && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        handleClick();
      }
    },
    [interactive, handleClick]
  );

  return (
    <div
      className={cn(
        // Base styles that always apply
        "font-bold tracking-tight select-none transition-all duration-200",
        // Size-specific text class
        sizeClass,
        // Interactive styles only when needed
        interactive && "cursor-pointer hover:scale-105 active:scale-95",
        // Custom className last for proper override capability
        className
      )}
      // Conditional props to avoid unnecessary DOM attributes
      {...(interactive && {
        role: "button",
        tabIndex: 0,
        "aria-label": "TripleCheck - Go to Home",
        onClick: handleClick,
        onKeyDown: handleKeyDown,
      })}
    >
      <span
        className={cn(
          "font-extrabold",
          TRANSITION_ALL_DURATION_300,
          styles.triple
        )}
      >
        Triple
      </span>
      <span
        className={cn(
          "font-medium relative ml-0.5",
          TRANSITION_ALL_DURATION_300,
          styles.check
        )}
      >
        Check
        {/* Render pulse indicator only when animated */}
        {animated && (
          <span
            className={cn(
              "absolute -top-1 -right-1 rounded-full",
              TRANSITION_ALL_DURATION_300,
              pulseSize,
              "animate-pulse",
              styles.pulse
            )}
            aria-hidden="true" // Hide from screen readers as it's decorative
          />
        )}
      </span>
    </div>
  );
}

// Enhanced wordmark with verification checkmarks
export function WordmarkWithChecks({
  size = "md",
  variant = "default",
  className,
}: {
  readonly size?: WordmarkSize;
  readonly variant?: WordmarkVariant;
  readonly className?: string;
}) {
  // Define check sizes consistently with pulse sizes
  const CHECK_SIZE_CLASSES: Record<WordmarkSize, string> = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  } as const;

  const ICON_SIZE_CLASSES: Record<WordmarkSize, string> = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  } as const;

  // Define CSS classes for staggered animation delays
  const ANIMATION_DELAY_CLASSES = [
    "[animation-delay:0s]",
    "[animation-delay:0.2s]",
    "[animation-delay:0.4s]",
  ] as const;

  // Safe accessors for object properties
  const sizeClass = getStringValue(SIZE_CLASSES, size);
  const checkSizeClass = getStringValue(CHECK_SIZE_CLASSES, size);
  const iconSizeClass = getStringValue(ICON_SIZE_CLASSES, size);

  // Memoize the checkmark array to prevent recreation on each render
  const checkmarks = React.useMemo(
    () => Array.from({ length: 3 }, (_, i) => i),
    []
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2 font-bold tracking-tight select-none",
        sizeClass,
        className
      )}
    >
      {/* Triple verification checkmarks */}
      <div className="flex items-center gap-0.5">
        {checkmarks.map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-secondary flex items-center justify-center",
              TRANSITION_ALL_DURATION_300,
              checkSizeClass,
              "animate-pulse",
              // Safe array access for animation delays
              ANIMATION_DELAY_CLASSES[i] || "[animation-delay:0s]"
            )}
            aria-hidden="true" // Decorative checkmarks
          >
            <svg
              className={cn("text-secondary-foreground", iconSizeClass)}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        ))}
      </div>

      {/* Pass through props while disabling animation to avoid double animation */}
      <Wordmark size={size} variant={variant} animated={false} />
    </div>
  );
}

// Compact wordmark for tight spaces
export function WordmarkCompact({
  size = "md",
  variant = "default",
  className,
}: {
  readonly size?: WordmarkSize;
  readonly variant?: WordmarkVariant;
  readonly className?: string;
}) {
  // Create more consistent size mapping for compact version
  const COMPACT_SIZE_CLASSES: Record<WordmarkSize, string> = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  } as const;

  // Apply variant-specific styling to the checkmark for consistency
  const VARIANT_CHECKMARK_CLASSES: Record<WordmarkVariant, string> = {
    default: SECONDARY_COLOR,
    light: "text-teal-400",
    dark: SECONDARY_COLOR,
    gradient:
      "bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent",
  } as const;

  // Safe accessors for object properties
  const compactSizeClass = getStringValue(COMPACT_SIZE_CLASSES, size);
  const checkmarkClass = getStringValue(VARIANT_CHECKMARK_CLASSES, variant);

  return (
    <div
      className={cn(
        "font-bold tracking-tighter select-none",
        compactSizeClass,
        className
      )}
    >
      <span className="font-extrabold">3</span>
      <span
        className={cn("font-medium", checkmarkClass)}
        aria-label="Check mark"
      >
        ✓
      </span>
    </div>
  );
}
