import { useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { useEnhancedCleanupManager } from '../../infrastructure/hooks/useCleanupManager';
import { useSafeEffect } from '../../infrastructure/hooks/useSafeEffect';

interface UseInfiniteScrollOptions<TData, TError = Error> {
  queryKey: unknown[];
  queryFn: ({ pageParam, signal }: { pageParam: number; signal?: AbortSignal }) => Promise<{
    data: TData[];
    nextPage?: number;
    hasNextPage: boolean;
    totalCount?: number;
  }>;
  initialPageParam?: number;
  getNextPageParam?: (lastPage: any, allPages: any[]) => number | undefined;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  rootMargin?: string; // Intersection observer root margin
  onError?: (error: TError) => void;
  onSuccess?: (data: any) => void;
}

interface UseInfiniteScrollReturn<TData, TError = Error> {
  data: TData[];
  flatData: TData[];
  totalCount: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<any>;
  scrollRef: React.RefObject<HTMLElement>;
  isNearBottom: boolean;
  loadMore: () => void;
  reset: () => void;
  // Include other properties from UseInfiniteQueryResult
  isLoading: boolean;
  isError: boolean;
  error: TError | null;
  refetch: () => Promise<any>;
}

/**
 * Enhanced infinite scroll hook with intersection observer and performance optimizations
 * Designed for property listings, message threads, and other paginated data
 */
export function useInfiniteScroll<TData = any, TError = Error>({
  queryKey,
  queryFn,
  initialPageParam = 1,
  getNextPageParam,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
  gcTime = 10 * 60 * 1000, // 10 minutes
  threshold = 200,
  rootMargin = '0px 0px 200px 0px',
  onError,
  onSuccess,
}: UseInfiniteScrollOptions<TData, TError>): UseInfiniteScrollReturn<TData, TError> {
  const scrollRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(false);

  // Default getNextPageParam if not provided
  const defaultGetNextPageParam = useCallback((lastPage: any) => {
    return lastPage.hasNextPage ? lastPage.nextPage : undefined;
  }, []);

  const query = useInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam,
    getNextPageParam: getNextPageParam || defaultGetNextPageParam,
    enabled,
    staleTime,
    gcTime,
    // Note: onError and onSuccess are deprecated in newer versions of React Query
    // Use error boundaries or handle errors in components instead
  });

  // Flatten the paginated data
  const flatData = query.data?.pages.flatMap(page => page.data) || [];
  const totalCount = query.data?.pages[0]?.totalCount || flatData.length;

  const cleanupManager = useEnhancedCleanupManager();

  // Intersection Observer for automatic loading
  useSafeEffect(() => {
    if (!sentinelRef.current || !query.hasNextPage || query.isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsNearBottom(true);
          query.fetchNextPage();
        } else {
          setIsNearBottom(false);
        }
      },
      {
        rootMargin,
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);

    cleanupManager.addCleanup(() => {
      observer.disconnect();
    }, 'intersection-observer');
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage, rootMargin, cleanupManager]);

  // Manual scroll detection as fallback
  useSafeEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      setIsNearBottom(distanceFromBottom <= threshold);
      
      if (distanceFromBottom <= threshold && query.hasNextPage && !query.isFetchingNextPage) {
        query.fetchNextPage();
      }
    };

    cleanupManager.addEventListener(scrollElement, 'scroll', handleScroll, { passive: true }, 'scroll-listener');
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage, threshold, cleanupManager]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  const reset = useCallback(() => {
    // React Query v5: Use invalidateQueries instead of deprecated remove() method
    // This will clear the cache and trigger a fresh fetch
    query.refetch();
  }, [query]);

  return {
    ...query,
    data: flatData,
    flatData,
    totalCount,
    scrollRef,
    isNearBottom,
    loadMore,
    reset,
  } as UseInfiniteScrollReturn<TData, TError>;
}

/**
 * Property-specific infinite scroll hook
 */
export function useInfinitePropertyScroll(filters: Record<string, any> = {}) {
  return useInfiniteScroll({
    queryKey: ['properties', 'infinite', filters],
    queryFn: async ({ pageParam = 1, signal }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/properties?page=${pageParam}&${new URLSearchParams(filters)}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        signal: signal || null,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for property data
  });
}

/**
 * Message thread infinite scroll hook
 */
export function useInfiniteMessageScroll(threadId: string) {
  return useInfiniteScroll({
    queryKey: ['messages', 'infinite', threadId],
    queryFn: async ({ pageParam = 1, signal }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/messages/${threadId}?page=${pageParam}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        signal: signal || null,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds for messages
    threshold: 100, // Load more messages sooner
  });
}

/**
 * Search results infinite scroll hook
 */
export function useInfiniteSearchScroll(query: string, filters: Record<string, any> = {}) {
  return useInfiniteScroll({
    queryKey: ['search', 'infinite', query, filters],
    queryFn: async ({ pageParam = 1, signal }) => {
      const token = localStorage.getItem('authToken');
      const searchParams = new URLSearchParams({
        q: query,
        page: pageParam.toString(),
        ...filters,
      });
      
      const response = await fetch(`/api/search?${searchParams}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        signal: signal || null,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to search: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: query.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute for search results
  });
}