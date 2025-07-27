# TripleCheck - Project Structure

## Root Directory Organization

```
├── src/                    # Frontend React application (domain-driven)
├── server/                 # Backend API services (domain-driven)
├── scripts/                # Automation, deployment, and utility scripts
├── tests/                  # E2E and integration tests
├── docs/                   # Documentation and guides
├── public/                 # Static assets and PWA files
├── uploads/                # File upload storage (documents, images, processed)
├── temp-files/             # Analysis reports and temporary files
├── test-results/           # Test execution results and reports
└── [Configuration files]   # package.json, tsconfig.json, vite.config.ts, etc.
```

## Frontend Structure (`src/`)

### Domain-Driven Architecture
Each business domain follows a consistent structure:

```
src/
├── shared/                 # Cross-domain utilities and components
│   ├── components/         # Reusable UI components (50+ design system components)
│   │   ├── layout/         # Layout components (AppLayout, Navigation, Footer)
│   │   └── ui/             # Design system (button, form, input, dialog, table, etc.)
│   ├── hooks/              # Custom React hooks (useDebounce, useGeolocation, etc.)
│   ├── pages/              # Marketing pages (Home, Features, Community, etc.)
│   ├── services/           # API client and shared services
│   ├── utils/              # Utility functions and validation
│   ├── types/              # Shared TypeScript types
│   ├── styles/             # Global styles and CSS
│   └── schema.ts           # Database schema (Drizzle ORM)
├── property/               # Property management domain
├── trust/                  # Trust scoring and fraud detection
├── user/                   # User management and profiles
├── auth/                   # Authentication and authorization
├── search/                 # Search and filtering functionality
├── communication/          # Messaging and notifications
├── analytics/              # Analytics and reporting
├── land-verification/      # Core Kenya land verification system
├── infrastructure/         # Technical infrastructure
│   ├── api/                # API client configuration and request management
│   ├── routing/            # Route management and preloading
│   ├── monitoring/         # Performance monitoring and web vitals
│   └── hooks/              # Infrastructure hooks (useSafeEffect, useCoordinatedState)
├── app/                    # Application root and routing
│   ├── App.tsx             # Main application component
│   ├── router.tsx          # Route configuration
│   ├── providers.tsx       # Context providers setup
│   ├── lazy-routes.tsx     # Code splitting implementation
│   └── error-boundary.tsx  # Global error handling
├── types/                  # Global type definitions
│   ├── google-maps.d.ts    # Google Maps type definitions
│   └── land-verification.ts # Land verification types
├── utils/                  # Performance utilities
│   ├── bundle-optimizer.ts # Bundle optimization
│   └── performance-optimizer.ts # Performance optimization
└── main.tsx                # React application entry point
```

### Domain Structure Pattern
Each domain follows this consistent pattern:

```
domain/
├── components/             # Domain-specific React components
├── hooks/                  # Domain-specific custom hooks
├── pages/                  # Route components for this domain
├── services/               # API services and business logic
├── types/                  # TypeScript type definitions
├── utils/                  # Domain-specific utilities
├── tests/                  # Domain-specific tests
└── index.ts                # Domain exports
```

## Backend Structure (`server/`)

### Domain-Driven API Architecture
Backend mirrors frontend domain organization with comprehensive service layers:

