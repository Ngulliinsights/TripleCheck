"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionDivider = SectionDivider;
var react_1 = require("react");
var utils_1 = require("@/local/lib/utils");
// Constants to avoid duplicate strings
var BORDER_CLASS = 'border-t';
var BORDER_T2_CLASS = 'border-t-2';
function SectionDivider(_a) {
    var _b = _a.variant, variant = _b === void 0 ? 'line' : _b, _c = _a.color, color = _c === void 0 ? 'muted' : _c, _d = _a.thickness, thickness = _d === void 0 ? 'medium' : _d, _e = _a.spacing, spacing = _e === void 0 ? 'md' : _e, _f = _a.animated, animated = _f === void 0 ? false : _f, className = _a.className, children = _a.children;
    var dividerRef = (0, react_1.useRef)(null);
    var _g = (0, react_1.useState)(false), isVisible = _g[0], setIsVisible = _g[1];
    (0, react_1.useEffect)(function () {
        if (!animated || !dividerRef.current)
            return;
        var observer = new IntersectionObserver(function (_a) {
            var entry = _a[0];
            setIsVisible((entry === null || entry === void 0 ? void 0 : entry.isIntersecting) || false);
        }, { threshold: 0.1 });
        observer.observe(dividerRef.current);
        return function () { return observer.disconnect(); };
    }, [animated]);
    // Helper functions to reduce complexity and eliminate nested ternaries
    var getSpacingClass = function () {
        var spacingMap = {
            sm: 'my-8',
            md: 'my-12',
            lg: 'my-16',
            xl: 'my-24'
        };
        // Type-safe object access to prevent injection
        if (spacing in spacingMap) {
            return spacingMap[spacing];
        }
        return 'my-12';
    };
    var getColorClass = function () {
        var colorMap = {
            primary: 'text-primary border-primary',
            secondary: 'text-secondary border-secondary',
            accent: 'text-accent border-accent',
            muted: 'text-muted-foreground border-border'
        };
        // Type-safe object access to prevent injection
        if (color in colorMap) {
            return colorMap[color];
        }
        return 'text-muted-foreground border-border';
    };
    var getThicknessValue = function () {
        var thicknessMap = {
            thin: '1px',
            medium: '2px',
            thick: '4px'
        };
        // Type-safe object access to prevent injection
        if (thickness in thicknessMap) {
            return thicknessMap[thickness];
        }
        return '2px';
    };
    var getBorderThicknessClass = function () {
        if (thickness === 'thick')
            return BORDER_T2_CLASS;
        return BORDER_CLASS;
    };
    var getDotSize = function () {
        var sizeMap = {
            thin: 'w-1 h-1',
            medium: 'w-2 h-2',
            thick: 'w-3 h-3'
        };
        // Type-safe object access to prevent injection
        if (thickness in sizeMap) {
            return sizeMap[thickness];
        }
        return 'w-2 h-2';
    };
    var getGradientHeight = function () {
        var heightMap = {
            thin: 'h-px',
            medium: 'h-0.5',
            thick: 'h-1'
        };
        // Type-safe object access to prevent injection
        if (thickness in heightMap) {
            return heightMap[thickness];
        }
        return 'h-0.5';
    };
    // Animation styles are now handled via CSS classes
    // Base classes used across all variants
    var getBaseClasses = function () {
        return (0, utils_1.cn)('w-full flex items-center justify-center', getSpacingClass(), getColorClass(), animated && 'transition-all duration-1000 ease-out', animated && (isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'), className);
    };
    // Individual variant renderers - breaking down the large switch statement
    var renderWaveVariant = function () { return (<div className={getBaseClasses()}>
      <svg className="w-full h-4" viewBox="0 0 400 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 10 Q100 0 200 10 T400 10" stroke="currentColor" strokeWidth={getThicknessValue()} fill="none" className={animated && isVisible ? 'animate-pulse' : ''}/>
      </svg>
    </div>); };
    var renderZigzagVariant = function () { return (<div className={getBaseClasses()}>
      <svg className="w-full h-4" viewBox="0 0 400 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 10 L50 0 L100 10 L150 0 L200 10 L250 0 L300 10 L350 0 L400 10" stroke="currentColor" strokeWidth={getThicknessValue()} fill="none" strokeLinejoin="round" className={animated && isVisible ? 'animate-pulse' : ''}/>
      </svg>
    </div>); };
    var renderDotsVariant = function () { return (<div className={getBaseClasses()}>
      <div className="flex items-center space-x-2">
        {__spreadArray([], Array(5), true).map(function (_, i) { return (<div key={i} className={(0, utils_1.cn)('rounded-full bg-current', getDotSize(), animated && isVisible && 'animate-bounce', animated ? "animate-delay-".concat(i) : '')}/>); })}
      </div>
    </div>); };
    var renderGradientVariant = function () { return (<div className={getBaseClasses()}>
      <div className={(0, utils_1.cn)('w-full bg-gradient-to-r from-transparent via-current to-transparent', getGradientHeight(), animated && isVisible ? 'animate-pulse' : '')}/>
    </div>); };
    var renderLineVariant = function () {
        var baseClasses = getBaseClasses();
        var borderClass = getBorderThicknessClass();
        if (children) {
            return (<div className={baseClasses}>
          <div className="flex items-center w-full">
            <div className={(0, utils_1.cn)('flex-1 border-t', borderClass)}/>
            <div className="px-4 text-sm font-medium bg-background">
              {children}
            </div>
            <div className={(0, utils_1.cn)('flex-1 border-t', borderClass)}/>
          </div>
        </div>);
        }
        return (<div className={baseClasses}>
        <div className={(0, utils_1.cn)('w-full border-t', borderClass, getBorderThicknessClass(), animated && isVisible ? 'animate-pulse' : '')}/>
      </div>);
    };
    // Main render function - now much simpler
    var renderDivider = function () {
        var variantRenderers = {
            wave: renderWaveVariant,
            zigzag: renderZigzagVariant,
            dots: renderDotsVariant,
            gradient: renderGradientVariant,
            line: renderLineVariant
        };
        // Type-safe object access to prevent injection
        var renderer = (variant in variantRenderers)
            ? variantRenderers[variant]
            : renderLineVariant;
        return renderer();
    };
    return (<div ref={dividerRef}>
      {renderDivider()}
    </div>);
}
