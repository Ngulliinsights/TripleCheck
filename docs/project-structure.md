# Project Structure

Maximum depth: 7 levels

```
.
api/
├── v1/
│   ├── document-auth/
│   │   ├── authenticate.js
│   ├── fraud-detection/
│   │   ├── analyze.js
│   ├── land-verification/
│   │   ├── status.js
│   │   ├── verify.js
│   │   ├── webhook.js
AUDIT_SYSTEM_SUMMARY.md
broken-links-analysis.md
CHANGELOG.md
CODE_OF_CONDUCT.md
CODEBASE_GAPS_RESOLUTION.md
competitive_landscape.html
config/
├── app.config.ts
├── database.config.ts
├── vitest/
│   ├── chunk-generator.ts
│   ├── index.ts
│   ├── test-config-manager.ts
│   ├── vitest.base.config.ts
│   ├── vitest.document-auth.config.ts
│   ├── vitest.e2e.config.ts
│   ├── vitest.fraud-detection.config.ts
│   ├── vitest.integration.config.ts
│   ├── vitest.land-verification.config.ts
│   ├── vitest.performance.config.ts
│   ├── vitest.security.config.ts
│   ├── vitest.server.config.ts
│   ├── vitest.unit.config.ts
CONTRIBUTING.md
CRITICAL_FIXES_IMPLEMENTATION.md
cspell.json
debug-evolution.sh
docs/
├── advanced_image_prompts.md
├── API_INTEGRATION_GUIDE.md
├── Component Placement Rationale_ Modular Service Architecture.md
├── comprehensive_code_analysis_framework.md
├── COMPREHENSIVE_GAP_ANALYSIS.md
├── database-consolidation-complete-report.md
├── database-consolidation-migration-plan.md
├── deep_audit.md
├── developer-portal.html
├── hook-migration.md
├── IMPORT_GUIDE.md
├── improved-triplecheck-data-generation-prompts.md
├── Kenya Land Verification Data Generation prompts.md
├── kenya_land_verification_guide.md
├── monitoring-integration-guide.md
├── partnerships/
│   ├── MTN_Partnership_Pitch.md
│   ├── Safaricom_Partnership_Pitch.md
├── project-structure.md
├── prompt_engineering_analysis.md
├── PropTech Analysis.md
├── README.md
├── skeptical-expert-responses.md
├── SYSTEM_DESIGN_DOCUMENTATION.md
├── technical-cofounder-pitch.md
├── triplecheck_unified_plan.md
├── unified_code_analysis_framework.md
drizzle.config.ts
eslint.config.js
execute-api-consolidation.sh
execute-cache-consolidation.sh
FINAL_IMPLEMENTATION_SUMMARY.md
firebase.json
fix-package-duplicates.js
fix-schema-imports.sh
frontend-facade-analysis.md
FUNCTIONAL_PAGES_SUMMARY.md
generate-structure.sh
generate-structure-to-file.sh
HUGGINGFACE_AI_INTEGRATION.md
index.html
LICENSE
migrate-validation.sh
organize-validation-files.sh
package.json
package-lock.json
playwright.config.ts
postcss.config.js
PROJECT_REDUNDANCY_ANALYSIS.md
property-broken-links-analysis.md
public/
├── sw.js
README.md
scripts/
├── add-b2b-messaging.js
├── add-reviews.ts
├── aggressive-optimization.js
├── analyze-hooks.js
├── api-race-condition-detector.ts
├── check-data.ts
├── check-reviews-table.ts
├── check-table-structure.ts
├── cleanup-redundancies.ts
├── comprehensive-cleanup.ts
├── convert-favicons.bat
├── create-barrel-exports.ts
├── create-favicon-pngs.js
├── create-minimal-pngs.js
├── create-png-favicons.js
├── DATABASE_SETUP.md
├── debug/
│   ├── stop-infinite-queries.ts
│   ├── test-server-start.ts
├── debug-blank-page.ts
├── debug-vercel-deployment.ts
├── deployment/
│   ├── deployment-tests.ts
│   ├── deploy-production.ts
│   ├── deploy-staging.ts
│   ├── grafana/
│   │   ├── dashboards/
│   │   │   ├── business-metrics.json
│   │   │   ├── database-health.json
│   │   │   ├── query-performance.json
│   ├── README.md
│   ├── setup-comprehensive-monitoring.ts
│   ├── setup-monitoring.ts
│   ├── validate-deployment.ts
├── deploy-minimal.js
├── deploy-render.js
├── deploy-setup.ts
├── deploy-staging-final.cjs
├── deploy-staging-simple.cjs
├── detect-bugs.ts
├── disable-route-preloader.js
├── emergency-stop.js
├── execute-optimization.ts
├── extract-api-core.js
├── fix-authentication-issues.ts
├── fix-image-test-issues.ts
├── fix-lazy-routes.patch
├── fix-typescript-errors.ts
├── generate-favicons.js
├── generate-test-chunks.ts
├── health-check.ts
├── implement-optimizations.js
├── load-data-corrected.ts
├── load-data-fixed.ts
├── load-data-simple.ts
├── load-test.js
├── load-test-simple.cjs
├── load-test-suite.js
├── logger.js
├── memory-benchmark.js
├── migrate-database-structure.ts
├── migrate-embedded-tests.ts
├── migrate-hooks.js
├── migrate-optimized-components.sh
├── migrate-schema-imports.ts
├── MISSING_FEATURES_ANALYSIS.md
├── MOBILE_AND_DATA_IMPROVEMENTS.md
├── OptimizedBuildPipeline.ts
├── optimize-for-deployment.js
├── performance/
│   ├── api-performance-test.ts
├── prepare-deployment.ts
├── quick-recovery.ts
├── README.md
├── README-test-data.md
├── real-optimization.js
├── responsive-design-analyzer.js
├── restart-dev-server.ts
├── run-accessibility-tests.js
├── run-chunked-tests.ts
├── run-complete-load-test.cjs
├── run-e2e-tests.js
├── run-land-verification-migration.ts
├── run-ui-audit.ts
├── run-visual-tests.js
├── security/
│   ├── bug-categorization.ts
├── self-monitoring-pipeline.ts
├── setup-dev.js
├── simple-server-test.cjs
├── stop-infinite-queries.ts
├── streaming-json-processor.ts
├── test-build.ts
├── test-deployment-readiness.cjs
├── test-frontend-functionality.ts
├── test-image-components.ts
├── test-integration.js
├── test-navigation.ts
├── test-server-connection.cjs
├── test-server-ports.js
├── update-database-paths.cjs
├── update-imports.ts
├── validate-authentication.ts
├── validate-database-paths.ts
├── validate-database-structure.cjs
├── validate-database-structure.js
├── validate-database-structure.ts
├── validate-deployment.cjs
├── validate-deployment-current.cjs
├── validate-image-tests.ts
├── validate-production.ts
├── validate-staging-final.cjs
├── verify-api-client.js
├── verify-optimization.ts
server/
├── ai/
│   ├── ai.controller.ts
│   ├── community-trust-ai.ts
│   ├── community-trust-ai-root.ts
│   ├── ml-training.test.ts
│   ├── ml-training.ts
│   ├── ml-training-root.ts
│   ├── storage.ts
├── analytics/
│   ├── analytics.controller.ts
├── app.ts
├── app-optimized.ts
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── AuthenticationService.ts
├── blockchain/
│   ├── blockchain-service.ts
├── cache/
│   ├── CacheService.ts
├── communication/
│   ├── communication.controller.ts
│   ├── notification.service.ts
├── config/
│   ├── development.ts
│   ├── environment-schema.ts
│   ├── ports.ts
├── controllers/
│   ├── __tests__/
│   │   ├── health.performance.test.ts
│   │   ├── property-enhancements.controller.test.ts
│   │   ├── property-enhancements.integration.test.ts
│   │   ├── user-dashboard.controller.test.ts
│   ├── analytics.controller.ts
│   ├── b2b.controller.ts
│   ├── community.controller.ts
│   ├── fraud-alerts.controller.ts
│   ├── health.controller.ts
│   ├── messages.controller.ts
│   ├── messaging.controller.ts
│   ├── monitoring.controller.ts
│   ├── notifications.controller.ts
│   ├── professionals.controller.ts
│   ├── property-enhancements.controller.ts
│   ├── search.controller.ts
│   ├── trust.controller.ts
│   ├── trust-integration.controller.ts
│   ├── user-dashboard.controller.ts
├── document-auth/
│   ├── analyzers/
│   │   ├── ContentAnalyzer.ts
│   │   ├── LandDocumentAnalyzer.test.ts
│   │   ├── LandDocumentAnalyzer.ts
│   │   ├── MetadataAnalyzer.ts
│   │   ├── MLDocumentAnalyzer.ts
│   │   ├── SignatureAnalyzer.ts
│   │   ├── VisualAnalyzer.ts
│   ├── core/
│   │   ├── DocumentAuthEngine.ts
│   ├── DocumentAuthService.land.test.ts
│   ├── DocumentAuthService.ts
│   ├── routes.ts
│   ├── test-document-auth.ts
│   ├── types/
│   │   ├── exif-parser.d.ts
├── fraud-detection/
│   ├── api/
│   │   ├── FraudDetectionAPI.ts
│   ├── core/
│   │   ├── FraudDetectionEngine.ts
│   ├── index.ts
│   ├── integrate-real-data.ts
│   ├── jest.config.js
│   ├── README.md
│   ├── routes/
│   │   ├── dashboard.ts
│   ├── services/
│   │   ├── CaseManagementService.ts
│   │   ├── ComplianceReportingService.ts
│   │   ├── DatabaseService.ts
│   │   ├── DataIntegrationService.ts
│   │   ├── ExternalAPIService.ts
│   ├── tests/
│   │   ├── dashboard.test.ts
│   │   ├── engine.test.ts
│   │   ├── global-setup.ts
│   │   ├── global-teardown.ts
│   │   ├── integration.test.ts
│   │   ├── performance.test.ts
│   │   ├── results-processor.js
│   │   ├── run-tests.ts
│   │   ├── setup.ts
│   ├── test-system.js
│   ├── utils/
│   │   ├── Logger.ts
│   ├── validate-backend.js
├── index.ts
├── infrastructure/
│   ├── cache/
│   │   ├── __tests__/
│   │   │   ├── UnifiedCacheManager.test.ts
│   │   ├── AnalyticsCache.ts
│   │   ├── CacheIntegrationAdapter.ts
│   │   ├── CacheIntegrationMigrator.ts
│   │   ├── CacheService.ts
│   │   ├── CacheWarmingStrategy.ts
│   │   ├── index.ts
│   │   ├── PropertyCacheService.ts
│   │   ├── README.md
│   │   ├── UnifiedCacheManager.ts
│   ├── database/
│   │   ├── __tests__/
│   │   │   ├── config.test.ts
│   │   │   ├── service.test.ts
│   │   ├── audit/
│   │   │   ├── comprehensive-database-audit.md
│   │   │   ├── database-inventory.json
│   │   │   ├── database-structure-audit.md
│   │   │   ├── dependency-map.md
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── index.ts
│   │   ├── connection/
│   │   │   ├── __tests__/
│   │   │   │   ├── connection-pool.test.ts
│   │   │   ├── DatabaseCircuitBreaker.ts
│   │   │   ├── index.ts
│   │   │   ├── ProductionConnectionPool.ts
│   │   │   ├── production-pool.ts
│   │   ├── data-generation/
│   │   │   ├── __tests__/
│   │   │   │   ├── production-demo-generator.test.ts
│   │   │   ├── cli/
│   │   │   │   ├── demo-generator-cli.ts
│   │   │   │   ├── demo-scenario-cli.ts
│   │   │   │   ├── unified-data-generation.ts
│   │   │   ├── core/
│   │   │   │   ├── checkpoint-manager.ts
│   │   │   │   ├── data-validator.ts
│   │   │   │   ├── KenyanDataGenerator.ts
│   │   │   │   ├── UnifiedDataGenerator.ts
│   │   │   ├── examples/
│   │   │   │   ├── demo-generation-example.ts
│   │   │   ├── generators/
│   │   │   │   ├── index.ts
│   │   │   │   ├── python/
│   │   │   │   │   ├── runner.ts
│   │   │   ├── index.ts
│   │   │   ├── README.md
│   │   │   ├── scenarios/
│   │   │   │   ├── demo-data-validator.ts
│   │   │   │   ├── production-demo-generator.ts
│   │   │   │   ├── production-demo-scenarios.ts
│   │   │   │   ├── README.md
│   │   │   │   ├── scenario-generator.ts
│   │   ├── deployment/
│   │   │   ├── BlueGreenDeploymentManager.ts
│   │   │   ├── deployment-cli.ts
│   │   │   ├── deployment-utils.ts
│   │   │   ├── DeploymentValidator.ts
│   │   │   ├── examples/
│   │   │   │   ├── complete-deployment-example.ts
│   │   │   ├── index.ts
│   │   │   ├── README.md
│   │   │   ├── ZeroDowntimeMigrationManager.ts
│   │   ├── disaster-recovery/
│   │   │   ├── __tests__/
│   │   │   │   ├── ComprehensiveDisasterRecovery.test.ts
│   │   │   │   ├── disaster-recovery-integration.test.ts
│   │   │   ├── BackupManager.ts
│   │   │   ├── ComprehensiveDisasterRecovery.ts
│   │   │   ├── config.json
│   │   │   ├── disaster-recovery-cli.ts
│   │   │   ├── DisasterRecoveryManager.ts
│   │   │   ├── IMPLEMENTATION_COMPLETE.md
│   │   │   ├── index.ts
│   │   │   ├── package-scripts.json
│   │   │   ├── README.md
│   │   │   ├── scripts/
│   │   │   │   ├── activate-replica.sh
│   │   │   │   ├── restore-config.sh
│   │   │   │   ├── restore-original-db.sh
│   │   │   │   ├── restore-pre-recovery-backup.sh
│   │   │   │   ├── restore-primary-region.sh
│   │   ├── docs/
│   │   │   ├── kenya-land-verification.md
│   │   │   ├── operational-excellence-guide.md
│   │   │   ├── production-deployment-checklist.md
│   │   ├── examples/
│   │   │   ├── production-setup.ts
│   │   ├── health/
│   │   │   ├── DatabaseHealthMonitor.ts
│   │   │   ├── health-monitor.ts
│   │   │   ├── index.ts
│   │   ├── index.ts
│   │   ├── init.ts
│   │   ├── integration/
│   │   │   ├── integration-cli.ts
│   │   │   ├── integration-test-runner.ts
│   │   │   ├── ProductionReadinessAssessment.ts
│   │   │   ├── run-production-assessment.ts
│   │   │   ├── simple-assessment.cjs
│   │   │   ├── SystemIntegrationValidator.ts
│   │   ├── MIGRATION_SUMMARY.md
│   │   ├── migration-plan.md
│   │   ├── migrations/
│   │   │   ├── __tests__/
│   │   │   │   ├── integration.test.ts
│   │   │   │   ├── migration-manager.test.ts
│   │   │   │   ├── test-migration.ts
│   │   │   │   ├── test-scripts.test.ts
│   │   │   ├── 0000_daffy_skrulls.sql
│   │   │   ├── communication/
│   │   │   │   ├── 001_create_communication_tables.sql
│   │   │   │   ├── index.ts
│   │   │   ├── core/
│   │   │   │   ├── 001_create_comprehensive_tables.sql
│   │   │   │   ├── files/
│   │   │   │   │   ├── 001_initial_schema.sql
│   │   │   │   ├── meta/
│   │   │   │   │   ├── _journal.json
│   │   │   │   │   ├── 0000_snapshot.json
│   │   │   │   ├── README.md
│   │   │   ├── fraud/
│   │   │   │   ├── 001_create_fraud_detection_tables.sql
│   │   │   │   ├── index.ts
│   │   │   ├── index.ts
│   │   │   ├── migration-cli.ts
│   │   │   ├── migration-executor.ts
│   │   │   ├── migration-loader.ts
│   │   │   ├── migration-manager.ts
│   │   │   ├── migration-registry.ts
│   │   │   ├── performance/
│   │   │   │   ├── 001_create_performance_indexes.sql
│   │   │   ├── README.md
│   │   │   ├── trust/
│   │   │   │   ├── 001_create_trust_system_tables.sql
│   │   │   │   ├── index.ts
│   │   │   ├── update-package-scripts.ts
│   │   │   ├── verification/
│   │   │   │   ├── 001_create_land_verification_tables.sql
│   │   │   │   ├── index.ts
│   │   ├── OPTIMIZED_STRUCTURE.md
│   │   ├── performance/
│   │   │   ├── index.ts
│   │   │   ├── LoadTestingFramework.ts
│   │   │   ├── PerformanceCertificationSystem.ts
│   │   │   ├── performance-cli.ts
│   │   │   ├── PerformanceMonitoringDashboard.ts
│   │   ├── PRODUCTION_DEPLOYMENT_GUIDE.md
│   │   ├── QueryOptimizer.ts
│   │   ├── README.md
│   │   ├── replication/
│   │   │   ├── ConnectionRouter.ts
│   │   │   ├── FailoverManager.ts
│   │   │   ├── haproxy.cfg
│   │   │   ├── pg_hba.conf
│   │   │   ├── postgresql-primary.conf
│   │   │   ├── postgresql-replica.conf
│   │   │   ├── ReplicationManager.ts
│   │   │   ├── scripts/
│   │   │   │   ├── 01-setup-replication.sh
│   │   │   ├── setup-ha.ts
│   │   ├── schemas/
│   │   │   ├── __tests__/
│   │   │   │   ├── schema-manager.test.ts
│   │   │   │   ├── validation.test.ts
│   │   │   ├── communication/
│   │   │   │   ├── index.ts
│   │   │   ├── consolidated.ts
│   │   │   ├── core/
│   │   │   │   ├── index.ts
│   │   │   ├── fraud/
│   │   │   │   ├── index.ts
│   │   │   ├── index.ts
│   │   │   ├── README.md
│   │   │   ├── trust/
│   │   │   │   ├── index.ts
│   │   │   ├── validation.ts
│   │   │   ├── verification/
│   │   │   │   ├── index.ts
│   │   ├── scripts/
│   │   │   ├── cleanup-redundant-files.ts
│   │   │   ├── consolidate-database-files.ts
│   │   │   ├── consolidate-database-infrastructure.ts
│   │   │   ├── consolidate-schemas.ts
│   │   │   ├── database-setup/
│   │   │   │   ├── initialize-database.ts
│   │   │   ├── data-pipeline.ts
│   │   │   ├── deploy.ts
│   │   │   ├── deploy-land-verification.ts
│   │   │   ├── execute-production-deployment.ts
│   │   │   ├── load-data.ts
│   │   │   ├── remove-empty-dirs.ts
│   │   │   ├── reset.ts
│   │   │   ├── run-disaster-recovery-test.ts
│   │   │   ├── run-performance-certification.ts
│   │   │   ├── run-production-readiness-assessment.ts
│   │   │   ├── run-security-validation.ts
│   │   │   ├── seed-data.ts
│   │   │   ├── setup-database.ts
│   │   │   ├── status.ts
│   │   │   ├── test-connection.ts
│   │   │   ├── test-migration-system.ts
│   │   │   ├── test-schema-management.ts
│   │   │   ├── test-setup.ts
│   │   │   ├── unified-data-generation.ts
│   │   │   ├── validate.ts
│   │   │   ├── validate-consolidation.ts
│   │   ├── scripts-evaluation.md
│   │   ├── security/
│   │   │   ├── __tests__/
│   │   │   │   ├── SecuritySystem.test.ts
│   │   │   ├── ComplianceManager.ts
│   │   │   ├── index.ts
│   │   │   ├── security-cli.ts
│   │   │   ├── SecurityMonitor.ts
│   │   │   ├── SecurityReporting.ts
│   │   │   ├── SecuritySystem.ts
│   │   │   ├── VulnerabilityScanner.ts
│   │   ├── seeds/
│   │   │   ├── __tests__/
│   │   │   │   ├── database-seeder.test.ts
│   │   │   │   ├── UnifiedDataGenerator.test.ts
│   │   │   ├── database-seeder.ts
│   │   │   ├── generators/
│   │   │   │   ├── checkpoint-manager.ts
│   │   │   │   ├── community-insights-generator.py
│   │   │   │   ├── fraud_analysis_report.json
│   │   │   │   ├── fraud-reports-generator.py
│   │   │   │   ├── fraud-simulator.py
│   │   │   │   ├── fraudulent_property_dataset.json
│   │   │   │   ├── fraudulent_transaction_dataset.json
│   │   │   │   ├── fraudulent_user_dataset.json
│   │   │   │   ├── index.ts
│   │   │   │   ├── integrate-data.ts
│   │   │   │   ├── KenyanDataGenerator.ts
│   │   │   │   ├── land-verification-generator.py
│   │   │   │   ├── optimized_land_dataset.json
│   │   │   │   ├── optimized_land_dataset_statistics.json
│   │   │   │   ├── property_dataset.json
│   │   │   │   ├── property_statistics.json
│   │   │   │   ├── property-generator.py
│   │   │   │   ├── README.md
│   │   │   │   ├── transaction_dataset.json
│   │   │   │   ├── user_dataset.json
│   │   │   │   ├── user_statistics.json
│   │   │   │   ├── user-generator.py
│   │   │   ├── index.ts
│   │   │   ├── kenyan-data-generator.ts
│   │   │   ├── land-verification.ts
│   │   │   ├── land-verification-seed.ts
│   │   │   ├── land-verification-system.ts
│   │   │   ├── README.md
│   │   │   ├── sample-ai-data.ts
│   │   │   ├── seed-kenya-properties.ts
│   │   │   ├── UnifiedDataGenerator.ts
│   │   ├── service.ts
│   │   ├── types/
│   │   │   ├── database.types.ts
│   │   │   ├── index.ts
│   │   ├── utils/
│   │   │   ├── analyzers/
│   │   │   │   ├── index.ts
│   │   │   ├── database-utils.ts
│   │   │   ├── generators/
│   │   │   │   ├── __tests__/
│   │   │   │   │   ├── data-generator.test.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── kenyan-data-generator.ts
│   │   │   │   ├── README.md
│   │   │   │   ├── unified-generator.ts
│   │   │   ├── index.ts
│   │   │   ├── migration-tools/
│   │   │   │   ├── consolidate-schemas.ts
│   │   │   │   ├── database-manager.ts
│   │   │   │   ├── fix-database.ts
│   │   │   │   ├── generate-test-chunks.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── inspect-schema.ts
│   │   │   │   ├── migrate-existing-properties.ts
│   │   │   │   ├── quality-gates.ts
│   │   │   │   ├── reset-and-create.ts
│   │   │   │   ├── robust-batch-loader.ts
│   │   │   │   ├── rollback-migration.ts
│   │   │   │   ├── run-migration.ts
│   │   │   │   ├── validate-migration.ts
│   │   │   ├── QueryOptimizer.ts
│   │   │   ├── validators/
│   │   │   │   ├── index.ts
│   ├── deduplication/
│   │   ├── __tests__/
│   │   │   ├── deduplication-middleware.integration.test.ts
│   │   │   ├── performance.test.ts
│   │   │   ├── redis-integration.test.ts
│   │   │   ├── RequestDeduplicator.test.ts
│   │   ├── examples/
│   │   │   ├── usage-example.ts
│   │   ├── index.ts
│   │   ├── RequestDeduplicator.ts
│   ├── email/
│   │   ├── email.service.ts
│   │   ├── email-config.ts
│   │   ├── email-service-init.ts
│   ├── events/
│   │   ├── EventBus.ts
│   ├── monitoring/
│   │   ├── __tests__/
│   │   │   ├── PerformanceOptimizer.test.ts
│   │   ├── AlertingSystem.ts
│   │   ├── BuildPerformanceMonitor.ts
│   │   ├── CachePerformanceMonitor.ts
│   │   ├── index.ts
│   │   ├── logger.ts
│   │   ├── MonitoringDashboard.ts
│   │   ├── ObservabilitySystem.ts
│   │   ├── PerformanceMonitor.ts
│   │   ├── PerformanceOptimizer.ts
│   │   ├── PrometheusMetrics.ts
│   │   ├── QueryPerformanceMonitor.ts
│   ├── optimization/
│   │   ├── BundleOptimizer.ts
│   │   ├── PerformanceOptimizer.ts
│   ├── rate-limiting/
│   │   ├── __tests__/
│   │   │   ├── ApiCallTracker.test.ts
│   │   │   ├── ApiRateLimiter.test.ts
│   │   │   ├── CircuitBreaker.test.ts
│   │   ├── ApiCallTracker.ts
│   │   ├── ApiRateLimiter.ts
│   │   ├── CircuitBreaker.ts
│   │   ├── examples/
│   │   │   ├── usage-example.ts
│   │   ├── index.ts
│   ├── storage/
│   │   ├── file.storage.ts
│   │   ├── FileStorageService.ts
│   │   ├── logger.ts
│   │   ├── SecureFileUploadService.ts
│   │   ├── storage.ts
│   ├── testing/
│   │   ├── TestFramework.ts
│   ├── versioning/
│   │   ├── __tests__/
│   │   │   ├── versioning.test.ts
│   │   ├── ApiDocumentation.ts
│   │   ├── ApiVersioning.ts
│   │   ├── ApiVersioningMiddleware.ts
│   │   ├── ApiVersionManager.ts
│   │   ├── examples/
│   │   │   ├── client-examples.ts
│   │   ├── index.ts
│   │   ├── README.md
│   │   ├── sedGOSgOE
│   │   ├── VersionedRoutes.ts
│   │   ├── versioning.middleware.ts
├── land-verification/
│   ├── __tests__/
│   │   ├── acceptance/
│   │   │   ├── realistic-scenarios.test.ts
│   │   ├── basic-structure.test.ts
│   │   ├── e2e/
│   │   │   ├── verification-workflows.test.ts
│   │   ├── integration/
│   │   │   ├── government-services.test.ts
│   │   │   ├── mocks/
│   │   │   │   ├── MockGovernmentServices.ts
│   │   │   ├── MonitoringServiceIntegration.test.ts
│   │   │   ├── PhysicalVerificationIntegration.test.ts
│   │   ├── load/
│   │   │   ├── concurrent-verification.test.ts
│   │   ├── MonitoringService.test.ts
│   │   ├── PhysicalVerificationService.test.ts
│   │   ├── README.md
│   │   ├── ReportingIntegration.test.ts
│   │   ├── ReportingService.test.ts
│   │   ├── run-comprehensive-tests.ts
│   │   ├── security/
│   │   │   ├── api-security.test.ts
│   │   │   ├── data-protection.test.ts
│   ├── audit/
│   │   ├── AuditLogger.ts
│   ├── cache/
│   │   ├── LandVerificationCache.ts
│   ├── CommunityIntelligenceIntegration.test.ts
│   ├── CommunityIntelligenceService.test.ts
│   ├── CommunityIntelligenceService.ts
│   ├── DocumentIntegration.ts
│   ├── error-handling/
│   │   ├── __tests__/
│   │   │   ├── ErrorHandlingService.test.ts
│   │   │   ├── FallbackManager.test.ts
│   │   │   ├── GracefulDegradationManager.test.ts
│   │   │   ├── RetryPolicyManager.test.ts
│   │   ├── AuditLogger.ts
│   │   ├── ErrorHandlingService.ts
│   │   ├── examples/
│   │   │   ├── GovernmentApiIntegration.ts
│   │   ├── FallbackManager.ts
│   │   ├── GracefulDegradationManager.ts
│   │   ├── README.md
│   │   ├── RetryPolicyManager.ts
│   ├── errors/
│   │   ├── LandVerificationErrors.ts
│   ├── ExpertCoordinationService.test.ts
│   ├── ExpertCoordinationService.ts
│   ├── health/
│   │   ├── HealthCheckService.ts
│   │   ├── health-routes.ts
│   ├── index.ts
│   ├── integration.test.ts
│   ├── LandVerificationService.test.ts
│   ├── LandVerificationService.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   ├── monitoring/
│   │   ├── alerting-routes.ts
│   │   ├── AlertingService.ts
│   │   ├── metrics-routes.ts
│   │   ├── MetricsService.ts
│   ├── MonitoringService.ts
│   ├── performance/
│   │   ├── __tests__/
│   │   │   ├── performance.test.ts
│   │   ├── AsyncProcessor.ts
│   │   ├── DatabaseOptimizer.ts
│   │   ├── PaginationService.ts
│   │   ├── PerformanceManager.ts
│   │   ├── performance-routes.ts
│   ├── PhysicalVerificationService.ts
│   ├── README.md
│   ├── ReportingService.ts
│   ├── resilience/
│   │   ├── FallbackMechanisms.ts
│   │   ├── GracefulDegradation.ts
│   │   ├── RetryPolicy.ts
│   ├── RiskAssessmentService.test.ts
│   ├── RiskAssessmentService.ts
│   ├── routes.ts
│   ├── security/
│   │   ├── __tests__/
│   │   │   ├── AccessControlService.test.ts
│   │   │   ├── AuditLogger.test.ts
│   │   │   ├── EncryptionService.test.ts
│   │   │   ├── PrivacyProtectionService.test.ts
│   │   ├── AccessControlService.ts
│   │   ├── AuditLogger.ts
│   │   ├── EncryptionService.ts
│   │   ├── PrivacyProtectionService.ts
│   │   ├── SecurityIntegration.ts
│   ├── ServiceFactory.ts
│   ├── utils/
│   │   ├── gps-calculations.ts
├── main.ts
├── middleware/
│   ├── __tests__/
│   │   ├── auth.integration.test.ts
│   │   ├── auth.middleware.basic.test.ts
│   │   ├── auth.middleware.test.ts
│   │   ├── centralized-error-handler.test.ts
│   │   ├── deduplication.middleware.test.ts
│   ├── auth.middleware.ts
│   ├── auth.ts
│   ├── cache.middleware.ts
│   ├── data-validation.ts
│   ├── deduplication.middleware.ts
│   ├── error.ts
│   ├── error-handler-integration-example.ts
│   ├── logging.middleware.ts
│   ├── query-limiter.middleware.ts
│   ├── rate-limiting.middleware.ts
│   ├── README-auth-middleware.md
│   ├── README-centralized-error-handler.md
│   ├── UnifiedSecurityMiddleware.ts
│   ├── validation.middleware.ts
├── ml/
│   ├── core/
│   │   ├── base-model.ts
│   ├── README.md
├── ml-core/
│   ├── deployment/
│   │   ├── production-deployment-guide.md
│   ├── examples/
│   │   ├── comprehensive-ml-integration.ts
│   ├── fraud-detection/
│   │   ├── AdvancedFraudDetectionEngine.ts
│   ├── index.ts
│   ├── infrastructure/
│   │   ├── ModelRegistry.ts
│   ├── orchestration/
│   │   ├── MLOrchestrationService.ts
│   ├── property-valuation/
│   │   ├── AutomatedValuationModel.ts
│   ├── README.md
│   ├── training/
│   │   ├── ContinuousLearningPipeline.ts
│   ├── trust-intelligence/
│   │   ├── CommunityTrustEngine.ts
├── monitoring/
│   ├── HealthMonitor.ts
│   ├── StructuredLogger.ts
├── property/
│   ├── property.controller.ts
│   ├── property.repository.ts
│   ├── property.service.ts
│   ├── property-controller-integration.test.ts
│   ├── property-e2e-integration.test.ts
│   ├── property-land-verification.test.ts
│   ├── property-repository-integration.test.ts
├── routes/
│   ├── __tests__/
│   │   ├── AuthRoutes.test.ts
│   │   ├── basic-integration.test.ts
│   │   ├── comprehensive-integration.test.ts
│   │   ├── integration-test-runner.ts
│   │   ├── integration-test-summary.md
│   │   ├── PropertyRoutes.test.ts
│   │   ├── ReviewRoutes.integration.test.ts
│   │   ├── run-integration-tests.ts
│   │   ├── test-setup.ts
│   │   ├── UserRoutes.integration.test.ts
│   │   ├── VerificationRoutes.integration.test.ts
│   ├── ai-routes.ts
│   ├── analytics.routes.ts
│   ├── auth.ts
│   ├── AuthRoutes.ts
│   ├── community-intelligence.routes.ts
│   ├── community-resources.routes.ts
│   ├── community-trust-routes.ts
│   ├── contact.routes.ts
│   ├── demo-auth-routes.ts
│   ├── document-verification.routes.ts
│   ├── email-routes.ts
│   ├── fraud-intelligence.routes.ts
│   ├── index.ts
│   ├── messaging.routes.ts
│   ├── metrics.routes.ts
│   ├── ml-routes.ts
│   ├── payments.ts
│   ├── professionals.routes.ts
│   ├── PropertyRoutes.ts
│   ├── README.md
│   ├── README-PropertyRoutes.md
│   ├── reviews.routes.ts
│   ├── search.routes.ts
│   ├── secure-document-routes.ts
│   ├── seed.ts
│   ├── trust.routes.ts
│   ├── users.routes.ts
│   ├── verification.routes.ts
├── search/
│   ├── search.controller.ts
├── security/
│   ├── SecurityHardening.ts
├── services/
│   ├── __tests__/
│   │   ├── ai-ml-service.test.ts
│   │   ├── AnalyticsService.test.ts
│   │   ├── AuthService.test.ts
│   │   ├── ProfessionalService.integration.test.ts
│   │   ├── ProfessionalService.test.ts
│   │   ├── PropertyService.integration.test.ts
│   │   ├── PropertyService.test.ts
│   │   ├── ReviewService.test.ts
│   │   ├── UserService.test.ts
│   │   ├── VerificationService.integration.test.ts
│   │   ├── VerificationService.test.ts
│   ├── ai-ml-service.ts
│   ├── AnalyticsService.ts
│   ├── AuthService.ts
│   ├── CommunicationService.ts
│   ├── CommunityIntelligenceService.ts
│   ├── CommunityResourcesService.ts
│   ├── DocumentAuthenticationService.ts
│   ├── file-storage-service.ts
│   ├── FraudIntelligenceService.ts
│   ├── MessagingService.ts
│   ├── mpesa-service.ts
│   ├── notification-service.ts
│   ├── ProfessionalService.ts
│   ├── PropertyService.ts
│   ├── ReviewService.ts
│   ├── TrustIntegrationService.ts
│   ├── UserService.ts
│   ├── VerificationService.ts
│   ├── WebSocketService.ts
├── shared/
│   ├── community-trust-schema.ts
│   ├── email-types.ts
├── simple-dev-server.ts
├── test-critical-services.ts
├── test-db-connection.ts
├── test-email-mock.ts
├── test-email-service.ts
├── test-integration.ts
├── tests/
│   ├── ai-integration.test.ts
│   ├── ai-integration-validation.test.ts
│   ├── API_BUG_FIXES_SUMMARY.md
│   ├── api-bug-fixes.ts
│   ├── api-validation.test.ts
│   ├── application-validation.test.ts
│   ├── auth/
│   │   ├── AuthenticationService.test.ts
│   ├── backend-api-comprehensive.test.ts
│   ├── backward-compatibility.test.ts
│   ├── basic-api.test.ts
│   ├── compatibility-validation.test.ts
│   ├── comprehensive-validation.test.ts
│   ├── e2e/
│   │   ├── land-verification-workflow.test.ts
│   ├── file-upload.test.ts
│   ├── file-upload-validation.test.ts
│   ├── integration/
│   │   ├── api.test.ts
│   │   ├── land-verification-system.test.ts
│   ├── load-test.ts
│   ├── load-test-validation.ts
│   ├── performance/
│   ├── performance.test.ts
│   │   ├── land-verification-load.test.ts
│   │   ├── load.test.ts
│   ├── performance-validation.test.ts
│   ├── quick-validation.test.ts
│   ├── run-api-tests.ts
│   ├── run-compatibility-tests.ts
│   ├── run-final-integration-tests.ts
│   ├── run-validation-tests.ts
│   ├── security/
│   │   ├── land-verification-security.test.ts
│   │   ├── SecurityHardening.test.ts
│   ├── setup.ts
│   ├── simple-api-validation.js
│   ├── test-setup.ts
│   ├── validate-api-fixes.test.ts
│   ├── validate-system-integration.ts
│   ├── validation-report.md
├── trust/
│   ├── community-trust.service.ts
│   ├── trust.controller.ts
│   ├── TrustScoringService.ts
├── types/
│   ├── api.types.ts
│   ├── auth.types.ts
│   ├── fraud.types.ts
│   ├── index.ts
│   ├── messaging.types.ts
│   ├── property.types.ts
│   ├── review.types.ts
│   ├── user.types.ts
│   ├── verification.types.ts
├── user/
│   ├── user.controller.ts
├── utils/
│   ├── api-route-registry.ts
│   ├── cleanup-manager.ts
│   ├── constants.ts
│   ├── error-messages.ts
│   ├── index.ts
│   ├── README.md
│   ├── response-helpers.ts
│   ├── validators.ts
├── vite.ts
src/
├── analytics/
│   ├── components/
│   │   ├── AnalyticsDashboard.tsx
│   ├── hooks/
│   │   ├── useAnalytics.ts
│   ├── index.ts
├── app/
│   ├── __tests__/
│   │   ├── lazy-loading.test.tsx
│   │   ├── lazy-routes.test.tsx
│   │   ├── navigation-routing.test.tsx
│   │   ├── router.test.tsx
│   ├── App.tsx
│   ├── error-boundary.tsx
│   ├── lazy-routes.tsx
│   ├── providers.tsx
│   ├── README.md
│   ├── route-performance.ts
│   ├── router.tsx
│   ├── route-validation.tsx
├── auth/
│   ├── __tests__/
│   │   ├── auth-integration.test.tsx
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── LoginForm.test.tsx
│   │   │   ├── PasswordReset.integration.test.tsx
│   │   │   ├── PasswordReset.security.test.tsx
│   │   │   ├── PasswordReset.test.tsx
│   │   │   ├── ProtectedRoute.test.tsx
│   │   │   ├── RegistrationWizard.test.tsx
│   │   │   ├── setup.ts
│   │   │   ├── TwoFactorAuth.test.tsx
│   │   │   ├── UserProfile.test.tsx
│   │   ├── index.ts
│   │   ├── LoginForm.tsx
│   │   ├── PasswordReset.tsx
│   │   ├── RegistrationWizard.tsx
│   │   ├── TwoFactorAuth.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   ├── useAuth.test.tsx
│   │   ├── index.ts
│   │   ├── useAuth.ts
│   ├── index.ts
│   ├── pages/
│   │   ├── __tests__/
│   │   │   ├── Login.test.tsx
│   │   │   ├── Register.test.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   ├── services/
│   │   ├── auth-api.ts
│   ├── types/
│   │   ├── auth.types.ts
├── communication/
│   ├── components/
│   │   ├── MessageComposer.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageThread.tsx
│   │   ├── NotificationCenter.tsx
│   │   ├── NotificationSystem.tsx
│   │   ├── RealTimeNotifications.tsx
│   ├── context/
│   │   ├── CommunicationContext.tsx
│   ├── hooks/
│   │   ├── useMessages.ts
│   │   ├── useMessaging.ts
│   │   ├── useNotifications.ts
│   ├── index.ts
│   ├── pages/
│   │   ├── Inbox.tsx
│   │   ├── MessageCenter.tsx
│   │   ├── Notifications.tsx
│   ├── services/
│   │   ├── communication-business-logic.ts
│   │   ├── DocumentCommunicationIntegration.ts
│   │   ├── WebSocketManager.ts
├── components/
│   ├── ai/
│   │   ├── HuggingFaceTestPage.tsx
│   │   ├── HuggingFaceTestPanel.tsx
├── config/
│   ├── external-dependencies.ts
├── global.d.ts
├── index.ts
├── infrastructure/
│   ├── ai/
│   │   ├── AIModelManager.tsx
│   ├── api/
│   │   ├── data-validation.ts
│   │   ├── queryClient.ts
│   │   ├── request-manager.ts
│   ├── audit/
│   │   ├── audit.types.ts
│   │   ├── AuditReporter.ts
│   │   ├── cli.ts
│   │   ├── config.ts
│   │   ├── EnhancedAuditRunner.ts
│   │   ├── index.ts
│   │   ├── LinkValidator.ts
│   │   ├── plugins/
│   │   │   ├── AccessibilityPlugin.ts
│   │   │   ├── PerformancePlugin.ts
│   │   │   ├── SecurityPlugin.ts
│   │   ├── README.md
│   │   ├── RouteAnalyzer.ts
│   │   ├── run-audit.ts
│   │   ├── tsconfig.json
│   │   ├── types.ts
│   │   ├── UIAuditSystem.ts
│   ├── cache/
│   │   ├── query-cache.ts
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   ├── integration.test.ts
│   │   │   ├── safe-hooks.test.ts
│   │   │   ├── useCleanupManager.test.ts
│   │   │   ├── useCoordinatedState.test.ts
│   │   ├── examples/
│   │   │   ├── race-condition-prevention.tsx
│   │   ├── index.ts
│   │   ├── README.md
│   │   ├── useCleanupManager.ts
│   │   ├── useCoordinatedState.ts
│   │   ├── useIntersectionObserver.ts
│   │   ├── useSafeEffect.ts
│   │   ├── useSafeState.ts
│   │   ├── useStableCallback.ts
│   ├── monitoring/
│   │   ├── bundle-analyzer.ts
│   │   ├── core-web-vitals.ts
│   │   ├── index.ts
│   │   ├── operation-tracker.ts
│   │   ├── performance-monitor.ts
│   │   ├── PerformanceMonitoringProvider.tsx
│   │   ├── query-monitor.ts
│   │   ├── resource-hints.ts
│   │   ├── system-health.ts
│   │   ├── usePerformanceMonitoring.ts
│   ├── payments/
│   │   ├── PaymentSystemInterface.tsx
│   ├── realtime/
│   │   ├── websocket-client.ts
│   ├── routing/
│   │   ├── __tests__/
│   │   │   ├── integration.test.ts
│   │   │   ├── route-preloader.test.ts
│   │   │   ├── useRoutePreloader.test.tsx
│   │   ├── index.ts
│   │   ├── README.md
│   │   ├── ROUTE_PRELOADER_ANALYSIS.md
│   │   ├── RoutePerformanceMonitor.tsx
│   │   ├── route-preloader.ts
│   │   ├── route-preloader-disabled.ts
│   │   ├── useRoutePreloader.ts
│   │   ├── useRoutePreloader-disabled.ts
│   ├── services/
│   │   ├── image-preload-service.ts
│   ├── service-worker/
│   │   ├── sw-registration.ts
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── image-optimization.test.ts
│   │   ├── image-optimization.ts
├── land-verification/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── ContextualGuidanceProvider.test.tsx
│   │   │   ├── DecisionSupportTool.test.tsx
│   │   │   ├── HelpSystem.test.tsx
│   │   │   ├── KenyaLandEducation.test.tsx
│   │   │   ├── ReportingPortal.test.tsx
│   │   │   ├── RiskFactorAnalysis.test.tsx
│   │   │   ├── RiskManagementInterface.test.tsx
│   │   │   ├── ScenarioModelingTool.test.tsx
│   │   ├── CommunityInterviewTemplate.tsx
│   │   ├── ContextualGuidanceProvider.tsx
│   │   ├── DecisionSupportTool.tsx
│   │   ├── ExpertCoordinationInterface.tsx
│   │   ├── HelpSystem.tsx
│   │   ├── index.ts
│   │   ├── KenyaLandEducation.tsx
│   │   ├── LandVerificationDashboard.tsx
│   │   ├── ProfessionalResourcesDirectory.tsx
│   │   ├── RecommendationEngine.tsx
│   │   ├── ReportingPortal.tsx
│   │   ├── RiskAssessmentDisplay.tsx
│   │   ├── RiskFactorAnalysis.tsx
│   │   ├── RiskManagementInterface.tsx
│   │   ├── RiskProfileVisualization.tsx
│   │   ├── RiskWeightingControls.tsx
│   │   ├── ScenarioModelingTool.tsx
│   │   ├── VerificationProgressTracker.tsx
│   │   ├── VerificationWizard.tsx
│   ├── hooks/
│   │   ├── useLandVerification.ts
│   ├── index.ts
│   ├── pages/
│   │   ├── index.ts
│   │   ├── LandVerificationDashboardPage.tsx
│   │   ├── LandVerificationPage.tsx
│   │   ├── NewVerificationPage.tsx
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── HelpDocumentationService.test.ts
│   │   ├── DocumentIntelligenceIntegration.ts
│   │   ├── HelpDocumentationService.ts
├── main.tsx
├── ml/
│   ├── core/
│   │   ├── feature-engineering.ts
├── monitoring/
│   ├── components/
│   │   ├── HealthDashboard.tsx
│   ├── index.ts
│   ├── pages/
│   │   ├── MonitoringPage.tsx
├── property/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── accessibility.test.tsx
│   │   │   ├── ListingCard.grid.test.tsx
│   │   │   ├── PropertyCard.test.tsx
│   │   │   ├── PropertyListing.comprehensive.test.tsx
│   │   │   ├── PropertyListing.integration.test.tsx
│   │   │   ├── PropertyListing.test.tsx
│   │   │   ├── PropertyListingTests.test.tsx
│   │   │   ├── PropertyListingWizard.comprehensive.test.tsx
│   │   │   ├── PropertyListingWizard.test.tsx
│   │   │   ├── PropertyMap.test.tsx
│   │   │   ├── PropertyReviews.test.tsx
│   │   ├── CompareBar.tsx
│   │   ├── CompareModal.tsx
│   │   ├── EnhancedLandCard.tsx
│   │   ├── index.ts
│   │   ├── PerformanceTestPanel.tsx
│   │   ├── PropertyCardShowcase.module.css
│   │   ├── PropertyCardShowcase.module.css.d.ts
│   │   ├── PropertyCardShowcase.tsx
│   │   ├── PropertyListingWizard.tsx
│   │   ├── PropertyMap.tsx
│   │   ├── PropertyReviews.tsx
│   │   ├── PropertyTestComponent.tsx
│   │   ├── wizard/
│   │   │   ├── config.ts
│   │   │   ├── examples/
│   │   │   │   ├── WizardExamples.tsx
│   │   │   ├── index.ts
│   │   │   ├── README.md
│   │   │   ├── steps/
│   │   │   │   ├── AdaptedBasicDetailsStep.tsx
│   │   │   │   ├── AdaptedFeaturesStep.tsx
│   │   │   │   ├── AdaptedImagesStep.tsx
│   │   │   │   ├── AdaptedLocationStep.tsx
│   │   │   │   ├── AdaptedPreviewStep.tsx
│   │   │   │   ├── AdaptedPricingStep.tsx
│   │   │   │   ├── DocumentationStep.tsx
│   │   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── UnifiedPropertyWizard.tsx
│   ├── contexts/
│   │   ├── __tests__/
│   │   │   ├── compare-context-removal.test.tsx
│   │   ├── ARCHITECTURE.md
│   │   ├── COMPARE_CONTEXT_REMOVAL_SUMMARY.md
│   │   ├── index.ts
│   │   ├── PropertyContext.tsx
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   ├── consolidation-validation.test.ts
│   │   ├── index.ts
│   │   ├── MIGRATION_GUIDE.md
│   │   ├── useConsolidatedPropertySearch.ts
│   │   ├── useLandProperty.ts
│   │   ├── useProperty.ts
│   │   ├── usePropertySearch.ts
│   │   ├── useUnifiedProperty.ts
│   ├── index.ts
│   ├── pages/
│   │   ├── __tests__/
│   │   │   ├── ListProperty.test.tsx
│   │   │   ├── PropertiesResidential.test.tsx
│   │   │   ├── PropertyCompare.comprehensive.test.tsx
│   │   │   ├── PropertyDetails.comprehensive.test.tsx
│   │   │   ├── PropertyDetails.test.tsx
│   │   ├── CommercialProperties.tsx
│   │   ├── index.ts
│   │   ├── LandDetails.tsx
│   │   ├── LandRedirect.tsx
│   │   ├── Lands.tsx
│   │   ├── ListProperty.tsx
│   │   ├── PropertiesResidential.tsx
│   │   ├── PropertyCompare.tsx
│   │   ├── PropertyDetails.tsx
│   │   ├── PropertyEdit.tsx
│   │   ├── PropertyOptimize.tsx
│   │   ├── PropertyPhotos.tsx
│   │   ├── PropertyVerification.tsx
│   │   ├── PropertyWizard.tsx
│   ├── services/
│   │   ├── index.ts
│   │   ├── mock-land-data.ts
│   │   ├── property-api.ts
│   │   ├── PropertyDocumentIntegration.ts
│   │   ├── property-validation.ts
│   ├── tests/
│   │   ├── performanceTest.ts
│   │   ├── property-land-verification.test.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── property.types.ts
│   ├── utils/
│   │   ├── normalizeLandProperty.ts
│   │   ├── normalizeProperty.ts
│   │   ├── performanceMonitor.ts
│   │   ├── propertyImages.ts
│   │   ├── raceConditionTest.ts
├── property-hooks-test.tsx
├── search/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── SearchBar.test.tsx
│   │   ├── ConsolidatedSearch.tsx
│   │   ├── index.ts
│   │   ├── SearchBar.tsx
│   │   ├── SearchFilters.tsx
│   ├── CONSOLIDATION_SUMMARY.md
│   ├── examples/
│   │   ├── SearchExample.tsx
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useSearch.ts
│   ├── index.ts
│   ├── pages/
│   │   ├── AdvancedSearch.tsx
│   │   ├── SearchResults.tsx
├── shared/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── PropertyDataGrid.test.tsx
│   │   │   ├── QueryErrorBoundary.test.tsx
│   │   ├── AfricaCoverageMap.tsx
│   │   ├── b2b/
│   │   │   ├── B2BCommunityInsightsBanner.tsx
│   │   │   ├── B2BCommunityInsightsPrompt.tsx
│   │   │   ├── B2BContextualPrompt.tsx
│   │   │   ├── B2BEntryPointManager.tsx
│   │   │   ├── B2BFraudReportBanner.tsx
│   │   │   ├── B2BFraudReportPrompt.tsx
│   │   │   ├── B2BLeadCapture.tsx
│   │   │   ├── B2BNotificationBanner.tsx
│   │   │   ├── index.ts
│   │   ├── blog/
│   │   │   ├── BlogPostCard.tsx
│   │   │   ├── BlogPostSkeleton.tsx
│   │   ├── CommunityInsights.tsx
│   │   ├── DemoLoginHelper.tsx
│   │   ├── EnhancedVirtualizedPropertyList.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorFeedback.tsx
│   │   ├── error-handling/
│   │   │   ├── index.ts
│   │   ├── examples/
│   │   │   ├── EnhancedHooksExample.tsx
│   │   ├── fallbacks/
│   │   │   ├── index.ts
│   │   │   ├── MobileNavFallback.tsx
│   │   │   ├── NavigationFallback.tsx
│   │   │   ├── RouterFallback.tsx
│   │   ├── forms/
│   │   │   ├── __tests__/
│   │   │   │   ├── FormField.test.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── FileUploadField.tsx
│   │   │   ├── FormField.tsx
│   │   ├── GlobalPerformanceTestPanel.tsx
│   │   ├── hero/
│   │   │   ├── ConversionHero.tsx
│   │   │   ├── EnhancedHero.tsx
│   │   ├── images/
│   │   │   ├── EnhancedImageShowcase.tsx
│   │   │   ├── ImageGallery.module.css
│   │   │   ├── ImageGallery.tsx
│   │   │   ├── index.ts
│   │   │   ├── MIGRATION_GUIDE.md
│   │   │   ├── PropertyImageVault.tsx
│   │   │   ├── REDUNDANCY_ANALYSIS.md
│   │   ├── index.ts
│   │   ├── IntegrationTest.tsx
│   │   ├── layout/
│   │   │   ├── __tests__/
│   │   │   │   ├── accessibility.test.tsx
│   │   │   │   ├── AppLayout.test.tsx
│   │   │   │   ├── Navigation.test.tsx
│   │   │   ├── AppLayout.tsx
│   │   │   ├── ContentGrid.tsx
│   │   │   ├── FloatingActionButton.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── index.ts
│   │   │   ├── LayoutContainer.tsx
│   │   │   ├── NavbarSpacer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── PageWrapper.tsx
│   │   │   ├── README.md
│   │   │   ├── SectionDivider.tsx
│   │   ├── LazyComponents.tsx
│   │   ├── listing-card.tsx
│   │   ├── LoadingStates.tsx
│   │   ├── monitoring/
│   │   │   ├── ApiClientDashboard.tsx
│   │   ├── navigation/
│   │   │   ├── __tests__/
│   │   │   │   ├── accessibility.test.tsx
│   │   │   │   ├── breadcrumbs.test.tsx
│   │   │   │   ├── CrashDetector.tsx
│   │   │   │   ├── FinalNavigationTest.tsx
│   │   │   │   ├── MinimalNavTest.tsx
│   │   │   │   ├── MobileNav.test.tsx
│   │   │   │   ├── Navigation.integration.test.tsx
│   │   │   │   ├── navigation-crash-fixes.test.tsx
│   │   │   │   ├── NavigationCrashTest.test.tsx
│   │   │   │   ├── NavigationSmoothTest.test.tsx
│   │   │   │   ├── SimpleCrashTest.tsx
│   │   │   ├── BreadcrumbNavigation.tsx
│   │   │   ├── ContextualSidebar.tsx
│   │   │   ├── EnhancedNavigation.tsx
│   │   │   ├── index.ts
│   │   │   ├── MOBILE_NAV_VISIBILITY_IMPROVEMENTS.md
│   │   │   ├── MobileNav.tsx
│   │   │   ├── NAVIGATION_CRASH_FIXES_COMPLETE.md
│   │   │   ├── NAVIGATION_FIXES_SUMMARY.md
│   │   │   ├── NavigationDebug.tsx
│   │   │   ├── NavigationErrorBoundary.tsx
│   │   │   ├── NavigationSearch.tsx
│   │   │   ├── SafeNavigation.tsx
│   │   ├── NewsBlog.tsx
│   │   ├── Pagination.tsx
│   │   ├── PaymentGuidance.tsx
│   │   ├── PricingCTA.tsx
│   │   ├── property/
│   │   │   ├── __tests__/
│   │   │   │   ├── PropertyListingPage.test.tsx
│   │   │   ├── filters/
│   │   │   │   ├── AllPropertiesFilters.tsx
│   │   │   │   ├── BasePropertyFilters.tsx
│   │   │   │   ├── CommercialFilters.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── LandFilters.tsx
│   │   │   │   ├── ResidentialFilters.tsx
│   │   │   ├── index.ts
│   │   │   ├── PhotoManagementButton.tsx
│   │   │   ├── PropertyArchitectureComparison.tsx
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PropertyCardWithImageManagement.example.tsx
│   │   │   ├── PropertyDataGrid.tsx
│   │   │   ├── PropertyListingPage.tsx
│   │   │   ├── PropertySkeletonGrid.tsx
│   │   │   ├── shared/
│   │   │   │   ├── examples/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── MinimalPropertyCard.tsx
│   │   │   │   ├── FINAL_STATUS.md
│   │   │   │   ├── index.ts
│   │   │   │   ├── PropertyFeatures.tsx
│   │   │   │   ├── PropertyImageSection.tsx
│   │   │   │   ├── QuickActionsOverlay.tsx
│   │   │   │   ├── REFACTORING_COMPLETE.md
│   │   │   │   ├── REFACTORING_GUIDE.md
│   │   │   ├── UnifiedPropertyCard.tsx
│   │   ├── QueryErrorBoundary.tsx
│   │   ├── RouteRedirect.tsx
│   │   ├── ServiceCategories.tsx
│   │   ├── skeletons/
│   │   │   ├── PropertyDetailsSkeleton.tsx
│   │   ├── Testimonials.tsx
│   │   ├── TrustIndicators.tsx
│   │   ├── ui/
│   │   │   ├── __tests__/
│   │   │   │   ├── accessibility.test.tsx
│   │   │   │   ├── button.test.tsx
│   │   │   │   ├── form.test.tsx
│   │   │   │   ├── input.test.tsx
│   │   │   ├── accordion.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx
│   │   │   ├── common-buttons.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── enhanced-navigation.tsx
│   │   │   ├── error-states.tsx
│   │   │   ├── form.tsx
│   │   │   ├── hover-card.tsx
│   │   │   ├── index.ts
│   │   │   ├── input.tsx
│   │   │   ├── input-otp.tsx
│   │   │   ├── label.tsx
│   │   │   ├── loading-skeleton.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── loading-states.tsx
│   │   │   ├── logo.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── resizable.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── toggle.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── wordmark.tsx
│   │   ├── VideoModal.tsx
│   │   ├── VirtualizedList.tsx
│   │   ├── VirtualizedPropertyList.tsx
│   ├── config/
│   │   ├── assets.ts
│   │   ├── image-components.config.ts
│   │   ├── images.ts
│   │   ├── image-system.config.ts
│   │   ├── propertyTypes.ts
│   │   ├── user-journeys.ts
│   ├── contexts/
│   │   ├── ThemeContext.tsx
│   ├── docs/
│   │   ├── memory-optimization-guide.md
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   ├── accessibility-integration.test.tsx
│   │   │   ├── backward-compatibility.test.tsx
│   │   │   ├── feature-parity.test.ts
│   │   │   ├── feature-parity.test.tsx
│   │   │   ├── integration.test.tsx
│   │   │   ├── performance-validation.test.ts
│   │   │   ├── test-config.ts
│   │   │   ├── useAccessibility.test.tsx
│   │   │   ├── useDebounce.test.ts
│   │   │   ├── useFileUpload.test.ts
│   │   │   ├── useForm.test.tsx
│   │   │   ├── useFormPersistence.test.ts
│   │   │   ├── useFormValidation.test.ts
│   │   │   ├── useImageGallery.test.ts
│   │   │   ├── usePropertyCardActions.test.ts
│   │   │   ├── usePropertyFormatting.test.ts
│   │   │   ├── useSafeQuery.test.ts
│   │   │   ├── use-toast.test.ts
│   │   ├── configs/
│   │   │   ├── formValidationConfigs.ts
│   │   │   ├── hookConfigs.ts
│   │   │   ├── propertyQueryConfigs.ts
│   │   ├── CONSOLIDATION_LOG.md
│   │   ├── examples/
│   │   │   ├── configurationExamples.ts
│   │   ├── images/
│   │   │   ├── usePropertyImageUpload.ts
│   │   ├── index.ts
│   │   ├── migration/
│   │   │   ├── COMPREHENSIVE_MIGRATION_GUIDE.md
│   │   │   ├── MIGRATION_CHECKLIST.md
│   │   │   ├── property-hooks-migration.md
│   │   │   ├── README.md
│   │   │   ├── TROUBLESHOOTING_GUIDE.md
│   │   ├── presets/
│   │   │   ├── commonHookPresets.ts
│   │   ├── QUALITY_STANDARDS.md
│   │   ├── SESSION_SUMMARY.md
│   │   ├── STANDARDIZATION_SUMMARY.md
│   │   ├── useAccessibility.tsx
│   │   ├── useB2BEntryPoints.ts
│   │   ├── useB2BMessaging.ts
│   │   ├── useCMS.ts
│   │   ├── useCompareError.ts
│   │   ├── useComponentPerformance.tsx
│   │   ├── useConfigurableHook.ts
│   │   ├── useDebounce.ts
│   │   ├── useDebouncedCallback.ts
│   │   ├── useEnhancedImageGallery.ts
│   │   ├── useErrorRecovery.ts
│   │   ├── useFileUpload.ts
│   │   ├── useFilterState.ts
│   │   ├── useFormValidation.ts
│   │   ├── useGeolocation.ts
│   │   ├── useHealthMonitoring.ts
│   │   ├── useImageGallery.ts
│   │   ├── useMemoryOptimization.ts
│   │   ├── use-mobile.tsx
│   │   ├── useNavigationSpacing.ts
│   │   ├── useOperationTracking.ts
│   │   ├── useOptimisticMutation.ts
│   │   ├── usePagination.ts
│   │   ├── usePaymentGuidance.ts
│   │   ├── usePerformanceOptimization.ts
│   │   ├── usePolling.ts
│   │   ├── usePropertyActions.ts
│   │   ├── usePropertyCardActions.ts
│   │   ├── usePropertyCardState.ts
│   │   ├── usePropertyCompareActions.ts
│   │   ├── usePropertyFormatting.ts
│   │   ├── useSafeQuery.ts
│   │   ├── useSecurity.ts
│   │   ├── use-toast.ts
│   │   ├── useWebSocket.ts
│   │   ├── utils/
│   │   │   ├── deprecation.ts
│   │   │   ├── init.ts
│   │   │   ├── migration.ts
│   ├── index.ts
│   ├── lib/
│   │   ├── utils.ts
│   ├── pages/
│   │   ├── __tests__/
│   │   │   ├── Community.test.tsx
│   │   │   ├── Fraud-resources.test.tsx
│   │   │   ├── PropertiesResidential.test.tsx
│   │   ├── About.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── ApiDemo.tsx
│   │   ├── Blog.tsx
│   │   ├── BlogPost.tsx
│   │   ├── BlogTest.tsx
│   │   ├── ComingSoon.tsx
│   │   ├── Community.tsx
│   │   ├── CommunityAndResources.tsx
│   │   ├── CommunityIntelligence.tsx
│   │   ├── Contact.tsx
│   │   ├── ContactSales.tsx
│   │   ├── Cookies.tsx
│   │   ├── Demo.tsx
│   │   ├── DeveloperDashboard.tsx
│   │   ├── DocumentsPage.tsx
│   │   ├── DocumentUpload.tsx
│   │   ├── DocumentViewer.tsx
│   │   ├── ExpertCoordination.tsx
│   │   ├── Features.tsx
│   │   ├── FindProfessionals.tsx
│   │   ├── Fraud-resources.tsx
│   │   ├── GettingStarted.tsx
│   │   ├── Help.tsx
│   │   ├── Home.tsx
│   │   ├── index.ts
│   │   ├── LocationServices.tsx
│   │   ├── MVP-Demo.tsx
│   │   ├── NavigationTest.tsx
│   │   ├── NotFound.tsx
│   │   ├── OurStory.tsx
│   │   ├── Partners.tsx
│   │   ├── PhysicalVerification.tsx
│   │   ├── PressMedia.tsx
│   │   ├── Pricing.tsx
│   │   ├── Privacy.tsx
│   │   ├── Properties.tsx
│   │   ├── Resources.tsx
│   │   ├── Security.tsx
│   │   ├── Services.tsx
│   │   ├── solutions/
│   │   ├── Solutions.tsx
│   │   │   ├── LegalExperts.tsx
│   │   │   ├── PropertyBuyers.tsx
│   │   │   ├── PropertyDevelopers.tsx
│   │   │   ├── PropertySellers.tsx
│   │   │   ├── RealEstateAgents.tsx
│   │   ├── SystemMonitoring.tsx
│   │   ├── Terms.tsx
│   ├── performance/
│   │   ├── index.ts
│   ├── schema.ts
│   ├── security/
│   │   ├── index.ts
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── api-client.integration.test.ts
│   │   │   ├── api-client.test.ts
│   │   │   ├── api-client-core.test.ts
│   │   │   ├── api-integration-summary.test.ts
│   │   │   ├── cache-invalidation.test.ts
│   │   │   ├── data-transformation.test.ts
│   │   │   ├── enhanced-cache-manager.test.ts
│   │   │   ├── unified-api-client.test.ts
│   │   │   ├── unified-api-client-verification.test.ts
│   │   │   ├── websocket-integration.test.ts
│   │   │   ├── websocket-simple.test.ts
│   │   ├── AlertingService.ts
│   │   ├── api-client-monitor.ts
│   │   ├── archive/
│   │   │   ├── README.md
│   │   ├── AuditLogService.ts
│   │   ├── audit-trail-service.ts
│   │   ├── AuthTokenService.ts
│   │   ├── CacheService.ts
│   │   ├── DataMigrationService.ts
│   │   ├── examples/
│   │   │   ├── unified-api-client-examples.ts
│   │   ├── FormService.ts
│   │   ├── HealthCheckService.ts
│   │   ├── huggingface-api-client.ts
│   │   ├── huggingface-mock-client.ts
│   │   ├── images/
│   │   │   ├── __tests__/
│   │   │   │   ├── service-consolidation.test.ts
│   │   │   ├── CONSOLIDATION_SUMMARY.md
│   │   │   ├── core/
│   │   │   │   ├── ImageServiceCore.ts
│   │   │   ├── ImageMetadataService.ts
│   │   │   ├── ImageServiceOrchestrator.ts
│   │   │   ├── index.ts
│   │   │   ├── LegacyServiceAdapter.ts
│   │   │   ├── MIGRATION_GUIDE.md
│   │   │   ├── PropertyImageUploadCoordinator.ts
│   │   │   ├── PropertyImageUploadService.ts
│   │   │   ├── PropertyImageValidationService.ts
│   │   │   ├── PropertyImageWorkflowManager.ts
│   │   │   ├── UnifiedImageServiceFactory.ts
│   │   │   ├── USAGE_EXAMPLES.md
│   │   ├── index.ts
│   │   ├── mock-ai-data.ts
│   │   ├── mock-huggingface-client.ts
│   │   ├── performance-monitoring-service.ts
│   │   ├── PerformanceService.ts
│   │   ├── RateLimitService.ts
│   │   ├── SearchService.ts
│   │   ├── security-monitoring-service.ts
│   │   ├── unified-api-client.ts
│   │   ├── ValidationService.ts
│   ├── styles/
│   │   ├── design-system.css
│   │   ├── globals.css
│   ├── testing/
│   │   ├── ApiTestUtils.ts
│   │   ├── E2ETestUtils.ts
│   │   ├── index.ts
│   │   ├── TestUtils.ts
│   ├── test-utils/
│   │   ├── __tests__/
│   │   │   ├── accessibility-basic.test.tsx
│   │   │   ├── accessibility-forms.test.tsx
│   │   │   ├── accessibility-suite.test.tsx
│   │   │   ├── api-error-responses.test.tsx
│   │   │   ├── bundle-performance.test.ts
│   │   │   ├── component-performance.test.ts
│   │   │   ├── component-performance.test.tsx
│   │   │   ├── core-web-vitals.test.ts
│   │   │   ├── empty-loading-states.test.tsx
│   │   │   ├── ERROR_HANDLING_SUMMARY.md
│   │   │   ├── error-boundaries.test.tsx
│   │   │   ├── error-handling-demo.test.tsx
│   │   │   ├── error-handling-integration.test.tsx
│   │   │   ├── form-validation-integration.test.tsx
│   │   │   ├── image-performance.test.ts
│   │   │   ├── network-errors.test.tsx
│   │   │   ├── page-load-performance.test.ts
│   │   │   ├── page-performance.test.ts
│   │   │   ├── performance.test.ts
│   │   │   ├── validation-errors.test.tsx
│   │   │   ├── virtualization-performance.test.ts
│   │   ├── accessibility.ts
│   │   ├── ACCESSIBILITY_TESTING_GUIDE.md
│   │   ├── api-handlers.ts
│   │   ├── bug-detector.ts
│   │   ├── cross-browser/
│   │   │   ├── browser-detection.ts
│   │   ├── error-testing.ts
│   │   ├── example.test.tsx
│   │   ├── fixtures.ts
│   │   ├── FORM_TESTING_SUMMARY.md
│   │   ├── form-testing.ts
│   │   ├── foundation.test.tsx
│   │   ├── index.ts
│   │   ├── memory-manager.ts
│   │   ├── msw-browser.ts
│   │   ├── msw-server.ts
│   │   ├── patterns.ts
│   │   ├── performance-testing.ts
│   │   ├── README.md
│   │   ├── render.tsx
│   │   ├── setup.ts
│   │   ├── test-chunking.ts
│   │   ├── user-event.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── api.types.ts
│   │   ├── api-contracts.ts
│   │   ├── compare.ts
│   │   ├── contracts/
│   │   │   ├── property-contracts.ts
│   │   │   ├── user-contracts.ts
│   │   ├── images/
│   │   │   ├── index.ts
│   │   │   ├── unified.ts
│   │   ├── index.ts
│   │   ├── property.ts
│   │   ├── search.ts
│   │   ├── service-interfaces.ts
│   ├── utils/
│   │   ├── __tests__/
│   │   ├── api-client.ts
│   │   ├── cn.ts
│   │   ├── compare-utils.tsx
│   │   ├── date-utils.ts
│   │   ├── errors.ts
│   │   ├── formatters.ts
│   │   ├── globalPerformanceMonitor.ts
│   │   ├── images/
│   │   │   ├── unified-utils.ts
│   │   ├── index.ts
│   │   ├── logger.ts
│   │   ├── mockPropertyApi.ts
│   │   ├── navigation.ts
│   │   ├── performance-optimizer.ts
│   │   ├── propertyAdapters.ts
│   │   ├── property-mapper.ts
│   │   ├── request-monitor.ts
│   │   ├── route-tester.ts
│   │   ├── route-validator.ts
│   │   ├── safe-navigation.ts
│   │   ├── test-helpers.tsx
│   │   ├── toast-utils.ts
├── test-new-pages.tsx
├── test-safe-hooks.tsx
├── trust/
│   ├── components/
│   │   ├── CaseManagementInterface.tsx
│   │   ├── DocumentAuthentication.tsx
│   │   ├── DocumentUploadInterface.tsx
│   │   ├── DocumentVerificationResults.tsx
│   │   ├── FraudAlertsList.tsx
│   │   ├── FraudDetectionDashboard.tsx
│   │   ├── MLAnalyticsDisplay.tsx
│   │   ├── NetworkAnalysisVisualization.tsx
│   │   ├── PropertyRiskAssessment.tsx
│   │   ├── TrustScore.tsx
│   │   ├── VerificationBadge.tsx
│   ├── contexts/
│   │   ├── TrustContext.tsx
│   ├── hooks/
│   │   ├── useDocumentAuthentication.ts
│   │   ├── useFraudDetection.ts
│   │   ├── useTrustScore.ts
│   ├── index.ts
│   ├── pages/
│   │   ├── __tests__/
│   │   │   ├── Reviews.test.tsx
│   │   ├── Alerts.tsx
│   │   ├── BasicChecks.tsx
│   │   ├── DocumentAuth.tsx
│   │   ├── FraudDetection.tsx
│   │   ├── FraudProtectionInfo.tsx
│   │   ├── Karma.tsx
│   │   ├── Reports.tsx
│   │   ├── Reputation.tsx
│   │   ├── Reviews.tsx
│   │   ├── TrustPoints.tsx
│   ├── services/
│   │   ├── DocumentTrustIntegration.ts
│   │   ├── fraudDetectionApi.ts
│   │   ├── trust-api.ts
│   │   ├── trust-business-logic.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── trust.types.ts
├── types/
│   ├── audit.types.ts
│   ├── css.d.ts
│   ├── event.types.ts
│   ├── land-verification.ts
│   ├── route.types.ts
├── user/
│   ├── components/
│   │   ├── index.ts
│   │   ├── UserNotifications.tsx
│   │   ├── UserProfile.tsx
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useUser.ts
│   ├── index.ts
│   ├── pages/
│   │   ├── Activity.tsx
│   │   ├── Dashboard.tsx
│   │   ├── index.ts
│   │   ├── Team.tsx
│   │   ├── Tenants.tsx
│   │   ├── UserProfile.tsx
│   │   ├── UserSettings.tsx
│   ├── services/
│   │   ├── README.md
│   │   ├── user-business-logic.ts
├── utils/
│   ├── bundle-optimizer.ts
│   ├── performance-optimizer.ts
├── vite-env.d.ts
STRATEGIC_CONSOLIDATION_SUMMARY.md
strategic-consolidation.md
tailwind.config.ts
test-huggingface-integration.js
test-integration-quick.js
test-jq.sh
test-property-endpoints.cjs
test-property-hook.tsx
tests/
├── e2e/
│   ├── auth-workflows.spec.ts
│   ├── complete-user-workflows.spec.ts
│   ├── config/
│   │   ├── test-config.ts
│   ├── helpers/
│   │   ├── test-helpers.ts
│   ├── integration-workflows.spec.ts
│   ├── property-workflows.spec.ts
│   ├── README.md
│   ├── review-workflows.spec.ts
│   ├── user-profile-workflows.spec.ts
├── integration/
│   ├── api/
│   │   ├── auth.test.ts
├── setup.ts
├── shared/
│   ├── ConsolidatedTestFramework.ts
├── test-all-routes.ts
├── test-app-startup.ts
├── test-db.cjs
├── test-deployment.html
├── test-env.ts
├── test-imports.mjs
├── test-imports.ts
├── test-integration-simple.js
├── test-with-jsdom.ts
├── unit/
│   ├── services/
│   │   ├── CacheService.test.ts
├── validate-integration.js
├── visual/
│   ├── animations.visual.test.ts
│   ├── components.visual.test.ts
│   ├── helpers/
│   │   ├── visual-test-utils.ts
│   ├── layouts.visual.test.ts
│   ├── README.md
│   ├── responsive-design.visual.test.ts
│   ├── responsive-navigation.visual.test.ts
│   ├── setup.visual.test.ts
│   ├── visual.config.ts
test-server.js
test-server-start.js
theme.json
tsconfig.json
tsconfig.src.json
tsconfig.test.json
types/
├── css.d.ts
├── PropertyCardShowcase.css.d.ts
unified-evolution.sh
update-consolidated-imports.sh
update-shared-imports.sh
update-validation-imports.sh
uploads/
vercel.json
vite.config.ts
vitest.workspace.ts
```

**Excluded directories:** `.git`, `node_modules`, `dist`, `build`, `coverage`, `tmp`, `temp`, `__pycache__`, `vendor`, and all hidden files/directories

Generated on: 2025-08-21 00:08:14