```
server/
├── main.ts                 # Server entry point
├── app.ts                  # Express application configuration
├── index.ts                # Server bootstrap
├── vite.ts                 # Vite integration for development
│
├── CORE SERVICES/
│   ├── land-verification/  # Core land verification engine
│   │   ├── LandVerificationService.ts # Main orchestration service
│   │   ├── PhysicalVerificationService.ts # Physical verification coordination
│   │   ├── RiskAssessmentService.ts # Comprehensive risk analysis
│   │   ├── CommunityIntelligenceService.ts # Community intelligence
│   │   ├── ExpertCoordinationService.ts # Expert network coordination
│   │   ├── MonitoringService.ts # System monitoring
│   │   ├── ReportingService.ts # Report generation
│   │   ├── performance/    # Performance optimization layer
│   │   ├── security/       # Security and access control
│   │   ├── error-handling/ # Error management
│   │   └── monitoring/     # Metrics and alerting
│   │
│   ├── fraud-detection/    # Advanced fraud detection system
│   │   ├── core/           # Fraud detection engine
│   │   ├── analytics/      # ML analytics and network analysis
│   │   ├── services/       # Case management and compliance
│   │   └── api/            # Fraud detection API
│   │
│   ├── document-auth/      # Document authentication system
│   │   ├── core/           # Document authentication engine
│   │   ├── analyzers/      # Document analysis (visual, signature, ML)
│   │   └── DocumentAuthService.ts # Main service
│   │
│   ├── ai/                 # AI and machine learning services
│   │   ├── ai.service.ts   # AI service coordination
│   │   ├── community-trust-ai.ts # Community trust algorithms
│   │   ├── ml-training.ts  # Model training pipelines
│   │   └── storage.ts      # AI model storage
│   │
│   └── blockchain/         # Blockchain integration
│       └── blockchain-service.ts # Blockchain verification
│
├── BUSINESS DOMAINS/
│   ├── property/           # Property management
│   │   ├── property.controller.ts # API endpoints
│   │   ├── property.service.ts # Business logic
│   │   └── property.repository.ts # Data access
│   │
│   ├── auth/               # Authentication system
│   │   ├── auth.controller.ts # Auth endpoints
│   │   ├── auth.service.ts # Auth business logic
│   │   └── AuthenticationService.ts # Auth implementation
│   │
│   ├── user/               # User management
│   │   └── user.controller.ts # User endpoints
│   │
│   ├── trust/              # Trust and reputation system
│   │   ├── trust.controller.ts # Trust endpoints
│   │   ├── community-trust.service.ts # Community algorithms
│   │   └── TrustScoringService.ts # Trust scoring
│   │
│   ├── communication/      # Communication services
│   │   ├── communication.controller.ts # Communication endpoints
│   │   └── notification.service.ts # Multi-channel notifications
│   │
│   ├── search/             # Search services
│   │   └── search.controller.ts # Search endpoints
│   │
│   └── analytics/          # Analytics services
│       └── analytics.controller.ts # Analytics endpoints
│
├── INFRASTRUCTURE/
│   ├── infrastructure/     # Core infrastructure services
│   │   ├── database/       # Comprehensive database infrastructure
│   │   │   ├── connection.ts # Database connection management
│   │   │   ├── config/     # Environment-based configuration
│   │   │   ├── types/      # TypeScript definitions
│   │   │   ├── utils/      # Common database operations
│   │   │   ├── migrations/ # Migration management system
│   │   │   ├── seeds/      # Master seeding orchestrator
│   │   │   ├── init.ts     # Database initialization
│   │   │   └── integration.ts # Service integration layer
│   │   ├── email/          # Email service implementation
│   │   ├── storage/        # File storage abstraction
│   │   └── monitoring/     # Logging and monitoring
│   │
│   ├── cache/              # Redis caching layer
│   │   └── CacheService.ts # Caching implementation
│   │
│   ├── security/           # Security hardening
│   │   └── SecurityHardening.ts # Security policies
│   │
│   └── middleware/         # Express middleware
│       ├── auth.middleware.ts # Authentication middleware
│       ├── error.middleware.ts # Error handling
│       ├── logging.middleware.ts # Request logging
│       ├── validation.middleware.ts # Input validation
│       └── centralized-error-handler.ts # Global error handling
│
├── ROUTING & API/
│   ├── routes/             # API route definitions
│   │   ├── index.ts        # Route registry
│   │   ├── PropertyRoutes.ts # Property routes
│   │   ├── AuthRoutes.ts   # Authentication routes
│   │   ├── verification.routes.ts # Land verification routes
│   │   ├── reviews.routes.ts # Review system routes
│   │   ├── ai-routes.ts    # AI service routes
│   │   └── community-trust-routes.ts # Community trust routes
│   │
│   └── services/           # Business services
│       ├── PropertyService.ts # Property management
│       ├── AuthService.ts  # Authentication
│       ├── VerificationService.ts # Verification orchestration
│       ├── ReviewService.ts # Review system
│       ├── UserService.ts  # User management
│       ├── email-service.ts # Email communication
│       ├── mpesa-service.ts # Kenyan payment integration
│       └── notification-service.ts # Multi-channel notifications
│
├── SHARED RESOURCES/
│   ├── types/              # TypeScript type definitions
│   │   ├── api.types.ts    # API contract definitions
│   │   ├── auth.types.ts   # Authentication types
│   │   ├── property.types.ts # Property domain types
│   │   ├── verification.types.ts # Verification types
│   │   └── fraud.types.ts  # Fraud detection types
│   │
│   ├── utils/              # Utility functions
│   │   ├── constants.ts    # Application constants
│   │   ├── validators.ts   # Data validation
│   │   ├── error-messages.ts # Standardized errors
│   │   └── response-helpers.ts # API response utilities
│   │
│   └── shared/             # Cross-domain utilities
│       ├── community-trust-schema.ts # Community trust schema
│       └── email-types.ts  # Email type definitions
│
└── tests/                  # Comprehensive testing
    ├── integration/        # Integration tests
    ├── performance/        # Performance tests
    ├── security/           # Security tests
    ├── e2e/                # End-to-end tests
    └── [Various test files] # Specialized test suites
```

## Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Frontend build configuration
- `drizzle.config.ts` - Database ORM configuration
- `tailwind.config.ts` - CSS framework configuration
- `eslint.config.js` - Code linting rules
- `playwright.config.ts` - E2E testing configuration
- `vercel.json` - Deployment configuration

## Key Conventions

### File Naming
- Use kebab-case for files and directories (`property-card.tsx`, `user-service.ts`)
- Use PascalCase for React components (`PropertyCard.tsx`, `UserProfile.tsx`)
- Use camelCase for functions and variables (`getUserData`, `propertyList`)
- Add `.test.ts` or `.spec.ts` suffix for tests (`property.test.ts`, `auth.spec.ts`)
- Use descriptive names that reflect functionality (`LandVerificationService.ts`, `FraudDetectionEngine.ts`)

### Import Organization
- Use path aliases defined in `tsconfig.json` and `vite.config.ts`:
  - `@/*` - General source imports
  - `@shared/*` - Shared utilities and components
  - `@property/*` - Property domain imports
  - `@trust/*` - Trust and fraud detection imports
  - `@auth/*` - Authentication imports
  - `@user/*` - User management imports
  - `@communication/*` - Communication imports
  - `@analytics/*` - Analytics imports
  - `@infrastructure/*` - Infrastructure imports
  - `@server/*` - Server-side imports
- Order imports: external libraries first, then internal imports
- Group related imports together

### Component Structure
- One component per file with descriptive names
- Co-locate related files (component, styles, tests) when applicable
- Use TypeScript interfaces for props with clear naming
- Export components as default, utilities as named exports
- Follow React 18 patterns with hooks and functional components
- Use proper TypeScript typing throughout

### API Structure
- RESTful endpoints organized by business domain
- Consistent response formats using response helpers
- Type-safe request/response with Zod validation schemas
- Comprehensive error handling middleware
- Domain-specific controllers and services
- Clear separation between controllers, services, and repositories

### Database Schema & ORM
- Single schema file at `src/shared/schema.ts` using Drizzle ORM
- PostgreSQL as primary database with proper indexing
- Use pgEnum for consistent enumerated values
- Proper foreign key relationships and constraints
- Type-safe queries throughout the application
- Migration management through Drizzle Kit

### Service Architecture
- Domain-driven service organization
- Clear separation of concerns between layers
- Dependency injection patterns where appropriate
- Comprehensive error handling and logging
- Performance monitoring and optimization
- Security-first approach in all services

### Land Verification Specific Conventions
- Kenya-specific document types and validation
- Multi-step verification workflows
- Expert coordination patterns
- Risk assessment scoring systems
- Community intelligence integration
- Blockchain integration for immutable records

### Testing Conventions
- Unit tests co-located with source files
- Integration tests in dedicated test directories
- E2E tests organized by user workflows
- Performance tests for critical paths
- Security tests for sensitive operations
- Comprehensive test coverage for verification systems

