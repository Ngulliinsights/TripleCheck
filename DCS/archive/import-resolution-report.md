# Import Resolution Report

**Generated:** 12/20/2025, 7:15:52 AM
**Mode:** Dry Run

## 📊 Summary

| Metric | Value |
|:-------|------:|
| Files Scanned | 1158 |
| Total Imports | 4335 |
| Broken Imports | 1432 |
| Fixes Attempted | 10 |
| Fixes Successful | 10 |
| Fixes Failed | 1422 |
| Success Rate | 100% |

## ✅ Applied Fixes (10)

### `generate-structure.mjs`

- **Old:** `fs/promises`
- **New:** `./scripts/cleanup-redundancies`
- **Confidence:** 100%
- **Reasons:** exports all symbols (default)

### `generate-structure.mjs`

- **Old:** `fs`
- **New:** `./scripts/cleanup-redundancies`
- **Confidence:** 100%
- **Reasons:** exports all symbols (default)

### `generate-structure.mjs`

- **Old:** `path`
- **New:** `./scripts/cleanup-redundancies`
- **Confidence:** 100%
- **Reasons:** exports all symbols (default)

### `import-resolver.mjs`

- **Old:** `fs/promises`
- **New:** `./scripts/cleanup-redundancies`
- **Confidence:** 100%
- **Reasons:** exports all symbols (default)

### `import-resolver.mjs`

- **Old:** `fs`
- **New:** `./scripts/cleanup-redundancies`
- **Confidence:** 100%
- **Reasons:** exports all symbols (default)

### `import-resolver.mjs`

- **Old:** `path`
- **New:** `./scripts/cleanup-redundancies`
- **Confidence:** 100%
- **Reasons:** exports all symbols (default)

### `import-validator.mjs`

- **Old:** `fs/promises`
- **New:** `./scripts/cleanup-redundancies`
- **Confidence:** 100%
- **Reasons:** exports all symbols (default)

### `import-validator.mjs`

- **Old:** `fs`
- **New:** `./scripts/cleanup-redundancies`
- **Confidence:** 100%
- **Reasons:** exports all symbols (default)

### `import-validator.mjs`

- **Old:** `path`
- **New:** `./scripts/cleanup-redundancies`
- **Confidence:** 100%
- **Reasons:** exports all symbols (default)

### `scripts\cleanup-redundancies.ts`

- **Old:** `readline`
- **New:** `./aggressive-optimization`
- **Confidence:** 100%
- **Reasons:** exports all symbols (*), same directory, similar path (100%)

## ❌ Unresolved Imports (1422)

These imports could not be automatically resolved:

### `import-resolver.mjs`

- `url`

### `scripts\aggressive-optimization.js`

- `url`

### `scripts\add-reviews.ts`

- `@neondatabase/serverless`

### `scripts\analyze-hooks.js`

- `url`

### `scripts\api-race-condition-detector.ts`

- `crypto`

### `scripts\check-reviews-table.ts`

- `@neondatabase/serverless`

### `scripts\check-data.ts`

- `@neondatabase/serverless`

### `scripts\check-table-structure.ts`

- `@neondatabase/serverless`

### `scripts\cleanup-redundancies.ts`

- `fs`
- `path`
- `url`
- `../components/${componentName}`

### `scripts\create-favicon-pngs.js`

- `url`

### `scripts\create-png-favicons.js`

- `url`

### `scripts\debug\stop-infinite-queries.ts`

- `fs`
- `path`

### `scripts\debug-blank-page.ts`

- `child_process`
- `fs`
- `path`

### `scripts\debug-vercel-deployment.ts`

- `child_process`
- `fs`
- `path`

### `scripts\deploy-render.js`

- `child_process`

### `scripts\deploy-minimal.js`

- `url`

### `scripts\deploy-setup.ts`

- `child_process`

### `scripts\deploy-staging-final.cjs`

- `child_process`
- `fs`
- `perf_hooks`

### `scripts\deploy-staging-simple.cjs`

- `child_process`
- `fs`

### `scripts\deployment\deploy-production.ts`

- `child_process`
- `fs`

### `scripts\deployment\deploy-staging.ts`

- `child_process`
- `fs`
- `path`

### `scripts\deployment\deployment-tests.ts`

- `perf_hooks`

### `scripts\deployment\setup-comprehensive-monitoring.ts`

- `child_process`
- `fs`

### `scripts\deployment\setup-monitoring.ts`

- `child_process`
- `fs`

### `scripts\emergency-stop.js`

- `child_process`

### `scripts\detect-bugs.ts`

- `fs`

### `scripts\execute-optimization.ts`

- `child_process`

### `scripts\extract-api-core.js`

- `url`

### `scripts\fix-authentication-issues.ts`

- `child_process`
- `fs`
- `path`
- `@testing-library/react`
- `react`
- `@tanstack/react-query`
- `express`

### `scripts\fix-core-import-paths.ts`

- `fs`
- `path`

### `scripts\fix-typescript-errors.ts`

- `child_process`
- `fs`
- `path`

### `scripts\fix-image-test-issues.ts`

- `child_process`
- `fs`

### `scripts\generate-favicons.js`

- `fs`
- `path`

### `scripts\generate-test-chunks.ts`

- `fs`
- `../config/vitest/chunk-generator`

### `scripts\health-check.ts`

- `perf_hooks`
- `fs`
- `fs/promises`

### `scripts\implement-optimizations.js`

- `url`
- `react`
- `./shared/components/lazy/LazyComponents`
- `../pages/FindProfessionals`
- `../../property/pages/PropertyWizard`
- `../../property/pages/PropertyDetails`
- `../../trust/pages/TrustDashboard`
- `./HeavyComponent`

### `scripts\load-data-corrected.ts`

- `@neondatabase/serverless`

### `scripts\load-data-fixed.ts`

- `@neondatabase/serverless`
- `drizzle-orm/neon-http`

### `scripts\load-test-simple.cjs`

- `http`
- `perf_hooks`
- `fs`

### `scripts\load-data-simple.ts`

- `@neondatabase/serverless`
- `drizzle-orm/neon-http`

### `scripts\load-test.js`

- `k6`
- `k6/metrics`

### `scripts\migrate-core-utilities.ts`

- `fs`
- `path`
- `glob`
- `../core/src/validation`
- `@triplecheck/core/config`

### `scripts\migrate-database-structure.ts`

- `child_process`
- `fs`
- `path`
- `url`
- `server/infrastructure/database/`

### `scripts\migrate-embedded-tests.ts`

- `fs`
- `glob`

### `scripts\migrate-to-core-utilities.ts`

- `glob`

### `scripts\migrate-schema-imports.ts`

- `fs`
- `path`

### `scripts\migrate-hooks.js`

- `fs`
- `path`
- `child_process`

### `scripts\migration-helpers\config-migration.ts`

- `fs`
- `@triplecheck/core/config`
- `@triplecheck/core/config`

### `scripts\migration-helpers\cache-migration.ts`

- `fs`
- `../../core/src/utils/migration`
- `@triplecheck/core/config`

### `scripts\migration-helpers\middleware-migration.ts`

- `fs`
- `@triplecheck/core/middleware`
- `@triplecheck/core/middleware`

### `scripts\optimize-for-deployment.js`

- `url`

### `scripts\OptimizedBuildPipeline.ts`

- `child_process`
- `fs`
- `crypto`
- `perf_hooks`
- `glob`

### `scripts\prepare-deployment.ts`

- `child_process`
- `fs`
- `path`
- `perf_hooks`

### `scripts\quick-migration-check.ts`

- `path`
- `fs`

### `scripts\quick-recovery.ts`

- `@neondatabase/serverless`
- `drizzle-orm/neon-http`

### `scripts\remove-redundant-utilities.ts`

- `fs`
- `path`

### `scripts\responsive-design-analyzer.js`

- `fs`
- `path`

### `scripts\real-optimization.js`

- `url`

### `scripts\restart-dev-server.ts`

- `child_process`

### `scripts\run-accessibility-tests.js`

- `child_process`

### `scripts\run-chunked-tests.ts`

- `child_process`
- `path`

### `scripts\run-e2e-tests.js`

- `child_process`
- `path`
- `http`

### `scripts\run-complete-load-test.cjs`

- `child_process`
- `fs`
- `http`

### `scripts\run-land-verification-migration.ts`

- `child_process`
- `fs`

### `scripts\run-migration.ts`

- `fs`
- `path`
- `glob`

### `scripts\run-visual-tests.js`

- `child_process`
- `fs`
- `path`
- `http`

### `scripts\security\bug-categorization.ts`

- `child_process`

### `scripts\self-monitoring-pipeline.ts`

- `url`
- `@neondatabase/serverless`
- `drizzle-orm`
- `drizzle-orm/neon-http`
- `../shared/schema`

### `scripts\simple-server-test.cjs`

