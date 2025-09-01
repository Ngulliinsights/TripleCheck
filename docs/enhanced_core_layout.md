// Enhanced core/ layout with production-grade patterns
core/
├── index.ts                    # Single barrel export with explicit public API surface
├── config/
│   ├── index.ts               # Config factory with environment detection
│   ├── schema.ts              # Zod schemas with runtime validation
│   ├── defaults.ts            # Environment-specific defaults
│   ├── hot-reload.ts          # Config watcher with graceful updates
│   └── types.ts               # Config-related type definitions
├── cache/
│   ├── index.ts               # CacheService factory with circuit breaker
│   ├── CacheService.ts        # Abstract base class with telemetry hooks
│   ├── CacheManager.ts        # Multi-tier cache coordination
│   ├── adapters/
│   │   ├── redis.adapter.ts   # With connection pooling & failover
│   │   ├── memory.adapter.ts  # LRU with memory pressure detection
│   │   └── hybrid.adapter.ts  # L1 (memory) + L2 (Redis) strategy
│   ├── decorators/
│   │   ├── cache.decorator.ts # Method-level caching with TTL strategies
│   │   └── evict.decorator.ts # Cache invalidation patterns
│   ├── serializers/
│   │   ├── json.serializer.ts
│   │   └── msgpack.serializer.ts
│   └── constants.ts           # TTLs, circuit breaker thresholds, prefixes
├── logging/
│   ├── index.ts               # Logger factory with context injection
│   ├── Logger.ts              # Structured logging interface
│   ├── context/
│   │   ├── request.context.ts # Per-request logging context
│   │   └── correlation.ts     # Distributed tracing correlation IDs
│   ├── transports/
│   │   ├── console.ts         # Development-friendly formatting
│   │   ├── file.ts            # Rotation with compression
│   │   ├── datadog.ts         # APM integration
│   │   └── elasticsearch.ts   # Centralized log aggregation
│   ├── formatters/
│   │   ├── json.formatter.ts
│   │   └── pretty.formatter.ts
│   ├── middleware/
│   │   └── express.middleware.ts # Auto-inject request context
│   └── redaction.ts           # GDPR/PII scrubbing with configurable rules
├── rate-limit/
│   ├── index.ts               # RateLimiter factory with strategy patterns
│   ├── RateLimiter.ts         # Abstract rate limiter interface
│   ├── strategies/
│   │   ├── sliding-window.ts  # More accurate than fixed window
│   │   ├── token-bucket.ts    # Burst handling capability
│   │   └── leaky-bucket.ts    # Smooth rate enforcement
│   ├── stores/
│   │   ├── redis.store.ts     # Distributed rate limiting
│   │   ├── memory.store.ts    # Single-instance limiting
│   │   └── hybrid.store.ts    # Fallback pattern
│   ├── decorators/
│   │   ├── rate-limit.decorator.ts # Method/class-level limiting
│   │   └── throttle.decorator.ts   # Adaptive throttling
│   └── constants.ts           # Rate configurations per endpoint type
├── validation/
│   ├── index.ts               # Validator factory with schema registry
│   ├── schemas/
│   │   ├── property.ts        # Business domain schemas
│   │   ├── user.ts            # User management schemas
│   │   ├── common.ts          # Shared validation patterns
│   │   ├── api/               # API-specific validations
│   │   │   ├── request.ts     # Request body/query validations
│   │   │   └── response.ts    # Response shape validations
│   │   └── index.ts           # Schema registry and exports
│   ├── middleware/
│   │   ├── express.middleware.ts
│   │   ├── fastify.middleware.ts
│   │   └── graphql.middleware.ts
│   ├── transformers/
│   │   ├── sanitize.ts        # Input sanitization
│   │   └── normalize.ts       # Data normalization
│   ├── error-formatter.ts     # Consistent validation error responses
│   └── constants.ts           # Validation rules and error codes
├── error-handling/
│   ├── index.ts               # Global error handler with context preservation
│   ├── ErrorHandler.ts        # Error handling strategy interface
│   ├── errors/
│   │   ├── base.error.ts      # Base error class with metadata
│   │   ├── business.error.ts  # Domain-specific errors
│   │   ├── validation.error.ts
│   │   ├── network.error.ts
│   │   └── index.ts           # Error type registry
│   ├── recovery/
│   │   ├── retry.strategy.ts  # Exponential backoff with jitter
│   │   ├── circuit-breaker.ts # Circuit breaker pattern
│   │   └── fallback.ts        # Graceful degradation
│   ├── reporting/
│   │   ├── sentry.reporter.ts # Error tracking integration
│   │   └── metrics.reporter.ts # Error rate metrics
│   └── constants.ts           # Retry policies, timeout configs
├── security/
│   ├── index.ts               # Security utilities factory
│   ├── auth/
│   │   ├── jwt.service.ts     # JWT token management
│   │   ├── session.service.ts # Session handling
│   │   └── oauth.service.ts   # OAuth provider integration
│   ├── authorization/
│   │   ├── rbac.service.ts    # Role-based access control
│   │   ├── permissions.ts     # Permission matrix and checks
│   │   └── policies.ts        # Policy evaluation engine
│   ├── crypto/
│   │   ├── hash.service.ts    # Password hashing (bcrypt/argon2)
│   │   ├── encryption.service.ts # Data encryption at rest
│   │   └── signing.service.ts # Digital signatures
│   ├── middleware/
│   │   ├── auth.middleware.ts # Authentication middleware
│   │   └── cors.middleware.ts # CORS configuration
│   └── constants.ts           # Security constants and configurations
├── monitoring/
│   ├── index.ts               # Monitoring factory with auto-registration
│   ├── metrics/
│   │   ├── prometheus.service.ts # Metrics collection
│   │   ├── custom.metrics.ts     # Business-specific metrics
│   │   └── system.metrics.ts     # System performance metrics
│   ├── health/
│   │   ├── health.service.ts     # Health check orchestrator
│   │   ├── checks/               # Individual health checks
│   │   │   ├── database.check.ts
│   │   │   ├── redis.check.ts
│   │   │   ├── external-api.check.ts
│   │   │   └── disk-space.check.ts
│   │   └── aggregator.ts         # Health status aggregation
│   ├── tracing/
│   │   ├── tracer.service.ts     # Distributed tracing
│   │   └── spans.ts              # Common span operations
│   └── alerting/
│       ├── alert.service.ts      # Alert rule engine
│       └── channels.ts           # Alert delivery channels
├── events/
│   ├── index.ts               # Event system with type safety
│   ├── EventBus.ts            # In-memory event bus
│   ├── publishers/
│   │   ├── redis.publisher.ts # Distributed events via Redis
│   │   └── kafka.publisher.ts # High-throughput event streaming
│   ├── subscribers/
│   │   └── base.subscriber.ts # Subscription management
│   ├── middleware/
│   │   ├── retry.middleware.ts   # Event retry logic
│   │   └── deduplication.middleware.ts
│   └── schemas/
│       └── event.schemas.ts      # Event payload validation
├── storage/
│   ├── index.ts               # Storage abstraction with multi-provider
│   ├── FileStorage.ts         # File operations interface
│   ├── adapters/
│   │   ├── s3.adapter.ts      # AWS S3 with multipart uploads
│   │   ├── gcs.adapter.ts     # Google Cloud Storage
│   │   ├── azure.adapter.ts   # Azure Blob Storage
│   │   └── local.adapter.ts   # Local filesystem (dev/test)
│   ├── middleware/
│   │   ├── virus-scan.middleware.ts # File security scanning
│   │   ├── image-resize.middleware.ts # Image processing
│   │   └── compression.middleware.ts  # File compression
│   ├── policies/
│   │   ├── retention.policy.ts    # Data retention rules
│   │   └── backup.policy.ts       # Backup strategies
│   └── constants.ts           # Size limits, MIME types, policies
├── database/
│   ├── index.ts               # Database connection factory
│   ├── connection/
│   │   ├── pool.manager.ts    # Connection pooling
│   │   └── health.monitor.ts  # Connection health monitoring
│   ├── migrations/
│   │   ├── runner.ts          # Migration execution
│   │   └── rollback.ts        # Migration rollback
│   ├── query-builder/
│   │   └── safe-query.ts      # SQL injection prevention
│   └── transactions/
│       └── manager.ts         # Transaction management
└── shared/
    ├── types/
    │   ├── common.ts          # Utility types (Result<T>, Option<T>)
    │   ├── api.ts             # API-related types
    │   └── domain.ts          # Domain model types
    ├── utils/
    │   ├── async.utils.ts     # Promise utilities (retry, timeout)
    │   ├── object.utils.ts    # Object manipulation helpers
    │   ├── string.utils.ts    # String processing utilities
    │   └── validation.utils.ts # Common validation helpers
    ├── constants/
    │   ├── http.constants.ts  # HTTP status codes, headers
    │   ├── regex.constants.ts # Common regex patterns
    │   └── time.constants.ts  # Time-related constants
    └── decorators/
        ├── timing.decorator.ts    # Performance measurement
        ├── memoize.decorator.ts   # Function memoization
        └── deprecation.decorator.ts # Deprecation warnings