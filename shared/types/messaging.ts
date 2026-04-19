/**
 * Messaging System Types
 *
 * Sections:
 *   1. Primitives & union types
 *   2. Core domain models
 *   3. Metadata (typed, no index signatures)
 *   4. Attachment types (persisted vs upload input)
 *   5. Request payloads
 *   6. Filter / query types
 */

// ============================================================================
// 1. PRIMITIVES & UNION TYPES
// ============================================================================

export type MessageType =
  | 'text'
  | 'image'
  | 'document'
  | 'property_inquiry'
  | 'system_message'
  | 'verification_request'
  | 'appointment_request';

/**
 * Canonical message lifecycle status.
 * `isRead` is intentionally NOT a separate field on Message — derive it from
 * `status === 'read'` to avoid two sources of truth.
 */
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export type ThreadType =
  | 'direct_message'
  | 'property_inquiry'
  | 'general_support'
  | 'verification_discussion'
  | 'appointment_scheduling';

export type NotificationType =
  | 'new_message'
  | 'property_update'
  | 'verification_status'
  | 'appointment_reminder'
  | 'system_alert'
  | 'security_alert'
  | 'marketing';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

/** Subset of NotificationPriority used for thread-level triage (no 'urgent'). */
export type ThreadPriority = Exclude<NotificationPriority, 'urgent'>;

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

// ============================================================================
// 2. CORE DOMAIN MODELS
// ============================================================================

export interface Message {
  id:          string;
  threadId:    string;
  senderId:    string;
  recipientId: string;
  content:     string;
  messageType: MessageType;
  subject?:    string;
  status:      MessageStatus;       // derive isRead from status === 'read'
  priority?:   NotificationPriority;
  attachments?: MessageAttachment[];
  metadata?:   MessageMetadata;
  createdAt:   string;              // ISO-8601 — safe across JSON boundary
  updatedAt:   string;
  readAt?:     string;
  deliveredAt?: string;
}

export interface MessageThread {
  id:           string;
  threadType:   ThreadType;         // was defined but never applied to the thread
  participants: string[];
  subject?:     string;
  propertyId?:  string;
  lastMessage?: Message;
  lastActivity: string;             // ISO-8601
  isArchived:   boolean;
  createdAt:    string;
  updatedAt:    string;
  // Aggregated counts — present when fetched with counts projection
  messageCount?: number;
  unreadCount?:  number;
  metadata?:    ThreadMetadata;
}

export interface Notification {
  id:        string;
  userId:    string;
  type:      NotificationType;
  title:     string;
  message:   string;
  priority:  NotificationPriority;
  isRead:    boolean;
  data?:     NotificationData;
  expiresAt?: string;              // ISO-8601
  createdAt: string;
  readAt?:   string;
}

// ============================================================================
// 3. METADATA  (fully typed — no index signatures)
// ============================================================================

/**
 * Structured context attached to a message.
 * Use `extensions` for any domain-specific keys not listed here.
 */
export interface MessageMetadata {
  propertyId?:     string;
  appointmentId?:  string;
  verificationId?: string;
  templateId?:     string;
  systemGenerated?: boolean;
  autoReply?:      boolean;
  /** Escape hatch for domain-specific keys. Prefer extending this interface. */
  extensions?:     Record<string, unknown>;
}

/** Contextual data attached to a thread for display / routing purposes. */
export interface ThreadMetadata {
  propertyTitle?: string;
  propertyPrice?: number;
  agentId?:       string;
  inquiryType?:   string;
  priority?:      ThreadPriority;  // references canonical type, excludes 'urgent'
  tags?:          string[];
  extensions?:    Record<string, unknown>;
}

/**
 * Structured payload attached to a notification for deep-linking and display.
 * Typed explicitly — callers should not rely on arbitrary keys.
 */
export interface NotificationData {
  messageId?:  string;
  threadId?:   string;
  propertyId?: string;
  userId?:     string;
  actionUrl?:  string;
  imageUrl?:   string;
}

// ============================================================================
// 4. ATTACHMENT TYPES
// ============================================================================

/** A persisted attachment returned from the API. */
export interface MessageAttachment {
  id:           string;
  messageId:    string;
  fileName:     string;
  fileSize:     number;            // bytes
  mimeType:     string;
  url:          string;
  thumbnailUrl?: string;
  uploadedAt:   string;            // ISO-8601
}

/**
 * Attachment payload for outgoing requests.
 * Distinct from MessageAttachment — no id/url yet, may carry a File client-side.
 */
export interface AttachmentInput {
  fileName: string;
  fileSize: number;
  mimeType: string;
  /** Client-only: raw File object (stripped before sending to server). */
  file?:    File;
  /** Server-only: pre-signed or local path after upload. */
  url?:     string;
}

// ============================================================================
// 5. REQUEST PAYLOADS
// ============================================================================

/** Post a message to an existing thread. */
export interface SendMessageRequest {
  threadId:    string;
  recipientId: string;
  content:     string;
  messageType: MessageType;
  subject?:    string;
  attachments?: AttachmentInput[];
  metadata?:   MessageMetadata;
  priority?:   NotificationPriority;
}

/**
 * Start a new thread.
 * Separated from SendMessageRequest because the two operations have
 * different required fields and different server-side logic.
 */
export interface CreateThreadRequest {
  participantIds: string[];
  threadType:     ThreadType;
  subject?:       string;
  propertyId?:    string;
  metadata?:      ThreadMetadata;
  /** Optional first message sent atomically with thread creation. */
  initialMessage?: {
    content:      string;
    messageType:  MessageType;
    attachments?: AttachmentInput[];
  };
}

// ============================================================================
// 6. FILTER / QUERY TYPES
// ============================================================================

export interface MessageSearchFilters {
  threadId?:     string;
  senderId?:     string;
  recipientId?:  string;
  messageType?:  MessageType;
  status?:       MessageStatus;
  hasAttachments?: boolean;
  searchQuery?:  string;
  dateFrom?:     string;           // ISO-8601
  dateTo?:       string;
}

export interface ThreadSearchFilters {
  userId:        string;
  threadType?:   ThreadType;
  propertyId?:   string;
  isArchived?:   boolean;
  hasUnread?:    boolean;
  searchQuery?:  string;
  dateFrom?:     string;           // ISO-8601
  dateTo?:       string;
}

export interface NotificationFilters {
  userId:    string;
  type?:     NotificationType;
  isRead?:   boolean;
  priority?: NotificationPriority;
  dateFrom?: string;               // ISO-8601
  dateTo?:   string;
}