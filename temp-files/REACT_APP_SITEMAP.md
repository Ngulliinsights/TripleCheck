# TripleCheck: Current to New Structure Migration Map

## 🏗️ Foundation Layer (Simplified Configuration)

### Current Structure → New Structure

```
Current:                           New:
├── .env / .env.example           ├── .env / .env.example
├── package.json                  ├── package.json
├── tsconfig.json                 ├── tsconfig.json
├── tailwind.config.ts            ├── tailwind.config.ts
├── vite.config.ts                ├── vite.config.ts
├── drizzle.config.ts             ├── drizzle.config.ts
├── .husky/                       ├── .husky/
├── .vscode/                      ├── .vscode/
└── (scattered configs)           └── config/
                                      ├── app.config.ts           # NEW
                                      ├── build.config.ts         # NEW
                                      ├── database.config.ts      # NEW
                                      └── environment.config.ts   # NEW
```

**Migration Notes:** The new structure consolidates all configuration into a dedicated `config/` folder, moving away from scattered configuration files throughout the project.

## 🎯 Frontend Domain-Driven Structure

### Current Client Structure → New Domain Structure

```
Current client/src/                New src/
├── App.tsx                       ├── app/
├── main.tsx                      │   ├── App.tsx                 # MOVED
├── index.css                     │   ├── router.tsx              # NEW (extracted from App.tsx)
├── components/ (mixed)           │   ├── providers.tsx           # NEW
├── pages/ (mixed)                │   └── error-boundary.tsx     # MOVED from components/
├── hooks/ (mixed)                │
├── lib/                          ├── shared/
├── services/                     │   ├── components/ui/          # MOVED from components/ui/
├── config/                       │   ├── hooks/                  # MOVED from hooks/
├── styles/                       │   ├── utils/                  # MOVED from lib/
└── utils/                        │   ├── types/                  # NEW
                                  │   └── constants/              # NEW
                                  │
                                  ├── infrastructure/
                                  │   ├── api/                    # NEW
                                  │   ├── storage/                # NEW
                                  │   ├── monitoring/             # NEW
                                  │   └── security/               # NEW
```

### Domain Organization (New Structure)

