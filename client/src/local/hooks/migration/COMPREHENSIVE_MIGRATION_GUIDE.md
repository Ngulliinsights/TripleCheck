# Comprehensive Hook Migration Guide

This guide provides detailed instructions for migrating from deprecated hooks to their consolidated counterparts. Follow this guide to ensure a smooth transition with no breaking changes.

## Table of Contents

1. [Overview](#overview)
2. [Migration Checklist](#migration-checklist)
3. [Form Validation Hooks](#form-validation-hooks)
4. [Data Fetching Hooks](#data-fetching-hooks)
5. [Performance Monitoring Hooks](#performance-monitoring-hooks)
6. [Pagination Hooks](#pagination-hooks)
7. [Accessibility Hooks](#accessibility-hooks)
8. [Configuration-Based Hooks](#configuration-based-hooks)
9. [Troubleshooting](#troubleshooting)
10. [Automated Migration Tools](#automated-migration-tools)

## Overview

The hook consolidation effort reduces the total number of hooks from 32+ to approximately 20 well-organized, non-overlapping hooks. This migration maintains all existing functionality while improving:

- **Code maintainability**: Clearer separation of concerns
- **Bundle size**: Reduced redundant code
- **Developer experience**: Consistent APIs and better TypeScript support
- **Performance**: Optimized caching and error handling

## Migration Checklist

Before starting your migration:

- [ ] Review this entire guide
- [ ] Run the automated migration detection script
- [ ] Create a backup branch of your current code
- [ ] Test each migration in isolation
- [ ] Update your imports and dependencies
- [ ] Run your test suite after each migration
- [ ] Update documentation and comments

## Form Validation Hooks

### useForm → useFormValidation

**Status**: ✅ Completed  
**Breaking Changes**: None (compatibility layer provided)

#### Before:
```typescript
import { useForm } from '../shared/hooks/useForm';

const MyComponent = () => {
  const { values, errors, handleChange, handleSubmit, isValid } = useForm({
    initialValues: { name: '', email: '' },
    validationRules: {
      name: { required: 'Name is required' },
      email: { required: 'Email is required', email: 'Invalid email' }
    },
    onSubmit: async (values) => {
      await submitForm(values);
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <input 
        name="name" 
        value={values.name} 
        onChange={handleChange}
      />
      {errors.name && <span>{errors.name}</span>}
    </form>
  );
};
```

#### After:
```typescript
import { useFormValidation } from '../shared/hooks/useFormValidation';

const MyComponent = () => {
  const { values, errors, handleChange, handleSubmit, isValid } = useFormValidation({
    name: {
      initialValue: '',
      rules: { required: 'Name is required' },
      validateOnChange: true
    },
    email: {
      initialValue: '',
      rules: { 
        required: 'Email is required',
        email: 'Invalid email'
      },
      validateOnBlur: true
    }
  });

  const onSubmit = async () => {
    if (isValid) {
      await submitForm(values);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <input 
        name="name" 
        value={values.name} 
        onChange={handleChange}
      />
      {errors.name && <span>{errors.name}</span>}
    </form>
  );
};
```

#### Configuration-Based Approach:
```typescript
import { useFormValidation, createPropertyFormConfig } from '../shared/hooks/useFormValidation';

const PropertyForm = ({ initialData }) => {
  const formConfig = createPropertyFormConfig(initialData);
  const form = useFormValidation(formConfig);
  
  return (
    <form onSubmit={form.handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### Property-Specific Form Hooks

#### usePropertyFormValidation (Enhanced)
```typescript
// Old approach - multiple separate hooks
import { usePropertyValidation } from '../hooks/usePropertyValidation';
import { useFileUpload } from '../hooks/useFileUpload';

// New approach - integrated configuration
import { usePropertyFormValidation } from '../shared/hooks/useFormValidation';

const PropertyForm = ({ initialData }) => {
  const form = usePropertyFormValidation(initialData);
  // File upload is now integrated
  const { uploadFile, uploadProgress } = form.fileUpload;
  
  return <form>{/* Form implementation */}</form>;
};
```

## Data Fetching Hooks

### Property Hooks → useSafeQuery

**Status**: ✅ Completed  
**Breaking Changes**: None (deprecation warnings added)

#### useProperties → useSafePropertiesQuery

**Before:**
```typescript
import { useProperties } from '../property/hooks/useProperty';

const PropertyList = () => {
  const { data, isLoading, error } = useProperties({
    query: 'apartment',
    location: 'Nairobi',
    page: 1,
    limit: 12
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.data.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
};
```

**After:**
```typescript
import { useSafePropertiesQuery } from '../shared/hooks/useSafeQuery';

const PropertyList = () => {
  const { data, isLoading, error, hasValidData } = useSafePropertiesQuery({
    query: 'apartment',
    location: 'Nairobi',
    page: 1,
    limit: 12
  });

  if (isLoading) return <div>Loading...</div>;
  if (error && !hasValidData) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
};
```

#### useProperty → useSafePropertyQuery

**Before:**
```typescript
import { useProperty } from '../property/hooks/useProperty';

const PropertyDetails = ({ propertyId }) => {
  const { data: property, isLoading } = useProperty(propertyId);
  
  return isLoading ? <div>Loading...</div> : <PropertyView property={property} />;
};
```

**After:**
```typescript
import { useSafePropertyQuery } from '../shared/hooks/useSafeQuery';

const PropertyDetails = ({ propertyId }) => {
  const { data: property, isLoading, hasValidData } = useSafePropertyQuery(propertyId);
  
  return isLoading ? <div>Loading...</div> : <PropertyView property={property} />;
};
```

#### usePropertyActions → useSafePropertyActionsQuery

**Before:**
```typescript
import { usePropertyActions } from '../shared/hooks/usePropertyActions';

const PropertyCard = ({ property }) => {
  const { addToFavorites, shareProperty, isAddingToFavorites } = usePropertyActions();
  
  return (
    <div>
      <button 
        onClick={() => addToFavorites(property.id)}
        disabled={isAddingToFavorites}
      >
        Add to Favorites
      </button>
    </div>
  );
};
```

**After:**
```typescript
import { useSafePropertyActionsQuery } from '../shared/hooks/useSafeQuery';

const PropertyCard = ({ property }) => {
  const { data: favoritesData, isLoading } = useSafePropertyActionsQuery('favorites', property.id);
  
  const handleAddToFavorites = async () => {
    // Use mutation pattern with useSafeQuery
    await fetch('/api/properties/favorites', {
      method: 'POST',
      body: JSON.stringify({ propertyId: property.id })
    });
  };
  
  return (
    <div>
      <button 
        onClick={handleAddToFavorites}
        disabled={isLoading}
      >
        Add to Favorites
      </button>
    </div>
  );
};
```

## Performance Monitoring Hooks

### usePerformanceMonitor → useComponentPerformance

**Status**: ✅ Completed  
**Breaking Changes**: None (compatibility layer provided)

#### Before:
```typescript
import { usePerformanceMonitor } from '../shared/hooks/usePerformanceMonitor';

const ExpensiveComponent = () => {
  const { startTiming, endTiming, metrics } = usePerformanceMonitor('ExpensiveComponent');
  
  useEffect(() => {
    startTiming('render');
    // Component logic
    endTiming('render');
  }, []);

  return <div>Component with metrics: {metrics.renderTime}ms</div>;
};
```

#### After:
```typescript
import { useComponentPerformance } from '../shared/hooks/useComponentPerformance';

const ExpensiveComponent = () => {
  const { trackRender, metrics, withPerformanceMonitor } = useComponentPerformance({
    componentName: 'ExpensiveComponent',
    trackRenderTime: true,
    trackMemoryUsage: true
  });
  
  const expensiveOperation = withPerformanceMonitor('expensiveOp', () => {
    // Expensive operation
  });

  return <div>Component with metrics: {metrics.renderTime}ms</div>;
};
```

## Pagination Hooks

### usePaginatedQuery + useInfiniteScroll → usePagination

**Status**: ✅ Completed  
**Breaking Changes**: None (compatibility layers provided)

#### Before:
```typescript
import { usePaginatedQuery } from '../shared/hooks/usePaginatedQuery';
import { useInfiniteScroll } from '../shared/hooks/useInfiniteScroll';

// Traditional pagination
const PropertyList = () => {
  const { data, page, setPage, hasNext, hasPrev } = usePaginatedQuery('/api/properties');
  
  return (
    <div>
      {data.map(item => <PropertyCard key={item.id} property={item} />)}
      <button onClick={() => setPage(page - 1)} disabled={!hasPrev}>Previous</button>
      <button onClick={() => setPage(page + 1)} disabled={!hasNext}>Next</button>
    </div>
  );
};

// Infinite scroll
const InfinitePropertyList = () => {
  const { data, loadMore, hasMore, isLoading } = useInfiniteScroll('/api/properties');
  
  return (
    <div>
      {data.map(item => <PropertyCard key={item.id} property={item} />)}
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  );
};
```

#### After:
```typescript
import { usePagination } from '../shared/hooks/usePagination';

// Traditional pagination
const PropertyList = () => {
  const { data, page, setPage, hasNext, hasPrev } = usePagination({
    endpoint: '/api/properties',
    mode: 'paginated'
  });
  
  return (
    <div>
      {data.map(item => <PropertyCard key={item.id} property={item} />)}
      <button onClick={() => setPage(page - 1)} disabled={!hasPrev}>Previous</button>
      <button onClick={() => setPage(page + 1)} disabled={!hasNext}>Next</button>
    </div>
  );
};

// Infinite scroll
const InfinitePropertyList = () => {
  const { data, loadMore, hasMore, isLoading } = usePagination({
    endpoint: '/api/properties',
    mode: 'infinite'
  });
  
  return (
    <div>
      {data.map(item => <PropertyCard key={item.id} property={item} />)}
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  );
};
```

## Accessibility Hooks

### useAccessibility.ts → useAccessibility.tsx

**Status**: ✅ Completed  
**Breaking Changes**: None (enhanced functionality added)

#### Before:
```typescript
import { useAccessibility } from '../shared/hooks/useAccessibility';

const Modal = ({ isOpen, onClose, children }) => {
  const { trapFocus, announceLiveRegion } = useAccessibility();
  
  useEffect(() => {
    if (isOpen) {
      trapFocus();
      announceLiveRegion('Modal opened');
    }
  }, [isOpen]);

  return isOpen ? <div>{children}</div> : null;
};
```

#### After (Enhanced):
```typescript
import { useAccessibility } from '../shared/hooks/useAccessibility';

const Modal = ({ isOpen, onClose, children }) => {
  const { 
    trapFocus, 
    announceLiveRegion, 
    restoreFocus,
    prefersReducedMotion,
    prefersHighContrast,
    keyboardNavigation 
  } = useAccessibility();
  
  useEffect(() => {
    if (isOpen) {
      trapFocus();
      announceLiveRegion('Modal opened');
    }
    return () => {
      if (isOpen) {
        restoreFocus();
      }
    };
  }, [isOpen]);

  const modalClass = `modal ${prefersHighContrast ? 'high-contrast' : ''} ${prefersReducedMotion ? 'reduced-motion' : ''}`;

  return isOpen ? (
    <div className={modalClass} role="dialog" aria-modal="true">
      {children}
    </div>
  ) : null;
};
```

## Configuration-Based Hooks

### Multiple Similar Hooks → useConfigurableHook

**Status**: ✅ Completed  
**Breaking Changes**: None (original hooks maintained with deprecation warnings)

#### Before (Multiple Hooks):
```typescript
import { usePropertySearch } from '../hooks/usePropertySearch';
import { useUserSearch } from '../hooks/useUserSearch';
import { useDocumentSearch } from '../hooks/useDocumentSearch';

const SearchComponent = ({ type }) => {
  const propertySearch = usePropertySearch();
  const userSearch = useUserSearch();
  const documentSearch = useDocumentSearch();
  
  // Complex logic to switch between different search hooks
};
```

#### After (Configuration-Based):
```typescript
import { useConfigurableHook, getPropertyPreset } from '../shared/hooks/useConfigurableHook';

const SearchComponent = ({ type }) => {
  const searchConfig = {
    property: getPropertyPreset('propertySearch'),
    user: {
      name: 'User Search',
      category: 'data-fetching',
      endpoint: '/api/users/search',
      // ... other config
    },
    document: {
      name: 'Document Search', 
      category: 'data-fetching',
      endpoint: '/api/documents/search',
      // ... other config
    }
  };
  
  const search = useConfigurableHook(searchConfig[type]);
  
  return <SearchResults {...search} />;
};
```

## Troubleshooting

### Common Migration Issues

#### 1. Import Errors
**Problem**: `Module not found` errors after migration
**Solution**: 
```typescript
// Old import
import { useForm } from '../hooks/useForm';

// New import
import { useFormValidation } from '../shared/hooks/useFormValidation';
```

#### 2. Type Errors
**Problem**: TypeScript errors due to changed return types
**Solution**: Update your type annotations
```typescript
// Before
const { data }: { data: Property[] } = useProperties();

// After  
const { data }: { data: Property[] } = useSafePropertiesQuery();
```

#### 3. Missing Properties
**Problem**: Properties that existed on old hooks are missing
**Solution**: Check the new hook's return type and use compatibility layers
```typescript
// If a property is missing, check if there's a compatibility layer
import { useForm } from '../shared/hooks/useFormValidation'; // Compatibility layer
```

#### 4. Performance Regressions
**Problem**: App feels slower after migration
**Solution**: 
- Check that you're using the correct caching options
- Verify that debouncing settings are appropriate
- Use the performance monitoring hooks to identify bottlenecks

#### 5. Deprecation Warnings
**Problem**: Console warnings about deprecated hooks
**Solution**: Follow this migration guide to update to the new hooks

### Testing Your Migration

#### Unit Tests
```typescript
// Update your test imports
import { renderHook } from '@testing-library/react';
import { useFormValidation } from '../shared/hooks/useFormValidation';

describe('Form Migration', () => {
  it('should work with new hook', () => {
    const { result } = renderHook(() => useFormValidation({
      name: {
        initialValue: '',
        rules: { required: 'Name is required' }
      }
    }));
    
    expect(result.current.values.name).toBe('');
  });
});
```

#### Integration Tests
- Test complete user flows with the new hooks
- Verify that form submissions still work
- Check that data fetching behaves correctly
- Ensure accessibility features are maintained

## Automated Migration Tools

### Migration Detection Script

Run the automated migration detection script to find deprecated hook usage:

```bash
npm run migrate:detect
```

This will generate a report showing:
- All deprecated hook usages in your codebase
- Specific file locations and line numbers
- Suggested replacements
- Estimated migration effort

### Automated Fixes

For simple migrations, use the automated fix script:

```bash
npm run migrate:fix --hook=useForm
```

This will automatically:
- Update import statements
- Replace hook calls with new equivalents
- Add necessary configuration objects
- Preserve existing functionality

### Manual Migration Required

Some migrations require manual intervention:
- Complex custom validation logic
- Custom error handling patterns
- Performance-critical components
- Components with custom accessibility requirements

## Migration Timeline

### Phase 1: Preparation (Week 1)
- [ ] Run migration detection script
- [ ] Review migration report
- [ ] Plan migration order
- [ ] Set up testing environment

### Phase 2: Core Hooks (Week 2-3)
- [ ] Migrate form validation hooks
- [ ] Migrate data fetching hooks
- [ ] Update tests

### Phase 3: Specialized Hooks (Week 4)
- [ ] Migrate performance monitoring hooks
- [ ] Migrate pagination hooks
- [ ] Migrate accessibility hooks

### Phase 4: Configuration-Based (Week 5)
- [ ] Migrate to configuration-based patterns
- [ ] Implement custom configurations
- [ ] Optimize performance

### Phase 5: Cleanup (Week 6)
- [ ] Remove deprecated hook files
- [ ] Update documentation
- [ ] Final testing and validation

## Support and Resources

### Documentation
- [Hook Configuration Guide](./configs/README.md)
- [Performance Optimization Guide](./performance/README.md)
- [Accessibility Migration Guide](./accessibility/README.md)

### Getting Help
- Check the troubleshooting section above
- Review the automated migration report
- Test changes in isolation
- Consult the original hook documentation for complex cases

### Rollback Plan
If you encounter issues:
1. Revert to your backup branch
2. Identify the specific problem
3. Fix the issue following this guide
4. Test thoroughly before proceeding

Remember: The migration maintains backward compatibility, so you can migrate incrementally without breaking your application.