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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.authKeys = void 0;
exports.useProfile = useProfile;
exports.useLogin = useLogin;
exports.useRegister = useRegister;
exports.useLogout = useLogout;
exports.useUpdateProfile = useUpdateProfile;
exports.useRequestPasswordReset = useRequestPasswordReset;
exports.useResetPassword = useResetPassword;
exports.useValidateResetToken = useValidateResetToken;
exports.useCheckPasswordHistory = useCheckPasswordHistory;
exports.useAccountLockout = useAccountLockout;
var react_query_1 = require("@tanstack/react-query");
var queryClient_1 = require("../../infrastructure/api/queryClient");
var auth_api_1 = require("../services/auth-api");
// Use standardized query keys from infrastructure
exports.authKeys = {
    profile: function (userId) { return queryClient_1.queryKeys.user.profile(userId); },
};
// Get current user profile
function useProfile() {
    return (0, react_query_1.useQuery)(__assign({ queryKey: ["auth", "profile"], queryFn: auth_api_1.authApi.getProfile, retry: false }, queryClient_1.cachePresets.profile));
}
// Login mutation
function useLogin() {
    var queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: auth_api_1.authApi.login,
        onSuccess: function (data) {
            // Store token in localStorage
            if (data.data.token) {
                localStorage.setItem("auth_token", data.data.token);
            }
            // Set user data in cache
            queryClient.setQueryData(["auth", "profile"], { data: data.data.user });
        },
    });
}
// Register mutation
function useRegister() {
    var queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: auth_api_1.authApi.register,
        onSuccess: function (data) {
            // Store token in localStorage
            if (data.data.token) {
                localStorage.setItem("auth_token", data.data.token);
            }
            // Set user data in cache
            queryClient.setQueryData(["auth", "profile"], { data: data.data.user });
        },
    });
}
// Logout mutation
function useLogout() {
    var queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: auth_api_1.authApi.logout,
        onSuccess: function () {
            // Clear token from localStorage
            localStorage.removeItem("auth_token");
            // Clear all cached data
            queryClient.clear();
        },
    });
}
// Update profile mutation
function useUpdateProfile() {
    var queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: auth_api_1.authApi.updateProfile,
        onSuccess: function (data) {
            // Update profile in cache
            queryClient.setQueryData(["auth", "profile"], data);
        },
    });
}
// Password reset request mutation
function useRequestPasswordReset() {
    return (0, react_query_1.useMutation)({
        mutationFn: auth_api_1.authApi.requestPasswordReset,
    });
}
// Password reset mutation
function useResetPassword() {
    return (0, react_query_1.useMutation)({
        mutationFn: function (_a) {
            var token = _a.token, password = _a.password;
            return auth_api_1.authApi.resetPassword(token, password);
        },
    });
}
// Validate reset token
function useValidateResetToken() {
    return (0, react_query_1.useMutation)({
        mutationFn: auth_api_1.authApi.validateResetToken,
    });
}
// Check password history
function useCheckPasswordHistory() {
    return (0, react_query_1.useMutation)({
        mutationFn: function (_a) {
            var email = _a.email, password = _a.password;
            return auth_api_1.authApi.checkPasswordHistory(email, password);
        },
    });
}
// Get account lockout status
function useAccountLockout(email) {
    return (0, react_query_1.useQuery)({
        queryKey: ["auth", "lockout", email],
        queryFn: function () { return auth_api_1.authApi.getAccountLockout(email); },
        enabled: !!email,
        retry: false,
        staleTime: 30000, // 30 seconds
    });
}
// Re-export the context hook as the main auth hook
var AuthContext_1 = require("../contexts/AuthContext");
Object.defineProperty(exports, "useAuth", { enumerable: true, get: function () { return AuthContext_1.useAuthContext; } });
