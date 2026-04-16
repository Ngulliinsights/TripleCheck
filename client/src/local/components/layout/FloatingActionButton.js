"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloatingActionButton = FloatingActionButton;
var react_1 = require("react");
var utils_1 = require("@/local/lib/utils");
// Constants to avoid duplicate strings
var DEFAULT_POSITION = 'bottom-right';
function FloatingActionButton(_a) {
    var children = _a.children, onClick = _a.onClick, _b = _a.position, position = _b === void 0 ? DEFAULT_POSITION : _b, _c = _a.offset, offset = _c === void 0 ? { x: 24, y: 24 } : _c, className = _a.className, _d = _a.variant, variant = _d === void 0 ? 'primary' : _d, _e = _a.size, size = _e === void 0 ? 'md' : _e, tooltip = _a.tooltip, _f = _a.hideOnScroll, hideOnScroll = _f === void 0 ? false : _f, _g = _a.showAfterScroll, showAfterScroll = _g === void 0 ? 100 : _g, _h = _a.disabled, disabled = _h === void 0 ? false : _h, ariaLabel = _a["aria-label"];
    var _j = (0, react_1.useState)(!hideOnScroll), isVisible = _j[0], setIsVisible = _j[1];
    var _k = (0, react_1.useState)(false), isHovered = _k[0], setIsHovered = _k[1];
    // Use ref to track if component is mounted to prevent memory leaks
    var mountedRef = (0, react_1.useRef)(true);
    // Memoize scroll handler to prevent unnecessary re-renders
    var handleScroll = (0, react_1.useCallback)(function () {
        if (!mountedRef.current)
            return;
        var scrolled = window.scrollY; // Use scrollY instead of deprecated pageYOffset
        if (hideOnScroll) {
            // Hide when scrolling down past threshold
            setIsVisible(scrolled < 50);
        }
        else {
            // Show after scrolling past specified amount
            setIsVisible(scrolled > showAfterScroll);
        }
    }, [hideOnScroll, showAfterScroll]);
    // Optimized throttled scroll handler using requestAnimationFrame
    var throttledScrollHandler = (0, react_1.useMemo)(function () {
        var ticking = false;
        return function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };
    }, [handleScroll]);
    (0, react_1.useEffect)(function () {
        // Early return if no scroll behavior is needed
        if (!hideOnScroll && showAfterScroll === 0)
            return;
        // Add event listener with passive option for better performance
        window.addEventListener('scroll', throttledScrollHandler, { passive: true });
        // Initial visibility check
        handleScroll();
        // Cleanup function
        return function () {
            mountedRef.current = false;
            window.removeEventListener('scroll', throttledScrollHandler);
        };
    }, [throttledScrollHandler, handleScroll, hideOnScroll, showAfterScroll]);
    // Memoize position classes to prevent recalculation on every render
    var positionClasses = (0, react_1.useMemo)(function () {
        var baseClasses = 'fixed z-[1000]';
        // Use explicit conditional logic instead of dynamic object access for security
        if (position === DEFAULT_POSITION) {
            return "".concat(baseClasses, " bottom-6 right-6");
        }
        else if (position === 'bottom-left') {
            return "".concat(baseClasses, " bottom-6 left-6");
        }
        else if (position === 'top-right') {
            return "".concat(baseClasses, " top-6 right-6");
        }
        else if (position === 'top-left') {
            return "".concat(baseClasses, " top-6 left-6");
        }
        return "".concat(baseClasses, " bottom-6 right-6"); // default
    }, [position]);
    // Custom offset styles only when needed (non-default offsets)
    var customOffsetStyles = (0, react_1.useMemo)(function () {
        // Only use inline styles for custom offsets that can't be handled by Tailwind
        if (offset.x === 24 && offset.y === 24)
            return undefined;
        var styles = {};
        if (position === DEFAULT_POSITION) {
            styles.bottom = offset.y;
            styles.right = offset.x;
        }
        else if (position === 'bottom-left') {
            styles.bottom = offset.y;
            styles.left = offset.x;
        }
        else if (position === 'top-right') {
            styles.top = offset.y;
            styles.right = offset.x;
        }
        else if (position === 'top-left') {
            styles.top = offset.y;
            styles.left = offset.x;
        }
        return styles;
    }, [position, offset]);
    // Memoize CSS classes to prevent string concatenation on every render
    var sizeClasses = (0, react_1.useMemo)(function () {
        // Use explicit conditionals instead of dynamic object access for security
        if (size === 'sm')
            return 'w-12 h-12 text-sm';
        if (size === 'lg')
            return 'w-16 h-16 text-lg';
        return 'w-14 h-14 text-base'; // default 'md' case
    }, [size]);
    var variantClasses = (0, react_1.useMemo)(function () {
        // Use explicit conditionals instead of dynamic object access for security
        if (variant === 'secondary') {
            return 'bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white shadow-lg hover:shadow-xl';
        }
        if (variant === 'accent') {
            return 'bg-accent text-accent-foreground hover:bg-accent-hover shadow-lg hover:shadow-xl';
        }
        // default 'primary' case
        return 'bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-lg hover:shadow-xl';
    }, [variant]);
    // Memoize tooltip positioning classes and minimal styles
    var tooltipPositioning = (0, react_1.useMemo)(function () {
        var isRightSide = position.includes('right');
        var baseClasses = 'fixed z-[1001] top-1/2 -translate-y-1/2';
        // Use Tailwind classes for common positions
        var positionClasses = '';
        var customStyles = undefined;
        if (isRightSide) {
            if (offset.x === 24) {
                positionClasses = "".concat(baseClasses, " right-20"); // Standard offset
            }
            else {
                positionClasses = "".concat(baseClasses);
                customStyles = { right: offset.x + 60 };
            }
        }
        else {
            if (offset.x === 24) {
                positionClasses = "".concat(baseClasses, " left-20"); // Standard offset
            }
            else {
                positionClasses = "".concat(baseClasses);
                customStyles = { left: offset.x + 60 };
            }
        }
        return { classes: positionClasses, styles: customStyles };
    }, [position, offset]);
    // Early return for better performance when not visible
    if (!isVisible)
        return null;
    // Enhanced accessibility with proper ARIA attributes
    var accessibilityProps = {
        'aria-label': ariaLabel || tooltip || 'Floating action button',
        'aria-disabled': disabled,
        'aria-describedby': tooltip && isHovered ? 'fab-tooltip' : undefined,
    };
    return (<>
      <button {...accessibilityProps} onClick={disabled ? undefined : onClick} onMouseEnter={function () { return !disabled && setIsHovered(true); }} onMouseLeave={function () { return !disabled && setIsHovered(false); }} disabled={disabled} className={(0, utils_1.cn)(
        // Base styles
        'rounded-full flex items-center justify-center', 'transition-all duration-300 ease-out', 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50', 'will-change-transform', 
        // Conditional styles based on disabled state
        disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'transform hover:scale-110 active:scale-95 cursor-pointer', 
        // Dynamic classes
        sizeClasses, variantClasses, positionClasses, className)} style={customOffsetStyles}>
        {children}
      </button>

      {/* Enhanced tooltip with better positioning and accessibility */}
      {tooltip && isHovered && !disabled && (<div id="fab-tooltip" role="tooltip" className={(0, utils_1.cn)('px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg', 'pointer-events-none transition-opacity duration-200', 'whitespace-nowrap opacity-100', tooltipPositioning.classes)} style={tooltipPositioning.styles}>
          {tooltip}
          {/* Tooltip arrow with improved positioning */}
          <div className={(0, utils_1.cn)('absolute w-2 h-2 bg-gray-900 rotate-45 top-1/2 -translate-y-1/2', position.includes('right') ? '-right-1' : '-left-1')}/>
        </div>)}
    </>);
}
