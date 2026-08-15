/**
 * land-value-disclosure.schema.ts  (v3 — synthesis)
 *
 * ---------------------------------------------------------------------------
 * PROVENANCE — what came from where, and why
 * ---------------------------------------------------------------------------
 * This synthesizes two REAL, independently-generated Drizzle schemas:
 *
 *   - "Doc 3": African Property Trust's `publicProjectsSchemas` — a working
 *     schema with `properties`/`users` foreign keys, risk scoring, and a
 *     disclosure audit trail.
 *   - "Doc 4": Chanuka's `public_projects` / `land_value_alerts` schema —
 *     a working schema keyed entirely on `kenyanCountyEnum` arrays, with
 *     DB-level check constraints and evidence-weighted project-alert
 *     mappings.
 *
 * VERIFIED FINDING, NOT AN IMPRESSION: Doc 3 contains a direct violation
 * of the stated hard constraint ("no per-household or per-parcel ownership
 * tracking"). Its own module comment claims "no per-household tracking...
 * geographic matching rather than manual assignment," but
 * `propertyProjectOverlaps`, `informationAsymmetryAlerts`, and
 * `disclosureEvents` all carry a `.notNull()` foreign key to an individual
 * `properties.id`, and `disclosureEvents` additionally keys to individual
 * `users.id` on both the discloser and recipient side. This was confirmed
 * by grepping the actual field definitions, not inferred from the prose.
 * The likely cause: Doc 3's codebase already has a `properties` table as
 * its native unit (it's a property-verification platform), so property-
 * level foreign keys are the path of least resistance even while the
 * comments assert the opposite. Doc 4's codebase never had an equivalent
 * table to reach for, so nothing pulled it toward parcel-level keys.
 *
 * CONSEQUENCE FOR THIS SYNTHESIS: this is not a symmetric merge of two
 * equally-valid designs. Doc 4's TABLE STRUCTURE is the base — every
 * geographic key in this file is `kenyanCountyEnum(...).array()`, matching
 * Doc 4, never a `properties.id` or `parcelId` foreign key. Doc 3's
 * genuinely valuable FIELDS are ported in below, but re-homed onto
 * project/alert/area granularity instead of property granularity. Where a
 * Doc 3 field's whole reason for existing was property-level tracking
 * (e.g. it measured one specific property's transaction outcome), it is
 * re-scoped to measure an AREA'S aggregate outcome instead, per the
 * constraint — see AlertOutcomeSchema below for the concrete rework.
 * ---------------------------------------------------------------------------
 */

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Centralized helpers for consistent schema patterns
import { auditFields, primaryKeyUuid, checkConstraints } from "../helpers";

// Note: kenyanCountyEnum needs to be created or replaced with local type
// For now, using a placeholder that can be updated when the enum is available
export const kenyanCountyEnum = (name: string) => 
  varchar(name, { length: 100 });

// =============================================================================
// LITERAL UNION TYPES
// =============================================================================

/**
 * Project type list: union of Doc 3's and Doc 4's lists, deduplicated.
 * Doc 3 had school/hospital as separate from Doc 4's school_construction/
 * health_facility — kept Doc 4's naming since it's more specific about
 * lifecycle stage (construction vs. operational), matching how
 * project_stage already separates those concerns elsewhere in this file.
 */
export type ProjectType =
  | "road_infrastructure"
  | "water_infrastructure"
  | "electrification"
  | "school_construction"
  | "health_facility"
  | "market_development"
  | "irrigation_scheme"
  | "industrial_zone"
  | "rezoning"
  | "extractive_license"
  | "other";

/**
 * Project stage: Doc 4's list, which is finer-grained than Doc 3's
 * (separates approved/funded/under_construction where Doc 3 collapses
 * planning+approved). Added "delayed" from Doc 3 since it's a genuinely
 * distinct state neither "under_construction" nor "cancelled" captures —
 * a delayed project still affects land value expectations differently
 * than a cancelled one.
 */
export type ProjectStage =
  | "proposed"
  | "under_study"
  | "approved"
  | "funded"
  | "under_construction"
  | "delayed"
  | "operational"
  | "cancelled";

