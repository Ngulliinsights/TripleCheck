import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
  nextCursor?: string | number;
}

interface PaginatedQueryOptions<TFilters, TItem> {
  queryKey: string;
  fetcher: (filters: TFilters, page: number, sort: string) => Promise<PaginatedResponse<TItem>>;
  filters: TFilters;
  sortBy: string;
  pageSize?: number;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

interface PaginatedQueryReturn<TItem> {
  data: {
    items: TItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  } | undefined;
  isLoading: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  refetch: () => void;
  isRefetching: boolean;
}

/**
 * Generic paginated query hook for property listings
 * Provides unified data fetching with pagination, filtering, and sorting
 */
export function usePaginatedQuery<TFilters, TItem>(
  options: PaginatedQueryOptions<TFilters, TItem>
): PaginatedQueryReturn<TItem> {
  
  const {
    queryKey,
    fetcher,
    filters,
    sortBy,
    pageSize = 12,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  // Create stable query key that includes filters and sort
  const stableQueryKey = useMemo(() => [
    queryKey,
    filters,
    sortBy,
    pageSize,
  ], [queryKey, filters, sortBy, pageSize]);

  // Use infinite query for pagination
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: stableQueryKey,
    queryFn: ({ pageParam = 1 }) => fetcher(filters, pageParam as number, sortBy),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasNextPage) return undefined;
      return allPages.length + 1;
    },
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3 && error.message.includes('fetch')) {
        return true;
      }
      return false;
    },
  });

  // Transform infinite query data to flat structure
  const transformedData = useMemo(() => {
    if (!data?.pages?.length) return undefined;

    const allItems = data.pages.flatMap(page => page.items);
    const firstPage = data.pages[0];
    const {totalCount} = firstPage;
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = data.pages.length;

    return {
      items: allItems,
      totalCount,
      totalPages,
      currentPage,
    };
  }, [data, pageSize]);

  return {
    data: transformedData,
    isLoading,
    error: error as Error | null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    refetch,
    isRefetching,
  };
}

/**
 * Simple paginated query hook for single page results
 */
export function useSimplePaginatedQuery<TFilters, TItem>(
  options: PaginatedQueryOptions<TFilters, TItem> & { page: number }
): {
  data: PaginatedResponse<TItem> | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isRefetching: boolean;
} {
  
  const {
    queryKey,
    fetcher,
    filters,
    sortBy,
    page,
    enabled = true,
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
  } = options;

  const stableQueryKey = useMemo(() => [
    queryKey,
    filters,
    sortBy,
    page,
  ], [queryKey, filters, sortBy, page]);

  const {
    data,
    error,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: stableQueryKey,
    queryFn: () => fetcher(filters, page, sortBy),
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount < 3 && error.message.includes('fetch')) {
        return true;
      }
      return false;
    },
  });

  return {
    data,
    isLoading,
    error: error as Error | null,
    refetch,
    isRefetching,
  };
}

/**
 * Property-specific query hooks
 */
export function useResidentialPropertiesQuery(
  filters: any,
  sortBy: string = 'date',
  options?: Partial<PaginatedQueryOptions<any, any>>
) {
  return usePaginatedQuery({
    queryKey: 'residential-properties',
    fetcher: async (filters, page, sort) => {
      const response = await fetch('/api/properties/residential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, page, sort, pageSize: 12 }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch residential properties: ${response.statusText}`);
      }
      
      return response.json();
    },
    filters,
    sortBy,
    ...options,
  });
}

export function useCommercialPropertiesQuery(
  filters: any,
  sortBy: string = 'date',
  options?: Partial<PaginatedQueryOptions<any, any>>
) {
  return usePaginatedQuery({
    queryKey: 'commercial-properties',
    fetcher: async (filters, page, sort) => {
      const response = await fetch('/api/properties/commercial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, page, sort, pageSize: 12 }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch commercial properties: ${response.statusText}`);
      }
      
      return response.json();
    },
    filters,
    sortBy,
    ...options,
  });
}

export function useLandPropertiesQuery(
  filters: any,
  sortBy: string = 'date',
  options?: Partial<PaginatedQueryOptions<any, any>>
) {
  return usePaginatedQuery({
    queryKey: 'land-properties',
    fetcher: async (filters, page, sort) => {
      const response = await fetch('/api/properties/land', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, page, sort, pageSize: 12 }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch land properties: ${response.statusText}`);
      }
      
      return response.json();
    },
    filters,
    sortBy,
    ...options,
  });
}

export function useAllPropertiesQuery(
  filters: any,
  sortBy: string = 'date',
  options?: Partial<PaginatedQueryOptions<any, any>>
) {
  return usePaginatedQuery({
    queryKey: 'all-properties',
    fetcher: async (filters, page, sort) => {
      const response = await fetch('/api/properties/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, page, sort, pageSize: 12 }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.statusText}`);
      }
      
      return response.json();
    },
    filters,
    sortBy,
    ...options,
  });
}

/**
 * Property search query hook
 */
export function usePropertySearchQuery(
  searchTerm: string,
  filters: any = {},
  options?: Partial<PaginatedQueryOptions<any, any>>
) {
  return usePaginatedQuery({
    queryKey: 'property-search',
    fetcher: async (combinedFilters, page, sort) => {
      const response = await fetch('/api/properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: searchTerm,
          filters: combinedFilters,
          page,
          sort,
          pageSize: 12,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to search properties: ${response.statusText}`);
      }
      
      return response.json();
    },
    filters: { ...filters, search: searchTerm },
    sortBy: 'relevance',
    enabled: searchTerm.length > 2, // Only search if term is longer than 2 characters
    ...options,
  });
}

export default usePaginatedQuery;