- `http`
- `fs`

### `scripts\stop-infinite-queries.ts`

- `crypto`
- `perf_hooks`

### `scripts\test-frontend-functionality.ts`

- `child_process`
- `timers/promises`

### `scripts\test-deployment-readiness.cjs`

- `child_process`

### `scripts\streaming-json-processor.ts`

- `fs`
- `stream`
- `stream/promises`
- `fs/promises`

### `scripts\test-image-components.ts`

- `child_process`
- `fs`

### `scripts\test-navigation.ts`

- `child_process`
- `timers/promises`

### `scripts\test-server-connection.cjs`

- `http`

### `scripts\update-core-imports.ts`

- `fs`
- `path`
- `../core/src/logging`
- `../core/src/validation`
- `../core/src/validation`
- `../core/src/validation`
- `../core/src/error-handling`

### `scripts\test-server-ports.js`

- `child_process`
- `path`
- `url`

### `scripts\update-database-paths.cjs`

- `child_process`
- `fs`
- `path`
- `server/infrastructure/database/`
- `./server/infrastructure/database/`

### `scripts\validate-authentication.ts`

- `child_process`
- `fs`
- `path`

### `scripts\validate-database-paths.ts`

- `fs`
- `path`

### `scripts\validate-database-structure.cjs`

- `child_process`
- `fs`
- `path`

### `scripts\validate-database-structure.js`

- `child_process`
- `fs`
- `path`

### `scripts\validate-database-structure.ts`

- `child_process`
- `fs`
- `path`
- `url`

### `scripts\validate-deployment-current.cjs`

- `child_process`
- `fs`
- `perf_hooks`

### `scripts\validate-deployment.cjs`

- `child_process`
- `fs`

### `scripts\validate-image-tests.ts`

- `fs`

### `scripts\validate-migration.ts`

- `path`
- `fs`
- `../core/src/validation/migration-validator`

### `scripts\validate-production.ts`

- `child_process`
- `fs`
- `path`

### `scripts\validate-staging-final.cjs`

- `fs`

### `scripts\verify-optimization.ts`

- `child_process`

### `server\ai\ai.controller.ts`

- `express`

### `server\ai\community-trust-ai-root.ts`

- `@google/generative-ai`

### `server\ai\community-trust-ai.ts`

- `@google/generative-ai`

### `server\ai\middleware\ai-cache.ts`

- `../../../core/src/rate-limiting/metrics`

### `server\ai\middleware\ai-deduplication.ts`

- `express`
- `../../../core/src/rate-limiting/metrics`

### `server\ai\middleware\ai-middleware.ts`

- `express`
- `../../../core/src/rate-limiting/metrics`
- `uuid`

### `server\ai\ml-business.service.ts`

- `openai`
- `@google/generative-ai`

### `server\ai\ml-training-root.ts`

- `../services/ai-ml-service`

### `server\ai\ml-training.test.ts`

- `./ai-ml-service`

### `server\ai\ml-training.ts`

- `../services/ai-ml-service`

### `server\analytics\analytics-business.service.ts`

- `drizzle-orm`

### `server\analytics\analytics.controller.ts`

- `express`
- `zod`

### `server\app.ts`

- `express`

### `server\auth\auth.controller.ts`

- `express`

### `server\auth\AuthenticationService.ts`

- `express`

### `server\auth\auth.service.ts`

- `jsonwebtoken`
- `express`

### `server\b2b\b2b.controller.ts`

- `express`

### `server\communication\communication.controller.ts`

- `express`
- `zod`

### `server\communication\communication-business.service.ts`

- `drizzle-orm`

### `server\communication\messages.controller.ts`

- `express`

### `server\communication\messaging.controller.ts`

- `express`
- `zod`

### `server\communication\messaging.service.ts`

- `events`

### `server\communication\notifications.controller.ts`

- `express`

### `server\communication\notification-business.service.ts`

- `http`
- `url`
- `ws`

### `server\communication\notification.service.ts`

- `http`
- `url`
- `ws`

### `server\community\community.controller.ts`

- `express`

### `server\communication\websocket.service.ts`

- `ws`
- `http`

### `server\community\intelligence.service.ts`

- `drizzle-orm`

### `server\community\resources.service.ts`

- `drizzle-orm`

### `server\config\environment-schema.ts`

- `zod`

### `server\document-auth\analyzers\ContentAnalyzer.ts`

- `pdf-lib`

### `server\config\ports.ts`

- `net`

### `server\document-auth\analyzers\LandDocumentAnalyzer.ts`

- `pdf-lib`

### `server\document-auth\analyzers\MetadataAnalyzer.ts`

- `pdf-lib`

### `server\document-auth\analyzers\MLDocumentAnalyzer.ts`

- `crypto`

### `server\document-auth\analyzers\VisualAnalyzer.ts`

- `crypto`

### `server\document-auth\analyzers\SignatureAnalyzer.ts`

- `pdf-lib`

### `server\document-auth\core\DocumentAuthEngine.ts`

- `events`
- `../ml/ForgeryDetector`
- `../ml/MLDocumentClassifier`

### `server\document-auth\DocumentAuthService.ts`

- `events`

### `server\fraud-detection\alerts.controller.ts`

- `express`
- `zod`

### `server\fraud-detection\api\FraudDetectionAPI.ts`

- `express`

### `server\fraud-detection\core\FraudDetectionEngine.ts`

- `events`
- `../analytics/MLAnalyticsEngine`
- `../analytics/NetworkAnalysisService`

### `server\fraud-detection\integrate-real-data.ts`

- `url`
- `@neondatabase/serverless`
- `drizzle-orm`
- `drizzle-orm/neon-http`

### `server\fraud-detection\intelligence.service.ts`

- `drizzle-orm`

### `server\fraud-detection\services\CaseManagementService.ts`

- `events`

### `server\fraud-detection\services\ComplianceReportingService.ts`

- `events`

### `server\fraud-detection\test-system.js`

- `url`

### `server\fraud-detection\tests\global-setup.ts`

- `child_process`

### `server\fraud-detection\tests\run-tests.ts`

- `child_process`

### `server\fraud-detection\tests\setup.ts`

- `@jest/globals`

### `server\fraud-detection\validate-backend.js`

- `url`

### `server\index.ts`

- `http`
- `express`
- `./community-trust-routes`
- `./secure-document-routes`
- `./services/notification-service`

### `server\infrastructure\cache\UnifiedCacheManager.ts`

- `crypto`

### `server\infrastructure\database\config\database.config.ts`

- `zod`

### `server\infrastructure\database\connection\DatabaseCircuitBreaker.ts`

- `events`

### `server\infrastructure\database\connection\index.ts`

- `events`
- `drizzle-orm/postgres-js`

### `server\infrastructure\database\connection\ProductionConnectionPool.ts`

- `events`
- `pg`

### `server\infrastructure\database\connection\production-pool.ts`

- `events`

### `server\infrastructure\database\data-generation\cli\demo-scenario-cli.ts`

- `fs/promises`

### `server\infrastructure\database\data-generation\cli\unified-data-generation.ts`

- `child_process`

### `server\infrastructure\database\data-generation\core\UnifiedDataGenerator.ts`

- `child_process`
- `perf_hooks`

### `server\infrastructure\database\data-generation\examples\demo-generation-example.ts`

- `fs/promises`
- `path`

### `server\infrastructure\database\data-generation\generators\python\runner.ts`

- `child_process`

### `server\infrastructure\database\data-generation\scenarios\demo-data-validator.ts`

- `fs/promises`

### `server\infrastructure\database\data-generation\scenarios\production-demo-generator.ts`

- `perf_hooks`

### `server\infrastructure\database\data-generation\scenarios\scenario-generator.ts`

- `crypto`
- `fs/promises`

### `server\infrastructure\database\deployment\deployment-cli.ts`

- `pg`
- `fs/promises`

### `server\infrastructure\database\deployment\deployment-utils.ts`

- `pg`

### `server\infrastructure\database\deployment\DeploymentValidator.ts`

- `events`
- `pg`

### `server\infrastructure\database\deployment\BlueGreenDeploymentManager.ts`

- `events`
- `pg`

### `server\infrastructure\database\deployment\examples\complete-deployment-example.ts`

- `pg`

### `server\infrastructure\database\deployment\ZeroDowntimeMigrationManager.ts`

- `events`
- `pg`

### `server\infrastructure\database\disaster-recovery\BackupManager.ts`

- `child_process`
- `crypto`
- `events`
- `fs`
- `fs/promises`
- `path`
- `stream/promises`
- `util`
- `zlib`
- `pg`

### `server\infrastructure\database\disaster-recovery\disaster-recovery-cli.ts`

- `fs/promises`
- `path`

### `server\infrastructure\database\disaster-recovery\ComprehensiveDisasterRecovery.ts`

