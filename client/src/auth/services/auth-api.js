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
exports.authApi = void 0;
var queryClient_1 = require("../../infrastructure/api/queryClient");
var API_BASE = '/api/auth';
exports.authApi = {
    // Login user
    login: function (credentials) { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('POST', "".concat(API_BASE, "/login"), credentials, {
                            requestOptions: {
                                key: "login:".concat(credentials.email),
                                priority: 'high',
                                cancelPrevious: true
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_1 = _a.sent();
                    throw new Error('Login failed');
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Register new user
    register: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('POST', "".concat(API_BASE, "/register"), data, {
                            requestOptions: {
                                key: "register:".concat(data.email),
                                priority: 'high',
                                cancelPrevious: true
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_2 = _a.sent();
                    throw new Error('Registration failed');
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Logout user
    logout: function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('POST', "".concat(API_BASE, "/logout"), undefined, {
                            requestOptions: {
                                key: 'logout',
                                priority: 'high',
                                cancelPrevious: false
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_3 = _a.sent();
                    throw new Error('Logout failed');
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Get current user profile
    getProfile: function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    token = localStorage.getItem('auth_token');
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('GET', "".concat(API_BASE, "/profile"), undefined, {
                            headers: {
                                'Authorization': token ? "Bearer ".concat(token) : ''
                            },
                            requestOptions: {
                                key: 'user-profile',
                                priority: 'normal',
                                cancelPrevious: true
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_4 = _a.sent();
                    throw new Error('Failed to fetch profile');
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Update user profile
    updateProfile: function (updates) { return __awaiter(void 0, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('PATCH', "".concat(API_BASE, "/profile"), updates, {
                            requestOptions: {
                                key: 'update-profile',
                                priority: 'high',
                                cancelPrevious: true
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_5 = _a.sent();
                    throw new Error('Failed to update profile');
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Refresh authentication token
    refreshToken: function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('POST', "".concat(API_BASE, "/refresh"), undefined, {
                            requestOptions: {
                                key: 'refresh-token',
                                priority: 'high',
                                cancelPrevious: true
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_6 = _a.sent();
                    throw new Error('Token refresh failed');
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Request password reset
    requestPasswordReset: function (email) { return __awaiter(void 0, void 0, void 0, function () {
        var error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('POST', "".concat(API_BASE, "/forgot-password"), { email: email }, {
                            requestOptions: {
                                key: "password-reset:".concat(email),
                                priority: 'normal',
                                cancelPrevious: true
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_7 = _a.sent();
                    throw new Error('Password reset request failed');
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Reset password with token
    resetPassword: function (token, newPassword) { return __awaiter(void 0, void 0, void 0, function () {
        var error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('POST', "".concat(API_BASE, "/reset-password"), { token: token, password: newPassword }, {
                            requestOptions: {
                                key: "reset-password:".concat(token),
                                priority: 'high',
                                cancelPrevious: false
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_8 = _a.sent();
                    throw new Error('Password reset failed');
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Validate password reset token
    validateResetToken: function (token) { return __awaiter(void 0, void 0, void 0, function () {
        var error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('POST', "".concat(API_BASE, "/validate-reset-token"), { token: token }, {
                            requestOptions: {
                                key: "validate-token:".concat(token),
                                priority: 'normal',
                                cancelPrevious: true
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_9 = _a.sent();
                    throw new Error('Token validation failed');
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Check password history
    checkPasswordHistory: function (email, password) { return __awaiter(void 0, void 0, void 0, function () {
        var error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('POST', "".concat(API_BASE, "/check-password-history"), { email: email, password: password }, {
                            requestOptions: {
                                key: "check-password:".concat(email),
                                priority: 'normal',
                                cancelPrevious: true
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_10 = _a.sent();
                    throw new Error('Password history check failed');
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Get account lockout status
    getAccountLockout: function (email) { return __awaiter(void 0, void 0, void 0, function () {
        var error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('GET', "".concat(API_BASE, "/account-lockout/").concat(encodeURIComponent(email)), undefined, {
                            requestOptions: {
                                key: "lockout-status:".concat(email),
                                priority: 'normal',
                                cancelPrevious: true
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_11 = _a.sent();
                    throw new Error('Failed to get account lockout status');
                case 3: return [2 /*return*/];
            }
        });
    }); },
};
