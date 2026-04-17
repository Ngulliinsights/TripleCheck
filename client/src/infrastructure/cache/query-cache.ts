import { QueryClient } from '@tanstack/react-query'

// Query client with advanced caching strategies and infinite query prevention
// Phase 1 Optimization: Aggressive stale times to reduce redundant refetches
export const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // === PHASE 1 OPTIMIZATION: Aggressive stale times for verification data ===
        // Verification/trust data is read-heavy and doesn't change frequently
        staleTime: 1000 * 60 * 5, // 5 minutes (down from 10 for more responsiveness)
        gcTime: 1000 * 60 * 30, // 30 minutes garbage collection (unchanged)
        
        // Retry strategy
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 2 times for other errors (reduced from 3)
          return failureCount < 2;
        },
        
        // Progressive retry delay
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Network mode for offline support
        networkMode: 'offlineFirst',
        
        // === PHASE 1: Disable aggressive refetching to prevent N+1 ===
        // These were causing redundant queries when users navigated back/forth
        refetchOnWindowFocus: false, // Prevent refetch when user returns to tab
        refetchOnReconnect: false,   // Don't refetch immediately on reconnect
        refetchOnMount: false,        // Don't refetch when component remounts
        refetchInterval: false,       // Ensure no automatic background refetching
        refetchIntervalInBackground: false,
      },
      mutations: {
        // Mutation retry strategy
        retry: (failureCount, error: any) => {
          // Don't retry mutations on client errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 1; // Reduced from 2 to 1
        },
        
        // Network mode for mutations
        networkMode: 'online',
      },
    },
  });

  // Add query cache event listeners for debugging infinite queries
  if (process.env.NODE_ENV === 'development') {
    const queryCache = queryClient.getQueryCache();
    
    queryCache.subscribe((event) => {
      if (event.type === 'added') {
        const activeQueries = queryCache.getAll().filter(q => q.state.fetchStatus === 'fetching');
        if (activeQueries.length > 10) {
          console.warn(`[QueryClient] High number of active queries detected: ${activeQueries.length}`);
          console.log('Active queries:', activeQueries.map(q => q.queryKey));
        }
      }
    });
  }

  return queryClient;
};

// Persistence configuration (disabled - requires additional packages)
export const createQueryPersister = () => {
  console.warn('Query persistence is disabled - install @tanstack/react-query-persist-client-core and @tanstack/query-sync-storage-persister to enable');
  return null;
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

  // === PHASE 1: Enhanced trust/verification cache invalidation ===
  // Invalidate trust-related data with proper namespacing
  invalidateTrustData: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['trust', 'scores', userId] });
    queryClient.invalidateQueries({ queryKey: ['fraud', 'alerts'] });
    queryClient.invalidateQueries({ queryKey: ['verification', 'status'] });
    queryClient.invalidateQueries({ queryKey: ['land-verification', 'results'] });
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
        await mutation.execute(mutation.state.variables);
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
      loadingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
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


// Backward compatibility
export const createEnhancedQueryClient = createQueryClient
