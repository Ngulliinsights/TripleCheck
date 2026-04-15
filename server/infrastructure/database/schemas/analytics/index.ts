/**
 * Analytics System Schemas
 * 
 * Contains schemas for analytics, metrics, and tracking.
 */

import { relations } from "drizzle-orm";
import {
    pgTable,
    serial,
    varchar,
    text,
    integer,
    timestamp,
    json,
    pgEnum,
    index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Import core tables for relationships
import { users, properties } from "../core";

// Analytics event type enum
export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
    "page_view",
    "property_view",
    "search",
    "click",
    "conversion",
    "error",
] as const);

// Analytics events table
export const analyticsEvents = pgTable("analytics_events", {
    id: serial("id").primaryKey(),
    eventType: analyticsEventTypeEnum("event_type").notNull(),
    userId: integer("user_id"),
    propertyId: integer("property_id"),
    sessionId: varchar("session_id", { length: 100 }),
    eventData: json("event_data"),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    referrer: text("referrer"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index("analytics_events_user_id_idx").on(table.userId),
    propertyIdIdx: index("analytics_events_property_id_idx").on(table.propertyId),
    sessionIdIdx: index("analytics_events_session_id_idx").on(table.sessionId),
    createdAtIdx: index("analytics_events_created_at_idx").on(table.createdAt),
}));

// Analytics metrics table
export const analyticsMetrics = pgTable("analytics_metrics", {
    id: serial("id").primaryKey(),
    metricName: varchar("metric_name", { length: 100 }).notNull(),
    metricValue: varchar("metric_value", { length: 255 }).notNull(),
    dimensions: json("dimensions"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
    metricNameIdx: index("analytics_metrics_metric_name_idx").on(table.metricName),
    timestampIdx: index("analytics_metrics_timestamp_idx").on(table.timestamp),
}));

// Relations
export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
    user: one(users, {
        fields: [analyticsEvents.userId],
        references: [users.id],
    }),
    property: one(properties, {
        fields: [analyticsEvents.propertyId],
        references: [properties.id],
    }),
}));

// Zod schemas for validation
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents);
export const selectAnalyticsEventSchema = createSelectSchema(analyticsEvents);

export const insertAnalyticsMetricSchema = createInsertSchema(analyticsMetrics);
export const selectAnalyticsMetricSchema = createSelectSchema(analyticsMetrics);

// Export all analytics schemas
export const analyticsSchemas = {
    analyticsEvents,
    analyticsMetrics,
};

// Type exports
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetric = typeof analyticsMetrics.$inferInsert;
