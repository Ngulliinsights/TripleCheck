# Property Hooks Migration Guide

This guide helps you migrate from the old property hooks to the new consolidated hooks for better performance, consistency, and maintainability.

## Overview

We've consolidated multiple property hooks into two main hooks:
- `useUnifiedProperty` - Comprehensive property management
- `useConsolidatedPropertySearch` - Enhanced search functionality

## Migration Paths

### From `useProperty` → `useUnifiedProperty`

**Before:**
```typescript
import { useProperty, useCreateProperty, useUpdateProperty } from './useProperty';

function MyComponent() {
  const { data: property, isLoading } = useProperty(propertyId);
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  
  // ... component logic
}
```

**After:**
```typescript
import { useUnifiedProperty } from './useUnifiedProperty';

function MyComponent() {
  const { usePropertyDetail, useCreateProperty, useUpdateProperty } = useUnifiedProperty();
  
  const { data: property, isLoading } = usePropertyDetail(propertyId);
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  
  // ... component logic
}
```

### From `useLandProperty` → `useUnifiedProperty`

**Before:**
```typescript
import { useLandProperty } from './useLandProperty';

function LandComponent() {
  const { data: landProperty, isLoading, hasValidData } = useLandProperty(landId);
  
  // ... component logic
}
```

**After:**
```typescript
import { useUnifiedProperty } from './useUnifiedProperty';

function LandComponent() {
  const { useLandProperty } = useUnifiedProperty();
  const { data: landProperty, isLoading } = useLandProperty(landId);
  const hasValidData = Boolean(landProperty);
  
  // ... component logic
}
```

### From `usePropertySearch` → `useConsolidatedPropertySearch`

**Before:**
```typescript
import { usePropertySearch } from './usePropertySearch';

function SearchComponent() {
  const {
    searchParams,
    searchResults,
    isLoading,
    updateSearch,
    clearSearch,
    hasActiveFilters
  } = usePropertySearch();
  
  // ... component logic
}
```

**After:**
```typescript
import { useConsolidatedPropertySearch } from './useConsolidatedPropertySearch';

function SearchComponent() {
  const {
    searchParams,
    properties: searchResults, // Note: renamed from searchResults
    isLoading,
    updateSearch,
    clearSearch,
    hasActiveFilters,
    // New features available:
    searchSuggestions,
    searchHistory,
    metrics
  } = useConsolidatedPropertySearch();
  
  // ... component logic
}
```

## New Features Available

### Enhanced Search Capabilities

```typescript
import { useConsolidatedPropertySearch } from './useConsolidatedPropertySearch';

function AdvancedSearchComponent() {
  const {
    properties,
    searchSuggestions,
    searchHistory,
    metrics,
    applyPreset,
    duplicateSearch
  } = useConsolidatedPropertySearch(
    { query: "apartment" }, // Initial search params
    {
      enableSuggestions: true,
      enableMetrics: true,
      adaptiveDebounce: true
    }
  );

  // Apply quick search presets
  const handleLuxurySearch = () => applyPreset('luxury');
  const handleBudgetSearch = () => applyPreset('budget');
  
  // Use search history
  const handleRepeatSearch = (historyId: string) => duplicateSearch(historyId);
  
  return (
    <div>
      {/* Search suggestions */}
      {searchSuggestions.map(suggestion => (
        <button key={suggestion.text} onClick={() => updateSearch({ query: suggestion.text })}>
          {suggestion.text} ({suggestion.count} results)
        </button>
      ))}
      
      {/* Quick presets */}
      <button onClick={handleLuxurySearch}>Luxury Properties</button>
      <button onClick={handleBudgetSearch}>Budget Properties</button>
      
      {/* Search metrics */}
      <div>
        Total searches: {metrics.totalSearches}
        Average response time: {metrics.averageResponseTime}ms
      </div>
    </div>
  );
}
```

### Unified Property Management

