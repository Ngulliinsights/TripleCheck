"use strict";
/**
 * Unified API Client Usage Examples
 *
 * This file demonstrates how to use the new unified API client
 * with all its enhanced features.
 */
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
exports.basicUsage = basicUsage;
exports.advancedUsage = advancedUsage;
exports.errorHandlingExample = errorHandlingExample;
exports.cacheManagementExample = cacheManagementExample;
exports.fileUploadExample = fileUploadExample;
exports.batchOperationsExample = batchOperationsExample;
exports.authenticationExample = authenticationExample;
exports.pollingExample = pollingExample;
var unified_api_client_1 = require("../../../local/services/unified-api-client");
// Example 1: Basic Usage (same as before)
function basicUsage() {
    return __awaiter(this, void 0, void 0, function () {
        var users, newUser, updatedUser;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get('/users')];
                case 1:
                    users = _c.sent();
                    return [4 /*yield*/, unified_api_client_1.apiClient.post('/users', {
                            name: 'John Doe',
                            email: 'john@example.com'
                        })];
                case 2:
                    newUser = _c.sent();
                    return [4 /*yield*/, unified_api_client_1.apiClient.put("/users/".concat((_a = newUser.data) === null || _a === void 0 ? void 0 : _a.id), {
                            name: 'John Smith'
                        })];
                case 3:
                    updatedUser = _c.sent();
                    // DELETE request
                    return [4 /*yield*/, unified_api_client_1.apiClient.delete("/users/".concat((_b = newUser.data) === null || _b === void 0 ? void 0 : _b.id))];
                case 4:
                    // DELETE request
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Example 2: Advanced Configuration
function advancedUsage() {
    return __awaiter(this, void 0, void 0, function () {
        var customClient, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    customClient = new unified_api_client_1.UnifiedApiClient('https://api.example.com');
                    return [4 /*yield*/, customClient.get('/properties', {
                            timeout: 5000, // Custom timeout
                            retries: 1 // Fewer retries for this request
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response];
            }
        });
    });
}
// Example 3: Error Handling
function errorHandlingExample() {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, unified_api_client_1.apiClient.get('/user/profile')];
                case 1:
                    response = _a.sent();
                    console.log('User profile:', response.data);
                    console.log('Status:', response.status);
                    console.log('Status Text:', response.statusText);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    // Network errors, timeouts, etc.
                    console.error('Request failed:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Example 4: Cache Management
function cacheManagementExample() {
    return __awaiter(this, void 0, void 0, function () {
        var response1, response2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get('/properties', {
                        timeout: 5000
                    })];
                case 1:
                    response1 = _a.sent();
                    return [4 /*yield*/, unified_api_client_1.apiClient.get('/properties', {
                            timeout: 5000
                        })];
                case 2:
                    response2 = _a.sent();
                    console.log('First request completed');
                    console.log('Second request completed');
                    return [2 /*return*/];
            }
        });
    });
}
// Example 5: File Upload
function fileUploadExample(file) {
    return __awaiter(this, void 0, void 0, function () {
        var formData, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new FormData();
                    formData.append('file', file);
                    formData.append('category', 'property-images');
                    return [4 /*yield*/, unified_api_client_1.apiClient.post('/upload', formData, {
                            headers: {
                            // Don't set Content-Type, let browser set it with boundary
                            },
                            timeout: 30000, // Longer timeout for file uploads
                            retries: 1 // Fewer retries for uploads
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response];
            }
        });
    });
}
// Example 6: Batch Operations
function batchOperationsExample() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, users, properties, notifications;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        unified_api_client_1.apiClient.get('/users'),
                        unified_api_client_1.apiClient.get('/properties'),
                        unified_api_client_1.apiClient.get('/notifications')
                    ])];
                case 1:
                    _a = _b.sent(), users = _a[0], properties = _a[1], notifications = _a[2];
                    return [2 /*return*/, {
                            users: users.data,
                            properties: properties.data,
                            notifications: notifications.data
                        }];
            }
        });
    });
}
// Example 7: Authentication Handling
function authenticationExample() {
    return __awaiter(this, void 0, void 0, function () {
        var loginResponse, profileResponse;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, unified_api_client_1.apiClient.post('/auth/login', {
                        email: 'user@example.com',
                        password: 'password123'
                    })];
                case 1:
                    loginResponse = _b.sent();
                    if (!((_a = loginResponse.data) === null || _a === void 0 ? void 0 : _a.token)) return [3 /*break*/, 3];
                    // Token is automatically stored and used for subsequent requests
                    localStorage.setItem('auth_token', loginResponse.data.token);
                    return [4 /*yield*/, unified_api_client_1.apiClient.get('/user/profile')];
                case 2:
                    profileResponse = _b.sent();
                    return [2 /*return*/, profileResponse.data];
                case 3: throw new Error('Login failed');
            }
        });
    });
}
// Example 8: Real-time Data with Polling
function pollingExample() {
    return __awaiter(this, void 0, void 0, function () {
        var isPolling, pollData;
        var _this = this;
        return __generator(this, function (_a) {
            isPolling = true;
            pollData = function () { return __awaiter(_this, void 0, void 0, function () {
                var response, error_2;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!isPolling) return [3 /*break*/, 7];
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 4, , 6]);
                            return [4 /*yield*/, unified_api_client_1.apiClient.get('/system/status', {
                                    timeout: 5000
                                })];
                        case 2:
                            response = _b.sent();
                            console.log('System status:', response.data);
                            // Process the data
                            if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.status) === 'critical') {
                                console.warn('System in critical state!');
                                // Handle critical state
                            }
                            // Wait 30 seconds before next poll
                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 30000); })];
                        case 3:
                            // Wait 30 seconds before next poll
                            _b.sent();
                            return [3 /*break*/, 6];
                        case 4:
                            error_2 = _b.sent();
                            console.error('Polling error:', error_2);
                            // Wait longer on error
                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 60000); })];
                        case 5:
                            // Wait longer on error
                            _b.sent();
                            return [3 /*break*/, 6];
                        case 6: return [3 /*break*/, 0];
                        case 7: return [2 /*return*/];
                    }
                });
            }); };
            // Start polling
            pollData();
            // Return function to stop polling
            return [2 /*return*/, function () {
                    isPolling = false;
                }];
        });
    });
}
