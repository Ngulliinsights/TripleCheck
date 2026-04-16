"use strict";
/**
 * System health checker to validate that all critical components are working
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
exports.runSystemHealthCheck = runSystemHealthCheck;
exports.quickHealthCheck = quickHealthCheck;
exports.initializeHealthMonitoring = initializeHealthMonitoring;
// import { parseError, logError } from "../../local/utils/error-handling" // File doesn't exist
var queryClient_1 = require("../api/queryClient");
// Fallback error handling functions
var parseError = function (error) { return (error === null || error === void 0 ? void 0 : error.message) || String(error); };
var logError = function (error) { return console.error(error); };
/**
 * Check if React Query is properly configured
 */
function checkReactQuery() {
    return __awaiter(this, void 0, void 0, function () {
        var cache, mutations;
        return __generator(this, function (_a) {
            try {
                cache = queryClient_1.queryClient.getQueryCache();
                mutations = queryClient_1.queryClient.getMutationCache();
                return [2 /*return*/, {
                        name: 'React Query',
                        status: 'healthy',
                        message: 'React Query is properly configured',
                        details: {
                            queryCacheSize: cache.getAll().length,
                            mutationCacheSize: mutations.getAll().length
                        }
                    }];
            }
            catch (error) {
                return [2 /*return*/, {
                        name: 'React Query',
                        status: 'error',
                        message: 'React Query configuration error',
                        details: parseError(error)
                    }];
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Check if API endpoints are accessible
 */
function checkAPIHealth() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, fetch('/api/health', {
                            method: 'GET',
                            credentials: 'include'
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, {
                            name: 'API Health',
                            status: 'healthy',
                            message: 'API is responding normally',
                            details: data
                        }];
                case 3: return [2 /*return*/, {
                        name: 'API Health',
                        status: 'warning',
                        message: "API returned status ".concat(response.status),
                        details: { status: response.status, statusText: response.statusText }
                    }];
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    return [2 /*return*/, {
                            name: 'API Health',
                            status: 'error',
                            message: 'Cannot connect to API',
                            details: parseError(error_1)
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Check if essential images are accessible
 */
function checkImageAssets() {
    return __awaiter(this, void 0, void 0, function () {
        var essentialImages, results, failed;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    essentialImages = [
                        '/placeholder-property.jpg',
                        '/placeholder-image.jpg',
                        '/assets/hero-bg.jpg'
                    ];
                    return [4 /*yield*/, Promise.allSettled(essentialImages.map(function (src) { return __awaiter(_this, void 0, void 0, function () {
                            var response;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fetch(src, { method: 'HEAD' })];
                                    case 1:
                                        response = _a.sent();
                                        return [2 /*return*/, { src: src, ok: response.ok, status: response.status }];
                                }
                            });
                        }); }))];
                case 1:
                    results = _a.sent();
                    failed = results
                        .map(function (result, index) { return ({
                        src: essentialImages[index],
                        result: result.status === 'fulfilled' ? result.value : { ok: false, error: result.reason }
                    }); })
                        .filter(function (_a) {
                        var result = _a.result;
                        return !result.ok;
                    });
                    if (failed.length === 0) {
                        return [2 /*return*/, {
                                name: 'Image Assets',
                                status: 'healthy',
                                message: 'All essential images are accessible'
                            }];
                    }
                    else if (failed.length < essentialImages.length) {
                        return [2 /*return*/, {
                                name: 'Image Assets',
                                status: 'warning',
                                message: "".concat(failed.length, " of ").concat(essentialImages.length, " images are missing"),
                                details: failed
                            }];
                    }
                    else {
                        return [2 /*return*/, {
                                name: 'Image Assets',
                                status: 'error',
                                message: 'Critical images are missing',
                                details: failed
                            }];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Check if local storage is working
 */
function checkLocalStorage() {
    try {
        var testKey = '__health_check__';
        var testValue = 'test';
        localStorage.setItem(testKey, testValue);
        var retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        if (retrieved === testValue) {
            return {
                name: 'Local Storage',
                status: 'healthy',
                message: 'Local storage is working properly'
            };
        }
        else {
            return {
                name: 'Local Storage',
                status: 'error',
                message: 'Local storage read/write failed'
            };
        }
    }
    catch (error) {
        return {
            name: 'Local Storage',
            status: 'error',
            message: 'Local storage is not available',
            details: parseError(error)
        };
    }
}
/**
 * Check if session storage is working
 */
function checkSessionStorage() {
    try {
        var testKey = '__health_check__';
        var testValue = 'test';
        sessionStorage.setItem(testKey, testValue);
        var retrieved = sessionStorage.getItem(testKey);
        sessionStorage.removeItem(testKey);
        if (retrieved === testValue) {
            return {
                name: 'Session Storage',
                status: 'healthy',
                message: 'Session storage is working properly'
            };
        }
        else {
            return {
                name: 'Session Storage',
                status: 'error',
                message: 'Session storage read/write failed'
            };
        }
    }
    catch (error) {
        return {
            name: 'Session Storage',
            status: 'error',
            message: 'Session storage is not available',
            details: parseError(error)
        };
    }
}
/**
 * Check browser compatibility
 */
function checkBrowserCompatibility() {
    var requiredFeatures = {
        'Fetch API': typeof fetch !== 'undefined',
        'Promise': typeof Promise !== 'undefined',
        'Local Storage': typeof localStorage !== 'undefined',
        'Session Storage': typeof sessionStorage !== 'undefined',
        'JSON': typeof JSON !== 'undefined',
        'URLSearchParams': typeof URLSearchParams !== 'undefined'
    };
    var unsupported = Object.entries(requiredFeatures)
        .filter(function (_a) {
        var supported = _a[1];
        return !supported;
    })
        .map(function (_a) {
        var feature = _a[0];
        return feature;
    });
    if (unsupported.length === 0) {
        return {
            name: 'Browser Compatibility',
            status: 'healthy',
            message: 'All required browser features are supported'
        };
    }
    else {
        return {
            name: 'Browser Compatibility',
            status: 'error',
            message: "Unsupported features: ".concat(unsupported.join(', ')),
            details: { unsupported: unsupported, required: Object.keys(requiredFeatures) }
        };
    }
}
/**
 * Run all health checks
 */
function runSystemHealthCheck() {
    return __awaiter(this, void 0, void 0, function () {
        var checks, _a, _b, asyncChecks, hasError, hasWarning, overall, systemHealth;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    checks = [];
                    // Run synchronous checks
                    checks.push(checkBrowserCompatibility());
                    checks.push(checkLocalStorage());
                    checks.push(checkSessionStorage());
                    _b = (_a = checks).push;
                    return [4 /*yield*/, checkReactQuery()];
                case 1:
                    _b.apply(_a, [_c.sent()]);
                    return [4 /*yield*/, Promise.allSettled([
                            checkAPIHealth(),
                            checkImageAssets()
                        ])];
                case 2:
                    asyncChecks = _c.sent();
                    asyncChecks.forEach(function (result, index) {
                        if (result.status === 'fulfilled') {
                            checks.push(result.value);
                        }
                        else {
                            var checkNames = ['API Health', 'Image Assets'];
                            checks.push({
                                name: checkNames[index],
                                status: 'error',
                                message: 'Health check failed to run',
                                details: parseError(result.reason)
                            });
                        }
                    });
                    hasError = checks.some(function (check) { return check.status === 'error'; });
                    hasWarning = checks.some(function (check) { return check.status === 'warning'; });
                    if (hasError) {
                        overall = 'error';
                    }
                    else if (hasWarning) {
                        overall = 'warning';
                    }
                    else {
                        overall = 'healthy';
                    }
                    systemHealth = {
                        overall: overall,
                        checks: checks,
                        timestamp: new Date().toISOString()
                    };
                    // Log the results (only in development or for critical errors)
                    if (overall === 'error') {
                        if (process.env.NODE_ENV === 'development') {
                            logError({
                                message: 'System health check failed',
                                details: systemHealth
                            });
                        }
                    }
                    else if (overall === 'warning' && process.env.NODE_ENV === 'development') {
                        console.warn('System health check has warnings:', systemHealth);
                    }
                    else if (process.env.NODE_ENV === 'development') {
                        console.log('System health check passed:', systemHealth);
                    }
                    return [2 /*return*/, systemHealth];
            }
        });
    });
}
/**
 * Quick health check for critical systems only
 */
function quickHealthCheck() {
    return __awaiter(this, void 0, void 0, function () {
        var criticalChecks, _a, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    _a = [checkBrowserCompatibility()];
                    return [4 /*yield*/, checkReactQuery()];
                case 1:
                    criticalChecks = _a.concat([
                        _b.sent()
                    ]);
                    return [2 /*return*/, criticalChecks.every(function (check) { return check.status !== 'error'; })];
                case 2:
                    error_2 = _b.sent();
                    logError(parseError(error_2));
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Initialize system health monitoring
 */
function initializeHealthMonitoring() {
    // Run initial health check (only log critical errors in production)
    runSystemHealthCheck().then(function (health) {
        if (health.overall === 'error') {
            if (import.meta.env.MODE === 'development') {
                console.warn('🚨 System health check failed! Some features may not work properly.');
            }
        }
        else if (health.overall === 'warning' && import.meta.env.MODE === 'development') {
            console.info('⚠️ System health check has warnings. Some features may be degraded.');
        }
        else if (import.meta.env.MODE === 'development') {
            console.info('✅ System health check passed. All systems operational.');
        }
    }).catch(function (error) {
        if (import.meta.env.MODE === 'development') {
            console.info('Health check initialization failed:', error);
        }
    });
    // Set up periodic health checks (every 5 minutes)
    if (typeof window !== 'undefined') {
        setInterval(function () {
            quickHealthCheck().then(function (isHealthy) {
                if (!isHealthy && process.env.NODE_ENV === 'development') {
                    console.warn('⚠️ Quick health check failed. Running full health check...');
                    runSystemHealthCheck();
                }
            }).catch(function (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Periodic health check failed:', error);
                }
            });
        }, 5 * 60 * 1000);
    }
}
