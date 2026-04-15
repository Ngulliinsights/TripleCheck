# Server - Backend Architecture

The backend server for African Property Trust (TripleCheck), providing APIs for property verification, fraud detection, and trust scoring.

## Architecture Overview

```
server/
├── ai/                    # AI/ML services for document analysis and fraud detection
├── infrastructure/        # Core infrastructure (database, cache, monitoring)
├── document-auth/         # Document authentication and verification
├── fraud-detection/       # Fraud detection engine and analytics
├── land-verification/     # Land verification workflows
├── property/              # Property management services
├── trust/                 # Community trust scoring
├── auth/                  # Authentication and authorization
├── communication/         # Messaging and notifications
├── middleware/            # Express middleware (auth, validation, rate limiting)
├── app.ts                 # Express app configuration
└── index.ts               # Server entry point
```

## Core Services

### AI/ML Services (`/ai/`)
- Document analysis using custom ML models
- Fraud detection algorithms
- Community trust AI scoring
- Hybrid approach: Custom models + API fallback

### Infrastructure (`/infrastructure/`)
- **Database**: PostgreSQL with Drizzle ORM, migrations, seeds
- **Cache**: UnifiedCacheManager (L1/L2 architecture)
- **Monitoring**: Performance tracking, health checks, alerting
- **Storage**: File upload and management
- **Rate Limiting**: API protection and throttling

### Document Authentication (`/document-auth/`)
- Multi-analyzer system (6 analyzers)
- PDF document processing
- Signature verification
- Metadata analysis
- ML-based forgery detection

### Fraud Detection (`/fraud-detection/`)
- Real-time transaction analysis
- Network analysis for collusion detection
- Case management system
- Compliance reporting

### Land Verification (`/land-verification/`)
- GPS coordinate validation
- Survey beacon verification
- Community intelligence integration
- Physical verification workflows

## Technology Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle
- **Cache**: Redis (via UnifiedCacheManager)
- **AI/ML**: TensorFlow.js, Hugging Face
- **Validation**: Zod
- **Authentication**: JWT

## Key Patterns

### Service Layer
All business logic is in service classes:
- `*.service.ts` - Core service logic
- `*.controller.ts` - HTTP request handlers
- `*.repository.ts` - Data access layer

### Middleware Stack
Request flow: `auth → validation → rate-limiting → deduplication → cache → handler`

### Error Handling
Centralized error handling with structured logging and monitoring.

## Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Authentication secret
- `HF_TOKEN` - Hugging Face API token
- `PORT` - Server port (default: 3000)

## Development

```bash
# Start development server
npm run dev

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Run tests
npm test
```

## API Documentation

API endpoints are organized by domain:
- `/api/auth` - Authentication
- `/api/properties` - Property management
- `/api/verification` - Land verification
- `/api/fraud` - Fraud detection
- `/api/trust` - Trust scoring
- `/api/documents` - Document authentication

## Related Documentation

- `/adr/001-cache-consolidation.md` - Cache architecture decisions
- `/adr/005-database-schema-strategy.md` - Database design
- `/adr/009-ml-training-strategy.md` - ML model strategy
- `/server/infrastructure/README.md` - Infrastructure details
