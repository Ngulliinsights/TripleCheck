"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logo = Logo;
var react_1 = require("react");
var utils_1 = require("../../lib/utils");
// ─── Constants ────────────────────────────────────────────────────────────────
var SIZE_CLASSES = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-10 w-auto",
    xl: "h-12 w-auto",
};
var VARIANT_FILTERS = {
    default: "",
    light: "brightness-0 invert brightness-110",
    dark: "brightness-90 contrast-110 saturate-105",
};
var INTERACTIVE_CLASSES = "cursor-pointer transition-all duration-200 ease-out " +
    "hover:scale-105 hover:brightness-110 active:scale-95 active:transition-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 " +
    "focus-visible:ring-offset-2 focus-visible:rounded-sm";
// ─── Component ────────────────────────────────────────────────────────────────
function Logo(_a) {
    var className = _a.className, _b = _a.size, size = _b === void 0 ? "md" : _b, _c = _a.variant, variant = _c === void 0 ? "default" : _c, _d = _a.interactive, interactive = _d === void 0 ? true : _d, _e = _a.priority, priority = _e === void 0 ? false : _e, onClick = _a.onClick, _f = _a.href, href = _f === void 0 ? "/" : _f, _g = _a.logoSrc, logoSrc = _g === void 0 ? "/assets/Artmark.svg" : _g, _h = _a.alt, alt = _h === void 0 ? "Artmark Logo" : _h;
    var imgClassName = (0, utils_1.cn)("select-none object-contain", SIZE_CLASSES[size], VARIANT_FILTERS[variant], interactive && INTERACTIVE_CLASSES, className);
    var handleError = react_1.default.useCallback(function (e) {
        e.currentTarget.style.opacity = "0";
        if (import.meta.env.DEV) {
            console.warn("[Logo] Image failed to load: ".concat(logoSrc));
        }
    }, [logoSrc]);
    var img = (<img src={logoSrc} alt={alt} className={imgClassName} loading={priority ? "eager" : "lazy"} {...{ fetchPriority: priority ? "high" : "auto" }} decoding="async" draggable={false} onError={handleError}/>);
    // Non-interactive: render image only
    if (!interactive)
        return img;
    // Interactive with custom click handler (e.g. SPA dispatch)
    if (onClick) {
        return (<button type="button" onClick={onClick} className="inline-flex appearance-none border-0 bg-transparent p-0 focus:outline-none" aria-label={"".concat(alt, " - Go to home")}>
        {img}
      </button>);
    }
    // Default: semantic anchor link
    var isExternal = href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:");
    return (<a href={href} aria-label={"".concat(alt, " - Navigate to ").concat(href === "/" ? "home page" : href)} {...(isExternal
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})} className="inline-flex focus:outline-none">
      {img}
    </a>);
}
Logo.displayName = "Logo";
