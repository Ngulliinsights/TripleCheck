import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

/**
 * Custom hook for optimistic mutations that prevent race conditions
 * and provide better UX with optimistic updates
 */
export function useOptimisticMutation<TData = unknown, TError = Error, TVariables = void, TContext = { previousData?: unknown }>(
  options: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onError' | 'onSettled'> & {
    queryKey: any[];
    optimisticUpdate?: (oldData: any, variables: TVariables) => any;
    onError?: (error: TError, variables: TVariables, context: TContext) => void;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext) => void;
  }
) {
  const queryClient = useQueryClient();

  const mutation = useMutation<TData, TError, TVariables, TContext>({
    ...options,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: options.queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(options.queryKey);

      // Optimistically update to the new value
      if (options.optimisticUpdate) {
        queryClient.setQueryData(options.queryKey, (old: any) => 
          options.optimisticUpdate!(old, variables)
        );
      }

      // Call original onMutate if provided
      const originalContext = await options.onMutate?.(variables);

      // Return a context object with the snapshotted value
      return { previousData, ...originalContext } as TContext;
    },
  });

  // Handle error callback using useEffect (React Query v5 pattern)
  useEffect(() => {
    if (mutation.isError && options.onError && mutation.error) {
      options.onError(mutation.error as TError, mutation.variables as TVariables, mutation.context as TContext);
      
      // Roll back optimistic update on error
      const context = mutation.context as { previousData?: unknown };
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(options.queryKey, context.previousData);
      }
    }
  }, [mutation.isError, mutation.error, mutation.variables, mutation.context, options.onError, queryClient, options.queryKey]);

  // Handle settled callback using useEffect (React Query v5 pattern)
  useEffect(() => {
    if (mutation.isSuccess || mutation.isError) {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: options.queryKey });

      if (options.onSettled) {
        options.onSettled(
          mutation.data as TData | undefined, 
          mutation.error as TError | null, 
          mutation.variables as TVariables, 
          mutation.context as TContext
        );
      }
    }
  }, [mutation.isSuccess, mutation.isError, mutation.data, mutation.error, mutation.variables, mutation.context, options.onSettled, queryClient, options.queryKey]);

  return mutation;
}