-- @name: Create Performance Optimization Indexes
-- @description: Creates comprehensive indexes for optimal query performance across all tables
-- @author: system
-- @timestamp: 2024-01-03T00:00:00.000Z
-- @tags: performance, indexes, optimization
-- @dependencies: core_001_create_comprehensive_tables, verification_001_create_land_verification_tables

-- @up start
-- Performance Optimization Indexes Migration
-- Creates comprehensive indexes for optimal query performance

-- Full-text search indexes for property descriptions and titles
CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_title_fts_idx 
ON properties USING gin(to_tsvector('english', title));

CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_description_fts_idx 
ON properties USING gin(to_tsvector('english', description));

-- GIN indexes for JSON columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_features_gin_idx 
ON properties USING gin(features);

CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_coordinates_gin_idx 
ON properties USING gin(coordinates);

CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_ai_results_gin_idx 
ON properties USING gin(ai_verification_results);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_active_verified_idx 
ON properties (id, created_at) 
WHERE is_active = true AND verification_status = 'verified';

CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_active_featured_idx 
ON properties (id, price, created_at) 
WHERE is_active = true AND is_featured = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS users_active_agents_idx 
ON users (id, trust_score, created_at) 
WHERE is_active = true AND is_verified_agent = true;

-- Expression indexes for computed values
CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_price_per_sqft_idx 
ON properties ((price::numeric / COALESCE((features->>'squareFeet')::numeric, 1))) 
WHERE features->>'squareFeet' IS NOT NULL AND (features->>'squareFeet')::numeric > 0;

-- Covering indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_search_covering_idx 
ON properties (location, price, verification_status, is_active) 
INCLUDE (id, title, image_urls, created_at);

-- Time-based partitioning indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS property_views_date_partition_idx 
ON property_views (viewed_at, property_id) 
WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days';

-- Verification system performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS land_verification_sessions_active_idx 
ON land_verification_sessions (property_id, status, created_at) 
WHERE status IN ('in_progress', 'not_started');

CREATE INDEX CONCURRENTLY IF NOT EXISTS verification_layers_pending_idx 
ON verification_layers (session_id, layer_type, status) 
WHERE status = 'not_started';

CREATE INDEX CONCURRENTLY IF NOT EXISTS risk_factors_high_severity_idx 
ON risk_factors (session_id, severity, is_active) 
WHERE severity IN ('high', 'critical') AND is_active = true;
-- @up end

-- @down start
-- Drop performance indexes
DROP INDEX CONCURRENTLY IF EXISTS risk_factors_high_severity_idx;
DROP INDEX CONCURRENTLY IF EXISTS verification_layers_pending_idx;
DROP INDEX CONCURRENTLY IF EXISTS land_verification_sessions_active_idx;
DROP INDEX CONCURRENTLY IF EXISTS property_views_date_partition_idx;
DROP INDEX CONCURRENTLY IF EXISTS properties_search_covering_idx;
DROP INDEX CONCURRENTLY IF EXISTS properties_price_per_sqft_idx;
DROP INDEX CONCURRENTLY IF EXISTS users_active_agents_idx;
DROP INDEX CONCURRENTLY IF EXISTS properties_active_featured_idx;
DROP INDEX CONCURRENTLY IF EXISTS properties_active_verified_idx;
DROP INDEX CONCURRENTLY IF EXISTS properties_ai_results_gin_idx;
DROP INDEX CONCURRENTLY IF EXISTS properties_coordinates_gin_idx;
DROP INDEX CONCURRENTLY IF EXISTS properties_features_gin_idx;
DROP INDEX CONCURRENTLY IF EXISTS properties_description_fts_idx;
DROP INDEX CONCURRENTLY IF EXISTS properties_title_fts_idx;
-- @down end

-- @validate start
-- Validate that performance indexes were created
SELECT 
    CASE 
        WHEN COUNT(*) >= 10 THEN 'PASS'
        ELSE 'FAIL'
    END as validation_result,
    'Performance indexes created' as test_description
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%_fts_idx' OR indexname LIKE '%_gin_idx' OR indexname LIKE '%_active_idx';
-- @validate end