- `child_process`
- `events`
- `fs`
- `fs/promises`
- `path`
- `util`
- `pg`

### `server\infrastructure\database\disaster-recovery\DisasterRecoveryManager.ts`

- `child_process`
- `events`
- `fs`
- `fs/promises`
- `path`
- `util`
- `pg`

### `server\infrastructure\database\health\DatabaseHealthMonitor.ts`

- `events`

### `server\infrastructure\database\health\health-monitor.ts`

- `events`

### `server\infrastructure\database\health\index.ts`

- `events`

### `server\infrastructure\database\integration\integration-cli.ts`

- `pg`
- `fs/promises`

### `server\infrastructure\database\integration\integration-test-runner.ts`

- `pg`
- `fs/promises`

### `server\infrastructure\database\integration\ProductionReadinessAssessment.ts`

- `events`
- `pg`
- `fs`
- `fs/promises`

### `server\infrastructure\database\integration\simple-assessment.cjs`

- `pg`

### `server\infrastructure\database\integration\run-production-assessment.ts`

- `pg`

### `server\infrastructure\database\integration\SystemIntegrationValidator.ts`

- `events`
- `pg`
- `fs/promises`

### `server\infrastructure\database\migrations\index.ts`

- `pg`

### `server\infrastructure\database\migrations\migration-cli.ts`

- `pg`

### `server\infrastructure\database\migrations\migration-executor.ts`

- `pg`

### `server\infrastructure\database\migrations\migration-loader.ts`

- `crypto`
- `fs`
- `fs/promises`
- `path`

### `server\infrastructure\database\migrations\migration-manager.ts`

- `fs`
- `fs/promises`
- `path`
- `pg`
- `crypto`

### `server\infrastructure\database\migrations\update-package-scripts.ts`

- `fs/promises`
- `path`

### `server\infrastructure\database\performance\LoadTestingFramework.ts`

- `events`
- `pg`
- `worker_threads`

### `server\infrastructure\database\performance\performance-cli.ts`

- `pg`

### `server\infrastructure\database\performance\PerformanceCertificationSystem.ts`

- `events`
- `pg`
- `fs`
- `fs/promises`

### `server\infrastructure\database\performance\PerformanceMonitoringDashboard.ts`

- `events`
- `pg`
- `fs`

### `server\infrastructure\database\QueryOptimizer.ts`

- `drizzle-orm`

### `server\infrastructure\database\replication\ReplicationManager.ts`

- `events`
- `pg`

### `server\infrastructure\database\replication\FailoverManager.ts`

- `child_process`
- `events`
- `fs`

### `server\infrastructure\database\replication\setup-ha.ts`

- `child_process`
- `fs`

### `server\infrastructure\database\schemas\communication\index.ts`

- `drizzle-orm`
- `drizzle-orm/pg-core`
- `drizzle-zod`
- `zod`

### `server\infrastructure\database\schemas\consolidated.ts`

- `./analytics`

### `server\infrastructure\database\schemas\core\index.ts`

- `drizzle-orm`
- `drizzle-orm/pg-core`
- `drizzle-zod`
- `zod`

### `server\infrastructure\database\schemas\fraud\index.ts`

- `drizzle-orm`
- `drizzle-orm/pg-core`
- `drizzle-zod`
- `zod`

### `server\infrastructure\database\schemas\trust\index.ts`

- `drizzle-orm`
- `drizzle-orm/pg-core`
- `drizzle-zod`
- `zod`

### `server\infrastructure\database\schemas\index.ts`

- `./analytics`

### `server\infrastructure\database\scripts\cleanup-redundant-files.ts`

- `fs`

### `server\infrastructure\database\schemas\verification\index.ts`

- `drizzle-orm`
- `drizzle-orm/pg-core`
- `drizzle-zod`
- `zod`

### `server\infrastructure\database\scripts\consolidate-database-infrastructure.ts`

- `child_process`
- `fs`
- `zod`

### `server\infrastructure\database\scripts\consolidate-database-files.ts`

- `fs`
- `fs`
- `glob`

### `server\infrastructure\database\scripts\consolidate-schemas.ts`

- `../migrations/core/consolidate-schemas`

### `server\infrastructure\database\scripts\database-setup\initialize-database.ts`

- `@neondatabase/serverless`
- `drizzle-orm/neon-http`
- `drizzle-orm/neon-http/migrator`

### `server\infrastructure\database\scripts\data-pipeline.ts`

- `child_process`
- `url`
- `@neondatabase/serverless`
- `drizzle-orm`
- `drizzle-orm/neon-http`
- `../src/shared/schema`

### `server\infrastructure\database\scripts\deploy-land-verification.ts`

- `child_process`
- `fs`

### `server\infrastructure\database\scripts\deploy.ts`

- `child_process`
- `fs`
- `@neondatabase/serverless`
- `drizzle-orm/neon-http`
- `../src/shared/schema`

### `server\infrastructure\database\scripts\execute-production-deployment.ts`

- `pg`
- `fs/promises`

### `server\infrastructure\database\scripts\load-data.ts`

- `@neondatabase/serverless`

### `server\infrastructure\database\scripts\remove-empty-dirs.ts`

- `fs`

### `server\infrastructure\database\scripts\reset.ts`

- `../server/infrastructure/database/connection`

### `server\infrastructure\database\scripts\run-disaster-recovery-test.ts`

- `pg`
- `fs/promises`

### `server\infrastructure\database\scripts\run-performance-certification.ts`

- `pg`

### `server\infrastructure\database\scripts\run-security-validation.ts`

- `pg`
- `fs/promises`

### `server\infrastructure\database\scripts\run-production-readiness-assessment.ts`

- `pg`

### `server\infrastructure\database\scripts\setup-database.ts`

- `@neondatabase/serverless`
- `drizzle-orm/neon-http`
- `drizzle-orm/neon-http/migrator`
- `../src/shared/schema`

### `server\infrastructure\database\scripts\status.ts`

- `@neondatabase/serverless`

### `server\infrastructure\database\scripts\test-connection.ts`

- `@neondatabase/serverless`

### `server\infrastructure\database\scripts\unified-data-generation.ts`

- `child_process`

### `server\infrastructure\database\scripts\validate-consolidation.ts`

- `child_process`
- `fs`

### `server\infrastructure\database\security\ComplianceManager.ts`

- `crypto`
- `events`
- `pg`

### `server\infrastructure\database\scripts\validate.ts`

- `@neondatabase/serverless`
- `drizzle-orm/neon-http`

### `server\infrastructure\database\security\security-cli.ts`

- `pg`

### `server\infrastructure\database\security\SecurityMonitor.ts`

- `crypto`
- `events`
- `pg`

### `server\infrastructure\database\security\SecurityReporting.ts`

- `crypto`
- `fs/promises`
- `path`
- `pg`

### `server\infrastructure\database\security\SecuritySystem.ts`

- `events`
- `pg`

### `server\infrastructure\database\security\VulnerabilityScanner.ts`

- `child_process`
- `events`
- `fs`
- `fs/promises`
- `path`
- `util`

### `server\infrastructure\database\seeds\generators\checkpoint-manager.ts`

- `url`

### `server\infrastructure\database\seeds\generators\integrate-data.ts`

- `child_process`

### `server\infrastructure\database\seeds\generators\KenyanDataGenerator.ts`

- `@faker-js/faker`

### `server\infrastructure\database\seeds\land-verification-system.ts`

- `@neondatabase/serverless`
- `dotenv`
- `drizzle-orm/neon-http`

### `server\infrastructure\database\seeds\land-verification.ts`

- `@neondatabase/serverless`

### `server\infrastructure\database\seeds\UnifiedDataGenerator.ts`

- `child_process`
- `perf_hooks`

### `server\infrastructure\database\service.ts`

- `drizzle-orm/postgres-js`

### `server\infrastructure\database\seeds\seed-kenya-properties.ts`

- `@neondatabase/serverless`
- `dotenv`
- `drizzle-orm/neon-http`

### `server\infrastructure\database\utils\generators\index.ts`

- `@faker-js/faker`
- `zod`

### `server\infrastructure\database\utils\generators\unified-generator.ts`

- `child_process`
- `url`

### `server\infrastructure\database\utils\migration-tools\database-manager.ts`

- `@neondatabase/serverless`
- `drizzle-orm`
- `drizzle-orm/neon-http`
- `../../src/shared/schema`

### `server\infrastructure\database\utils\migration-tools\fix-database.ts`

- `@neondatabase/serverless`
- `drizzle-orm/neon-http`
- `../shared/schema`

### `server\infrastructure\database\utils\migration-tools\generate-test-chunks.ts`

- `fs`
- `path`
- `child_process`
- `path`

### `server\infrastructure\database\utils\migration-tools\inspect-schema.ts`

- `@neondatabase/serverless`

