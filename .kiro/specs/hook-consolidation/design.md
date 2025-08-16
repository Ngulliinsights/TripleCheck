# Design Document

## Overview

This design outlines the consolidation of 32+ React hooks into approximately 20 well-organized, non-overlapping hooks. The consolidation will eliminate redundancy, improve maintainability, and provide clearer patterns for developers while maintaining all existing functionality.

## Architecture

### Current State Analysis

Based on the codebase analysis, the following redundancies and overlaps have been identified:

**Direct Redundancies:**
- `useForm.ts` (basic) vs `useFormValidation.ts` (comprehensive)
- `useAccessibility.ts` (basic) vs `useAccessibility.tsx` (comprehensive)
- `usePerformanceMonitor.ts` vs `useComponentPerformance.ts`
- `useVirtualizationHelpers.ts` (config only) vs `useMemoryOptimization.ts` (implementation)

**Functional Overlaps:**
- `usePaginatedQuery.ts` vs `useInfiniteScroll.ts` (both handle pagination)
- `useProperty.ts` vs `useSafeQuery.ts` (enhanced data fetching)

### Target Architecture

The consolidated architecture will organize hooks into logical categories:

```
src/shared/hooks/
├── core/
│   ├── useFormValidation.ts      # Unified form handling
│   ├── useSafeQuery.ts          # Enhanced data fetching
│   └── usePagination.ts         # Unified pagination
├── ui/
│   ├── useAccessibility.tsx     # Comprehensive accessibility
│   └── useFileUpload.ts         # File upload with drag/drop
├── performance/
│   ├── useComponentPerformance.ts
│   └── useMemoryOptimization.ts
└── specialized/
    ├── usePropertySearch.ts
    ├── useWebSocket.ts
    └── useGeolocation.ts
```

## Components and Interfaces

### 1. Form Management Consolidation

**Target Hook:** `useFormValidation.ts` (enhanced)

**Consolidates:**
- `useForm.ts` (basic form handling)
- File upload functionality from `useForm.ts`

**Design:**
```typescript
interface ConsolidatedFormOptions {
  // Core form options
  initialValues: Record<string, any>;
  validationRules?: Record<string, ValidationRule>;
  
  // File upload options (integrated)
  fileUpload?: {
    maxSize?: number;
    allowedTypes?: string[];
    multiple?: boolean;
    onUpload?: (files: File[]) => Promise<void>;
  };
  
  // Advanced options from useFormValidation
  asyncValidation?: boolean;
  debounceMs?: number;
}

interface ConsolidatedFormReturn {
  // All existing form methods
  values: Record<string, any>;
  errors: Record<string, string | null>;
  // ... other form methods
  
  // Integrated file upload methods
  files: File[];
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent) => void;
  uploadFiles: () => Promise<void>;
}
```

### 2. Accessibility Consolidation

**Target Hook:** `useAccessibility.tsx` (comprehensive)

**Removes:** `useAccessibility.ts` (basic)

**Enhanced Features:**
- All basic accessibility features
- Advanced keyboard navigation
- Screen reader announcements
- Focus management
- Reduced motion detection

### 3. Performance Monitoring Consolidation

**Target Hooks:** 
- `useComponentPerformance.ts` (component-level)
- `useMemoryOptimization.ts` (memory and virtualization)

**Removes:** 
- `usePerformanceMonitor.ts`
- `useVirtualizationHelpers.ts`

**Design:**
```typescript
// useComponentPerformance.ts - Enhanced
interface ComponentPerformanceOptions {
  componentName: string;
  trackRenders?: boolean;
  trackMemory?: boolean;
  warnThreshold?: number;
}

// useMemoryOptimization.ts - Enhanced with virtualization
interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualization = <T>(
  items: T[],
  config: VirtualizationConfig
) => {
  // Implementation from useMemoryOptimization.ts
  // Replaces all useVirtualizationHelpers.ts functions
};
```

### 4. Pagination Consolidation

**Target Hook:** `usePagination.ts` (new unified hook)

**Consolidates:**
- `usePaginatedQuery.ts`
- `useInfiniteScroll.ts`

**Design:**
```typescript
interface PaginationOptions<T> {
  mode: 'infinite' | 'paginated';
  queryKey: string;
  fetcher: (page: number, filters: any) => Promise<PaginatedResponse<T>>;
  filters?: any;
  pageSize?: number;
  // Infinite scroll specific
  threshold?: number;
  rootMargin?: string;
  // Traditional pagination specific
  showPageNumbers?: boolean;
}

interface PaginationReturn<T> {
  data: T[];
  // Common properties
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  
  // Mode-specific properties
  ...(mode === 'infinite' ? {
    fetchNextPage: () => void;
    hasNextPage: boolean;
    scrollRef: React.RefObject<HTMLElement>;
  } : {
    currentPage: number;
    totalPages: number;
    goToPage: (page: number) => void;
    nextPage: () => void;
    previousPage: () => void;
  })
}
```

### 5. Configuration-Based Patterns

Instead of multiple similar hooks, use configuration patterns:

**Before:**
```typescript
usePropertyFormValidation()
useUserRegistrationValidation()
```

**After:**
```typescript
useFormValidation(propertyFormConfig)
useFormValidation(userRegistrationConfig)
```

**Configuration Objects:**
```typescript
export const propertyFormConfig: FormConfig = {
  title: {
    initialValue: '',
    rules: { required: true, minLength: 10 },
    validateOnChange: true,
  },
  // ... other fields
};

export const userRegistrationConfig: FormConfig = {
  firstName: {
    initialValue: '',
    rules: { required: true, minLength: 2 },
    validateOnBlur: true,
  },
  // ... other fields
};
```

