/**
 * Communication System Schemas
 * 
 * Contains schemas for real-time messaging, notifications,
 * and communication channels.
 */

import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  json,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Import core tables for relationships
import { users, properties } from "../core";

// Communication-related enums
export const messageStatusEnum = pgEnum("message_status", [
  "sent",
  "delivered",
  "read",
  "failed",
] as const);

export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "document",
  "system",
  "notification",
] as const);

export const channelTypeEnum = pgEnum("channel_type", [
  "direct",
  "group",
  "property_inquiry",
  "verification_discussion",
  "support",
] as const);

export const notificationTypeEnum = pgEnum("notification_type", [
  "property_update",
  "verification_status",
  "message_received",
  "trust_score_change",
  "fraud_alert",
  "system_announcement",
] as const);

export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "normal",
  "high",
  "urgent",
] as const);

// Communication Channels table - Chat channels and conversations
export const communicationChannels = pgTable(
  "communication_channels",
  {
    id: serial("id").primaryKey(),
    channelId: varchar("channel_id", { length: 50 }).unique().notNull(),
    name: varchar("name", { length: 255 }),
    description: text("description"),
    type: channelTypeEnum("type").notNull(),
    isPrivate: boolean("is_private").default(true).notNull(),
    createdBy: integer("created_by")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    participants: json("participants").$type<number[]>().default([]).notNull(),
    admins: json("admins").$type<number[]>().default([]).notNull(),
    relatedPropertyId: integer("related_property_id").references(() => properties.id),
    metadata: json("metadata").$type<Record<string, any>>().default({}),
    lastMessageAt: timestamp("last_message_at"),
    messageCount: integer("message_count").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    channelIdIdx: uniqueIndex("communication_channels_channel_id_idx").on(table.channelId),
    typeIdx: index("communication_channels_type_idx").on(table.type),
    createdByIdx: index("communication_channels_created_by_idx").on(table.createdBy),
    propertyIdx: index("communication_channels_property_idx").on(table.relatedPropertyId),
    activeIdx: index("communication_channels_active_idx").on(table.isActive),
    archivedIdx: index("communication_channels_archived_idx").on(table.isArchived),
    lastMessageIdx: index("communication_channels_last_message_idx").on(table.lastMessageAt),
    // Composite indexes
    typeActiveIdx: index("communication_channels_type_active_idx").on(
      table.type,
      table.isActive
    ),
  })
);

// Messages table - Individual messages within channels
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    messageId: varchar("message_id", { length: 50 }).unique().notNull(),
    channelId: integer("channel_id")
      .references(() => communicationChannels.id, { onDelete: "cascade" })
      .notNull(),
    senderId: integer("sender_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: messageTypeEnum("type").default("text").notNull(),
    content: text("content").notNull(),
    attachments: json("attachments").$type<Array<{
      type: string;
      url: string;
      filename: string;
      size: number;
    }>>().default([]),
    metadata: json("metadata").$type<Record<string, any>>().default({}),
    replyToMessageId: integer("reply_to_message_id").references(() => messages.id),
    isEdited: boolean("is_edited").default(false).notNull(),
    editedAt: timestamp("edited_at"),
    status: messageStatusEnum("status").default("sent").notNull(),
    readBy: json("read_by").$type<Array<{
      userId: number;
      readAt: string;
    }>>().default([]),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: integer("deleted_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    messageIdIdx: uniqueIndex("messages_message_id_idx").on(table.messageId),
    channelIdx: index("messages_channel_idx").on(table.channelId),
    senderIdx: index("messages_sender_idx").on(table.senderId),
    typeIdx: index("messages_type_idx").on(table.type),
    statusIdx: index("messages_status_idx").on(table.status),
    replyToIdx: index("messages_reply_to_idx").on(table.replyToMessageId),
    deletedIdx: index("messages_deleted_idx").on(table.isDeleted),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
    // Composite indexes
    channelCreatedIdx: index("messages_channel_created_idx").on(
      table.channelId,
      table.createdAt
    ),
    channelDeletedIdx: index("messages_channel_deleted_idx").on(
      table.channelId,
      table.isDeleted
    ),
  })
);

// Notifications table - System notifications
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    notificationId: varchar("notification_id", { length: 50 }).unique().notNull(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: notificationTypeEnum("type").notNull(),
    priority: notificationPriorityEnum("priority").default("normal").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    data: json("data").$type<Record<string, any>>().default({}),
    relatedEntityId: integer("related_entity_id"), // Property, message, etc.
    relatedEntityType: varchar("related_entity_type", { length: 50 }), // 'property', 'message', 'user'
    actionUrl: varchar("action_url", { length: 500 }),
    actionText: varchar("action_text", { length: 100 }),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at"),
    isDelivered: boolean("is_delivered").default(false).notNull(),
    deliveredAt: timestamp("delivered_at"),
    deliveryChannels: json("delivery_channels").$type<string[]>().default(["in_app"]), // 'in_app', 'email', 'sms', 'push'
    scheduledFor: timestamp("scheduled_for"), // For scheduled notifications
    expiresAt: timestamp("expires_at"), // When notification becomes irrelevant
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    notificationIdIdx: uniqueIndex("notifications_notification_id_idx").on(table.notificationId),
    userIdx: index("notifications_user_idx").on(table.userId),
    typeIdx: index("notifications_type_idx").on(table.type),
    priorityIdx: index("notifications_priority_idx").on(table.priority),
    readIdx: index("notifications_read_idx").on(table.isRead),
    deliveredIdx: index("notifications_delivered_idx").on(table.isDelivered),
    scheduledIdx: index("notifications_scheduled_idx").on(table.scheduledFor),
    activeIdx: index("notifications_active_idx").on(table.isActive),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
    // Composite indexes
    userReadIdx: index("notifications_user_read_idx").on(
      table.userId,
      table.isRead
    ),
    userTypeIdx: index("notifications_user_type_idx").on(
      table.userId,
      table.type
    ),
    priorityCreatedIdx: index("notifications_priority_created_idx").on(
      table.priority,
      table.createdAt
    ),
  })
);

