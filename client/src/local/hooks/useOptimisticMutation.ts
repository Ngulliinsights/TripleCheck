/**
 * Optimistic Mutation Hook
 *
 * Wraps React Query's useMutation to:
 *  - Cancel outgoing queries before mutation (prevents race conditions)
 *  - Apply an optimistic update immediately for perceived-performance
 *  - Roll back on error
 *  - Invalidate the query after settlement to ensure consistency
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

export interface OptimisticContext<T = unknown> {
  previousData?: T;
}

interface OptimisticMutationOptions<TData, TError, TVariables, TContext extends OptimisticContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onError' | 'onSettled' | 'onMutate'> {
  queryKey:          readonly unknown[];
  optimisticUpdate?: (oldData: unknown, variables: TVariables) => unknown;
  onError?:          (error: TError, variables: TVariables, context: TContext | undefined) => void;
  onSettled?:        (
    data:      TData | undefined,
    error:     TError | null,
    variables: TVariables,
    context:   TContext | undefined,
  ) => void;
  onMutate?: (variables: TVariables) => Promise<TContext | undefined> | TContext | undefined;
}

export function useOptimisticMutation<
  TData    = unknown,
  TError   = Error,
  TVariables = void,
  TContext extends OptimisticContext = OptimisticContext,
>(options: OptimisticMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient();

  // Store the latest callbacks in refs to avoid stale closure issues while
  // keeping the mutation option object stable.
  const onErrorRef           = useRef(options.onError);
  const onSettledRef         = useRef(options.onSettled);
  const optimisticUpdateRef  = useRef(options.optimisticUpdate);
  const onMutateRef          = useRef(options.onMutate);

  useEffect(() => {
    onErrorRef.current          = options.onError;
    onSettledRef.current        = options.onSettled;
    optimisticUpdateRef.current = options.optimisticUpdate;
    onMutateRef.current         = options.onMutate;
  });

  const handleMutate = useCallback(async (variables: TVariables): Promise<TContext> => {
    // Cancel outgoing re-fetches to prevent overwriting the optimistic state
    await queryClient.cancelQueries({ queryKey: options.queryKey });

    const previousData = queryClient.getQueryData(options.queryKey);

    if (optimisticUpdateRef.current) {
      queryClient.setQueryData(
        options.queryKey,
        (old: unknown) => optimisticUpdateRef.current!(old, variables),
      );
    }

    const originalContext = await onMutateRef.current?.(variables);
    return { previousData, ...(originalContext ?? {}) } as TContext;
  }, [queryClient, options.queryKey]);

  const mutation = useMutation<TData, TError, TVariables, TContext>({
    ...options,
    onMutate: handleMutate,
  });

  // Roll back + fire user's onError
  useEffect(() => {
    if (!mutation.isError || !mutation.error) return;

    onErrorRef.current?.(
      mutation.error as TError,
      mutation.variables as TVariables,
      mutation.context,
    );

    const ctx = mutation.context as OptimisticContext | undefined;
    if (ctx?.previousData !== undefined)
      queryClient.setQueryData(options.queryKey, ctx.previousData);
  }, [
    mutation.isError, mutation.error, mutation.variables, mutation.context,
    queryClient, options.queryKey,
  ]);

  // Invalidate + fire onSettled after any settlement
  useEffect(() => {
    if (!mutation.isSuccess && !mutation.isError) return;

    queryClient.invalidateQueries({ queryKey: options.queryKey });

    onSettledRef.current?.(
      mutation.data as TData | undefined,
      mutation.error as TError | null,
      mutation.variables as TVariables,
      mutation.context,
    );
  }, [
    mutation.isSuccess, mutation.isError,
    mutation.data, mutation.error, mutation.variables, mutation.context,
    queryClient, options.queryKey,
  ]);

  return mutation;
}