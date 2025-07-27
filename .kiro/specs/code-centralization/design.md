# Design Document

## Overview

This design outlines the centralization of redundant helper/utility code, memoization patterns, state management, and error handling across the TripleCheck application. The solution builds upon existing shared utilities while introducing new centralized patterns to eliminate code duplication and improve maintainability.

The design follows a layered approach:
- **Foundation Layer**: Enhanced shared utilities and helper functions
- **Hook Layer**: Centralized custom hooks for common patterns
- **Component Layer**: Higher-order components and standardized patterns
- **Integration Layer**: Migration strategy and backward compatibility

## Architecture

### Current State Analysis

The codebase already has strong foundations:
- Comprehensive error handling utilities in `src/shared/utils/error-handling.ts`
- Advanced form validation system in `src/shared/utils/form-validation.ts`
- Robust form hooks (`useForm.ts`, `useFormValidation.ts`)
- Zod-based validation schemas in `src/shared/utils/validation.ts`

### Identified Redundancies

1. **Search State Management**: Multiple components implement similar search query state with URL parameter parsing
2. **Toast Notification Patterns**: Extensive `useToast` usage with repetitive success/error patterns
3. **Navigation Utilities**: Similar navigation functions across components
4. **Animation Patterns**: Repeated animation delay and variant configurations
5. **File Handling**: Duplicated file size formatting and validation logic
6. **Loading States**: Similar loading/error state patterns across components

### Centralization Strategy

The design introduces new centralized utilities while preserving existing functionality:

```
src/shared/
├── hooks/                    # Enhanced with new centralized hooks
│   ├── useSearchState.ts     # NEW: Centralized search functionality
│   ├── useLoadingState.ts    # NEW: Standardized loading patterns
│   ├── useNavigationHelpers.ts # NEW: Navigation utilities
│   ├── useToastPatterns.ts   # NEW: Standardized toast patterns
│   └── [existing hooks...]   # Enhanced existing hooks
├── utils/                    # Enhanced with new utilities
│   ├── url-utils.ts          # NEW: URL parameter handling
│   ├── animation-utils.ts    # NEW: Animation configurations
│   ├── format-utils.ts       # NEW: Data formatting functions
│   ├── file-utils.ts         # NEW: File handling utilities
│   ├── toast-utils.ts        # NEW: Toast pattern utilities
│   └── [existing utils...]   # Enhanced existing utilities
├── components/               # Enhanced with HOCs
│   ├── hoc/                  # NEW: Higher-order components
│   │   ├── withErrorBoundary.tsx
│   │   ├── withLoadingState.tsx
│   │   └── withFormValidation.tsx
│   └── [existing components...]
└── patterns/                 # NEW: Reusable patterns
    ├── memoization.ts        # Standardized memoization patterns
    └── performance.ts        # Performance optimization utilities
```

## Components and Interfaces

### 1. Centralized Search State Hook

```typescript
// src/shared/hooks/useSearchState.ts
interface SearchStateOptions {
  initialQuery?: string;
  debounceMs?: number;
  syncWithUrl?: boolean;
  urlParam?: string;
  onSearch?: (query: string) => void;
}

interface SearchStateReturn {
  query: string;
  debouncedQuery: string;
  isSearching: boolean;
  setQuery: (query: string) => void;
  clearQuery: () => void;
  searchHistory: string[];
}

export function useSearchState(options?: SearchStateOptions): SearchStateReturn
```

### 2. Centralized Loading State Hook

```typescript
// src/shared/hooks/useLoadingState.ts
interface LoadingStateOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryAttempts?: number;
}

interface LoadingStateReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  success: boolean;
  execute: (asyncFn: () => Promise<T>) => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

export function useLoadingState<T>(options?: LoadingStateOptions<T>): LoadingStateReturn<T>
```

### 3. Navigation Helpers Hook

```typescript
// src/shared/hooks/useNavigationHelpers.ts
interface NavigationHelpers {
  navigateWithFallback: (to: string, fallback?: string) => void;
  navigateBack: (fallback?: string) => void;
  buildUrl: (path: string, params?: Record<string, string>) => string;
  parseCurrentParams: () => URLSearchParams;
  isCurrentPath: (path: string) => boolean;
}

export function useNavigationHelpers(): NavigationHelpers
```

### 4. Toast Patterns Hook

