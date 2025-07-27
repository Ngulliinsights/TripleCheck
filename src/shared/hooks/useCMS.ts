import { useQuery } from '@tanstack/react-query';
import { BLOG_POSTS } from '../config/assets';

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
  viewCount?: number;
  externalUrl?: string;
}

// Transform BLOG_POSTS data to match BlogPost interface
const transformBlogPost = (post: typeof BLOG_POSTS[0]): BlogPost => ({
  id: post.id,
  title: post.title,
  excerpt: post.excerpt,
  content: `<div class="prose prose-lg">
    <p>${post.excerpt}</p>
    <h2>Introduction</h2>
    <p>In this comprehensive guide, we'll explore the key aspects that every real estate professional and investor should understand about ${post.category.toLowerCase()}.</p>
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
    <p>As we move forward, staying informed about market trends and leveraging technology will be key to success in the real estate industry. TripleCheck remains committed to providing the tools and insights you need.</p>
  </div>`,
  author: {
    name: post.author,
    bio: 'Expert in real estate verification and fraud prevention'
  },
  publishedAt: post.date,
  image: {
    webp: post.image.webp,
    fallback: post.image.jpg
  },
  tags: [post.category, 'Real Estate', 'Verification'],
  featured: BLOG_POSTS.indexOf(post) < 2, // First 2 posts are featured
  category: post.category,
  readTime: post.readTime,
  viewCount: Math.floor(Math.random() * 2000) + 500, // Random view count for demo
  externalUrl: undefined
});

const mockPosts: BlogPost[] = BLOG_POSTS.map(transformBlogPost);

export function useRecentPosts(limit: number = 5) {
  return useQuery({
    queryKey: ['recent-posts', limit],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Sort posts by publishedAt date (most recent first) and return limited posts
      const sortedPosts = [...mockPosts].sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      return sortedPosts.slice(0, limit);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter for home page freshness
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always refetch on component mount
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

export function useBlogPost(id: string) {
  return useQuery({
    queryKey: ['blog-post', id],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Find post by id
      const post = mockPosts.find(p => p.id === id);
      if (!post) {
        throw new Error('Post not found');
      }
      return post;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Sort posts by publishedAt date (most recent first)
      const sortedPosts = [...mockPosts].sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      return sortedPosts;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

// BlogPost interface is already exported above