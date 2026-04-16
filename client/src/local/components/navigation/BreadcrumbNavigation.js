"use strict";
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
exports.BreadcrumbNavigation = BreadcrumbNavigation;
exports.useBreadcrumbs = useBreadcrumbs;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var utils_1 = require("../../lib/utils");
/**
 * Renders a breadcrumb navigation component with customizable styling and behavior.
 * Supports home icon, custom separators, and automatic truncation for long paths.
 */
function BreadcrumbNavigation(_a) {
    var items = _a.items, className = _a.className, _b = _a.showHome, showHome = _b === void 0 ? true : _b, separator = _a.separator, _c = _a.maxItems, maxItems = _c === void 0 ? 5 : _c;
    // Add home item if requested - this creates the foundation of our navigation path
    var allItems = showHome ? __spreadArray([{ label: "Home", href: "/", isActive: false }], items, true) : items;
    // Handle truncation logic when we have too many items to display cleanly
    var displayItems = allItems.length > maxItems ? __spreadArray([
        allItems[0], // Always keep the first item (usually Home)
        { label: "...", href: undefined, isActive: false }
    ], allItems.slice(-2), true) : allItems;
    var defaultSeparator = separator || (<lucide_react_1.ChevronRight className="w-4 h-4 text-gray-400"/>);
    return (<nav className={(0, utils_1.cn)("flex items-center space-x-2 text-sm", className)} aria-label="Breadcrumb navigation">
      <ol className="flex items-center space-x-2">
        {displayItems.map(function (item, index) {
            return item && (<BreadcrumbItem key={"".concat(item.label, "-").concat(index)} item={item} index={index} showHome={showHome} separator={defaultSeparator}/>);
        })}
      </ol>
    </nav>);
}
/**
 * Individual breadcrumb item component - extracted to reduce complexity
 * and improve maintainability of the main component.
 */
function BreadcrumbItem(_a) {
    var item = _a.item, index = _a.index, showHome = _a.showHome, separator = _a.separator;
    var isHomeItem = index === 0 && showHome && item.label === "Home";
    var shouldShowIcon = isHomeItem;
    return (<li className="flex items-center">
      {index > 0 && (<span className="mx-2" aria-hidden="true">
          {separator}
        </span>)}

      {renderBreadcrumbContent(item, shouldShowIcon)}
    </li>);
}
/**
 * Renders the actual content of a breadcrumb item (link or span)
 * based on whether it's active and has an href.
 */
function renderBreadcrumbContent(item, shouldShowIcon) {
    var content = shouldShowIcon ? <lucide_react_1.Home className="w-4 h-4"/> : item.label;
    // If item has href and is not active, render as a clickable link
    if (item.href && !item.isActive) {
        return (<a href={item.href} className={(0, utils_1.cn)("hover:text-primary transition-colors duration-150", shouldShowIcon ? "flex items-center" : "", "text-gray-600 hover:text-gray-900")} aria-current={item.isActive ? "page" : undefined}>
        {content}
      </a>);
    }
    // Otherwise, render as a span (for active items or items without links)
    return (<span className={(0, utils_1.cn)(item.isActive ? "text-gray-900 font-medium" : "text-gray-500", shouldShowIcon ? "flex items-center" : "")} aria-current={item.isActive ? "page" : undefined}>
      {content}
    </span>);
}
/**
 * Custom hook to generate breadcrumbs from the current browser path.
 * Converts URL segments into readable labels and manages breadcrumb state.
 */
function useBreadcrumbs(customItems) {
    var _a = react_1.default.useState([]), breadcrumbs = _a[0], setBreadcrumbs = _a[1];
    react_1.default.useEffect(function () {
        // If custom items are provided, use those instead of generating from path
        if (customItems) {
            setBreadcrumbs(customItems);
            return;
        }
        // Extract meaningful segments from the current URL path
        var path = window.location.pathname;
        var segments = path.split("/").filter(Boolean);
        // Transform each URL segment into a breadcrumb item
        var items = segments.map(function (segment, index) {
            // Build the href by joining segments up to current index
            var href = "/".concat(segments.slice(0, index + 1).join("/"));
            var isLast = index === segments.length - 1;
            // Convert kebab-case segments to readable Title Case labels
            var label = segment
                .split("-")
                .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1); })
                .join(" ");
            return __assign(__assign({ label: label }, (isLast ? {} : { href: href })), { isActive: isLast });
        });
        setBreadcrumbs(items);
    }, [customItems]);
    return breadcrumbs;
}