/**
 * Source type: Doc 4's list (gazette_notice, budget_document,
 * administrative_notice, press_release, legislative_bill, court_decision)
 * kept whole — it's a superset of Doc 3's sourceCredibilityEnum, and
 * mapping "credibility" onto "type" conflates two different things (WHAT
 * kind of document vs. HOW MUCH to trust it). Trust is handled separately
 * below via evidence_weight, matching Doc 4's project_alert_mappings
 * pattern rather than Doc 3's baked-in sourceCredibilityEnum.
 */
export type ProjectSource =
  | "gazette_notice"
  | "budget_document"
  | "administrative_notice"
  | "press_release"
  | "legislative_bill"
  | "court_decision";

export type ValueImpactLevel = "unknown" | "low" | "medium" | "high" | "very_high";
export type AlertUrgency = "informational" | "advisory" | "warning" | "critical";
export type AlertStatus = "draft" | "active" | "expired" | "superseded";

/**
 * NEW IN SYNTHESIS: ported from Doc 3's `overlapType` concept
 * ("direct"/"adjacent"/"nearby"), but renamed and re-scoped. Doc 3 applied
 * this to a property-to-project distance relationship, which this
 * synthesis cannot use directly (see provenance note above). Here it
 * describes how directly an AREA (ward/constituency, still nested inside
 * a county) relates to a project's stated corridor/site, which preserves
 * Doc 3's real insight — "impact isn't binary, it's graduated by
 * distance" — without requiring a property-level foreign key to express.
 */
export type AreaProximity = "direct" | "adjacent" | "nearby";

// =============================================================================
// PUBLIC PROJECTS  (base: Doc 4's public_projects, unchanged in structure)
// =============================================================================

export const public_projects = pgTable(
  "public_projects",
  {
    id: primaryKeyUuid(),

    project_name: varchar("project_name", { length: 500 }).notNull(),
    project_type: varchar("project_type", { length: 50 }).notNull().$type<ProjectType>(),
    project_stage: varchar("project_stage", { length: 50 }).notNull().$type<ProjectStage>(),

    affected_counties: kenyanCountyEnum("affected_counties").array().notNull(),
    affected_counties_count: smallint("affected_counties_count").notNull().default(0),

    /**
     * NEW IN SYNTHESIS, ported from Doc 3's finer sub-county fields
     * (subCounty, ward as plain varchars), but kept OPTIONAL and
     * free-text rather than a new enum, since only county has a
     * confirmed enum in either real codebase. This mirrors the same
     * "corridorDescription" pattern from my own earlier v1/v2 attempts,
     * now folded into the actually-correct base table instead of a
     * separate invented one.
     */
    affected_ward_or_corridor: text("affected_ward_or_corridor"),

    description: text("description"),
    estimated_completion_date: date("estimated_completion_date"),
    budget_allocation: integer("budget_allocation"),

    value_impact_level: varchar("value_impact_level", { length: 50 })
      .notNull()
      .$type<ValueImpactLevel>(),
    value_impact_rationale: text("value_impact_rationale"),

    source_type: varchar("source_type", { length: 50 }).notNull().$type<ProjectSource>(),
    source_reference: varchar("source_reference", { length: 500 }),
    source_url: varchar("source_url", { length: 500 }),
    source_date: date("source_date").notNull(),

    verification_status: varchar("verification_status", { length: 50 })
      .notNull()
      .default("unverified"),
    verification_notes: text("verification_notes"),
    verified_by: uuid("verified_by"),

    alert_generated: boolean("alert_generated").notNull().default(false),
    alert_generated_at: timestamp("alert_generated_at", { withTimezone: true }),
    alert_expiry_date: date("alert_expiry_date"),

    project_metadata: jsonb("project_metadata").notNull().default(sql`'{}'::jsonb`),

    ...auditFields(),
  },
  (table) => ({
    projectSourceUnique: unique("public_projects_project_source_unique").on(
      table.project_name,
      table.source_type,
      table.source_reference
    ),

    countyStageIdx: index("idx_public_projects_county_stage")
      .on(table.affected_counties, table.project_stage)
      .where(sql`${table.project_stage} NOT IN ('cancelled', 'operational')`),

    sourceDateIdx: index("idx_public_projects_source_date").on(
      table.source_type,
      table.source_date.desc()
    ),

    impactLevelIdx: index("idx_public_projects_impact_level").on(
      table.value_impact_level,
      table.project_stage
    ),

    alertGeneratedIdx: index("idx_public_projects_alert_generated")
      .on(table.alert_generated, table.alert_generated_at)
      .where(sql`${table.alert_generated} = false`),

    affectedCountiesIdx: index("idx_public_projects_affected_counties").using(
      "gin",
      table.affected_counties
    ),

    countiesCountCheck: check(
      "public_projects_counties_count_check",
      checkConstraints.arrayCountMatches(table.affected_counties, table.affected_counties_count, "counties_count")
    ),

    countiesNotEmptyCheck: check(
      "public_projects_counties_not_empty_check",
      checkConstraints.arrayNotEmpty(table.affected_counties, "counties_not_empty")
    ),

    budgetPositiveCheck: check(
      "public_projects_budget_positive_check",
      checkConstraints.positive(table.budget_allocation, "budget_positive")
    ),
  })
);

