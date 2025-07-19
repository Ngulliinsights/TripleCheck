import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Enhanced query client with advanced caching strategies
export const createEnhancedQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time based on data type
        staleTime: 1000 * 60 * 5, // 5 minutes default
        gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
        
        // Retry strategy
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        
        // Progressive retry delay
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Network mode for offline support
        networkMode: 'offlineFirst',
        
        // Refetch strategies
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        refetchOnMount: true,
      },
      mutations: {
        // Mutation retry strategy
        retry: (failureCount, error: any) => {
          // Don't retry mutations on client errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
        
        // Network mode for mutations
        networkMode: 'online',
      },
    },
  });

  return queryClient;
};

// Persistence configuration
export const createQueryPersister = () => {
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: 'triplecheck-query-cache',
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  });
};

// Cache invalidation strategies
export const cacheInvalidationStrategies = {
  // Invalidate user-related data
  invalidateUserData: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['users', userId] });
    queryClient.invalidateQueries({ queryKey: ['users', userId, 'notifications'] });
    queryClient.invalidateQueries({ queryKey: ['analytics', 'user', userId] });
  },

  // Invalidate property-related data
  invalidatePropertyData: (queryClient: QueryClient, propertyId?: string) => {
    if (propertyId) {
      queryClient.invalidateQueries({ queryKey: ['properties', 'detail', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'property', propertyId] });
    }
    queryClient.invalidateQueries({ queryKey: ['properties', 'list'] });
  },

  // Invalidate trust-related data
  invalidateTrustData: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['trust', 'scores', userId] });
    queryClient.invalidateQueries({ queryKey: ['fraud', 'alerts'] });
  },

  // Invalidate communication data
  invalidateMessageData: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['messages', 'list', userId] });
    queryClient.invalidateQueries({ queryKey: ['messages', 'threads', userId] });
  },

  // Global cache refresh
  refreshAllData: (queryClient: QueryClient) => {
    queryClient.invalidateQueries();
  },
};

// Cache warming strategies
export const cacheWarmingStrategies = {
  // Warm up user data after login
  warmUserData: async (queryClient: QueryClient, userId: string) => {
    // Prefetch user profile
    queryClient.prefetchQuery({
      queryKey: ['users', userId],
      queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });

    // Prefetch user notifications
    queryClient.prefetchQuery({
      queryKey: ['users', userId, 'notifications'],
      queryFn: () => fetch(`/api/users/${userId}/notifications`).then(res => res.json()),
      staleTime: 1000 * 60 * 2, // 2 minutes
    });
  },

  // Warm up property data for search results
  warmPropertyData: async (queryClient: QueryClient, propertyIds: string[]) => {
    propertyIds.forEach(id => {
      queryClient.prefetchQuery({
        queryKey: ['properties', 'detail', id],
        queryFn: () => fetch(`/api/properties/${id}`).then(res => res.json()),
        staleTime: 1000 * 60 * 15, // 15 minutes
      });
    });
  },

  // Warm up analytics data
  warmAnalyticsData: async (queryClient: QueryClient) => {
    queryClient.prefetchQuery({
      queryKey: ['analytics', 'metrics'],
      queryFn: () => fetch('/api/analytics/metrics').then(res => res.json()),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  },
};

// Background sync for offline support
export const backgroundSync = {
  // Sync pending mutations when online
  syncPendingMutations: async (queryClient: QueryClient) => {
    const mutationCache = queryClient.getMutationCache();
    const pendingMutations = mutationCache.getAll().filter(
      mutation => mutation.state.status === 'pending'
    );

    for (const mutation of pendingMutations) {
      try {
        await mutation.execute();
      } catch (error) {
        console.error('Failed to sync mutation:', error);
      }
    }
  },

  // Refresh stale data in background
  refreshStaleData: async (queryClient: QueryClient) => {
    const queryCache = queryClient.getQueryCache();
    const staleQueries = queryCache.getAll().filter(
      query => query.isStale() && query.state.data
    );

    for (const query of staleQueries) {
      try {
        await query.fetch();
      } catch (error) {
        console.error('Failed to refresh stale query:', error);
      }
    }
  },
};

// Performance monitoring
export const cachePerformanceMonitor = {
  // Monitor cache hit rates
  getCacheStats: (queryClient: QueryClient) => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      cachedQueries: queries.filter(q => q.state.data).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.error).length,
      loadingQueries: queries.filter(q => q.state.isFetching).length,
    };

    return {
      ...stats,
      cacheHitRate: stats.totalQueries > 0 ? (stats.cachedQueries / stats.totalQueries) * 100 : 0,
    };
  },

  // Log cache performance
  logCachePerformance: (queryClient: QueryClient) => {
    const stats = cachePerformanceMonitor.getCacheStats(queryClient);
    console.log('Cache Performance Stats:', stats);
    return stats;
  },
};