/**
 * Communication Module Index
 * Exports all communication-related components, hooks, and utilities
 */

// Hooks
export { useMessaging, useThreads, useMessages, useTypingIndicators } from './hooks/useMessaging'
export { useNotifications, useNotificationSettings, useUnreadNotificationCount, useNotificationPermission } from './hooks/useNotifications'

// Legacy hooks (for backward compatibility)
export * from './hooks/useMessages'

// Components
export { MessageThread } from './components/MessageThread'
// export { MessagesList } from './components/MessagesList' // Component doesn't exist
export { NotificationCenter } from './components/NotificationCenter'
// export { NotificationBell } from './components/NotificationBell' // Component doesn't exist

// Legacy components (for backward compatibility)
export { MessageList } from './components/MessageList'
export { MessageComposer } from './components/MessageComposer'

// Pages
// export { MessagesPage } from './pages/MessagesPage' // Page doesn't exist
export { default as Inbox } from './pages/Inbox'

// Types
export type { 
  MessageThread as MessageThreadType,
  Message,
  MessageType,
  ThreadType,
  CreateThreadRequest,
  SendMessageRequest
} from './hooks/useMessaging'

export type {
  Notification,
  NotificationType,
  NotificationSettings
} from './hooks/useNotifications'

// WebSocket hooks from shared
export { 
  useMessagingWebSocket, 
  useNotificationsWebSocket,
  usePropertyUpdatesWebSocket 
} from '../shared/hooks/useWebSocket'