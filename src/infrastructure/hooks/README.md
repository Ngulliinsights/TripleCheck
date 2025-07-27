# Safe Effect and State Management Hooks

This directory contains React hooks designed to prevent race conditions and ensure proper cleanup in React components.

## Hooks Overview

### `useSafeEffect`
A safe version of `useEffect` that prevents memory leaks and race conditions by automatically cleaning up effects when components unmount.

```typescript
import { useSafeEffect } from '@infrastructure/hooks';

function MyComponent() {
  useSafeEffect(() => {
    const subscription = api.subscribe(data => {
      // Handle data
    });
    
    return () => subscription.unsubscribe();
  }, []);
}
```

### `useCoordinatedState`
Provides atomic state updates and prevents race conditions by coordinating multiple state updates.

```typescript
import { useCoordinatedState } from '@infrastructure/hooks';

function MyComponent() {
  const [state, updateState, { batch, reset, isPending }] = useCoordinatedState({
    count: 0,
    name: ''
  });

  const handleBatchUpdate = async () => {
    await batch([
      prev => ({ ...prev, count: prev.count + 1 }),
      prev => ({ ...prev, name: 'Updated' })
    ]);
  };
}
```

### `useCoordinatedMultiState`
Specialized version for managing multiple related state properties atomically.

```typescript
import { useCoordinatedMultiState } from '@infrastructure/hooks';

function MyComponent() {
  const [state, { update, updateMultiple, reset, isPending }] = useCoordinatedMultiState({
    user: null,
    loading: false,
    error: null
  });

  const loadUser = async () => {
    await update('loading', true);
    try {
      const user = await fetchUser();
      await updateMultiple({ user, loading: false });
    } catch (error) {
      await updateMultiple({ error, loading: false });
    }
  };
}
```

### `useCleanupManager`
Centralized cleanup management for components to prevent memory leaks.

```typescript
import { useCleanupManager } from '@infrastructure/hooks';

function MyComponent() {
  const cleanup = useCleanupManager();

  useEffect(() => {
    // Add cleanup functions
    cleanup.addCleanup(() => {
      console.log('Cleaning up...');
    }, 'my-cleanup');

    // Cleanup will run automatically on unmount
  }, []);

  const manualCleanup = () => {
    cleanup.runCleanup('my-cleanup');
  };
}
```

### `useEnhancedCleanupManager`
Enhanced version with automatic cleanup for common patterns.

```typescript
import { useEnhancedCleanupManager } from '@infrastructure/hooks';

function MyComponent() {
  const cleanup = useEnhancedCleanupManager();

  useEffect(() => {
    // Automatically managed timeout
    cleanup.addTimeout(() => {
      console.log('Timer fired');
    }, 1000);

    // Automatically managed interval
    cleanup.addInterval(() => {
      console.log('Interval tick');
    }, 500);

    // Automatically managed event listener
    cleanup.addEventListener(window, 'resize', handleResize);

    // Automatically managed abort controller
    const controller = new AbortController();
    cleanup.addAbortController(controller);
  }, []);
}
```

## Race Condition Prevention

These hooks work together to prevent common race conditions:

1. **Component Unmount Race Conditions**: `useSafeEffect` ensures effects are cleaned up properly
2. **State Update Race Conditions**: `useCoordinatedState` ensures atomic state updates
3. **Resource Cleanup Race Conditions**: `useCleanupManager` ensures proper resource disposal
4. **Async Operation Race Conditions**: All hooks coordinate to prevent conflicts

## Best Practices

1. **Always use `useSafeEffect`** instead of `useEffect` for effects that might cause memory leaks
2. **Use `useCoordinatedState`** for complex state that needs atomic updates
3. **Use `useCleanupManager`** for components with multiple cleanup requirements
4. **Combine hooks** for comprehensive race condition prevention

## Examples

See `examples/race-condition-prevention.tsx` for complete usage examples.

## Testing

All hooks are thoroughly tested. Run tests with:

```bash
npm test src/infrastructure/hooks
```

## Requirements Addressed

This implementation addresses the following requirements from the migration completion spec:

- **Requirement 2.3**: Atomic state updates to prevent race conditions
- **Requirement 2.4**: Proper component cleanup to prevent memory leaks
- **Race Condition Elimination**: Coordinated async operations and proper cleanup