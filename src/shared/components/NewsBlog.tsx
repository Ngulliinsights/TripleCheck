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
    error, 
    refetch,
    isFetching,
    dataUpdatedAt
  } = useRecentPosts(SKELETON_COUNT);

  // Memoized callback functions to prevent unnecessary re-renders of child components
  const handleReadMore = useCallback((postId: string) => {
    navigate(`/blog/${postId}`);
  }, [navigate]);

  const handleViewAll = useCallback(() => {
    navigate('/blog');
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Memoized computation for last updated time to avoid recalculation on every render
  const lastUpdatedText = useMemo(() => {
    if (!dataUpdatedAt || isLoading) return null;
    return `Last updated: ${new Date(dataUpdatedAt).toLocaleString()}`;
  }, [dataUpdatedAt, isLoading]);

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

  // Common header section to reduce code duplication
  const headerSection = useMemo(() => (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-4">
        <h2 className="text-3xl font-bold text-gradient-brand">Latest News & Insights</h2>
        {isFetching && (
          <div className="flex items-center gap-2 text-secondary">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Updating...</span>
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
        Stay updated with the latest trends, insights, and best practices in real estate verification and fraud prevention
      </p>
      {lastUpdatedText && (
        <p className="text-xs text-muted-foreground mt-2">
          {lastUpdatedText}
        </p>
      )}
    </div>
  ), [isFetching, lastUpdatedText]);

  // Loading State - Early return pattern for cleaner code flow
  if (isLoading) {
    return (
      <div className="container mx-auto px-4">
        {headerSection}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {skeletonArray.map((i) => (
            <BlogPostSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  // Error State - Early return pattern for cleaner code flow
  if (error) {
    return (
      <div className="container mx-auto px-4">
        {headerSection}
        <ErrorState
          title="Unable to Load Articles"
          message="We're having trouble loading the latest articles. Please try again."
          onRetry={handleRefresh}
          variant="generic"
        />
      </div>
    );
  }

  // Main content render
  return (
    <div className="container mx-auto px-4">
      {headerSection}
      
      {/* Articles Grid */}
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

      {/* Call to Action */}
      <div className="text-center mt-12">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg" 
            variant="coral"
            className="px-8 py-3 hover:bg-secondary/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            onClick={handleViewAll}
          >
            View All Articles
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          {/* Manual refresh button */}
          <Button 
            size="sm" 
            variant="coral-ghost"
            className="px-4 py-2 hover:bg-secondary/10 transition-all duration-300"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh Articles'}
          </Button>
        </div>
      </div>
    </div>
  );
}