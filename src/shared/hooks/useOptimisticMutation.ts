import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Context type that includes previous data for rollback scenarios
 */
interface OptimisticContext<T = unknown> {
  previousData?: T;
}

/**
 * Enhanced mutation options that support optimistic updates
 */
interface OptimisticMutationOptions<TData, TError, TVariables, TContext> 
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onError' | 'onSettled' | 'onMutate'> {
  queryKey: readonly unknown[];
  optimisticUpdate?: (oldData: unknown, variables: TVariables) => unknown;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
  onSettled?: (
    data: TData | undefined, 
    error: TError | null, 
    variables: TVariables, 
    context: TContext | undefined
  ) => void;
  onMutate?: (variables: TVariables) => Promise<TContext | undefined> | TContext | undefined;
}

/**
 * Custom hook for optimistic mutations that prevent race conditions
 * and provide better UX with optimistic updates
 * 
 * This hook automatically handles:
 * - Canceling outgoing queries to prevent race conditions
 * - Applying optimistic updates immediately for better perceived performance
 * - Rolling back changes on error
 * - Refetching data after completion to ensure consistency
 */
export function useOptimisticMutation<
  TData = unknown, 
  TError = Error, 
  TVariables = void, 
  TContext extends OptimisticContext = OptimisticContext
>(
  options: OptimisticMutationOptions<TData, TError, TVariables, TContext>
) {
  const queryClient = useQueryClient();
  
  // Use refs to store the latest callback references to avoid stale closures
  const onErrorRef = useRef(options.onError);
  const onSettledRef = useRef(options.onSettled);
  const optimisticUpdateRef = useRef(options.optimisticUpdate);
  
  // Update refs whenever options change
  useEffect(() => {
    onErrorRef.current = options.onError;
    onSettledRef.current = options.onSettled;
    optimisticUpdateRef.current = options.optimisticUpdate;
  });

  // Create the onMutate function that handles optimistic updates
  const handleMutate = useCallback(async (variables: TVariables): Promise<TContext> => {
    // Cancel any outgoing re-fetches to prevent race conditions
    await queryClient.cancelQueries({ queryKey: options.queryKey });

    // Snapshot the previous value for potential rollback
    const previousData = queryClient.getQueryData(options.queryKey);

    // Apply optimistic update if provided
    if (optimisticUpdateRef.current) {
      queryClient.setQueryData(options.queryKey, (old: unknown) =>
        optimisticUpdateRef.current!(old, variables)
      );
    }

    // Call original onMutate if provided and merge contexts
    const originalContext = await options.onMutate?.(variables);
    
    // Return combined context with previous data for rollback capability
    return { 
      previousData, 
      ...(originalContext || {}) 
    } as TContext;
  }, [queryClient, options.queryKey, options.onMutate]);

  // Create the main mutation with our custom onMutate
  const mutation = useMutation<TData, TError, TVariables, TContext>({
    ...options,
    onMutate: handleMutate,
  });

  // Handle error scenarios with rollback functionality
  useEffect(() => {
    if (mutation.isError && mutation.error && onErrorRef.current) {
      // Execute the error callback
      onErrorRef.current(
        mutation.error as TError, 
        mutation.variables as TVariables, 
        mutation.context
      );

      // Roll back optimistic update on error
      const context = mutation.context as OptimisticContext | undefined;
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(options.queryKey, context.previousData);
      }
    }
  }, [
    mutation.isError, 
    mutation.error, 
    mutation.variables, 
    mutation.context,
    queryClient,
    options.queryKey
  ]);

  // Handle completion scenarios (both success and error)
  useEffect(() => {
    if (mutation.isSuccess || mutation.isError) {
      // Always invalidate queries after completion to ensure data consistency
      queryClient.invalidateQueries({ queryKey: options.queryKey });

      // Execute settled callback if provided
      if (onSettledRef.current) {
        onSettledRef.current(
          mutation.data as TData | undefined,
          mutation.error as TError | null,
          mutation.variables as TVariables,
          mutation.context
        );
      }
    }
  }, [
    mutation.isSuccess, 
    mutation.isError, 
    mutation.data, 
    mutation.error, 
    mutation.variables, 
    mutation.context,
    queryClient,
    options.queryKey
  ]);

  return mutation;
}