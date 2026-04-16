import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ------------------------------------------------------------------
// Types and Interfaces
// ------------------------------------------------------------------

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
  nextCursor?: string | number | undefined;
  nextPage?: number | undefined;
}

interface BasePaginationOptions<TFilters extends Record<string, unknown>, TItem> {
  queryKey: string | unknown[];
  filters: TFilters;
  enabled?: boolean | undefined;
  staleTime?: number | undefined;
  gcTime?: number | undefined;
  onError?: ((error: Error) => void) | undefined;
  onSuccess?: ((data: PaginatedResponse<TItem>) => void) | undefined;
}

interface ServerPaginationOptions<TFilters extends Record<string, unknown>, TItem> 
  extends BasePaginationOptions<TFilters, TItem> {
  mode: 'paginated' | 'infinite';
  fetcher: (filters: TFilters, page: number, sort?: string | undefined) => Promise<PaginatedResponse<TItem>>;
  sortBy?: string | undefined;
  pageSize?: number | undefined;
  // Infinite scroll specific options
  threshold?: number | undefined;
  rootMargin?: string | undefined;
}

interface ClientPaginationOptions<T> {
  mode: 'client';
  items: T[];
  itemsPerPage: number;
}

type PaginationOptions<TFilters extends Record<string, unknown>, TItem> = 
  | ServerPaginationOptions<TFilters, TItem>
  | ClientPaginationOptions<TItem>;

interface PaginationReturn<TItem> {
  // Data
  data: TItem[] | undefined;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  
  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetchingNextPage?: boolean;
  isRefetching: boolean;
  
  // Actions
  fetchNextPage?: () => Promise<unknown>;
  hasNextPage?: boolean;
  goToPage?: (page: number) => void;
  nextPage?: () => void;
  previousPage?: () => void;
  resetPage?: () => void;
  refetch: () => Promise<unknown>;
  
  // Infinite scroll specific
  scrollRef?: React.RefObject<HTMLElement>;
  isNearBottom?: boolean;
  loadMore?: () => void;
  
  // Client pagination specific
  paginatedItems?: TItem[];
  hasPreviousPage?: boolean;
}

// ------------------------------------------------------------------
// Main Unified Pagination Hook
// ------------------------------------------------------------------

/**
 * Unified pagination hook that supports multiple modes:
 * - 'paginated': Traditional server-side pagination
 * - 'infinite': Infinite scroll with server-side data
 * - 'client': Client-side pagination for static data
 * 
 * This implementation fixes Rules of Hooks violations by always calling all hooks
 * unconditionally, then returning the appropriate result based on mode.
 */
export function usePagination<TFilters extends Record<string, unknown> = Record<string, unknown>, TItem = unknown>(
  options: PaginationOptions<TFilters, TItem>
): PaginationReturn<TItem> {
  // Create normalized options for all hook calls to ensure consistency
  const normalizedOptions = useMemo(() => {
    if (options.mode === 'client') {
      return {
        client: options,
        server: {
          mode: 'paginated' as const,
          queryKey: ['client-fallback'],
          fetcher: async () => ({ items: [], totalCount: 0, hasNextPage: false }),
          filters: {} as TFilters,
          enabled: false, // Disable server hooks for client mode
        } as ServerPaginationOptions<TFilters, TItem>
      };
    } else {
      return {
        client: {
          mode: 'client' as const,
          items: [],
          itemsPerPage: 10,
        } as ClientPaginationOptions<TItem>,
        server: options as ServerPaginationOptions<TFilters, TItem>
      };
    }
  }, [options]);

  // Always call all hooks unconditionally to satisfy Rules of Hooks
  const clientResult = useClientPagination(normalizedOptions.client);
  const serverResult = useServerPagination(normalizedOptions.server);
  const infiniteResult = useInfinitePagination(normalizedOptions.server);

  // Return the appropriate result based on the actual mode
  if (options.mode === 'client') {
    return clientResult;
  }
  
  if (options.mode === 'infinite') {
    return infiniteResult;
  }
  
  return serverResult;
}

