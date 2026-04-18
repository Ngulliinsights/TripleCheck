/**
 * Unified Pagination Hook
 *
 * Supports three modes:
 *   - 'paginated' — traditional server-side page navigation
 *   - 'infinite'  — infinite scroll backed by useInfiniteQuery
 *   - 'client'    — client-side slicing of an in-memory array
 *
 * All internal hook calls are unconditional to satisfy the Rules of Hooks;
 * the appropriate result is selected after the calls based on `options.mode`.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { Property } from '@shared/types/property'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaginatedResponse<T> {
  items:       T[];
  totalCount:  number;
  hasNextPage: boolean;
  nextCursor?: string | number;
  nextPage?:   number;
}

interface BasePaginationOptions<TFilters extends Record<string, unknown>, TItem> {
  queryKey:   string | unknown[];
  filters:    TFilters;
  enabled?:   boolean;
  staleTime?: number;
  gcTime?:    number;
  onError?:   (error: Error) => void;
  onSuccess?: (data: PaginatedResponse<TItem>) => void;
}

interface ServerPaginationOptions<TFilters extends Record<string, unknown>, TItem>
  extends BasePaginationOptions<TFilters, TItem> {
  mode:       'paginated' | 'infinite';
  fetcher:    (filters: TFilters, page: number, sort?: string) => Promise<PaginatedResponse<TItem>>;
  sortBy?:    string;
  pageSize?:  number;
  threshold?: number;
  rootMargin?: string;
}

interface ClientPaginationOptions<T> {
  mode:         'client';
  items:        T[];
  itemsPerPage: number;
}

type PaginationOptions<TFilters extends Record<string, unknown>, TItem> =
  | ServerPaginationOptions<TFilters, TItem>
  | ClientPaginationOptions<TItem>;

interface PaginationReturn<TItem> {
  data:              TItem[] | undefined;
  totalCount:        number;
  totalPages:        number;
  currentPage:       number;
  isLoading:         boolean;
  isError:           boolean;
  error:             Error | null;
  isFetchingNextPage?: boolean;
  isRefetching:      boolean;
  fetchNextPage?:    () => Promise<unknown>;
  hasNextPage?:      boolean;
  hasPreviousPage?:  boolean;
  goToPage?:         (page: number) => void;
  nextPage?:         () => void;
  previousPage?:     () => void;
  resetPage?:        () => void;
  refetch:           () => Promise<unknown>;
  scrollRef?:        React.RefObject<HTMLElement>;
  isNearBottom?:     boolean;
  loadMore?:         () => void;
  paginatedItems?:   TItem[];
}

// ---------------------------------------------------------------------------
// Main exported hook
// ---------------------------------------------------------------------------

export function usePagination<
  TFilters extends Record<string, unknown> = Record<string, unknown>,
  TItem = unknown,
>(options: PaginationOptions<TFilters, TItem>): PaginationReturn<TItem> {
  // Build normalized inputs so every internal hook is called unconditionally.
  const normalized = useMemo(() => {
    const disabledServer: ServerPaginationOptions<TFilters, TItem> = {
      mode:    'paginated',
      queryKey: ['_disabled'],
      fetcher: async () => ({ items: [], totalCount: 0, hasNextPage: false }),
      filters: {} as TFilters,
      enabled: false,
    };

    return options.mode === 'client'
      ? { client: options,                 server: disabledServer }
      : { client: { mode: 'client' as const, items: [] as TItem[], itemsPerPage: 10 },
          server: options as ServerPaginationOptions<TFilters, TItem> };
  }, [options]); // eslint-disable-line
  // ↑ options is an object literal at the call site; caller should memoize if needed.

  const clientResult   = useClientPagination(normalized.client);
  const serverResult   = useServerPagination(normalized.server);
  const infiniteResult = useInfinitePagination(normalized.server);

  if (options.mode === 'client')   return clientResult;
  if (options.mode === 'infinite') return infiniteResult;
  return serverResult;
}

// ---------------------------------------------------------------------------
// Server-side paginated
// ---------------------------------------------------------------------------

function useServerPagination<TFilters extends Record<string, unknown>, TItem>(
  options: ServerPaginationOptions<TFilters, TItem>,
): PaginationReturn<TItem> {
  const {
    queryKey, fetcher, filters, sortBy = '', pageSize = 12,
    enabled = true, staleTime = 5 * 60_000, gcTime = 10 * 60_000,
  } = options;

  const [currentPage, setCurrentPage] = useState(1);

  const stableQueryKey = useMemo(() => [
    ...(Array.isArray(queryKey) ? queryKey : [queryKey]),
    'paginated', filters, sortBy, currentPage, pageSize,
  ], [queryKey, filters, sortBy, currentPage, pageSize]);

  const { data, error, isLoading, refetch, isRefetching } = useQuery<
    PaginatedResponse<TItem>,
    Error
  >({
    queryKey:            stableQueryKey,
    queryFn:             () => fetcher(filters, currentPage, sortBy),
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: (count, err) => count < 3 && err.message.includes('fetch'),
  });

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)));
  }, [totalPages]);

  const nextPage     = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const previousPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
  const resetPage    = useCallback(() => setCurrentPage(1), []);

  return {
    data:           data?.items,
    totalCount:     data?.totalCount ?? 0,
    totalPages,
    currentPage,
    isLoading,
    isError:        !!error,
    error:          error ?? null,
    isRefetching,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    hasNextPage:    currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    refetch,
  };
}

// ---------------------------------------------------------------------------
// Infinite scroll
// ---------------------------------------------------------------------------

function useInfinitePagination<TFilters extends Record<string, unknown>, TItem>(
  options: ServerPaginationOptions<TFilters, TItem>,
): PaginationReturn<TItem> {
  const {
    queryKey, fetcher, filters, sortBy = '', pageSize = 12,
    enabled = true, staleTime = 5 * 60_000, gcTime = 10 * 60_000,
    threshold = 200, rootMargin = '0px 0px 200px 0px',
  } = options;

  const scrollRef   = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(false);

  const stableQueryKey = useMemo(() => [
    ...(Array.isArray(queryKey) ? queryKey : [queryKey]),
    'infinite', filters, sortBy, pageSize,
  ], [queryKey, filters, sortBy, pageSize]);

  const {
    data, error, fetchNextPage, hasNextPage,
    isFetchingNextPage, isLoading, refetch, isRefetching,
  } = useInfiniteQuery<PaginatedResponse<TItem>, Error>({
    queryKey:         stableQueryKey,
    queryFn:          ({ pageParam }) => fetcher(filters, pageParam as number, sortBy),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => lastPage.hasNextPage ? allPages.length + 1 : undefined,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: (count, err) => count < 3 && err.message.includes('fetch'),
  });

  const flatData   = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const totalCount = data?.pages[0]?.totalCount ?? flatData.length;

  // IntersectionObserver auto-load
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { setIsNearBottom(true); fetchNextPage(); }
      else                         setIsNearBottom(false);
    }, { rootMargin, threshold: 0.1 });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin]);

  // Scroll fallback for containers that don't use the sentinel
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const near = distanceFromBottom <= threshold;
      setIsNearBottom(near);
      if (near && hasNextPage && !isFetchingNextPage) fetchNextPage();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    data:              flatData,
    totalCount,
    totalPages:        Math.ceil(totalCount / pageSize),
    currentPage:       data?.pages.length ?? 0,
    isLoading,
    isError:           !!error,
    error:             error ?? null,
    isFetchingNextPage,
    isRefetching,
    fetchNextPage,
    hasNextPage:       hasNextPage ?? false,
    scrollRef,
    isNearBottom,
    loadMore,
    refetch,
  };
}

// ---------------------------------------------------------------------------
// Client-side
// ---------------------------------------------------------------------------

function useClientPagination<T>(options: ClientPaginationOptions<T>): PaginationReturn<T> {
  const { items, itemsPerPage } = options;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const goToPage     = useCallback((page: number) =>
    setCurrentPage(Math.max(1, Math.min(page, totalPages))), [totalPages]);
  const nextPage     = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const previousPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
  const resetPage    = useCallback(() => setCurrentPage(1), []);
  const refetch      = useCallback(() => Promise.resolve(), []);

  return {
    data:            items,
    paginatedItems,
    totalCount:      items.length,
    totalPages,
    currentPage,
    isLoading:       false,
    isError:         false,
    error:           null,
    isRefetching:    false,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    hasNextPage:     currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    refetch,
  };
}

// ---------------------------------------------------------------------------
// Property-specific convenience hooks
// ---------------------------------------------------------------------------

interface PropertyFilters {
  priceMin?:     number;
  priceMax?:     number;
  location?:     string;
  propertyType?: string;
  bedrooms?:     number;
  bathrooms?:    number;
  [key: string]: unknown;
}

type PropertyQueryOptions = {
  mode?:     'paginated' | 'infinite';
  pageSize?: number;
  enabled?:  boolean;
};

async function fetchProperties(
  endpoint: string,
  filters:  PropertyFilters,
  page:     number,
  sort?:    string,
  pageSize  = 12,
): Promise<PaginatedResponse<Property>> {
  const res = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ filters, page, sort, pageSize }),
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
  return res.json();
}

export function useResidentialPropertiesQuery(
  filters: PropertyFilters, sortBy = 'date', options?: PropertyQueryOptions,
) {
  return usePagination({
    mode:     options?.mode ?? 'paginated',
    queryKey: ['properties', 'residential'],
    fetcher:  (f, p, s) => fetchProperties('/api/properties/residential', f, p, s, options?.pageSize),
    filters,
    sortBy,
    pageSize: options?.pageSize ?? 12,
    enabled:  options?.enabled ?? true,
  });
}

export function useCommercialPropertiesQuery(
  filters: PropertyFilters, sortBy = 'date', options?: PropertyQueryOptions,
) {
  return usePagination({
    mode:     options?.mode ?? 'paginated',
    queryKey: ['properties', 'commercial'],
    fetcher:  (f, p, s) => fetchProperties('/api/properties/commercial', f, p, s, options?.pageSize),
    filters,
    sortBy,
    pageSize: options?.pageSize ?? 12,
    enabled:  options?.enabled ?? true,
  });
}

export function useLandPropertiesQuery(
  filters: PropertyFilters, sortBy = 'date', options?: PropertyQueryOptions,
) {
  return usePagination({
    mode:     options?.mode ?? 'paginated',
    queryKey: ['properties', 'land'],
    fetcher:  (f, p, s) => fetchProperties('/api/properties/land', f, p, s, options?.pageSize),
    filters,
    sortBy,
    pageSize: options?.pageSize ?? 12,
    enabled:  options?.enabled ?? true,
  });
}

export function useAllPropertiesQuery(
  filters: PropertyFilters, sortBy = 'date', options?: PropertyQueryOptions,
) {
  return usePagination({
    mode:     options?.mode ?? 'paginated',
    queryKey: ['properties', 'all'],
    fetcher:  (f, p, s) => fetchProperties('/api/properties/all', f, p, s, options?.pageSize),
    filters,
    sortBy,
    pageSize: options?.pageSize ?? 12,
    enabled:  options?.enabled ?? true,
  });
}

export function usePropertySearchQuery(
  searchTerm: string,
  filters:    PropertyFilters = {},
  options?:   PropertyQueryOptions,
) {
  return usePagination({
    mode:     options?.mode ?? 'paginated',
    queryKey: ['properties', 'search'],
    fetcher:  async (combinedFilters, page, sort) => {
      const res = await fetch('/api/properties/search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ search: searchTerm, filters: combinedFilters, page, sort, pageSize: options?.pageSize ?? 12 }),
      });
      if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
      return res.json();
    },
    filters:  { ...filters, search: searchTerm },
    sortBy:   'relevance',
    enabled:  (options?.enabled !== false) && searchTerm.length > 2,
    pageSize: options?.pageSize ?? 12,
  });
}

// ---------------------------------------------------------------------------
// Compatibility wrappers for gradual migration
// ---------------------------------------------------------------------------

export function usePaginatedQuery<TFilters extends Record<string, unknown>, TItem>(options: {
  queryKey:  string;
  fetcher:   (filters: TFilters, page: number, sort?: string) => Promise<PaginatedResponse<TItem>>;
  filters:   TFilters;
  sortBy:    string;
  pageSize?: number;
  enabled?:  boolean;
  staleTime?: number;
  gcTime?:   number;
}) {
  const result = usePagination({
    mode:     'infinite',
    queryKey: options.queryKey,
    fetcher:  options.fetcher,
    filters:  options.filters,
    sortBy:   options.sortBy,
    pageSize: options.pageSize ?? 12,
    enabled:  options.enabled ?? true,
    staleTime: options.staleTime,
    gcTime:   options.gcTime,
  });

  return {
    data: result.data ? {
      items:       result.data,
      totalCount:  result.totalCount,
      totalPages:  result.totalPages,
      currentPage: result.currentPage,
    } : undefined,
    isLoading:          result.isLoading,
    error:              result.error,
    fetchNextPage:      result.fetchNextPage ?? (() => Promise.resolve()),
    hasNextPage:        result.hasNextPage ?? false,
    isFetchingNextPage: result.isFetchingNextPage ?? false,
    refetch:            result.refetch,
    isRefetching:       result.isRefetching,
  };
}

export function useInfiniteScroll<TData = unknown>(options: {
  queryKey:         unknown[];
  queryFn:          (args: { pageParam: number; signal?: AbortSignal }) => Promise<{
    data:        TData[];
    nextPage?:   number;
    hasNextPage: boolean;
    totalCount?: number;
  }>;
  initialPageParam?: number;
  enabled?:          boolean;
  staleTime?:        number;
  gcTime?:           number;
  threshold?:        number;
  rootMargin?:       string;
}) {
  const result = usePagination({
    mode:     'infinite',
    queryKey: options.queryKey,
    fetcher:  async (_filters, page) => {
      const res = await options.queryFn({ pageParam: page });
      return { items: res.data, totalCount: res.totalCount ?? res.data.length, hasNextPage: res.hasNextPage, nextPage: res.nextPage };
    },
    filters:   {} as Record<string, unknown>,
    enabled:   options.enabled ?? true,
    staleTime: options.staleTime,
    gcTime:    options.gcTime,
    threshold: options.threshold,
    rootMargin: options.rootMargin,
  });

  return {
    data:               result.data ?? [],
    flatData:           result.data ?? [],
    totalCount:         result.totalCount,
    hasNextPage:        result.hasNextPage ?? false,
    isFetchingNextPage: result.isFetchingNextPage ?? false,
    fetchNextPage:      result.fetchNextPage ?? (() => Promise.resolve()),
    scrollRef:          result.scrollRef ?? { current: null } as React.RefObject<HTMLElement>,
    isNearBottom:       result.isNearBottom ?? false,
    loadMore:           result.loadMore ?? (() => undefined),
    reset:              result.refetch,
    isLoading:          result.isLoading,
    isError:            result.isError,
    error:              result.error,
    refetch:            result.refetch,
  };
}

export default usePagination;