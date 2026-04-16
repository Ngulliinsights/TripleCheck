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
exports.useGeolocation = useGeolocation;
exports.usePropertyLocation = usePropertyLocation;
exports.useLocationBasedSearch = useLocationBasedSearch;
exports.useGeocoding = useGeocoding;
var react_1 = require("react");
var useCleanupManager_1 = require("../../infrastructure/hooks/useCleanupManager");
var useSafeEffect_1 = require("../../infrastructure/hooks/useSafeEffect");
/**
 * Enhanced geolocation hook with distance calculations and property proximity features
 * Essential for location-based property search and mapping functionality
 */
function useGeolocation(_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.enableHighAccuracy, enableHighAccuracy = _c === void 0 ? true : _c, _d = _b.timeout, timeout = _d === void 0 ? 10000 : _d, _e = _b.maximumAge, maximumAge = _e === void 0 ? 300000 : _e, // 5 minutes
    _f = _b.watch, // 5 minutes
    watch = _f === void 0 ? false : _f, onSuccess = _b.onSuccess, onError = _b.onError;
    var _g = (0, react_1.useState)(null), position = _g[0], setPosition = _g[1];
    var _h = (0, react_1.useState)(null), error = _h[0], setError = _h[1];
    var _j = (0, react_1.useState)(false), loading = _j[0], setLoading = _j[1];
    var watchIdRef = (0, react_1.useRef)(null);
    var supported = 'geolocation' in navigator;
    var options = {
        enableHighAccuracy: enableHighAccuracy,
        timeout: timeout,
        maximumAge: maximumAge,
    };
    // Convert native position to our format
    var convertPosition = (0, react_1.useCallback)(function (nativePosition) {
        var _a, _b;
        var coords = nativePosition.coords, timestamp = nativePosition.timestamp;
        return __assign(__assign(__assign({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, altitude: (_a = coords.altitude) !== null && _a !== void 0 ? _a : 0, altitudeAccuracy: (_b = coords.altitudeAccuracy) !== null && _b !== void 0 ? _b : 0 }, (coords.heading !== null && { heading: coords.heading })), (coords.speed !== null && { speed: coords.speed })), { timestamp: timestamp });
    }, []);
    // Success handler
    var handleSuccess = (0, react_1.useCallback)(function (nativePosition) {
        var convertedPosition = convertPosition(nativePosition);
        setPosition(convertedPosition);
        setError(null);
        setLoading(false);
        onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(convertedPosition);
    }, [convertPosition, onSuccess]);
    // Error handler
    var handleError = (0, react_1.useCallback)(function (err) {
        setError(err);
        setLoading(false);
        onError === null || onError === void 0 ? void 0 : onError(err);
    }, [onError]);
    // Get current position
    var getCurrentPosition = (0, react_1.useCallback)(function () {
        return new Promise(function (resolve, reject) {
            if (!supported) {
                var error_1 = {
                    code: 0,
                    message: 'Geolocation is not supported',
                    PERMISSION_DENIED: 1,
                    POSITION_UNAVAILABLE: 2,
                    TIMEOUT: 3,
                };
                reject(error_1);
                return;
            }
            setLoading(true);
            setError(null);
            navigator.geolocation.getCurrentPosition(function (nativePosition) {
                var convertedPosition = convertPosition(nativePosition);
                setPosition(convertedPosition);
                setLoading(false);
                onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(convertedPosition);
                resolve(convertedPosition);
            }, function (err) {
                setError(err);
                setLoading(false);
                onError === null || onError === void 0 ? void 0 : onError(err);
                reject(err);
            }, options);
        });
    }, [supported, convertPosition, onSuccess, onError, options]);
    // Watch position
    var watchPosition = (0, react_1.useCallback)(function () {
        if (!supported || watchIdRef.current !== null) {
            return;
        }
        setLoading(true);
        setError(null);
        watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    }, [supported, handleSuccess, handleError, options]);
    // Clear watch
    var clearWatch = (0, react_1.useCallback)(function () {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setLoading(false);
        }
    }, []);
    // Calculate distance between two points using Haversine formula
    var calculateDistance = (0, react_1.useCallback)(function (lat2, lon2) {
        if (!position)
            return null;
        var lat1 = position.latitude, lon1 = position.longitude;
        var R = 6371; // Earth's radius in kilometers
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var distance = R * c;
        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    }, [position]);
    // Check if a location is within a certain radius
    var isNearby = (0, react_1.useCallback)(function (lat2, lon2, radiusKm) {
        var distance = calculateDistance(lat2, lon2);
        return distance !== null ? distance <= radiusKm : null;
    }, [calculateDistance]);
    // Auto-start watching if enabled
    (0, useSafeEffect_1.useSafeEffect)(function () {
        if (watch && supported) {
            watchPosition();
        }
        return function () {
            clearWatch();
        };
    }, [watch, supported, watchPosition, clearWatch]);
    // Cleanup on unmount
    (0, useSafeEffect_1.useSafeEffect)(function () {
        return function () {
            clearWatch();
        };
    }, [clearWatch]);
    return {
        position: position,
        error: error,
        loading: loading,
        supported: supported,
        getCurrentPosition: getCurrentPosition,
        watchPosition: watchPosition,
        clearWatch: clearWatch,
        calculateDistance: calculateDistance,
        isNearby: isNearby,
    };
}
/**
 * Property location hook with distance calculations
 */
