import { useState, useCallback, useRef, useEffect } from "react";

export interface UsePropertyCardStateOptions {
  /** Whether to enable hover state tracking */
  enableHover?: boolean;
  /** Whether to enable focus state tracking */
  enableFocus?: boolean;
  /** Whether to enable keyboard navigation */
  enableKeyboard?: boolean;
  /** Callback for analytics tracking */
  onStateChange?: (state: 'hover' | 'focus' | 'blur', value: boolean) => void;
}

export interface UsePropertyCardStateReturn {
  /** Whether the card is currently hovered */
  isHovered: boolean;
  /** Whether the card is currently focused */
  isFocused: boolean;
  /** Whether the card is currently active (pressed) */
  isActive: boolean;
  /** Manually set hover state */
  setIsHovered: (hovered: boolean) => void;
  /** Mouse enter handler */
  handleMouseEnter: () => void;
  /** Mouse leave handler */
  handleMouseLeave: () => void;
  /** Mouse down handler */
  handleMouseDown: () => void;
  /** Mouse up handler */
  handleMouseUp: () => void;
  /** Focus handler */
  handleFocus: () => void;
  /** Blur handler */
  handleBlur: () => void;
  /** Enhanced keyboard handler with accessibility support */
  handleKeyDown: (event: React.KeyboardEvent, onClick?: () => void) => void;
  /** Ref to attach to the card element for focus management */
  cardRef: React.RefObject<HTMLElement>;
}

/**
 * Enhanced shared hook for managing property card UI state
 * Handles hover, focus, active states and keyboard interactions with accessibility support
 * Used by PropertyCard, EnhancedLandCard, and other interactive property components
 * 
 * @param options - Configuration options for state management
 * @returns State values and event handlers
 */
export function usePropertyCardState(
  options: UsePropertyCardStateOptions = {}
): UsePropertyCardStateReturn {
  const {
    enableHover = true,
    enableFocus = true,
    enableKeyboard = true,
    onStateChange,
  } = options;

  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (enableHover) {
      setIsHovered(true);
      onStateChange?.('hover', true);
    }
  }, [enableHover, onStateChange]);

  const handleMouseLeave = useCallback(() => {
    if (enableHover) {
      setIsHovered(false);
      setIsActive(false); // Reset active state when mouse leaves
      onStateChange?.('hover', false);
    }
  }, [enableHover, onStateChange]);

  const handleMouseDown = useCallback(() => {
    setIsActive(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleFocus = useCallback(() => {
    if (enableFocus) {
      setIsFocused(true);
      onStateChange?.('focus', true);
    }
  }, [enableFocus, onStateChange]);

  const handleBlur = useCallback(() => {
    if (enableFocus) {
      setIsFocused(false);
      setIsActive(false); // Reset active state when focus is lost
      onStateChange?.('blur', false);
    }
  }, [enableFocus, onStateChange]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, onClick?: () => void) => {
      if (!enableKeyboard || !onClick) return;

      switch (event.key) {
        case "Enter":
        case " ": // Space key
          event.preventDefault();
          setIsActive(true);
          onClick();
          
          // Reset active state after a short delay
          setTimeout(() => setIsActive(false), 150);
          break;
        case "Escape":
          // Remove focus from the card
          if (cardRef.current) {
            cardRef.current.blur();
          }
          break;
        default:
          break;
      }
    },
    [enableKeyboard]
  );

  // Handle global mouse up to reset active state
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsActive(false);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // Manual setter with analytics
  const setIsHoveredWithAnalytics = useCallback((hovered: boolean) => {
    setIsHovered(hovered);
    onStateChange?.('hover', hovered);
  }, [onStateChange]);

  return {
    isHovered,
    isFocused,
    isActive,
    setIsHovered: setIsHoveredWithAnalytics,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseDown,
    handleMouseUp,
    handleFocus,
    handleBlur,
    handleKeyDown,
    cardRef,
  };
}

export default usePropertyCardState;