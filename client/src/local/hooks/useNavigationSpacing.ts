/**
 * Navigation Spacing Hooks
 *
 * Utilities for components that need to account for the fixed navigation
 * bar's dynamic height as the user scrolls.
 */

import { useEffect, useState } from 'react'

const NAV_SCROLLED_HEIGHT  = 72;
const NAV_DEFAULT_HEIGHT   = 88;
const SCROLL_THRESHOLD     = 20;

export function useNavigationSpacing() {
  const [navHeight,  setNavHeight]  = useState(NAV_DEFAULT_HEIGHT);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY > SCROLL_THRESHOLD;
      const height   = scrolled ? NAV_SCROLLED_HEIGHT : NAV_DEFAULT_HEIGHT;
      setIsScrolled(scrolled);
      setNavHeight(height);
      document.documentElement.style.setProperty('--nav-height', `${height}px`);
    };

    update();

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { update(); ticking = false; });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return {
    navHeight,
    isScrolled,
    getTopSpacing:    (extra = 0)  => navHeight + extra,
    getScrollMargin:  (extra = 16) => navHeight + extra,
    navAwareSpacing:  'nav-aware-spacing',
    scrollMarginNav:  'scroll-margin-nav',
  };
}

/** Convenience hook for page-level containers that need top padding. */
export function usePageSpacing() {
  const { navHeight, isScrolled } = useNavigationSpacing();
  return {
    navHeight,
    isScrolled,
    pageStyle:     { paddingTop: `${navHeight}px` },
    pageClassName: 'nav-aware-spacing',
  };
}