function usePropertyLocation(propertyLocation) {
    var geolocation = useGeolocation({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 600000, // 10 minutes for property searches
    });
    var distanceToProperty = propertyLocation && geolocation.position
        ? geolocation.calculateDistance(propertyLocation.latitude, propertyLocation.longitude)
        : null;
    var isPropertyNearby = function (radiusKm) {
        if (radiusKm === void 0) { radiusKm = 5; }
        return propertyLocation && geolocation.position
            ? geolocation.isNearby(propertyLocation.latitude, propertyLocation.longitude, radiusKm)
            : null;
    };
    return __assign(__assign({}, geolocation), { distanceToProperty: distanceToProperty, isPropertyNearby: isPropertyNearby });
}
/**
 * Location-based property search hook
 */
function useLocationBasedSearch() {
    var _this = this;
    var _a = (0, react_1.useState)(10), searchRadius = _a[0], setSearchRadius = _a[1]; // Default 10km radius
    var _b = (0, react_1.useState)([]), nearbyProperties = _b[0], setNearbyProperties = _b[1];
    var _c = (0, react_1.useState)(false), loading = _c[0], setLoading = _c[1];
    var cleanupManager = (0, useCleanupManager_1.useEnhancedCleanupManager)();
    var geolocation = useGeolocation({
        enableHighAccuracy: true,
        timeout: 10000,
    });
    var searchNearbyProperties = (0, react_1.useCallback)(function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (radius) {
            var controller, _a, latitude, longitude, token, response, data, propertiesWithDistance, error_2;
            if (radius === void 0) { radius = searchRadius; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!geolocation.position) return [3 /*break*/, 2];
                        return [4 /*yield*/, geolocation.getCurrentPosition()];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                    case 2:
                        setLoading(true);
                        controller = new AbortController();
                        cleanupManager.addAbortController(controller, 'nearby-search');
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 6, 7, 8]);
                        _a = geolocation.position, latitude = _a.latitude, longitude = _a.longitude;
                        token = localStorage.getItem('authToken');
                        return [4 /*yield*/, fetch("/api/properties/nearby?lat=".concat(latitude, "&lon=").concat(longitude, "&radius=").concat(radius), {
                                headers: {
                                    'Authorization': token ? "Bearer ".concat(token) : '',
                                    'Content-Type': 'application/json',
                                },
                                signal: controller.signal,
                            })];
                    case 4:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("Failed to search nearby properties: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 5:
                        data = _b.sent();
                        propertiesWithDistance = data.properties.map(function (property) { return (__assign(__assign({}, property), { distance: geolocation.calculateDistance(property.latitude, property.longitude) })); });
                        // Sort by distance
                        propertiesWithDistance.sort(function (a, b) { return (a.distance || 0) - (b.distance || 0); });
                        setNearbyProperties(propertiesWithDistance);
                        return [3 /*break*/, 8];
                    case 6:
                        error_2 = _b.sent();
                        if (error_2 instanceof Error && error_2.name === 'AbortError') {
                            return [2 /*return*/]; // Request was cancelled
                        }
                        console.error('Error searching nearby properties:', error_2);
                        setNearbyProperties([]);
                        return [3 /*break*/, 8];
                    case 7:
                        setLoading(false);
                        cleanupManager.removeCleanup('nearby-search');
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }, [geolocation, searchRadius, cleanupManager]);
    var updateSearchRadius = (0, react_1.useCallback)(function (radius) {
        setSearchRadius(radius);
        if (geolocation.position) {
            searchNearbyProperties(radius);
        }
    }, [geolocation.position, searchNearbyProperties]);
    return {
        position: geolocation.position,
        error: geolocation.error,
        loading: loading || geolocation.loading,
        supported: geolocation.supported,
        searchRadius: searchRadius,
        nearbyProperties: nearbyProperties,
        searchNearbyProperties: searchNearbyProperties,
        updateSearchRadius: updateSearchRadius,
        getCurrentPosition: geolocation.getCurrentPosition,
    };
}
/**
 * Address geocoding hook
 */
