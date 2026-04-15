# Script Cleanup Analysis

**Date**: 2026-04-15

## Redundant Scripts to Delete

### 1. Duplicate Deployment Scripts (Keep newest/most complete)
- `deploy-minimal.js` - Minimal version, superseded
- `deploy-render.js` - Render-specific, not used
- `deploy-staging-simple.cjs` - Simple version, superseded
- `deploy-staging-final.cjs` - Final version exists in deployment/
- **Keep**: `deployment/deploy-staging.ts`, `deployment/deploy-production.ts`

### 2. Duplicate Database Validation Scripts (3 versions of same thing)
- `validate-database-structure.cjs` - Old CJS version
- `validate-database-structure.js` - Old JS version
- `validate-database-structure.ts` - TypeScript version
- **Keep**: `validate-database-structure.ts` (most recent)

### 3. Duplicate Load Data Scripts (3 versions)
- `load-data-corrected.ts` - Corrected version
- `load-data-fixed.ts` - Fixed version
- `load-data-simple.ts` - Simple version
- **Keep**: `load-data-fixed.ts` (most complete)

### 4. Duplicate Load Test Scripts (3 versions)
- `load-test.js` - K6 version (requires external tool)
- `load-test-simple.cjs` - Simple version
- `load-test-suite.js` - Suite version
- `run-complete-load-test.cjs` - Complete version
- **Keep**: `run-complete-load-test.cjs` (most comprehensive)

### 5. Duplicate Favicon Scripts (4 versions)
- `create-favicon-pngs.js`
- `create-minimal-pngs.js`
- `create-png-favicons.js`
- `generate-favicons.js`
- `convert-favicons.bat` - Windows batch file
- **Keep**: `generate-favicons.js` (most complete)

### 6. Duplicate Optimization Scripts (4 versions)
- `aggressive-optimization.js`
- `implement-optimizations.js`
- `optimize-for-deployment.js`
- `real-optimization.js`
- `execute-optimization.ts`
- `verify-optimization.ts`
- **Keep**: `OptimizedBuildPipeline.ts`, `execute-optimization.ts`

### 7. Duplicate Deployment Validation Scripts
- `validate-deployment.cjs` - Old version
- `validate-deployment-current.cjs` - Current version
- `validate-staging-final.cjs` - Staging specific
- `test-deployment-readiness.cjs` - Readiness check
- **Keep**: `deployment/validate-deployment.ts`, `validate-production.ts`

### 8. Duplicate Migration Scripts
- `migrate-core-utilities.ts`
- `migrate-to-core-utilities.ts` - Duplicate
- `migrate-embedded-tests.ts` - Tests deleted
- `migrate-hooks.js`
- `migrate-optimized-components.sh`
- `migrate-schema-imports.ts`
- `run-migration.ts`
- `run-land-verification-migration.ts`
- `quick-migration-check.ts`
- **Keep**: `migrate-database-structure.ts`, `run-migration.ts`

### 9. Duplicate Fix Scripts (One-time fixes, no longer needed)
- `fix-authentication-issues.ts` - One-time fix
- `fix-core-import-paths.ts` - One-time fix
- `fix-image-test-issues.ts` - Tests deleted
- `fix-typescript-errors.ts` - One-time fix
- `fix-lazy-routes.patch` - Patch file
- **Delete all** (one-time fixes completed)

### 10. Duplicate Test Scripts (Tests deleted)
- `test-build.ts`
- `test-frontend-functionality.ts`
- `test-image-components.ts`
- `test-integration.js`
- `test-navigation.ts`
- `test-server-connection.cjs`
- `test-server-ports.js`
- `validate-image-tests.ts`
- `run-chunked-tests.ts`
- `generate-test-chunks.ts`
- **Delete all** (tests were removed per ADR 004)