// =============================================================================
// LAND VALUE ALERTS  (base: Doc 4's land_value_alerts, extended)
// =============================================================================

export const land_value_alerts = pgTable(
  "land_value_alerts",
  {
    id: primaryKeyUuid(),

    alert_type: varchar("alert_type", { length: 100 }).notNull(),
    urgency: varchar("urgency", { length: 50 }).notNull().$type<AlertUrgency>(),
    status: varchar("status", { length: 50 }).notNull().$type<AlertStatus>(),

    affected_counties: kenyanCountyEnum("affected_counties").array().notNull(),
    affected_counties_count: smallint("affected_counties_count").notNull().default(0),

    /**
     * NEW IN SYNTHESIS, ported and re-scoped from Doc 3's `overlapType`.
     * Describes this alert's relationship to its triggering project(s) at
     * area granularity — see AreaProximity type above for why this is
     * safe to keep while a property-level version was not.
     */
    area_proximity: varchar("area_proximity", { length: 20 }).$type<AreaProximity>(),

    title: varchar("title", { length: 500 }).notNull(),
    message: text("message").notNull(),
    recommended_action: text("recommended_action"),

    triggering_projects: uuid("triggering_projects").array().notNull(),
    evidence_summary: text("evidence_summary"),

    /**
     * SPLIT IN SYNTHESIS: Doc 4 had a single `confidence_level`. Doc 3
     * had `riskScore` (0-100, severity) and `confidence` (0-1, certainty
     * in that severity) as genuinely separate fields — worth keeping
     * separate, since "how bad" and "how sure we are it's that bad" are
     * different questions and collapsing them loses information a
     * reviewer would want when deciding whether to auto-send an alert.
     */
    risk_score: smallint("risk_score"), // 0-100: how severe, if this alert is right
    confidence_level: smallint("confidence_level"), // 0-100: how sure we are it's right

    effective_date: date("effective_date").notNull(),
    expiry_date: date("expiry_date"),
    superseded_by: uuid("superseded_by"),

    notification_sent: boolean("notification_sent").notNull().default(false),
    notification_sent_at: timestamp("notification_sent_at", { withTimezone: true }),
    notification_channels: varchar("notification_channels", { length: 100 }).array(),

    view_count: integer("view_count").notNull().default(0),
    unique_viewers_count: integer("unique_viewers_count").notNull().default(0),
    share_count: integer("share_count").notNull().default(0),

    /**
     * NEW IN SYNTHESIS, ported from Doc 3's `falsePositive` +
     * `resolutionNotes` on informationAsymmetryAlerts — a real gap in
     * Doc 4's design that Doc 3 caught: without this, there is no
     * recorded outcome once an alert stops being active, which means
     * the system can never learn whether its alerts were actually
     * correct.
     */
    marked_false_positive: boolean("marked_false_positive").notNull().default(false),
    resolution_notes: text("resolution_notes"),

    alert_metadata: jsonb("alert_metadata").notNull().default(sql`'{}'::jsonb`),

    ...auditFields(),
  },
  (table) => ({
    countyStatusIdx: index("idx_land_value_alerts_county_status")
      .on(table.affected_counties, table.status, table.urgency)
      .where(sql`${table.status} = 'active'`),

    urgencyIdx: index("idx_land_value_alerts_urgency")
      .on(table.urgency, table.effective_date.desc())
      .where(sql`${table.status} = 'active'`),

    notificationSentIdx: index("idx_land_value_alerts_notification_sent")
      .on(table.notification_sent, table.notification_sent_at)
      .where(sql`${table.notification_sent} = false`),

    engagementIdx: index("idx_land_value_alerts_engagement").on(
      table.view_count.desc(),
      table.share_count.desc()
    ),

    affectedCountiesIdx: index("idx_land_value_alerts_affected_counties").using(
      "gin",
      table.affected_counties
    ),

    triggeringProjectsIdx: index("idx_land_value_alerts_triggering_projects").using(
      "gin",
      table.triggering_projects
    ),

    countiesCountCheck: check(
      "land_value_alerts_counties_count_check",
      checkConstraints.arrayCountMatches(table.affected_counties, table.affected_counties_count, "counties_count")
    ),

    countiesNotEmptyCheck: check(
      "land_value_alerts_counties_not_empty_check",
      checkConstraints.arrayNotEmpty(table.affected_counties, "counties_not_empty")
    ),

    projectsNotEmptyCheck: check(
      "land_value_alerts_projects_not_empty_check",
      checkConstraints.arrayNotEmpty(table.triggering_projects, "projects_not_empty")
    ),

    // NEW IN SYNTHESIS: check constraints for the two ported Doc 3 fields,
    // since Doc 3 had NO check constraints anywhere — this closes that
    // gap for the fields being carried forward, matching Doc 4's
    // DB-enforced-invariant pattern rather than leaving them
    // application-layer-only as Doc 3 did.
    riskScoreRangeCheck: check(
      "land_value_alerts_risk_score_range_check",
      checkConstraints.percentage(table.risk_score, "risk_score")
    ),

    confidenceRangeCheck: check(
      "land_value_alerts_confidence_range_check",
      checkConstraints.percentage(table.confidence_level, "confidence")
    ),

    dateRangeCheck: check(
      "land_value_alerts_date_range_check",
      checkConstraints.dateAfter(table.effective_date, table.expiry_date, "date_range")
    ),
  })
);

