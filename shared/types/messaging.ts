/**
 * Messaging System Types
 *
 * Sections:
 *   1. Primitives & union types
 *   2. Shared mixins
 *   3. Core domain models
 *   4. Metadata (typed, no index signatures)
 *   5. Attachment types (persisted vs upload input)
 *   6. Request payloads
 *   7. Filter / query types
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
 *
 * `isRead` is intentionally NOT a separate field on `Message` — derive it from
 * `status === 'read'` to avoid two sources of truth.
 *
 * Contrast with `Notification.isRead`, which IS an explicit boolean: notifications
 * have no multi-step lifecycle, so a boolean is the right shape there. The
 * asymmetry is deliberate — do not "normalise" by adding isRead to Message.
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

/** Subset of NotificationPriority used for thread-level triage (excludes 'urgent'). */
export type ThreadPriority = Exclude<NotificationPriority, 'urgent'>;

/**
 * Priority used at the message level.
 * Typed as a distinct alias — same values as NotificationPriority today, but
 * the two can diverge independently without a breaking change.
 */
export type MessagePriority = NotificationPriority;

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

// ============================================================================
// 2. SHARED MIXINS
// ============================================================================

/**
 * Escape hatch for domain-specific keys not yet promoted to first-class fields.
 * Applied to `MessageMetadata` and `ThreadMetadata`.
 * Prefer extending the concrete interface over reaching for `extensions`.
 */
export interface Extensible {
  extensions?: Record<string, unknown>;
}

/**
 * Inclusive ISO-8601 date range used across all filter types.
 * Both ends are optional — omit either to leave that bound open.
 */
export interface DateRangeFilter {
  /** ISO-8601 inclusive lower bound */
  dateFrom?: string;
  /** ISO-8601 inclusive upper bound */
  dateTo?:   string;
}

// ============================================================================
// 3. CORE DOMAIN MODELS
// ============================================================================

export interface Message {
  id:            string;
  threadId:      string;
  senderId:      string;
  recipientId:   string;
  content:       string;
  messageType:   MessageType;
  subject?:      string;
  /** Derive `isRead` from `status === 'read'` — see MessageStatus JSDoc. */
  status:        MessageStatus;
  priority?:     MessagePriority;
  attachments?:  readonly MessageAttachment[];
  metadata?:     MessageMetadata;
  /** ISO-8601 */
  createdAt:     string;
  /** ISO-8601 — absent when the message has never been edited */
  updatedAt?:    string;
  /** ISO-8601 */
  readAt?:       string;
  /** ISO-8601 */
  deliveredAt?:  string;
}

export interface MessageThread {
  id:           string;
  threadType:   ThreadType;
  participants: readonly string[];
  subject?:     string;
  propertyId?:  string;
  lastMessage?: Message;
  /** ISO-8601 */
  lastActivity: string;
  isArchived:   boolean;
  /** ISO-8601 */
  createdAt:    string;
  /** ISO-8601 */
  updatedAt:    string;
  /** Present when fetched with a counts projection. */
  messageCount?: number;
  /** Present when fetched with a counts projection. */
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
  /**
   * Explicit boolean — notifications have no multi-step lifecycle (unlike
   * Message, which derives read state from `status`). See MessageStatus JSDoc.
   */
  isRead:    boolean;
  data?:     NotificationData;
  /** ISO-8601 */
  expiresAt?: string;
  /** ISO-8601 */
  createdAt: string;
  /** ISO-8601 */
  readAt?:   string;
}

// ============================================================================
// 4. METADATA  (fully typed — no index signatures)
// ============================================================================

/** Structured context attached to a message. */
export interface MessageMetadata extends Extensible {
  propertyId?:      string;
  appointmentId?:   string;
  verificationId?:  string;
  templateId?:      string;
  systemGenerated?: boolean;
  autoReply?:       boolean;
}