```
├── 🏠 property/
│   ├── components/
│   │   ├── PropertyCard.tsx        # MOVED from components/listing-card.tsx
│   │   ├── PropertyForm.tsx        # NEW
│   │   ├── PropertyMap.tsx         # MOVED from components/maps/property-map.tsx
│   │   └── PropertyGallery.tsx     # NEW
│   ├── pages/
│   │   ├── PropertyDetails.tsx     # MOVED from pages/property.tsx
│   │   ├── PropertyEdit.tsx        # MOVED from pages/property-edit.tsx
│   │   ├── PropertyList.tsx        # NEW
│   │   └── PropertyCompare.tsx     # MOVED from pages/compare.tsx
│   ├── hooks/
│   │   ├── useProperty.ts          # NEW
│   │   └── usePropertySearch.ts    # EXTRACTED from components/property-search.tsx
│   ├── services/
│   │   ├── property-api.ts         # NEW
│   │   └── property-validation.ts  # NEW
│   └── types/
│       └── property.types.ts       # NEW
│
├── 🛡️ trust/
│   ├── components/
│   │   ├── TrustScore.tsx          # MOVED from components/trust-score.tsx
│   │   ├── VerificationBadge.tsx   # NEW
│   │   └── FraudAlert.tsx          # NEW
│   ├── pages/
│   │   ├── TrustDashboard.tsx      # NEW
│   │   ├── BasicChecks.tsx         # MOVED from pages/services/basic-checks.tsx
│   │   ├── FraudDetection.tsx      # MOVED from pages/services/fraud-detection.tsx
│   │   ├── DocumentAuth.tsx        # MOVED from pages/services/document-auth.tsx
│   │   └── Reports.tsx             # MOVED from pages/services/reports.tsx
│   ├── hooks/
│   │   ├── useTrustScore.ts        # NEW
│   │   └── useFraudDetection.ts    # NEW
│   ├── services/
│   │   ├── trust-api.ts            # NEW
│   │   └── verification-service.ts # NEW
│   └── types/
│       └── trust.types.ts          # NEW
│
├── 👤 user/
│   ├── components/
│   │   ├── UserProfile.tsx         # NEW
│   │   ├── UserDashboard.tsx       # MOVED from pages/dashboard.tsx
│   │   └── UserNotifications.tsx   # MOVED from components/notifications/
│   ├── pages/
│   │   ├── Profile.tsx             # NEW
│   │   ├── Dashboard.tsx           # MOVED from pages/dashboard.tsx
│   │   ├── Team.tsx                # MOVED from pages/team.tsx
│   │   └── Notifications.tsx       # NEW
│   ├── hooks/
│   │   ├── useUser.ts              # NEW
│   │   └── useUserNotifications.ts # NEW
│   ├── services/
│   │   ├── user-api.ts             # NEW
│   │   └── notification-service.ts # NEW
│   └── types/
│       └── user.types.ts           # NEW
│
├── 🔐 auth/
│   ├── components/
│   │   ├── LoginForm.tsx           # EXTRACTED from pages/auth/login.tsx
│   │   ├── RegisterForm.tsx        # EXTRACTED from pages/auth/register.tsx
│   │   └── AuthGuard.tsx           # NEW
│   ├── pages/
│   │   ├── Login.tsx               # MOVED from pages/auth/login.tsx
│   │   ├── Register.tsx            # MOVED from pages/auth/register.tsx
│   │   └── ForgotPassword.tsx      # NEW
│   ├── hooks/
│   │   ├── useAuth.ts              # EXTRACTED from hooks/use-stable-auth.ts
│   │   └── useAuthGuard.ts         # NEW
│   ├── services/
│   │   ├── auth-api.ts             # NEW
│   │   └── auth-storage.ts         # NEW
│   └── types/
│       └── auth.types.ts           # NEW
│
├── 🔍 search/
│   ├── components/
│   │   ├── SearchBar.tsx           # EXTRACTED from components/property-search.tsx
│   │   ├── SearchFilters.tsx       # MOVED from components/search/advanced-search.tsx
│   │   ├── SearchResults.tsx       # NEW
│   │   └── SearchDebug.tsx         # MOVED from components/search/search-debug.tsx
│   ├── pages/
│   │   ├── SearchResults.tsx       # MOVED from pages/search-results.tsx
│   │   └── AdvancedSearch.tsx      # NEW
│   ├── hooks/
│   │   ├── useSearch.ts            # NEW
│   │   └── useSearchFilters.ts     # NEW
│   ├── services/
│   │   ├── search-api.ts           # NEW
│   │   └── search-engine.ts        # NEW
│   └── types/
│       └── search.types.ts         # NEW
│
├── 💬 communication/
│   ├── components/
│   │   ├── MessageList.tsx         # NEW
│   │   ├── MessageComposer.tsx     # NEW
│   │   └── NotificationCenter.tsx  # MOVED from components/notifications/
│   ├── pages/
│   │   ├── Inbox.tsx               # MOVED from pages/inbox.tsx
│   │   └── Chat.tsx                # NEW
│   ├── hooks/
│   │   ├── useMessages.ts          # NEW
│   │   └── useNotifications.ts     # NEW
│   ├── services/
│   │   ├── message-api.ts          # NEW
│   │   └── notification-service.ts # NEW
│   └── types/
│       └── message.types.ts        # NEW
│
└── 📊 analytics/
    ├── components/
    │   ├── AnalyticsDashboard.tsx  # NEW
    │   └── MetricsChart.tsx        # NEW
    ├── pages/
    │   └── Analytics.tsx           # NEW
    ├── hooks/
    │   ├── useAnalytics.ts         # NEW
    │   └── useMetrics.ts           # NEW
    ├── services/
    │   ├── analytics-api.ts        # NEW
    │   └── metrics-service.ts      # NEW
    └── types/
        └── analytics.types.ts      # NEW
```

## 🖥️ Backend Domain-Driven Structure

### Current Server Structure → New Domain Structure

```
Current server/                   New server/
├── index.ts                     ├── main.ts                     # RENAMED
├── routes.ts                    ├── app.ts                      # NEW
├── types.ts                     ├── router.ts                   # NEW
├── lib/                         ├── middleware/                 # NEW
├── routes/                      │   ├── auth.middleware.ts      # MOVED from middleware/auth.ts
├── middleware/                  │   ├── validation.middleware.ts # MOVED from middleware/data-validation.ts
├── services/                    │   ├── error.middleware.ts     # MOVED from middleware/error-handler.ts
├── blockchain/                  │   └── logging.middleware.ts   # NEW
├── (various files)              │
                                ├── infrastructure/
                                │   ├── database/
                                │   │   └── connection.ts        # MOVED from lib/database.ts
                                │   ├── cache/
                                │   │   └── redis.client.ts      # NEW
                                │   ├── storage/
                                │   │   └── file.storage.ts      # MOVED from storage.ts
                                │   ├── email/
                                │   │   ├── email.service.ts     # MOVED from email-service.ts
                                │   │   └── email.templates.ts   # NEW
                                │   └── monitoring/
                                │       ├── logging.service.ts   # MOVED from logger.ts
                                │       └── health.service.ts    # NEW
```

### Domain Organization (Backend)