// =============================================================================
// ALERT SUBSCRIPTIONS  (Doc 4's, unchanged — Doc 3 had no equivalent)
// =============================================================================

export const land_alert_subscriptions = pgTable(
  "land_alert_subscriptions",
  {
    id: primaryKeyUuid(),

    user_id: uuid("user_id").notNull(),
    county: kenyanCountyEnum("county").notNull(),

    notification_channels: varchar("notification_channels", { length: 100 }).array().notNull(),
    minimum_urgency: varchar("minimum_urgency", { length: 50 }).notNull().$type<AlertUrgency>(),

    is_active: boolean("is_active").notNull().default(true),
    subscribed_at: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
    unsubscribed_at: timestamp("unsubscribed_at", { withTimezone: true }),
    unsubscribe_reason: varchar("unsubscribe_reason", { length: 255 }),

    alerts_received: integer("alerts_received").notNull().default(0),
    last_alert_received_at: timestamp("last_alert_received_at", { withTimezone: true }),
    alerts_clicked: integer("alerts_clicked").notNull().default(0),

    ...auditFields(),
  },
  (table) => ({
    // Conditional uniqueness ("one ACTIVE subscription per user per county")
    // requires a partial unique INDEX via uniqueIndex(), not unique() —
    // the installed Drizzle version's UniqueConstraintBuilder has no
    // .where() method. uniqueIndex() sets the `unique` flag at
    // construction (confirmed against IndexBuilderOn's actual type
    // definition), which a plain index().where() would NOT have done —
    // that would only have been a partial index, not a partial UNIQUE
    // index, silently dropping the uniqueness guarantee entirely.
    userCountyActiveUniqueIdx: uniqueIndex("land_alert_subscriptions_user_county_active_unique_idx")
      .on(table.user_id, table.county)
      .where(sql`${table.is_active} = true`),

    countyActiveIdx: index("idx_land_alert_subscriptions_county_active")
      .on(table.county, table.is_active)
      .where(sql`${table.is_active} = true`),

    userActiveIdx: index("idx_land_alert_subscriptions_user_active")
      .on(table.user_id, table.is_active)
      .where(sql`${table.is_active} = true`),

    engagementIdx: index("idx_land_alert_subscriptions_engagement").on(
      table.alerts_received.desc(),
      table.alerts_clicked.desc()
    ),
  })
);