### `server\infrastructure\database\utils\migration-tools\migrate-existing-properties.ts`

- `@neondatabase/serverless`
- `dotenv`
- `drizzle-orm`
- `drizzle-orm/neon-http`

### `server\infrastructure\database\utils\migration-tools\quality-gates.ts`

- `./code-analysis.js`

### `server\infrastructure\database\utils\migration-tools\robust-batch-loader.ts`

- `@neondatabase/serverless`
- `drizzle-orm/neon-http`
- `crypto`

### `server\infrastructure\database\utils\migration-tools\rollback-migration.ts`

- `@neondatabase/serverless`
- `dotenv`
- `drizzle-orm`
- `drizzle-orm/neon-http`

### `server\infrastructure\database\utils\migration-tools\run-migration.ts`

- `dotenv`
- `./test-migration`

### `server\infrastructure\database\utils\migration-tools\validate-migration.ts`

- `@neondatabase/serverless`
- `dotenv`
- `drizzle-orm`
- `drizzle-orm/neon-http`

### `server\infrastructure\database\utils\QueryOptimizer.ts`

- `drizzle-orm`

### `server\infrastructure\deduplication\RequestDeduplicator.ts`

- `crypto`
- `perf_hooks`

### `server\infrastructure\email\email.service.ts`

- `nodemailer`
- `@sendgrid/mail`

### `server\infrastructure\monitoring\AlertingSystem.ts`

- `events`
- `nodemailer`
- `twilio`

### `server\infrastructure\events\EventBus.ts`

- `events`

### `server\infrastructure\monitoring\BuildPerformanceMonitor.ts`

- `perf_hooks`

### `server\infrastructure\monitoring\CachePerformanceMonitor.ts`

- `crypto`

### `server\infrastructure\monitoring\index.ts`

- `express`

### `server\infrastructure\monitoring\MonitoringDashboard.ts`

- `events`

### `server\infrastructure\monitoring\ObservabilitySystem.ts`

- `events`
- `prom-client`

### `server\infrastructure\monitoring\PerformanceMonitor.ts`

- `events`

### `server\infrastructure\monitoring\PrometheusMetrics.ts`

- `express`

### `server\infrastructure\optimization\BundleOptimizer.ts`

- `fs`
- `zlib`
- `glob`

### `server\infrastructure\rate-limiting\ApiCallTracker.ts`

- `crypto`

### `server\infrastructure\optimization\PerformanceOptimizer.ts`

- `events`

### `server\infrastructure\storage\file.storage.ts`

- `@neondatabase/serverless`
- `@shared/schema`
- `drizzle-orm`
- `drizzle-orm/neon-http`

### `server\infrastructure\storage\file-storage.service.ts`

- `cloudinary`

### `server\infrastructure\storage\SecureFileUploadService.ts`

- `stream/promises`
- `fs`

### `server\infrastructure\versioning\ApiDocumentation.ts`

- `express`

### `server\infrastructure\storage\storage.ts`

- `@neondatabase/serverless`
- `drizzle-orm`
- `drizzle-orm/neon-http`

### `server\infrastructure\versioning\ApiVersioningMiddleware.ts`

- `express`

### `server\infrastructure\testing\TestFramework.ts`

- `events`

### `server\infrastructure\versioning\ApiVersioning.ts`

- `express`

### `server\infrastructure\versioning\ApiVersionManager.ts`

- `express`

### `server\infrastructure\versioning\index.ts`

- `express`

### `server\infrastructure\versioning\examples\client-examples.ts`

- `react`

### `server\infrastructure\versioning\versioning.middleware.ts`

- `express`

### `server\land-verification\CommunityIntelligenceService.ts`

- `events`
- `drizzle-orm`

### `server\land-verification\ExpertCoordinationService.ts`

- `events`
- `drizzle-orm`

### `server\land-verification\health\HealthCheckService.ts`

- `drizzle-orm`
- `express`

### `server\land-verification\integration.test.ts`

- `../db`

### `server\land-verification\LandVerificationService.test.ts`

- `events`
- `../db`

### `server\land-verification\LandVerificationService.ts`

- `events`
- `drizzle-orm`

### `server\land-verification\middleware\auth.middleware.ts`

- `drizzle-orm`
- `express`

### `server\land-verification\monitoring\AlertingService.ts`

- `events`

### `server\land-verification\monitoring\MetricsService.ts`

- `perf_hooks`
- `express`

### `server\land-verification\middleware\validation.middleware.ts`

- `express`
- `zod`

### `server\land-verification\MonitoringService.ts`

- `events`
- `drizzle-orm`

### `server\land-verification\performance\AsyncProcessor.ts`

- `events`

### `server\land-verification\performance\DatabaseOptimizer.ts`

- `drizzle-orm`

### `server\land-verification\performance\PerformanceManager.ts`

- `events`

### `server\land-verification\PhysicalVerificationService.ts`

- `events`

### `server\land-verification\RiskAssessmentService.ts`

- `events`
- `drizzle-orm`

### `server\land-verification\security\AccessControlService.ts`

- `drizzle-orm`
- `express`

### `server\land-verification\security\AuditLogger.ts`

- `drizzle-orm`

### `server\land-verification\security\SecurityIntegration.ts`

- `express`

### `server\middleware\auth.middleware.ts`

- `express`
- `zod`
- `@shared/schema`

### `server\land-verification\verification-business.service.ts`

- `./ai-ml-service`

### `server\main.ts`

- `http`
- `url`

### `server\middleware\cache.middleware.ts`

- `express`
- `crypto`

### `server\middleware\deduplication.middleware.ts`

- `express`
- `crypto`

### `server\middleware\error.ts`

- `express`

### `server\middleware\data-validation.ts`

- `express`
- `zod`

### `server\middleware\rate-limiting.middleware.ts`

- `express`

### `server\middleware\logging.middleware.ts`

- `express`

### `server\middleware\query-limiter.middleware.ts`

- `perf_hooks`
- `express`

### `server\middleware\validation.middleware.ts`

- `express`
- `zod`

### `server\middleware\UnifiedSecurityMiddleware.ts`

- `express`
- `zod`

### `server\ml-core\fraud-detection\AdvancedFraudDetectionEngine.ts`

- `events`

### `server\ml-core\infrastructure\ModelRegistry.ts`

- `events`

### `server\ml-core\orchestration\MLOrchestrationService.ts`

- `events`

### `server\ml-core\property-valuation\AutomatedValuationModel.ts`

- `events`

### `server\ml-core\trust-intelligence\CommunityTrustEngine.ts`

- `events`

### `server\monitoring\health.controller.ts`

- `express`
- `os`

### `server\ml-core\training\ContinuousLearningPipeline.ts`

- `events`

### `server\monitoring\HealthMonitor.ts`

- `express`
- `fs`

### `server\monitoring\monitoring.controller.ts`

- `express`

### `server\monitoring\StructuredLogger.ts`

- `perf_hooks`
- `express`
- `os`

### `server\payments\mpesa.service.ts`

- `crypto`
- `axios`

### `server\property\enhancements.controller.ts`

- `drizzle-orm`
- `express`
- `zod`

### `server\professionals\professional.service.ts`

- `drizzle-orm`

### `server\professionals\professionals.controller.ts`

- `express`
- `zod`

### `server\property\property-business.service.ts`

- `zod`

### `server\property\property-land-verification.test.ts`

- `../lib/database`

### `server\property\property-e2e-integration.test.ts`

- `../lib/database`

### `server\property\property-repository-integration.test.ts`

- `../lib/database`

### `server\property\property.controller.ts`

- `crypto`
- `express`

### `server\property\property.repository.ts`

- `drizzle-orm`
- `drizzle-orm/node-postgres`

### `server\reviews\review.service.ts`

- `zod`

### `server\search\search-business.controller.ts`

- `express`
- `zod`

### `server\search\search.controller.ts`

- `express`
- `zod`

### `server\security\SecurityHardening.ts`

- `express`
- `qs`

### `server\simple-dev-server.ts`

- `url`

### `server\test-critical-services.ts`

- `./services/ai-ml-service`
- `./services/email-service`
- `./services/file-storage-service`
- `./services/mpesa-service-enhanced`

### `server\test-email-service.ts`

- `./services/email-service`

### `server\test-integration.ts`

- `express`

### `server\tests\ai-integration-validation.test.ts`

- `perf_hooks`
- `../ai/ai.service`
- `../services/VerificationService`

### `server\tests\api-bug-fixes.ts`

- `express`
- `zod`

### `server\tests\backend-api-comprehensive.test.ts`

- `perf_hooks`
- `express`
- `cors`

### `server\tests\e2e\land-verification-workflow.test.ts`

- `playwright`
- `http`

### `server\tests\auth\AuthenticationService.test.ts`

- `../../storage`

### `server\tests\comprehensive-validation.test.ts`