/** Contextual data attached to a thread for display and routing purposes. */
export interface ThreadMetadata extends Extensible {
  propertyTitle?: string;
  propertyPrice?: number;
  agentId?:       string;
  inquiryType?:   string;
  /** Excludes 'urgent' — threads use lower-urgency triage than notifications. */
  priority?:      ThreadPriority;
  tags?:          readonly string[];
}

/**
 * Structured payload attached to a notification for deep-linking and display.
 * Intentionally tight — no `extensions` field. If new keys are needed, add
 * them explicitly so deep-link consumers remain type-safe.
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
// 5. ATTACHMENT TYPES
// ============================================================================

/** A persisted attachment returned from the API. */
export interface MessageAttachment {
  id:            string;
  messageId:     string;
  fileName:      string;
  /** Bytes */
  fileSize:      number;
  mimeType:      string;
  url:           string;
  thumbnailUrl?: string;
  /** ISO-8601 */
  uploadedAt:    string;
}

/**
 * Attachment payload for outgoing requests.
 * Distinct from `MessageAttachment` — no `id` or `url` yet; may carry a raw
 * `File` before upload.
 *
 * `file` is a browser-only global (`File` extends `Blob`). It must be stripped
 * before serialising to JSON for the server. In Node/SSR contexts, type the
 * field as `Blob` or omit it entirely at the call site.
 */
export interface AttachmentInput {
  fileName: string;
  /** Bytes */
  fileSize: number;
  mimeType: string;
  /**
   * Client-only: raw `File` from a file input or drag-and-drop.
   * Strip before sending to the server.
   * Browser environments only — `File` is not available in Node.js.
   */
  file?:    File;
  /**
   * Server-side path or pre-signed URL after upload.
   * Populated by the upload handler; absent on the client before upload.
   */
  url?:     string;
}

// ============================================================================
// 6. REQUEST PAYLOADS
// ============================================================================

/** Post a message to an existing thread. */
export interface SendMessageRequest {
  threadId:     string;
  recipientId:  string;
  content:      string;
  messageType:  MessageType;
  subject?:     string;
  attachments?: readonly AttachmentInput[];
  metadata?:    MessageMetadata;
  priority?:    MessagePriority;
}

/**
 * The first message sent atomically when a thread is created.
 * Exported as a named type so factories and hooks can reference it directly
 * without re-declaring the inline shape.
 */
export interface InitialMessageInput {
  content:      string;
  messageType:  MessageType;
  attachments?: readonly AttachmentInput[];
}

/**
 * Start a new thread.
 * Separated from `SendMessageRequest` — the two operations have different
 * required fields and different server-side logic.
 */
export interface CreateThreadRequest {
  participantIds:   readonly string[];
  threadType:       ThreadType;
  subject?:         string;
  propertyId?:      string;
  metadata?:        ThreadMetadata;
  /** Optional first message sent atomically with thread creation. */
  initialMessage?:  InitialMessageInput;
}

// ============================================================================
// 7. FILTER / QUERY TYPES
// ============================================================================

export interface MessageSearchFilters extends DateRangeFilter {
  threadId?:       string;
  senderId?:       string;
  recipientId?:    string;
  messageType?:    MessageType;
  status?:         MessageStatus;
  hasAttachments?: boolean;
  searchQuery?:    string;
}

/**
 * `userId` is required — thread results are always scoped to a single user.
 * Contrast with `MessageSearchFilters`, which scopes by thread/sender/recipient
 * and needs no top-level userId.
 */
export interface ThreadSearchFilters extends DateRangeFilter {
  userId:       string;
  threadType?:  ThreadType;
  propertyId?:  string;
  isArchived?:  boolean;
  hasUnread?:   boolean;
  searchQuery?: string;
}

/** `userId` is required — notifications are always fetched per-user. */
export interface NotificationFilters extends DateRangeFilter {
  userId:    string;
  type?:     NotificationType;
  isRead?:   boolean;
  priority?: NotificationPriority;
}