// =============================================================================
// PROJECT-ALERT MAPPINGS  (Doc 4's, unchanged — this IS the tight/diffuse
// evidence-tiering pattern from v2, already correctly implemented here as
// evidence_weight + reasoning. Doc 3 had no equivalent at all.)
// =============================================================================

export const project_alert_mappings = pgTable(
  "project_alert_mappings",
  {
    id: primaryKeyUuid(),

    project_id: uuid("project_id")
      .notNull()
      .references(() => public_projects.id, { onDelete: "cascade" }),
    alert_id: uuid("alert_id")
      .notNull()
      .references(() => land_value_alerts.id, { onDelete: "cascade" }),

    evidence_weight: smallint("evidence_weight").notNull(),
    reasoning: text("reasoning"),
    project_stage_at_alert: varchar("project_stage_at_alert", { length: 50 }).$type<ProjectStage>(),

    ...auditFields(),
  },
  (table) => ({
    projectAlertUnique: unique("project_alert_mappings_project_alert_unique").on(
      table.project_id,
      table.alert_id
    ),

    projectIdx: index("idx_project_alert_mappings_project").on(table.project_id),
    alertIdx: index("idx_project_alert_mappings_alert").on(table.alert_id),

    evidenceWeightCheck: check(
      "project_alert_mappings_evidence_weight_check",
      sql`${table.evidence_weight} >= 0 AND ${table.evidence_weight} <= 100`
    ),
  })
);

// =============================================================================
// AREA MARKET IMPACT  — NEW TABLE IN SYNTHESIS, ported from Doc 3's
// projectMarketImpact, re-homed onto county/ward-area text rather than a
// free-text "area" string with no enum backing, and re-verified against
// the same aggregate-only intent Doc 3 stated but this time WITH check
// constraints enforcing it can't silently become per-transaction data.
// =============================================================================

export const project_area_market_impact = pgTable(
  "project_area_market_impact",
  {
    id: primaryKeyUuid(),

    project_id: uuid("project_id")
      .notNull()
      .references(() => public_projects.id, { onDelete: "cascade" }),

    county: kenyanCountyEnum("county").notNull(),
    area_description: text("area_description"), // ward/corridor, free text — same reasoning as public_projects.affected_ward_or_corridor above

    period_start: date("period_start").notNull(),
    period_end: date("period_end").notNull(),

    /**
     * Aggregate-only, mirroring Doc 3's explicit intent. The check
     * constraint below is NEW in synthesis — Doc 3 stated "no individual
     * transaction tracking" in a comment but enforced nothing; this makes
     * the sample-size-implies-aggregation relationship explicit at the DB
     * level: a row claiming 1 property in scope is indistinguishable from
     * per-property tracking, so a minimum is enforced.
     */
    property_count_in_area: integer("property_count_in_area").notNull(),
    average_price_before: integer("average_price_before"), // KSh, aggregate only
    average_price_after: integer("average_price_after"), // KSh, aggregate only
    price_change_percentage: smallint("price_change_percentage"), // can be negative

    transaction_count: integer("transaction_count").notNull().default(0),
    project_stage_at_measurement: varchar("project_stage_at_measurement", { length: 50 }).$type<ProjectStage>(),

    data_quality: varchar("data_quality", { length: 20 }).notNull().default("medium"),
    sample_size: integer("sample_size"),

    calculated_at: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),

    ...auditFields(),
  },
  (table) => ({
    projectAreaeriodUnique: unique("project_area_market_impact_unique").on(
      table.project_id,
      table.county,
      table.area_description,
      table.period_start,
      table.period_end
    ),

    projectIdx: index("idx_project_area_market_impact_project").on(table.project_id),
    countyIdx: index("idx_project_area_market_impact_county").on(table.county),
    periodIdx: index("idx_project_area_market_impact_period").on(
      table.period_start,
      table.period_end
    ),

    // NEW check constraint, not present in Doc 3: enforces the
    // aggregate-only intent rather than leaving it as a comment.
    aggregateMinimumCheck: check(
      "project_area_market_impact_aggregate_minimum_check",
      sql`${table.property_count_in_area} >= 5` // below this, "aggregate" starts to functionally identify individuals in a sparse rural ward
    ),

    priceChangeRangeCheck: check(
      "project_area_market_impact_price_change_range_check",
      sql`${table.price_change_percentage} IS NULL OR (${table.price_change_percentage} >= -100 AND ${table.price_change_percentage} <= 1000)`
    ),

    periodOrderCheck: check(
      "project_area_market_impact_period_order_check",
      sql`${table.period_end} > ${table.period_start}`
    ),
  })
);

