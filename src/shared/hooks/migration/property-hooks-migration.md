# Property Hooks Migration Guide

This guide helps you migrate from deprecated basic property hooks to the consolidated `useSafeQuery` system.

## Overview

The following hooks have been deprecated in favor of `useSafeQuery` configurations:

- `useProperties` → `useSafePropertiesQuery`
- `useProperty` → `useSafePropertyQuery`
- `useOwnerProperties` → `useSafeOwnerPropertiesQuery`
- `usePropertyActions` → `useSafePropertyActionsQuery`
- `usePropertySearch` → `useSafePropertySearchQuery`

## Migration Examples

### 1. Basic Properties List

**Before:**
```typescript
import { useProperties } from '../property/hooks/useProperty';

const { data, isLoading, error } = useProperties({
  query: 'apartment',
  location: 'Nairobi',
  page: 1,
  limit: 12
});
```

**After:**
```typescript
import { useSafePropertiesQuery } from '../shared/hooks/useSafeQuery';

const { data, isLoading, error } = useSafePropertiesQuery({
  query: 'apartment',
  location: 'Nairobi',
  page: 1,
  limit: 12
});
```

### 2. Single Property Details

**Before:**
```typescript
import { useProperty } from '../property/hooks/useProperty';

const { data: property, isLoading } = useProperty(propertyId);
```

**After:**
```typescript
import { useSafePropertyQuery } from '../shared/hooks/useSafeQuery';

const { data: property, isLoading } = useSafePropertyQuery(propertyId);
```

### 3. Owner Properties

**Before:**
```typescript
import { useOwnerProperties } from '../property/hooks/useProperty';

const { data, isLoading } = useOwnerProperties(ownerId, true);
```

**After:**
```typescript
import { useSafeOwnerPropertiesQuery } from '../shared/hooks/useSafeQuery';

const { data, isLoading } = useSafeOwnerPropertiesQuery(ownerId, {
  includeTotal: true
});
```

### 4. Property Actions

**Before:**
```typescript
import { usePropertyActions } from '../shared/hooks/usePropertyActions';

const { addToFavorites, shareProperty, isAddingToFavorites } = usePropertyActions();
```

**After:**
```typescript
import { useSafePropertyActionsQuery } from '../shared/hooks/useSafeQuery';

// For favorites
const { data: favoritesData, isLoading: isAddingToFavorites } = useSafePropertyActionsQuery(
  'favorites',
  propertyId
);

// For sharing
const { data: shareData, isLoading: isSharing } = useSafePropertyActionsQuery(
  'share',
  propertyId
);
```

### 5. Property Search

**Before:**
```typescript
import { usePropertySearch } from '../property/hooks/usePropertySearch';

const {
  searchResults,
  isLoading,
  updateSearch,
  searchParams
} = usePropertySearch();
```

**After:**
```typescript
import { useSafePropertySearchQuery } from '../shared/hooks/useSafeQuery';
import { useState } from 'react';

const [searchParams, setSearchParams] = useState({});
const { data: searchResults, isLoading } = useSafePropertySearchQuery(searchParams);

// Update search function
const updateSearch = (newParams) => {
  setSearchParams(prev => ({ ...prev, ...newParams }));
};
```

## Benefits of Migration

### Enhanced Error Handling
- Circuit breaker pattern prevents cascading failures
- Automatic retry with exponential backoff
- Graceful fallback data handling

### Better Performance
- Request deduplication prevents duplicate API calls
- Intelligent caching with configurable stale times
- Adaptive debouncing based on usage patterns

### Improved Developer Experience
- Consistent API across all property data fetching
- Better TypeScript support with generic types
- Built-in loading states and error boundaries

### Advanced Features
- Request cancellation and cleanup
- Performance monitoring and metrics
- Automatic rate limiting protection

## Configuration Options

All `useSafeQuery` hooks accept additional configuration options:

```typescript
const { data, isLoading } = useSafePropertiesQuery(searchParams, {
  // React Query options
  enabled: true,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  
  // useSafeQuery specific options
  timeout: 30000, // 30 seconds
  retry: 3,
  debounceMs: 500,
  deduplicate: true,
  context: 'custom-context',
  
  // Custom fallback data
  fallbackData: [],
  
  // Custom validator
  validator: (data) => {
    // Custom validation logic
    return data;
  }
});
```

## Migration Checklist

- [ ] Replace hook imports with `useSafeQuery` variants
- [ ] Update function calls to match new API signatures
- [ ] Test error handling scenarios
- [ ] Verify caching behavior meets requirements
- [ ] Update TypeScript types if needed
- [ ] Remove deprecated hook imports
- [ ] Test performance improvements

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure you're using the correct generic types for your data structures
2. **Cache Misses**: Check that search parameters are properly normalized
3. **Infinite Loops**: Verify that dependencies in `useMemo` and `useCallback` are stable

### Getting Help

If you encounter issues during migration:
1. Check the console for deprecation warnings with specific guidance
2. Review the `useSafeQuery.ts` source code for implementation details
3. Test with small, isolated changes before migrating entire components

## Performance Monitoring

After migration, you can monitor performance improvements:

```typescript
const { requestStats, activeOperations } = useSafePropertiesQuery(params);

// Check request statistics
console.log('Request count:', requestStats?.count);
console.log('Last used:', requestStats?.lastUsed);

// Monitor active operations (development only)
console.log('Active operations:', activeOperations);
```