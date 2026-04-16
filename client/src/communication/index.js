"use strict";
/**
 * Communication Module Index
 * Exports all communication-related components, hooks, and utilities
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePropertyUpdatesWebSocket = exports.useNotificationsWebSocket = exports.useMessagingWebSocket = exports.Inbox = exports.MessageComposer = exports.MessageList = exports.NotificationCenter = exports.MessageThread = exports.useNotificationPermission = exports.useUnreadNotificationCount = exports.useNotificationSettings = exports.useNotifications = exports.useTypingIndicators = exports.useMessages = exports.useThreads = exports.useMessaging = void 0;
// Hooks
var useMessaging_1 = require("./hooks/useMessaging");
Object.defineProperty(exports, "useMessaging", { enumerable: true, get: function () { return useMessaging_1.useMessaging; } });
Object.defineProperty(exports, "useThreads", { enumerable: true, get: function () { return useMessaging_1.useThreads; } });
Object.defineProperty(exports, "useMessages", { enumerable: true, get: function () { return useMessaging_1.useMessages; } });
Object.defineProperty(exports, "useTypingIndicators", { enumerable: true, get: function () { return useMessaging_1.useTypingIndicators; } });
var useNotifications_1 = require("./hooks/useNotifications");
Object.defineProperty(exports, "useNotifications", { enumerable: true, get: function () { return useNotifications_1.useNotifications; } });
Object.defineProperty(exports, "useNotificationSettings", { enumerable: true, get: function () { return useNotifications_1.useNotificationSettings; } });
Object.defineProperty(exports, "useUnreadNotificationCount", { enumerable: true, get: function () { return useNotifications_1.useUnreadNotificationCount; } });
Object.defineProperty(exports, "useNotificationPermission", { enumerable: true, get: function () { return useNotifications_1.useNotificationPermission; } });
// Legacy hooks (for backward compatibility)
__exportStar(require("./hooks/useMessages"), exports);
// Components
var MessageThread_1 = require("./components/MessageThread");
Object.defineProperty(exports, "MessageThread", { enumerable: true, get: function () { return MessageThread_1.MessageThread; } });
// export { MessagesList } from './components/MessagesList' // Component doesn't exist
var NotificationCenter_1 = require("./components/NotificationCenter");
Object.defineProperty(exports, "NotificationCenter", { enumerable: true, get: function () { return NotificationCenter_1.NotificationCenter; } });
// export { NotificationBell } from './components/NotificationBell' // Component doesn't exist
// Legacy components (for backward compatibility)
var MessageList_1 = require("./components/MessageList");
Object.defineProperty(exports, "MessageList", { enumerable: true, get: function () { return MessageList_1.MessageList; } });
var MessageComposer_1 = require("./components/MessageComposer");
Object.defineProperty(exports, "MessageComposer", { enumerable: true, get: function () { return MessageComposer_1.MessageComposer; } });
// Pages
// export { MessagesPage } from './pages/MessagesPage' // Page doesn't exist
var Inbox_1 = require("./pages/Inbox");
Object.defineProperty(exports, "Inbox", { enumerable: true, get: function () { return Inbox_1.default; } });
// WebSocket hooks from shared
var useWebSocket_1 = require("../local/hooks/useWebSocket");
Object.defineProperty(exports, "useMessagingWebSocket", { enumerable: true, get: function () { return useWebSocket_1.useMessagingWebSocket; } });
Object.defineProperty(exports, "useNotificationsWebSocket", { enumerable: true, get: function () { return useWebSocket_1.useNotificationsWebSocket; } });
Object.defineProperty(exports, "usePropertyUpdatesWebSocket", { enumerable: true, get: function () { return useWebSocket_1.usePropertyUpdatesWebSocket; } });
