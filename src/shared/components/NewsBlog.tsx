import { RefreshCw, ArrowRight } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useRecentPosts } from "../hooks/useCMS";

import { BlogPostCard, type BlogPost as SharedBlogPost } from "./blog/BlogPostCard";
import { BlogPostSkeleton } from "./blog/BlogPostSkeleton";
import { Button } from "./ui/button";
import { ErrorState } from "./ui/error-states";

// Constants moved outside component to prevent re-creation on each render
const SKELETON_COUNT = 3;

// Type definitions for better TypeScript safety
interface Post {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  featured?: boolean;
  publishedAt: string;
  readTime: string;
  viewCount?: number;
  image: {
    webp: string;
    fallback: string;
  };
  tags: string[];
  author: {
    name: string;
  };
}

// Transform CMS post to shared blog post format with proper type safety
const transformCMSPost = (post: Post): SharedBlogPost => ({
  id: post.id,
  title: post.title,
  excerpt: post.excerpt,
  category: post.category,
  // Ensure featured is explicitly boolean, not undefined
  ...(post.featured !== undefined && { featured: post.featured }),
  publishedAt: post.publishedAt,
  readTime: post.readTime,
  // Only include viewCount if it's defined
  ...(post.viewCount !== undefined && { viewCount: post.viewCount }),
  image: {
    webp: post.image.webp,
    fallback: post.image.fallback
  },
  tags: post.tags,
  author: post.author
});

export function NewsBlog() {
  const navigate = useNavigate();
  
  // Fetch the latest 3 posts for the home page
  const { 
    data: posts = [], 
    isLoading, 
    error
  } = useRecentPosts(SKELETON_COUNT);

  // Memoized callback functions to prevent unnecessary re-renders of child components
  const handleReadMore = useCallback((postId: string) => {
    navigate(`/blog/${postId}`);
  }, [navigate]);

  const handleViewAll = useCallback(() => {
    navigate('/blog');
  }, [navigate]);





  // Memoized skeleton array to prevent recreation
  const skeletonArray = useMemo(() => 
    Array.from({ length: SKELETON_COUNT }, (_, i) => i), 
    []
  );

  // Memoized transformed posts to prevent recalculation on every render
  const transformedPosts = useMemo(() => 
    posts.map(transformCMSPost), 
    [posts]
  );

  // All useMemo hooks must be called before any conditional returns
  // This ensures React's hook call order remains consistent across renders
  


  // Dynamic CTA copy based on content state - computed before conditional returns
  const ctaCopy = useMemo(() => {
    const postCount = transformedPosts.length;
    if (postCount === 0) return "Explore Knowledge Base";
    if (postCount < SKELETON_COUNT) return `View All ${postCount > 1 ? 'Stories' : 'Story'}`;
    return "Explore Full Library";
  }, [transformedPosts.length]);



  // Loading State - Early return pattern for cleaner code flow
  if (isLoading) {
    return (
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {skeletonArray.map((i) => (
            <BlogPostSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  // Error State with more specific messaging
  if (error) {
    return (
      <div className="container mx-auto px-4">
        <ErrorState
          title="Content Temporarily Unavailable"
          message="Our editorial team is working to restore access to the knowledge base. Please check back shortly or contact support if this persists."
          variant="generic"
        />
      </div>
    );
  }

  // Main content render
  return (
    <div className="container mx-auto px-4">
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {transformedPosts.map((post) => (
          <BlogPostCard
            key={post.id}
            post={post}
            onReadMore={() => handleReadMore(post.id)}
            showTags={true}
            showViewCount={true}
            maxTags={2}
          />
        ))}
      </div>

      {/* Call to Action Section */}
      <div className="text-center mt-12">
        <Button 
          size="lg" 
          variant="coral"
          className="px-8 py-3 hover:bg-secondary/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          onClick={handleViewAll}
        >
          {ctaCopy}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}