function useGeocoding() {
    var _this = this;
    var _a = (0, react_1.useState)(false), loading = _a[0], setLoading = _a[1];
    var _b = (0, react_1.useState)(null), error = _b[0], setError = _b[1];
    var cleanupManager = (0, useCleanupManager_1.useEnhancedCleanupManager)();
    var geocodeAddress = (0, react_1.useCallback)(function (address) { return __awaiter(_this, void 0, void 0, function () {
        var controller, response, data, result, err_1, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    controller = new AbortController();
                    cleanupManager.addAbortController(controller, 'geocode-request');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/geocode?address=".concat(encodeURIComponent(address)), {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            signal: controller.signal,
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Geocoding failed: ".concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (data.results && data.results.length > 0) {
                        result = data.results[0];
                        return [2 /*return*/, {
                                latitude: result.geometry.location.lat,
                                longitude: result.geometry.location.lng,
                                accuracy: 100, // Estimated accuracy for geocoded addresses
                                timestamp: Date.now(),
                            }];
                    }
                    return [2 /*return*/, null];
                case 4:
                    err_1 = _a.sent();
                    if (err_1 instanceof Error && err_1.name === 'AbortError') {
                        return [2 /*return*/, null]; // Request was cancelled
                    }
                    errorMessage = err_1 instanceof Error ? err_1.message : 'Geocoding failed';
                    setError(errorMessage);
                    return [2 /*return*/, null];
                case 5:
                    setLoading(false);
                    cleanupManager.removeCleanup('geocode-request');
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [cleanupManager]);
    var reverseGeocode = (0, react_1.useCallback)(function (latitude, longitude) { return __awaiter(_this, void 0, void 0, function () {
        var controller, response, data, err_2, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    controller = new AbortController();
                    cleanupManager.addAbortController(controller, 'reverse-geocode-request');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/reverse-geocode?lat=".concat(latitude, "&lon=").concat(longitude), {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            signal: controller.signal,
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Reverse geocoding failed: ".concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (data.results && data.results.length > 0) {
                        return [2 /*return*/, data.results[0].formatted_address];
                    }
                    return [2 /*return*/, null];
                case 4:
                    err_2 = _a.sent();
                    if (err_2 instanceof Error && err_2.name === 'AbortError') {
                        return [2 /*return*/, null]; // Request was cancelled
                    }
                    errorMessage = err_2 instanceof Error ? err_2.message : 'Reverse geocoding failed';
                    setError(errorMessage);
                    return [2 /*return*/, null];
                case 5:
                    setLoading(false);
                    cleanupManager.removeCleanup('reverse-geocode-request');
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [cleanupManager]);
    return {
        loading: loading,
        error: error,
        geocodeAddress: geocodeAddress,
        reverseGeocode: reverseGeocode,
    };
}
