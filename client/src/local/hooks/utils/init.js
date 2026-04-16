"use strict";
/**
 * Initialization utilities for hook consolidation
 * This should be imported in the main app entry point during development
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initHookConsolidation = initHookConsolidation;
exports.useDevWarning = useDevWarning;
var deprecation_1 = require("./deprecation");
/**
 * Initialize hook consolidation development helpers
 * Call this in your main app entry point (e.g., main.tsx or App.tsx)
 */
function initHookConsolidation() {
    if (process.env.NODE_ENV === 'development') {
        // Check for deprecated hook usage on app start
        setTimeout(function () {
            (0, deprecation_1.checkDeprecatedHookUsage)();
        }, 1000);
        // Add global helper for checking hook status
        if (typeof window !== 'undefined') {
            window.__checkHookStatus = deprecation_1.checkDeprecatedHookUsage;
            console.info('🔧 Hook consolidation helpers loaded. Run __checkHookStatus() to check deprecated hook usage.');
        }
    }
}
/**
 * Development-only hook to warn about usage in production
 */
function useDevWarning(message) {
    if (process.env.NODE_ENV === 'development') {
        console.warn("\uD83D\uDEA7 Development Warning: ".concat(message));
    }
}
