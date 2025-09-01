# Core Utilities Consolidation - Requirements Document

## Introduction

This specification addresses the consolidation of cross-cutting utilities scattered throughout the codebase into a unified, well-structured core module based on the enhanced implementation patterns defined in `refined_cross_cutting.ts`. The current implementation has multiple cache services (server/cache/CacheService.ts, src/shared/services/CacheService.ts, server/infrastructure/cache/CacheService.ts), logging utilities, validation systems, and middleware scattered across different directories, leading to code duplication, inconsistent implementations, and maintenance challenges.

The goal is to create a centralized `core` module that consolidates the existing implementations with the enhanced patterns from `refined_cross_cutting.ts`, providing consistent, high-performance, and well-tested utilities for caching, logging, validation, error handling, rate limiting, and other cross-cutting concerns while maintaining backward compatibility during migration.

## Requirements

### Requirement 1: Multi-Tier Cache Service Consolidation

**User Story:** As a developer, I want a unified cache service interface that consolidates the existing Redis, memory, and infrastructure cache implementations into a single, high-performance service with multi-tier support.

#### Acceptance Criteria

1. WHEN consolidating existing cache services THEN the system SHALL merge RedisAdapter, MemoryAdapter, and MultiTierCache from refined_cross_cutting.ts with existing implementations
2. WHEN cache operations are performed THEN the system SHALL support L1 (memory) and L2 (Redis) tiers with automatic promotion and fallback
3. WHEN cache entries are stored THEN the system SHALL support compression (configurable threshold), TTL, tagging for invalidation, and comprehensive metrics collection
4. WHEN cache performance is measured THEN the system SHALL provide hit rates, response times, memory usage, and circuit breaker status
5. WHEN cache operations fail THEN the system SHALL implement SingleFlightCache wrapper with circuit breaker patterns and graceful degradation

### Requirement 2: Enhanced Structured Logging with Context Preservation

**User Story:** As a system administrator, I want comprehensive structured logging based on the Logger class from refined_cross_cutting.ts that provides async context preservation, automatic redaction, and multiple transport support.

#### Acceptance Criteria

1. WHEN log events are generated THEN the system SHALL use pino-based structured logging with AsyncLocalStorage for request context preservation
2. WHEN sensitive data is logged THEN the system SHALL automatically redact configurable paths (_.password, _.token, _.ssn, _.creditCard) using pino redaction
3. WHEN log levels are configured THEN the system SHALL support dynamic level changes and async transport with file rotation (maxFileSize, maxFiles)
4. WHEN logs are written THEN the system SHALL support multiple targets (file, error-specific files, pretty console output) via pino transport
5. WHEN request context exists THEN the system SHALL automatically include requestId, userId, traceId, spanId, and operationName from AsyncLocalStorage

### Requirement 3: Comprehensive Validation Framework with Zod Integration

**User Story:** As a developer, I want a comprehensive validation system based on the ValidationService from refined_cross_cutting.ts that provides schema-based validation, caching, and preprocessing capabilities.

#### Acceptance Criteria

1. WHEN data validation is required THEN the system SHALL provide Zod-based schema validation with detailed ValidationErrorDetail responses including field, message, code, and received values
2. WHEN validation schemas are defined THEN the system SHALL support commonSchemas (email, password, phone, URL, dateRange, pagination, fileUpload, searchQuery) with security-focused patterns
3. WHEN validation fails THEN the system SHALL return structured ValidationError with 422 status code and field-level error details
4. WHEN validation is performed THEN the system SHALL support preprocessing (trimming, type coercion, boolean conversion) via preprocessData method
5. WHEN batch validation is needed THEN the system SHALL efficiently validate multiple objects via validateBatch with separate valid/invalid result arrays

### Requirement 4: Enhanced Error Handling with Circuit Breaker Integration

**User Story:** As a developer, I want consistent error handling based on the AppError classes and CircuitBreaker from refined_cross_cutting.ts that provides categorized errors, automatic recovery, and comprehensive context preservation.

#### Acceptance Criteria

1. WHEN errors occur THEN the system SHALL categorize them using AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, TooManyRequestsError, and ServiceUnavailableError classes
2. WHEN errors are handled THEN the system SHALL provide consistent HTTP status codes via errorHandlerMiddleware with configurable stack trace inclusion and Sentry reporting
3. WHEN critical errors occur THEN the system SHALL implement CircuitBreaker with adaptive thresholds, slow call detection, and automatic state transitions (closed/open/half-open)
4. WHEN errors are logged THEN the system SHALL include full context via logger.withContext with requestId, userId, and async context preservation
5. WHEN error rates increase THEN the system SHALL trigger setupGlobalErrorHandlers for uncaughtException and unhandledRejection with graceful shutdown

### Requirement 5: Advanced Rate Limiting with Multiple Algorithms

**User Story:** As a system administrator, I want flexible rate limiting based on the RateLimiter implementation from refined_cross_cutting.ts that supports multiple algorithms, burst allowance, and comprehensive metrics.

#### Acceptance Criteria

