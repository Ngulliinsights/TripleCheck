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
exports.formConfigs = exports.createProfileUpdateFormConfig = exports.createContactFormConfig = exports.createUserRegistrationFormConfig = exports.createPropertyFormConfig = exports.asyncValidators = exports.baseValidationRules = void 0;
exports.getFormConfig = getFormConfig;
exports.createConfiguredFormValidation = createConfiguredFormValidation;
// Base validation rules that can be reused across forms
exports.baseValidationRules = {
    // Text field rules
    required: function (fieldName) { return ({
        required: true,
        custom: function (value) { return !value ? "".concat(fieldName, " is required") : null; },
    }); },
    minLength: function (min, fieldName) { return ({
        minLength: min,
        custom: function (value) {
            var str = String(value || '');
            return str.length < min ? "".concat(fieldName, " must be at least ").concat(min, " characters") : null;
        },
    }); },
    maxLength: function (max, fieldName) { return ({
        maxLength: max,
        custom: function (value) {
            var str = String(value || '');
            return str.length > max ? "".concat(fieldName, " must be no more than ").concat(max, " characters") : null;
        },
    }); },
    // Name validation
    namePattern: function (fieldName) { return ({
        pattern: /^[a-zA-Z\s]+$/,
        custom: function (value) {
            var str = String(value || '');
            return !/^[a-zA-Z\s]+$/.test(str) ? "".concat(fieldName, " can only contain letters and spaces") : null;
        },
    }); },
    // Email validation
    email: function () { return ({
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        custom: function (value) {
            var str = String(value || '');
            return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str) ? 'Please enter a valid email address' : null;
        },
    }); },
    // Phone validation (Kenyan format)
    kenyanPhone: function () { return ({
        pattern: /^(\+254|0)[17]\d{8}$/,
        custom: function (value) {
            var str = String(value || '');
            return !/^(\+254|0)[17]\d{8}$/.test(str) ? 'Please enter a valid Kenyan phone number' : null;
        },
    }); },
    // Number validation
    numberRange: function (min, max, fieldName) { return ({
        custom: function (value) {
            var num = Number(value);
            if (isNaN(num))
                return "".concat(fieldName, " must be a number");
            if (num < min)
                return "".concat(fieldName, " must be at least ").concat(min);
            if (num > max)
                return "".concat(fieldName, " must be no more than ").concat(max);
            return null;
        },
    }); },
    // Price validation
    priceValidation: function () { return ({
        custom: function (value) {
            var numValue = Number(value);
            if (isNaN(numValue))
                return 'Price must be a valid number';
            if (numValue < 1000)
                return 'Price must be at least KES 1,000';
            if (numValue > 1000000000)
                return 'Price must be reasonable';
            return null;
        },
    }); },
    // Password complexity
    passwordComplexity: function () { return ({
        custom: function (password) {
            var str = String(password || '');
            var hasUpperCase = /[A-Z]/.test(str);
            var hasLowerCase = /[a-z]/.test(str);
            var hasNumbers = /\d/.test(str);
            var hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(str);
            if (!hasUpperCase)
                return 'Password must contain at least one uppercase letter';
            if (!hasLowerCase)
                return 'Password must contain at least one lowercase letter';
            if (!hasNumbers)
                return 'Password must contain at least one number';
            if (!hasSpecialChar)
                return 'Password must contain at least one special character';
            return null;
        },
    }); },
    // Password confirmation
    passwordConfirmation: function () { return ({
        custom: function (confirmPassword, formData) {
            return confirmPassword === (formData === null || formData === void 0 ? void 0 : formData.password) ? null : 'Passwords do not match';
        },
    }); },
    // Terms agreement
    termsAgreement: function () { return ({
        custom: function (agreed) { return agreed ? null : 'You must agree to the terms and conditions'; },
    }); },
    // Property type validation
    propertyType: function () { return ({
        custom: function (value) {
            var validTypes = ['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial'];
            return validTypes.includes(value) ? null : 'Please select a valid property type';
        },
    }); },
};
// Async validators
exports.asyncValidators = {
    emailAvailability: function (email) { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/auth/check-email?email=".concat(encodeURIComponent(email)))];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (data.exists) {
                        return [2 /*return*/, 'This email is already registered'];
                    }
                    return [2 /*return*/, true];
                case 3:
                    error_1 = _a.sent();
                    return [2 /*return*/, 'Unable to verify email availability'];
                case 4: return [2 /*return*/];
            }
        });
    }); },
    emailBlacklist: function (email) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Simulate email validation API call
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 1:
                    // Simulate email validation API call
                    _a.sent();
                    // Mock validation - in real app, this would call your API
                    if (email === 'test@blocked.com') {
                        return [2 /*return*/, 'This email is not allowed'];
                    }
                    return [2 /*return*/, true];
            }
        });
    }); },
};
var createPropertyFormConfig = function (initialData) { return ({
    title: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.title) || '',
        rules: __assign(__assign(__assign({}, exports.baseValidationRules.required('Property title')), exports.baseValidationRules.minLength(10, 'Title')), exports.baseValidationRules.maxLength(100, 'Title')),
        validateOnChange: true,
        debounceMs: 500,
    },
    description: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.description) || '',
        rules: __assign(__assign(__assign({}, exports.baseValidationRules.required('Property description')), exports.baseValidationRules.minLength(50, 'Description')), exports.baseValidationRules.maxLength(2000, 'Description')),
        validateOnBlur: true,
    },
    price: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.price) || '',
        rules: __assign(__assign({}, exports.baseValidationRules.required('Price')), exports.baseValidationRules.priceValidation()),
        transform: function (value) { return Number(value) || 0; },
        validateOnChange: true,
    },
    location: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.location) || '',
        rules: __assign(__assign({}, exports.baseValidationRules.required('Location')), exports.baseValidationRules.minLength(5, 'Location')),
        validateOnBlur: true,
    },
    bedrooms: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.bedrooms) || 1,
        rules: __assign(__assign({}, exports.baseValidationRules.required('Number of bedrooms')), exports.baseValidationRules.numberRange(0, 20, 'Bedrooms')),
        transform: function (value) { return Number(value) || 0; },
    },
    bathrooms: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.bathrooms) || 1,
        rules: __assign(__assign({}, exports.baseValidationRules.required('Number of bathrooms')), exports.baseValidationRules.numberRange(0, 20, 'Bathrooms')),
        transform: function (value) { return Number(value) || 0; },
    },
    propertyType: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.propertyType) || '',
        rules: __assign(__assign({}, exports.baseValidationRules.required('Property type')), exports.baseValidationRules.propertyType()),
    },
    contactEmail: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.contactEmail) || '',
        rules: __assign(__assign(__assign({}, exports.baseValidationRules.required('Contact email')), exports.baseValidationRules.email()), { asyncValidator: exports.asyncValidators.emailBlacklist }),
        validateOnBlur: true,
        debounceMs: 1000,
    },
    contactPhone: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.contactPhone) || '',
        rules: __assign(__assign({}, exports.baseValidationRules.required('Contact phone')), exports.baseValidationRules.kenyanPhone()),
        validateOnBlur: true,
    },
}); };
exports.createPropertyFormConfig = createPropertyFormConfig;
var createUserRegistrationFormConfig = function () { return ({
    firstName: {
        initialValue: '',
        rules: __assign(__assign(__assign({}, exports.baseValidationRules.required('First name')), exports.baseValidationRules.minLength(2, 'First name')), exports.baseValidationRules.namePattern('First name')),
        validateOnBlur: true,
    },
    lastName: {
        initialValue: '',
        rules: __assign(__assign(__assign({}, exports.baseValidationRules.required('Last name')), exports.baseValidationRules.minLength(2, 'Last name')), exports.baseValidationRules.namePattern('Last name')),
        validateOnBlur: true,
    },
    email: {
        initialValue: '',
        rules: __assign(__assign(__assign({}, exports.baseValidationRules.required('Email')), exports.baseValidationRules.email()), { asyncValidator: exports.asyncValidators.emailAvailability }),
        validateOnBlur: true,
        debounceMs: 1000,
    },
    password: {
        initialValue: '',
        rules: __assign(__assign(__assign({}, exports.baseValidationRules.required('Password')), exports.baseValidationRules.minLength(8, 'Password')), exports.baseValidationRules.passwordComplexity()),
        validateOnChange: true,
        debounceMs: 500,
    },
    confirmPassword: {
        initialValue: '',
        rules: __assign(__assign({}, exports.baseValidationRules.required('Please confirm your password')), exports.baseValidationRules.passwordConfirmation()),
        validateOnChange: true,
        debounceMs: 300,
    },
    phone: {
        initialValue: '',
        rules: __assign(__assign({}, exports.baseValidationRules.required('Phone number')), exports.baseValidationRules.kenyanPhone()),
        validateOnBlur: true,
    },
    agreeToTerms: {
        initialValue: false,
        rules: __assign({}, exports.baseValidationRules.termsAgreement()),
    },
}); };
exports.createUserRegistrationFormConfig = createUserRegistrationFormConfig;
var createContactFormConfig = function () { return ({
    name: {
        initialValue: '',
        rules: __assign(__assign(__assign({}, exports.baseValidationRules.required('Name')), exports.baseValidationRules.minLength(2, 'Name')), exports.baseValidationRules.namePattern('Name')),
        validateOnBlur: true,
    },
    email: {
        initialValue: '',
        rules: __assign(__assign({}, exports.baseValidationRules.required('Email')), exports.baseValidationRules.email()),
        validateOnBlur: true,
    },
    subject: {
        initialValue: '',
        rules: __assign(__assign(__assign({}, exports.baseValidationRules.required('Subject')), exports.baseValidationRules.minLength(5, 'Subject')), exports.baseValidationRules.maxLength(100, 'Subject')),
        validateOnBlur: true,
    },
    message: {
        initialValue: '',
        rules: __assign(__assign(__assign({}, exports.baseValidationRules.required('Message')), exports.baseValidationRules.minLength(20, 'Message')), exports.baseValidationRules.maxLength(1000, 'Message')),
        validateOnBlur: true,
    },
}); };
exports.createContactFormConfig = createContactFormConfig;
var createProfileUpdateFormConfig = function (initialData) { return ({
    firstName: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.firstName) || '',
        rules: __assign(__assign(__assign({}, exports.baseValidationRules.required('First name')), exports.baseValidationRules.minLength(2, 'First name')), exports.baseValidationRules.namePattern('First name')),
        validateOnBlur: true,
    },
    lastName: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.lastName) || '',
        rules: __assign(__assign(__assign({}, exports.baseValidationRules.required('Last name')), exports.baseValidationRules.minLength(2, 'Last name')), exports.baseValidationRules.namePattern('Last name')),
        validateOnBlur: true,
    },
    email: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.email) || '',
        rules: __assign(__assign({}, exports.baseValidationRules.required('Email')), exports.baseValidationRules.email()),
        validateOnBlur: true,
    },
    phone: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.phone) || '',
        rules: __assign(__assign({}, exports.baseValidationRules.required('Phone number')), exports.baseValidationRules.kenyanPhone()),
        validateOnBlur: true,
    },
    bio: {
        initialValue: (initialData === null || initialData === void 0 ? void 0 : initialData.bio) || '',
        rules: __assign({}, exports.baseValidationRules.maxLength(500, 'Bio')),
        validateOnBlur: true,
    },
}); };
exports.createProfileUpdateFormConfig = createProfileUpdateFormConfig;
// Export all configurations as a registry
exports.formConfigs = {
    propertyForm: exports.createPropertyFormConfig,
    userRegistration: exports.createUserRegistrationFormConfig,
    contactForm: exports.createContactFormConfig,
    profileUpdate: exports.createProfileUpdateFormConfig,
};
// Helper function to get configuration by key
function getFormConfig(key, initialData) {
    var configFactory = exports.formConfigs[key];
    return typeof configFactory === 'function' ? configFactory(initialData) : configFactory();
}
// Helper function to create a configured form validation hook
function createConfiguredFormValidation(configKey, initialData, overrides) {
    var config = getFormConfig(configKey, initialData);
    return __assign(__assign({}, config), overrides);
}