// ------------------------------------------------------------------
// Server-side Paginated Implementation
// ------------------------------------------------------------------

function useServerPagination<TFilters extends Record<string, unknown>, TItem>(
  options: ServerPaginationOptions<TFilters, TItem>
): PaginationReturn<TItem> {
  const {
    queryKey,
    fetcher,
    filters,
    sortBy = '',
    pageSize = 12,
    enabled = true,
    staleTime = 5 * 60 * 1000, // Default to 5 minutes
    gcTime = 10 * 60 * 1000, // Default to 10 minutes
  } = options;

  const [currentPage, setCurrentPage] = useState(1);

  // Create stable query key to prevent unnecessary re-renders
  const stableQueryKey = useMemo(() => [
    ...(Array.isArray(queryKey) ? queryKey : [queryKey]),
    'paginated',
    filters,
    sortBy,
    currentPage,
    pageSize,
  ], [queryKey, filters, sortBy, currentPage, pageSize]);

  const {
    data,
    error,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<PaginatedResponse<TItem>, Error>({
    queryKey: stableQueryKey,
    queryFn: () => fetcher(filters, currentPage, sortBy),
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      return failureCount < 3 && error.message.includes('fetch');
    },
  });

  // Navigation functions with bounds checking
  const goToPage = useCallback((page: number) => {
    if (data) {
      const totalPages = Math.ceil(data.totalCount / pageSize);
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    }
  }, [data, pageSize]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  return {
    data: data?.items,
    totalCount: data?.totalCount || 0,
    totalPages,
    currentPage,
    isLoading,
    isError: !!error,
    error: error || null,
    isRefetching,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    refetch,
  };
}

// ------------------------------------------------------------------
// Infinite Scroll Implementation
// ------------------------------------------------------------------

function useInfinitePagination<TFilters extends Record<string, unknown>, TItem>(
  options: ServerPaginationOptions<TFilters, TItem>
): PaginationReturn<TItem> {
  const {
    queryKey,
    fetcher,
    filters,
    sortBy = '',
    pageSize = 12,
    enabled = true,
    staleTime = 5 * 60 * 1000,
    gcTime = 10 * 60 * 1000,
    threshold = 200, // Distance from bottom to trigger load
    rootMargin = '0px 0px 200px 0px', // Intersection observer margin
  } = options;

  const scrollRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(false);

  // Create stable query key for infinite queries
  const stableQueryKey = useMemo(() => [
    ...(Array.isArray(queryKey) ? queryKey : [queryKey]),
    'infinite',
    filters,
    sortBy,
    pageSize,
  ], [queryKey, filters, sortBy, pageSize]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery<PaginatedResponse<TItem>, Error>({
    queryKey: stableQueryKey,
    queryFn: ({ pageParam }) => fetcher(filters, pageParam as number, sortBy),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Return next page number if there are more pages
      if (!lastPage.hasNextPage) return undefined;
      return allPages.length + 1;
    },
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      return failureCount < 3 && error.message.includes('fetch');
    },
  });

  // Flatten all pages into a single array for easy consumption
  const flatData = useMemo(() => {
    return data?.pages.flatMap(page => page.items) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.totalCount || flatData.length;
  const currentPage = data?.pages.length || 0;

  // Intersection Observer for automatic loading when sentinel comes into view
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsNearBottom(true);
          fetchNextPage();
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

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin]);

  // Manual scroll detection as fallback for containers without sentinel
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      const nearBottom = distanceFromBottom <= threshold;
      setIsNearBottom(nearBottom);
      
      // Trigger load more when near bottom
      if (nearBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    data: flatData,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage,
    isLoading,
    isError: !!error,
    error: error || null,
    isFetchingNextPage,
    isRefetching,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    scrollRef,
    isNearBottom,
    loadMore,
    refetch,
  };
}