- `perf_hooks`
- `../middleware/error.middleware`
- `../services/AuthService`
- `../services/PropertyService`
- `../services/VerificationService`

### `server\tests\file-upload-validation.test.ts`

- `perf_hooks`

### `server\tests\integration\land-verification-system.test.ts`

- `../../lib/database`

### `server\tests\load-test-validation.ts`

- `perf_hooks`
- `url`
- `path`
- `fs`

### `server\tests\load-test.ts`

- `fs`
- `path`

### `server\tests\performance\land-verification-load.test.ts`

- `perf_hooks`
- `../../lib/database`

### `server\tests\performance-validation.test.ts`

- `perf_hooks`
- `events`
- `../middleware/error.middleware`

### `server\tests\run-api-tests.ts`

- `child_process`
- `path`
- `url`
- `./manual-api-validation`
- `../middleware/error.middleware`
- `fs/promises`

### `server\tests\performance\load.test.ts`

- `perf_hooks`

### `server\tests\run-compatibility-tests.ts`

- `child_process`

### `server\tests\run-final-integration-tests.ts`

- `child_process`
- `fs`
- `perf_hooks`
- `../lib/database`

### `server\tests\security\land-verification-security.test.ts`

- `../../lib/database`

### `server\tests\run-validation-tests.ts`

- `perf_hooks`

### `server\tests\security\SecurityHardening.test.ts`

- `express`

### `server\tests\validate-system-integration.ts`

- `fs`

### `server\trust\community-trust.service.ts`

- `@google/generative-ai`

### `server\trust\integration.controller.ts`

- `express`
- `zod`

### `server\trust\integration.service.ts`

- `drizzle-orm`

### `server\trust\trust.controller.ts`

- `express`

### `server\trust\TrustScoringService.ts`

- `events`

### `server\trust\verification.controller.ts`

- `express`
- `zod`

### `server\types\auth-constants.ts`

- `@core/error-handling/base-error`

### `server\types\auth.types.ts`

- `express`

### `server\types\review.types.ts`

- `zod`

### `server\types\property.types.ts`

- `zod`

### `server\user\dashboard.controller.ts`

- `drizzle-orm`
- `express`
- `zod`

### `server\user\user.controller.ts`

- `express`

### `server\utils\response-helpers.ts`

- `express`

### `server\vite.ts`

- `http`
- `path`
- `url`
- `express`
- `nanoid`

### `src\analytics\components\AnalyticsDashboard.tsx`

- `lucide-react`
- `recharts`

### `src\analytics\hooks\useAnalytics.ts`

- `@tanstack/react-query`

### `src\app\App.tsx`

- `react`

### `src\app\error-boundary.tsx`

- `lucide-react`
- `react`

### `src\app\providers.tsx`

- `react`

### `src\auth\components\PasswordReset.tsx`

- `@hookform/resolvers/zod`
- `lucide-react`
- `react`
- `react-hook-form`
- `react-router-dom`
- `zod`

### `src\auth\components\LoginForm.tsx`

- `@hookform/resolvers/zod`
- `@simplewebauthn/browser`
- `lucide-react`
- `react`
- `react-hook-form`
- `zod`

### `src\auth\components\RegistrationWizard.tsx`

- `@hookform/resolvers/zod`
- `lucide-react`
- `react`
- `react-hook-form`
- `zod`

### `src\auth\components\TwoFactorAuth.tsx`

- `@hookform/resolvers/zod`
- `lucide-react`
- `qrcode.react`
- `react`
- `react-hook-form`
- `zod`

### `src\auth\contexts\AuthContext.tsx`

- `react`

### `src\auth\hooks\useAuth.ts`

- `@tanstack/react-query`

### `src\auth\pages\ForgotPassword.tsx`

- `react`
- `lucide-react`
- `react-router-dom`

### `src\auth\pages\Login.tsx`

- `react-router-dom`

### `src\auth\pages\Register.tsx`

- `react-router-dom`

### `src\communication\components\MessageComposer.tsx`

- `lucide-react`
- `react`

### `src\communication\components\MessageList.tsx`

- `date-fns`
- `lucide-react`

### `src\communication\components\MessageThread.tsx`

- `react`
- `lucide-react`

### `src\communication\components\NotificationCenter.tsx`

- `react`
- `lucide-react`

### `src\communication\components\RealTimeNotifications.tsx`

- `lucide-react`
- `react`

### `src\communication\context\CommunicationContext.tsx`

- `react`

### `src\communication\hooks\useMessages.ts`

- `@tanstack/react-query`

### `src\communication\hooks\useMessaging.ts`

- `react`
- `@tanstack/react-query`

### `src\communication\hooks\useNotifications.ts`

- `react`
- `@tanstack/react-query`

### `src\communication\pages\MessageCenter.tsx`

- `react`
- `lucide-react`

### `src\communication\pages\Notifications.tsx`

- `react`
- `lucide-react`

### `src\communication\pages\Inbox.tsx`

- `@tanstack/react-query`
- `lucide-react`
- `react`
- `react-router-dom`

### `src\communication\services\communication-business-logic.ts`

- `zod`

### `src\infrastructure\ai\AIModelManager.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\infrastructure\api\data-validation.ts`

- `zod`

### `src\infrastructure\api\queryClient.ts`

- `@tanstack/react-query`

### `src\infrastructure\audit\EnhancedAuditRunner.ts`

- `events`

### `src\infrastructure\audit\index.ts`

- `./RouteAnalyzer.js`

### `src\infrastructure\audit\LinkValidator.ts`

- `@babel/parser`

### `src\components\ai\HuggingFaceTestPanel.tsx`

- `react`

### `src\infrastructure\cache\query-cache.ts`

- `@tanstack/react-query`

### `src\infrastructure\hooks\examples\race-condition-prevention.tsx`

- `react`

### `src\infrastructure\hooks\useCleanupManager.ts`

- `react`

### `src\infrastructure\hooks\useCoordinatedState.ts`

- `react`

### `src\infrastructure\audit\UIAuditSystem.ts`

- `react`
- `events`
- `./Header`
- `./Layout`

### `src\infrastructure\hooks\useIntersectionObserver.ts`

- `react`

### `src\infrastructure\hooks\useSafeEffect.ts`

- `react`

### `src\infrastructure\hooks\useSafeState.ts`

- `react`

### `src\infrastructure\hooks\useStableCallback.ts`

- `react`

### `src\infrastructure\monitoring\query-monitor.ts`

- `@tanstack/react-query`

### `src\infrastructure\monitoring\PerformanceMonitoringProvider.tsx`

- `react`

### `src\infrastructure\monitoring\system-health.ts`

- `../../shared/utils/error-handling`

### `src\infrastructure\monitoring\usePerformanceMonitoring.ts`

- `react`

### `src\infrastructure\payments\PaymentSystemInterface.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\land-verification\components\CommunityInterviewTemplate.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\land-verification\components\ContextualGuidanceProvider.tsx`

- `lucide-react`
- `react`

### `src\land-verification\components\DecisionSupportTool.tsx`

- `lucide-react`
- `react`

### `src\land-verification\components\ExpertCoordinationInterface.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\land-verification\components\HelpSystem.tsx`

- `lucide-react`
- `react`

### `src\land-verification\components\KenyaLandEducation.tsx`

- `lucide-react`
- `react`

### `src\land-verification\components\ProfessionalResourcesDirectory.tsx`

- `lucide-react`
- `react`

### `src\land-verification\components\LandVerificationDashboard.tsx`

- `lucide-react`
- `react`
- `@/types/land-verification`

### `src\land-verification\components\ReportingPortal.tsx`

- `lucide-react`
- `react`

### `src\land-verification\components\RecommendationEngine.tsx`

- `lucide-react`
- `react`
- `@/types/land-verification`

### `src\land-verification\components\RiskAssessmentDisplay.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\land-verification\components\RiskManagementInterface.tsx`

- `lucide-react`
- `react`
- `@/types/land-verification`

### `src\land-verification\components\RiskFactorAnalysis.tsx`

- `lucide-react`
- `react`
- `@/types/land-verification`

### `src\land-verification\components\RiskProfileVisualization.tsx`

- `lucide-react`
- `react`
- `@/types/land-verification`

### `src\land-verification\components\RiskWeightingControls.tsx`

- `lucide-react`
- `react`
- `@/types/land-verification`

### `src\land-verification\components\ScenarioModelingTool.tsx`

- `lucide-react`
- `react`
- `@/types/land-verification`

### `src\land-verification\components\VerificationProgressTracker.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\land-verification\components\VerificationWizard.tsx`

- `framer-motion`
- `lucide-react`
- `react`
- `react-router-dom`

### `src\land-verification\hooks\useLandVerification.ts`

- `@tanstack/react-query`
- `react`

### `src\land-verification\pages\LandVerificationDashboardPage.tsx`