```typescript
// src/shared/hooks/useToastPatterns.ts
interface ToastPatterns {
  showSuccess: (message: string, options?: ToastOptions) => void;
  showError: (error: Error | string, options?: ToastOptions) => void;
  showLoading: (message: string) => () => void; // Returns dismiss function
  showFormSuccess: (action: string) => void;
  showFormError: (errors: Record<string, string>) => void;
  showApiError: (error: APIError) => void;
}

export function useToastPatterns(): ToastPatterns
```

### 5. URL Utilities

```typescript
// src/shared/utils/url-utils.ts
export interface ParsedSearchQuery {
  query: string;
  filters: Record<string, string>;
  page: number;
  sort: string;
}

export function parseSearchQuery(searchParams: URLSearchParams): ParsedSearchQuery
export function buildSearchUrl(base: string, params: Partial<ParsedSearchQuery>): string
export function updateUrlParams(params: Record<string, string>): void
export function getUrlParam(key: string, defaultValue?: string): string | undefined
```

### 6. Animation Utilities

```typescript
// src/shared/utils/animation-utils.ts
export interface AnimationConfig {
  duration: number;
  delay: number;
  easing: string;
}

export function createStaggeredAnimation(itemCount: number, baseDelay?: number): AnimationConfig[]
export function getAnimationDelayClass(index: number, baseDelay?: number): string
export const commonAnimationVariants: Record<string, any>
export function createFadeInVariant(direction?: 'up' | 'down' | 'left' | 'right'): any
```

### 7. Format Utilities

```typescript
// src/shared/utils/format-utils.ts
export function formatFileSize(bytes: number): string
export function formatCurrency(amount: number, currency?: string): string
export function formatDate(date: Date | string, format?: string): string
export function formatPhoneNumber(phone: string): string
export function truncateText(text: string, maxLength: number): string
export function formatPercentage(value: number, decimals?: number): string
```

### 8. File Utilities

```typescript
// src/shared/utils/file-utils.ts
export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}

export function validateFile(file: File, options?: FileValidationOptions): string | null
export function validateFiles(files: FileList, options?: FileValidationOptions): string[]
export function formatFileSize(bytes: number): string
export function getFileExtension(filename: string): string
export function isImageFile(file: File): boolean
export function createFilePreview(file: File): Promise<string>
```

### 9. Higher-Order Components

```typescript
// src/shared/components/hoc/withErrorBoundary.tsx
interface ErrorBoundaryOptions {
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolate?: boolean;
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: ErrorBoundaryOptions
): React.ComponentType<P>

// src/shared/components/hoc/withLoadingState.tsx
interface LoadingStateOptions {
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  minLoadingTime?: number;
}

export function withLoadingState<P extends object>(
  Component: React.ComponentType<P>,
  options?: LoadingStateOptions
): React.ComponentType<P & { loading?: boolean; error?: Error }>
```

### 10. Memoization Patterns

```typescript
// src/shared/patterns/memoization.ts
export function createMemoizedSelector<T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
): (state: T) => R

export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T

export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T

export const commonMemoizationPatterns: {
  expensiveComputation: <T>(fn: () => T, deps: React.DependencyList) => T;
  stableReference: <T>(value: T, deps: React.DependencyList) => T;
  conditionalMemo: <T>(condition: boolean, factory: () => T, deps: React.DependencyList) => T | undefined;
}
```

## Data Models

### Configuration Models

```typescript
// Centralized configuration for all utilities
export interface CentralizationConfig {
  search: {
    defaultDebounceMs: number;
    maxHistoryItems: number;
    syncWithUrl: boolean;
  };
  toast: {
    defaultDuration: number;
    maxVisible: number;
    position: 'top' | 'bottom' | 'center';
  };
  animation: {
    defaultDuration: number;
    defaultEasing: string;
    staggerDelay: number;
  };
  files: {
    maxSize: number;
    allowedTypes: string[];
    previewSize: number;
  };
}
```

### Migration Models

```typescript
// Track migration progress and compatibility
export interface MigrationStatus {
  component: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  oldPatterns: string[];
  newPatterns: string[];
  compatibility: 'full' | 'partial' | 'breaking';
}
```

## Error Handling

### Enhanced Error Handling Integration

The design builds upon the existing comprehensive error handling system:

