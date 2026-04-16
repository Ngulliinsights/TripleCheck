"use strict";
/**
 * NavbarSpacer Component
 *
 * Provides consistent spacing to prevent fixed navbar overlap with page content.
 * Automatically adjusts based on navbar height and scroll state.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavbarSpacer = NavbarSpacer;
exports.useNavbarHeight = useNavbarHeight;
var react_1 = require("react");
var utils_1 = require("@/local/lib/utils");
/**
 * NavbarSpacer component that provides consistent top spacing for page content
 * to prevent overlap with the fixed navigation bar.
 *
 * @param variant - Controls the amount of spacing:
 *   - 'default': Standard spacing for regular pages
 *   - 'hero': Larger spacing for hero sections
 *   - 'minimal': Minimal spacing for compact layouts
 */
function NavbarSpacer(_a) {
    var className = _a.className, _b = _a.variant, variant = _b === void 0 ? 'default' : _b;
    var spacingClasses = {
        default: 'h-20 md:h-24', // Standard navbar height + some breathing room
        hero: 'h-16 md:h-20', // Less spacing for hero sections that want to be closer to navbar
        minimal: 'h-16', // Minimal spacing for compact layouts
    };
    return (<div className={(0, utils_1.cn)('w-full flex-shrink-0', spacingClasses[variant], className)} aria-hidden="true" role="presentation"/>);
}
/**
 * Hook to get the current navbar height for dynamic calculations
 */
function useNavbarHeight() {
    var _a = react_1.default.useState(80), navbarHeight = _a[0], setNavbarHeight = _a[1]; // Default height
    react_1.default.useEffect(function () {
        var updateNavbarHeight = function () {
            // Get the CSS custom property set by the Navigation component
            var height = getComputedStyle(document.documentElement)
                .getPropertyValue('--nav-height')
                .trim();
            if (height) {
                setNavbarHeight(parseInt(height, 10));
            }
        };
        // Initial check
        updateNavbarHeight();
        // Listen for changes (when user scrolls and navbar height changes)
        var observer = new MutationObserver(updateNavbarHeight);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
        });
        return function () { return observer.disconnect(); };
    }, []);
    return navbarHeight;
}
