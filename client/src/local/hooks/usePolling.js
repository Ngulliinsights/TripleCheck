"use strict";
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
exports.usePolling = usePolling;
exports.usePropertyUpdatesPolling = usePropertyUpdatesPolling;
exports.useMessagePolling = useMessagePolling;
exports.useNotificationsPolling = useNotificationsPolling;
exports.useTrustScorePolling = useTrustScorePolling;
exports.useSystemHealthPolling = useSystemHealthPolling;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
var useCleanupManager_1 = require("../../infrastructure/hooks/useCleanupManager");
var useSafeEffect_1 = require("../../infrastructure/hooks/useSafeEffect");
/**
 * Enhanced polling hook with adaptive intervals, error handling, and lifecycle management
 * Essential fallback for real-time features when WebSocket is unavailable
 */
function usePolling(_a) {
    var _this = this;
    var queryKey = _a.queryKey, queryFn = _a.queryFn, interval = _a.interval, _b = _a.enabled, enabled = _b === void 0 ? true : _b, _c = _a.immediate, immediate = _c === void 0 ? true : _c, onSuccess = _a.onSuccess, onError = _a.onError, _d = _a.retryOnError, retryOnError = _d === void 0 ? true : _d, _e = _a.maxRetries, maxRetries = _e === void 0 ? 3 : _e, _f = _a.backoffMultiplier, backoffMultiplier = _f === void 0 ? 1.5 : _f, _g = _a.pauseOnWindowBlur, pauseOnWindowBlur = _g === void 0 ? true : _g, _h = _a.pauseOnOffline, pauseOnOffline = _h === void 0 ? true : _h, adaptiveInterval = _a.adaptiveInterval;
    var _j = (0, react_1.useState)(enabled), isPolling = _j[0], setIsPolling = _j[1];
    var _k = (0, react_1.useState)(interval), currentInterval = _k[0], setCurrentInterval = _k[1];
    var _l = (0, react_1.useState)(0), errorCount = _l[0], setErrorCount = _l[1];
    var isWindowFocusedRef = (0, react_1.useRef)(true);
    var isOnlineRef = (0, react_1.useRef)(navigator.onLine);
    var cleanupManager = (0, useCleanupManager_1.useEnhancedCleanupManager)();
    // React Query for data fetching
    var query = (0, react_query_1.useQuery)({
        queryKey: queryKey,
        queryFn: queryFn,
        enabled: false, // We'll trigger manually
        retry: false, // Handle retries ourselves
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
    // Adaptive interval calculation
    var calculateNextInterval = (0, react_1.useCallback)(function (wasError) {
        if (!adaptiveInterval)
            return interval;
        var nextInterval = currentInterval;
        if (wasError) {
            nextInterval = Math.min(nextInterval * adaptiveInterval.errorMultiplier, adaptiveInterval.max);
        }
        else {
            nextInterval = Math.max(nextInterval / adaptiveInterval.successDivider, adaptiveInterval.min);
        }
        setCurrentInterval(nextInterval);
        return nextInterval;
    }, [currentInterval, interval, adaptiveInterval]);
    // Execute query with error handling
    var executeQuery = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var data, error_1, err;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, query.refetch()];
                case 1:
                    data = _a.sent();
                    if (data.data) {
                        setErrorCount(0);
                        onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(data.data);
                        calculateNextInterval(false);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    err = error_1;
                    setErrorCount(function (prev) { return prev + 1; });
                    onError === null || onError === void 0 ? void 0 : onError(err);
                    calculateNextInterval(true);
                    // Stop polling if max retries exceeded and retryOnError is false
                    if (!retryOnError && errorCount >= maxRetries) {
                        setIsPolling(false);
                    }
                    throw err;
                case 3: return [2 /*return*/];
            }
        });
    }); }, [query, onSuccess, onError, calculateNextInterval, retryOnError, errorCount, maxRetries]);
    // Start polling
    var start = (0, react_1.useCallback)(function () {
        cleanupManager.removeCleanup('polling-interval');
        setIsPolling(true);
        setErrorCount(0);
        // Execute immediately if requested
        if (immediate) {
            executeQuery().catch(function () {
                // Error already handled in executeQuery
            });
        }
        // Set up interval
        var scheduleNext = function () {
            cleanupManager.addTimeout(function () {
                // Check if we should pause
                var shouldPause = (pauseOnWindowBlur && !isWindowFocusedRef.current) ||
                    (pauseOnOffline && !isOnlineRef.current);
                if (!shouldPause && isPolling) {
                    executeQuery()
                        .then(function () { return scheduleNext(); })
                        .catch(function () { return scheduleNext(); }); // Continue polling even on error
                }
                else {
                    scheduleNext(); // Keep checking conditions
                }
            }, currentInterval, 'polling-interval');
        };
        scheduleNext();
    }, [
        immediate,
        executeQuery,
        currentInterval,
        pauseOnWindowBlur,
        pauseOnOffline,
        isPolling,
        cleanupManager,
    ]);
    // Stop polling
    var stop = (0, react_1.useCallback)(function () {
        setIsPolling(false);
        cleanupManager.removeCleanup('polling-interval');
    }, [cleanupManager]);
    // Restart polling
    var restart = (0, react_1.useCallback)(function () {
        stop();
        setCurrentInterval(interval);
        setErrorCount(0);
        setTimeout(start, 100);
    }, [stop, start, interval]);
    // Force refetch
    var forceRefetch = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, query.refetch()];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.data];
                case 2:
                    error_2 = _a.sent();
                    return [2 /*return*/, undefined];
                case 3: return [2 /*return*/];
            }
        });
    }); }, [query]);
    // Window focus/blur handling
    (0, useSafeEffect_1.useSafeEffect)(function () {
        if (!pauseOnWindowBlur)
            return;
        var handleFocus = function () {
            isWindowFocusedRef.current = true;
            if (enabled && !isPolling) {
                start();
            }
        };
        var handleBlur = function () {
            isWindowFocusedRef.current = false;
        };
        cleanupManager.addEventListener(window, 'focus', handleFocus, undefined, 'window-focus');
        cleanupManager.addEventListener(window, 'blur', handleBlur, undefined, 'window-blur');
    }, [pauseOnWindowBlur, enabled, isPolling, start, cleanupManager]);
    // Online/offline handling
    (0, useSafeEffect_1.useSafeEffect)(function () {
        if (!pauseOnOffline)
            return;
        var handleOnline = function () {
            isOnlineRef.current = true;
            if (enabled && !isPolling) {
                start();
            }
        };
        var handleOffline = function () {
            isOnlineRef.current = false;
        };
        cleanupManager.addEventListener(window, 'online', handleOnline, undefined, 'window-online');
        cleanupManager.addEventListener(window, 'offline', handleOffline, undefined, 'window-offline');
    }, [pauseOnOffline, enabled, isPolling, start, cleanupManager]);
    // Start/stop based on enabled prop
    (0, useSafeEffect_1.useSafeEffect)(function () {
        if (enabled) {
            start();
        }
        else {
            stop();
        }
        return stop;
    }, [enabled, start, stop]);
    // Cleanup on unmount
    (0, useSafeEffect_1.useSafeEffect)(function () {
        return function () {
            cleanupManager.runAllCleanup();
        };
    }, [cleanupManager]);
    return {
        data: query.data,
        error: query.error,
        isLoading: query.isLoading,
        isPolling: isPolling,
        start: start,
        stop: stop,
        restart: restart,
        forceRefetch: forceRefetch,
        currentInterval: currentInterval,
        errorCount: errorCount,
    };
}
/**
 * Property updates polling hook
 */
