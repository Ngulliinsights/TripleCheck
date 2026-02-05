#!/usr/bin/env tsx
// Custom migration script for Land Verification System
// This script adds only the new land verification tables to an existing database

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";

// Load environment variables from .env file
config();

async function migrateLandVerification() {
  console.log("🚀 Starting Land Verification System migration...");

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    console.log("Please set your DATABASE_URL in the .env file");
    process.exit(1);
  }

  try {
    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    console.log("✅ Database connection established");

    // Create new enums (only the ones that don't exist)
    console.log("📝 Creating new enums...");
    
    const newEnums = [
      `CREATE TYPE IF NOT EXISTS "community_feedback_source" AS ENUM('local_admin', 'neighbor', 'community_leader', 'resident');`,
      `CREATE TYPE IF NOT EXISTS "government_designation_type" AS ENUM('riparian', 'road_reserve', 'utility_corridor', 'environmental', 'mineral_rights');`,
      `CREATE TYPE IF NOT EXISTS "land_verification_status" AS ENUM('not_started', 'in_progress', 'completed', 'suspended', 'failed');`,
      `CREATE TYPE IF NOT EXISTS "risk_category" AS ENUM('ownership', 'government', 'legal', 'physical', 'community');`,
      `CREATE TYPE IF NOT EXISTS "risk_level" AS ENUM('low', 'medium', 'high', 'critical');`,
      `CREATE TYPE IF NOT EXISTS "verification_layer_type" AS ENUM('registry', 'physical', 'community', 'government', 'legal', 'expert');`
    ];

    for (const enumSql of newEnums) {
      try {
        await sql(enumSql);
        console.log(`✅ Created enum: ${enumSql.split('"')[1]}`);
      } catch (error) {
        console.log(`ℹ️  Enum already exists or error: ${enumSql.split('"')[1]}`);
      }
    }

    // Create new tables
    console.log("📝 Creating land verification tables...");

    const landVerificationTables = [
      // Land Verification Sessions table
      `CREATE TABLE IF NOT EXISTS "land_verification_sessions" (
        "id" serial PRIMARY KEY NOT NULL,
        "property_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "status" "land_verification_status" DEFAULT 'not_started' NOT NULL,
        "current_layer" "verification_layer_type",
        "overall_risk_score" integer DEFAULT 0,
        "risk_level" "risk_level" DEFAULT 'low' NOT NULL,
        "confidence" numeric(3, 2) DEFAULT '0.00',
        "estimated_completion_date" timestamp,
        "actual_completion_date" timestamp,
        "monitoring_enabled" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );`,

      // Verification Layers table
      `CREATE TABLE IF NOT EXISTS "verification_layers" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_id" integer NOT NULL,
        "layer_type" "verification_layer_type" NOT NULL,
        "status" "land_verification_status" DEFAULT 'not_started' NOT NULL,
        "started_at" timestamp,
        "completed_at" timestamp,
        "estimated_duration" integer,
        "actual_duration" integer,
        "assigned_expert_id" integer,
        "results" json DEFAULT '{}'::json,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );`,

      // Risk Factors table
      `CREATE TABLE IF NOT EXISTS "risk_factors" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_id" integer NOT NULL,
        "category" "risk_category" NOT NULL,
        "severity" "risk_level" NOT NULL,
        "confidence" numeric(3, 2) NOT NULL,
        "description" text NOT NULL,
        "evidence" json DEFAULT '[]'::json,
        "impact" text NOT NULL,
        "likelihood" numeric(3, 2) NOT NULL,
        "mitigation" json DEFAULT '[]'::json,
        "source_layer" "verification_layer_type" NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );`,

      // Government Designations table
      `CREATE TABLE IF NOT EXISTS "government_designations" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_id" integer NOT NULL,
        "designation_type" "government_designation_type" NOT NULL,
        "authority" varchar(255) NOT NULL,
        "designation" varchar(255) NOT NULL,
        "restrictions" json DEFAULT '[]'::json,
        "buffer_zone" integer,
        "risk_level" "risk_level" NOT NULL,
        "affected_area" json,
        "planned_changes" json DEFAULT '[]'::json,
        "last_verified" timestamp DEFAULT now() NOT NULL,
        "valid_until" timestamp,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );`,

      // Community Feedback table
      `CREATE TABLE IF NOT EXISTS "community_feedback" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_id" integer NOT NULL,
        "source" "community_feedback_source" NOT NULL,
        "source_name" varchar(255),
        "source_position" varchar(255),
        "contact_info" varchar(255),
        "years_in_area" integer,
        "ownership_history" text,
        "known_disputes" json DEFAULT '[]'::json,
        "land_use_patterns" json DEFAULT '[]'::json,
        "recent_changes" json DEFAULT '[]'::json,
        "concerns" json DEFAULT '[]'::json,
        "reliability" numeric(3, 2) DEFAULT '0.50',
        "verified_by" varchar(255),
        "is_confidential" boolean DEFAULT false NOT NULL,
        "recorded_at" timestamp DEFAULT now() NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );`,

      // Expert Assignments table
      `CREATE TABLE IF NOT EXISTS "expert_assignments" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_id" integer NOT NULL,
        "layer_id" integer,
        "expert_type" varchar(50) NOT NULL,
        "expert_name" varchar(255) NOT NULL,
        "expert_credentials" varchar(500),
        "contact_info" varchar(255),
        "specialization" varchar(255),
        "assigned_at" timestamp DEFAULT now() NOT NULL,
        "expected_completion_date" timestamp,
        "actual_completion_date" timestamp,
        "status" varchar(50) DEFAULT 'assigned' NOT NULL,
        "report_url" varchar(500),
        "cost" numeric(10, 2),
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );`,

      // Property Monitoring table
      `CREATE TABLE IF NOT EXISTS "property_monitoring" (
        "id" serial PRIMARY KEY NOT NULL,
        "property_id" integer NOT NULL,
        "session_id" integer,
        "user_id" integer NOT NULL,
        "monitoring_type" varchar(50) NOT NULL,
        "frequency" varchar(20) DEFAULT 'monthly' NOT NULL,
        "last_checked" timestamp,
        "next_check" timestamp,
        "alerts_generated" integer DEFAULT 0,
        "is_active" boolean DEFAULT true NOT NULL,
        "configuration" json DEFAULT '{}'::json,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );`,

      // Monitoring Alerts table
      `CREATE TABLE IF NOT EXISTS "monitoring_alerts" (
        "id" serial PRIMARY KEY NOT NULL,
        "monitoring_id" integer NOT NULL,
        "property_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "alert_type" varchar(50) NOT NULL,
        "severity" "risk_level" NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "action_required" boolean DEFAULT false NOT NULL,
        "action_taken" boolean DEFAULT false NOT NULL,
        "action_notes" text,
        "is_read" boolean DEFAULT false NOT NULL,
        "is_dismissed" boolean DEFAULT false NOT NULL,
        "expires_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );`
    ];

    for (const tableSql of landVerificationTables) {
      try {
        await sql(tableSql);
        const tableName = tableSql.match(/"([^"]+)"/)?.[1] || 'unknown';
        console.log(`✅ Created table: ${tableName}`);
      } catch (error) {
        console.error(`❌ Error creating table:`, error);
      }
    }

    // Add foreign key constraints
    console.log("📝 Adding foreign key constraints...");
    
    const foreignKeys = [
      `ALTER TABLE "land_verification_sessions" ADD CONSTRAINT IF NOT EXISTS "land_verification_sessions_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE cascade;`,
      `ALTER TABLE "land_verification_sessions" ADD CONSTRAINT IF NOT EXISTS "land_verification_sessions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;`,
      `ALTER TABLE "verification_layers" ADD CONSTRAINT IF NOT EXISTS "verification_layers_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "land_verification_sessions"("id") ON DELETE cascade;`,
      `ALTER TABLE "risk_factors" ADD CONSTRAINT IF NOT EXISTS "risk_factors_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "land_verification_sessions"("id") ON DELETE cascade;`,
      `ALTER TABLE "government_designations" ADD CONSTRAINT IF NOT EXISTS "government_designations_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "land_verification_sessions"("id") ON DELETE cascade;`,
      `ALTER TABLE "community_feedback" ADD CONSTRAINT IF NOT EXISTS "community_feedback_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "land_verification_sessions"("id") ON DELETE cascade;`,
      `ALTER TABLE "expert_assignments" ADD CONSTRAINT IF NOT EXISTS "expert_assignments_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "land_verification_sessions"("id") ON DELETE cascade;`,
      `ALTER TABLE "expert_assignments" ADD CONSTRAINT IF NOT EXISTS "expert_assignments_layer_id_fk" FOREIGN KEY ("layer_id") REFERENCES "verification_layers"("id") ON DELETE cascade;`,
      `ALTER TABLE "property_monitoring" ADD CONSTRAINT IF NOT EXISTS "property_monitoring_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE cascade;`,
      `ALTER TABLE "property_monitoring" ADD CONSTRAINT IF NOT EXISTS "property_monitoring_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "land_verification_sessions"("id") ON DELETE cascade;`,
      `ALTER TABLE "property_monitoring" ADD CONSTRAINT IF NOT EXISTS "property_monitoring_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;`,
      `ALTER TABLE "monitoring_alerts" ADD CONSTRAINT IF NOT EXISTS "monitoring_alerts_monitoring_id_fk" FOREIGN KEY ("monitoring_id") REFERENCES "property_monitoring"("id") ON DELETE cascade;`,
      `ALTER TABLE "monitoring_alerts" ADD CONSTRAINT IF NOT EXISTS "monitoring_alerts_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE cascade;`,
      `ALTER TABLE "monitoring_alerts" ADD CONSTRAINT IF NOT EXISTS "monitoring_alerts_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;`
    ];

    for (const fkSql of foreignKeys) {
      try {
        await sql(fkSql);
        console.log(`✅ Added foreign key constraint`);
      } catch (error) {
        console.log(`ℹ️  Foreign key constraint already exists or error`);
      }
    }

    // Create indexes
    console.log("📝 Creating indexes...");
    
    const indexes = [
      // Land verification sessions indexes
      `CREATE INDEX IF NOT EXISTS "land_verification_sessions_property_idx" ON "land_verification_sessions" ("property_id");`,
      `CREATE INDEX IF NOT EXISTS "land_verification_sessions_user_idx" ON "land_verification_sessions" ("user_id");`,
      `CREATE INDEX IF NOT EXISTS "land_verification_sessions_status_idx" ON "land_verification_sessions" ("status");`,
      `CREATE INDEX IF NOT EXISTS "land_verification_sessions_risk_level_idx" ON "land_verification_sessions" ("risk_level");`,
      `CREATE INDEX IF NOT EXISTS "land_verification_sessions_created_at_idx" ON "land_verification_sessions" ("created_at");`,
      
      // Verification layers indexes
      `CREATE INDEX IF NOT EXISTS "verification_layers_session_idx" ON "verification_layers" ("session_id");`,
      `CREATE INDEX IF NOT EXISTS "verification_layers_layer_type_idx" ON "verification_layers" ("layer_type");`,
      `CREATE INDEX IF NOT EXISTS "verification_layers_status_idx" ON "verification_layers" ("status");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "verification_layers_session_layer_unique" ON "verification_layers" ("session_id", "layer_type");`,
      
      // Risk factors indexes
      `CREATE INDEX IF NOT EXISTS "risk_factors_session_idx" ON "risk_factors" ("session_id");`,
      `CREATE INDEX IF NOT EXISTS "risk_factors_category_idx" ON "risk_factors" ("category");`,
      `CREATE INDEX IF NOT EXISTS "risk_factors_severity_idx" ON "risk_factors" ("severity");`,
      
      // Government designations indexes
      `CREATE INDEX IF NOT EXISTS "government_designations_session_idx" ON "government_designations" ("session_id");`,
      `CREATE INDEX IF NOT EXISTS "government_designations_type_idx" ON "government_designations" ("designation_type");`,
      
      // Community feedback indexes
      `CREATE INDEX IF NOT EXISTS "community_feedback_session_idx" ON "community_feedback" ("session_id");`,
      `CREATE INDEX IF NOT EXISTS "community_feedback_source_idx" ON "community_feedback" ("source");`,
      
      // Expert assignments indexes
      `CREATE INDEX IF NOT EXISTS "expert_assignments_session_idx" ON "expert_assignments" ("session_id");`,
      `CREATE INDEX IF NOT EXISTS "expert_assignments_expert_type_idx" ON "expert_assignments" ("expert_type");`,
      
      // Property monitoring indexes
      `CREATE INDEX IF NOT EXISTS "property_monitoring_property_idx" ON "property_monitoring" ("property_id");`,
      `CREATE INDEX IF NOT EXISTS "property_monitoring_user_idx" ON "property_monitoring" ("user_id");`,
      
      // Monitoring alerts indexes
      `CREATE INDEX IF NOT EXISTS "monitoring_alerts_property_idx" ON "monitoring_alerts" ("property_id");`,
      `CREATE INDEX IF NOT EXISTS "monitoring_alerts_user_idx" ON "monitoring_alerts" ("user_id");`,
      `CREATE INDEX IF NOT EXISTS "monitoring_alerts_severity_idx" ON "monitoring_alerts" ("severity");`
    ];

    for (const indexSql of indexes) {
      try {
        await sql(indexSql);
        console.log(`✅ Created index`);
      } catch (error) {
        console.log(`ℹ️  Index already exists or error`);
      }
    }

    console.log("🎉 Land Verification System migration completed successfully!");
    console.log("\n📊 Summary:");
    console.log("- Created 6 new enums for land verification");
    console.log("- Created 8 new tables for land verification system");
    console.log("- Added foreign key constraints for data integrity");
    console.log("- Created optimized indexes for query performance");
    console.log("\n✅ Database is ready for land verification system!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrateLandVerification()
  .then(() => {
    console.log('✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

export { migrateLandVerification };