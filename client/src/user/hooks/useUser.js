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
exports.userKeys = void 0;
exports.useUser = useUser;
exports.useUpdateUser = useUpdateUser;
exports.useUserNotifications = useUserNotifications;
exports.useMarkNotificationRead = useMarkNotificationRead;
var react_query_1 = require("@tanstack/react-query");
var user_business_logic_1 = require("../services/user-business-logic");
// Enhanced user API with business logic integration
var userApi = {
    // Get user with enhanced data
    getUser: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData, data, user, mockActivityData, activityScore, insights;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("/api/users/".concat(userId), {
                        headers: {
                            'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                        },
                    })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to fetch user');
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    data = _a.sent();
                    if (data.data) {
                        user = data.data;
                        mockActivityData = {
                            loginFrequency: 3,
                            propertyInteractions: 10,
                            messageActivity: 5,
                            profileCompleteness: 85,
                            accountAge: 30,
                            verificationLevel: user.isVerified ? 100 : 50,
                        };
                        activityScore = user_business_logic_1.UserBusinessLogic.calculateActivityScore(mockActivityData);
                        insights = user_business_logic_1.UserBusinessLogic.generateUserInsights(user, mockActivityData);
                        data.data.activityScore = activityScore;
                        data.data.insights = insights;
                    }
                    return [2 /*return*/, data];
            }
        });
    }); },
    // Update user with validation
    updateUser: function (userId, updates, requestingUserId) { return __awaiter(void 0, void 0, void 0, function () {
        var currentUserResponse, currentUser, validation, response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, userApi.getUser(userId)];
                case 1:
                    currentUserResponse = _a.sent();
                    currentUser = currentUserResponse.data;
                    validation = user_business_logic_1.UserBusinessLogic.validateSettingsUpdate(currentUser, updates, requestingUserId);
                    if (!validation.isValid) {
                        throw new Error("Update validation failed: ".concat(validation.errors.join(', ')));
                    }
                    return [4 /*yield*/, fetch("/api/users/".concat(userId), {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                            },
                            body: JSON.stringify(validation.allowedUpdates),
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 3:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to update user');
                case 4: return [2 /*return*/, response.json()];
            }
        });
    }); },
    // Get user notifications with enhanced data
    getUserNotifications: function (userId_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([userId_1], args_1, true), void 0, function (userId, params) {
            var searchParams, response, errorData;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        searchParams = new URLSearchParams();
                        Object.entries(params).forEach(function (_a) {
                            var key = _a[0], value = _a[1];
                            if (value !== undefined) {
                                searchParams.append(key, value.toString());
                            }
                        });
                        return [4 /*yield*/, fetch("/api/users/".concat(userId, "/notifications?").concat(searchParams), {
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                    case 2:
                        errorData = _a.sent();
                        throw new Error(errorData.message || 'Failed to fetch notifications');
                    case 3: return [2 /*return*/, response.json()];
                }
            });
        });
    },
    // Mark notification as read
    markNotificationRead: function (notificationId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("/api/notifications/".concat(notificationId, "/read"), {
                        method: 'PATCH',
                        headers: {
                            'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                        },
                    })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to mark notification as read');
                case 3: return [2 /*return*/, response.json()];
            }
        });
    }); },
    // Get user dashboard data
    getUserDashboard: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("/api/users/".concat(userId, "/dashboard"), {
                        headers: {
                            'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                        },
                    })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to fetch dashboard data');
                case 3: return [2 /*return*/, response.json()];
            }
        });
    }); },
    // Update user preferences
    updateUserPreferences: function (userId, preferences) { return __awaiter(void 0, void 0, void 0, function () {
        var validatedPreferences, response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    validatedPreferences = user_business_logic_1.UserBusinessLogic.validateUserPreferences(preferences);
                    return [4 /*yield*/, fetch("/api/users/".concat(userId, "/preferences"), {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                            },
                            body: JSON.stringify(validatedPreferences),
                        })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to update preferences');
                case 3: return [2 /*return*/, response.json()];
            }
        });
    }); },
    // Upload user avatar
    uploadAvatar: function (userId, file) { return __awaiter(void 0, void 0, void 0, function () {
        var formData, response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new FormData();
                    formData.append('avatar', file);
                    return [4 /*yield*/, fetch("/api/users/".concat(userId, "/avatar"), {
                            method: 'POST',
                            headers: {
                                'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                            },
                            body: formData,
                        })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to upload avatar');
                case 3: return [2 /*return*/, response.json()];
            }
        });
    }); },
    // Get user activity history
    getUserActivity: function (userId_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([userId_1], args_1, true), void 0, function (userId, params) {
            var searchParams, response, errorData;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        searchParams = new URLSearchParams();
                        Object.entries(params).forEach(function (_a) {
                            var key = _a[0], value = _a[1];
                            if (value !== undefined) {
                                searchParams.append(key, value.toString());
                            }
                        });
                        return [4 /*yield*/, fetch("/api/users/".concat(userId, "/activity?").concat(searchParams), {
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                    case 2:
                        errorData = _a.sent();
                        throw new Error(errorData.message || 'Failed to fetch user activity');
                    case 3: return [2 /*return*/, response.json()];
                }
            });
        });
    },
    // Delete user account
    deleteUser: function (userId, confirmation) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("/api/users/".concat(userId), {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                        },
                        body: JSON.stringify(confirmation),
                    })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to delete user account');
                case 3: return [2 /*return*/, response.json()];
            }
        });
    }); },
};
// Query keys
exports.userKeys = {
    all: ['users'],
    user: function (userId) { return __spreadArray(__spreadArray([], exports.userKeys.all, true), [userId], false); },
    notifications: function (userId) { return __spreadArray(__spreadArray([], exports.userKeys.all, true), [userId, 'notifications'], false); },
};
// Get user by ID
function useUser(userId) {
    return (0, react_query_1.useQuery)({
        queryKey: exports.userKeys.user(userId),
        queryFn: function () { return userApi.getUser(userId); },
        enabled: !!userId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}
// Update user mutation
function useUpdateUser() {
    var queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: function (_a) {
            var userId = _a.userId, updates = _a.updates, requestingUserId = _a.requestingUserId;
            return userApi.updateUser(userId, updates, requestingUserId);
        },
        onSuccess: function (data, variables) {
            // Update the specific user in cache
            queryClient.setQueryData(exports.userKeys.user(variables.userId), data);
        },
    });
}
// Get user notifications
function useUserNotifications(userId) {
    return (0, react_query_1.useQuery)({
        queryKey: exports.userKeys.notifications(userId),
        queryFn: function () { return userApi.getUserNotifications(userId); },
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}
// Mark notification as read mutation
function useMarkNotificationRead() {
    var queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: userApi.markNotificationRead,
        onSuccess: function () {
            // Invalidate notifications to refetch
            queryClient.invalidateQueries({ queryKey: __spreadArray(__spreadArray([], exports.userKeys.all, true), ['notifications'], false) });
        },
    });
}
