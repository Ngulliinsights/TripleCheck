"use strict";
/**
 * Disabled route preloader - safe fallback to prevent crashes
 * This is a temporary measure while we fix navigation stability issues
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.routePreloader = exports.getRoutePreloader = void 0;
/**
 * Disabled RoutePreloader class - all methods are no-ops to prevent crashes
 */
var DisabledRoutePreloader = /** @class */ (function () {
    function DisabledRoutePreloader() {
        this.emptyMetrics = {
            preloadMetrics: [],
            routeLoadingMetrics: [],
            summary: {
                totalPreloads: 0,
                successfulPreloads: 0,
                cacheHitRate: 0,
                averageLoadTime: 0,
                strategySummary: {},
            },
        };
    }
    // All methods are safe no-ops
    DisabledRoutePreloader.prototype.preloadRoute = function (_route_1) {
        return __awaiter(this, arguments, void 0, function (_route, _strategy) {
            if (_strategy === void 0) { _strategy = "on-demand"; }
            return __generator(this, function (_a) {
                return [2 /*return*/, null];
            });
        });
    };
    DisabledRoutePreloader.prototype.preloadImmediate = function () {
        // No-op
    };
    DisabledRoutePreloader.prototype.setupHoverPreloading = function () {
        // No-op
    };
    DisabledRoutePreloader.prototype.observeForPreloading = function (_element, _route) {
        // No-op
    };
    DisabledRoutePreloader.prototype.getPreloadedComponent = function (_route) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, null];
            });
        });
    };
    DisabledRoutePreloader.prototype.isPreloaded = function (_route) {
        return false;
    };
    DisabledRoutePreloader.prototype.getMetrics = function () {
        return this.emptyMetrics;
    };
    DisabledRoutePreloader.prototype.initialize = function () {
        console.warn('Route preloader is disabled for stability. Navigation will work normally without preloading.');
    };
    DisabledRoutePreloader.prototype.destroy = function () {
        // No-op
    };
    Object.defineProperty(DisabledRoutePreloader.prototype, "preloadedRoutes", {
        // Internal properties for compatibility
        get: function () {
            return new Map();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DisabledRoutePreloader.prototype, "preloadQueue", {
        get: function () {
            return new Set();
        },
        enumerable: false,
        configurable: true
    });
    DisabledRoutePreloader.prototype.getRouteConfig = function (_path) {
        return undefined;
    };
    DisabledRoutePreloader.prototype.getRouteDataEndpoints = function (_route) {
        return [];
    };
    return DisabledRoutePreloader;
}());
// Create singleton instance
var disabledPreloader = new DisabledRoutePreloader();
var getRoutePreloader = function () {
    return disabledPreloader;
};
exports.getRoutePreloader = getRoutePreloader;
// Export for backward compatibility
exports.routePreloader = {
    get instance() {
        return disabledPreloader;
    },
    preloadRoute: function (route_1) {
        return __awaiter(this, arguments, void 0, function (route, strategy) {
            if (strategy === void 0) { strategy = "on-demand"; }
            return __generator(this, function (_a) {
                return [2 /*return*/, disabledPreloader.preloadRoute(route, strategy)];
            });
        });
    },
    isPreloaded: function (route) {
        return disabledPreloader.isPreloaded(route);
    },
    getPreloadedComponent: function (route) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, disabledPreloader.getPreloadedComponent(route)];
            });
        });
    },
    getMetrics: function () {
        return disabledPreloader.getMetrics();
    },
    observeForPreloading: function (element, route) {
        return disabledPreloader.observeForPreloading(element, route);
    },
    initialize: function () {
        return disabledPreloader.initialize();
    },
    destroy: function () {
        return disabledPreloader.destroy();
    },
    get preloadedRoutes() {
        return disabledPreloader.preloadedRoutes;
    },
    get preloadQueue() {
        return disabledPreloader.preloadQueue;
    },
    getRouteConfig: function (path) {
        return disabledPreloader.getRouteConfig(path);
    },
    getRouteDataEndpoints: function (route) {
        return disabledPreloader.getRouteDataEndpoints(route);
    }
};
// Remove development helper to prevent any potential issues
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    Object.defineProperty(window, '__routePreloader', {
        get: function () { return disabledPreloader; },
        configurable: true
    });
}
