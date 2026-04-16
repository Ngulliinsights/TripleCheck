import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react"

import { cn } from "@/local/lib/utils"

// Define breakpoint values as constants for consistency and maintainability
const BREAKPOINT_VALUES = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// Type definitions for better TypeScript safety
type BreakpointKey = keyof typeof BREAKPOINT_VALUES;
type MaxWidthVariant = "sm" | "md" | "lg" | "xl" | "2xl" | "full";
type PaddingVariant = "none" | "sm" | "md" | "lg" | "xl";

interface ResponsiveTypography {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  "2xl"?: string;
}

interface LayoutContainerProps {
  readonly children: React.ReactNode;
  readonly maxWidth?: MaxWidthVariant;
  readonly padding?: PaddingVariant;
  readonly className?: string;
  readonly fluidTypography?: boolean;
  readonly responsiveTypography?: ResponsiveTypography;
  readonly centerContent?: boolean;
  // New prop for better semantic meaning
  readonly as?: keyof JSX.IntrinsicElements;
  // Enhanced accessibility
  readonly role?: string;
  readonly "aria-label"?: string;
}

export function LayoutContainer({
  children,
  maxWidth = "xl",
  padding = "md",
  className,
  fluidTypography = true,
  responsiveTypography,
  centerContent = false,
  as: Component = "div",
  role,
  "aria-label": ariaLabel,
}: LayoutContainerProps) {
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<BreakpointKey>("xl");

  // Memoized breakpoint detection function for performance
  const detectBreakpoint = useCallback((): BreakpointKey => {
    const width = window.innerWidth;

    // Use a more efficient approach by checking from largest to smallest
    if (width >= BREAKPOINT_VALUES["2xl"]) return "2xl";
    if (width >= BREAKPOINT_VALUES.xl) return "xl";
    if (width >= BREAKPOINT_VALUES.lg) return "lg";
    if (width >= BREAKPOINT_VALUES.md) return "md";
    return "sm";
  }, []);

  // Extract cleanup logic to reduce nesting
  const createCleanupHandler = useCallback(
    (
      rafId: React.MutableRefObject<number | undefined>,
      timeoutId: React.MutableRefObject<NodeJS.Timeout | undefined>
    ) => {
      return (): void => {
        if (typeof rafId.current !== "undefined") {
          window.cancelAnimationFrame(rafId.current);
        }
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }
      };
    },
    []
  );

  // Refs for resize handler
  const resizeRafId = useRef<number | undefined>();
  const resizeTimeoutId = useRef<NodeJS.Timeout | undefined>();

  // Extract the debounced update function to reduce nesting
  const executeDebouncedUpdate = useCallback(
    (onBreakpointChange: (bp: BreakpointKey) => void) => {
      onBreakpointChange(detectBreakpoint());
    },
    [detectBreakpoint]
  );

  // Extract the RAF callback to reduce nesting
  const executeRafCallback = useCallback(
    (onBreakpointChange: (bp: BreakpointKey) => void) => {
      resizeTimeoutId.current = setTimeout(() => {
        executeDebouncedUpdate(onBreakpointChange);
      }, 150);
    },
    [executeDebouncedUpdate]
  );

  // Extract resize logic to reduce nesting
  const createResizeHandler = useCallback(
    (onBreakpointChange: (bp: BreakpointKey) => void) => {
      const handleResize = (): void => {
        // Cancel any pending RAF or timeout
        if (typeof resizeRafId.current !== "undefined") {
          window.cancelAnimationFrame(resizeRafId.current);
          resizeRafId.current = undefined;
        }
        if (resizeTimeoutId.current) {
          clearTimeout(resizeTimeoutId.current);
          resizeTimeoutId.current = undefined;
        }

        // Use RAF for smoother updates during active resizing
        resizeRafId.current = window.requestAnimationFrame(() => {
          executeRafCallback(onBreakpointChange);
        });
      };

      const cleanup = createCleanupHandler(resizeRafId, resizeTimeoutId);
      return { handleResize, cleanup };
    },
    [executeRafCallback, createCleanupHandler]
  );

  useEffect(() => {
    // Initial breakpoint detection
    setCurrentBreakpoint(detectBreakpoint());

    // Create resize handler with separated concerns
    const { handleResize, cleanup } = createResizeHandler(setCurrentBreakpoint);

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      cleanup();
    };
  }, [detectBreakpoint, createResizeHandler]);

  // Memoized class generation with secure property access
  const maxWidthClass = useMemo((): string => {
    // Using type-safe property access to avoid security warnings
    const maxWidthMap = {
      sm: "max-w-sm", // ~384px
      md: "max-w-md", // ~448px
      lg: "max-w-4xl", // ~896px - Better for content readability
      xl: "max-w-6xl", // ~1152px
      "2xl": "max-w-7xl", // ~1280px
      full: "max-w-full",
    } as const;

    // Type-safe property access
    if (maxWidth in maxWidthMap) {
      return maxWidthMap[maxWidth as keyof typeof maxWidthMap];
    }
    return maxWidthMap.xl; // Safe fallback
  }, [maxWidth]);

  const paddingClass = useMemo((): string => {
    // Using type-safe property access to avoid security warnings
    const paddingMap = {
      none: "",
      // Improved responsive padding with better mobile experience
      sm: "px-3 py-2 sm:px-4 sm:py-3",
      md: "px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-6",
      lg: "px-6 py-4 sm:px-8 sm:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-10",
      xl: "px-8 py-6 sm:px-12 sm:py-8 lg:px-16 lg:py-12 xl:px-20 xl:py-16",
    } as const;

    // Type-safe property access
    if (padding in paddingMap) {
      return paddingMap[padding as keyof typeof paddingMap];
    }
    return paddingMap.md; // Safe fallback
  }, [padding]);

  // Enhanced fluid typography with better defaults and 2xl support
  const typographyStyles = useMemo(() => {
    if (!fluidTypography) return {};

    const defaultTypography: ResponsiveTypography = {
      sm: "0.875rem", // 14px
      md: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.375rem", // 22px
    };

    const typography = { ...defaultTypography, ...responsiveTypography };

    return {
      // More sophisticated fluid typography with better scaling
      fontSize: `clamp(${typography.sm}, 1.5vw + 0.5rem, ${typography["2xl"]})`,
      lineHeight: "clamp(1.4, 1.5, 1.7)",
    };
  }, [fluidTypography, responsiveTypography]);

  // Improved className composition with better organization
  const containerClasses = useMemo(() => {
    return cn(
      // Base layout classes
      "mx-auto w-full",
      // Responsive max-width
      maxWidthClass,
      // Responsive padding
      paddingClass,
      // Centering logic with improved flex properties
      centerContent && [
        "flex flex-col items-center justify-center",
        "min-h-[50vh]", // More reasonable minimum height
        "text-center", // Better text alignment for centered content
      ],
      // Custom classes last for proper override capability
      className
    );
  }, [maxWidthClass, paddingClass, centerContent, className]);

  return (
    <Component
      className={containerClasses}
      style={typographyStyles}
      data-breakpoint={currentBreakpoint}
      data-max-width={maxWidth}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </Component>
  );
}

