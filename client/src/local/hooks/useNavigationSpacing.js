"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNavigationSpacing = useNavigationSpacing;
exports.usePageSpacing = usePageSpacing;
var react_1 = require("react");
/**
 * Hook for managing navigation-aware spacing
 *
 * This hook provides utilities for components that need to account for
 * the fixed navigation bar's dynamic height changes during scroll.
 */
function useNavigationSpacing() {
    var _a = (0, react_1.useState)(88), navHeight = _a[0], setNavHeight = _a[1]; // Default height
    var _b = (0, react_1.useState)(false), isScrolled = _b[0], setIsScrolled = _b[1];
    (0, react_1.useEffect)(function () {
        var updateNavHeight = function () {
            var scrollTop = window.scrollY;
            var scrolled = scrollTop > 20;
            var height = scrolled ? 72 : 88; // Matches Navigation component logic
            setIsScrolled(scrolled);
            setNavHeight(height);
            // Update CSS custom property
            document.documentElement.style.setProperty('--nav-height', "".concat(height, "px"));
        };
        // Initial setup
        updateNavHeight();
        // Listen for scroll events
        var ticking = false;
        var handleScroll = function () {
            if (!ticking) {
                requestAnimationFrame(function () {
                    updateNavHeight();
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return function () {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
    return {
        navHeight: navHeight,
        isScrolled: isScrolled,
        // Utility functions for common spacing needs
        getTopSpacing: function (additionalSpacing) {
            if (additionalSpacing === void 0) { additionalSpacing = 0; }
            return navHeight + additionalSpacing;
        },
        getScrollMargin: function (additionalMargin) {
            if (additionalMargin === void 0) { additionalMargin = 16; }
            return navHeight + additionalMargin;
        },
        // CSS class names for common patterns
        navAwareSpacing: 'nav-aware-spacing',
        scrollMarginNav: 'scroll-margin-nav',
    };
}
/**
 * Hook specifically for page components that need top padding
 */
function usePageSpacing() {
    var _a = useNavigationSpacing(), navHeight = _a.navHeight, isScrolled = _a.isScrolled;
    return {
        navHeight: navHeight,
        isScrolled: isScrolled,
        // Dynamic padding-top style for page containers
        pageStyle: {
            paddingTop: "".concat(navHeight, "px"),
        },
        // Class name for pages that prefer CSS approach
        pageClassName: 'nav-aware-spacing',
    };
}
