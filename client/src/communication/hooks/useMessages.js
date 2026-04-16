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
exports.messageKeys = void 0;
exports.useMessages = useMessages;
exports.useMessageThreads = useMessageThreads;
exports.useSendMessage = useSendMessage;
exports.useMarkMessageAsRead = useMarkMessageAsRead;
exports.useDeleteMessage = useDeleteMessage;
var react_query_1 = require("@tanstack/react-query");
// Mock API functions - replace with actual API calls
var messageApi = {
    getMessages: function (userId_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([userId_1], args_1, true), void 0, function (userId, page, limit) {
            var response;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/communication/messages?userId=".concat(userId, "&page=").concat(page, "&limit=").concat(limit))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch messages');
                        return [2 /*return*/, response.json()];
                }
            });
        });
    },
    getThreads: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("/api/communication/threads?userId=".concat(userId))];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch message threads');
                    return [2 /*return*/, response.json()];
            }
        });
    }); },
    sendMessage: function (message) { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch('/api/communication/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(message),
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to send message');
                    return [2 /*return*/, response.json()];
            }
        });
    }); },
    markAsRead: function (messageId) { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("/api/communication/messages/".concat(messageId, "/read"), {
                        method: 'PATCH',
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to mark message as read');
                    return [2 /*return*/, response.json()];
            }
        });
    }); },
    deleteMessage: function (messageId) { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("/api/communication/messages/".concat(messageId), {
                        method: 'DELETE',
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to delete message');
                    return [2 /*return*/, response.json()];
            }
        });
    }); },
};
// Query keys
exports.messageKeys = {
    all: ['messages'],
    lists: function () { return __spreadArray(__spreadArray([], exports.messageKeys.all, true), ['list'], false); },
    list: function (userId, page) { return __spreadArray(__spreadArray([], exports.messageKeys.lists(), true), [userId, page], false); },
    threads: function (userId) { return __spreadArray(__spreadArray([], exports.messageKeys.all, true), ['threads', userId], false); },
};
// Get messages for a user
function useMessages(userId, page, limit) {
    if (page === void 0) { page = 1; }
    if (limit === void 0) { limit = 20; }
    return (0, react_query_1.useQuery)({
        queryKey: exports.messageKeys.list(userId, page),
        queryFn: function () { return messageApi.getMessages(userId, page, limit); },
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}
// Get message threads for a user
function useMessageThreads(userId) {
    return (0, react_query_1.useQuery)({
        queryKey: exports.messageKeys.threads(userId),
        queryFn: function () { return messageApi.getThreads(userId); },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
// Send message mutation
function useSendMessage() {
    var queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: messageApi.sendMessage,
        onSuccess: function () {
            // Invalidate message lists and threads to refetch
            queryClient.invalidateQueries({ queryKey: exports.messageKeys.lists() });
            queryClient.invalidateQueries({ queryKey: __spreadArray(__spreadArray([], exports.messageKeys.all, true), ['threads'], false) });
        },
    });
}
// Mark message as read mutation
function useMarkMessageAsRead() {
    var queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: messageApi.markAsRead,
        onSuccess: function () {
            // Invalidate message lists to refetch
            queryClient.invalidateQueries({ queryKey: exports.messageKeys.lists() });
            queryClient.invalidateQueries({ queryKey: __spreadArray(__spreadArray([], exports.messageKeys.all, true), ['threads'], false) });
        },
    });
}
// Delete message mutation
function useDeleteMessage() {
    var queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: messageApi.deleteMessage,
        onSuccess: function () {
            // Invalidate message lists to refetch
            queryClient.invalidateQueries({ queryKey: exports.messageKeys.lists() });
            queryClient.invalidateQueries({ queryKey: __spreadArray(__spreadArray([], exports.messageKeys.all, true), ['threads'], false) });
        },
    });
}
