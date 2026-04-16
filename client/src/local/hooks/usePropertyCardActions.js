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
exports.usePropertyCardActions = usePropertyCardActions;
var react_1 = require("react");
/**
 * Enhanced shared hook for managing property card actions
 * Handles save, share, view details, verify, and card click actions with comprehensive error handling
 * Used by PropertyCard, EnhancedLandCard, and other property components
 *
 * @param property - The property to create actions for
 * @param callbacks - Action callbacks and configuration
 * @returns Action handlers and state
 */
function usePropertyCardActions(property, callbacks) {
    var _this = this;
    var _a = (0, react_1.useState)(false), isProcessing = _a[0], setIsProcessing = _a[1];
    var _b = (0, react_1.useState)(null), lastError = _b[0], setLastError = _b[1];
    // Enhanced generic action handler with comprehensive error handling
    var handleAction = (0, react_1.useCallback)(function (event, action, actionName) { return __awaiter(_this, void 0, void 0, function () {
        var error_1, actionError;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    event === null || event === void 0 ? void 0 : event.stopPropagation();
                    if (isProcessing) {
                        return [2 /*return*/]; // Prevent multiple simultaneous actions
                    }
                    setIsProcessing(true);
                    setLastError(null);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, action()];
                case 2:
                    _c.sent();
                    // Track successful action
                    (_a = callbacks.onAnalyticsEvent) === null || _a === void 0 ? void 0 : _a.call(callbacks, actionName, property.id);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _c.sent();
                    actionError = error_1 instanceof Error ? error_1 : new Error("".concat(actionName, " action failed"));
                    setLastError(actionError);
                    // Call error handler if provided
                    (_b = callbacks.onError) === null || _b === void 0 ? void 0 : _b.call(callbacks, actionName, actionError);
                    // Log error for debugging
                    console.error("".concat(actionName, " action failed:"), actionError);
                    return [3 /*break*/, 5];
                case 4:
                    setIsProcessing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [isProcessing, callbacks, property.id]);
    var handleSave = (0, react_1.useCallback)(function (event) {
        handleAction(event, function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, ((_a = callbacks.onSave) === null || _a === void 0 ? void 0 : _a.call(callbacks, property.id))];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        }); }, "save");
    }, [handleAction, callbacks, property.id]);
    var handleShare = (0, react_1.useCallback)(function (event) {
        handleAction(event, function () { return __awaiter(_this, void 0, void 0, function () {
            var shareUrl, shareTitle, shareText;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        shareUrl = "".concat(window.location.origin, "/property/").concat(property.id);
                        shareTitle = property.title || 'Property Listing';
                        shareText = "Check out this ".concat(property.type || property.category || 'property', ": ").concat(shareTitle);
                        if (!(navigator.share && ((_a = navigator.canShare) === null || _a === void 0 ? void 0 : _a.call(navigator, { title: shareTitle, text: shareText, url: shareUrl })))) return [3 /*break*/, 2];
                        return [4 /*yield*/, navigator.share({
                                title: shareTitle,
                                text: shareText,
                                url: shareUrl,
                            })];
                    case 1:
                        _c.sent();
                        return [3 /*break*/, 6];
                    case 2:
                        if (!navigator.clipboard) return [3 /*break*/, 4];
                        // Fallback to clipboard with user feedback
                        return [4 /*yield*/, navigator.clipboard.writeText(shareUrl)];
                    case 3:
                        // Fallback to clipboard with user feedback
                        _c.sent();
                        // Could show a toast notification here
                        if (process.env.NODE_ENV === 'development') {
                            console.log('Property URL copied to clipboard:', shareUrl);
                        }
                        return [3 /*break*/, 6];
                    case 4: 
                    // Final fallback to callback
                    return [4 /*yield*/, ((_b = callbacks.onShare) === null || _b === void 0 ? void 0 : _b.call(callbacks, property.id))];
                    case 5:
                        // Final fallback to callback
                        _c.sent();
                        _c.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); }, "share");
    }, [handleAction, callbacks, property.id, property.title, property.type, property.category]);
    var handleViewDetails = (0, react_1.useCallback)(function (event) {
        handleAction(event, function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, ((_a = callbacks.onViewDetails) === null || _a === void 0 ? void 0 : _a.call(callbacks, property.id))];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        }); }, "view");
    }, [handleAction, callbacks, property.id]);
    var handleVerify = (0, react_1.useCallback)(function (event) {
        handleAction(event, function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, ((_a = callbacks.onVerify) === null || _a === void 0 ? void 0 : _a.call(callbacks, property.id))];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        }); }, "verify");
    }, [handleAction, callbacks, property.id]);
    var handleCardClick = (0, react_1.useCallback)(function (event) {
        var _a, _b;
        if (callbacks.onClick && !isProcessing) {
            event.preventDefault();
            try {
                callbacks.onClick(property);
                (_a = callbacks.onAnalyticsEvent) === null || _a === void 0 ? void 0 : _a.call(callbacks, "click", property.id);
            }
            catch (error) {
                var clickError = error instanceof Error ? error : new Error('Card click failed');
                setLastError(clickError);
                (_b = callbacks.onError) === null || _b === void 0 ? void 0 : _b.call(callbacks, "click", clickError);
            }
        }
    }, [callbacks, property, isProcessing]);
    return {
        handleSave: handleSave,
        handleShare: handleShare,
        handleViewDetails: handleViewDetails,
        handleVerify: handleVerify,
        handleCardClick: handleCardClick,
        isProcessing: isProcessing,
        lastError: lastError,
    };
}
exports.default = usePropertyCardActions;
