"use strict";
/**
 * Error Recovery Hook
 * Provides error handling and recovery mechanisms for components
 */
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
exports.useFormErrorRecovery = exports.useApiErrorRecovery = exports.useNetworkErrorRecovery = exports.useErrorRecovery = void 0;
var react_1 = require("react");
var useErrorRecovery = function (options) {
    if (options === void 0) { options = {}; }
    var _a = options.maxRetries, maxRetries = _a === void 0 ? 3 : _a, _b = options.retryDelay, retryDelay = _b === void 0 ? 1000 : _b, _c = options.exponentialBackoff, exponentialBackoff = _c === void 0 ? true : _c, onError = options.onError, onSuccess = options.onSuccess, onMaxRetriesReached = options.onMaxRetriesReached;
    var _d = (0, react_1.useState)({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: true,
        lastAttempt: null
    }), state = _d[0], setState = _d[1];
    var retryTimeoutRef = (0, react_1.useRef)();
    var calculateDelay = (0, react_1.useCallback)(function (attempt) {
        if (!exponentialBackoff)
            return retryDelay;
        return Math.min(retryDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
    }, [retryDelay, exponentialBackoff]);
    var handleError = (0, react_1.useCallback)(function (error) {
        var newRetryCount = state.retryCount + 1;
        var canRetry = newRetryCount < maxRetries;
        setState(function (prev) { return (__assign(__assign({}, prev), { error: error, retryCount: newRetryCount, canRetry: canRetry, lastAttempt: new Date() })); });
        onError === null || onError === void 0 ? void 0 : onError(error, newRetryCount);
        if (!canRetry) {
            onMaxRetriesReached === null || onMaxRetriesReached === void 0 ? void 0 : onMaxRetriesReached(error);
        }
    }, [state.retryCount, maxRetries, onError, onMaxRetriesReached]);
    var retry = (0, react_1.useCallback)(function (operation) { return __awaiter(void 0, void 0, void 0, function () {
        var delay_1, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!state.canRetry || state.isRetrying) {
                        return [2 /*return*/];
                    }
                    setState(function (prev) { return (__assign(__assign({}, prev), { isRetrying: true })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    delay_1 = calculateDelay(state.retryCount);
                    return [4 /*yield*/, new Promise(function (resolve) {
                            retryTimeoutRef.current = setTimeout(resolve, delay_1);
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, operation()];
                case 3:
                    result = _a.sent();
                    setState({
                        error: null,
                        isRetrying: false,
                        retryCount: 0,
                        canRetry: true,
                        lastAttempt: new Date()
                    });
                    onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
                    return [2 /*return*/, result];
                case 4:
                    error_1 = _a.sent();
                    setState(function (prev) { return (__assign(__assign({}, prev), { isRetrying: false })); });
                    handleError(error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    }); }, [state.canRetry, state.isRetrying, state.retryCount, calculateDelay, handleError, onSuccess]);
    var reset = (0, react_1.useCallback)(function () {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
        setState({
            error: null,
            isRetrying: false,
            retryCount: 0,
            canRetry: true,
            lastAttempt: null
        });
    }, []);
    var executeWithRetry = (0, react_1.useCallback)(function (operation) { return __awaiter(void 0, void 0, void 0, function () {
        var result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, operation()];
                case 1:
                    result = _a.sent();
                    if (state.error) {
                        reset(); // Clear any previous errors on success
                    }
                    return [2 /*return*/, result];
                case 2:
                    error_2 = _a.sent();
                    handleError(error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    }); }, [state.error, reset, handleError]);
    // Cleanup timeout on unmount
    (0, react_1.useEffect)(function () {
        return function () {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);
    return __assign(__assign({}, state), { handleError: handleError, retry: retry, reset: reset, executeWithRetry: executeWithRetry });
};
exports.useErrorRecovery = useErrorRecovery;
/**
 * Hook for network error handling with offline detection
 */
var useNetworkErrorRecovery = function () {
    var _a = (0, react_1.useState)(navigator.onLine), isOnline = _a[0], setIsOnline = _a[1];
    var _b = (0, react_1.useState)('good'), connectionQuality = _b[0], setConnectionQuality = _b[1];
    var errorRecovery = (0, exports.useErrorRecovery)({
        maxRetries: 5,
        retryDelay: 2000,
        exponentialBackoff: true,
        onError: function (error, attempt) {
            // Adjust retry strategy based on network conditions
            if (!isOnline) {
                setConnectionQuality('offline');
            }
            else if (error.message.includes('timeout') || error.message.includes('network')) {
                setConnectionQuality('poor');
            }
        }
    });
    (0, react_1.useEffect)(function () {
        var handleOnline = function () {
            setIsOnline(true);
            setConnectionQuality('good');
            errorRecovery.reset();
        };
        var handleOffline = function () {
            setIsOnline(false);
            setConnectionQuality('offline');
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return function () {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [errorRecovery]);
    var executeNetworkOperation = (0, react_1.useCallback)(function (operation) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!isOnline) {
                throw new Error('No internet connection. Please check your network and try again.');
            }
            return [2 /*return*/, errorRecovery.executeWithRetry(operation)];
        });
    }); }, [isOnline, errorRecovery]);
    return __assign(__assign({}, errorRecovery), { isOnline: isOnline, connectionQuality: connectionQuality, executeNetworkOperation: executeNetworkOperation });
};
exports.useNetworkErrorRecovery = useNetworkErrorRecovery;
/**
 * Hook for API error handling with specific error types
 */
var useApiErrorRecovery = function () {
    var errorRecovery = (0, exports.useErrorRecovery)({
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true
    });
    var handleApiError = (0, react_1.useCallback)(function (error) {
        var errorMessage = 'An unexpected error occurred';
        var shouldRetry = true;
        if (error.response) {
            var status_1 = error.response.status;
            switch (status_1) {
                case 400:
                    errorMessage = 'Invalid request. Please check your input and try again.';
                    shouldRetry = false;
                    break;
                case 401:
                    errorMessage = 'Authentication required. Please log in and try again.';
                    shouldRetry = false;
                    // Redirect to login
                    window.location.href = '/login';
                    break;
                case 403:
                    errorMessage = 'You do not have permission to perform this action.';
                    shouldRetry = false;
                    break;
                case 404:
                    errorMessage = 'The requested resource was not found.';
                    shouldRetry = false;
                    break;
                case 429:
                    errorMessage = 'Too many requests. Please wait a moment and try again.';
                    shouldRetry = true;
                    break;
                case 500:
                    errorMessage = 'Server error. Please try again later.';
                    shouldRetry = true;
                    break;
                case 502:
                case 503:
                case 504:
                    errorMessage = 'Service temporarily unavailable. Please try again later.';
                    shouldRetry = true;
                    break;
                default:
                    errorMessage = "Request failed with status ".concat(status_1);
                    shouldRetry = status_1 >= 500;
            }
        }
        else if (error.request) {
            errorMessage = 'Network error. Please check your connection and try again.';
            shouldRetry = true;
        }
        else {
            errorMessage = error.message || 'An unexpected error occurred';
            shouldRetry = false;
        }
        var enhancedError = new Error(errorMessage);
        enhancedError.shouldRetry = shouldRetry;
        enhancedError.originalError = error;
        if (shouldRetry) {
            errorRecovery.handleError(enhancedError);
        }
        else {
            errorRecovery.handleError(enhancedError);
            // Don't allow retries for client errors
            return __assign(__assign({}, errorRecovery), { canRetry: false });
        }
        return errorRecovery;
    }, [errorRecovery]);
    var executeApiCall = (0, react_1.useCallback)(function (apiCall) { return __awaiter(void 0, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, errorRecovery.executeWithRetry(apiCall)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_3 = _a.sent();
                    return [2 /*return*/, handleApiError(error_3)];
                case 3: return [2 /*return*/];
            }
        });
    }); }, [errorRecovery, handleApiError]);
    return __assign(__assign({}, errorRecovery), { handleApiError: handleApiError, executeApiCall: executeApiCall });
};
exports.useApiErrorRecovery = useApiErrorRecovery;
/**
 * Hook for form submission error handling
 */
var useFormErrorRecovery = function () {
    var _a = (0, react_1.useState)({}), fieldErrors = _a[0], setFieldErrors = _a[1];
    var _b = (0, react_1.useState)(null), submitError = _b[0], setSubmitError = _b[1];
    var errorRecovery = (0, exports.useErrorRecovery)({
        maxRetries: 2,
        retryDelay: 1000,
        exponentialBackoff: false
    });
    var handleFormError = (0, react_1.useCallback)(function (error) {
        var _a, _b, _c, _d;
        setSubmitError(null);
        setFieldErrors({});
        if ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.errors) {
            // Handle validation errors
            var errors = error.response.data.errors;
            if (typeof errors === 'object') {
                setFieldErrors(errors);
            }
            else {
                setSubmitError('Please correct the errors and try again.');
            }
        }
        else if ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) {
            setSubmitError(error.response.data.message);
        }
        else {
            setSubmitError(error.message || 'Failed to submit form. Please try again.');
            errorRecovery.handleError(error);
        }
    }, [errorRecovery]);
    var clearErrors = (0, react_1.useCallback)(function () {
        setFieldErrors({});
        setSubmitError(null);
        errorRecovery.reset();
    }, [errorRecovery]);
    var submitForm = (0, react_1.useCallback)(function (submitFunction) { return __awaiter(void 0, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearErrors();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, errorRecovery.executeWithRetry(submitFunction)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_4 = _a.sent();
                    handleFormError(error_4);
                    throw error_4;
                case 4: return [2 /*return*/];
            }
        });
    }); }, [errorRecovery, clearErrors, handleFormError]);
    return __assign(__assign({}, errorRecovery), { fieldErrors: fieldErrors, submitError: submitError, handleFormError: handleFormError, clearErrors: clearErrors, submitForm: submitForm });
};
exports.useFormErrorRecovery = useFormErrorRecovery;
