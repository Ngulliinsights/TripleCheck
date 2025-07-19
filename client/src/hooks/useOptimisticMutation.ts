import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Custom hook for optimistic mutations that prevent race conditions
 * and provide better UX with optimistic updates
 */
export function useOptimisticMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    queryKey: any[];
    optimisticUpdate?: (oldData: any, variables: TVariables) => any;
  }
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
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
      const context = await options.onMutate?.(variables);

      // Return a context object with the snapshotted value
      return { previousData, ...context };
    },
    onError: (err, variables, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(options.queryKey, context.previousData);
      }

      // Call original onError if provided
      options.onError?.(err, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: options.queryKey });

      // Call original onSettled if provided
      options.onSettled?.(data, error, variables, context);
    },
  });

  return mutation;
}