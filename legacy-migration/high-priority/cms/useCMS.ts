/**
 * React hooks for CMS integration
 * Provides easy-to-use hooks for fetching blog content
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { cmsService, BlogPost } from '@/services/cms';

// Query keys for consistent caching
export const cmsQueryKeys = {
  posts: ['cms', 'posts'] as const,
  post: (id: string) => ['cms', 'post', id] as const,
  featuredPosts: ['cms', 'posts', 'featured'] as const,
  postsByCategory: (category: string) => ['cms', 'posts', 'category', category] as const,
  postsByTag: (tag: string) => ['cms', 'posts', 'tag', tag] as const,
};

// Default query options
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

/**
 * Hook to fetch all blog posts
 */
export function useBlogPosts(options?: Partial<UseQueryOptions<BlogPost[]>>) {
  return useQuery({
    queryKey: cmsQueryKeys.posts,
    queryFn: () => cmsService.fetchPosts(),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to fetch a single blog post by ID
 */
export function useBlogPost(id: string, options?: Partial<UseQueryOptions<BlogPost | null>>) {
  return useQuery({
    queryKey: cmsQueryKeys.post(id),
    queryFn: () => cmsService.fetchPost(id),
    enabled: !!id,
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to fetch featured blog posts
 */
export function useFeaturedPosts(options?: Partial<UseQueryOptions<BlogPost[]>>) {
  return useQuery({
    queryKey: cmsQueryKeys.featuredPosts,
    queryFn: () => cmsService.fetchFeaturedPosts(),
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to fetch blog posts by category
 */
export function usePostsByCategory(category: string, options?: Partial<UseQueryOptions<BlogPost[]>>) {
  return useQuery({
    queryKey: cmsQueryKeys.postsByCategory(category),
    queryFn: () => cmsService.fetchPostsByCategory(category),
    enabled: !!category,
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to fetch blog posts by tag
 */
export function usePostsByTag(tag: string, options?: Partial<UseQueryOptions<BlogPost[]>>) {
  return useQuery({
    queryKey: cmsQueryKeys.postsByTag(tag),
    queryFn: () => cmsService.fetchPostsByTag(tag),
    enabled: !!tag,
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to fetch recent posts (first 3 posts)
 */
export function useRecentPosts(limit = 3, options?: Partial<UseQueryOptions<BlogPost[]>>) {
  return useQuery({
    queryKey: [...cmsQueryKeys.posts, 'recent', limit],
    queryFn: async () => {
      const posts = await cmsService.fetchPosts();
      return posts.slice(0, limit);
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to search posts by title or content
 */
export function useSearchPosts(searchTerm: string, options?: Partial<UseQueryOptions<BlogPost[]>>) {
  return useQuery({
    queryKey: [...cmsQueryKeys.posts, 'search', searchTerm],
    queryFn: async () => {
      const posts = await cmsService.fetchPosts();
      if (!searchTerm.trim()) return posts;
      
      const term = searchTerm.toLowerCase();
      return posts.filter(post => 
        post.title.toLowerCase().includes(term) ||
        post.excerpt.toLowerCase().includes(term) ||
        post.content.toLowerCase().includes(term) ||
        post.tags.some(tag => tag.toLowerCase().includes(term))
      );
    },
    enabled: !!searchTerm,
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to get all unique categories
 */
export function useCategories(options?: Partial<UseQueryOptions<string[]>>) {
  return useQuery({
    queryKey: [...cmsQueryKeys.posts, 'categories'],
    queryFn: async () => {
      const posts = await cmsService.fetchPosts();
      const categories = [...new Set(posts.map(post => post.category))];
      return categories.sort();
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to get all unique tags
 */
export function useTags(options?: Partial<UseQueryOptions<string[]>>) {
  return useQuery({
    queryKey: [...cmsQueryKeys.posts, 'tags'],
    queryFn: async () => {
      const posts = await cmsService.fetchPosts();
      const tags = [...new Set(posts.flatMap(post => post.tags))];
      return tags.sort();
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook to get blog statistics
 */
export function useBlogStats(options?: Partial<UseQueryOptions<{
  totalPosts: number;
  totalViews: number;
  featuredPosts: number;
  categories: number;
  tags: number;
}>>) {
  return useQuery({
    queryKey: [...cmsQueryKeys.posts, 'stats'],
    queryFn: async () => {
      const posts = await cmsService.fetchPosts();
      const categories = new Set(posts.map(post => post.category));
      const tags = new Set(posts.flatMap(post => post.tags));
      
      return {
        totalPosts: posts.length,
        totalViews: posts.reduce((sum, post) => sum + (post.viewCount || 0), 0),
        featuredPosts: posts.filter(post => post.featured).length,
        categories: categories.size,
        tags: tags.size,
      };
    },
    ...defaultQueryOptions,
    ...options,
  });
}