### 11. Duplicate Debug Scripts
- `debug-blank-page.ts` - One-time debug
- `debug-vercel-deployment.ts` - One-time debug
- `detect-bugs.ts` - Generic
- **Keep**: `debug/` folder scripts only

### 12. Duplicate Server Test Scripts
- `simple-server-test.cjs`
- `test-server-connection.cjs`
- `test-server-ports.js`
- **Keep**: `health-check.ts` (comprehensive)

### 13. Duplicate Cleanup Scripts
- `cleanup-redundancies.ts`
- `comprehensive-cleanup.ts`
- `remove-redundant-utilities.ts`
- **Keep**: None (cleanup complete)

### 14. Duplicate Update Scripts
- `update-core-imports.ts`
- `update-database-paths.cjs`
- `update-imports.ts`
- **Keep**: None (updates complete)

### 15. Miscellaneous One-Time Scripts
- `add-b2b-messaging.js` - Feature added
- `add-reviews.ts` - Feature added
- `analyze-hooks.js` - Analysis complete
- `api-race-condition-detector.ts` - Detection complete
- `build-infrastructure.cjs` - Build complete
- `check-data.ts` - One-time check
- `check-reviews-table.ts` - One-time check
- `check-table-structure.ts` - One-time check
- `create-barrel-exports.ts` - One-time creation
- `disable-route-preloader.js` - One-time change
- `emergency-stop.js` - Emergency script (keep)
- `extract-api-core.js` - Extraction complete
- `quick-recovery.ts` - Recovery script (keep)
- `responsive-design-analyzer.js` - Analysis complete
- `setup-dev.js` - Setup complete
- `stop-infinite-queries.ts` - Debug script (keep)
- `streaming-json-processor.ts` - Utility (keep)
- `verify-api-client.js` - Verification complete

### 16. Documentation Files (Move to docs/)
- `DATABASE_SETUP.md` - Move to docs/
- `MISSING_FEATURES_ANALYSIS.md` - Move to DCS/archive/
- `MOBILE_AND_DATA_IMPROVEMENTS.md` - Move to DCS/archive/
- `README-test-data.md` - Delete (tests removed)

## Summary

**Total Scripts**: ~103 files
**To Delete**: ~70 files
**To Keep**: ~33 files
**Reduction**: ~68%

## Keep These Scripts

### Essential Scripts (15)
- `generate-structure.mjs` - Project structure generator
- `health-check.ts` - System health monitoring
- `prepare-deployment.ts` - Deployment preparation
- `OptimizedBuildPipeline.ts` - Build optimization
- `execute-optimization.ts` - Execute optimizations
- `migrate-database-structure.ts` - Database migrations
- `run-migration.ts` - Migration runner
- `validate-database-structure.ts` - Database validation
- `validate-production.ts` - Production validation
- `validate-authentication.ts` - Auth validation
- `validate-database-paths.ts` - Path validation
- `validate-migration.ts` - Migration validation
- `load-data-fixed.ts` - Data loading
- `run-complete-load-test.cjs` - Load testing
- `generate-favicons.js` - Favicon generation

### Utility Scripts (8)
- `emergency-stop.js` - Emergency shutdown
- `quick-recovery.ts` - Quick recovery
- `restart-dev-server.ts` - Dev server restart
- `stop-infinite-queries.ts` - Query debugging
- `streaming-json-processor.ts` - JSON processing
- `logger.js` - Logging utility
- `memory-benchmark.js` - Memory profiling
- `self-monitoring-pipeline.ts` - Self-monitoring

### Test Scripts (3)
- `run-accessibility-tests.js` - A11y testing
- `run-e2e-tests.js` - E2E testing
- `run-visual-tests.js` - Visual testing
- `run-ui-audit.ts` - UI auditing

### Subdirectories (Keep all)
- `deployment/` - Deployment scripts
- `debug/` - Debug utilities
- `migration-helpers/` - Migration helpers
- `performance/` - Performance testing
- `security/` - Security scripts
