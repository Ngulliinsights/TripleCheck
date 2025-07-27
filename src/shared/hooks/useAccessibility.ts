import { useCallback, useRef } from 'react';

interface UseAccessibilityReturn {
  trapFocus: (element: HTMLElement) => () => void;
  announceLiveRegion: (message: string, priority?: 'polite' | 'assertive') => void;
}

export function useAccessibility(): UseAccessibilityReturn {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  // Create or get live region for screen reader announcements
  const getLiveRegion = useCallback(() => {
    if (!liveRegionRef.current) {
      liveRegionRef.current = document.createElement('div');
      liveRegionRef.current.setAttribute('aria-live', 'polite');
      liveRegionRef.current.setAttribute('aria-atomic', 'true');
      liveRegionRef.current.className = 'sr-only';
      liveRegionRef.current.style.position = 'absolute';
      liveRegionRef.current.style.left = '-10000px';
      liveRegionRef.current.style.width = '1px';
      liveRegionRef.current.style.height = '1px';
      liveRegionRef.current.style.overflow = 'hidden';
      document.body.appendChild(liveRegionRef.current);
    }
    return liveRegionRef.current;
  }, []);

  // Announce message to screen readers
  const announceLiveRegion = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = getLiveRegion();
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }, [getLiveRegion]);

  // Trap focus within an element
  const trapFocus = useCallback((element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    };

    // Focus first element
    firstFocusable?.focus();

    // Add event listener
    element.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return {
    trapFocus,
    announceLiveRegion,
  };
}