1. WHEN rate limits are applied THEN the system SHALL support RedisRateLimitStore and MemoryRateLimitStore with sliding-window, token-bucket, and fixed-window algorithms via Lua scripts
2. WHEN rate limits are exceeded THEN the system SHALL return X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-RetryAfter headers with 429 status code
3. WHEN rate limiting is configured THEN the system SHALL support per-user, per-IP, and per-endpoint limits with configurable burst allowance (20% default) and keyGenerator functions
4. WHEN rate limit metrics are collected THEN the system SHALL track totalRequests, blockedRequests, blockRate, avgProcessingTime via RateLimitMetrics interface
5. WHEN rate limiting fails THEN the system SHALL fail open via try-catch blocks and log security events for rate_limit_exceeded violations

### Requirement 6: Enhanced Configuration Management with Schema Validation

**User Story:** As a DevOps engineer, I want centralized configuration management based on the ConfigManager from refined_cross_cutting.ts that provides Zod schema validation, hot reloading, and feature flag support with rollout capabilities.

#### Acceptance Criteria

1. WHEN configuration is loaded THEN the system SHALL validate all settings against comprehensive Zod schemas (app, cache, log, rateLimit, errors, security, storage, database, features, monitoring)
2. WHEN environment variables change THEN the system SHALL support hot reloading via chokidar file watching in development with config:changed events
3. WHEN feature flags are used THEN the system SHALL support percentage-based rollouts via hashString algorithm and user targeting via enabledForUsers arrays
4. WHEN configuration errors occur THEN the system SHALL fail fast with detailed Zod validation errors and runtime dependency validation (Redis, database, Sentry)
5. WHEN configuration is accessed THEN the system SHALL provide type-safe AppConfig interface with cascading .env file priority (.env, .env.{environment}, .env.local)

### Requirement 7: Comprehensive Health Monitoring System

**User Story:** As a system administrator, I want comprehensive health checks based on the HealthChecker from refined_cross_cutting.ts that provides detailed component status monitoring and automatic dependency validation.

#### Acceptance Criteria

1. WHEN health checks run THEN the system SHALL test all critical dependencies (Redis cache, database, memory usage) via registered HealthCheck interfaces with 5-second timeout protection
2. WHEN health status is requested THEN the system SHALL return detailed component status via healthCheckEndpoint with uptime, environment, version, and individual check results
3. WHEN health checks fail THEN the system SHALL provide specific error information with 'healthy'/'unhealthy' status and detailed error messages in check results
4. WHEN health checks timeout THEN the system SHALL mark components as unhealthy after 5-second Promise.race timeout with 'Health check timeout' error
5. WHEN health endpoints are accessed THEN the system SHALL respond with 200 (healthy) or 503 (unhealthy) status codes and comprehensive system metrics

### Requirement 8: Unified Middleware Integration with Existing Patterns

**User Story:** As a developer, I want reusable middleware components that consolidate existing auth, cache, validation, and deduplication middleware from server/middleware/ with the enhanced patterns from refined_cross_cutting.ts.

#### Acceptance Criteria

1. WHEN middleware is applied THEN the system SHALL consolidate rateLimitMiddleware, validateRequest, requestLoggingMiddleware, and errorHandlerMiddleware with existing auth.middleware.ts, cache.middleware.ts, and validation patterns
2. WHEN middleware chains are configured THEN the system SHALL support flexible ordering via Express middleware patterns with conditional application via skipIf functions and keyGenerator customization
3. WHEN middleware errors occur THEN the system SHALL handle them gracefully via errorHandlerMiddleware without breaking the request chain, preserving async context
4. WHEN middleware performance is measured THEN the system SHALL track execution times via performance.now() measurements and resource usage via metrics collection
5. WHEN middleware is tested THEN the system SHALL provide comprehensive test utilities leveraging existing **tests** patterns and mock implementations

### Requirement 9: Migration Strategy

**User Story:** As a developer, I want a smooth migration path so that I can gradually adopt the new core utilities without breaking existing functionality.

#### Acceptance Criteria

1. WHEN migration begins THEN the system SHALL maintain backward compatibility with existing interfaces
2. WHEN services are migrated THEN the system SHALL provide adapter patterns for gradual transition
3. WHEN migration is complete THEN the system SHALL remove deprecated code and update all references
4. WHEN migration issues occur THEN the system SHALL provide clear error messages and migration guides
5. WHEN migration is tested THEN the system SHALL ensure no functionality regression

### Requirement 10: Performance Optimization

**User Story:** As a system administrator, I want optimized core utilities so that the system maintains high performance under load.

#### Acceptance Criteria

1. WHEN core utilities are used THEN the system SHALL minimize memory allocation and CPU usage
2. WHEN concurrent operations occur THEN the system SHALL handle them efficiently without blocking
3. WHEN performance is measured THEN the system SHALL provide detailed metrics and profiling information
4. WHEN bottlenecks are detected THEN the system SHALL implement automatic optimization strategies
5. WHEN load increases THEN the system SHALL scale gracefully without degrading performance