## Scripts & Automation Structure

### Data Management Scripts (`scripts/`)
```
scripts/
├── data-generation/        # Test data generation
│   ├── fraud-simulator.py  # Realistic fraud scenarios
│   ├── property-generator.py # Kenyan property data
│   ├── user-generator.py   # User profile generation
│   └── [Generated datasets]
├── data-migration/         # Database migration utilities
│   ├── migrate-existing-properties.ts # Legacy data migration
│   ├── seed-kenya-properties.ts # Kenya-specific seeding
│   ├── run-migration.ts    # Migration execution
│   └── validate-migration.ts # Migration validation
├── deployment/             # Deployment automation
│   ├── docker-compose.land-verification.yml # Container orchestration
│   ├── kubernetes/         # Kubernetes deployment configs
│   ├── grafana/           # Monitoring dashboard setup
│   └── setup-monitoring.ts # Monitoring infrastructure
└── [Various utility scripts] # Database setup, testing, maintenance
```

### Testing Strategy

#### Frontend Testing
- **Unit Tests**: Vitest with React Testing Library in `domain/tests/`
- **Component Tests**: Isolated component testing with mock data
- **Integration Tests**: Cross-component interaction testing
- **E2E Tests**: Playwright tests in `tests/e2e/` covering complete user workflows
- **Accessibility Tests**: Automated accessibility compliance testing
- **Performance Tests**: Core Web Vitals and performance monitoring

#### Backend Testing
- **Unit Tests**: Service and utility function testing in `server/domain/tests/`
- **Integration Tests**: Database and API integration in `server/tests/integration/`
- **API Tests**: RESTful API contract testing in `server/tests/api/`
- **Performance Tests**: Load testing and stress testing in `server/tests/performance/`
- **Security Tests**: Security vulnerability and penetration testing
- **Land Verification Tests**: Specialized testing for verification workflows

#### Specialized Testing
- **Land Verification System Tests**: Comprehensive testing of verification workflows
- **Fraud Detection Tests**: ML model and fraud detection algorithm testing
- **Document Authentication Tests**: Document analysis and verification testing
- **Compatibility Tests**: Backward compatibility and system integration testing
- **Deployment Tests**: Deployment validation and health checks

### Documentation Structure

#### Core Documentation (`docs/`)
- **API Documentation**: Comprehensive API endpoint documentation
- **Database Documentation**: Schema and migration documentation
- **Deployment Guides**: Environment-specific deployment instructions
- **Architecture Decisions**: ADR (Architecture Decision Records)

#### Analysis & Reports (`temp-files/`)
- **Code Analysis Reports**: Automated code quality analysis
- **Data Generation Reports**: Data pipeline and generation reports
- **Project Sitemaps**: Structural analysis and mapping
- **Performance Reports**: System performance analysis

#### Domain-Specific Documentation
- Each domain folder contains relevant documentation
- Service-specific README files for complex services
- Integration guides for external systems
- Troubleshooting guides for common issues

### Asset Management

#### Static Assets (`public/`)
- **Images**: Optimized image assets for the application
- **Icons**: Application icons and favicons
- **PWA Files**: Progressive Web App manifest and service worker
- **Static Resources**: CSS, fonts, and other static resources

#### User Uploads (`uploads/`)
- **Documents**: User-uploaded legal documents and certificates
- **Images**: Property images and user-uploaded photos
- **Processed**: System-processed files and generated documents
- **Secure Storage**: Encrypted storage for sensitive documents

### Development Workflow Structure

#### Environment Configuration
- **Development**: Local development with hot reloading
- **Staging**: Pre-production testing environment
- **Production**: Live production environment
- **Testing**: Isolated testing environment for CI/CD

#### Build & Deployment Pipeline
- **Continuous Integration**: Automated testing and quality checks
- **Continuous Deployment**: Automated deployment to staging and production
- **Quality Gates**: Code quality, security, and performance thresholds
- **Monitoring**: Comprehensive application and infrastructure monitoring

This structure supports a comprehensive land verification system with robust testing, monitoring, and deployment capabilities specifically designed for the Kenyan market while maintaining scalability and security standards.