// Enhanced breakpoint hook with additional utilities
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>("xl");

  // Memoized breakpoint detection
  const detectBreakpoint = useCallback((): BreakpointKey => {
    const width = window.innerWidth;

    if (width >= BREAKPOINT_VALUES["2xl"]) return "2xl";
    if (width >= BREAKPOINT_VALUES.xl) return "xl";
    if (width >= BREAKPOINT_VALUES.lg) return "lg";
    if (width >= BREAKPOINT_VALUES.md) return "md";
    return "sm";
  }, []);

  // Extract timeout callback to reduce nesting
  const executeTimeoutCallback = useCallback(
    (onBreakpointChange: (bp: BreakpointKey) => void) => {
      onBreakpointChange(detectBreakpoint());
    },
    [detectBreakpoint]
  );

  // Extract the RAF callback to reduce nesting in createResizeHandler
  const executeRafCallbackForHandler = useCallback(
    (
      onBreakpointChange: (bp: BreakpointKey) => void,
      timeoutIdRef: { current: NodeJS.Timeout | undefined }
    ) => {
      timeoutIdRef.current = setTimeout(() => {
        executeTimeoutCallback(onBreakpointChange);
      }, 150);
    },
    [executeTimeoutCallback]
  );

  // Extracted resize handler creation to avoid nesting issues
  const createResizeHandler = useCallback(
    (onBreakpointChange: (bp: BreakpointKey) => void) => {
      let rafId: number | undefined;
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutIdRef = { current: timeoutId };

      const handleResize = (): void => {
        if (typeof rafId !== "undefined") {
          window.cancelAnimationFrame(rafId);
          rafId = undefined;
        }
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = undefined;
        }

        rafId = window.requestAnimationFrame(() => {
          executeRafCallbackForHandler(onBreakpointChange, timeoutIdRef);
        });

        // Update the local variable to match the ref
        timeoutId = timeoutIdRef.current;
      };

      const cleanup = (): void => {
        if (typeof rafId !== "undefined") {
          window.cancelAnimationFrame(rafId);
        }
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
      };

      return { handleResize, cleanup };
    },
    [executeRafCallbackForHandler]
  );

  useEffect(() => {
    setBreakpoint(detectBreakpoint());

    const { handleResize, cleanup } = createResizeHandler(setBreakpoint);

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      cleanup();
    };
  }, [detectBreakpoint, createResizeHandler]);

  // Additional utility functions for enhanced developer experience
  const isBreakpoint = useCallback(
    (target: BreakpointKey): boolean => {
      return breakpoint === target;
    },
    [breakpoint]
  );

  const isBreakpointUp = useCallback(
    (target: BreakpointKey): boolean => {
      const breakpointOrder: BreakpointKey[] = ["sm", "md", "lg", "xl", "2xl"];
      const currentIndex = breakpointOrder.indexOf(breakpoint);
      const targetIndex = breakpointOrder.indexOf(target);
      return currentIndex >= targetIndex;
    },
    [breakpoint]
  );

  const isBreakpointDown = useCallback(
    (target: BreakpointKey): boolean => {
      const breakpointOrder: BreakpointKey[] = ["sm", "md", "lg", "xl", "2xl"];
      const currentIndex = breakpointOrder.indexOf(breakpoint);
      const targetIndex = breakpointOrder.indexOf(target);
      return currentIndex <= targetIndex;
    },
    [breakpoint]
  );

  return {
    breakpoint,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    // Convenience booleans for common checks
    isMobile: breakpoint === "sm",
    isTablet: breakpoint === "md",
    isDesktop: isBreakpointUp("lg"),
  };
}

// Export breakpoint values for use in other components
export { BREAKPOINT_VALUES };

// Type exports for better TypeScript integration
export type {
  BreakpointKey,
  MaxWidthVariant,
  PaddingVariant,
  ResponsiveTypography,
};
