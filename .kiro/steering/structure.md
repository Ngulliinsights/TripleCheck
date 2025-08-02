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
├── migrations/             # Database migration files
├── reports/                # Generated analysis and performance reports
├── playwright-report/      # Playwright test execution reports
├── .kiro/                  # Kiro IDE configuration and steering files
├── .cache/                 # Build and development cache
├── .config/                # Tool configurations
└── [Configuration files]   # package.json, tsconfig.json, vite.config.ts, etc.
```

## Frontend Structure (`src/`)

### Domain-Driven Architecture
Each business domain follows a consistent structure:

```
src/
├── shared/                 # Cross-domain utilities and components
│   ├── components/         # Reusable UI components (60+ design system components)
│   │   ├── layout/         # Layout components (AppLayout, Navigation, Footer, MobileNav)
│   │   ├── ui/             # Complete design system (40+ components: button, form, input, dialog, table, etc.)
│   │   ├── navigation/     # Navigation components (BreadcrumbNavigation, ContextualSidebar, etc.)
│   │   ├── forms/          # Form components (FileUpload, FormField)
│   │   ├── hero/           # Hero section components (ConversionHero, EnhancedHero)
│   │   ├── blog/           # Blog components (BlogPostCard, BlogPostSkeleton)
│   │   ├── fallbacks/      # Error fallback components
│   │   └── examples/       # Component examples and demos
│   ├── hooks/              # Custom React hooks (useDebounce, useGeolocation, useSafeQuery, etc.)
│   ├── pages/              # Marketing pages (Home, Features, Community, etc.)
│   ├── services/           # API client and shared services
│   ├── utils/              # Utility functions and validation (api-client, performance utils)
│   ├── types/              # Shared TypeScript types
│   ├── styles/             # Global styles and CSS
│   ├── config/             # Configuration files
│   ├── constants/          # Application constants
│   ├── lib/                # Third-party library configurations
│   ├── test-utils/         # Testing utilities
│   └── schema.ts           # Database schema (Drizzle ORM)
├── property/               # Property management domain
│   ├── components/         # Property-specific components
│   ├── contexts/           # Property contexts
│   ├── hooks/              # Property hooks
│   ├── pages/              # Property pages
│   ├── services/           # Property services
│   ├── types/              # Property types
│   ├── utils/              # Property utilities
│   └── tests/              # Property tests
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
│   ├── hooks/              # Infrastructure hooks (useSafeEffect, useCoordinatedState)
│   ├── cache/              # Client-side caching
│   ├── realtime/           # Real-time communication
│   ├── security/           # Security utilities
│   ├── service-worker/     # PWA service worker
│   ├── services/           # Infrastructure services
│   ├── storage/            # Storage utilities
│   └── utils/              # Infrastructure utilities
├── app/                    # Application root and routing
│   ├── App.tsx             # Main application component
│   ├── router.tsx          # Route configuration
│   ├── providers.tsx       # Context providers setup
│   ├── lazy-routes.tsx     # Code splitting implementation
│   ├── error-boundary.tsx  # Global error handling
│   └── __tests__/          # App-level tests
├── types/                  # Global type definitions
│   ├── google-maps.d.ts    # Google Maps type definitions
│   ├── land-verification.ts # Land verification types
│   └── react-window-infinite-loader.d.ts # Third-party type definitions
├── utils/                  # Performance utilities
│   ├── bundle-optimizer.ts # Bundle optimization
│   └── performance-optimizer.ts # Performance optimization
├── lib/                    # Empty directory for future library integrations
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
├── test-db-connection.ts   # Database connection testing
└── test-integration.ts     # Integration testing utilities
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
│   │   ├── DocumentIntegration.ts # Document integration layer
│   │   ├── ServiceFactory.ts # Service factory pattern
│   │   ├── routes.ts       # Land verification routes
│   │   ├── __tests__/      # Comprehensive test suite
│   │   ├── performance/    # Performance optimization layer
│   │   ├── security/       # Security and access control
│   │   ├── error-handling/ # Error management
│   │   ├── errors/         # Error definitions
│   │   ├── monitoring/     # Metrics and alerting
│   │   ├── middleware/     # Verification middleware
│   │   ├── cache/          # Caching layer
│   │   ├── audit/          # Audit logging
│   │   ├── health/         # Health checks
│   │   ├── resilience/     # Resilience patterns
│   │   └── utils/          # Utility functions
│   │
│   ├── fraud-detection/    # Advanced fraud detection system
│   │   ├── core/           # Fraud detection engine
│   │   ├── analytics/      # ML analytics and network analysis
│   │   ├── services/       # Case management and compliance
│   │   ├── api/            # Fraud detection API
│   │   ├── routes/         # Fraud detection routes
│   │   ├── tests/          # Fraud detection tests
│   │   ├── utils/          # Fraud detection utilities
│   │   ├── integrate-real-data.ts # Real data integration
│   │   ├── test-system.js  # System testing
│   │   └── validate-backend.js # Backend validation
│   │
│   ├── document-auth/      # Document authentication system
│   │   ├── core/           # Document authentication engine
│   │   ├── analyzers/      # Document analysis (visual, signature, ML)
│   │   ├── types/          # Document authentication types
│   │   ├── DocumentAuthService.ts # Main service
│   │   ├── routes.ts       # Document authentication routes
│   │   └── test-document-auth.ts # Testing utilities
│   │
│   ├── ai/                 # AI and machine learning services
│   │   ├── ai.controller.ts # AI API endpoints
│   │   ├── ai.service.ts   # AI service coordination
│   │   ├── community-trust-ai.ts # Community trust algorithms
│   │   ├── community-trust-ai-root.ts # Root AI service
│   │   ├── ml-training.ts  # Model training pipelines
│   │   ├── ml-training-root.ts # Root ML training
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
│   │   ├── monitoring/     # Logging and monitoring
│   │   └── cache/          # Infrastructure caching
│   │
│   ├── cache/              # Redis caching layer
│   │   └── CacheService.ts # Caching implementation
│   │
│   ├── security/           # Security hardening
│   │   └── SecurityHardening.ts # Security policies
│   │
│   ├── monitoring/         # System monitoring
│   │   ├── HealthMonitor.ts # Health monitoring
│   │   └── StructuredLogger.ts # Structured logging
│   │
│   ├── config/             # Configuration management
│   │   └── development.ts  # Development configuration
│   │
│   └── middleware/         # Express middleware
│       ├── auth.middleware.ts # Authentication middleware
│       ├── auth.ts         # Auth utilities
│       ├── error.middleware.ts # Error handling
│       ├── error-handler.ts # Error handler utilities
│       ├── logging.middleware.ts # Request logging
│       ├── validation.middleware.ts # Input validation
│       ├── cache.middleware.ts # Cache middleware
│       ├── data-validation.ts # Data validation
│       ├── centralized-error-handler.ts # Global error handling
│       └── __tests__/      # Middleware tests
│
├── ROUTING & API/
│   ├── routes/             # API route definitions
│   │   ├── index.ts        # Route registry
│   │   ├── PropertyRoutes.ts # Property routes
│   │   ├── AuthRoutes.ts   # Authentication routes
│   │   ├── auth.ts         # Auth route utilities
│   │   ├── verification.routes.ts # Land verification routes
│   │   ├── reviews.routes.ts # Review system routes
│   │   ├── ai-routes.ts    # AI service routes
│   │   ├── ml-routes.ts    # Machine learning routes
│   │   ├── community-trust-routes.ts # Community trust routes
│   │   ├── community-intelligence.routes.ts # Community intelligence
│   │   ├── community-resources.routes.ts # Community resources
│   │   ├── document-verification.routes.ts # Document verification
│   │   ├── fraud-intelligence.routes.ts # Fraud intelligence
│   │   ├── secure-document-routes.ts # Secure document handling
│   │   ├── email-routes.ts # Email service routes
│   │   ├── payments.ts     # Payment processing routes
│   │   ├── users.routes.ts # User management routes
│   │   ├── seed.ts         # Database seeding routes
│   │   ├── demo-auth-routes.ts # Demo authentication
│   │   └── __tests__/      # Route tests
│   │
│   └── services/           # Business services
│       ├── PropertyService.ts # Property management
│       ├── AuthService.ts  # Authentication
│       ├── VerificationService.ts # Verification orchestration
│       ├── ReviewService.ts # Review system
│       ├── UserService.ts  # User management
│       ├── email-service.ts # Email communication
│       ├── mpesa-service.ts # Kenyan payment integration
│       ├── notification-service.ts # Multi-channel notifications
│       ├── ai-service.ts   # AI service coordination
│       ├── CommunityIntelligenceService.ts # Community intelligence
│       ├── CommunityResourcesService.ts # Community resources
│       ├── DocumentAuthenticationService.ts # Document authentication
│       ├── FraudIntelligenceService.ts # Fraud intelligence
│       └── __tests__/      # Service tests
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
    ├── auth/               # Authentication tests
    ├── ai-integration-validation.test.ts # AI integration tests
    ├── api-validation.test.ts # API validation tests
    ├── application-validation.test.ts # Application tests
    ├── backend-api-comprehensive.test.ts # Backend API tests
    ├── backward-compatibility.test.ts # Compatibility tests
    ├── compatibility-validation.test.ts # Validation tests
    ├── comprehensive-validation.test.ts # Full system tests
    ├── file-upload-validation.test.ts # File upload tests
    ├── load-test-validation.ts # Load testing
    ├── performance-validation.test.ts # Performance validation
    ├── quick-validation.test.ts # Quick validation suite
    ├── setup.ts            # Test setup utilities
    ├── test-setup.ts       # Additional test setup
    ├── validate-api-fixes.test.ts # API fix validation
    ├── validate-system-integration.ts # System integration
    └── [Various specialized test files] # Domain-specific test suites
