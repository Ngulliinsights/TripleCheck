# Shared - Reusable Components and Services

Shared components, services, hooks, and utilities used across the TripleCheck frontend application.

## Directory Structure

```
shared/
├── components/            # Reusable UI components
│   ├── ui/               # Base UI primitives (Radix + Tailwind)
│   ├── images/           # Image-related components
│   ├── property/         # Property-specific components
│   ├── navigation/       # Navigation components
│   └── fallbacks/        # Error boundaries and fallbacks
├── services/             # API clients and business logic
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
├── types/                # TypeScript type definitions
├── config/               # Configuration files
└── error-handling/       # Error handling utilities
```

## Component Library

### UI Components (`/components/ui/`)

**Purpose**: Base UI primitives built on Radix UI with Tailwind styling.

**Components**:
- **Form Elements**: Button, Input, Select, Checkbox, Radio, Switch
- **Layout**: Card, Dialog, Sheet, Tabs, Accordion
- **Feedback**: Alert, Toast, Progress, Skeleton
- **Data Display**: Table, Badge, Avatar, Tooltip

**Usage**:
```typescript
import { Button, Card, Dialog } from '@/shared/components/ui'

<Button variant="primary" size="lg">Click me</Button>
```

### Image Components (`/components/images/`)

**Purpose**: Advanced image handling with galleries, lazy loading, and optimization.

**Architecture** (see ADR 002):
- **ImageGallery**: Main router component
- **SimpleGallery**: Lightweight for basic use
- **AdvancedGallery**: Full-featured with search, filters, batch operations
- **ImageCard**: Individual image display
- **LazyImage**: Performance-optimized loading
- **Lightbox**: Fullscreen viewer

**Features**:
- Lazy loading with Intersection Observer
- Watermark support
- Batch operations (download, share, delete)
- Search and filtering
- Multiple view modes (grid, list, masonry)

**Usage**:
```typescript
import { ImageGallery } from '@/shared/components/images'

<ImageGallery
  images={images}
  enableSearch={true}
  enableFullscreen={true}
  onImageClick={handleClick}
/>
```

### Property Components (`/components/property/`)

**Purpose**: Property-specific UI components.

**Components**:
- **PropertyCard**: Property listing card
- **PropertyFilters**: Search and filter UI
- **PropertyWizard**: Multi-step property creation
- **PhotoManagementButton**: Image upload and management

### Navigation Components (`/components/navigation/`)

**Purpose**: Site navigation and breadcrumbs.

**Components**:
- **Navigation**: Main header navigation
- **MobileNav**: Mobile-optimized navigation
- **BreadcrumbNavigation**: Breadcrumb trail
- **ContextualSidebar**: Context-aware sidebar

## Services Layer

### API Client (`/services/unified-api-client.ts`)

**Purpose**: Centralized API communication with caching and error handling.

**Features**:
- Type-safe API calls
- Automatic retry logic
- Request deduplication
- Response caching
- Error handling and logging

**Usage**:
```typescript
import { unifiedApiClient } from '@/shared/services/unified-api-client'

const properties = await unifiedApiClient.get('/properties', { filters })
```

### Image Services (`/services/images/`)

**Purpose**: Image upload, validation, and processing.

**Architecture** (see ADR 003):
- **ImageServiceOrchestrator**: Main service coordinator
- **PropertyImageUploadService**: Upload handling
- **PropertyImageValidationService**: Image validation
- **ImageMetadataService**: Metadata extraction

**Usage**:
```typescript
import { getImageServiceOrchestrator } from '@/shared/services/images'

const orchestrator = getImageServiceOrchestrator()
const result = await orchestrator.processPropertyImage(file, 'title_deed')
```

### Performance Service (`/services/PerformanceService.ts`)

**Purpose**: Frontend performance monitoring and optimization.

**Features**:
- Core Web Vitals tracking
- Resource timing analysis
- User interaction metrics
- Performance budgets

## Custom Hooks

### Data Fetching Hooks
- `useProperties` - Property data fetching
- `useVerification` - Verification data
- `useTrustScore` - Trust score data

### UI Hooks
- `useToast` - Toast notifications
- `useDialog` - Dialog state management
- `useMediaQuery` - Responsive breakpoints

### Utility Hooks
- `useDebounce` - Debounced values
- `useLocalStorage` - Local storage sync
- `useIntersectionObserver` - Visibility detection

## Utilities

### Type Guards (`/utils/type-guards.ts`)
Type-safe runtime checks for TypeScript types.

### Formatters (`/utils/formatters.ts`)
- Currency formatting (KES)
- Date formatting
- Number formatting

### Validators (`/utils/validators.ts`)
- Email validation
- Phone number validation (Kenya)
- ID number validation

## Type Definitions

### API Contracts (`/types/contracts/`)
Type-safe API request/response definitions using Zod schemas.

### Domain Types (`/types/`)
- `property.ts` - Property-related types
- `verification.ts` - Verification types
- `trust.ts` - Trust scoring types
- `user.ts` - User types

## Error Handling

### Error Boundaries
- `ErrorBoundary` - Catch React errors
- `NavigationErrorBoundary` - Navigation-specific errors

### Error Types
- `ValidationError` - Form validation errors
- `ApiError` - API communication errors
- `AuthError` - Authentication errors

## Configuration

### Image System (`/config/image-system.config.ts`)
Configuration for image handling:
- Max file size
- Allowed formats
- Compression settings
- Watermark configuration

### API Configuration (`/config/api.config.ts`)
API client configuration:
- Base URL
- Timeout settings
- Retry configuration

## Design Principles

### 1. Reusability
All components are designed to be reused across features.

### 2. Type Safety
Full TypeScript coverage with strict type checking.

### 3. Performance
Optimized for fast loading and smooth interactions.

### 4. Accessibility
WCAG 2.1 AA compliance with Radix UI primitives.

### 5. Testability
Components are designed for easy testing.

## Related Documentation

- `/adr/002-image-gallery-refactoring.md` - Image component architecture
- `/adr/003-service-consolidation.md` - Service layer design
- `/src/README.md` - Frontend architecture overview
