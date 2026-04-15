# Infrastructure - Core Backend Services

Foundational infrastructure services for the TripleCheck platform including database, caching, monitoring, and storage.

## Directory Structure

```
infrastructure/
├── database/              # Database layer (PostgreSQL + Drizzle)
├── cache/                 # Caching layer (Redis + in-memory)
├── monitoring/            # Performance monitoring and alerting
├── storage/               # File storage and management
├── rate-limiting/         # API rate limiting and throttling
├── deduplication/         # Request deduplication
├── email/                 # Email service integration
├── events/                # Event bus for pub/sub
├── optimization/          # Performance optimization tools
├── testing/               # Testing framework
└── versioning/            # API versioning middleware
```

## Key Components

### Database (`/database/`)

**Purpose**: PostgreSQL database layer with migrations, schemas, and data generation.

**Key Features**:
- Drizzle ORM for type-safe queries
- Migration system with version control
- Schema organization by domain (core, fraud, trust, verification)
- Data generation for testing and demos
- Connection pooling and circuit breaker
- Health monitoring and performance tracking

**See**: `/server/infrastructure/database/README.md` for details

### Cache (`/cache/`)

**Purpose**: Multi-tier caching for performance optimization.

**Architecture** (see ADR 001):
- **UnifiedCacheManager**: L1 (in-memory) + L2 (Redis)
- **CacheService**: Simple in-memory fallback
- Stampede protection and intelligent pre-fetching
- Tag-based invalidation

**Usage**:
```typescript
import { unifiedCacheManager } from './cache/UnifiedCacheManager'

await unifiedCacheManager.set('key', value, { l2Ttl: 3600 })
const result = await unifiedCacheManager.get('key')
```

### Monitoring (`/monitoring/`)

**Purpose**: System health, performance tracking, and alerting.

**Components**:
- **PerformanceMonitor**: Track API response times, throughput
- **ObservabilitySystem**: Metrics collection and dashboards
- **AlertingSystem**: Automated alerts for issues
- **PrometheusMetrics**: Prometheus-compatible metrics export

**Metrics Tracked**:
- API response times
- Database query performance
- Cache hit rates
- Error rates
- Resource utilization

### Storage (`/storage/`)

**Purpose**: File upload, storage, and retrieval.

**Features**:
- Secure file upload with validation
- Integration with cloud storage (Cloudinary)
- File metadata tracking
- Access control and permissions

### Rate Limiting (`/rate-limiting/`)

**Purpose**: Protect APIs from abuse and ensure fair usage.

**Components**:
- **ApiRateLimiter**: Token bucket algorithm
- **CircuitBreaker**: Prevent cascade failures
- **ApiCallTracker**: Track usage per client

**Configuration**:
```typescript
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false
}
```

### Deduplication (`/deduplication/`)

**Purpose**: Prevent duplicate request processing.

**How it works**:
- Hash request parameters
- Check if identical request is in-flight
- Return cached result if available
- Prevent redundant database queries

## Design Principles

### 1. Separation of Concerns
Each infrastructure service is independent and focused on a single responsibility.

### 2. Graceful Degradation
Services have fallback mechanisms:
- Cache: Redis → in-memory → no cache
- Storage: Cloud → local → error
- Monitoring: Full metrics → basic logs → silent

### 3. Performance First
All services are optimized for low latency and high throughput.

### 4. Observability
Comprehensive logging, metrics, and tracing for debugging and optimization.

## Configuration

Infrastructure services are configured via environment variables:

```env
# Database
DATABASE_URL=postgresql://...
DB_POOL_SIZE=20

# Cache
REDIS_URL=redis://...
CACHE_TTL=3600

# Monitoring
PROMETHEUS_PORT=9090
ALERT_WEBHOOK_URL=https://...

# Storage
CLOUDINARY_URL=cloudinary://...
MAX_FILE_SIZE=10485760
```

## Performance Characteristics

| Service | Latency | Throughput | Availability |
|---------|---------|------------|--------------|
| Cache (L1) | <1ms | 100k+ ops/s | 99.99% |
| Cache (L2) | <10ms | 10k+ ops/s | 99.9% |
| Database | <50ms | 1k+ queries/s | 99.9% |
| Storage | <200ms | 100+ uploads/s | 99.5% |

## Related Documentation

- `/adr/001-cache-consolidation.md` - Cache architecture
- `/adr/005-database-schema-strategy.md` - Database design
- `/server/infrastructure/database/README.md` - Database details