// ------------------------------------------------------------------
// Client-side Pagination Implementation
// ------------------------------------------------------------------

function useClientPagination<T>(
  options: ClientPaginationOptions<T>
): PaginationReturn<T> {
  const { items, itemsPerPage } = options;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Calculate the current page items efficiently
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const refetch = useCallback(async () => {
    // For client pagination, refetch is a no-op since data is already in memory
    return Promise.resolve();
  }, []);

  return {
    data: items,
    paginatedItems,
    totalCount: items.length,
    totalPages,
    currentPage,
    isLoading: false,
    isError: false,
    error: null,
    isRefetching: false,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    refetch,
  };
}

// ------------------------------------------------------------------
// Property-specific Pagination Hooks (Compatibility Layer)
// ------------------------------------------------------------------
import { Property } from '../types/property'

interface PropertyFilters {
  priceMin?: number;
  priceMax?: number;
  location?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  [key: string]: unknown;
}

/**
 * Compatibility hooks for property-specific pagination
 * These maintain the same API as the old hooks for easier migration
 */

export function useResidentialPropertiesQuery(
  filters: PropertyFilters,
  sortBy = 'date',
  options?: { mode?: 'paginated' | 'infinite'; pageSize?: number; enabled?: boolean }
) {
  return usePagination({
    mode: options?.mode || 'paginated',
    queryKey: ['properties', 'residential'],
    fetcher: async (filters, page, sort) => {
      const response = await fetch('/api/properties/residential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, page, sort, pageSize: options?.pageSize || 12 }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch residential properties: ${response.statusText}`);
      }

      return response.json() as Promise<PaginatedResponse<Property>>;
    },
    filters,
    sortBy,
    pageSize: options?.pageSize ?? 12,
    enabled: options?.enabled ?? true,
  });
}

export function useCommercialPropertiesQuery(
  filters: PropertyFilters,
  sortBy = 'date',
  options?: { mode?: 'paginated' | 'infinite'; pageSize?: number; enabled?: boolean }
) {
  return usePagination({
    mode: options?.mode || 'paginated',
    queryKey: ['properties', 'commercial'],
    fetcher: async (filters, page, sort) => {
      const response = await fetch('/api/properties/commercial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, page, sort, pageSize: options?.pageSize || 12 }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch commercial properties: ${response.statusText}`);
      }

      return response.json() as Promise<PaginatedResponse<Property>>;
    },
    filters,
    sortBy,
    pageSize: options?.pageSize ?? 12,
    enabled: options?.enabled ?? true,
  });
}

export function useLandPropertiesQuery(
  filters: PropertyFilters,
  sortBy = 'date',
  options?: { mode?: 'paginated' | 'infinite'; pageSize?: number; enabled?: boolean }
) {
  return usePagination({
    mode: options?.mode || 'paginated',
    queryKey: ['properties', 'land'],
    fetcher: async (filters, page, sort) => {
      const response = await fetch('/api/properties/land', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, page, sort, pageSize: options?.pageSize || 12 }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch land properties: ${response.statusText}`);
      }

      return response.json() as Promise<PaginatedResponse<Property>>;
    },
    filters,
    sortBy,
    pageSize: options?.pageSize ?? 12,
    enabled: options?.enabled ?? true,
  });
}

export function useAllPropertiesQuery(
  filters: PropertyFilters,
  sortBy = 'date',
  options?: { mode?: 'paginated' | 'infinite'; pageSize?: number; enabled?: boolean }
) {
  return usePagination({
    mode: options?.mode || 'paginated',
    queryKey: ['properties', 'all'],
    fetcher: async (filters, page, sort) => {
      const response = await fetch('/api/properties/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, page, sort, pageSize: options?.pageSize || 12 }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.statusText}`);
      }

      return response.json() as Promise<PaginatedResponse<Property>>;
    },
    filters,
    sortBy,
    pageSize: options?.pageSize ?? 12,
    enabled: options?.enabled ?? true,
  });
}

