"use strict";
/**
 * Accessibility Hook for Enhanced User Experience
 *
 * This is the consolidated accessibility hook that replaces the basic useAccessibility.ts
 *
 * This hook provides comprehensive accessibility features including:
 * - Keyboard navigation management
 * - Focus management
 * - Screen reader announcements
 * - Reduced motion preferences
 * - High contrast mode detection
 * - Enhanced keyboard navigation helpers
 * - Skip link component
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAccessibility = useAccessibility;
exports.useKeyboardNavigation = useKeyboardNavigation;
exports.SkipLink = SkipLink;
var react_1 = require("react");
function useAccessibility() {
    var _a = (0, react_1.useState)({
        prefersReducedMotion: false,
        prefersHighContrast: false,
        prefersLargeText: false,
        keyboardNavigation: false
    }), preferences = _a[0], setPreferences = _a[1];
    var liveRegionRef = (0, react_1.useRef)(null);
    var lastFocusedElementRef = (0, react_1.useRef)(null);
    // Detect user preferences
    (0, react_1.useEffect)(function () {
        var updatePreferences = function () {
            setPreferences({
                prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
                prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
                prefersLargeText: window.matchMedia('(min-resolution: 2dppx)').matches,
                keyboardNavigation: false // Will be updated on keyboard use
            });
        };
        updatePreferences();
        // Listen for preference changes
        var mediaQueries = [
            window.matchMedia('(prefers-reduced-motion: reduce)'),
            window.matchMedia('(prefers-contrast: high)'),
            window.matchMedia('(min-resolution: 2dppx)')
        ];
        mediaQueries.forEach(function (mq) { return mq.addEventListener('change', updatePreferences); });
        return function () {
            mediaQueries.forEach(function (mq) { return mq.removeEventListener('change', updatePreferences); });
        };
    }, []);
    // Detect keyboard navigation
    (0, react_1.useEffect)(function () {
        var handleKeyDown = function (e) {
            if (e.key === 'Tab') {
                setPreferences(function (prev) { return (__assign(__assign({}, prev), { keyboardNavigation: true })); });
            }
        };
        var handleMouseDown = function () {
            setPreferences(function (prev) { return (__assign(__assign({}, prev), { keyboardNavigation: false })); });
        };
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleMouseDown);
        return function () {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);
    // Create live region for screen reader announcements
    (0, react_1.useEffect)(function () {
        if (!liveRegionRef.current) {
            var liveRegion = document.createElement('div');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            liveRegion.style.cssText = "\n        position: absolute;\n        width: 1px;\n        height: 1px;\n        padding: 0;\n        margin: -1px;\n        overflow: hidden;\n        clip: rect(0, 0, 0, 0);\n        white-space: nowrap;\n        border: 0;\n      ";
            document.body.appendChild(liveRegion);
            liveRegionRef.current = liveRegion;
        }
        return function () {
            if (liveRegionRef.current) {
                document.body.removeChild(liveRegionRef.current);
                liveRegionRef.current = null;
            }
        };
    }, []);
    // Focus trap implementation
    var trapFocus = (0, react_1.useCallback)(function (container) {
        var focusableElements = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        var firstElement = focusableElements[0];
        var lastElement = focusableElements[focusableElements.length - 1];
        var handleTabKey = function (e) {
            if (e.key !== 'Tab')
                return;
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            }
            else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };
        var handleEscapeKey = function (e) {
            if (e.key === 'Escape') {
                restoreFocus(lastFocusedElementRef.current);
            }
        };
        // Store the currently focused element
        lastFocusedElementRef.current = document.activeElement;
        // Focus the first element
        if (firstElement) {
            firstElement.focus();
        }
        container.addEventListener('keydown', handleTabKey);
        container.addEventListener('keydown', handleEscapeKey);
        return function () {
            container.removeEventListener('keydown', handleTabKey);
            container.removeEventListener('keydown', handleEscapeKey);
        };
    }, []);
    // Focus restoration
    var restoreFocus = (0, react_1.useCallback)(function (element) {
        if (element && element.focus) {
            element.focus();
        }
    }, []);
    // Live region announcements
    var announceLiveRegion = (0, react_1.useCallback)(function (message, priority) {
        if (priority === void 0) { priority = 'polite'; }
        if (liveRegionRef.current) {
            liveRegionRef.current.setAttribute('aria-live', priority);
            liveRegionRef.current.textContent = message;
            // Clear the message after announcement
            setTimeout(function () {
                if (liveRegionRef.current) {
                    liveRegionRef.current.textContent = '';
                }
            }, 1000);
        }
    }, []);
    return __assign(__assign({}, preferences), { trapFocus: trapFocus, restoreFocus: restoreFocus, announceLiveRegion: announceLiveRegion });
}
// Keyboard navigation helper hook
function useKeyboardNavigation(onEnter, onEscape, onArrowKeys) {
    (0, react_1.useEffect)(function () {
        var handleKeyDown = function (e) {
            switch (e.key) {
                case 'Enter':
                case ' ':
                    if (onEnter) {
                        e.preventDefault();
                        onEnter();
                    }
                    break;
                case 'Escape':
                    if (onEscape) {
                        e.preventDefault();
                        onEscape();
                    }
                    break;
                case 'ArrowUp':
                    if (onArrowKeys) {
                        e.preventDefault();
                        onArrowKeys('up');
                    }
                    break;
                case 'ArrowDown':
                    if (onArrowKeys) {
                        e.preventDefault();
                        onArrowKeys('down');
                    }
                    break;
                case 'ArrowLeft':
                    if (onArrowKeys) {
                        e.preventDefault();
                        onArrowKeys('left');
                    }
                    break;
                case 'ArrowRight':
                    if (onArrowKeys) {
                        e.preventDefault();
                        onArrowKeys('right');
                    }
                    break;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return function () { return document.removeEventListener('keydown', handleKeyDown); };
    }, [onEnter, onEscape, onArrowKeys]);
}
// Skip link component for keyboard navigation
function SkipLink(_a) {
    var href = _a.href, children = _a.children;
    return (<a href={href} className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-md focus:shadow-lg">
      {children}
    </a>);
}