// Message Threads table - For organizing related messages
export const messageThreads = pgTable(
  "message_threads",
  {
    id: serial("id").primaryKey(),
    threadId: varchar("thread_id", { length: 50 }).unique().notNull(),
    channelId: integer("channel_id")
      .references(() => communicationChannels.id, { onDelete: "cascade" })
      .notNull(),
    rootMessageId: integer("root_message_id")
      .references(() => messages.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }),
    participants: json("participants").$type<number[]>().default([]).notNull(),
    messageCount: integer("message_count").default(0).notNull(),
    lastMessageAt: timestamp("last_message_at"),
    lastMessageBy: integer("last_message_by").references(() => users.id),
    isActive: boolean("is_active").default(true).notNull(),
    isLocked: boolean("is_locked").default(false).notNull(),
    lockedBy: integer("locked_by").references(() => users.id),
    lockedAt: timestamp("locked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    threadIdIdx: uniqueIndex("message_threads_thread_id_idx").on(table.threadId),
    channelIdx: index("message_threads_channel_idx").on(table.channelId),
    rootMessageIdx: index("message_threads_root_message_idx").on(table.rootMessageId),
    activeIdx: index("message_threads_active_idx").on(table.isActive),
    lockedIdx: index("message_threads_locked_idx").on(table.isLocked),
    lastMessageIdx: index("message_threads_last_message_idx").on(table.lastMessageAt),
    // Composite indexes
    channelActiveIdx: index("message_threads_channel_active_idx").on(
      table.channelId,
      table.isActive
    ),
  })
);

// Define relationships
export const communicationChannelsRelations = relations(communicationChannels, ({ one, many }) => ({
  creator: one(users, {
    fields: [communicationChannels.createdBy],
    references: [users.id],
  }),
  relatedProperty: one(properties, {
    fields: [communicationChannels.relatedPropertyId],
    references: [properties.id],
  }),
  messages: many(messages),
  threads: many(messageThreads),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  channel: one(communicationChannels, {
    fields: [messages.channelId],
    references: [communicationChannels.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  replyToMessage: one(messages, {
    fields: [messages.replyToMessageId],
    references: [messages.id],
  }),
  deletedByUser: one(users, {
    fields: [messages.deletedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const messageThreadsRelations = relations(messageThreads, ({ one }) => ({
  channel: one(communicationChannels, {
    fields: [messageThreads.channelId],
    references: [communicationChannels.id],
  }),
  rootMessage: one(messages, {
    fields: [messageThreads.rootMessageId],
    references: [messages.id],
  }),
  lastMessageByUser: one(users, {
    fields: [messageThreads.lastMessageBy],
    references: [users.id],
  }),
  lockedByUser: one(users, {
    fields: [messageThreads.lockedBy],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertCommunicationChannelSchema = createInsertSchema(communicationChannels, {
  channelId: z.string().min(1).max(50),
  name: z.string().max(255).optional(),
  participants: z.array(z.number()).default([]),
  admins: z.array(z.number()).default([]),
});

export const selectCommunicationChannelSchema = createSelectSchema(communicationChannels);

export const insertMessageSchema = createInsertSchema(messages, {
  messageId: z.string().min(1).max(50),
  content: z.string().min(1),
});

export const selectMessageSchema = createSelectSchema(messages);

export const insertNotificationSchema = createInsertSchema(notifications, {
  notificationId: z.string().min(1).max(50),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  deliveryChannels: z.array(z.string()).default(["in_app"]),
});

export const selectNotificationSchema = createSelectSchema(notifications);

export const insertMessageThreadSchema = createInsertSchema(messageThreads, {
  threadId: z.string().min(1).max(50),
  participants: z.array(z.number()).default([]),
});

export const selectMessageThreadSchema = createSelectSchema(messageThreads);

// Export all communication schemas
export const communicationSchemas = {
  communicationChannels,
  messages,
  notifications,
  messageThreads,
  // Relations
  communicationChannelsRelations,
  messagesRelations,
  notificationsRelations,
  messageThreadsRelations,
  // Validation schemas
  insertCommunicationChannelSchema,
  selectCommunicationChannelSchema,
  insertMessageSchema,
  selectMessageSchema,
  insertNotificationSchema,
  selectNotificationSchema,
  insertMessageThreadSchema,
  selectMessageThreadSchema,
};