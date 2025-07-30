CREATE TYPE "public"."community_feedback_source" AS ENUM('local_admin', 'neighbor', 'community_leader', 'resident');--> statement-breakpoint
CREATE TYPE "public"."government_designation_type" AS ENUM('riparian', 'road_reserve', 'utility_corridor', 'environmental', 'mineral_rights');--> statement-breakpoint
CREATE TYPE "public"."land_verification_status" AS ENUM('not_started', 'in_progress', 'completed', 'suspended', 'failed');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartment', 'house', 'condo', 'townhouse', 'studio', 'commercial', 'land');--> statement-breakpoint
CREATE TYPE "public"."risk_category" AS ENUM('ownership', 'government', 'legal', 'physical', 'community');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'cancelled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('buy', 'sell', 'rent', 'lease');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'agent', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_layer_type" AS ENUM('registry', 'physical', 'community', 'government', 'legal', 'expert');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('verified', 'pending', 'unverified', 'draft');--> statement-breakpoint
CREATE TABLE "community_experiences" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"location" varchar(100) NOT NULL,
	"fraud_type" varchar(50) NOT NULL,
	"amount_lost" varchar(50),
	"what_happened" text NOT NULL,
	"personal_vulnerabilities" text,
	"systemic_challenges" text,
	"lessons_learned" text,
	"resolution_status" varchar(20) NOT NULL,
	"resolution_details" text,
	"anonymous" boolean DEFAULT false NOT NULL,
	"user_id" integer NOT NULL,
	"date_posted" timestamp DEFAULT now() NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"helpful" integer DEFAULT 0 NOT NULL,
	"tags" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_feedback" (
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
);
--> statement-breakpoint
CREATE TABLE "content_reports" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"content_id" varchar(255) NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"reason" varchar(50) NOT NULL,
	"details" text,
	"reporter_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_comments" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"experience_id" varchar(255) NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"anonymous" boolean DEFAULT false NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_interactions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"experience_id" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_assignments" (
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
);
--> statement-breakpoint
CREATE TABLE "expert_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"expert_type" varchar(50) NOT NULL,
	"credentials" json DEFAULT '[]'::json,
	"specializations" json DEFAULT '[]'::json,
	"location" varchar(255) NOT NULL,
	"contact_info" json NOT NULL,
	"experience" json NOT NULL,
	"availability" json NOT NULL,
	"pricing" json NOT NULL,
	"verification_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"last_active_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"expert_id" integer NOT NULL,
	"report_type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" text NOT NULL,
	"findings" json DEFAULT '[]'::json,
	"recommendations" json DEFAULT '[]'::json,
	"attachments" json DEFAULT '[]'::json,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"review_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"quality_score" integer,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fraud_alerts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"location" varchar(100) NOT NULL,
	"affected_count" integer DEFAULT 0 NOT NULL,
	"time_detected" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"evidence" text,
	"recommendations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fraud_subscriptions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"locations" text NOT NULL,
	"alert_types" text NOT NULL,
	"severity" text NOT NULL,
	"notification_methods" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fraud_trends" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"fraud_type" varchar(50) NOT NULL,
	"location" varchar(100) NOT NULL,
	"period" varchar(20) NOT NULL,
	"case_count" integer DEFAULT 0 NOT NULL,
	"average_amount" numeric(15, 2),
	"change_percentage" numeric(5, 2),
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "government_designations" (
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
);
--> statement-breakpoint
CREATE TABLE "land_verification_sessions" (
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
);
--> statement-breakpoint
CREATE TABLE "monitoring_alerts" (
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
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"location" varchar(255) NOT NULL,
	"address" text,
	"coordinates" json,
	"image_urls" json DEFAULT '[]'::json NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"features" json,
	"owner_id" integer NOT NULL,
	"ai_verification_results" json,
	"view_count" integer DEFAULT 0 NOT NULL,
	"favorite_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"available_from" timestamp,
	"available_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_monitoring" (
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
);
--> statement-breakpoint
CREATE TABLE "property_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"user_id" integer,
	"ip_address" varchar(45),
	"user_agent" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_factors" (
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
);
--> statement-breakpoint
CREATE TABLE "statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_type" varchar(100) NOT NULL,
	"metric_key" varchar(100) NOT NULL,
	"metric_value" json NOT NULL,
	"period_type" varchar(20) DEFAULT 'all_time',
	"period_start" timestamp,
	"period_end" timestamp,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" varchar(50),
	"user_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"transaction_date" timestamp NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"other_parties" json DEFAULT '[]'::json NOT NULL,
	"is_suspicious" boolean DEFAULT false NOT NULL,
	"fraud_score" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"trust_score" integer DEFAULT 50 NOT NULL,
	"is_verified_agent" boolean DEFAULT false NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(20),
	"profile_image_url" varchar(500),
	"bio" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"email_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_layers" (
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
);
--> statement-breakpoint
ALTER TABLE "community_experiences" ADD CONSTRAINT "community_experiences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_feedback" ADD CONSTRAINT "community_feedback_session_id_land_verification_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."land_verification_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_comments" ADD CONSTRAINT "experience_comments_experience_id_community_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."community_experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_comments" ADD CONSTRAINT "experience_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_interactions" ADD CONSTRAINT "experience_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_interactions" ADD CONSTRAINT "experience_interactions_experience_id_community_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."community_experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_assignments" ADD CONSTRAINT "expert_assignments_session_id_land_verification_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."land_verification_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_assignments" ADD CONSTRAINT "expert_assignments_layer_id_verification_layers_id_fk" FOREIGN KEY ("layer_id") REFERENCES "public"."verification_layers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_reports" ADD CONSTRAINT "expert_reports_assignment_id_expert_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."expert_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_reports" ADD CONSTRAINT "expert_reports_expert_id_expert_profiles_id_fk" FOREIGN KEY ("expert_id") REFERENCES "public"."expert_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fraud_subscriptions" ADD CONSTRAINT "fraud_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_designations" ADD CONSTRAINT "government_designations_session_id_land_verification_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."land_verification_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "land_verification_sessions" ADD CONSTRAINT "land_verification_sessions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "land_verification_sessions" ADD CONSTRAINT "land_verification_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_monitoring_id_property_monitoring_id_fk" FOREIGN KEY ("monitoring_id") REFERENCES "public"."property_monitoring"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_monitoring" ADD CONSTRAINT "property_monitoring_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_monitoring" ADD CONSTRAINT "property_monitoring_session_id_land_verification_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."land_verification_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_monitoring" ADD CONSTRAINT "property_monitoring_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_views" ADD CONSTRAINT "property_views_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_views" ADD CONSTRAINT "property_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_factors" ADD CONSTRAINT "risk_factors_session_id_land_verification_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."land_verification_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_layers" ADD CONSTRAINT "verification_layers_session_id_land_verification_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."land_verification_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_experiences_user_idx" ON "community_experiences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "community_experiences_fraud_type_idx" ON "community_experiences" USING btree ("fraud_type");--> statement-breakpoint
CREATE INDEX "community_experiences_location_idx" ON "community_experiences" USING btree ("location");--> statement-breakpoint
CREATE INDEX "community_experiences_resolution_idx" ON "community_experiences" USING btree ("resolution_status");--> statement-breakpoint
CREATE INDEX "community_experiences_date_idx" ON "community_experiences" USING btree ("date_posted");--> statement-breakpoint
CREATE INDEX "community_experiences_status_idx" ON "community_experiences" USING btree ("status");--> statement-breakpoint
CREATE INDEX "community_feedback_session_idx" ON "community_feedback" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "community_feedback_source_idx" ON "community_feedback" USING btree ("source");--> statement-breakpoint
CREATE INDEX "community_feedback_reliability_idx" ON "community_feedback" USING btree ("reliability");--> statement-breakpoint
CREATE INDEX "community_feedback_recorded_at_idx" ON "community_feedback" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "community_feedback_confidential_idx" ON "community_feedback" USING btree ("is_confidential");--> statement-breakpoint
CREATE INDEX "content_reports_content_idx" ON "content_reports" USING btree ("content_id","content_type");--> statement-breakpoint
CREATE INDEX "content_reports_reporter_idx" ON "content_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "content_reports_status_idx" ON "content_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_reports_timestamp_idx" ON "content_reports" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "experience_comments_experience_idx" ON "experience_comments" USING btree ("experience_id");--> statement-breakpoint
CREATE INDEX "experience_comments_user_idx" ON "experience_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "experience_comments_created_idx" ON "experience_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "experience_comments_status_idx" ON "experience_comments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "experience_interactions_user_experience_idx" ON "experience_interactions" USING btree ("user_id","experience_id");--> statement-breakpoint
CREATE INDEX "experience_interactions_type_idx" ON "experience_interactions" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_experience_interaction" ON "experience_interactions" USING btree ("user_id","experience_id","type");--> statement-breakpoint
CREATE INDEX "expert_assignments_session_idx" ON "expert_assignments" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "expert_assignments_layer_idx" ON "expert_assignments" USING btree ("layer_id");--> statement-breakpoint
CREATE INDEX "expert_assignments_expert_type_idx" ON "expert_assignments" USING btree ("expert_type");--> statement-breakpoint
CREATE INDEX "expert_assignments_status_idx" ON "expert_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expert_assignments_assigned_at_idx" ON "expert_assignments" USING btree ("assigned_at");--> statement-breakpoint
CREATE INDEX "expert_assignments_session_expert_type_idx" ON "expert_assignments" USING btree ("session_id","expert_type");--> statement-breakpoint
CREATE INDEX "expert_profiles_expert_type_idx" ON "expert_profiles" USING btree ("expert_type");--> statement-breakpoint
CREATE INDEX "expert_profiles_location_idx" ON "expert_profiles" USING btree ("location");--> statement-breakpoint
CREATE INDEX "expert_profiles_verification_status_idx" ON "expert_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "expert_profiles_last_active_idx" ON "expert_profiles" USING btree ("last_active_date");--> statement-breakpoint
CREATE INDEX "expert_profiles_type_location_idx" ON "expert_profiles" USING btree ("expert_type","location");--> statement-breakpoint
CREATE INDEX "expert_profiles_type_verification_idx" ON "expert_profiles" USING btree ("expert_type","verification_status");--> statement-breakpoint
CREATE INDEX "expert_reports_assignment_idx" ON "expert_reports" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "expert_reports_expert_idx" ON "expert_reports" USING btree ("expert_id");--> statement-breakpoint
CREATE INDEX "expert_reports_report_type_idx" ON "expert_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "expert_reports_review_status_idx" ON "expert_reports" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "expert_reports_submitted_at_idx" ON "expert_reports" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "expert_reports_quality_score_idx" ON "expert_reports" USING btree ("quality_score");--> statement-breakpoint
CREATE INDEX "expert_reports_assignment_status_idx" ON "expert_reports" USING btree ("assignment_id","review_status");--> statement-breakpoint
CREATE INDEX "expert_reports_expert_type_idx" ON "expert_reports" USING btree ("expert_id","report_type");--> statement-breakpoint
CREATE INDEX "favorites_user_idx" ON "favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "favorites_property_idx" ON "favorites" USING btree ("property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_property_unique" ON "favorites" USING btree ("user_id","property_id");--> statement-breakpoint
CREATE INDEX "fraud_alerts_type_idx" ON "fraud_alerts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "fraud_alerts_severity_idx" ON "fraud_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "fraud_alerts_location_idx" ON "fraud_alerts" USING btree ("location");--> statement-breakpoint
CREATE INDEX "fraud_alerts_status_idx" ON "fraud_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fraud_alerts_time_idx" ON "fraud_alerts" USING btree ("time_detected");--> statement-breakpoint
CREATE INDEX "fraud_subscriptions_user_idx" ON "fraud_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fraud_subscriptions_active_idx" ON "fraud_subscriptions" USING btree ("active");--> statement-breakpoint
CREATE INDEX "fraud_trends_type_idx" ON "fraud_trends" USING btree ("fraud_type");--> statement-breakpoint
CREATE INDEX "fraud_trends_location_idx" ON "fraud_trends" USING btree ("location");--> statement-breakpoint
CREATE INDEX "fraud_trends_period_idx" ON "fraud_trends" USING btree ("period");--> statement-breakpoint
CREATE INDEX "fraud_trends_calculated_idx" ON "fraud_trends" USING btree ("calculated_at");--> statement-breakpoint
CREATE INDEX "government_designations_session_idx" ON "government_designations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "government_designations_type_idx" ON "government_designations" USING btree ("designation_type");--> statement-breakpoint
CREATE INDEX "government_designations_authority_idx" ON "government_designations" USING btree ("authority");--> statement-breakpoint
CREATE INDEX "government_designations_risk_level_idx" ON "government_designations" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "government_designations_last_verified_idx" ON "government_designations" USING btree ("last_verified");--> statement-breakpoint
CREATE INDEX "government_designations_active_idx" ON "government_designations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "government_designations_session_type_idx" ON "government_designations" USING btree ("session_id","designation_type");--> statement-breakpoint
CREATE INDEX "land_verification_sessions_property_idx" ON "land_verification_sessions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "land_verification_sessions_user_idx" ON "land_verification_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "land_verification_sessions_status_idx" ON "land_verification_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "land_verification_sessions_risk_level_idx" ON "land_verification_sessions" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "land_verification_sessions_created_at_idx" ON "land_verification_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "land_verification_sessions_property_status_idx" ON "land_verification_sessions" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX "land_verification_sessions_user_status_idx" ON "land_verification_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_monitoring_idx" ON "monitoring_alerts" USING btree ("monitoring_id");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_property_idx" ON "monitoring_alerts" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_user_idx" ON "monitoring_alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_alert_type_idx" ON "monitoring_alerts" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_severity_idx" ON "monitoring_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_is_read_idx" ON "monitoring_alerts" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_action_required_idx" ON "monitoring_alerts" USING btree ("action_required");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_created_at_idx" ON "monitoring_alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_user_unread_idx" ON "monitoring_alerts" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_property_active_idx" ON "monitoring_alerts" USING btree ("property_id","is_dismissed");--> statement-breakpoint
CREATE INDEX "properties_owner_idx" ON "properties" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "properties_status_idx" ON "properties" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "properties_price_idx" ON "properties" USING btree ("price");--> statement-breakpoint
CREATE INDEX "properties_location_idx" ON "properties" USING btree ("location");--> statement-breakpoint
CREATE INDEX "properties_active_idx" ON "properties" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "properties_featured_idx" ON "properties" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "properties_created_at_idx" ON "properties" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "properties_active_status_idx" ON "properties" USING btree ("is_active","verification_status");--> statement-breakpoint
CREATE INDEX "properties_active_featured_idx" ON "properties" USING btree ("is_active","is_featured");--> statement-breakpoint
CREATE INDEX "properties_location_price_idx" ON "properties" USING btree ("location","price");--> statement-breakpoint
CREATE INDEX "property_monitoring_property_idx" ON "property_monitoring" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_monitoring_session_idx" ON "property_monitoring" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "property_monitoring_user_idx" ON "property_monitoring" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "property_monitoring_type_idx" ON "property_monitoring" USING btree ("monitoring_type");--> statement-breakpoint
CREATE INDEX "property_monitoring_next_check_idx" ON "property_monitoring" USING btree ("next_check");--> statement-breakpoint
CREATE INDEX "property_monitoring_active_idx" ON "property_monitoring" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "property_monitoring_property_active_idx" ON "property_monitoring" USING btree ("property_id","is_active");--> statement-breakpoint
CREATE INDEX "property_views_property_idx" ON "property_views" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_views_user_idx" ON "property_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "property_views_viewed_at_idx" ON "property_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "property_views_property_date_idx" ON "property_views" USING btree ("property_id","viewed_at");--> statement-breakpoint
CREATE INDEX "reviews_property_idx" ON "reviews" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "reviews_verified_idx" ON "reviews" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "reviews_active_idx" ON "reviews" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reviews_property_active_idx" ON "reviews" USING btree ("property_id","is_active");--> statement-breakpoint
CREATE INDEX "reviews_property_rating_idx" ON "reviews" USING btree ("property_id","rating");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_user_property_unique" ON "reviews" USING btree ("user_id","property_id");--> statement-breakpoint
CREATE INDEX "risk_factors_session_idx" ON "risk_factors" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "risk_factors_category_idx" ON "risk_factors" USING btree ("category");--> statement-breakpoint
CREATE INDEX "risk_factors_severity_idx" ON "risk_factors" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "risk_factors_source_layer_idx" ON "risk_factors" USING btree ("source_layer");--> statement-breakpoint
CREATE INDEX "risk_factors_active_idx" ON "risk_factors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "risk_factors_session_category_idx" ON "risk_factors" USING btree ("session_id","category");--> statement-breakpoint
CREATE INDEX "risk_factors_session_severity_idx" ON "risk_factors" USING btree ("session_id","severity");--> statement-breakpoint
CREATE INDEX "statistics_metric_type_idx" ON "statistics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "statistics_metric_key_idx" ON "statistics" USING btree ("metric_key");--> statement-breakpoint
CREATE INDEX "statistics_period_type_idx" ON "statistics" USING btree ("period_type");--> statement-breakpoint
CREATE INDEX "statistics_calculated_at_idx" ON "statistics" USING btree ("calculated_at");--> statement-breakpoint
CREATE INDEX "statistics_active_idx" ON "statistics" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "statistics_type_key_idx" ON "statistics" USING btree ("metric_type","metric_key");--> statement-breakpoint
CREATE INDEX "statistics_type_period_idx" ON "statistics" USING btree ("metric_type","period_type");--> statement-breakpoint
CREATE UNIQUE INDEX "statistics_unique_metric" ON "statistics" USING btree ("metric_type","metric_key","period_type","period_start","period_end");--> statement-breakpoint
CREATE INDEX "transactions_user_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_property_idx" ON "transactions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "transactions_suspicious_idx" ON "transactions" USING btree ("is_suspicious");--> statement-breakpoint
CREATE INDEX "transactions_fraud_score_idx" ON "transactions" USING btree ("fraud_score");--> statement-breakpoint
CREATE INDEX "transactions_external_id_idx" ON "transactions" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "transactions_user_date_idx" ON "transactions" USING btree ("user_id","transaction_date");--> statement-breakpoint
CREATE INDEX "transactions_property_date_idx" ON "transactions" USING btree ("property_id","transaction_date");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_trust_score_idx" ON "users" USING btree ("trust_score");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "users_active_role_idx" ON "users" USING btree ("is_active","role");--> statement-breakpoint
CREATE INDEX "verification_layers_session_idx" ON "verification_layers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "verification_layers_layer_type_idx" ON "verification_layers" USING btree ("layer_type");--> statement-breakpoint
CREATE INDEX "verification_layers_status_idx" ON "verification_layers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "verification_layers_expert_idx" ON "verification_layers" USING btree ("assigned_expert_id");--> statement-breakpoint
CREATE INDEX "verification_layers_session_layer_idx" ON "verification_layers" USING btree ("session_id","layer_type");--> statement-breakpoint
CREATE INDEX "verification_layers_session_status_idx" ON "verification_layers" USING btree ("session_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_layers_session_layer_unique" ON "verification_layers" USING btree ("session_id","layer_type");