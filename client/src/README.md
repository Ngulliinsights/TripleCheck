# Frontend - Client Application

React-based frontend for African Property Trust (TripleCheck), providing user interfaces for property verification, fraud detection, and trust scoring.

## Architecture Overview

```
src/
├── shared/                # Shared components, services, and utilities
├── property/              # Property listing and management
├── land-verification/     # Land verification workflows
├── trust/                 # Trust scoring and community features
├── auth/                  # Authentication and user management
├── communication/         # Messaging and notifications
├── app/                   # App shell and routing
├── infrastructure/        # Frontend infrastructure (monitoring, API)
└── index.tsx              # Application entry point
```

## Core Modules

### Shared (`/shared/`)
**Purpose**: Reusable components, services, and utilities used across the application.

**Key Components**:
- **UI Components**: Button, Card, Dialog, Form elements (Radix UI + Tailwind)
- **Image Components**: ImageGallery, ImageShowcase, LazyImage
- **Property Components**: PropertyCard, PropertyFilters, PropertyWizard
- **Navigation**: Header, Footer, MobileNav, Breadcrumbs

**Services**:
- **API Client**: Unified API client with caching and error handling
- **Image Services**: Upload, validation, optimization
- **Performance**: Monitoring and optimization utilities

**See**: `/src/shared/README.md` for details

### Property (`/property/`)
**Purpose**: Property listing, search, and management features.

**Features**:
- Property search with filters
- Property details and gallery
- Property wizard for listing creation
- Property comparison

### Land Verification (`/land-verification/`)
**Purpose**: Land verification workflows and dashboards.

**Features**:
- Verification wizard (step-by-step process)
- Document upload and analysis
- GPS coordinate validation
- Community trust integration
- Risk assessment visualization

### Trust (`/trust/`)
**Purpose**: Community trust scoring and social features.

**Features**:
- Trust dashboard
- Community reviews and ratings
- Trust score visualization
- Alert management

### Authentication (`/auth/`)
**Purpose**: User authentication and account management.

**Features**:
- Login and registration
- Password reset
- Two-factor authentication
- User profile management

## Technology Stack

- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **UI Library**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

## Key Patterns

### Component Structure
```typescript
// Feature-based organization
feature/
├── components/           # Feature-specific components
├── hooks/               # Feature-specific hooks
├── pages/               # Route components
├── services/            # API integration
├── types/               # TypeScript types
└── index.ts             # Public exports
```

### Data Fetching
Using TanStack Query for server state:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['properties', filters],
  queryFn: () => propertyApi.search(filters)
})
```

### Form Handling
Using React Hook Form + Zod:
```typescript
const form = useForm({
  resolver: zodResolver(propertySchema),
  defaultValues: { ... }
})
```

## Styling

**Approach**: Utility-first with Tailwind CSS

**Theme**: Configured in `tailwind.config.js`
- Colors: Primary (blue), secondary (green), accent (orange)
- Typography: Inter font family
- Spacing: 4px base unit
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

**Component Styling**:
- Radix UI for accessible primitives
- Custom variants using `class-variance-authority`
- Responsive design with mobile-first approach

## Performance Optimization

### Code Splitting
```typescript
const PropertyDetails = lazy(() => import('./property/pages/PropertyDetails'))
```

### Image Optimization
- Lazy loading with Intersection Observer
- Responsive images with srcset
- WebP format with fallbacks
- Image compression and resizing

### Caching Strategy
- API responses cached with React Query
- Static assets cached with service worker
- Optimistic updates for better UX

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

## Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
VITE_HF_TOKEN=your_huggingface_token
VITE_ENABLE_ANALYTICS=true
```

## Routing Structure

```
/                          # Home page
/properties                # Property search
/properties/:id            # Property details
/verification              # Land verification
/verification/new          # New verification
/trust                     # Trust dashboard
/auth/login                # Login
/auth/register             # Registration
/profile                   # User profile
```

## Related Documentation

- `/adr/002-image-gallery-refactoring.md` - Image component architecture
- `/adr/006-navigation-architecture.md` - Navigation decisions
- `/adr/007-property-components.md` - Property component design
- `/src/shared/README.md` - Shared components and services
