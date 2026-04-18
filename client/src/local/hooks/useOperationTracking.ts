/**
 * Operation Tracking Hooks
 *
 * Integrates OperationTracker with React's lifecycle to automatically
 * surface race conditions, infinite loops, and cascading effects.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuery, useMutation, UseQueryOptions, UseMutationResult } from '@tanstack/react-query'

import { operationTracker } from '../../infrastructure/monitoring/operation-tracker'

// ---------------------------------------------------------------------------
// useComponentTracking
// ---------------------------------------------------------------------------

export function useComponentTracking(componentName: string, dependencies: unknown[] = []) {
  const mountIdRef  = useRef<string>();
  const updateIdRef = useRef<string>();
  const renderCount = useRef(0);

  // Track mount / unmount
  useEffect(() => {
    mountIdRef.current = operationTracker.startOperation(
      'component_mount', `Mount ${componentName}`, componentName,
      undefined, { renderCount: ++renderCount.current },
    );
    operationTracker.recordMilestone(mountIdRef.current, 'completed', { mounted: true });

    return () => {
      const unmountId = operationTracker.startOperation(
        'component_unmount', `Unmount ${componentName}`, componentName, mountIdRef.current,
      );
      operationTracker.recordMilestone(unmountId, 'completed', { unmounted: true });
    };
  }, [componentName]);

  // Track updates (skip initial mount)
  useEffect(() => {
    if (renderCount.current <= 1) return;

    updateIdRef.current = operationTracker.startOperation(
      'component_update', `Update ${componentName}`, componentName, mountIdRef.current,
      { renderCount: renderCount.current, dependencies: dependencies.map(String) },
    );
    operationTracker.recordMilestone(updateIdRef.current, 'completed', { updated: true, dependencies });
  // eslint-disable-next-line
  }, dependencies);

  return {
    mountOperationId:  mountIdRef.current,
    updateOperationId: updateIdRef.current,
    renderCount:       renderCount.current,
  };
}

// ---------------------------------------------------------------------------
// useTrackedQuery
// ---------------------------------------------------------------------------

export function useTrackedQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError>,
  tracking: { componentName?: string; description?: string; parentOperationId?: string } = {},
) {
  const operationId   = useRef<string>();
  const refetchCount  = useRef(0);
  const queryKey      = JSON.stringify(options.queryKey);
  const componentName = tracking.componentName ?? 'UnknownComponent';
  const description   = tracking.description   ?? `Query ${queryKey}`;

  const result = useQuery(options);

  useEffect(() => {
    if (result.isFetching && !operationId.current) {
      operationId.current = operationTracker.startOperation(
        'query_fetch', description, componentName, tracking.parentOperationId,
        { queryKey, enabled: options.enabled, staleTime: options.staleTime },
      );
      operationTracker.recordMilestone(operationId.current, 'progress', undefined, undefined, { status: 'fetching' });
    }
  }, [result.isFetching, queryKey, description, componentName, tracking.parentOperationId, options.enabled, options.staleTime]);

  useEffect(() => {
    if (result.isSuccess && result.data && operationId.current) {
      operationTracker.recordMilestone(operationId.current, 'completed', result.data, undefined, { queryKey });
    }
  }, [result.isSuccess, result.data, queryKey]);

  useEffect(() => {
    if (result.isError && result.error && operationId.current) {
      operationTracker.recordMilestone(operationId.current, 'failed', undefined, result.error as unknown as Error, { queryKey });
    }
  }, [result.isError, result.error, queryKey]);

  // Detect potential infinite refetch loops
  useEffect(() => {
    if (result.isFetching) {
      refetchCount.current++;
      if (refetchCount.current > 10) {
        // eslint-disable-next-line no-console
        console.warn(`🚨 Potential infinite query loop: ${queryKey} (${refetchCount.current} fetches)`, {
          componentName, operationId: operationId.current,
        });
      }
    }
  }, [result.dataUpdatedAt, queryKey, componentName]);

  return { ...result, operationId: operationId.current };
}

// ---------------------------------------------------------------------------
// useTrackedMutation
// ---------------------------------------------------------------------------

type TrackedMutationOptions<TData, TError, TVariables> =
  Omit<Parameters<typeof useMutation>[0], 'onSuccess' | 'onError' | 'onSettled'> & {
    onSuccess?: (data: TData, variables: TVariables, context: unknown) => void;
    onError?:   (error: TError, variables: TVariables, context: unknown) => void;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: unknown) => void;
  };

export function useTrackedMutation<TData = unknown, TError = Error, TVariables = void>(
  options:  TrackedMutationOptions<TData, TError, TVariables>,
  tracking: { componentName?: string; description?: string; parentOperationId?: string } = {},
): UseMutationResult<TData, TError, TVariables> & { operationId?: string } {
  const operationId   = useRef<string>();
  const componentName = tracking.componentName ?? 'UnknownComponent';
  const description   = tracking.description   ?? 'Mutation';

  // Stable callbacks via refs to avoid re-creating trackedOptions on every render
  const onSuccessRef  = useRef(options.onSuccess);
  const onErrorRef    = useRef(options.onError);
  const onSettledRef  = useRef(options.onSettled);
  useEffect(() => {
    onSuccessRef.current  = options.onSuccess;
    onErrorRef.current    = options.onError;
    onSettledRef.current  = options.onSettled;
  });

  const trackedOptions = useMemo(() => ({
    ...options,
    onMutate: (variables: TVariables) => {
      operationId.current = operationTracker.startOperation(
        'mutation', description, componentName, tracking.parentOperationId,
        { variables: JSON.stringify(variables) },
      );
      operationTracker.recordMilestone(operationId.current, 'progress', variables, undefined, { status: 'mutating' });
      return (options as { onMutate?: (v: TVariables) => unknown }).onMutate?.(variables);
    },
  }), // eslint-disable-next-line
  [description, componentName, tracking.parentOperationId]);

  const result = useMutation(trackedOptions as Parameters<typeof useMutation>[0]);

  useEffect(() => {
    if (result.isSuccess && result.data !== undefined) {
      if (operationId.current)
        operationTracker.recordMilestone(operationId.current, 'completed', result.data);
      onSuccessRef.current?.(result.data as TData, result.variables as TVariables, result.context);
    }
  }, [result.isSuccess, result.data, result.variables, result.context]);

  useEffect(() => {
    if (result.isError && result.error) {
      if (operationId.current)
        operationTracker.recordMilestone(operationId.current, 'failed', undefined, result.error as Error);
      onErrorRef.current?.(result.error as TError, result.variables as TVariables, result.context);
    }
  }, [result.isError, result.error, result.variables, result.context]);

  useEffect(() => {
    if (result.isSuccess || result.isError)
      onSettledRef.current?.(
        result.data as TData | undefined,
        result.error as TError | null,
        result.variables as TVariables,
        result.context,
      );
  }, [result.isSuccess, result.isError, result.data, result.error, result.variables, result.context]);

  return result as UseMutationResult<TData, TError, TVariables> & { operationId?: string };
}

// ---------------------------------------------------------------------------
// useInteractionTracking
// ---------------------------------------------------------------------------

export function useInteractionTracking(componentName: string) {
  const trackInteraction = useCallback(
    (type: string, description: string, metadata: Record<string, unknown> = {}) => {
      const id = operationTracker.startOperation(
        'user_interaction', `${type}: ${description}`, componentName,
        undefined, { interactionType: type, ...metadata },
      );
      operationTracker.recordMilestone(id, 'completed', { interactionType: type, timestamp: Date.now() });
      return id;
    },
    [componentName],
  );
  return { trackInteraction };
}

// ---------------------------------------------------------------------------
// useTrackedEffect
// ---------------------------------------------------------------------------

export function useTrackedEffect(
  effectName:  string,
  effect:      React.EffectCallback,
  dependencies: React.DependencyList,
  componentName: string,
) {
  const operationId = useRef<string>();
  const runCount    = useRef(0);

  useEffect(() => {
    runCount.current++;
    operationId.current = operationTracker.startOperation(
      'effect_run', `Effect: ${effectName}`, componentName,
      undefined, { runCount: runCount.current, dependencies: dependencies.map(String) },
    );

    if (runCount.current > 20) {
      // eslint-disable-next-line no-console
      console.warn(`🚨 Effect "${effectName}" has run ${runCount.current} times`, { componentName });
    }

    const cleanup = effect();
    operationTracker.recordMilestone(operationId.current, 'completed', { effectName, runCount: runCount.current });
    return cleanup;
  // eslint-disable-next-line
  }, dependencies);

  return { operationId: operationId.current, runCount: runCount.current };
}

// ---------------------------------------------------------------------------
// useOperationDebug
// ---------------------------------------------------------------------------

export function useOperationDebug(componentName?: string) {
  const [debugInfo, setDebugInfo] = useState<unknown>(null);

  useEffect(() => {
    const update = () => {
      const report               = operationTracker.getDebugReport();
      const componentOperations  = componentName
        ? operationTracker.queryOperations({ context: componentName, limit: 10 })
        : [];
      setDebugInfo({ ...report, componentOperations });
    };
    const id = setInterval(update, 1_000);
    update();
    return () => clearInterval(id);
  }, [componentName]);

  const logTimeline       = useCallback(() => { // eslint-disable-next-line no-console
    console.log(operationTracker.generateTimeline());
  }, []);
  const logRaceConditions = useCallback(() => { // eslint-disable-next-line no-console
    console.table(operationTracker.analyzeRaceConditions());
  }, []);

  return { debugInfo, logTimeline, logRaceConditions, clearTracking: () => operationTracker.clear() };
}