// =============================================================================
// RELATIONS
// =============================================================================

export const publicProjectsRelations = relations(public_projects, ({ many }) => ({
  alertMappings: many(project_alert_mappings),
  areaMarketImpacts: many(project_area_market_impact),
}));

export const landValueAlertsRelations = relations(land_value_alerts, ({ many }) => ({
  projectMappings: many(project_alert_mappings),
}));

export const projectAlertMappingsRelations = relations(project_alert_mappings, ({ one }) => ({
  project: one(public_projects, {
    fields: [project_alert_mappings.project_id],
    references: [public_projects.id],
  }),
  alert: one(land_value_alerts, {
    fields: [project_alert_mappings.alert_id],
    references: [land_value_alerts.id],
  }),
}));

export const projectAreaMarketImpactRelations = relations(project_area_market_impact, ({ one }) => ({
  project: one(public_projects, {
    fields: [project_area_market_impact.project_id],
    references: [public_projects.id],
  }),
}));

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type PublicProject = typeof public_projects.$inferSelect;
export type NewPublicProject = typeof public_projects.$inferInsert;

export type LandValueAlert = typeof land_value_alerts.$inferSelect;
export type NewLandValueAlert = typeof land_value_alerts.$inferInsert;

export type LandAlertSubscription = typeof land_alert_subscriptions.$inferSelect;
export type NewLandAlertSubscription = typeof land_alert_subscriptions.$inferInsert;

export type ProjectAlertMapping = typeof project_alert_mappings.$inferSelect;
export type NewProjectAlertMapping = typeof project_alert_mappings.$inferInsert;

export type ProjectAreaMarketImpact = typeof project_area_market_impact.$inferSelect;
export type NewProjectAreaMarketImpact = typeof project_area_market_impact.$inferInsert;

// =============================================================================
// WHAT WAS DELIBERATELY LEFT OUT OF THIS SYNTHESIS
// =============================================================================
/**
 * Doc 3's `disclosureEvents` table (the "who knew what when" audit trail,
 * with `disclosedBy`/`disclosedToUserId` and `transactionImpact`) is NOT
 * ported into this synthesis, even though `transactionImpact` was flagged
 * above as possibly the single most valuable field in either document.
 * The reason: every version of it in Doc 3 is keyed to an individual user
 * and an individual property — disclosing something TO a specific person
 * ABOUT a specific property is, definitionally, the per-household/per-
 * parcel tracking the hard constraint rules out. There is no way to
 * re-scope "did this specific disclosure prevent this specific sale" to
 * area-level without losing the thing that made it useful. This is a
 * genuine capability gap in the synthesis, not an oversight — closing it
 * would require either relaxing the no-individual-tracking constraint
 * (a real decision to make deliberately, not accidentally) or finding a
 * different, aggregate-safe proxy for "did the alert work" (e.g. area-
 * level `project_area_market_impact.transaction_count` trending down
 * after an alert fires, as a weak but constraint-compliant substitute).
 */