```

## Configuration Files

### Core Configuration
- `package.json` - Dependencies and scripts (200+ npm scripts)
- `tsconfig.json` - TypeScript configuration
- `tsconfig.deploy.json` - Deployment-specific TypeScript config
- `vite.config.ts` - Frontend build configuration
- `drizzle.config.ts` - Database ORM configuration
- `tailwind.config.ts` - CSS framework configuration
- `postcss.config.js` - PostCSS configuration
- `eslint.config.js` - Code linting rules

### Testing Configuration
- `playwright.config.ts` - E2E testing configuration
- `vitest.config.ts` - Unit testing configuration
- `vitest.workspace.ts` - Vitest workspace configuration
- `vitest.chunk-[1-19].config.ts` - Chunked test configurations for parallel execution

### Deployment Configuration
- `vercel.json` - Vercel deployment configuration
- `render.yaml` - Render deployment configuration
- `railway.json` - Railway deployment configuration
- `firebase.json` - Firebase deployment configuration

### Environment Configuration
- `.env` - Environment variables
- `.env.example` - Environment variable template
- `.gitignore` - Git ignore rules
- `.vercelignore` - Vercel ignore rules
- `.snyk` - Snyk security configuration

### Development Configuration
- `index.html` - HTML entry point
- `theme.json` - Theme configuration
- `desktop.ini` - Windows desktop configuration

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
│   ├── land-verification-generator.py # Land verification test data
│   ├── community-insights-generator.py # Community intelligence data
│   ├── fraud-reports-generator.py # Fraud analysis reports
│   ├── checkpoint-manager.ts # Data generation checkpoints
│   ├── integrate-data.ts   # Data integration utilities
│   └── [Generated datasets] # JSON datasets and statistics
├── data-migration/         # Database migration utilities
│   ├── migrate-existing-properties.ts # Legacy data migration
│   ├── seed-kenya-properties.ts # Kenya-specific seeding
│   ├── run-migration.ts    # Migration execution
│   ├── validate-migration.ts # Migration validation
│   ├── robust-batch-loader.ts # Robust data loading with error handling
│   ├── database-manager.ts # Database management utilities
│   ├── quality-gates.ts    # Data quality validation
│   ├── rollback-migration.ts # Migration rollback utilities
│   └── test-migration.ts   # Migration testing
├── deployment/             # Deployment automation
│   ├── docker-compose.land-verification.yml # Container orchestration
│   ├── kubernetes/         # Kubernetes deployment configs
│   ├── grafana/           # Monitoring dashboard setup
│   ├── setup-monitoring.ts # Monitoring infrastructure
│   ├── deployment-tests.ts # Deployment validation
│   └── validate-deployment.ts # Deployment health checks
├── debug/                  # Debugging utilities
│   ├── stop-infinite-queries.ts # Query debugging
│   └── test-server-start.ts # Server startup testing
├── performance/            # Performance testing
│   └── api-performance-test.ts # API performance validation
├── security/               # Security utilities
│   └── bug-categorization.ts # Security bug analysis
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

### Kiro IDE Integration

#### Kiro Configuration (`.kiro/`)
- **Steering Files**: Context and guidance documents in `.kiro/steering/`
- **Settings**: IDE configuration in `.kiro/settings/`
- **Specs**: Feature specifications and implementation plans
- **Hooks**: Automated agent execution triggers

#### Analysis & Reports (`temp-files/`)
- **Code Analysis Reports**: Automated code quality analysis
- **Data Generation Reports**: Data pipeline and generation reports
- **Project Sitemaps**: Structural analysis and mapping
- **Performance Reports**: System performance analysis
- **Implementation Summaries**: Feature implementation documentation

### Development Workflow Enhancements

#### Chunked Testing Strategy
- **Parallel Test Execution**: 19 chunked Vitest configurations for faster testing
- **Domain-Specific Tests**: Tests organized by business domain
- **Integration Test Suites**: Comprehensive integration testing across services
- **Performance Validation**: Dedicated performance testing infrastructure

#### Advanced Debugging & Diagnostics
- **Debug Applications**: Multiple debug entry points (`debug-app.tsx`, `diagnostic-app.tsx`)
- **Simple Test Apps**: Minimal test applications for isolated testing
- **Hook Testing**: Dedicated hook testing utilities (`test-safe-hooks.tsx`)
- **Router Testing**: Router migration and testing utilities

#### Comprehensive Script Ecosystem
- **200+ NPM Scripts**: Extensive automation covering all aspects of development
- **Data Pipeline Scripts**: Robust data generation and migration utilities
- **Security Scripts**: Automated security scanning and vulnerability analysis
- **Performance Scripts**: Load testing and performance optimization
- **Deployment Scripts**: Multi-platform deployment automation

This evolved structure supports a comprehensive land verification system with:
- **Advanced Testing Infrastructure**: Chunked parallel testing, comprehensive validation suites
- **Robust Development Tools**: Debug applications, diagnostic utilities, performance monitoring
- **Extensive Automation**: 200+ scripts covering all development lifecycle aspects
- **Kiro IDE Integration**: Native support for AI-assisted development workflows
- **Production-Ready Architecture**: Multi-platform deployment, monitoring, and security hardening
- **Kenya-Specific Localization**: Tailored for Kenyan land verification requirements

The structure maintains scalability and security standards while providing extensive tooling for efficient development and reliable deployment.