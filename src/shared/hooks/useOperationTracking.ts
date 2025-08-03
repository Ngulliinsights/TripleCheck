/**
 * React hooks for automatic operation tracking
 * 
 * These hooks integrate the OperationTracker with React's lifecycle
 * to automatically capture race conditions in React applications.
 */

import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useEffect, useRef, useCallback, useMemo } from 'react';

import { operationTracker, OperationType } from '@/infrastructure/monitoring/operation-tracker';

/**
 * Hook to track component lifecycle operations
 * 
 * This automatically tracks mount, unmount, and update operations
 * which are common sources of race conditions in React apps.
 * 
 * @param componentName - Name of the component for tracking
 * @param dependencies - Dependencies that trigger updates
 */
export function useComponentTracking(componentName: string, dependencies: any[] = []) {
  const mountOperationId = useRef<string>();
  const updateOperationId = useRef<string>();
  const renderCount = useRef(0);

  // Track component mount
  useEffect(() => {
    mountOperationId.current = operationTracker.startOperation(
      'component_mount',
      `Mount ${componentName}`,
      componentName,
      undefined,
      { renderCount: ++renderCount.current }
    );

    operationTracker.recordMilestone(
      mountOperationId.current,
      'completed',
      { mounted: true }
    );

    // Track component unmount
    return () => {
      const unmountOperationId = operationTracker.startOperation(
        'component_unmount',
        `Unmount ${componentName}`,
        componentName,
        mountOperationId.current
      );

      operationTracker.recordMilestone(
        unmountOperationId,
        'completed',
        { unmounted: true }
      );
    };
  }, [componentName]);

  // Track component updates
  useEffect(() => {
    if (renderCount.current > 1) { // Skip first render (mount)
      updateOperationId.current = operationTracker.startOperation(
        'component_update',
        `Update ${componentName}`,
        componentName,
        mountOperationId.current,
        { 
          renderCount: renderCount.current,
          dependencies: dependencies.map(dep => typeof dep === 'object' ? JSON.stringify(dep) : String(dep))
        }
      );

      operationTracker.recordMilestone(
        updateOperationId.current,
        'completed',
        { updated: true, dependencies }
      );
    }
  }, dependencies);

  return {
    mountOperationId: mountOperationId.current,
    updateOperationId: updateOperationId.current,
    renderCount: renderCount.current
  };
}

/**
 * Enhanced useQuery hook with automatic operation tracking
 * 
 * This wrapper tracks query operations to detect race conditions
 * like duplicate queries, infinite refetches, and query waterfalls.
 * 
 * @param options - Standard React Query options
 * @param trackingOptions - Additional tracking configuration
 */
export function useTrackedQuery<TData = unknown, TError = Error>(
  options: Parameters<typeof useQuery>[0],
  trackingOptions: {
    componentName?: string;
    description?: string;
    parentOperationId?: string;
  } = {}
) {
  const operationId = useRef<string>();
  const queryKey = JSON.stringify(options.queryKey);
  const componentName = trackingOptions.componentName || 'UnknownComponent';
  const description = trackingOptions.description || `Query ${queryKey}`;

  const result = useQuery(options);

  // Track query lifecycle
  useEffect(() => {
    if (result.isFetching && !operationId.current) {
      operationId.current = operationTracker.startOperation(
        'query_fetch',
        description,
        componentName,
        trackingOptions.parentOperationId,
        { 
          queryKey,
          enabled: options.enabled,
          staleTime: options.staleTime,
          refetchOnWindowFocus: options.refetchOnWindowFocus
        }
      );

      operationTracker.recordMilestone(
        operationId.current,
        'progress',
        undefined,
        undefined,
        { status: 'fetching' }
      );
    }
  }, [result.isFetching, queryKey, description, componentName]);

  // Track query success using useEffect (React Query v5 pattern)
  useEffect(() => {
    if (result.isSuccess && result.data && operationId.current) {
      operationTracker.recordMilestone(
        operationId.current,
        'completed',
        result.data,
        undefined,
        { queryKey, dataSize: JSON.stringify(result.data).length }
      );
    }
  }, [result.isSuccess, result.data, queryKey]);

  // Track query error using useEffect (React Query v5 pattern)
  useEffect(() => {
    if (result.isError && result.error && operationId.current) {
      operationTracker.recordMilestone(
        operationId.current,
        'failed',
        undefined,
        result.error as Error,
        { queryKey }
      );
    }
  }, [result.isError, result.error, queryKey]);

  // Detect potential infinite refetch loops
  const refetchCount = useRef(0);
  useEffect(() => {
    if (result.isFetching) {
      refetchCount.current++;
      
      // Warn about potential infinite loops
      if (refetchCount.current > 10) {
        console.warn(`🚨 Potential infinite query loop detected for ${queryKey}`, {
          refetchCount: refetchCount.current,
          operationId: operationId.current,
          componentName
        });
      }
    }
  }, [result.dataUpdatedAt, queryKey, componentName]);

  return {
    ...result,
    operationId: operationId.current
  };
}

/**
 * Enhanced useMutation hook with automatic operation tracking
 * 
 * This wrapper tracks mutation operations to detect race conditions
 * like concurrent mutations and mutation chains.
 * 
 * @param options - Standard React Query mutation options (without deprecated callbacks)
 * @param trackingOptions - Additional tracking configuration
 */
