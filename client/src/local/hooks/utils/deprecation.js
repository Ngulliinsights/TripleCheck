"use strict";
/**
 * Deprecation utilities for hook consolidation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hookRegistry = void 0;
exports.showDeprecationWarning = showDeprecationWarning;
exports.createCompatibilityWrapper = createCompatibilityWrapper;
exports.checkDeprecatedHookUsage = checkDeprecatedHookUsage;
/**
 * Shows deprecation warning in development mode
 */
function showDeprecationWarning(_a) {
    var hookName = _a.hookName, replacement = _a.replacement, migrationGuide = _a.migrationGuide, _b = _a.version, version = _b === void 0 ? 'next major version' : _b;
    if (process.env.NODE_ENV === 'development') {
        var message = [
            "\u26A0\uFE0F  ".concat(hookName, " is deprecated and will be removed in ").concat(version, "."),
            "Please use ".concat(replacement, " instead."),
            migrationGuide && "Migration guide: ".concat(migrationGuide),
        ].filter(Boolean).join('\n   ');
        console.warn(message);
    }
}
/**
 * Creates a compatibility wrapper for gradual migration
 */
function createCompatibilityWrapper(deprecationInfo, newHook, optionsMapper) {
    return function (oldOptions) {
        showDeprecationWarning(deprecationInfo);
        var mappedOptions = optionsMapper(oldOptions);
        return newHook(mappedOptions);
    };
}
var HookRegistry = /** @class */ (function () {
    function HookRegistry() {
        this.registry = new Map();
    }
    HookRegistry.prototype.register = function (entry) {
        this.registry.set(entry.name, entry);
    };
    HookRegistry.prototype.get = function (hookName) {
        return this.registry.get(hookName);
    };
    HookRegistry.prototype.getByStatus = function (status) {
        return Array.from(this.registry.values()).filter(function (entry) { return entry.status === status; });
    };
    HookRegistry.prototype.getByCategory = function (category) {
        return Array.from(this.registry.values()).filter(function (entry) { return entry.category === category; });
    };
    HookRegistry.prototype.getAllEntries = function () {
        return Array.from(this.registry.values());
    };
    HookRegistry.prototype.isDeprecated = function (hookName) {
        var entry = this.registry.get(hookName);
        return (entry === null || entry === void 0 ? void 0 : entry.status) === 'deprecated' || (entry === null || entry === void 0 ? void 0 : entry.status) === 'consolidated';
    };
    HookRegistry.prototype.getDeprecationInfo = function (hookName) {
        var entry = this.registry.get(hookName);
        if (!entry || entry.status === 'active')
            return null;
        return {
            hookName: entry.name,
            replacement: entry.consolidatedInto || 'unknown',
            migrationGuide: entry.migrationGuide,
            version: entry.removedInVersion,
        };
    };
    return HookRegistry;
}());
exports.hookRegistry = new HookRegistry();
// Register known hooks for consolidation
exports.hookRegistry.register({
    name: 'useForm',
    category: 'core',
    status: 'deprecated',
    consolidatedInto: 'useFormValidation',
    migrationGuide: '/docs/hook-migration.md#useform-to-useformvalidation',
    removedInVersion: 'v2.0.0',
});
exports.hookRegistry.register({
    name: 'useAccessibility.ts (basic)',
    category: 'ui',
    status: 'consolidated',
    consolidatedInto: 'useAccessibility.tsx (comprehensive)',
    migrationGuide: '/docs/hook-migration.md#accessibility-consolidation',
});
exports.hookRegistry.register({
    name: 'usePerformanceMonitor',
    category: 'performance',
    status: 'consolidated',
    consolidatedInto: 'useComponentPerformance',
    migrationGuide: '/docs/hook-migration.md#performance-monitoring',
});
exports.hookRegistry.register({
    name: 'useVirtualizationHelpers',
    category: 'performance',
    status: 'consolidated',
});
exports.hookRegistry.register({
    name: 'useForm',
    category: 'forms',
    status: 'consolidated',
    consolidatedInto: 'useMemoryOptimization (useVirtualization)',
    migrationGuide: '/docs/hook-migration.md#virtualization-consolidation',
});
exports.hookRegistry.register({
    name: 'usePaginatedQuery',
    category: 'core',
    status: 'consolidated',
    consolidatedInto: 'usePagination',
    migrationGuide: '/docs/hook-migration.md#pagination-unification',
});
exports.hookRegistry.register({
    name: 'useInfiniteScroll',
    category: 'core',
    status: 'consolidated',
    consolidatedInto: 'usePagination',
    migrationGuide: '/docs/hook-migration.md#pagination-unification',
});
/**
 * Development helper to check for deprecated hook usage
 */
function checkDeprecatedHookUsage() {
    if (process.env.NODE_ENV === 'development') {
        var deprecatedHooks = exports.hookRegistry.getByStatus('deprecated');
        var consolidatedHooks = exports.hookRegistry.getByStatus('consolidated');
        if (deprecatedHooks.length > 0 || consolidatedHooks.length > 0) {
            console.group('🔄 Hook Consolidation Status');
            if (deprecatedHooks.length > 0) {
                console.warn('Deprecated hooks found:', deprecatedHooks.map(function (h) { return h.name; }));
            }
            if (consolidatedHooks.length > 0) {
                console.info('Consolidated hooks:', consolidatedHooks.map(function (h) { return "".concat(h.name, " \u2192 ").concat(h.consolidatedInto); }));
            }
            console.groupEnd();
        }
    }
}
