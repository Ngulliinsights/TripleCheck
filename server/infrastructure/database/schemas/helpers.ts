/**
 * Database Schema Helpers
 * 
 * Reusable patterns and utilities for consistent schema design across
 * all domain schemas. Centralized to reduce duplication and ensure consistency.
 */

import { sql } from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Standard audit fields for tracking record lifecycle
 * Ensures consistent timestamp and user tracking across all tables
 */
export const auditFields = () => ({
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  deletedAt: timestamp("deleted_at"), // For soft delete pattern
});

/**
 * Primary key helper for UUID-based tables
 * Better for distributed systems and avoids ID collisions
 */
export const primaryKeyUuid = () => uuid("id").defaultRandom().primaryKey();

/**
 * Common check constraint helpers
 * Reusable SQL check patterns for data validation
 */

export const checkConstraints = {
  /**
   * Ensures a numeric field is within a specified range
   */
  range: (field: any, min: number, max: number, name: string) => 
    sql`${field} IS NULL OR (${field} >= ${min} AND ${field} <= ${max})`,

  /**
   * Ensures a percentage field is between 0 and 100
   */
  percentage: (field: any, name: string) => 
    sql`${field} IS NULL OR (${field} >= 0 AND ${field} <= 100)`,

  /**
   * Ensures a date field is after another date field
   */
  dateAfter: (before: any, after: any, name: string) => 
    sql`${after} IS NULL OR ${after} > ${before}`,

  /**
   * Ensures an array field is not empty
   */
  arrayNotEmpty: (field: any, name: string) => 
    sql`array_length(${field}, 1) > 0`,

  /**
   * Ensures array count matches array length
   */
  arrayCountMatches: (arrayField: any, countField: any, name: string) => 
    sql`${countField} >= 0 AND ${countField} = array_length(${arrayField}, 1)`,

  /**
   * Ensures a positive number
   */
  positive: (field: any, name: string) => 
    sql`${field} IS NULL OR ${field} > 0`,

  /**
   * Ensures a non-negative number
   */
  nonNegative: (field: any, name: string) => 
    sql`${field} IS NULL OR ${field} >= 0`,
};

/**
 * Common index helpers
 * Reusable index patterns for performance optimization
 */

export const indexPatterns = {
  /**
   * Partial index for active records only
   * Useful for tables with status fields where you mostly query active items
   */
  activeOnly: (statusField: any, activeValues: string[]) => 
    sql`${statusField} IN (${activeValues.map(v => `'${v}'`).join(', ')})`,

  /**
   * Partial index for records requiring action
   * Useful for workflow tables where you want to optimize pending items
   */
  requiresAction: (field: any, condition: string) => 
    sql`${field} ${condition}`,

  /**
   * Partial index for recent records
   * Useful for time-based queries where you mostly care about recent data
   */
  recentOnly: (dateField: any, days: number) => 
    sql`${dateField} > NOW() - INTERVAL '${days} days'`,
};