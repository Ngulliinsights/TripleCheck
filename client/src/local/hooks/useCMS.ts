import { useQuery } from '@tanstack/react-query'

import { BLOG_POSTS } from '../config/assets'

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    bio?: string;
  };
  publishedAt: string;
  image: {
    webp: string;
    fallback: string;
  };
  tags: string[];
  featured?: boolean;
  category: string;
  readTime: string;
  /** Deterministic placeholder until the real API returns view counts. */
  viewCount?: number;
  externalUrl?: string;
}

/**
 * Deterministic hash — avoids SSR / client hydration mismatches that
 * `Math.random()` would cause when viewCount is rendered on the server.
 */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function transformBlogPost(post: Record<string, unknown>, index: number): BlogPost {
  // Type-safe extraction of properties with assertions
  const getId = (val: unknown): string => typeof val === 'string' ? val : '';
  const getStr = (val: unknown): string => typeof val === 'string' ? val : '';
  const getImg = (val: unknown): { webp: string; fallback: string } => 
    (val && typeof val === 'object' && 'webp' in val && 'jpg' in val) 
      ? { webp: val.webp as string, fallback: val.jpg as string }
      : { webp: '', fallback: '' };
  
  return {
    id: getId(post.id),
    title: getStr(post.title),
    excerpt: getStr(post.excerpt),
    content: `<div class="prose prose-lg">
      <p>${getStr(post.excerpt)}</p>
      <h2>Introduction</h2>
      <p>In this guide we explore key aspects every real estate professional should understand about ${getStr(post.category).toLowerCase()}.</p>
      <h2>Key Insights</h2>
      <p>The real estate market continues to evolve with new technologies and changing consumer behaviors. Understanding these trends is crucial for making informed decisions in today's competitive landscape.</p>
      <blockquote>
        <p>"Understanding market trends and leveraging technology are essential for success in today's real estate landscape."</p>
      </blockquote>
      <h2>Best Practices</h2>
      <ul>
        <li>Always verify property documentation thoroughly</li>
        <li>Use technology to streamline verification processes</li>
        <li>Stay updated with market regulations and compliance requirements</li>
        <li>Build strong relationships with trusted professionals</li>
      </ul>
      <h2>Looking Forward</h2>
      <p>Staying informed about market trends and leveraging technology will be key to success in the real estate industry. TripleCheck remains committed to providing the tools and insights you need.</p>
    </div>`,
    author: {
      name: getStr(post.author),
      bio: 'Expert in real estate verification and fraud prevention',
    },
    publishedAt: getStr(post.date),
    image: getImg(post.image),
    tags: [getStr(post.category), 'Real Estate', 'Verification'],
    featured: index < 2, // First two posts are featured
    category: getStr(post.category),
    readTime: getStr(post.readTime),
    // Deterministic stand-in — replace with real API data when available
    viewCount: (hashId(getId(post.id)) % 1_500) + 500,
  };
}

// Module-level constant — computed once, stable between renders
const mockPosts: BlogPost[] = BLOG_POSTS.map(transformBlogPost);

// Shared sort helper
const byDateDesc = (a: BlogPost, b: BlogPost) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

// ---------------------------------------------------------------------------

export function useRecentPosts(limit = 5) {
  return useQuery({
    queryKey: ['recent-posts', limit],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [...mockPosts].sort(byDateDesc).slice(0, limit);
    },
    staleTime: 2 * 60 * 1_000,
    gcTime: 10 * 60 * 1_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5 * 60 * 1_000,
  });
}

export function useBlogPost(id: string) {
  return useQuery({
    queryKey: ['blog-post', id],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const post = mockPosts.find(p => p.id === id);
      if (!post) throw new Error(`Post not found: ${id}`);
      return post;
    },
    enabled: Boolean(id), // skip if id is empty / undefined
    staleTime: 5 * 60 * 1_000,
    gcTime: 10 * 60 * 1_000,
  });
}

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [...mockPosts].sort(byDateDesc);
    },
    staleTime: 5 * 60 * 1_000,
    gcTime: 10 * 60 * 1_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}