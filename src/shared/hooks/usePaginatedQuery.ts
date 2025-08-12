import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

// Define proper types for better type safety
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
  nextCursor?: string | number;
}

interface PaginatedQueryOptions<TFilters extends Record<string, unknown>, TItem> {
  queryKey: string;
  fetcher: (filters: TFilters, page: number, sort: string) => Promise<PaginatedResponse<TItem>>;
  filters: TFilters;
  sortBy: string;
  pageSize?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
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

// Define property types to replace 'any'
interface PropertyFilters {
  priceMin?: number;
  priceMax?: number;
  location?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  [key: string]: unknown; // Allow additional properties
}

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  [key: string]: unknown; // Allow additional properties for flexibility
}

/**
 * Generic paginated query hook for property listings
 * Provides unified data fetching with pagination, filtering, and sorting
 * 
 * This hook uses React Query's useInfiniteQuery under the hood to manage
 * paginated data fetching. It automatically handles page concatenation,
 * loading states, and provides a clean interface for infinite scrolling.
 */
export function usePaginatedQuery<TFilters extends Record<string, unknown>, TItem>(
  options: PaginatedQueryOptions<TFilters, TItem>
): PaginatedQueryReturn<TItem> {

  const {
    queryKey,
    fetcher,
    filters,
    sortBy,
    pageSize = 12,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes - reasonable cache time for property data
    gcTime = 10 * 60 * 1000, // 10 minutes - garbage collection time
  } = options;

  // Create stable query key that includes filters and sort
  // This ensures the query is properly invalidated when any dependency changes
  const stableQueryKey = useMemo(() => [
    queryKey,
    filters,
    sortBy,
    pageSize,
  ], [queryKey, filters, sortBy, pageSize]);

  // Use infinite query for pagination with proper TypeScript configuration
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
      if (!lastPage.hasNextPage) return undefined;
      return allPages.length + 1;
    },
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors only
      return failureCount < 3 && error.message.includes('fetch');
    },
  });

  // Transform infinite query data to flat structure with proper type safety
  const transformedData = useMemo(() => {
    if (!data?.pages?.length) return undefined;

    // Safely extract all items from all pages
    const allItems = data.pages.flatMap(page => page.items);
    
    // Use array destructuring with proper null checking
    // We add the non-null assertion since we've already verified pages.length > 0
    const [firstPage] = data.pages;
    if (!firstPage) return undefined;
    
    const { totalCount } = firstPage;
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
 * 
 * This is useful when you need traditional page-based pagination
 * instead of infinite scrolling. It fetches one page at a time.
 */
export function useSimplePaginatedQuery<TFilters extends Record<string, unknown>, TItem>(
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
    gcTime = 10 * 60 * 1000,
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
  } = useQuery<PaginatedResponse<TItem>, Error>({
    queryKey: stableQueryKey,
    queryFn: () => fetcher(filters, page, sortBy),
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      return failureCount < 3 && error.message.includes('fetch');
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
 * Property-specific query hooks with proper typing
 * These hooks provide pre-configured fetchers for different property types
 */

/**
 * Hook for fetching residential properties with infinite scrolling
 * Handles apartments, houses, condos, and other residential listings
 */
export function useResidentialPropertiesQuery(
  filters: PropertyFilters,
  sortBy: string = 'date',
  options?: Partial<PaginatedQueryOptions<PropertyFilters, Property>>
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

      return response.json() as Promise<PaginatedResponse<Property>>;
    },
    filters,
    sortBy,
    ...options,
  });
}

/**
 * Hook for fetching commercial properties
 * Handles offices, retail spaces, warehouses, and other commercial listings
 */
export function useCommercialPropertiesQuery(
  filters: PropertyFilters,
  sortBy: string = 'date',
  options?: Partial<PaginatedQueryOptions<PropertyFilters, Property>>
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

      return response.json() as Promise<PaginatedResponse<Property>>;
    },
    filters,
    sortBy,
    ...options,
  });
}

/**
 * Hook for fetching land properties
 * Handles vacant lots, agricultural land, and development opportunities
 */
export function useLandPropertiesQuery(
  filters: PropertyFilters,
  sortBy: string = 'date',
  options?: Partial<PaginatedQueryOptions<PropertyFilters, Property>>
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

      return response.json() as Promise<PaginatedResponse<Property>>;
    },
    filters,
    sortBy,
    ...options,
  });
}

/**
 * Hook for fetching all property types together
 * Useful for general property browsing and cross-category searches
 */
export function useAllPropertiesQuery(
  filters: PropertyFilters,
  sortBy: string = 'date',
  options?: Partial<PaginatedQueryOptions<PropertyFilters, Property>>
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

      return response.json() as Promise<PaginatedResponse<Property>>;
    },
    filters,
    sortBy,
    ...options,
  });
}

/**
 * Property search query hook with text-based searching
 * 
 * This hook enables full-text search across property titles, descriptions,
 * and locations. It includes smart optimizations like minimum search length
 * and relevance-based sorting.
 */
export function usePropertySearchQuery(
  searchTerm: string,
  filters: PropertyFilters = {},
  options?: Partial<PaginatedQueryOptions<PropertyFilters, Property>>
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

      return response.json() as Promise<PaginatedResponse<Property>>;
    },
    filters: { ...filters, search: searchTerm },
    sortBy: 'relevance',
    // Only search if term is longer than 2 characters to avoid excessive API calls
    enabled: searchTerm.length > 2,
    ...options,
  });
}

export default usePaginatedQuery;