## Data Models

### Hook Configuration Registry

```typescript
interface HookConfig {
  name: string;
  category: 'core' | 'ui' | 'performance' | 'specialized';
  status: 'active' | 'deprecated' | 'consolidated';
  consolidatedInto?: string;
  migrationGuide?: string;
}

const hookRegistry: Record<string, HookConfig> = {
  'useForm': {
    name: 'useForm',
    category: 'core',
    status: 'deprecated',
    consolidatedInto: 'useFormValidation',
    migrationGuide: 'Replace useForm with useFormValidation for enhanced features'
  },
  // ... other hooks
};
```

### Migration Mapping

```typescript
interface MigrationMapping {
  oldHook: string;
  newHook: string;
  changes: {
    imports: { from: string; to: string };
    apiChanges: { old: string; new: string }[];
    configChanges?: { old: any; new: any };
  };
}
```

## Error Handling

### Deprecation Warnings

```typescript
// In deprecated hooks
export function useForm(options: UseFormOptions) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'useForm is deprecated. Please use useFormValidation instead. ' +
      'See migration guide: /docs/hook-migration.md#useform-to-useformvalidation'
    );
  }
  
  // Temporary wrapper that calls useFormValidation
  return useFormValidation({
    initialValues: options.initialValues,
    validationRules: options.validationRules,
    // ... map other options
  });
}
```

### Runtime Compatibility

```typescript
// Compatibility layer for gradual migration
export const createCompatibilityWrapper = <T, U>(
  oldHook: (options: T) => any,
  newHook: (options: U) => any,
  optionsMapper: (oldOptions: T) => U
) => {
  return (options: T) => {
    const mappedOptions = optionsMapper(options);
    return newHook(mappedOptions);
  };
};
```

## Testing Strategy

### 1. Backward Compatibility Tests

```typescript
describe('Hook Consolidation Compatibility', () => {
  it('should maintain API compatibility for useForm', () => {
    const { result } = renderHook(() => useForm({
      initialValues: { name: '' },
      validationRules: { name: { required: true } }
    }));
    
    expect(result.current).toHaveProperty('values');
    expect(result.current).toHaveProperty('errors');
    expect(result.current).toHaveProperty('handleSubmit');
  });
  
  it('should show deprecation warning in development', () => {
    const consoleSpy = jest.spyOn(console, 'warn');
    renderHook(() => useForm({ initialValues: {} }));
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('useForm is deprecated')
    );
  });
});
```

### 2. Feature Parity Tests

```typescript
describe('Feature Parity', () => {
  it('should provide all useForm features in useFormValidation', () => {
    const formConfig = {
      name: { initialValue: '', rules: { required: true } }
    };
    
    const { result } = renderHook(() => useFormValidation(formConfig));
    
    // Test all original useForm features
    expect(result.current.values).toBeDefined();
    expect(result.current.setValue).toBeDefined();
    expect(result.current.handleSubmit).toBeDefined();
    
    // Test enhanced features
    expect(result.current.validateField).toBeDefined();
    expect(result.current.isValidating).toBeDefined();
  });
});
```

### 3. Performance Tests

```typescript
describe('Performance Impact', () => {
  it('should not degrade performance after consolidation', () => {
    const startTime = performance.now();
    
    renderHook(() => useFormValidation({
      field1: { initialValue: '' },
      field2: { initialValue: '' },
      // ... many fields
    }));
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(50); // 50ms threshold
  });
});
```

### 4. Integration Tests

```typescript
describe('Hook Integration', () => {
  it('should work with existing components', () => {
    const TestComponent = () => {
      const form = useFormValidation(propertyFormConfig);
      return <form onSubmit={form.handleSubmit}>...</form>;
    };
    
    render(<TestComponent />);
    // Test component behavior
  });
});
```

## Implementation Plan

### Phase 1: Safe Deletions (Week 1)
1. Remove `useAccessibility.ts` (basic version)
2. Remove `useVirtualizationHelpers.ts` (config only)
3. Update imports to use comprehensive versions
4. Add deprecation warnings to remaining redundant hooks

### Phase 2: Form Consolidation (Week 2)
1. Enhance `useFormValidation.ts` with file upload integration
2. Create compatibility wrapper for `useForm.ts`
3. Update all form implementations to use consolidated hook
4. Add migration documentation

### Phase 3: Query and Pagination Unification (Week 3)
1. Create unified `usePagination.ts` hook
2. Merge functionality from `usePaginatedQuery.ts` and `useInfiniteScroll.ts`
3. Update all pagination implementations
4. Create configuration-based patterns

### Phase 4: Performance and Cleanup (Week 4)
1. Consolidate performance monitoring hooks
2. Update all performance implementations
3. Remove deprecated hooks
4. Final testing and documentation

### Migration Tools

```typescript
// CLI tool for automated migration
export const migrationTool = {
  analyzeProject: (projectPath: string) => {
    // Scan for deprecated hook usage
    // Generate migration report
  },
  
  autoMigrate: (filePath: string, hookName: string) => {
    // Automatically update imports and basic usage
    // Flag complex cases for manual review
  },
  
  validateMigration: (projectPath: string) => {
    // Run tests to ensure migration success
    // Check for remaining deprecated usage
  }
};
```

This design ensures a smooth transition while maintaining all existing functionality and improving the overall developer experience.