```
├── 🏠 property/
│   ├── property.controller.ts      # EXTRACTED from routes.ts
│   ├── property.service.ts         # NEW
│   ├── property.repository.ts      # NEW
│   └── property.validation.ts      # NEW
│
├── 🛡️ trust/
│   ├── trust.controller.ts         # EXTRACTED from routes.ts
│   ├── trust.service.ts            # NEW
│   ├── verification.service.ts     # NEW
│   └── community-trust.service.ts  # MOVED from community-trust-ai.ts
│
├── 👤 user/
│   ├── user.controller.ts          # EXTRACTED from routes.ts
│   ├── user.service.ts             # NEW
│   └── user.repository.ts          # NEW
│
├── 🔐 auth/
│   ├── auth.controller.ts          # MOVED from routes/auth.ts
│   ├── auth.service.ts             # NEW
│   └── token.service.ts            # NEW
│
├── 🔍 search/
│   ├── search.controller.ts        # NEW
│   ├── search.service.ts           # NEW
│   └── indexing.service.ts         # NEW
│
├── 💬 communication/
│   ├── message.controller.ts       # NEW
│   ├── message.service.ts          # NEW
│   └── notification.service.ts     # MOVED from services/notification-service.ts
│
├── 📊 analytics/
│   ├── analytics.controller.ts     # NEW
│   ├── analytics.service.ts        # NEW
│   └── metrics.service.ts          # NEW
│
└── 🤖 ai/
    ├── ai.controller.ts            # MOVED from ai-routes.ts
    ├── ai.service.ts               # MOVED from ai-service.ts
    └── ml-training.service.ts      # MOVED from ml-training.ts
```

## 🔧 Tools and Scripts Organization

### Current Scripts → New Tools Structure

```
Current scripts/                  New tools/
├── (various analysis files)     ├── data-management/
├── data-generation/              │   ├── database/
├── (various utilities)           │   │   ├── migrate.ts          # MOVED from setup-database.ts
│                                │   │   └── seed.ts             # NEW
│                                │   ├── data-generation/        # MOVED from scripts/data-generation/
│                                │   └── data-analysis/
│                                │       ├── performance-analyzer.ts # MOVED from code-analysis.ts
│                                │       └── usage-analyzer.ts   # NEW
│                                │
│                                ├── testing/
│                                │   ├── unit/                   # NEW
│                                │   ├── integration/            # NEW
│                                │   └── e2e/                    # NEW
│                                │
│                                ├── deployment/
│                                │   ├── build.ts               # NEW
│                                │   └── deploy.ts              # NEW
│                                │
│                                └── code-quality/
│                                    ├── lint.ts                # NEW
│                                    └── analyze.ts             # MOVED from code-analysis.ts
```

## 📋 Migration Strategy

### Phase 1: Foundation Setup (Week 1)

1. Create new folder structure
2. Move configuration files to `config/` folder
3. Set up new build and deployment scripts
4. Update package.json scripts

### Phase 2: Backend Migration (Week 2-3)

1. Create infrastructure layer
2. Migrate auth domain (highest priority)
3. Migrate property domain (core business logic)
4. Migrate user domain
5. Migrate remaining domains

### Phase 3: Frontend Migration (Week 4-5)

1. Set up new app structure with router and providers
2. Migrate shared components and utilities
3. Migrate auth domain components
4. Migrate property domain components
5. Migrate remaining domains

### Phase 4: Testing and Optimization (Week 6)

1. Update all tests to new structure
2. Performance optimization
3. Bundle size optimization
4. Documentation updates

## 🎯 Key Benefits of This Migration

The new structure provides several important advantages over the current mixed organization. First, it creates clear boundaries between different business concerns, making it much easier to understand what each part of the application does. When you need to work on property-related features, everything you need is in the property domain folder.

Second, this organization reduces the complex web of dependencies that currently exists. Instead of components, pages, and services scattered throughout the application, each domain contains its own complete set of functionality. This makes the code more maintainable and reduces the risk of breaking changes.

Third, the domain-driven approach enables better code splitting and performance optimization. Since each domain is self-contained, you can lazy-load entire domains only when they're needed, improving application startup time.

Finally, this structure makes the application much more scalable. As new features are added, they can be organized into appropriate domains without creating additional complexity in the overall architecture.

## 📝 Files That Need Special Attention

Some files in your current structure require careful consideration during migration:

- **components/ui/**: These shared UI components move to `shared/components/ui/` since they're used across domains
- **hooks/**: Domain-specific hooks move to their respective domains, while shared hooks go to `shared/hooks/`
- **lib/utils.ts**: Utility functions need to be evaluated - shared utilities go to `shared/utils/`, domain-specific ones to their respective domains
- **pages/services/**: These service-related pages map to the trust domain since they're primarily about verification and trust features
- **server/routes.ts**: This large file needs to be broken down into domain-specific controllers

The migration will require careful planning to ensure that dependencies are properly managed and that the application continues to function correctly throughout the transition process.
