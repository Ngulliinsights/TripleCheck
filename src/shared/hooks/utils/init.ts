/**
 * Initialization utilities for hook consolidation
 * This should be imported in the main app entry point during development
 */

import { checkDeprecatedHookUsage } from './deprecation'

/**
 * Initialize hook consolidation development helpers
 * Call this in your main app entry point (e.g., main.tsx or App.tsx)
 */
export function initHookConsolidation(): void {
  if (process.env.NODE_ENV === 'development') {
    // Check for deprecated hook usage on app start
    setTimeout(() => {
      checkDeprecatedHookUsage();
    }, 1000);

    // Add global helper for checking hook status
    if (typeof window !== 'undefined') {
      (window as any).__checkHookStatus = checkDeprecatedHookUsage;
      console.info('🔧 Hook consolidation helpers loaded. Run __checkHookStatus() to check deprecated hook usage.');
    }
  }
}

/**
 * Development-only hook to warn about usage in production
 */
export function useDevWarning(message: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`🚧 Development Warning: ${message}`);
  }
}