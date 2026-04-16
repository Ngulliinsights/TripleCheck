"use strict";
/**
 * Navigation Components Barrel Export
 *
 * Navigation and routing components
 *
 * This file provides a centralized export point for all
 * navigation components to improve import organization.
 *
 * Usage:
 * import { ComponentName } from '@shared/components/navigation'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeNavigation = exports.NavigationSearch = exports.NavigationErrorBoundary = exports.MobileNav = exports.EnhancedNavigation = exports.Navigation = exports.ContextualSidebar = exports.BreadcrumbNavigation = void 0;
// Standard exports
var BreadcrumbNavigation_1 = require("./BreadcrumbNavigation");
Object.defineProperty(exports, "BreadcrumbNavigation", { enumerable: true, get: function () { return BreadcrumbNavigation_1.default; } });
var ContextualSidebar_1 = require("./ContextualSidebar");
Object.defineProperty(exports, "ContextualSidebar", { enumerable: true, get: function () { return ContextualSidebar_1.default; } });
var Navigation_1 = require("./Navigation"); // Named export with backward compatibility
Object.defineProperty(exports, "Navigation", { enumerable: true, get: function () { return Navigation_1.Navigation; } });
Object.defineProperty(exports, "EnhancedNavigation", { enumerable: true, get: function () { return Navigation_1.Navigation; } });
var MobileNav_1 = require("./MobileNav");
Object.defineProperty(exports, "MobileNav", { enumerable: true, get: function () { return MobileNav_1.default; } });
// export { default as NavigationDebug } from './NavigationDebug' // File doesn't exist
var NavigationErrorBoundary_1 = require("./NavigationErrorBoundary");
Object.defineProperty(exports, "NavigationErrorBoundary", { enumerable: true, get: function () { return NavigationErrorBoundary_1.default; } });
var NavigationSearch_1 = require("./NavigationSearch");
Object.defineProperty(exports, "NavigationSearch", { enumerable: true, get: function () { return NavigationSearch_1.default; } });
var SafeNavigation_1 = require("./SafeNavigation");
Object.defineProperty(exports, "SafeNavigation", { enumerable: true, get: function () { return SafeNavigation_1.default; } });
