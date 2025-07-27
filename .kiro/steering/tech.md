# TripleCheck - Technology Stack

## Core Technologies

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Tailwind CSS** with custom design system
- **React Router DOM** for client-side routing
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Framer Motion** for animations

### Backend
- **Node.js** with Express.js
- **TypeScript** throughout the stack
- **PostgreSQL** with Drizzle ORM
- **Session-based authentication** with Passport.js
- **WebSocket** support for real-time features
- **Redis** for caching (via ioredis)

### Database & ORM
- **PostgreSQL** as primary database
- **Drizzle ORM** with type-safe queries
- **Drizzle Kit** for migrations
- Schema located at `src/shared/schema.ts`

### Development Tools
- **ESLint** with TypeScript and security plugins
- **Prettier** for code formatting
- **Husky** for git hooks
- **Vitest** for unit testing
- **Playwright** for E2E testing
- **tsx** for TypeScript execution

### Deployment & Infrastructure
- **Vercel** for frontend deployment
- **Neon/Supabase** for database hosting
- **Railway/Render** for backend services
- Environment variables managed via `.env` files

## Common Commands

### Development
```bash
npm run dev          # Start development server (port 3003)
npm run build        # Build for production (client + server)
npm run build:client # Build frontend only
npm run build:server # Build backend only
npm run start        # Start production server
npm run preview      # Preview production build
```

### Database Management
```bash
npm run db:setup     # Set up database with initial schema
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate new migrations
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Drizzle Studio (database GUI)
npm run db:reset     # Reset database (development only)
npm run db:seed      # Seed database with sample data
```

### Testing & Quality Assurance
```bash
# Unit & Integration Testing
npm run test         # Run unit tests with Vitest
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ui      # Open Vitest UI

# End-to-End Testing
npm run test:e2e     # Run all E2E tests with Playwright
npm run test:e2e:auth # Run authentication E2E tests
npm run test:e2e:property # Run property management E2E tests
npm run test:e2e:headed # Run E2E tests in headed mode
npm run test:e2e:debug # Run E2E tests in debug mode

# Specialized Testing
npm run test:land-verification # Run land verification tests
npm run test:compatibility # Run backward compatibility tests
npm run test:performance # Run performance tests
npm run test:load # Run load testing
npm run test:deployment # Run deployment validation tests
```

### Code Quality & Security
```bash
# Code Quality
npm run lint         # Lint code with ESLint
npm run lint:fix     # Fix linting issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run check        # TypeScript type checking
npm run check:watch  # TypeScript checking in watch mode

# Security
npm run security:scan     # Run Snyk security scan
npm run security:audit    # Run npm audit
npm run security:full     # Complete security check suite
npm run security:analyze  # Analyze security vulnerabilities
npm run lint:security     # Run security-focused linting
```

### Data Management & Migration
```bash
# Data Generation
npm run data:generate     # Generate comprehensive test data
npm run data:load         # Load data through unified pipeline
npm run data:load-robust  # Robust data loading with checkpoints
npm run data:properties   # Generate property data (Python)
npm run data:users        # Generate user data (Python)
npm run data:fraud        # Generate fraud simulation data (Python)

# Data Migration
npm run migrate:run       # Run data migrations
npm run migrate:properties # Migrate existing properties
npm run migrate:seed      # Seed Kenya-specific properties
npm run migrate:validate  # Validate migration integrity
npm run migrate:test      # Test migration scripts
npm run migrate:rollback  # Rollback migrations

# Data Integrity
npm run integrity:check   # Check data integrity
npm run integrity:quick   # Quick integrity check
npm run integrity:detailed # Detailed integrity analysis
```

### Land Verification System
```bash
# Land Verification Testing
npm run test:land-verification:e2e # E2E land verification tests
npm run test:land-verification:integration # Integration tests
npm run test:land-verification:load # Load testing
npm run test:land-verification:security # Security tests

# Deployment & Monitoring
npm run deploy:land-verification # Deploy land verification system
npm run deploy:land-verification:dev # Deploy to development
npm run deploy:land-verification:staging # Deploy to staging
npm run deploy:land-verification:prod # Deploy to production
```

### Monitoring & Analytics
```bash
# System Monitoring
npm run monitor:start     # Start monitoring pipeline
npm run monitor:validate  # Validate monitoring setup
npm run monitor:health    # Check system health
npm run monitor:metrics   # View system metrics

# Performance Monitoring
npm run setup:monitoring  # Set up monitoring infrastructure
npm run setup:monitoring:dev # Set up dev monitoring
npm run setup:monitoring:staging # Set up staging monitoring
npm run setup:monitoring:prod # Set up production monitoring
```

### Deployment & Infrastructure
```bash
# Vercel Deployment
npm run deploy:vercel     # Deploy to Vercel production
npm run deploy:preview    # Deploy preview build
npm run vercel-build      # Vercel build command

# General Deployment
npm run deploy:setup      # Set up deployment infrastructure
npm run test:deployment:staging # Test staging deployment
npm run test:deployment:prod # Test production deployment
```

### Development Utilities
```bash
# Streaming & Demo
npm run stream:demo       # Run streaming JSON processor demo
npm run demo:streaming    # Run streaming demo
npm run demo:pause        # Pause streaming demo

# Maintenance
npm run clean            # Clean build artifacts
npm run prepare          # Husky git hooks setup
npm run postinstall      # Post-installation build
```

## Architecture Patterns

### Domain-Driven Design
- Code organized by business domains (`property`, `trust`, `user`, `auth`, etc.)
- Each domain has its own components, hooks, services, and types
- Shared utilities in `src/shared/`

### Type Safety
- Strict TypeScript configuration
- Zod schemas for runtime validation
- Drizzle ORM for type-safe database queries
- End-to-end type safety from database to UI

### Performance Optimizations
- Infinite scroll with virtualization
- Debounced search and API calls
- Optimized bundle splitting by domain
- WebSocket with polling fallbacks
- Image optimization with Sharp

### Security Best Practices
- Session-based authentication
- CSRF protection
- Rate limiting
- Input validation with Zod
- Security-focused ESLint rules
- Regular security audits