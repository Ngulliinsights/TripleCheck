# Hook Migration Troubleshooting Guide

This guide helps you resolve common issues encountered during hook migration. Use this as a reference when you encounter problems during the migration process.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Import and Module Issues](#import-and-module-issues)
3. [Type Errors](#type-errors)
4. [Runtime Errors](#runtime-errors)
5. [Performance Issues](#performance-issues)
6. [Testing Issues](#testing-issues)
7. [Build and Deployment Issues](#build-and-deployment-issues)
8. [Rollback Procedures](#rollback-procedures)

## Quick Diagnostics

### Run Migration Detection
```bash
npm run migrate:detect
```

### Check Hook Status
```bash
npm run hooks:consolidation-status
```

### Verify Build
```bash
npm run build:client:safe
```

## Import and Module Issues

### Issue: Module Not Found Errors

**Symptoms:**
```
Error: Cannot resolve module '../hooks/useForm'
Module not found: Can't resolve '../shared/hooks/useForm'
```

**Causes:**
- Old import paths after hook consolidation
- Missing export statements
- Incorrect relative paths

**Solutions:**

1. **Update Import Paths:**
```typescript
// ❌ Old import
import { useForm } from '../hooks/useForm';
import { useProperties } from '../property/hooks/useProperty';

// ✅ New import
import { useFormValidation } from '../shared/hooks/useFormValidation';
import { useSafePropertiesQuery } from '../shared/hooks/useSafeQuery';
```

2. **Check Export Statements:**
```typescript
// Verify the hook is exported from the new location
// src/shared/hooks/index.ts
export { useFormValidation } from './useFormValidation';
export { useSafePropertiesQuery } from './useSafeQuery';
```

3. **Use Absolute Imports:**
```typescript
// If relative paths are problematic, use absolute imports
import { useFormValidation } from 'src/shared/hooks/useFormValidation';
```

### Issue: Circular Dependency Warnings

**Symptoms:**
```
Warning: Circular dependency detected
Module has circular dependencies
```

**Solutions:**

1. **Break Circular Dependencies:**
```typescript
// ❌ Problematic circular import
// fileA.ts imports fileB.ts
// fileB.ts imports fileA.ts

// ✅ Extract shared logic to a third file
// shared.ts - contains common logic
// fileA.ts imports shared.ts
// fileB.ts imports shared.ts
```

2. **Use Dynamic Imports:**
```typescript
// ❌ Static import causing circular dependency
import { someHook } from './problematicFile';

// ✅ Dynamic import
const { someHook } = await import('./problematicFile');
```

## Type Errors

### Issue: Property Does Not Exist on Type

**Symptoms:**
```typescript
Property 'someProperty' does not exist on type 'ReturnType<typeof useNewHook>'
```

**Solutions:**

1. **Check New Hook Return Type:**
```typescript
// ❌ Assuming old property exists
const { oldProperty } = useNewHook();

// ✅ Check what the new hook actually returns
const hookResult = useNewHook();
console.log(Object.keys(hookResult)); // See available properties

// ✅ Use correct property name
const { newPropertyName } = useNewHook();
```

2. **Use Type Assertions (Temporary):**
```typescript
// ⚠️ Temporary solution while migrating
const result = useNewHook() as any;
const { oldProperty } = result;
```

3. **Update Type Definitions:**
```typescript
// ✅ Create proper type definitions
interface NewHookResult {
  data: any[];
  isLoading: boolean;
  error: Error | null;
  // ... other properties
}

const { data, isLoading }: NewHookResult = useNewHook();
```

### Issue: Generic Type Parameter Errors

**Symptoms:**
```typescript
Type 'unknown' is not assignable to type 'Property[]'
Generic type 'T' requires 1 type argument(s)
```

**Solutions:**

1. **Provide Type Parameters:**
```typescript
// ❌ Missing type parameter
const { data } = useSafeQuery(options);

// ✅ Provide type parameter
const { data } = useSafeQuery<Property[]>(options);
```

2. **Use Type Inference:**
```typescript
// ✅ Let TypeScript infer the type
const { data } = useSafePropertiesQuery(params); // Returns Property[] by default
```

## Runtime Errors

### Issue: Hook Rules Violations

**Symptoms:**
```
Error: Invalid hook call. Hooks can only be called inside the body of a function component
Error: Rendered more hooks than during the previous render
```

**Solutions:**

1. **Check Hook Call Location:**
```typescript
// ❌ Hook called outside component
const data = useHook(); // Outside component

function MyComponent() {
  return <div>{data}</div>;
}

// ✅ Hook called inside component
function MyComponent() {
  const data = useHook(); // Inside component
  return <div>{data}</div>;
}
```

2. **Consistent Hook Calls:**
```typescript
// ❌ Conditional hook calls
function MyComponent({ condition }) {
  if (condition) {
    const data = useHook(); // Conditional hook call
  }
  return <div>Content</div>;
}

// ✅ Always call hooks
function MyComponent({ condition }) {
  const data = useHook(); // Always called
  
  if (!condition) {
    return <div>No data</div>;
  }
  
  return <div>{data}</div>;
}
```

### Issue: Infinite Re-renders

**Symptoms:**
```
Error: Too many re-renders. React limits the number of renders to prevent an infinite loop
```

**Solutions:**

1. **Check Dependencies:**
```typescript
// ❌ Missing dependencies causing infinite loop
const { data } = useHook({
  onSuccess: () => {
    // This creates a new function on every render
    doSomething();
  }
});

// ✅ Stable dependencies
const handleSuccess = useCallback(() => {
  doSomething();
}, []);

const { data } = useHook({
  onSuccess: handleSuccess
});
```

2. **Memoize Objects:**
```typescript
// ❌ New object on every render
const options = { param1: value1, param2: value2 };
const { data } = useHook(options);

// ✅ Memoized object
const options = useMemo(() => ({
  param1: value1,
  param2: value2
}), [value1, value2]);

const { data } = useHook(options);
```

### Issue: Stale Closure Problems

**Symptoms:**
- Hook returns old values
- State updates don't reflect in callbacks
- Event handlers use outdated data

**Solutions:**

1. **Use Refs for Latest Values:**
```typescript
// ❌ Stale closure
const [count, setCount] = useState(0);

const handleClick = useCallback(() => {
  console.log(count); // Always logs 0
}, []);

// ✅ Use ref for latest value
const [count, setCount] = useState(0);
const countRef = useRef(count);
countRef.current = count;

const handleClick = useCallback(() => {
  console.log(countRef.current); // Always logs current value
}, []);
```

2. **Update Dependencies:**
```typescript
// ❌ Missing dependency
const handleClick = useCallback(() => {
  console.log(count);
}, []); // Missing count dependency

// ✅ Include all dependencies
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);
```

## Performance Issues

### Issue: Slow Initial Load

**Symptoms:**
- App takes longer to load after migration
- Increased bundle size
- Slower first render

**Solutions:**

1. **Check Bundle Size:**
```bash
npm run build:client
# Check dist folder size
```

2. **Use Code Splitting:**
```typescript
// ❌ Import everything upfront
import { useFormValidation, useSafeQuery, useComponentPerformance } from '../shared/hooks';

// ✅ Import only what you need
import { useFormValidation } from '../shared/hooks/useFormValidation';
```

3. **Lazy Load Heavy Hooks:**
```typescript
// ✅ Lazy load performance monitoring in development only
const usePerformanceMonitoring = process.env.NODE_ENV === 'development' 
  ? require('../shared/hooks/useComponentPerformance').useComponentPerformance
  : () => ({});
```

### Issue: Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- Browser becomes sluggish
- Console warnings about memory

**Solutions:**

1. **Check Cleanup Functions:**
```typescript
// ❌ Missing cleanup
useEffect(() => {
  const subscription = subscribe();
  // Missing cleanup
}, []);

// ✅ Proper cleanup
useEffect(() => {
  const subscription = subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

2. **Use Cleanup Managers:**
```typescript
// ✅ Use built-in cleanup manager
import { useEnhancedCleanupManager } from '../infrastructure/hooks/useCleanupManager';

const MyComponent = () => {
  const cleanupManager = useEnhancedCleanupManager();
  
  useEffect(() => {
    const timer = setTimeout(() => {}, 1000);
    cleanupManager.addTimeout(timer, 'my-timer');
  }, []);
  
  // Cleanup happens automatically
};
```

### Issue: Excessive Re-renders

**Symptoms:**
- Components render more frequently than expected
- Performance profiler shows many renders
- UI feels sluggish

**Solutions:**

1. **Memoize Expensive Calculations:**
```typescript
// ❌ Expensive calculation on every render
const expensiveValue = expensiveCalculation(data);

// ✅ Memoized calculation
const expensiveValue = useMemo(() => 
  expensiveCalculation(data), 
  [data]
);
```

2. **Use React.memo for Components:**
```typescript
// ✅ Prevent unnecessary re-renders
const MyComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

## Testing Issues

### Issue: Tests Failing After Migration

**Symptoms:**
```
Test suite failed to run
TypeError: Cannot read property 'mockReturnValue' of undefined
```

**Solutions:**

1. **Update Test Mocks:**
```typescript
// ❌ Old mock
jest.mock('../hooks/useForm', () => ({
  useForm: jest.fn()
}));

// ✅ New mock
jest.mock('../shared/hooks/useFormValidation', () => ({
  useFormValidation: jest.fn()
}));
```

2. **Update Test Imports:**
```typescript
// ❌ Old import in test
import { useForm } from '../hooks/useForm';

// ✅ New import in test
import { useFormValidation } from '../shared/hooks/useFormValidation';
```

3. **Mock New Hook Structure:**
```typescript
// ✅ Mock the new hook return structure
const mockUseFormValidation = useFormValidation as jest.MockedFunction<typeof useFormValidation>;

mockUseFormValidation.mockReturnValue({
  values: { name: '', email: '' },
  errors: {},
  handleChange: jest.fn(),
  handleSubmit: jest.fn(),
  isValid: true,
  // ... other properties
});
```

### Issue: Async Testing Problems

**Symptoms:**
- Tests timeout
- Async operations don't complete
- Race conditions in tests

**Solutions:**

1. **Use Proper Async Testing:**
```typescript
// ❌ Not waiting for async operations
test('should load data', () => {
  render(<MyComponent />);
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});

// ✅ Wait for async operations
test('should load data', async () => {
  render(<MyComponent />);
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

2. **Mock Async Hooks:**
```typescript
// ✅ Mock async hook behavior
const mockUseSafeQuery = useSafeQuery as jest.MockedFunction<typeof useSafeQuery>;

mockUseSafeQuery.mockReturnValue({
  data: mockData,
  isLoading: false,
  error: null,
  hasValidData: true
});
```

## Build and Deployment Issues

### Issue: Build Failures

**Symptoms:**
```
Build failed with errors
TypeScript compilation errors
Module resolution errors
```

**Solutions:**

1. **Check TypeScript Configuration:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/hooks/*": ["src/shared/hooks/*"]
    }
  }
}
```

2. **Update Vite Configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/hooks': path.resolve(__dirname, './src/shared/hooks')
    }
  }
});
```

### Issue: Production Runtime Errors

**Symptoms:**
- App works in development but fails in production
- Minification breaks the code
- Environment-specific errors

**Solutions:**

1. **Check Environment Variables:**
```typescript
// ✅ Safe environment checks
const isDevelopment = process.env.NODE_ENV === 'development';
const enableDebug = isDevelopment && process.env.VITE_DEBUG_HOOKS === 'true';
```

2. **Test Production Build Locally:**
```bash
npm run build:client
npm run preview
```

## Rollback Procedures

### Emergency Rollback

If you encounter critical issues:

1. **Revert to Backup Branch:**
```bash
git checkout backup-before-migration
git checkout -b emergency-rollback
```

2. **Selective Rollback:**
```bash
# Rollback specific files
git checkout HEAD~1 -- src/components/problematic-component.tsx

# Rollback specific hook
git checkout HEAD~1 -- src/shared/hooks/problematic-hook.ts
```

### Gradual Rollback

For less critical issues:

1. **Disable New Hooks Temporarily:**
```typescript
// ✅ Feature flag for gradual rollback
const USE_NEW_HOOKS = process.env.VITE_USE_NEW_HOOKS === 'true';

const MyComponent = () => {
  const hookResult = USE_NEW_HOOKS 
    ? useNewHook()
    : useOldHook();
    
  return <div>{/* Component content */}</div>;
};
```

2. **Revert Individual Components:**
```typescript
// ✅ Revert one component at a time
import { useForm } from '../hooks/useForm'; // Temporarily use old hook
// import { useFormValidation } from '../shared/hooks/useFormValidation'; // New hook
```

## Getting Additional Help

### Debug Information to Collect

When reporting issues, include:

1. **Migration Report:**
```bash
npm run migrate:detect > migration-debug.txt
```

2. **Build Information:**
```bash
npm run build:client 2>&1 | tee build-debug.txt
```

3. **Hook Status:**
```bash
npm run hooks:consolidation-status > hooks-status.txt
```

4. **Environment Information:**
```bash
node --version > env-info.txt
npm --version >> env-info.txt
```

### Common Commands for Debugging

```bash
# Check for deprecated hook usage
npm run migrate:detect

# Apply automated fixes
npm run migrate:fix

# Check build without failing
npm run build:client:safe

# Run with verbose logging
DEBUG=* npm run dev

# Check bundle analysis
npm run build:client && npx vite-bundle-analyzer dist
```

### Resources

- [Comprehensive Migration Guide](./COMPREHENSIVE_MIGRATION_GUIDE.md)
- [Hook Configuration Guide](../configs/README.md)
- [Performance Optimization Guide](../performance/README.md)
- [Testing Guide](../testing/README.md)

Remember: Migration issues are usually straightforward to fix once you identify the root cause. Take it step by step, and don't hesitate to rollback if you encounter blocking issues.