```typescript
import { useUnifiedProperty } from './useUnifiedProperty';

function PropertyManagementComponent() {
  const {
    useProperties,
    usePropertyDetail,
    useCreateProperty,
    useUpdateProperty,
    useDeleteProperty,
    invalidatePropertyQueries,
    clearPropertyCache
  } = useUnifiedProperty();

  // Fetch multiple properties with advanced options
  const { data: properties } = useProperties(
    { location: "Nairobi", priceMin: 100000 },
    { debounceMs: 300, staleTime: 5 * 60 * 1000 }
  );

  // Property CRUD operations
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const deleteMutation = useDeleteProperty();

  // Cache management
  const handleRefreshAll = () => invalidatePropertyQueries();
  const handleClearCache = (propertyId?: string) => clearPropertyCache(propertyId);

  return (
    <div>
      {/* Property management UI */}
    </div>
  );
}
```

## Backward Compatibility

For easier migration, we provide specialized hooks that maintain the old API:

```typescript
// These hooks provide backward compatibility
import { 
  useEnhancedPropertySearch,
  useEnhancedLandProperty 
} from './useUnifiedProperty';

// Drop-in replacement for usePropertySearch
const searchResult = useEnhancedPropertySearch("apartment", { location: "Nairobi" });

// Drop-in replacement for useLandProperty
const landResult = useEnhancedLandProperty(landId);
```

## Performance Benefits

The new consolidated hooks provide:

1. **Better Caching**: Intelligent cache management with configurable stale times
2. **Reduced Bundle Size**: Eliminated duplicate code and dependencies
3. **Adaptive Debouncing**: Search delays adapt to user typing speed
4. **Request Deduplication**: Prevents duplicate API calls
5. **Optimistic Updates**: Immediate UI updates with rollback on errors

## Breaking Changes

### Minor Breaking Changes:
1. `searchResults` renamed to `properties` in search hooks
2. Some internal interfaces have been updated for better type safety
3. Error handling has been enhanced - check error objects for new structure

### Deprecated Hooks:
- `useProperty` - Use `useUnifiedProperty().usePropertyDetail` instead
- `useLandProperty` - Use `useUnifiedProperty().useLandProperty` instead  
- `usePropertySearch` - Use `useConsolidatedPropertySearch` instead
- `usePropertyActions` - Use `useUnifiedProperty()` mutation hooks instead

## Migration Timeline

1. **Phase 1**: Update imports to use new hooks
2. **Phase 2**: Update component logic to use new API
3. **Phase 3**: Remove old hook files (after testing)
4. **Phase 4**: Update tests to use new hooks

## Testing Your Migration

```typescript
// Test that the new hooks work correctly
import { useUnifiedProperty, useConsolidatedPropertySearch } from './hooks';

function TestComponent() {
  const { usePropertyDetail } = useUnifiedProperty();
  const { data: property } = usePropertyDetail("test-id");
  
  const { properties } = useConsolidatedPropertySearch();
  
  // Verify data structure matches expectations
  console.log('Property:', property);
  console.log('Search results:', properties);
  
  return <div>Migration test component</div>;
}
```

## Support

If you encounter issues during migration:

1. Check this guide for common patterns
2. Look at the TypeScript types for guidance
3. Use the backward compatibility hooks as a temporary solution
4. The old hooks are marked as deprecated but still functional

## Example: Complete Component Migration

**Before:**
```typescript
import { useProperty } from './useProperty';
import { usePropertySearch } from './usePropertySearch';
import { useLandProperty } from './useLandProperty';

function PropertyComponent({ propertyId, isLand }) {
  const { data: property } = useProperty(propertyId);
  const { data: landProperty } = useLandProperty(isLand ? propertyId : null);
  const { searchResults, updateSearch } = usePropertySearch();
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

**After:**
```typescript
import { useUnifiedProperty } from './useUnifiedProperty';
import { useConsolidatedPropertySearch } from './useConsolidatedPropertySearch';

function PropertyComponent({ propertyId, isLand }) {
  const { usePropertyDetail, useLandProperty } = useUnifiedProperty();
  
  const { data: property } = usePropertyDetail(propertyId, { enabled: !isLand });
  const { data: landProperty } = useLandProperty(propertyId, { enabled: isLand });
  const { properties: searchResults, updateSearch } = useConsolidatedPropertySearch();
  
  return (
    <div>
      {/* Component JSX - no changes needed */}
    </div>
  );
}
```

This migration provides better performance, consistency, and new features while maintaining familiar APIs.