function usePropertyUpdatesPolling(enabled) {
    var _this = this;
    if (enabled === void 0) { enabled = true; }
    return usePolling({
        queryKey: ['properties', 'updates', 'polling'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var token, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = localStorage.getItem('authToken');
                        return [4 /*yield*/, fetch('/api/properties/updates', {
                                headers: {
                                    'Authorization': token ? "Bearer ".concat(token) : '',
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch property updates: ".concat(response.statusText));
                        }
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        interval: 30000, // 30 seconds
        enabled: enabled,
        adaptiveInterval: {
            min: 15000, // 15 seconds minimum
            max: 120000, // 2 minutes maximum
            errorMultiplier: 2,
            successDivider: 1.2,
        },
    });
}
/**
 * Message polling hook (fallback for WebSocket)
 */
function useMessagePolling(threadId, enabled) {
    var _this = this;
    if (enabled === void 0) { enabled = true; }
    return usePolling({
        queryKey: ['messages', 'polling', threadId],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var token, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = localStorage.getItem('authToken');
                        return [4 /*yield*/, fetch("/api/messages/".concat(threadId, "/recent"), {
                                headers: {
                                    'Authorization': token ? "Bearer ".concat(token) : '',
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch messages: ".concat(response.statusText));
                        }
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        interval: 5000, // 5 seconds
        enabled: enabled,
        immediate: false, // Don't fetch immediately, let the main query handle initial load
        adaptiveInterval: {
            min: 2000, // 2 seconds minimum for active conversations
            max: 30000, // 30 seconds maximum for inactive conversations
            errorMultiplier: 2,
            successDivider: 1.1,
        },
    });
}
/**
 * Notifications polling hook
 */
function useNotificationsPolling(userId, enabled) {
    var _this = this;
    if (enabled === void 0) { enabled = true; }
    return usePolling({
        queryKey: ['notifications', 'polling', userId],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var token, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = localStorage.getItem('authToken');
                        return [4 /*yield*/, fetch('/api/notifications/unread', {
                                headers: {
                                    'Authorization': token ? "Bearer ".concat(token) : '',
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch notifications: ".concat(response.statusText));
                        }
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        interval: 60000, // 1 minute
        enabled: enabled,
        adaptiveInterval: {
            min: 30000, // 30 seconds minimum
            max: 300000, // 5 minutes maximum
            errorMultiplier: 1.5,
            successDivider: 1.1,
        },
    });
}
/**
 * Trust score polling hook
 */
function useTrustScorePolling(userId, enabled) {
    var _this = this;
    if (enabled === void 0) { enabled = true; }
    return usePolling({
        queryKey: ['trust', 'score', 'polling', userId],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var token, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = localStorage.getItem('authToken');
                        return [4 /*yield*/, fetch("/api/trust/score/".concat(userId), {
                                headers: {
                                    'Authorization': token ? "Bearer ".concat(token) : '',
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch trust score: ".concat(response.statusText));
                        }
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        interval: 300000, // 5 minutes
        enabled: enabled,
        pauseOnWindowBlur: false, // Trust scores can update in background
        adaptiveInterval: {
            min: 120000, // 2 minutes minimum
            max: 1800000, // 30 minutes maximum
            errorMultiplier: 2,
            successDivider: 1.2,
        },
    });
}
/**
 * System health polling hook
 */
function useSystemHealthPolling(enabled) {
    var _this = this;
    if (enabled === void 0) { enabled = true; }
    return usePolling({
        queryKey: ['system', 'health', 'polling'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/health')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Health check failed: ".concat(response.statusText));
                        }
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        interval: 120000, // 2 minutes
        enabled: enabled,
        retryOnError: true,
        maxRetries: 5,
        pauseOnWindowBlur: false,
        onError: function (error) {
            console.warn('System health check failed:', error);
        },
    });
}