export function useTrackedMutation<TData = unknown, TError = Error, TVariables = void>(
  options: Omit<Parameters<typeof useMutation>[0], 'onSuccess' | 'onError' | 'onSettled'> & {
    onSuccess?: (data: TData, variables: TVariables, context: any) => void;
    onError?: (error: TError, variables: TVariables, context: any) => void;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: any) => void;
  },
  trackingOptions: {
    componentName?: string;
    description?: string;
    parentOperationId?: string;
  } = {}
): UseMutationResult<TData, TError, TVariables> & { operationId?: string } {
  const operationId = useRef<string>();
  const componentName = trackingOptions.componentName || 'UnknownComponent';
  const description = trackingOptions.description || 'Mutation';

  const trackedOptions = useMemo(() => ({
    ...options,
    onMutate: (variables: TVariables) => {
      operationId.current = operationTracker.startOperation(
        'mutation',
        description,
        componentName,
        trackingOptions.parentOperationId,
        { variables: JSON.stringify(variables) }
      );

      operationTracker.recordMilestone(
        operationId.current,
        'progress',
        variables,
        undefined,
        { status: 'mutating' }
      );

      return options.onMutate?.(variables);
    },
  }), [options, description, componentName]);

  const result = useMutation(trackedOptions as any);

  // Handle success callback using useEffect (React Query v5 pattern)
  useEffect(() => {
    if (result.isSuccess && options.onSuccess && result.data !== undefined) {
      if (operationId.current) {
        operationTracker.recordMilestone(
          operationId.current,
          'completed',
          result.data,
          undefined,
          { variables: JSON.stringify(result.variables) }
        );
      }
      options.onSuccess(result.data as TData, result.variables as TVariables, result.context as any);
    }
  }, [result.isSuccess, result.data, result.variables, result.context, options.onSuccess]);

  // Handle error callback using useEffect (React Query v5 pattern)
  useEffect(() => {
    if (result.isError && options.onError && result.error) {
      if (operationId.current) {
        operationTracker.recordMilestone(
          operationId.current,
          'failed',
          undefined,
          result.error as Error,
          { variables: JSON.stringify(result.variables) }
        );
      }
      options.onError(result.error as TError, result.variables as TVariables, result.context as any);
    }
  }, [result.isError, result.error, result.variables, result.context, options.onError]);

  // Handle settled callback using useEffect (React Query v5 pattern)
  useEffect(() => {
    if ((result.isSuccess || result.isError) && options.onSettled) {
      options.onSettled(
        result.data as TData | undefined, 
        result.error as TError | null, 
        result.variables as TVariables, 
        result.context as any
      );
    }
  }, [result.isSuccess, result.isError, result.data, result.error, result.variables, result.context, options.onSettled]);

  return result as any;
}

/**
 * Hook to track user interactions that might trigger race conditions
 * 
 * This is useful for tracking button clicks, form submissions, and other
 * user actions that can trigger cascading operations.
 * 
 * @param componentName - Name of the component
 */
export function useInteractionTracking(componentName: string) {
  const trackInteraction = useCallback((
    interactionType: string,
    description: string,
    metadata: Record<string, any> = {}
  ) => {
    const operationId = operationTracker.startOperation(
      'user_interaction',
      `${interactionType}: ${description}`,
      componentName,
      undefined,
      { interactionType, ...metadata }
    );

    // Complete immediately since user interactions are synchronous
    operationTracker.recordMilestone(
      operationId,
      'completed',
      { interactionType, timestamp: Date.now() }
    );

    return operationId;
  }, [componentName]);

  return { trackInteraction };
}

/**
 * Hook to track effect operations that might cause race conditions
 * 
 * This automatically tracks useEffect operations to identify
 * effects that run too frequently or cause infinite loops.
 * 
 * @param effectName - Name of the effect for tracking
 * @param dependencies - Effect dependencies
 * @param componentName - Component name for context
 */
export function useTrackedEffect(
  effectName: string,
  effect: React.EffectCallback,
  dependencies: React.DependencyList,
  componentName: string
) {
  const operationId = useRef<string>();
  const runCount = useRef(0);

  useEffect(() => {
    runCount.current++;
    
    operationId.current = operationTracker.startOperation(
      'effect_run',
      `Effect: ${effectName}`,
      componentName,
      undefined,
      { 
        runCount: runCount.current,
        dependencies: dependencies?.map(dep => 
          typeof dep === 'object' ? JSON.stringify(dep) : String(dep)
        ) || []
      }
    );

    // Warn about effects running too frequently
    if (runCount.current > 20) {
      console.warn(`🚨 Effect "${effectName}" has run ${runCount.current} times`, {
        componentName,
        operationId: operationId.current
      });
    }

    const cleanup = effect();

    operationTracker.recordMilestone(
      operationId.current,
      'completed',
      { effectName, runCount: runCount.current }
    );

    return cleanup;
  }, dependencies);

  return {
    operationId: operationId.current,
    runCount: runCount.current
  };
}

/**
 * Hook to get operation tracking debug information
 * 
 * This provides real-time debugging information about operations
 * in the current component context.
 * 
 * @param componentName - Component name to filter operations
 */
export function useOperationDebug(componentName?: string) {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const updateDebugInfo = () => {
      const report = operationTracker.getDebugReport();
      const componentOperations = componentName 
        ? operationTracker.queryOperations({ context: componentName, limit: 10 })
        : [];

      setDebugInfo({
        ...report,
        componentOperations
      });
    };

    // Update debug info periodically
    const interval = setInterval(updateDebugInfo, 1000);
    updateDebugInfo(); // Initial update

    return () => clearInterval(interval);
  }, [componentName]);

  const logTimeline = useCallback(() => {
    console.log(operationTracker.generateTimeline());
  }, []);

  const logRaceConditions = useCallback(() => {
    const patterns = operationTracker.analyzeRaceConditions();
    console.table(patterns);
  }, []);

  return {
    debugInfo,
    logTimeline,
    logRaceConditions,
    clearTracking: () => operationTracker.clear()
  };
}

// Import useState for useOperationDebug
import { useState } from 'react';