```typescript
// Enhanced integration with existing error-handling.ts
export class CentralizationError extends APIError {
  constructor(
    message: string,
    context: 'search' | 'navigation' | 'animation' | 'file' | 'toast',
    originalError?: Error
  ) {
    super(message, 500, `CENTRALIZATION_${context.toUpperCase()}_ERROR`);
    this.details = { context, originalError };
  }
}

// Enhanced error patterns for centralized utilities
export const centralizedErrorPatterns = {
  searchError: (query: string, error: Error) => new CentralizationError(
    `Search failed for query: ${query}`,
    'search',
    error
  ),
  navigationError: (path: string, error: Error) => new CentralizationError(
    `Navigation failed to: ${path}`,
    'navigation',
    error
  ),
  fileValidationError: (filename: string, reason: string) => new CentralizationError(
    `File validation failed for ${filename}: ${reason}`,
    'file'
  )
};
```

### Error Recovery Strategies

```typescript
// Automatic error recovery for centralized utilities
export interface ErrorRecoveryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  recoverableErrors: string[];
  fallbackStrategies: Record<string, () => void>;
}

export function createErrorRecoveryWrapper<T extends (...args: any[]) => any>(
  fn: T,
  config: ErrorRecoveryConfig
): T
```

## Testing Strategy

### Unit Testing Approach

1. **Hook Testing**: Comprehensive testing of all centralized hooks using React Testing Library
2. **Utility Testing**: Pure function testing for all utility modules
3. **Integration Testing**: Testing interactions between centralized utilities
4. **Migration Testing**: Ensuring backward compatibility during migration

### Test Structure

```typescript
// Example test structure for centralized hooks
describe('useSearchState', () => {
  it('should handle search query updates with debouncing');
  it('should sync with URL parameters when enabled');
  it('should maintain search history');
  it('should handle error states gracefully');
});

// Example test for utility functions
describe('url-utils', () => {
  it('should parse search queries correctly');
  it('should build URLs with proper encoding');
  it('should handle edge cases and invalid inputs');
});
```

### Performance Testing

```typescript
// Performance benchmarks for centralized utilities
export interface PerformanceBenchmark {
  utility: string;
  operation: string;
  executionTime: number;
  memoryUsage: number;
  bundleSize: number;
}

export function benchmarkCentralizedUtilities(): PerformanceBenchmark[]
```

## Migration Strategy

### Phase 1: Foundation Setup
1. Create new utility modules and hooks
2. Implement comprehensive testing
3. Establish performance benchmarks
4. Create migration documentation

### Phase 2: Gradual Migration
1. Identify high-impact components for migration
2. Migrate one domain at a time (property, trust, user, etc.)
3. Maintain backward compatibility wrappers
4. Update tests and documentation

### Phase 3: Optimization and Cleanup
1. Remove deprecated patterns
2. Optimize bundle sizes
3. Performance monitoring and improvements
4. Final documentation updates

### Backward Compatibility Strategy

```typescript
// Compatibility wrappers for smooth migration
export function createCompatibilityWrapper<T>(
  oldImplementation: T,
  newImplementation: T,
  deprecationWarning: string
): T {
  return new Proxy(oldImplementation, {
    apply(target, thisArg, args) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`DEPRECATED: ${deprecationWarning}`);
      }
      return newImplementation.apply(thisArg, args);
    }
  });
}
```

## Performance Considerations

### Bundle Size Optimization
- Tree-shakeable utility functions
- Lazy loading of heavy utilities
- Code splitting for domain-specific patterns
- Bundle analysis and monitoring

### Runtime Performance
- Memoization of expensive computations
- Debouncing and throttling for user interactions
- Efficient state updates and re-renders
- Memory leak prevention

### Monitoring and Metrics

```typescript
// Performance monitoring for centralized utilities
export interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  memoryUsage: number;
  renderCount: number;
  errorRate: number;
}

export function trackCentralizationPerformance(): PerformanceMetrics
```

## Security Considerations

### Input Validation and Sanitization
- All centralized utilities include input validation
- XSS prevention in formatting utilities
- File upload security in file utilities
- URL parameter sanitization

### Error Information Disclosure
- Sanitized error messages for production
- Secure logging of sensitive operations
- Rate limiting for expensive operations

## Integration with Existing Systems

### Form System Integration
- Seamless integration with existing `useForm` and `useFormValidation` hooks
- Enhanced validation patterns using centralized utilities
- Improved error handling and user feedback

### API Integration
- Integration with existing API client and error handling
- Standardized loading states for API operations
- Consistent error reporting and recovery

### UI Component Integration
- Enhanced integration with existing design system components
- Standardized animation and interaction patterns
- Improved accessibility through centralized patterns

This design provides a comprehensive approach to centralizing redundant code while maintaining the existing architecture's strengths and ensuring smooth migration with minimal disruption to current functionality.