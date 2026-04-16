"use strict";
/**
 * Form Service - Centralized form submission and validation
 * Handles all form submissions with proper error handling and validation
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
exports.formService = void 0;
var use_toast_1 = require("../hooks/use-toast");
var FormService = /** @class */ (function () {
    function FormService() {
        this.baseUrl = '/api';
    }
    /**
     * Generic form submission handler with error handling
     */
    FormService.prototype.submitForm = function (endpoint_1, data_1) {
        return __awaiter(this, arguments, void 0, function (endpoint, data, options) {
            var _a, method, _b, showSuccessToast, _c, successMessage, _d, errorMessage, response, result, error_1, message;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _a = options.method, method = _a === void 0 ? 'POST' : _a, _b = options.showSuccessToast, showSuccessToast = _b === void 0 ? true : _b, _c = options.successMessage, successMessage = _c === void 0 ? 'Form submitted successfully!' : _c, _d = options.errorMessage, errorMessage = _d === void 0 ? 'Failed to submit form. Please try again.' : _d;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch("".concat(this.baseUrl).concat(endpoint), {
                                method: method,
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(__assign(__assign({}, data), { timestamp: new Date().toISOString() })),
                            })];
                    case 2:
                        response = _e.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _e.sent();
                        if (!response.ok) {
                            throw new Error(result.message || "HTTP ".concat(response.status));
                        }
                        if (result.success) {
                            if (showSuccessToast) {
                                (0, use_toast_1.toast)({
                                    title: 'Success!',
                                    description: result.message || successMessage,
                                });
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    message: result.message || successMessage,
                                    data: result.data,
                                }];
                        }
                        else {
                            throw new Error(result.message || errorMessage);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _e.sent();
                        message = error_1 instanceof Error ? error_1.message : errorMessage;
                        (0, use_toast_1.toast)({
                            title: 'Submission Failed',
                            description: message,
                            variant: 'destructive',
                        });
                        return [2 /*return*/, {
                                success: false,
                                message: message,
                                errors: error_1 instanceof Error && 'errors' in error_1 ? error_1.errors : undefined,
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Submit contact form
     */
    FormService.prototype.submitContactForm = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Track form submission
                if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'contact_form_submit', {
                        event_category: 'Contact',
                        event_label: data.inquiryType,
                    });
                }
                return [2 /*return*/, this.submitForm('/contact', data, {
                        successMessage: "Thank you for contacting us! We'll get back to you within 24 hours.",
                    })];
            });
        });
    };
    /**
     * Submit sales inquiry
     */
    FormService.prototype.submitSalesInquiry = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Track sales inquiry
                if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'sales_inquiry', {
                        event_category: 'B2B',
                        event_label: 'contact_sales_form',
                        custom_parameters: {
                            company: data.company,
                            role: data.role,
                            use_case: data.useCase,
                            monthly_volume: data.monthlyVolume,
                        },
                    });
                }
                return [2 /*return*/, this.submitForm('/b2b/sales-inquiry', data, {
                        successMessage: 'Thank you for your interest! Our sales team will contact you within 24 hours.',
                    })];
            });
        });
    };
    /**
     * Submit verification request
     */
    FormService.prototype.submitVerificationRequest = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.submitForm('/trust/verification-request', data, {
                        successMessage: 'Verification request submitted successfully! You will receive updates via email.',
                    })];
            });
        });
    };
    /**
     * Submit review
     */
    FormService.prototype.submitReview = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.submitForm('/reviews', data, {
                        successMessage: 'Thank you for your review! It helps other users make informed decisions.',
                    })];
            });
        });
    };
    /**
     * Subscribe to property alerts
     */
    FormService.prototype.subscribeToAlerts = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.submitForm('/alerts/subscribe', data, {
                        successMessage: 'Alert subscription created! You will receive notifications based on your preferences.',
                    })];
            });
        });
    };
    /**
     * Update user profile
     */
    FormService.prototype.updateUserProfile = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.submitForm('/users/profile', data, {
                        method: 'PATCH',
                        successMessage: 'Profile updated successfully!',
                    })];
            });
        });
    };
    /**
     * Submit property listing
     */
    FormService.prototype.submitPropertyListing = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.submitForm('/properties', data, {
                        successMessage: 'Property listing submitted successfully! It will be reviewed and published shortly.',
                    })];
            });
        });
    };
    /**
     * Submit document for verification
     */
    FormService.prototype.submitDocumentVerification = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, error_2, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.baseUrl, "/documents/verify"), {
                                method: 'POST',
                                body: data, // FormData for file uploads
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        if (!response.ok) {
                            throw new Error(result.message || "HTTP ".concat(response.status));
                        }
                        if (result.success) {
                            (0, use_toast_1.toast)({
                                title: 'Document Uploaded',
                                description: 'Your document has been uploaded and is being verified.',
                            });
                            return [2 /*return*/, {
                                    success: true,
                                    message: result.message || 'Document uploaded successfully',
                                    data: result.data,
                                }];
                        }
                        else {
                            throw new Error(result.message || 'Failed to upload document');
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        message = error_2 instanceof Error ? error_2.message : 'Failed to upload document';
                        (0, use_toast_1.toast)({
                            title: 'Upload Failed',
                            description: message,
                            variant: 'destructive',
                        });
                        return [2 /*return*/, {
                                success: false,
                                message: message,
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate form data before submission
     */
    FormService.prototype.validateFormData = function (data, requiredFields, validationRules) {
        var errors = {};
        // Check required fields
        for (var _i = 0, requiredFields_1 = requiredFields; _i < requiredFields_1.length; _i++) {
            var field = requiredFields_1[_i];
            if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
                errors[field] = 'This field is required';
            }
        }
        // Apply custom validation rules
        if (validationRules) {
            for (var _a = 0, _b = Object.entries(validationRules); _a < _b.length; _a++) {
                var _c = _b[_a], field = _c[0], validator = _c[1];
                if (data[field] && !errors[field]) {
                    var error = validator(data[field]);
                    if (error) {
                        errors[field] = error;
                    }
                }
            }
        }
        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors,
        };
    };
    /**
     * Common validation rules
     */
    FormService.validationRules = {
        email: function (value) {
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value) ? null : 'Please enter a valid email address';
        },
        phone: function (value) {
            var phoneRegex = /^(\+254|0)[17]\d{8}$/; // Kenyan phone number format
            return phoneRegex.test(value.replace(/\s/g, '')) ? null : 'Please enter a valid phone number';
        },
        required: function (value) {
            return value && value.toString().trim() ? null : 'This field is required';
        },
        minLength: function (min) { return function (value) {
            return value && value.length >= min ? null : "Must be at least ".concat(min, " characters");
        }; },
        maxLength: function (max) { return function (value) {
            return value && value.length <= max ? null : "Must be no more than ".concat(max, " characters");
        }; },
        rating: function (value) {
            return value >= 1 && value <= 5 ? null : 'Rating must be between 1 and 5';
        },
    };
    return FormService;
}());
// Export singleton instance
exports.formService = new FormService();
exports.default = exports.formService;
