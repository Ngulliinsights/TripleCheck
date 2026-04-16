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
exports.commonValidationRules = void 0;
exports.useFormValidation = useFormValidation;
var react_1 = require("react");
// Utility function to safely convert values to strings with null checks
function safeStringValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    return String(value);
}
// Utility function to check if a value is considered empty
function isEmpty(value) {
    if (value === null || value === undefined) {
        return true;
    }
    if (typeof value === 'string') {
        return value.trim() === '';
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    if (typeof value === 'object') {
        return Object.keys(value).length === 0;
    }
    return false;
}
function useFormValidation(_a) {
    var _this = this;
    var initialData = _a.initialData, validationRules = _a.validationRules, onSubmit = _a.onSubmit, _b = _a.validateOnChange, validateOnChange = _b === void 0 ? false : _b, _c = _a.validateOnBlur, validateOnBlur = _c === void 0 ? true : _c, transformData = _a.transformData, _d = _a.resetOnSuccess, resetOnSuccess = _d === void 0 ? false : _d, _e = _a.preventDoubleSubmit, preventDoubleSubmit = _e === void 0 ? true : _e;
    // Core state management with proper initialization
    var _f = (0, react_1.useState)(function () { return (__assign({}, initialData)); }), data = _f[0], setData = _f[1];
    var _g = (0, react_1.useState)(function () {
        return Object.keys(initialData).reduce(function (acc, key) {
            acc[key] = '';
            return acc;
        }, {});
    }), errors = _g[0], setErrors = _g[1];
    var _h = (0, react_1.useState)(function () {
        return Object.keys(initialData).reduce(function (acc, key) {
            acc[key] = false;
            return acc;
        }, {});
    }), touched = _h[0], setTouchedState = _h[1];
    var _j = (0, react_1.useState)(false), isSubmitting = _j[0], setIsSubmitting = _j[1];
    var _k = (0, react_1.useState)(false), isValidating = _k[0], setIsValidating = _k[1];
    var _l = (0, react_1.useState)(0), submitCount = _l[0], setSubmitCount = _l[1];
    var _m = (0, react_1.useState)(), lastSubmissionTime = _m[0], setLastSubmissionTime = _m[1];
    // Refs for managing async operations and preventing memory leaks
    var debounceTimers = (0, react_1.useRef)({});
    var validationAbortControllers = (0, react_1.useRef)({});
    var initialDataRef = (0, react_1.useRef)(initialData);
    // Update initial data ref when it changes
    (0, react_1.useEffect)(function () {
        initialDataRef.current = initialData;
    }, [initialData]);
    // Enhanced validation function with async support and better error handling
    var validateField = (0, react_1.useCallback)(function (field, value) { return __awaiter(_this, void 0, void 0, function () {
        var fieldKey, rule, stringValue, valueToCheck, customResult;
        return __generator(this, function (_a) {
            fieldKey = field;
            rule = validationRules[fieldKey];
            if (!rule)
                return [2 /*return*/, null];
            // Check conditional validation
            if (rule.when && !rule.when(data)) {
                return [2 /*return*/, null];
            }
            // Required validation with type-safe empty checking
            if (rule.required && isEmpty(value)) {
                return [2 /*return*/, 'This field is required'];
            }
            // Skip other validations if field is empty and not required
            if (isEmpty(value)) {
                return [2 /*return*/, null];
            }
            stringValue = safeStringValue(value);
            // String-specific validations
            if (typeof value === 'string' || stringValue) {
                valueToCheck = typeof value === 'string' ? value : stringValue;
                // Min length validation
                if (rule.minLength !== undefined && valueToCheck.length < rule.minLength) {
                    return [2 /*return*/, "Must be at least ".concat(rule.minLength, " characters")];
                }
                // Max length validation
                if (rule.maxLength !== undefined && valueToCheck.length > rule.maxLength) {
                    return [2 /*return*/, "Must be no more than ".concat(rule.maxLength, " characters")];
                }
                // Pattern validation with safe regex testing
                if (rule.pattern) {
                    try {
                        if (!rule.pattern.test(valueToCheck)) {
                            return [2 /*return*/, 'Invalid format'];
                        }
                    }
                    catch (regexError) {
                        console.warn("Regex validation error for field ".concat(fieldKey, ":"), regexError);
                        return [2 /*return*/, 'Validation error occurred'];
                    }
                }
            }
            // Custom validation with error handling
            if (rule.custom) {
                try {
                    customResult = rule.custom(value, data);
                    return [2 /*return*/, customResult];
                }
                catch (customError) {
                    console.error("Custom validation error for field ".concat(fieldKey, ":"), customError);
                    return [2 /*return*/, 'Validation error occurred'];
                }
            }
            return [2 /*return*/, null];
        });
    }); }, [validationRules, data]);
    // Debounced validation for expensive operations
    var validateFieldDebounced = (0, react_1.useCallback)(function (field, value) { return __awaiter(_this, void 0, void 0, function () {
        var fieldKey, rule, error_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fieldKey = field;
                    rule = validationRules[fieldKey];
                    if (!(!rule || !rule.debounce)) return [3 /*break*/, 2];
                    return [4 /*yield*/, validateField(field, value)];
                case 1:
                    error_1 = _a.sent();
                    setErrors(function (prev) {
                        var _a;
                        return (__assign(__assign({}, prev), (_a = {}, _a[field] = error_1 || '', _a)));
                    });
                    return [2 /*return*/];
                case 2:
                    // Cancel previous timer
                    if (debounceTimers.current[fieldKey]) {
                        clearTimeout(debounceTimers.current[fieldKey]);
                    }
                    // Set new timer
                    debounceTimers.current[fieldKey] = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        var error;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, validateField(field, value)];
                                case 1:
                                    error = _a.sent();
                                    setErrors(function (prev) {
                                        var _a;
                                        return (__assign(__assign({}, prev), (_a = {}, _a[field] = error || '', _a)));
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); }, rule.debounce);
                    return [2 /*return*/];
            }
        });
    }); }, [validateField, validationRules]);
    // Enhanced form validation with async support
    var validateForm = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var newErrors, isValid, validationPromises, validationResults, validationError_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsValidating(true);
                    newErrors = {};
                    isValid = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    validationPromises = Object.keys(data).map(function (field) { return __awaiter(_this, void 0, void 0, function () {
                        var fieldKey, error;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    fieldKey = field;
                                    return [4 /*yield*/, validateField(fieldKey, data[fieldKey])];
                                case 1:
                                    error = _a.sent();
                                    return [2 /*return*/, { field: fieldKey, error: error }];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(validationPromises)];
                case 2:
                    validationResults = _a.sent();
                    validationResults.forEach(function (_a) {
                        var field = _a.field, error = _a.error;
                        if (error) {
                            newErrors[field] = error;
                            isValid = false;
                        }
                        else {
                            newErrors[field] = '';
                        }
                    });
                    setErrors(newErrors);
                    return [2 /*return*/, isValid];
                case 3:
                    validationError_1 = _a.sent();
                    console.error('Form validation error:', validationError_1);
                    return [2 /*return*/, false];
                case 4:
                    setIsValidating(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [data, validateField]);
    // Enhanced setValue with type safety and optional validation
    var setValue = (0, react_1.useCallback)(function (field, value) {
        // Type-safe value setting
        var safeValue = value === undefined ? null : value;
        setData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = safeValue, _a)));
        });
        // Clear error when user starts typing (UX improvement)
        if (errors[field]) {
            setErrors(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[field] = '', _a)));
            });
        }
        // Validate on change if enabled
        if (validateOnChange) {
            validateFieldDebounced(field, safeValue);
        }
    }, [validateOnChange, validateFieldDebounced, errors]);
    // Utility method for setting multiple values at once
    var setMultipleValues = (0, react_1.useCallback)(function (values) {
        setData(function (prev) { return (__assign(__assign({}, prev), values)); });
        // Clear errors for updated fields
        var updatedFields = Object.keys(values);
        if (updatedFields.length > 0) {
            setErrors(function (prev) {
                var newErrors = __assign({}, prev);
                updatedFields.forEach(function (field) {
                    newErrors[field] = '';
                });
                return newErrors;
            });
        }
        // Validate if enabled
        if (validateOnChange) {
            Object.entries(values).forEach(function (_a) {
                var field = _a[0], value = _a[1];
                validateFieldDebounced(field, value);
            });
        }
    }, [validateOnChange, validateFieldDebounced]);
    // Type-safe error management
    var setError = (0, react_1.useCallback)(function (field, error) {
        setErrors(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = safeStringValue(error), _a)));
        });
    }, []);
    var clearError = (0, react_1.useCallback)(function (field) {
        setErrors(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = '', _a)));
        });
    }, []);
    // Enhanced touched state management
    var setTouched = (0, react_1.useCallback)(function (field, touchedValue) {
        if (touchedValue === void 0) { touchedValue = true; }
        setTouchedState(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = Boolean(touchedValue), _a)));
        });
    }, []);
    // Enhanced form submission with comprehensive error handling
    var handleSubmit = (0, react_1.useCallback)(function (e) { return __awaiter(_this, void 0, void 0, function () {
        var timeSinceLastSubmission, submissionTime, allTouched, isValid_1, submissionData, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (e) {
                        e.preventDefault();
                    }
                    // Prevent double submission if enabled
                    if (preventDoubleSubmit && isSubmitting) {
                        return [2 /*return*/];
                    }
                    // Check for rapid successive submissions
                    if (lastSubmissionTime && preventDoubleSubmit) {
                        timeSinceLastSubmission = Date.now() - lastSubmissionTime.getTime();
                        if (timeSinceLastSubmission < 1000) { // 1 second cooldown
                            return [2 /*return*/];
                        }
                    }
                    setIsSubmitting(true);
                    submissionTime = new Date();
                    setLastSubmissionTime(submissionTime);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    allTouched = Object.keys(data).reduce(function (acc, field) {
                        acc[field] = true;
                        return acc;
                    }, {});
                    setTouchedState(allTouched);
                    return [4 /*yield*/, validateForm()];
                case 2:
                    isValid_1 = _a.sent();
                    if (!isValid_1) {
                        return [2 /*return*/];
                    }
                    submissionData = transformData ? transformData(__assign({}, data)) : __assign({}, data);
                    // Submit form with proper error handling
                    return [4 /*yield*/, onSubmit(submissionData)];
                case 3:
                    // Submit form with proper error handling
                    _a.sent();
                    // Increment success counter
                    setSubmitCount(function (prev) { return prev + 1; });
                    // Reset form if configured to do so
                    if (resetOnSuccess) {
                        handleReset();
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_2 = _a.sent();
                    console.error('Form submission error:', error_2);
                    // Re-throw error to allow parent components to handle it
                    throw error_2;
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [
        data,
        validateForm,
        onSubmit,
        transformData,
        resetOnSuccess,
        preventDoubleSubmit,
        isSubmitting,
        lastSubmissionTime
    ]);
    // Enhanced reset functionality
    var handleReset = (0, react_1.useCallback)(function () {
        setData(__assign({}, initialDataRef.current));
        setErrors(Object.keys(initialDataRef.current).reduce(function (acc, key) {
            acc[key] = '';
            return acc;
        }, {}));
        setTouchedState(Object.keys(initialDataRef.current).reduce(function (acc, key) {
            acc[key] = false;
            return acc;
        }, {}));
        setIsSubmitting(false);
        setIsValidating(false);
    }, []);
    // Clear form (reset to empty values rather than initial values)
    var clearForm = (0, react_1.useCallback)(function () {
        // Create empty data while preserving the original structure and types
        var emptyData = Object.keys(data).reduce(function (acc, key) {
            var fieldKey = key;
            // Use type-safe empty value assignment based on original data type
            var originalValue = initialDataRef.current[fieldKey];
            if (typeof originalValue === 'boolean') {
                acc[fieldKey] = false;
            }
            else if (typeof originalValue === 'number') {
                acc[fieldKey] = 0;
            }
            else if (Array.isArray(originalValue)) {
                acc[fieldKey] = [];
            }
            else if (typeof originalValue === 'object' && originalValue !== null) {
                acc[fieldKey] = {};
            }
            else {
                // Default to empty string for string types and others
                acc[fieldKey] = '';
            }
            return acc;
        }, {});
        setData(emptyData);
        setErrors(Object.keys(data).reduce(function (acc, key) {
            acc[key] = '';
            return acc;
        }, {}));
        setTouchedState(Object.keys(data).reduce(function (acc, key) {
            acc[key] = false;
            return acc;
        }, {}));
    }, [data]);
    // Enhanced field props with better event handling
    var getFieldProps = (0, react_1.useCallback)(function (field) { return ({
        value: safeStringValue(data[field]),
        onChange: function (e) {
            var value = e.target.type === 'checkbox'
                ? e.target.checked
                : e.target.value;
            setValue(field, value);
        },
        onBlur: function () {
            setTouched(field, true);
            if (validateOnBlur) {
                validateFieldDebounced(field, data[field]);
            }
        },
        error: safeStringValue(errors[field]),
        touched: Boolean(touched[field]),
    }); }, [data, errors, touched, setValue, setTouched, validateOnBlur, validateFieldDebounced]);
    // Type-safe field error retrieval
    var getFieldError = (0, react_1.useCallback)(function (field) {
        var fieldTouched = Boolean(touched[field]);
        var fieldError = safeStringValue(errors[field]);
        return (fieldTouched && fieldError) || null;
    }, [touched, errors]);
    // Enhanced field validation check
    var isFieldValid = (0, react_1.useCallback)(function (field) {
        var fieldError = safeStringValue(errors[field]);
        var fieldTouched = Boolean(touched[field]);
        return !fieldError || !fieldTouched;
    }, [errors, touched]);
    // Computed properties for enhanced UX
    var isValid = (0, react_1.useMemo)(function () {
        return Object.values(errors).every(function (error) { return !safeStringValue(error); });
    }, [errors]);
    var isDirty = (0, react_1.useMemo)(function () {
        return Object.keys(data).some(function (key) {
            var currentValue = safeStringValue(data[key]);
            var initialValue = safeStringValue(initialDataRef.current[key]);
            return currentValue !== initialValue;
        });
    }, [data]);
    var canSubmit = (0, react_1.useMemo)(function () {
        return isValid && !isSubmitting && !isValidating;
    }, [isValid, isSubmitting, isValidating]);
    // Cleanup debounce timers on unmount
    (0, react_1.useEffect)(function () {
        return function () {
            Object.values(debounceTimers.current).forEach(function (timer) {
                clearTimeout(timer);
            });
            Object.values(validationAbortControllers.current).forEach(function (controller) {
                controller.abort();
            });
        };
    }, []);
    var formState = {
        data: data,
        errors: errors,
        touched: touched,
        isSubmitting: isSubmitting,
        isValid: isValid,
        isValidating: isValidating,
        submitCount: submitCount,
        lastSubmissionTime: lastSubmissionTime,
    };
    return {
        formState: formState,
        setValue: setValue,
        setError: setError,
        clearError: clearError,
        setTouched: setTouched,
        handleSubmit: handleSubmit,
        handleReset: handleReset,
        validateField: validateField,
        validateForm: validateForm,
        getFieldProps: getFieldProps,
        getFieldError: getFieldError,
        isFieldValid: isFieldValid,
        // New utility methods
        setFieldValue: setValue, // Alias for consistency
        setMultipleValues: setMultipleValues,
        clearForm: clearForm,
        isDirty: isDirty,
        canSubmit: canSubmit,
    };
}
// Enhanced common validation rules with TypeScript safety
exports.commonValidationRules = {
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        custom: function (value) {
            var stringValue = safeStringValue(value);
            if (stringValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
                return 'Please enter a valid email address';
            }
            return null;
        }
    },
    phone: {
        pattern: /^(\+254|0)[17]\d{8}$/,
        custom: function (value) {
            var stringValue = safeStringValue(value);
            if (stringValue && !/^(\+254|0)[17]\d{8}$/.test(stringValue.replace(/\s/g, ''))) {
                return 'Please enter a valid Kenyan phone number';
            }
            return null;
        }
    },
    required: {
        required: true
    },
    name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        custom: function (value) {
            var stringValue = safeStringValue(value);
            if (stringValue && !/^[a-zA-Z\s'-]+$/.test(stringValue)) {
                return 'Name can only contain letters, spaces, hyphens, and apostrophes';
            }
            return null;
        }
    },
    message: {
        required: true,
        minLength: 10,
        maxLength: 1000
    },
    rating: {
        required: true,
        custom: function (value) {
            var numValue = Number(value);
            if (isNaN(numValue) || numValue < 1 || numValue > 5) {
                return 'Rating must be between 1 and 5';
            }
            return null;
        }
    },
    // New common validation rules
    url: {
        pattern: /^https?:\/\/.+/,
        custom: function (value) {
            var stringValue = safeStringValue(value);
            if (stringValue) {
                try {
                    new URL(stringValue);
                    return null;
                }
                catch (_a) {
                    return 'Please enter a valid URL';
                }
            }
            return null;
        }
    },
    positiveNumber: {
        custom: function (value) {
            var numValue = Number(value);
            if (value && (isNaN(numValue) || numValue <= 0)) {
                return 'Must be a positive number';
            }
            return null;
        }
    },
    password: {
        required: true,
        minLength: 8,
        custom: function (value) {
            var stringValue = safeStringValue(value);
            if (stringValue && stringValue.length >= 8) {
                var hasUpper = /[A-Z]/.test(stringValue);
                var hasLower = /[a-z]/.test(stringValue);
                var hasNumber = /\d/.test(stringValue);
                var hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(stringValue);
                if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
                    return 'Password must contain uppercase, lowercase, number, and special character';
                }
            }
            return null;
        }
    }
};
exports.default = useFormValidation;
