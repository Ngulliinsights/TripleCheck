TripleCheck - Property Verification & Land Management System
================================================================

PROJECT ROOT/
├── Configuration & Build
│   ├── package.json [F0]
│   ├── tsconfig.json [F0]
│   ├── tsconfig.deploy.json [F0]
│   ├── vite.config.ts [F0]
│   ├── tailwind.config.ts [F0]
│   ├── vercel.json [F0]
│   └── theme.json [F0]
│
├── DATABASE & MIGRATION (Legacy)
│   ├── migrate.sql [F0] ⟵ Legacy schema migrations
│   ├── test-db.cjs [F0] ⟵ Database testing utilities
│   └── test-integration-simple.js [F0] ⟵ Integration test helpers
│
├── FRONTEND APPLICATION (src/)
│   ├── main.tsx [F1] ⟵ React App Entry Point
│   ├── app/
│   │   ├── App.tsx [F2] ⟵ Main App Component
│   │   ├── router.tsx [F2] ⟵ Route Configuration
│   │   ├── lazy-routes.tsx [F2] ⟵ Code Splitting
│   │   ├── providers.tsx [F2] ⟵ Context Providers
│   │   └── error-boundary.tsx [F2] ⟵ Error Handling
│   │
│   ├── FEATURE MODULES/
│   │   ├── auth/ ⟵ Authentication System
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx [F3]
│   │   │   │   ├── RegistrationWizard.tsx [F3]
│   │   │   │   ├── PasswordReset.tsx [F3]
│   │   │   │   └── TwoFactorAuth.tsx [F3]
│   │   │   ├── pages/
│   │   │   │   ├── Login.tsx [F3]
│   │   │   │   └── Register.tsx [F3]
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts [F3]
│   │   │   └── services/
│   │   │       └── auth-api.ts [F3]
│   │   │
│   │   ├── property/ ⟵ Property Management
│   │   │   ├── components/
│   │   │   │   ├── PropertyCard.tsx [F3]
│   │   │   │   ├── PropertyGallery.tsx [F3]
│   │   │   │   ├── PropertyListingWizard.tsx [F3]
│   │   │   │   ├── PropertyMap.tsx [F3]
│   │   │   │   └── wizard-steps/ ⟵ Multi-step Forms
│   │   │   │       ├── BasicDetailsStep.tsx [F4]
│   │   │   │       ├── LocationStep.tsx [F4]
│   │   │   │       ├── ImagesStep.tsx [F4]
│   │   │   │       └── PreviewStep.tsx [F4]
│   │   │   ├── pages/
│   │   │   │   ├── PropertyDetails.tsx [F3]
│   │   │   │   ├── ListProperty.tsx [F3]
│   │   │   │   ├── PropertyCompare.tsx [F3]
│   │   │   │   └── CommercialProperties.tsx [F3]
│   │   │   └── services/
│   │   │       └── property-api.ts [F3]
│   │   │
│   │   ├── land-verification/ ⟵ Core Land Verification System
│   │   │   ├── components/
│   │   │   │   ├── LandVerificationDashboard.tsx [F3]
│   │   │   │   ├── VerificationWizard.tsx [F3]
│   │   │   │   ├── RiskAssessmentDisplay.tsx [F3]
│   │   │   │   ├── ExpertCoordinationInterface.tsx [F3]
│   │   │   │   └── KenyaLandEducation.tsx [F3] ⟵ Local Context
│   │   │   ├── pages/
│   │   │   │   ├── LandVerificationPage.tsx [F3]
│   │   │   │   └── NewVerificationPage.tsx [F3]
│   │   │   └── services/
│   │   │       └── HelpDocumentationService.ts [F3]
│   │   │
│   │   ├── trust/ ⟵ Trust & Fraud Detection
│   │   │   ├── components/
│   │   │   │   ├── FraudDetectionDashboard.tsx [F3]
│   │   │   │   ├── TrustScore.tsx [F3]
│   │   │   │   └── DocumentAuthentication.tsx [F3]
│   │   │   ├── pages/
│   │   │   │   ├── FraudDetection.tsx [F3]
│   │   │   │   ├── Reviews.tsx [F3]
│   │   │   │   └── Reputation.tsx [F3]
│   │   │   └── services/
│   │   │       └── fraudDetectionApi.ts [F3]
│   │   │
│   │   ├── search/ ⟵ Search & Discovery
│   │   │   ├── components/
│   │   │   │   ├── PropertySearch.tsx [F3]
│   │   │   │   ├── AdvancedSearch.tsx [F3]
│   │   │   │   └── SearchFilters.tsx [F3]
│   │   │   └── pages/
│   │   │       └── SearchResults.tsx [F3]
│   │   │
│   │   ├── communication/ ⟵ Messaging System
│   │   │   ├── components/
│   │   │   │   ├── MessageComposer.tsx [F3]
│   │   │   │   └── RealTimeNotifications.tsx [F3]
│   │   │   └── pages/
│   │   │       └── Inbox.tsx [F3]
│   │   │
│   │   └── user/ ⟵ User Management
│   │       ├── components/
│   │       │   └── UserProfile.tsx [F3]
│   │       └── pages/
│   │           ├── Dashboard.tsx [F3]
│   │           └── Team.tsx [F3]
│   │
│   ├── SHARED INFRASTRUCTURE/
│   │   ├── shared/ ⟵ Common Components & Utils
│   │   │   ├── components/
│   │   │   │   ├── layout/ ⟵ Layout Components
│   │   │   │   │   ├── AppLayout.tsx [F4]
│   │   │   │   │   ├── Navigation.tsx [F4]
│   │   │   │   │   └── Footer.tsx [F4]
│   │   │   │   ├── ui/ ⟵ Design System Components
│   │   │   │   │   ├── button.tsx [F4]
│   │   │   │   │   ├── form.tsx [F4]
│   │   │   │   │   ├── input.tsx [F4]
│   │   │   │   │   ├── dialog.tsx [F4]
│   │   │   │   │   └── [50+ UI Components]
│   │   │   │   └── OptimizedImage.tsx [F3]
│   │   │   ├── pages/ ⟵ Marketing & Info Pages
│   │   │   │   ├── Home.tsx [F3]
│   │   │   │   ├── Features.tsx [F3]
│   │   │   │   ├── Community.tsx [F3]
│   │   │   │   └── Fraud-resources.tsx [F3]
│   │   │   ├── hooks/ ⟵ Reusable React Hooks
│   │   │   │   ├── useDebounce.ts [F3]
│   │   │   │   ├── useGeolocation.ts [F3]
│   │   │   │   └── useFileUpload.ts [F3]
│   │   │   └── services/
│   │   │       └── api-client.ts [F3] ⟵ API Communication
│   │   │
│   │   └── infrastructure/ ⟵ Technical Infrastructure
│   │       ├── api/ ⟵ API Layer
│   │       │   ├── queryClient.ts [F3]
│   │       │   └── request-manager.ts [F3]
│   │       ├── monitoring/ ⟵ Performance Monitoring
│   │       │   ├── performance-monitor.ts [F3]
│   │       │   └── core-web-vitals.ts [F3]
│   │       ├── routing/ ⟵ Advanced Routing
│   │       │   └── route-preloader.ts [F3]
│   │       └── hooks/ ⟵ Infrastructure Hooks
│   │           ├── useCoordinatedState.ts [F3]
│   │           └── useSafeEffect.ts [F3]
│   │
│   └── types/ ⟵ TypeScript Definitions
│       ├── google-maps.d.ts [F2]
│       └── land-verification.ts [F2]
│
├── BACKEND SERVER (server/)
│   ├── main.ts [F1] ⟵ Server Entry Point
│   ├── app.ts [F1] ⟵ Express App Configuration
│   ├── index.ts [F1] ⟵ Server Bootstrap
│   │
│   ├── CORE SERVICES/
│   │   ├── land-verification/ ⟵ Land Verification Engine
│   │   │   ├── LandVerificationService.ts [F2] ⟵ Main Service
│   │   │   ├── PhysicalVerificationService.ts [F2]
│   │   │   ├── RiskAssessmentService.ts [F2]
│   │   │   ├── CommunityIntelligenceService.ts [F2]
│   │   │   ├── ExpertCoordinationService.ts [F2]
│   │   │   ├── ReportingService.ts [F2]
│   │   │   ├── MonitoringService.ts [F2]
│   │   │   ├── performance/ ⟵ Performance Optimization
│   │   │   │   ├── PerformanceManager.ts [F3]
│   │   │   │   ├── DatabaseOptimizer.ts [F3]
│   │   │   │   └── AsyncProcessor.ts [F3]
│   │   │   ├── security/ ⟵ Security Layer
│   │   │   │   ├── AccessControlService.ts [F3]
│   │   │   │   ├── EncryptionService.ts [F3]
│   │   │   │   └── PrivacyProtectionService.ts [F3]
│   │   │   ├── error-handling/ ⟵ Error Management
│   │   │   │   ├── ErrorHandlingService.ts [F3]
│   │   │   │   ├── RetryPolicyManager.ts [F3]
│   │   │   │   └── GracefulDegradationManager.ts [F3]
│   │   │   └── monitoring/ ⟵ System Monitoring
│   │   │       ├── MetricsService.ts [F3]
│   │   │       └── AlertingService.ts [F3]
│   │   │
│   │   ├── fraud-detection/ ⟵ Fraud Detection System
│   │   │   ├── core/
│   │   │   │   └── FraudDetectionEngine.ts [F3]
│   │   │   ├── analytics/
│   │   │   │   ├── MLAnalyticsEngine.ts [F3]
│   │   │   │   └── NetworkAnalysisService.ts [F3]
│   │   │   ├── services/
│   │   │   │   ├── CaseManagementService.ts [F3]
│   │   │   │   └── ComplianceReportingService.ts [F3]
│   │   │   └── api/
│   │   │       └── FraudDetectionAPI.ts [F3]
│   │   │
│   │   ├── document-auth/ ⟵ Document Authentication
│   │   │   ├── core/
│   │   │   │   └── DocumentAuthEngine.ts [F3]
│   │   │   ├── analyzers/ ⟵ Document Analysis
│   │   │   │   ├── LandDocumentAnalyzer.ts [F3]
│   │   │   │   ├── SignatureAnalyzer.ts [F3]
│   │   │   │   ├── VisualAnalyzer.ts [F3]
│   │   │   │   └── MLDocumentAnalyzer.ts [F3]
│   │   │   └── DocumentAuthService.ts [F2]
│   │   │
│   │   ├── ai/ ⟵ AI & Machine Learning
│   │   │   ├── ai.service.ts [F2]
│   │   │   ├── community-trust-ai.ts [F2]
│   │   │   ├── ml-training.ts [F2]
│   │   │   └── storage.ts [F2]
│   │   │
│   │   └── blockchain/ ⟵ Blockchain Integration
│   │       └── blockchain-service.ts [F2]
│   │
│   ├── BUSINESS LOGIC/
│   │   ├── property/ ⟵ Property Management
│   │   │   ├── property.controller.ts [F2]
│   │   │   ├── property.service.ts [F2]
│   │   │   └── property.repository.ts [F2]
│   │   │
│   │   ├── auth/ ⟵ Authentication
│   │   │   ├── auth.controller.ts [F2]
│   │   │   ├── auth.service.ts [F2]
│   │   │   └── AuthenticationService.ts [F2]
│   │   │
│   │   ├── user/ ⟵ User Management
│   │   │   └── user.controller.ts [F2]
│   │   │
│   │   ├── trust/ ⟵ Trust System
│   │   │   ├── community-trust.service.ts [F2]
│   │   │   ├── trust.controller.ts [F2]
│   │   │   └── TrustScoringService.ts [F2]
│   │   │
│   │   └── communication/ ⟵ Communication
│   │       ├── communication.controller.ts [F2]
│   │       └── notification.service.ts [F2]
│   │
│   ├── INFRASTRUCTURE/
│   │   ├── infrastructure/ ⟵ Infrastructure Services
│   │   │   ├── database/ ⟵ Comprehensive Database Infrastructure
│   │   │   │   ├── connection.ts [F3] ⟵ Database connection management
│   │   │   │   ├── config/
│   │   │   │   │   └── database.config.ts [F4] ⟵ Environment-based configuration
│   │   │   │   ├── types/
│   │   │   │   │   └── database.types.ts [F4] ⟵ TypeScript definitions
│   │   │   │   ├── utils/
│   │   │   │   │   └── database-utils.ts [F4] ⟵ Common operations
│   │   │   │   ├── migrations/
│   │   │   │   │   └── migrator.ts [F4] ⟵ Migration management
│   │   │   │   ├── seeds/
│   │   │   │   │   └── database-seeder.ts [F4] ⟵ Master seeding orchestrator
│   │   │   │   ├── init.ts [F3] ⟵ Database initialization
│   │   │   │   ├── integration.ts [F3] ⟵ Service integration layer
│   │   │   │   └── README.md [F3] ⟵ Database documentation
│   │   │   ├── email/
│   │   │   │   ├── email.service.ts [F3]
│   │   │   │   └── email-config.ts [F3]
│   │   │   ├── storage/
│   │   │   │   └── storage.ts [F3]
│   │   │   └── monitoring/
│   │   │       └── logging.service.ts [F3]
│   │   │
│   │   ├── db/ ⟵ Legacy Database Layer
│   │   │   ├── QueryOptimizer.ts [F2]
│   │   │   └── seeds/
│   │   │       └── land-verification-seed.ts [F3] ⟵ Legacy seeding
│   │   │
│   │   ├── middleware/ ⟵ Express Middleware
│   │   │   ├── auth.middleware.ts [F2]
│   │   │   ├── error.middleware.ts [F2]
│   │   │   ├── centralized-error-handler.ts [F2]
│   │   │   └── validation.middleware.ts [F2]
│   │   │
│   │   ├── cache/ ⟵ Caching Layer
│   │   │   └── CacheService.ts [F2]
│   │   │
│   │   └── security/ ⟵ Security Hardening
│   │       └── SecurityHardening.ts [F2]
│   │
│   ├── ROUTING & API/
│   │   ├── routes/ ⟵ API Routes
│   │   │   ├── index.ts [F2] ⟵ Route Registry
│   │   │   ├── PropertyRoutes.ts [F2]
│   │   │   ├── AuthRoutes.ts [F2]
│   │   │   ├── verification.routes.ts [F2]
│   │   │   ├── reviews.routes.ts [F2]
│   │   │   ├── ai-routes.ts [F2]
│   │   │   └── community-trust-routes.ts [F2]
│   │   │
│   │   └── services/ ⟵ Business Services
│   │       ├── PropertyService.ts [F2]
│   │       ├── AuthService.ts [F2]
│   │       ├── VerificationService.ts [F2]
│   │       ├── ReviewService.ts [F2]
│   │       └── UserService.ts [F2]
│   │
│   └── SHARED/
│       ├── types/ ⟵ Type Definitions
│       │   ├── api.types.ts [F2]
│       │   ├── property.types.ts [F2]
│       │   ├── verification.types.ts [F2]
│       │   └── fraud.types.ts [F2]
│       │
│       └── utils/ ⟵ Utilities
│           ├── constants.ts [F2]
│           ├── validators.ts [F2]
│           └── response-helpers.ts [F2]
│
├── AUTOMATION & SCRIPTS (scripts/)
│   ├── Data Generation & Management
│   │   ├── data-generation/ ⟵ Test Data Generation
│   │   │   ├── fraud-simulator.py [F2]
│   │   │   ├── property-generator.py [F2]
│   │   │   ├── user-generator.py [F2]
│   │   │   └── [Generated JSON datasets]
│   │   │
│   │   ├── data-migration/ ⟵ Database Migration
│   │   │   ├── migrate-existing-properties.ts [F2]
│   │   │   ├── seed-kenya-properties.ts [F2]
│   │   │   ├── run-migration.ts [F2]
│   │   │   └── validate-migration.ts [F2]
│   │   │
│   │   ├── Database Management
│   │   │   ├── setup-database.ts [F1]
│   │   │   ├── reset-database.ts [F1]
│   │   │   ├── fix-database.ts [F1]
│   │   │   └── data-integrity-checker.ts [F1]
│   │   │
│   │   └── Data Loading
│   │       ├── unified-data-pipeline.ts [F1]
│   │       ├── robust-batch-loader.ts [F1]
│   │       └── streaming-json-processor.ts [F1]
│   │
│   ├── Deployment & Infrastructure
│   │   ├── deployment/ ⟵ Deployment Configuration
│   │   │   ├── docker-compose.land-verification.yml [F2]
│   │   │   ├── kubernetes/
│   │   │   │   └── land-verification-deployment.yaml [F3]
│   │   │   ├── grafana/ ⟵ Monitoring Setup
│   │   │   │   └── provisioning/ [Multiple Config Files]
│   │   │   ├── prometheus.yml [F2]
│   │   │   ├── alert_rules.yml [F2]
│   │   │   └── setup-monitoring.ts [F2]
│   │   │
│   │   ├── deploy-setup.ts [F1]
│   │   ├── deploy-land-verification.ts [F1]
│   │   └── validate-deployment.ts [F2]
│   │
│   ├── Testing & Quality Assurance
│   │   ├── run-e2e-tests.js [F1]
│   │   ├── run-accessibility-tests.js [F1]
│   │   ├── test-frontend-functionality.ts [F1]
│   │   ├── quality-gates.ts [F1]
│   │   └── self-monitoring-pipeline.ts [F1]
│   │
│   └── System Maintenance
│       ├── checkpoint-manager.ts [F1]
│       ├── api-race-condition-detector.ts [F1]
│       └── quick-recovery.ts [F1]
│
├── COMPREHENSIVE TESTING (tests/)
│   ├── e2e/ ⟵ End-to-End Tests
│   │   ├── auth-workflows.spec.ts [F2]
│   │   ├── property-workflows.spec.ts [F2]
│   │   ├── complete-user-workflows.spec.ts [F2]
│   │   └── integration-workflows.spec.ts [F2]
│   │
│   └── [Additional test configurations and helpers]
│
├── DOCUMENTATION & ANALYSIS
│   ├── ANALYSIS_REPORTS.md [F0]
│   ├── APPROACH_METHODOLOGY.md [F0]
│   ├── docs/ ⟵ Project Documentation
│   │   ├── api/ [API Documentation]
│   │   ├── database/ [Database Schema Docs]
│   │   └── deployment/ [Deployment Guides]
│   │
│   └── temp-files/ ⟵ Analysis & Reports
│       ├── code-analysis-report.json [F1]
│       ├── data-generation-report.json [F1]
│       └── project-sitemap.txt [F1]
│
├── STATIC ASSETS
│   ├── public/ ⟵ Static Files
│   │   ├── images/ [Image Assets]
│   │   ├── icons/ [Icon Files]
│   │   └── site.webmanifest [F2]
│   │
│   └── uploads/ ⟵ User Uploads
│       ├── documents/ [Document Storage]
│       ├── images/ [Image Uploads]
│       └── processed/ [Processed Files]
│
└── DEVELOPMENT & BUILD
    ├── test-results/ ⟵ Test Outputs
    │   ├── e2e-junit.xml [F1]
    │   └── e2e-results.json [F1]
    │
    ├── .env [F0] ⟵ Environment Variables
    ├── .gitignore [F0]
    ├── README.md [F0]
    └── validate-integration.js [F0]

LEGEND:
========
[F0] = Root Level Files        [D0] = Root Level Directories
[F1] = Level 1 Files          [D1] = Level 1 Directories  
[F2] = Level 2 Files          [D2] = Level 2 Directories
[F3] = Level 3 Files          [D3] = Level 3 Directories
[F4] = Level 4 Files          [D4] = Level 4 Directories
[F5] = Level 5 Files          [D5] = Level 5 Directories

ARCHITECTURE HIGHLIGHTS:
=======================
• Full-Stack TypeScript Application (React + Node.js/Express)
• Microservices-Ready Architecture with Feature-Based Organization
• Comprehensive Land Verification System for Kenyan Market
• Advanced Fraud Detection with ML/AI Integration
• Document Authentication & Blockchain Integration
• Real-time Communication & Notification Systems
• Modernized Database Infrastructure with Migration & Seeding Systems
• Extensive Testing Framework (Unit, Integration, E2E)
• Production-Ready Deployment Infrastructure
• Performance Monitoring & Analytics
• Comprehensive Security Layer