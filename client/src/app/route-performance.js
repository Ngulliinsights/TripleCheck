"use strict";
/**
 * Route Performance Monitoring
 *
 * Responsibilities:
 * - Route loading performance tracking
 * - Performance metrics collection
 * - Route debugging utilities
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.logger = exports.performanceTracker = void 0;
exports.trackRoutePerformance = trackRoutePerformance;
exports.validateAndLogRoute = validateAndLogRoute;
// Enhanced performance tracker with more robust feature detection
var createPerformanceTracker = function () {
    var isClient = typeof window !== "undefined";
    var hasPerformanceAPI = isClient &&
        typeof window.performance !== "undefined" &&
        typeof window.performance.now === "function";
    return {
        now: function () {
            return hasPerformanceAPI ? window.performance.now() : Date.now();
        },
        isAvailable: hasPerformanceAPI,
        canTrack: function () {
            return hasPerformanceAPI && process.env.NODE_ENV === "development";
        },
    };
};
// Create singleton instance to avoid recreation on each use
exports.performanceTracker = createPerformanceTracker();
// Centralized logging utility that respects ESLint preferences
var createLogger = function () {
    var canLog = (window === null || window === void 0 ? void 0 : window.console) &&
        process.env.NODE_ENV === "development";
    return {
        info: function (message) {
            var _a;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (canLog) {
                (_a = window.console).log.apply(_a, __spreadArray(["\uD83D\uDCCA ".concat(message)], args, false));
            }
        },
        error: function (message) {
            var _a;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (canLog) {
                (_a = window.console).error.apply(_a, __spreadArray(["\u274C ".concat(message)], args, false));
            }
        },
        warn: function (message) {
            var _a;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (canLog) {
                (_a = window.console).warn.apply(_a, __spreadArray(["\u26A0\uFE0F ".concat(message)], args, false));
            }
        },
    };
};
exports.logger = createLogger();
// Helper function to track route performance
function trackRoutePerformance(startTime, routePath, preloadPriority) {
    if (!exports.performanceTracker.canTrack() || !routePath)
        return;
    var loadTime = Math.round(exports.performanceTracker.now() - startTime);
    var priority = preloadPriority || "normal";
    var chunkName = "route-".concat(sanitizeRoutePath(routePath));
    exports.logger.info("Route loaded: ".concat(routePath, " (").concat(loadTime, "ms, priority: ").concat(priority, ", chunk: ").concat(chunkName, ")"));
    if (window === null || window === void 0 ? void 0 : window.gtag) {
        window.gtag("event", "route_chunk_load", {
            event_category: "Performance",
            event_label: routePath,
            value: loadTime,
            custom_map: {
                chunk_name: chunkName,
                priority: priority,
            },
        });
    }
}
// Helper function to sanitize route paths for chunk names
function sanitizeRoutePath(routePath) {
    return routePath
        .replace(/^\//, "") // Remove leading slash
        .replace(/\//g, "-") // Replace slashes with hyphens
        .replace(/[^a-zA-Z0-9-]/g, "") // Remove special characters
        .toLowerCase();
}
// Route validation and debugging
function validateAndLogRoute(pathname) {
    return __awaiter(this, void 0, void 0, function () {
        var routeValidatorModule, routeValidation;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.env.NODE_ENV !== "development")
                        return [2 /*return*/];
                    // eslint-disable-next-line no-console
                    console.log("Router rendering, current path:", pathname);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("../shared/utils/route-validator"); })];
                case 1:
                    routeValidatorModule = _a.sent();
                    routeValidation = routeValidatorModule.routeValidator.validateRoute(pathname);
                    if (!routeValidation.isValid) {
                        // eslint-disable-next-line no-console
                        console.warn("Invalid route detected:", pathname, routeValidation.errors);
                        if (routeValidation.warnings.length > 0) {
                            // eslint-disable-next-line no-console
                            console.info("Route suggestions:", routeValidation.warnings);
                        }
                    }
                    else {
                        // eslint-disable-next-line no-console
                        console.log("Route validation passed for:", pathname);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