export function usePropertySearchQuery(
  searchTerm: string,
  filters: PropertyFilters = {},
  options?: { mode?: 'paginated' | 'infinite'; pageSize?: number; enabled?: boolean }
) {
  return usePagination({
    mode: options?.mode || 'paginated',
    queryKey: ['properties', 'search'],
    fetcher: async (combinedFilters, page, sort) => {
      const response = await fetch('/api/properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: searchTerm,
          filters: combinedFilters,
          page,
          sort,
          pageSize: options?.pageSize || 12,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to search properties: ${response.statusText}`);
      }

      return response.json() as Promise<PaginatedResponse<Property>>;
    },
    filters: { ...filters, search: searchTerm },
    sortBy: 'relevance',
    enabled: (options?.enabled !== false) && searchTerm.length > 2,
    pageSize: options?.pageSize ?? 12,
  });
}

// ------------------------------------------------------------------
// Compatibility Functions (for migration from old hooks)
// ------------------------------------------------------------------

/**
 * Compatibility function for usePaginatedQuery migration
 * Fixed type issues by making optional properties truly optional
 */
export function usePaginatedQuery<TFilters extends Record<string, unknown>, TItem>(
  options: {
    queryKey: string;
    fetcher: (filters: TFilters, page: number, sort?: string) => Promise<PaginatedResponse<TItem>>;
    filters: TFilters;
    sortBy: string;
    pageSize?: number;
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  }
) {
  const result = usePagination({
    mode: 'infinite' as const,
    queryKey: options.queryKey,
    fetcher: options.fetcher,
    filters: options.filters,
    sortBy: options.sortBy,
    pageSize: options.pageSize ?? 12,
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
  });

  // Transform to match old API structure
  return {
    data: result.data ? {
      items: result.data,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    } : undefined,
    isLoading: result.isLoading,
    error: result.error,
    fetchNextPage: result.fetchNextPage || (() => Promise.resolve()),
    hasNextPage: result.hasNextPage || false,
    isFetchingNextPage: result.isFetchingNextPage || false,
    refetch: result.refetch,
    isRefetching: result.isRefetching,
  };
}

/**
 * Compatibility function for useInfiniteScroll migration
 * Fixed type issues and made parameters properly optional
 */
export function useInfiniteScroll<TData = unknown>(options: {
  queryKey: unknown[];
  queryFn: ({ pageParam }: { pageParam: number; signal?: AbortSignal }) => Promise<{
    data: TData[];
    nextPage?: number;
    hasNextPage: boolean;
    totalCount?: number;
  }>;
  initialPageParam?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  threshold?: number;
  rootMargin?: string;
}) {
  const result = usePagination({
    mode: 'infinite' as const,
    queryKey: options.queryKey,
    fetcher: async (_filters, page, _sort) => {
      const response = await options.queryFn({ pageParam: page });
      return {
        items: response.data,
        totalCount: response.totalCount || response.data.length,
        hasNextPage: response.hasNextPage,
        nextPage: response.nextPage,
      } as PaginatedResponse<TData>;
    },
    filters: {} as Record<string, unknown>,
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
    threshold: options.threshold,
    rootMargin: options.rootMargin,
  });

  return {
    data: result.data || [],
    flatData: result.data || [],
    totalCount: result.totalCount,
    hasNextPage: result.hasNextPage || false,
    isFetchingNextPage: result.isFetchingNextPage || false,
    fetchNextPage: result.fetchNextPage || (() => Promise.resolve()),
    scrollRef: result.scrollRef || { current: null },
    isNearBottom: result.isNearBottom || false,
    loadMore: result.loadMore || (() => {}),
    reset: result.refetch,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}

export default usePagination;