- `lucide-react`
- `react`
- `react-router-dom`
- `@/types/land-verification`

### `src\land-verification\pages\LandVerificationPage.tsx`

- `react-router-dom`

### `src\main.tsx`

- `@tanstack/react-query`
- `react-router-dom`

### `src\land-verification\pages\NewVerificationPage.tsx`

- `lucide-react`
- `react`
- `react-router-dom`
- `@/types/land-verification`

### `src\monitoring\components\HealthDashboard.tsx`

- `react`
- `lucide-react`

### `src\property\components\CompareBar.tsx`

- `lucide-react`
- `react-router-dom`

### `src\property\components\CompareModal.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\property\components\PerformanceTestPanel.tsx`

- `lucide-react`
- `react`

### `src\property\components\EnhancedLandCard.tsx`

- `lucide-react`
- `react`

### `src\property\components\PropertyCardShowcase.tsx`

- `@tanstack/react-query`
- `react`
- `react-router-dom`
- `react`

### `src\property\components\PropertyMap.tsx`

- `react`
- `@googlemaps/js-api-loader`
- `lucide-react`

### `src\property\components\wizard\config.ts`

- `lucide-react`

### `src\property\components\PropertyTestComponent.tsx`

- `lucide-react`

### `src\property\components\PropertyReviews.tsx`

- `@tanstack/react-query`
- `lucide-react`
- `react`

### `src\property\components\wizard\examples\WizardExamples.tsx`

- `react`

### `src\property\components\wizard\steps\AdaptedFeaturesStep.tsx`

- `react`
- `lucide-react`

### `src\property\components\wizard\steps\AdaptedBasicDetailsStep.tsx`

- `react`

### `src\property\components\wizard\steps\AdaptedImagesStep.tsx`

- `react`
- `lucide-react`

### `src\property\components\wizard\steps\AdaptedPreviewStep.tsx`

- `react`
- `lucide-react`

### `src\property\components\wizard\steps\AdaptedLocationStep.tsx`

- `react`
- `lucide-react`

### `src\property\components\wizard\steps\AdaptedPricingStep.tsx`

- `react`
- `lucide-react`

### `src\property\components\wizard\steps\DocumentationStep.tsx`

- `react`
- `lucide-react`

### `src\property\components\wizard\types.ts`

- `lucide-react`

### `src\property\contexts\PropertyContext.tsx`

- `react`

### `src\property\hooks\useConsolidatedPropertySearch.ts`

- `react`

### `src\property\hooks\useLandProperty.ts`

- `@tanstack/react-query`

### `src\property\hooks\useProperty.ts`

- `@tanstack/react-query`
- `react`

### `src\property\hooks\useUnifiedProperty.ts`

- `@tanstack/react-query`
- `react`

### `src\property\pages\CommercialProperties.tsx`

- `react`

### `src\property\components\wizard\UnifiedPropertyWizard.tsx`

- `react`
- `@tanstack/react-query`
- `lucide-react`

### `src\property\pages\LandRedirect.tsx`

- `react`
- `react-router-dom`

### `src\property\pages\LandDetails.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\property\pages\Lands.tsx`

- `react`

### `src\property\pages\PropertiesResidential.tsx`

- `react`

### `src\property\pages\ListProperty.tsx`

- `@tanstack/react-query`
- `lucide-react`
- `react`

### `src\property\pages\PropertyCompare.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\property\pages\PropertyDetails.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\property\pages\PropertyOptimize.tsx`

- `react`
- `lucide-react`

### `src\property\pages\PropertyPhotos.tsx`

- `@tanstack/react-query`
- `lucide-react`
- `react`

### `src\property\hooks\usePropertySearch.ts`

- `react`

### `src\property\pages\PropertyVerification.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\property\pages\PropertyEdit.tsx`

- `react`
- `react-router-dom`
- `lucide-react`

### `src\property\services\property-validation.ts`

- `zod`

### `src\search\components\ConsolidatedSearch.tsx`

- `lucide-react`
- `react`

### `src\property-hooks-test.tsx`

- `@tanstack/react-query`

### `src\search\components\SearchBar.tsx`

- `lucide-react`
- `react`

### `src\search\components\SearchFilters.tsx`

- `@tanstack/react-query`
- `lucide-react`
- `react`

### `src\search\hooks\useSearch.ts`

- `@tanstack/react-query`
- `react`

### `src\search\pages\AdvancedSearch.tsx`

- `react`
- `lucide-react`

### `src\shared\components\AfricaCoverageMap.tsx`

- `lucide-react`
- `react`

### `src\search\pages\SearchResults.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\components\b2b\B2BCommunityInsightsBanner.tsx`

- `lucide-react`

### `src\shared\components\b2b\B2BContextualPrompt.tsx`

- `lucide-react`

### `src\shared\components\b2b\B2BEntryPointManager.tsx`

- `react`

### `src\shared\components\b2b\B2BCommunityInsightsPrompt.tsx`

- `lucide-react`
- `react`

### `src\shared\components\ai-integration\PropertyAIEnhancement.tsx`

- `react`
- `lucide-react`

### `src\shared\components\b2b\B2BFraudReportBanner.tsx`

- `lucide-react`

### `src\shared\components\b2b\B2BFraudReportPrompt.tsx`

- `lucide-react`
- `react`

### `src\shared\components\b2b\B2BLeadCapture.tsx`

- `lucide-react`
- `react`

### `src\shared\components\b2b\B2BNotificationBanner.tsx`

- `lucide-react`
- `react`

### `src\shared\components\blog\BlogPostCard.tsx`

- `lucide-react`
- `react`

### `src\shared\components\blog\BlogPostSkeleton.tsx`

- `react`

### `src\shared\components\DemoLoginHelper.tsx`

- `lucide-react`
- `react`

### `src\shared\components\CommunityInsights.tsx`

- `lucide-react`
- `react`
- `react-router-dom`
- `@tanstack/react-query`

### `src\shared\components\ErrorBoundary.tsx`

- `react`

### `src\shared\components\examples\EnhancedHooksExample.tsx`

- `lucide-react`
- `react`

### `src\shared\components\fallbacks\NavigationFallback.tsx`

- `lucide-react`

### `src\shared\components\forms\FileUpload.tsx`

- `lucide-react`
- `react`

### `src\shared\components\fallbacks\MobileNavFallback.tsx`

- `lucide-react`
- `react`

### `src\shared\components\EnhancedVirtualizedPropertyList.tsx`

- `react`
- `react-window`

### `src\shared\components\forms\FileUploadField.tsx`

- `react`
- `lucide-react`

### `src\shared\components\forms\FormField.tsx`

- `lucide-react`

### `src\shared\components\hero\EnhancedHero.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\components\images\EnhancedImageShowcase.tsx`

- `lucide-react`
- `react`

### `src\shared\components\hero\ConversionHero.tsx`

- `lucide-react`
- `react`

### `src\shared\components\GlobalPerformanceTestPanel.tsx`

- `lucide-react`
- `react`

### `src\shared\components\images\ImageGallery.tsx`

- `lucide-react`
- `react`
- `react-window`
- `react-zoom-pan-pinch`

### `src\shared\components\IntegrationTest.tsx`

- `react`

### `src\shared\components\images\PropertyImageVault.tsx`

- `react`

### `src\shared\components\listing-card.tsx`

- `wouter`
- `react`

### `src\shared\components\LazyComponents.tsx`

- `react`

### `src\shared\components\monitoring\ApiClientDashboard.tsx`

- `react`

### `src\shared\components\navigation\BreadcrumbNavigation.tsx`

- `lucide-react`

### `src\shared\components\navigation\ContextualSidebar.tsx`

- `lucide-react`
- `react`

### `src\shared\components\navigation\EnhancedNavigation.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\components\LoadingStates.tsx`

- `lucide-react`

### `src\shared\components\navigation\MobileNav.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\components\navigation\NavigationErrorBoundary.tsx`

- `lucide-react`
- `react`

### `src\shared\components\navigation\NavigationDebug.tsx`

- `react`
- `react-router-dom`
- `@shared/lib/utils`
- `lucide-react`
- `@shared/components/ui/button`
- `@shared/components/ui/input`
- `@shared/components/ui/logo`
- `@shared/components/ui/wordmark`
- `@shared/hooks/useAccessibility`

### `src\shared\components\navigation\SafeNavigation.tsx`

- `react`

### `src\shared\components\navigation\NavigationSearch.tsx`

- `lucide-react`
- `react`

### `src\shared\components\NewsBlog.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\components\Pagination.tsx`

- `lucide-react`

### `src\shared\components\PaymentGuidance.tsx`

- `lucide-react`

### `src\shared\components\PricingCTA.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\components\property\filters\AllPropertiesFilters.tsx`

- `lucide-react`
- `react`

### `src\shared\components\property\filters\CommercialFilters.tsx`

