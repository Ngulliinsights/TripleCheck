"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wordmark = Wordmark;
exports.WordmarkWithChecks = WordmarkWithChecks;
exports.WordmarkCompact = WordmarkCompact;
var react_1 = require("react");
var utils_1 = require("../../lib/utils");
// Extract common constants to satisfy ESLint rule sonarjs/no-duplicate-string
var TRANSITION_ALL_DURATION_300 = "transition-all duration-300";
var SECONDARY_COLOR = "text-secondary";
var BG_SECONDARY = "bg-secondary";
// Extract style configurations into constants for better maintainability
var SIZE_CLASSES = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
};
var VARIANT_STYLES = {
    default: {
        triple: "text-foreground",
        check: SECONDARY_COLOR,
        pulse: BG_SECONDARY,
    },
    light: {
        triple: "text-white",
        check: "text-teal-400",
        pulse: "bg-teal-400",
    },
    dark: {
        triple: "text-gray-900",
        check: SECONDARY_COLOR,
        pulse: BG_SECONDARY,
    },
    gradient: {
        triple: "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent",
        check: "bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent",
        pulse: "bg-gradient-to-r from-secondary to-secondary/80",
    },
};
// Extract pulse size mapping for consistency across components
var PULSE_SIZE_CLASSES = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2 h-2",
    xl: "w-2.5 h-2.5",
};
// Type-safe helper function for simple string mappings
function getStringValue(obj, key) {
    return obj[key];
}
// Type-safe helper function for variant styles
function getVariantStyle(variant) {
    return VARIANT_STYLES[variant];
}
function Wordmark(_a) {
    var _b = _a.size, size = _b === void 0 ? "md" : _b, _c = _a.variant, variant = _c === void 0 ? "default" : _c, className = _a.className, _d = _a.animated, animated = _d === void 0 ? true : _d, _e = _a.interactive, interactive = _e === void 0 ? false : _e, onClick = _a.onClick, _f = _a.href, href = _f === void 0 ? "/" : _f;
    // Get styles using type-safe accessors
    var styles = getVariantStyle(variant);
    var sizeClass = getStringValue(SIZE_CLASSES, size);
    var pulseSize = getStringValue(PULSE_SIZE_CLASSES, size);
    // Memoize click handler to prevent unnecessary re-renders
    var handleClick = react_1.default.useCallback(function () {
        if (onClick) {
            onClick();
        }
        else if (interactive && href) {
            window.location.href = href;
        }
    }, [onClick, interactive, href]);
    // Memoize keyboard handler for better performance
    var handleKeyDown = react_1.default.useCallback(function (e) {
        if (interactive && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleClick();
        }
    }, [interactive, handleClick]);
    return (<div className={(0, utils_1.cn)(
        // Base styles that always apply
        "font-bold tracking-tight select-none transition-all duration-200", 
        // Size-specific text class
        sizeClass, 
        // Interactive styles only when needed
        interactive && "cursor-pointer hover:scale-105 active:scale-95", 
        // Custom className last for proper override capability
        className)} 
    // Conditional props to avoid unnecessary DOM attributes
    {...(interactive && {
        role: "button",
        tabIndex: 0,
        "aria-label": "TripleCheck - Go to Home",
        onClick: handleClick,
        onKeyDown: handleKeyDown,
    })}>
      <span className={(0, utils_1.cn)("font-extrabold", TRANSITION_ALL_DURATION_300, styles.triple)}>
        Triple
      </span>
      <span className={(0, utils_1.cn)("font-medium relative ml-0.5", TRANSITION_ALL_DURATION_300, styles.check)}>
        Check
        {/* Render pulse indicator only when animated */}
        {animated && (<span className={(0, utils_1.cn)("absolute -top-1 -right-1 rounded-full", TRANSITION_ALL_DURATION_300, pulseSize, "animate-pulse", styles.pulse)} aria-hidden="true" // Hide from screen readers as it's decorative
        />)}
      </span>
    </div>);
}
// Enhanced wordmark with verification checkmarks
function WordmarkWithChecks(_a) {
    var _b = _a.size, size = _b === void 0 ? "md" : _b, _c = _a.variant, variant = _c === void 0 ? "default" : _c, className = _a.className;
    // Define check sizes consistently with pulse sizes
    var CHECK_SIZE_CLASSES = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5",
        xl: "w-6 h-6",
    };
    var ICON_SIZE_CLASSES = {
        sm: "w-2 h-2",
        md: "w-2.5 h-2.5",
        lg: "w-3 h-3",
        xl: "w-4 h-4",
    };
    // Define CSS classes for staggered animation delays
    var ANIMATION_DELAY_CLASSES = [
        "[animation-delay:0s]",
        "[animation-delay:0.2s]",
        "[animation-delay:0.4s]",
    ];
    // Safe accessors for object properties
    var sizeClass = getStringValue(SIZE_CLASSES, size);
    var checkSizeClass = getStringValue(CHECK_SIZE_CLASSES, size);
    var iconSizeClass = getStringValue(ICON_SIZE_CLASSES, size);
    // Memoize the checkmark array to prevent recreation on each render
    var checkmarks = react_1.default.useMemo(function () { return Array.from({ length: 3 }, function (_, i) { return i; }); }, []);
    return (<div className={(0, utils_1.cn)("flex items-center gap-2 font-bold tracking-tight select-none", sizeClass, className)}>
      {/* Triple verification checkmarks */}
      <div className="flex items-center gap-0.5">
        {checkmarks.map(function (i) { return (<div key={i} className={(0, utils_1.cn)("rounded-full bg-secondary flex items-center justify-center", TRANSITION_ALL_DURATION_300, checkSizeClass, "animate-pulse", 
            // Safe array access for animation delays
            ANIMATION_DELAY_CLASSES[i] || "[animation-delay:0s]")} aria-hidden="true" // Decorative checkmarks
        >
            <svg className={(0, utils_1.cn)("text-secondary-foreground", iconSizeClass)} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </div>); })}
      </div>

      {/* Pass through props while disabling animation to avoid double animation */}
      <Wordmark size={size} variant={variant} animated={false}/>
    </div>);
}
// Compact wordmark for tight spaces
function WordmarkCompact(_a) {
    var _b = _a.size, size = _b === void 0 ? "md" : _b, _c = _a.variant, variant = _c === void 0 ? "default" : _c, className = _a.className;
    // Create more consistent size mapping for compact version
    var COMPACT_SIZE_CLASSES = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
    };
    // Apply variant-specific styling to the checkmark for consistency
    var VARIANT_CHECKMARK_CLASSES = {
        default: SECONDARY_COLOR,
        light: "text-teal-400",
        dark: SECONDARY_COLOR,
        gradient: "bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent",
    };
    // Safe accessors for object properties
    var compactSizeClass = getStringValue(COMPACT_SIZE_CLASSES, size);
    var checkmarkClass = getStringValue(VARIANT_CHECKMARK_CLASSES, variant);
    return (<div className={(0, utils_1.cn)("font-bold tracking-tighter select-none", compactSizeClass, className)}>
      <span className="font-extrabold">3</span>
      <span className={(0, utils_1.cn)("font-medium", checkmarkClass)} aria-label="Check mark">
        ✓
      </span>
    </div>);
}
