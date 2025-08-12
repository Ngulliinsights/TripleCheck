-- Communication System Tables Migration
-- Creates messaging, notifications, and communication channel tables

-- Message status enum
CREATE TYPE message_status AS ENUM (
  'sent',
  'delivered',
  'read',
  'failed'
);

-- Message type enum
CREATE TYPE message_type AS ENUM (
  'text',
  'image',
  'document',
  'system',
  'notification'
);

-- Channel type enum
CREATE TYPE channel_type AS ENUM (
  'direct',
  'group',
  'property_inquiry',
  'verification_discussion',
  'support'
);

-- Notification type enum
CREATE TYPE notification_type AS ENUM (
  'property_update',
  'verification_status',
  'message_received',
  'trust_score_change',
  'fraud_alert',
  'system_announcement'
);

-- Notification priority enum
CREATE TYPE notification_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- Communication Channels table - Chat channels and conversations
CREATE TABLE communication_channels (
  id SERIAL PRIMARY KEY,
  channel_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  description TEXT,
  type channel_type NOT NULL,
  is_private BOOLEAN DEFAULT true NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participants JSONB DEFAULT '[]' NOT NULL,
  admins JSONB DEFAULT '[]' NOT NULL,
  related_property_id INTEGER REFERENCES properties(id),
  metadata JSONB DEFAULT '{}',
  last_message_at TIMESTAMP,
  message_count INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_archived BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Messages table - Individual messages within channels
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(50) UNIQUE NOT NULL,
  channel_id INTEGER NOT NULL REFERENCES communication_channels(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type message_type DEFAULT 'text' NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  reply_to_message_id INTEGER REFERENCES messages(id),
  is_edited BOOLEAN DEFAULT false NOT NULL,
  edited_at TIMESTAMP,
  status message_status DEFAULT 'sent' NOT NULL,
  read_by JSONB DEFAULT '[]',
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  deleted_at TIMESTAMP,
  deleted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Notifications table - System notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  notification_id VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'normal' NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  related_entity_id INTEGER,
  related_entity_type VARCHAR(50),
  action_url VARCHAR(500),
  action_text VARCHAR(100),
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMP,
  is_delivered BOOLEAN DEFAULT false NOT NULL,
  delivered_at TIMESTAMP,
  delivery_channels JSONB DEFAULT '["in_app"]',
  scheduled_for TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Message Threads table - For organizing related messages
CREATE TABLE message_threads (
  id SERIAL PRIMARY KEY,
  thread_id VARCHAR(50) UNIQUE NOT NULL,
  channel_id INTEGER NOT NULL REFERENCES communication_channels(id) ON DELETE CASCADE,
  root_message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  title VARCHAR(255),
  participants JSONB DEFAULT '[]' NOT NULL,
  message_count INTEGER DEFAULT 0 NOT NULL,
  last_message_at TIMESTAMP,
  last_message_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_locked BOOLEAN DEFAULT false NOT NULL,
  locked_by INTEGER REFERENCES users(id),
  locked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for communication_channels
CREATE UNIQUE INDEX communication_channels_channel_id_idx ON communication_channels(channel_id);
CREATE INDEX communication_channels_type_idx ON communication_channels(type);
CREATE INDEX communication_channels_created_by_idx ON communication_channels(created_by);
CREATE INDEX communication_channels_property_idx ON communication_channels(related_property_id);
CREATE INDEX communication_channels_active_idx ON communication_channels(is_active);
CREATE INDEX communication_channels_archived_idx ON communication_channels(is_archived);
CREATE INDEX communication_channels_last_message_idx ON communication_channels(last_message_at);
CREATE INDEX communication_channels_type_active_idx ON communication_channels(type, is_active);

-- Indexes for messages
CREATE UNIQUE INDEX messages_message_id_idx ON messages(message_id);
CREATE INDEX messages_channel_idx ON messages(channel_id);
CREATE INDEX messages_sender_idx ON messages(sender_id);
CREATE INDEX messages_type_idx ON messages(type);
CREATE INDEX messages_status_idx ON messages(status);
CREATE INDEX messages_reply_to_idx ON messages(reply_to_message_id);
CREATE INDEX messages_deleted_idx ON messages(is_deleted);
CREATE INDEX messages_created_at_idx ON messages(created_at);
CREATE INDEX messages_channel_created_idx ON messages(channel_id, created_at);
CREATE INDEX messages_channel_deleted_idx ON messages(channel_id, is_deleted);

-- Indexes for notifications
CREATE UNIQUE INDEX notifications_notification_id_idx ON notifications(notification_id);
CREATE INDEX notifications_user_idx ON notifications(user_id);
CREATE INDEX notifications_type_idx ON notifications(type);
CREATE INDEX notifications_priority_idx ON notifications(priority);
CREATE INDEX notifications_read_idx ON notifications(is_read);
CREATE INDEX notifications_delivered_idx ON notifications(is_delivered);
CREATE INDEX notifications_scheduled_idx ON notifications(scheduled_for);
CREATE INDEX notifications_active_idx ON notifications(is_active);
CREATE INDEX notifications_created_at_idx ON notifications(created_at);
CREATE INDEX notifications_user_read_idx ON notifications(user_id, is_read);
CREATE INDEX notifications_user_type_idx ON notifications(user_id, type);
CREATE INDEX notifications_priority_created_idx ON notifications(priority, created_at);

-- Indexes for message_threads
CREATE UNIQUE INDEX message_threads_thread_id_idx ON message_threads(thread_id);
CREATE INDEX message_threads_channel_idx ON message_threads(channel_id);
CREATE INDEX message_threads_root_message_idx ON message_threads(root_message_id);
CREATE INDEX message_threads_active_idx ON message_threads(is_active);
CREATE INDEX message_threads_locked_idx ON message_threads(is_locked);
CREATE INDEX message_threads_last_message_idx ON message_threads(last_message_at);
CREATE INDEX message_threads_channel_active_idx ON message_threads(channel_id, is_active);