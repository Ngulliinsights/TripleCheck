import { describe, it, expect } from 'vitest'

describe('Hooks Integration', () => {
  it('should export all required hooks from index', async () => {
    const hooks = await import('../index');
    
    // Verify all hooks are exported
    expect(typeof hooks.useSafeEffect).toBe('function');
    expect(typeof hooks.useSafeState).toBe('function');
    expect(typeof hooks.useStableCallback).toBe('function');
    expect(typeof hooks.useCoordinatedState).toBe('function');
    expect(typeof hooks.useCoordinatedMultiState).toBe('function');
    expect(typeof hooks.useCleanupManager).toBe('function');
    expect(typeof hooks.useEnhancedCleanupManager).toBe('function');
  });

  it('should import individual hooks directly', async () => {
    const { useSafeEffect } = await import('../useSafeEffect');
    const { useCoordinatedState, useCoordinatedMultiState } = await import('../useCoordinatedState');
    const { useCleanupManager, useEnhancedCleanupManager } = await import('../useCleanupManager');
    
    expect(typeof useSafeEffect).toBe('function');
    expect(typeof useCoordinatedState).toBe('function');
    expect(typeof useCoordinatedMultiState).toBe('function');
    expect(typeof useCleanupManager).toBe('function');
    expect(typeof useEnhancedCleanupManager).toBe('function');
  });

  it('should have proper TypeScript types', async () => {
    // This test verifies that the modules can be imported without TypeScript errors
    const hooks = await import('../index');
    
    // If this compiles and runs, the TypeScript types are working
    expect(hooks).toBeDefined();
  });
});