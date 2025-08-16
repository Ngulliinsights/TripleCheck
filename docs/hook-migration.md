# Hook Migration Guide

This guide helps you migrate from deprecated hooks to their consolidated replacements.

## Quick Reference

| Deprecated Hook | Replacement | Status |
|----------------|-------------|---------|
| `useForm` | `useFormValidation` | ✅ Consolidated |
| `useAccessibility.ts` | `useAccessibility.tsx` | ✅ Consolidated |
| `usePerformanceMonitor` | `useComponentPerformance` | ✅ Consolidated |
| `useVirtualizationHelpers` | `useMemoryOptimization` | ✅ Consolidated |
| `usePaginatedQuery` | `usePagination` | ✅ Consolidated |
| `useInfiniteScroll` | `usePagination` | ✅ Consolidated |

## Migration Instructions

### useForm → useFormValidation ✅

**Before:**
```typescript
import { useForm } from '../hooks/useForm';

const form = useForm({
  initialValues: { name: '', email: '' },
  validationRules: {
    name: { required: true },
    email: { required: true, email: true }
  }
});
```

**After (Option 1 - Compatibility Layer):**
```typescript
import { useForm } from '../hooks/useFormValidation';

// Same API - no changes needed!
const form = useForm({
  initialValues: { name: '', email: '' },
  validationRules: {
    name: { required: true },
    email: { required: true, email: true }
  }
});
```

**After (Option 2 - Enhanced API):**
```typescript
import { useFormValidation } from '../hooks/useFormValidation';

const form = useFormValidation({
  name: {
    initialValue: '',
    rules: { required: 'Name is required' },
    validateOnBlur: true
  },
  email: {
    initialValue: '',
    rules: { 
      required: 'Email is required',
      email: 'Please enter a valid email'
    },
    validateOnChange: true,
    debounceMs: 500
  }
});
```

**Status:** ✅ **Completed** - All form functionality consolidated with backward compatibility

### useAccessibility.ts → useAccessibility.tsx

**Before:**
```typescript
import { useAccessibility } from '../hooks/useAccessibility';

const { trapFocus, announceLiveRegion } = useAccessibility();
```

**After:**
```typescript
import { useAccessibility } from '../hooks/useAccessibility';

const { 
  trapFocus, 
  announceLiveRegion,
  prefersReducedMotion,
  keyboardNavigation 
} = useAccessibility();
```

### usePerformanceMonitor → useComponentPerformance ✅

**Before:**
```typescript
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

usePerformanceMonitor({
  componentName: 'MyComponent',
  enabled: true,
  threshold: 16
});
```

**After (Option 1 - Compatibility Layer):**
```typescript
import { usePerformanceMonitor } from '../hooks/useComponentPerformance';

// Same API - no changes needed!
usePerformanceMonitor({
  componentName: 'MyComponent',
  enabled: true,
  threshold: 16
});
```

**After (Option 2 - Enhanced API):**
```typescript
import { useComponentPerformance } from '../hooks/useComponentPerformance';

const { trackRender, trackApiCall, getStats } = useComponentPerformance({
  componentName: 'MyComponent',
  enabled: true,
  threshold: 16,
  trackRenders: true
});
```

**Status:** ✅ **Completed** - All performance monitoring functionality consolidated with backward compatibility

### useVirtualizationHelpers → useMemoryOptimization ✅

**Before:**
```typescript
import { usePropertyListVirtualization } from '../hooks/useVirtualizationHelpers';

const config = usePropertyListVirtualization(properties, 600, 280);
```

**After:**
```typescript
import { usePropertyListVirtualization } from '../hooks/useMemoryOptimization';

const config = usePropertyListVirtualization(properties, 600, 280);
```

**Status:** ✅ **Completed** - All virtualization helpers consolidated into `useMemoryOptimization.ts`

**After:**
```typescript
import { useVirtualization } from '../hooks/useMemoryOptimization';

const { visibleItems, totalHeight, offsetY, handleScroll } = useVirtualization(
  properties,
  { itemHeight: 280, containerHeight: 600 }
);
```

### usePaginatedQuery → usePagination ✅

**Before:**
```typescript
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';

const { data, fetchNextPage, hasNextPage } = usePaginatedQuery({
  queryKey: 'properties',
  fetcher: fetchProperties,
  filters: { location: 'Nairobi' }
});
```

**After (Option 1 - Compatibility Layer):**
```typescript
import { usePaginatedQuery } from '../hooks/usePagination';

// Same API - no changes needed!
const { data, fetchNextPage, hasNextPage } = usePaginatedQuery({
  queryKey: 'properties',
  fetcher: fetchProperties,
  filters: { location: 'Nairobi' }
});
```

**After (Option 2 - Enhanced API):**
```typescript
import { usePagination } from '../hooks/usePagination';

const { data, fetchNextPage, hasNextPage } = usePagination({
  mode: 'infinite',
  queryKey: 'properties',
  fetcher: fetchProperties,
  filters: { location: 'Nairobi' }
});
```

### useInfiniteScroll → usePagination ✅

**Before:**
```typescript
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const { data, scrollRef, loadMore } = useInfiniteScroll({
  queryKey: ['properties'],
  queryFn: fetchProperties,
  threshold: 200
});
```

**After (Option 1 - Compatibility Layer):**
```typescript
import { useInfiniteScroll } from '../hooks/usePagination';

// Same API - no changes needed!
const { data, scrollRef, loadMore } = useInfiniteScroll({
  queryKey: ['properties'],
  queryFn: fetchProperties,
  threshold: 200
});
```

**After (Option 2 - Enhanced API):**
```typescript
import { usePagination } from '../hooks/usePagination';

const { data, scrollRef, loadMore } = usePagination({
  mode: 'infinite',
  queryKey: ['properties'],
  fetcher: fetchProperties,
  threshold: 200
});
```

## Automated Migration

Run the analysis script to find deprecated hook usage:

```bash
npm run hooks:analyze
```

Check consolidation status:

```bash
npm run hooks:consolidation-status
```

## Breaking Changes

### Form Configuration Structure

The form configuration structure has changed from flat options to field-based configuration:

**Old Structure:**
```typescript
{
  initialValues: { field1: 'value1' },
  validationRules: { field1: { required: true } }
}
```

**New Structure:**
```typescript
{
  field1: {
    initialValue: 'value1',
    rules: { required: true }
  }
}
```

### Pagination Mode Selection

The new unified pagination hook requires explicit mode selection:

```typescript
// For infinite scroll
usePagination({ mode: 'infinite', ... })

// For traditional pagination
usePagination({ mode: 'paginated', ... })
```

## Compatibility Period

Deprecated hooks will continue to work with warnings during the transition period. They will be removed in version 2.0.0.

## Need Help?

- Check the console for deprecation warnings with migration hints
- Run `npm run hooks:analyze` to find all deprecated usage
- Review the examples in each hook's documentation
- Open an issue if you encounter migration problems