- `lucide-react`
- `react`

### `src\shared\components\property\filters\BasePropertyFilters.tsx`

- `lucide-react`
- `react`

### `src\shared\components\property\filters\LandFilters.tsx`

- `lucide-react`
- `react`

### `src\shared\components\property\filters\ResidentialFilters.tsx`

- `lucide-react`
- `react`

### `src\shared\components\property\PhotoManagementButton.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\components\property\PropertyArchitectureComparison.tsx`

- `lucide-react`
- `react`

### `src\shared\components\property\PropertyCardWithImageManagement.example.tsx`

- `react`

### `src\shared\components\property\PropertyCard.tsx`

- `lucide-react`
- `react`

### `src\shared\components\property\PropertyListingPage.tsx`

- `@tanstack/react-query`
- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\components\property\PropertyDataGrid.tsx`

- `lucide-react`
- `react`
- `react-window`

### `src\shared\components\property\shared\examples\MinimalPropertyCard.tsx`

- `react`

### `src\shared\components\property\shared\PropertyFeatures.tsx`

- `react`
- `lucide-react`

### `src\shared\components\property\shared\PropertyImageSection.tsx`

- `react`
- `lucide-react`

### `src\shared\components\property\shared\QuickActionsOverlay.tsx`

- `react`
- `lucide-react`

### `src\shared\components\QueryErrorBoundary.tsx`

- `@tanstack/react-query`
- `lucide-react`
- `react`

### `src\shared\components\Testimonials.tsx`

- `lucide-react`
- `react`

### `src\shared\components\ServiceCategories.tsx`

- `lucide-react`
- `react`

### `src\shared\components\TrustIndicators.tsx`

- `lucide-react`
- `react`

### `src\shared\components\ui\accordion.tsx`

- `lucide-react`

### `src\shared\components\ui\alert.tsx`

- `class-variance-authority`

### `src\shared\components\ui\badge.tsx`

- `class-variance-authority`

### `src\shared\components\ui\breadcrumb.tsx`

- `@radix-ui/react-slot`
- `lucide-react`

### `src\shared\components\ui\button.tsx`

- `@radix-ui/react-slot`
- `class-variance-authority`

### `src\shared\components\ui\calendar.tsx`

- `lucide-react`
- `react-day-picker`

### `src\shared\components\ui\carousel.tsx`

- `embla-carousel-react`
- `lucide-react`

### `src\shared\components\ui\checkbox.tsx`

- `lucide-react`

### `src\shared\components\ui\context-menu.tsx`

- `lucide-react`

### `src\shared\components\ui\command.tsx`

- `@radix-ui/react-dialog`
- `cmdk`
- `lucide-react`

### `src\shared\components\ui\common-buttons.tsx`

- `lucide-react`
- `react`

### `src\shared\components\ui\drawer.tsx`

- `vaul`

### `src\shared\components\ui\dropdown-menu.tsx`

- `lucide-react`

### `src\shared\components\ui\enhanced-navigation.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\components\ui\error-states.tsx`

- `lucide-react`
- `react`

### `src\shared\components\ui\form.tsx`

- `@radix-ui/react-slot`
- `react-hook-form`

### `src\shared\components\ui\input-otp.tsx`

- `input-otp`
- `lucide-react`

### `src\shared\components\ui\label.tsx`

- `class-variance-authority`

### `src\shared\components\ui\loading-skeleton.tsx`

- `lucide-react`

### `src\shared\components\ui\loading-states.tsx`

- `lucide-react`

### `src\shared\components\ui\menubar.tsx`

- `lucide-react`

### `src\shared\components\ui\navigation-menu.tsx`

- `class-variance-authority`
- `lucide-react`

### `src\shared\components\ui\radio-group.tsx`

- `lucide-react`

### `src\shared\components\ui\resizable.tsx`

- `lucide-react`

### `src\shared\components\ui\select.tsx`

- `lucide-react`

### `src\shared\components\ui\sheet.tsx`

- `class-variance-authority`
- `lucide-react`

### `src\shared\components\ui\sidebar.tsx`

- `@radix-ui/react-slot`
- `class-variance-authority`
- `lucide-react`

### `src\shared\components\ui\theme-toggle.tsx`

- `lucide-react`
- `react`

### `src\shared\components\ui\toast.tsx`

- `class-variance-authority`
- `lucide-react`

### `src\shared\components\ui\toggle-group.tsx`

- `class-variance-authority`

### `src\shared\components\ui\toggle.tsx`

- `class-variance-authority`

### `src\shared\components\VideoModal.tsx`

- `lucide-react`
- `react`

### `src\shared\components\VirtualizedList.tsx`

- `react`
- `react-window`

### `src\shared\components\VirtualizedPropertyList.tsx`

- `react`

### `src\shared\contexts\ThemeContext.tsx`

- `react`

### `src\shared\error-handling\server\express-handler.ts`

- `express`

### `src\shared\hooks\images\usePropertyImageUpload.ts`

- `react`

### `src\shared\hooks\useAccessibility.tsx`

- `react`

### `src\shared\hooks\useB2BEntryPoints.ts`

- `react`

### `src\shared\hooks\useAIIntegration.ts`

- `react`
- `@tanstack/react-query`
- `../../../core/src/logging`

### `src\shared\hooks\useB2BMessaging.ts`

- `react`

### `src\shared\hooks\useCMS.ts`

- `@tanstack/react-query`

### `src\shared\hooks\useCompareError.ts`

- `react`

### `src\shared\hooks\useComponentPerformance.tsx`

- `react`

### `src\shared\hooks\useConfigurableHook.ts`

- `react`

### `src\shared\hooks\useDebounce.ts`

- `react`

### `src\shared\hooks\useDebouncedCallback.ts`

- `react`

### `src\shared\hooks\useEnhancedImageGallery.ts`

- `react`

### `src\shared\hooks\useErrorRecovery.ts`

- `react`

### `src\shared\hooks\useFilterState.ts`

- `react`
- `react-router-dom`

### `src\shared\hooks\useFileUpload.ts`

- `react`

### `src\shared\hooks\useHealthMonitoring.ts`

- `react`

### `src\shared\hooks\useFormValidation.ts`

- `react`

### `src\shared\hooks\useImageGallery.ts`

- `react`

### `src\shared\hooks\useGeolocation.ts`

- `react`

### `src\shared\hooks\useMemoryOptimization.ts`

- `react`

### `src\shared\hooks\useNavigationSpacing.ts`

- `react`

### `src\shared\hooks\useOperationTracking.ts`

- `@tanstack/react-query`
- `react`
- `react`

### `src\shared\hooks\usePagination.ts`

- `@tanstack/react-query`
- `react`

### `src\shared\hooks\useOptimisticMutation.ts`

- `@tanstack/react-query`
- `react`

### `src\shared\hooks\usePaymentGuidance.ts`

- `react`

### `src\shared\hooks\usePropertyActions.ts`

- `@tanstack/react-query`

### `src\shared\hooks\usePerformanceOptimization.ts`

- `react`

### `src\shared\hooks\usePolling.ts`

- `@tanstack/react-query`
- `react`

### `src\shared\hooks\usePropertyCardActions.ts`

- `react`

### `src\shared\hooks\usePropertyCardState.ts`

- `react`

### `src\shared\hooks\usePropertyCompareActions.ts`

- `react`

### `src\shared\hooks\usePropertyFormatting.ts`

- `react`

### `src\shared\hooks\useWebSocket.ts`

- `react`

### `src\shared\hooks\useSafeQuery.ts`

- `@tanstack/react-query`
- `react`

### `src\shared\hooks\useSecurity.ts`

- `react`
- `zod`
- `../../../core/src/validation/sanitization`

### `src\shared\hooks\utils\migration.ts`

- `../hooks/useForm`

### `src\shared\pages\AdminDashboard.tsx`

- `react`

### `src\shared\lib\utils.ts`

- `clsx`
- `tailwind-merge`

### `src\shared\pages\ApiDemo.tsx`

- `lucide-react`
- `react`

### `src\shared\pages\BlogPost.tsx`

- `lucide-react`
- `react-router-dom`

### `src\shared\pages\Blog.tsx`

- `react`
- `react-router-dom`

### `src\shared\pages\BlogTest.tsx`

- `lucide-react`
- `react-router-dom`

### `src\shared\pages\Community.tsx`

- `@tanstack/react-query`
- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\pages\ComingSoon.tsx`

- `lucide-react`

### `src\shared\pages\CommunityIntelligence.tsx`

- `react`
- `lucide-react`

### `src\shared\pages\CommunityAndResources.tsx`

