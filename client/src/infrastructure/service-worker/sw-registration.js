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
exports.offlineStorage = exports.serviceWorkerManager = void 0;
exports.useServiceWorker = useServiceWorker;
exports.useNetworkStatus = useNetworkStatus;
var react_1 = require("react");
var ServiceWorkerManager = /** @class */ (function () {
    function ServiceWorkerManager(config) {
        this.registration = null;
        this.config = config;
    }
    // Register service worker
    ServiceWorkerManager.prototype.register = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_1;
            var _this = this;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!('serviceWorker' in navigator)) {
                            console.log('Service Worker not supported');
                            return [2 /*return*/, null];
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        _a = this;
                        return [4 /*yield*/, navigator.serviceWorker.register(this.config.swUrl)];
                    case 2:
                        _a.registration = _d.sent();
                        console.log('Service Worker registered:', this.registration);
                        // Handle updates
                        this.registration.addEventListener('updatefound', function () {
                            var installingWorker = _this.registration.installing;
                            if (installingWorker) {
                                installingWorker.addEventListener('statechange', function () {
                                    var _a, _b, _c, _d;
                                    if (installingWorker.state === 'installed') {
                                        if (navigator.serviceWorker.controller) {
                                            // New content available
                                            console.log('New content available, please refresh');
                                            (_b = (_a = _this.config).onUpdate) === null || _b === void 0 ? void 0 : _b.call(_a, _this.registration);
                                        }
                                        else {
                                            // Content cached for offline use
                                            console.log('Content cached for offline use');
                                            (_d = (_c = _this.config).onSuccess) === null || _d === void 0 ? void 0 : _d.call(_c, _this.registration);
                                        }
                                    }
                                });
                            }
                        });
                        return [2 /*return*/, this.registration];
                    case 3:
                        error_1 = _d.sent();
                        console.error('Service Worker registration failed:', error_1);
                        (_c = (_b = this.config).onError) === null || _c === void 0 ? void 0 : _c.call(_b, error_1);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Unregister service worker
    ServiceWorkerManager.prototype.unregister = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.registration) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.registration.unregister()];
                    case 1:
                        result = _a.sent();
                        console.log('Service Worker unregistered:', result);
                        return [2 /*return*/, result];
                    case 2: return [2 /*return*/, false];
                }
            });
        });
    };
    // Check for updates
    ServiceWorkerManager.prototype.checkForUpdates = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.registration) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.registration.update()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // Skip waiting and activate new service worker
    ServiceWorkerManager.prototype.skipWaiting = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.registration && this.registration.waiting) {
                    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                return [2 /*return*/];
            });
        });
    };
    // Get registration status
    ServiceWorkerManager.prototype.getRegistration = function () {
        return this.registration;
    };
    // Check if service worker is active
    ServiceWorkerManager.prototype.isActive = function () {
        return !!(this.registration && this.registration.active);
    };
    return ServiceWorkerManager;
}());
// Default configuration
var defaultConfig = {
    swUrl: '/sw.js',
    onUpdate: function (registration) {
        // Show update notification
        if (window.confirm('New version available! Click OK to update.')) {
            window.location.reload();
        }
    },
    onSuccess: function (registration) {
        console.log('App is ready for offline use');
    },
    onError: function (error) {
        console.error('Service Worker error:', error);
    },
};
// Singleton service worker manager
exports.serviceWorkerManager = new ServiceWorkerManager(defaultConfig);
// React hook for service worker
function useServiceWorker() {
    var _this = this;
    var _a = react_1.default.useState(false), isRegistered = _a[0], setIsRegistered = _a[1];
    var _b = react_1.default.useState(false), isUpdateAvailable = _b[0], setIsUpdateAvailable = _b[1];
    var _c = react_1.default.useState(null), registration = _c[0], setRegistration = _c[1];
    react_1.default.useEffect(function () {
        var config = __assign(__assign({}, defaultConfig), { onSuccess: function (reg) {
                var _a;
                setIsRegistered(true);
                setRegistration(reg);
                (_a = defaultConfig.onSuccess) === null || _a === void 0 ? void 0 : _a.call(defaultConfig, reg);
            }, onUpdate: function (reg) {
                var _a;
                setIsUpdateAvailable(true);
                setRegistration(reg);
                (_a = defaultConfig.onUpdate) === null || _a === void 0 ? void 0 : _a.call(defaultConfig, reg);
            }, onError: function (error) {
                var _a;
                setIsRegistered(false);
                (_a = defaultConfig.onError) === null || _a === void 0 ? void 0 : _a.call(defaultConfig, error);
            } });
        var manager = new ServiceWorkerManager(config);
        manager.register();
        return function () {
            // Cleanup if needed
        };
    }, []);
    var updateApp = react_1.default.useCallback(function () {
        if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }, [registration]);
    var checkForUpdates = react_1.default.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!registration) return [3 /*break*/, 2];
                    return [4 /*yield*/, registration.update()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); }, [registration]);
    return {
        isRegistered: isRegistered,
        isUpdateAvailable: isUpdateAvailable,
        updateApp: updateApp,
        checkForUpdates: checkForUpdates,
    };
}
// Offline storage utilities
exports.offlineStorage = {
    // Store action for background sync
    storeOfflineAction: function (action) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if ('indexedDB' in window) {
                // Store in IndexedDB for background sync
                // Implementation would use IndexedDB
                console.log('Storing offline action:', action);
            }
            return [2 /*return*/];
        });
    }); },
    // Get stored offline actions
    getOfflineActions: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if ('indexedDB' in window) {
                // Retrieve from IndexedDB
                // Implementation would use IndexedDB
                return [2 /*return*/, []];
            }
            return [2 /*return*/, []];
        });
    }); },
    // Clear offline actions
    clearOfflineActions: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if ('indexedDB' in window) {
                // Clear IndexedDB
                // Implementation would use IndexedDB
                console.log('Clearing offline actions');
            }
            return [2 /*return*/];
        });
    }); },
};
// Network status utilities
function useNetworkStatus() {
    var _a = react_1.default.useState(navigator.onLine), isOnline = _a[0], setIsOnline = _a[1];
    react_1.default.useEffect(function () {
        var handleOnline = function () { return setIsOnline(true); };
        var handleOffline = function () { return setIsOnline(false); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return function () {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    return isOnline;
}
