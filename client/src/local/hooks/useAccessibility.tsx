// ============================================================
// FILE: useAccessibility.tsx
// ============================================================
/**
 * Accessibility Hook
 *
 * Provides keyboard navigation, focus management,
 * screen-reader announcements, and user-preference detection.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import React from 'react'

interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast:  boolean;
  prefersLargeText:     boolean;
  keyboardNavigation:   boolean;
}

interface FocusManagement {
  trapFocus:           (container: HTMLElement) => () => void;
  restoreFocus:        (element: HTMLElement | null) => void;
  announceLiveRegion:  (message: string, priority?: 'polite' | 'assertive') => void;
}

export function useAccessibility(): AccessibilityPreferences & FocusManagement {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    prefersReducedMotion: false,
    prefersHighContrast:  false,
    prefersLargeText:     false,
    keyboardNavigation:   false,
  });

  const liveRegionRef        = useRef<HTMLDivElement | null>(null);
  const savedFocusRef        = useRef<HTMLElement | null>(null);

  // Detect system preferences
  useEffect(() => {
    const mqs = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(min-resolution: 2dppx)'),
    ];

    const update = () =>
      setPreferences((prev) => ({
        ...prev,
        prefersReducedMotion: mqs[0]!.matches,
        prefersHighContrast:  mqs[1]!.matches,
        prefersLargeText:     mqs[2]!.matches,
      }));

    update();
    mqs.forEach((mq) => mq.addEventListener('change', update));
    return () => mqs.forEach((mq) => mq.removeEventListener('change', update));
  }, []);

  // Keyboard vs. pointer navigation detection
  useEffect(() => {
    const onKey   = (e: KeyboardEvent) => {
      if (e.key === 'Tab') setPreferences((p) => ({ ...p, keyboardNavigation: true }));
    };
    const onMouse = () => setPreferences((p) => ({ ...p, keyboardNavigation: false }));

    document.addEventListener('keydown',    onKey);
    document.addEventListener('mousedown',  onMouse);
    return () => {
      document.removeEventListener('keydown',   onKey);
      document.removeEventListener('mousedown', onMouse);
    };
  }, []);

  // Create visually-hidden ARIA live region
  useEffect(() => {
    const region = document.createElement('div');
    Object.assign(region, { 'aria-live': 'polite', 'aria-atomic': 'true' });
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    document.body.appendChild(region);
    liveRegionRef.current = region;

    return () => {
      document.body.removeChild(region);
      liveRegionRef.current = null;
    };
  }, []);

  const restoreFocus = useCallback((element: HTMLElement | null) => {
    element?.focus();
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusable = container.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    savedFocusRef.current = document.activeElement as HTMLElement;
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          last?.focus(); e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first?.focus(); e.preventDefault();
        }
      } else if (e.key === 'Escape') {
        restoreFocus(savedFocusRef.current);
      }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => container.removeEventListener('keydown', onKeyDown);
  }, [restoreFocus]);

  const announceLiveRegion = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const region = liveRegionRef.current;
      if (!region) return;
      region.setAttribute('aria-live', priority);
      region.textContent = message;
      setTimeout(() => { if (liveRegionRef.current) liveRegionRef.current.textContent = ''; }, 1_000);
    },
    [],
  );

  return { ...preferences, trapFocus, restoreFocus, announceLiveRegion };
}

/** Attach global keyboard shortcuts to a component. */
export function useKeyboardNavigation(
  onEnter?:    () => void,
  onEscape?:   () => void,
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          if (onEnter)     { e.preventDefault(); onEnter(); }     break;
        case 'Escape':
          if (onEscape)    { e.preventDefault(); onEscape(); }    break;
        case 'ArrowUp':
          if (onArrowKeys) { e.preventDefault(); onArrowKeys('up'); }    break;
        case 'ArrowDown':
          if (onArrowKeys) { e.preventDefault(); onArrowKeys('down'); }  break;
        case 'ArrowLeft':
          if (onArrowKeys) { e.preventDefault(); onArrowKeys('left'); }  break;
        case 'ArrowRight':
          if (onArrowKeys) { e.preventDefault(); onArrowKeys('right'); } break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onEnter, onEscape, onArrowKeys]);
}

/** Skip-link component for keyboard users. */
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50
                 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-md focus:shadow-lg"
    >
      {children}
    </a>
  );
}