/**
 * Deprecation utilities for hook consolidation
 */

export interface DeprecationOptions {
  hookName: string;
  replacement: string;
  migrationGuide?: string;
  version?: string;
}

/**
 * Shows deprecation warning in development mode
 */
export function showDeprecationWarning({
  hookName,
  replacement,
  migrationGuide,
  version = 'next major version'
}: DeprecationOptions): void {
  if (process.env.NODE_ENV === 'development') {
    const message = [
      `⚠️  ${hookName} is deprecated and will be removed in ${version}.`,
      `Please use ${replacement} instead.`,
      migrationGuide && `Migration guide: ${migrationGuide}`,
    ].filter(Boolean).join('\n   ');

    console.warn(message);
  }
}

/**
 * Creates a compatibility wrapper for gradual migration
 */
export function createCompatibilityWrapper<TOldOptions, TNewOptions, TReturn>(
  deprecationInfo: DeprecationOptions,
  newHook: (options: TNewOptions) => TReturn,
  optionsMapper: (oldOptions: TOldOptions) => TNewOptions
) {
  return (oldOptions: TOldOptions): TReturn => {
    showDeprecationWarning(deprecationInfo);
    const mappedOptions = optionsMapper(oldOptions);
    return newHook(mappedOptions);
  };
}

/**
 * Hook registry to track consolidation status
 */
export interface HookRegistryEntry {
  name: string;
  category: 'core' | 'ui' | 'performance' | 'specialized';
  status: 'active' | 'deprecated' | 'consolidated';
  consolidatedInto?: string;
  migrationGuide?: string;
  removedInVersion?: string;
}

class HookRegistry {
  private registry = new Map<string, HookRegistryEntry>();

  register(entry: HookRegistryEntry): void {
    this.registry.set(entry.name, entry);
  }

  get(hookName: string): HookRegistryEntry | undefined {
    return this.registry.get(hookName);
  }

  getByStatus(status: HookRegistryEntry['status']): HookRegistryEntry[] {
    return Array.from(this.registry.values()).filter(entry => entry.status === status);
  }

  getByCategory(category: HookRegistryEntry['category']): HookRegistryEntry[] {
    return Array.from(this.registry.values()).filter(entry => entry.category === category);
  }

  getAllEntries(): HookRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  isDeprecated(hookName: string): boolean {
    const entry = this.registry.get(hookName);
    return entry?.status === 'deprecated' || entry?.status === 'consolidated';
  }

  getDeprecationInfo(hookName: string): DeprecationOptions | null {
    const entry = this.registry.get(hookName);
    if (!entry || entry.status === 'active') return null;

    return {
      hookName: entry.name,
      replacement: entry.consolidatedInto || 'unknown',
      migrationGuide: entry.migrationGuide,
      version: entry.removedInVersion,
    };
  }
}

export const hookRegistry = new HookRegistry();

// Register known hooks for consolidation
hookRegistry.register({
  name: 'useForm',
  category: 'core',
  status: 'deprecated',
  consolidatedInto: 'useFormValidation',
  migrationGuide: '/docs/hook-migration.md#useform-to-useformvalidation',
  removedInVersion: 'v2.0.0',
});

hookRegistry.register({
  name: 'useAccessibility.ts (basic)',
  category: 'ui',
  status: 'consolidated',
  consolidatedInto: 'useAccessibility.tsx (comprehensive)',
  migrationGuide: '/docs/hook-migration.md#accessibility-consolidation',
});

hookRegistry.register({
  name: 'usePerformanceMonitor',
  category: 'performance',
  status: 'consolidated',
  consolidatedInto: 'useComponentPerformance',
  migrationGuide: '/docs/hook-migration.md#performance-monitoring',
});

hookRegistry.register({
  name: 'useVirtualizationHelpers',
  category: 'performance',
  status: 'consolidated',
});

hookRegistry.register({
  name: 'useForm',
  category: 'forms',
  status: 'consolidated',
  consolidatedInto: 'useMemoryOptimization (useVirtualization)',
  migrationGuide: '/docs/hook-migration.md#virtualization-consolidation',
});

hookRegistry.register({
  name: 'usePaginatedQuery',
  category: 'core',
  status: 'consolidated',
  consolidatedInto: 'usePagination',
  migrationGuide: '/docs/hook-migration.md#pagination-unification',
});

hookRegistry.register({
  name: 'useInfiniteScroll',
  category: 'core',
  status: 'consolidated',
  consolidatedInto: 'usePagination',
  migrationGuide: '/docs/hook-migration.md#pagination-unification',
});

/**
 * Development helper to check for deprecated hook usage
 */
export function checkDeprecatedHookUsage(): void {
  if (process.env.NODE_ENV === 'development') {
    const deprecatedHooks = hookRegistry.getByStatus('deprecated');
    const consolidatedHooks = hookRegistry.getByStatus('consolidated');
    
    if (deprecatedHooks.length > 0 || consolidatedHooks.length > 0) {
      console.group('🔄 Hook Consolidation Status');
      
      if (deprecatedHooks.length > 0) {
        console.warn('Deprecated hooks found:', deprecatedHooks.map(h => h.name));
      }
      
      if (consolidatedHooks.length > 0) {
        console.info('Consolidated hooks:', consolidatedHooks.map(h => `${h.name} → ${h.consolidatedInto}`));
      }
      
      console.groupEnd();
    }
  }
}