- `@tanstack/react-query`
- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\pages\Contact.tsx`

- `lucide-react`
- `react`

### `src\shared\pages\Cookies.tsx`

- `lucide-react`

### `src\shared\pages\ContactSales.tsx`

- `lucide-react`
- `react`

### `src\shared\pages\Demo.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\pages\DeveloperDashboard.tsx`

- `lucide-react`
- `react`

### `src\shared\pages\DocumentViewer.tsx`

- `react`
- `lucide-react`

### `src\shared\pages\DocumentsPage.tsx`

- `react`
- `lucide-react`

### `src\shared\pages\DocumentUpload.tsx`

- `react`
- `lucide-react`

### `src\shared\pages\ExpertCoordination.tsx`

- `react`
- `lucide-react`

### `src\shared\pages\Features.tsx`

- `lucide-react`

### `src\shared\pages\FindProfessionals.tsx`

- `lucide-react`

### `src\shared\pages\Fraud-resources.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\pages\GettingStarted.tsx`

- `lucide-react`

### `src\shared\pages\Help.tsx`

- `lucide-react`
- `react`

### `src\shared\pages\Home.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\pages\LocationServices.tsx`

- `react`
- `lucide-react`

### `src\shared\pages\MVP-Demo.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\shared\pages\OurStory.tsx`

- `lucide-react`

### `src\shared\pages\Partners.tsx`

- `lucide-react`
- `react`

### `src\shared\pages\PressMedia.tsx`

- `lucide-react`
- `react`

### `src\shared\pages\PhysicalVerification.tsx`

- `react`
- `lucide-react`

### `src\shared\pages\Privacy.tsx`

- `lucide-react`

### `src\shared\pages\Pricing.tsx`

- `lucide-react`
- `react`

### `src\shared\pages\solutions\LegalExperts.tsx`

- `lucide-react`
- `react-router-dom`

### `src\shared\pages\Resources.tsx`

- `lucide-react`

### `src\shared\pages\Security.tsx`

- `lucide-react`

### `src\shared\pages\Services.tsx`

- `react-router-dom`

### `src\shared\pages\solutions\PropertyBuyers.tsx`

- `lucide-react`
- `react-router-dom`

### `src\shared\pages\solutions\PropertyDevelopers.tsx`

- `lucide-react`
- `react-router-dom`

### `src\shared\pages\solutions\PropertySellers.tsx`

- `lucide-react`
- `react-router-dom`

### `src\shared\pages\Solutions.tsx`

- `react`

### `src\shared\pages\Properties.tsx`

- `react`

### `src\shared\pages\SystemMonitoring.tsx`

- `react`
- `lucide-react`

### `src\shared\pages\Terms.tsx`

- `lucide-react`

### `src\shared\pages\solutions\RealEstateAgents.tsx`

- `lucide-react`
- `react-router-dom`

### `src\shared\services\ai-integration\ai-performance-monitor.ts`

- `events`

### `src\shared\services\audit-trail-service.ts`

- `events`

### `src\shared\services\performance-monitoring-service.ts`

- `events`

### `src\shared\services\unified-api-client.ts`

- `../../../core/src/cache`

### `src\shared\services\security-monitoring-service.ts`

- `events`

### `src\shared\test-utils\accessibility.ts`

- `axe-core`
- `jest-axe`

### `src\shared\test-utils\api-handlers.ts`

- `msw`

### `src\shared\test-utils\bug-detector.ts`

- `fs`
- `path`
- `glob`

### `src\shared\test-utils\error-testing.ts`

- `msw`

### `src\shared\test-utils\msw-browser.ts`

- `msw/browser`

### `src\shared\test-utils\msw-server.ts`

- `msw`
- `msw/node`

### `src\shared\test-utils\performance-testing.ts`

- `web-vitals`

### `src\shared\test-utils\render.tsx`

- `@tanstack/react-query`
- `@testing-library/react`
- `react`
- `react-router-dom`

### `src\shared\test-utils\test-chunking.ts`

- `fs`
- `path`
- `glob`

### `src\shared\testing\TestUtils.ts`

- `@testing-library/react`
- `@tanstack/react-query`
- `react-router-dom`
- `react`

### `src\shared\types\api-contracts.ts`

- `zod`

### `src\shared\types\contracts\property-contracts.ts`

- `zod`

### `src\shared\types\contracts\user-contracts.ts`

- `zod`

### `src\shared\utils\cn.ts`

- `clsx`
- `tailwind-merge`

### `src\shared\utils\compare-utils.tsx`

- `lucide-react`

### `src\shared\utils\images\unified-utils.ts`

- `../../config/image-service.config`

### `src\test-safe-hooks.tsx`

- `@tanstack/react-query`

### `src\trust\components\DocumentAuthentication.tsx`

- `lucide-react`
- `react`

### `src\trust\components\CaseManagementInterface.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\trust\components\DocumentUploadInterface.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\trust\components\FraudAlertsList.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\trust\components\MLAnalyticsDisplay.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\trust\components\DocumentVerificationResults.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\trust\components\NetworkAnalysisVisualization.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\trust\components\TrustScore.tsx`

- `lucide-react`

### `src\trust\components\FraudDetectionDashboard.tsx`

- `framer-motion`
- `lucide-react`
- `react`

### `src\trust\components\PropertyRiskAssessment.tsx`

- `lucide-react`
- `react`

### `src\trust\components\VerificationBadge.tsx`

- `lucide-react`

### `src\trust\contexts\TrustContext.tsx`

- `react`

### `src\trust\hooks\useFraudDetection.ts`

- `@tanstack/react-query`
- `react`

### `src\trust\hooks\useDocumentAuthentication.ts`

- `@tanstack/react-query`
- `react`

### `src\trust\hooks\useTrustScore.ts`

- `@tanstack/react-query`

### `src\trust\pages\Alerts.tsx`

- `lucide-react`
- `react`

### `src\trust\pages\BasicChecks.tsx`

- `react`
- `lucide-react`

### `src\trust\pages\DocumentAuth.tsx`

- `@tanstack/react-query`
- `lucide-react`
- `react`

### `src\trust\pages\FraudDetection.tsx`

- `react`
- `lucide-react`

### `src\trust\pages\FraudProtectionInfo.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\trust\pages\Karma.tsx`

- `lucide-react`

### `src\trust\pages\Reports.tsx`

- `@tanstack/react-query`
- `lucide-react`
- `react`

### `src\trust\pages\Reputation.tsx`

- `lucide-react`
- `react`

### `src\trust\pages\Reviews.tsx`

- `@tanstack/react-query`
- `lucide-react`
- `react`

### `src\trust\pages\TrustPoints.tsx`

- `lucide-react`

### `src\trust\services\trust-api.ts`

- `@/infrastructure/api/queryClient`

### `src\trust\services\trust-business-logic.ts`

- `zod`

### `src\types\land-verification.ts`

- `@server/infrastructure/database/schemas/consolidated`

### `src\user\components\UserNotifications.tsx`

- `lucide-react`
- `react`

### `src\user\components\UserProfile.tsx`

- `lucide-react`
- `react`

### `src\user\hooks\useUser.ts`

- `@tanstack/react-query`

### `src\user\pages\Dashboard.tsx`

- `lucide-react`
- `react`
- `react-router-dom`

### `src\user\pages\Activity.tsx`

- `react`

### `src\user\pages\Team.tsx`

- `lucide-react`

### `src\user\pages\UserSettings.tsx`

- `lucide-react`
- `react`

### `src\utils\bundle-optimizer.ts`

- `recharts`
- `date-fns`
- `framer-motion`

### `src\user\services\user-business-logic.ts`

- `zod`

### `tests\e2e\helpers\test-helpers.ts`

- `@playwright/test`

### `tests\shared\ConsolidatedTestFramework.ts`

- `@tanstack/react-query`
- `react-router-dom`
- `react`
- `perf_hooks`
- `jest-axe`

### `tests\test-app-startup.ts`

- `./server/test-db-connection`
- `./server/main.minimal`
- `./src/app/App`

### `tests\test-db.cjs`

- `dotenv`
- `postgres`

### `tests\test-imports.mjs`

- `./src/app/lazy-routes.tsx`

### `tests\test-imports.ts`

- `dotenv`
- `./src/app/lazy-routes`

### `tests\test-integration-simple.js`

- `fs`

### `tests\test-with-jsdom.ts`

- `jsdom`
- `react`
- `./src/app/lazy-routes`

### `tests\validate-integration.js`

- `fs`

### `tests\visual\helpers\visual-test-utils.ts`

- `@playwright/test`

## 📋 Next Steps

1. Review the proposed fixes above
2. Run with `DRY_RUN=false` to apply changes:
   ```bash
   DRY_RUN=false node import-resolver.mjs
   ```

### Manual Fixes Required

Some imports could not be automatically resolved. Common reasons:
- File was deleted or moved outside the project
- Import refers to a renamed export
- Import path uses custom configuration not detected
- Low confidence in automatic matching

Please review and fix these manually.

---
*Generated by Import Resolver*
