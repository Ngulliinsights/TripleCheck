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
exports.useEnhancedCleanupManager = void 0;
exports.useCleanupManager = useCleanupManager;
var react_1 = require("react");
/**
 * Base cleanup manager hook that provides centralized cleanup management
 * for components to prevent memory leaks and ensure proper resource disposal
 */
function useBaseCleanupManager() {
    var _this = this;
    var cleanupFunctionsRef = (0, react_1.useRef)(new Map());
    var keyCounterRef = (0, react_1.useRef)(0);
    var isMountedRef = (0, react_1.useRef)(true);
    // Generate unique key for cleanup functions
    var generateKey = (0, react_1.useCallback)(function () {
        return "cleanup_".concat(++keyCounterRef.current);
    }, []);
    // Add cleanup function
    var addCleanup = (0, react_1.useCallback)(function (cleanup, key) {
        if (!isMountedRef.current)
            return;
        var cleanupKey = key || generateKey();
        cleanupFunctionsRef.current.set(cleanupKey, cleanup);
    }, [generateKey]);
    // Remove specific cleanup function
    var removeCleanup = (0, react_1.useCallback)(function (key) {
        cleanupFunctionsRef.current.delete(key);
    }, []);
    // Run specific cleanup function
    var runCleanup = (0, react_1.useCallback)(function (key) { return __awaiter(_this, void 0, void 0, function () {
        var cleanup, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!key)
                        return [2 /*return*/];
                    cleanup = cleanupFunctionsRef.current.get(key);
                    if (!cleanup) return [3 /*break*/, 5];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, cleanup()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error("Cleanup function \"".concat(key, "\" failed:"), error_1);
                    return [3 /*break*/, 5];
                case 4:
                    cleanupFunctionsRef.current.delete(key);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Run all cleanup functions
    var runAllCleanup = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var cleanupPromises;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cleanupPromises = [];
                    cleanupFunctionsRef.current.forEach(function (cleanup, key) {
                        cleanupPromises.push((function () { return __awaiter(_this, void 0, void 0, function () {
                            var error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, cleanup()];
                                    case 1:
                                        _a.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_2 = _a.sent();
                                        console.error("Cleanup function \"".concat(key, "\" failed:"), error_2);
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); })());
                    });
                    return [4 /*yield*/, Promise.allSettled(cleanupPromises)];
                case 1:
                    _a.sent();
                    cleanupFunctionsRef.current.clear();
                    return [2 /*return*/];
            }
        });
    }); }, []);
    // Check if cleanup exists
    var hasCleanup = (0, react_1.useCallback)(function (key) {
        if (key) {
            return cleanupFunctionsRef.current.has(key);
        }
        return cleanupFunctionsRef.current.size > 0;
    }, []);
    // Cleanup on unmount
    (0, react_1.useEffect)(function () {
        return function () {
            isMountedRef.current = false;
            // Run all cleanup functions synchronously on unmount
            var cleanupFunctions = Array.from(cleanupFunctionsRef.current.values());
            cleanupFunctions.forEach(function (cleanup) {
                try {
                    var result = cleanup();
                    // Handle async cleanup functions
                    if (result && typeof result.then === 'function') {
                        result.catch(function (error) {
                            console.error('Async cleanup failed during unmount:', error);
                        });
                    }
                }
                catch (error) {
                    console.error('Cleanup failed during unmount:', error);
                }
            });
            cleanupFunctionsRef.current.clear();
        };
    }, []);
    return {
        addCleanup: addCleanup,
        removeCleanup: removeCleanup,
        runCleanup: runCleanup,
        runAllCleanup: runAllCleanup,
        hasCleanup: hasCleanup,
    };
}
/**
 * Cleanup manager with automatic cleanup registration for common patterns
 */
function useCleanupManager() {
    var baseManager = useBaseCleanupManager();
    // Add timeout with automatic cleanup
    var addTimeout = (0, react_1.useCallback)(function (callback, delay, key) {
        var timeoutId = setTimeout(callback, delay);
        var cleanupKey = key || "timeout_".concat(timeoutId);
        baseManager.addCleanup(function () {
            clearTimeout(timeoutId);
        }, cleanupKey);
        return cleanupKey;
    }, [baseManager]);
    // Add interval with automatic cleanup
    var addInterval = (0, react_1.useCallback)(function (callback, delay, key) {
        var intervalId = setInterval(callback, delay);
        var cleanupKey = key || "interval_".concat(intervalId);
        baseManager.addCleanup(function () {
            clearInterval(intervalId);
        }, cleanupKey);
        return cleanupKey;
    }, [baseManager]);
    // Add event listener with automatic cleanup
    var addEventListener = (0, react_1.useCallback)(function (element, event, handler, options, key) {
        element.addEventListener(event, handler, options);
        var cleanupKey = key || "event_".concat(event, "_").concat(Date.now());
        baseManager.addCleanup(function () {
            element.removeEventListener(event, handler, options);
        }, cleanupKey);
        return cleanupKey;
    }, [baseManager]);
    // Add abort controller with automatic cleanup
    var addAbortController = (0, react_1.useCallback)(function (controller, key) {
        var cleanupKey = key || "abort_".concat(Date.now());
        baseManager.addCleanup(function () {
            if (!controller.signal.aborted) {
                controller.abort();
            }
        }, cleanupKey);
        return cleanupKey;
    }, [baseManager]);
    return __assign(__assign({}, baseManager), { addTimeout: addTimeout, addInterval: addInterval, addEventListener: addEventListener, addAbortController: addAbortController });
}
// Backward compatibility
exports.useEnhancedCleanupManager = useCleanupManager;
