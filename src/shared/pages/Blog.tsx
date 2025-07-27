import { memo, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { BlogPostCard, type BlogPost as SharedBlogPost } from "../components/blog/BlogPostCard";
import { BLOG_POSTS } from "../config/assets";

// Enhanced type definitions with better semantic clarity
type StaticBlogPost = typeof BLOG_POSTS[number];

// Optimized transformation function with explicit return type for better type inference
const transformStaticPost = (post: StaticBlogPost): SharedBlogPost => ({
  id: post.id,
  title: post.title,
  excerpt: post.excerpt,
  category: post.category,
  date: post.date,
  readTime: post.readTime,
  image: {
    webp: post.image.webp,
    jpg: post.image.jpg,
    alt: post.image.alt
  },
  author: post.author // Preserved string format for static posts
});

// Enhanced SectionHeader with improved prop interface and better accessibility
interface SectionHeaderProps {
  readonly title: string;
  readonly className?: string;
  readonly id?: string;
}

const SectionHeader = memo<SectionHeaderProps>(({ title, className = "", id }) => (
  <h2 
    id={id}
    className={`text-2xl font-bold mb-8 flex items-center gap-2 ${className}`}
  >
    <span className="w-1 h-8 bg-secondary rounded-full" aria-hidden="true" />
    {title}
  </h2>
));

SectionHeader.displayName = 'SectionHeader';

// Grid variant type for better type safety in rendering logic
type GridVariant = 'featured' | 'default';

// Constants for better maintainability and performance
const GRID_CLASSES: Record<GridVariant, string> = {
  featured: "grid grid-cols-1 lg:grid-cols-2 gap-8",
  default: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
} as const;

const FEATURED_POSTS_COUNT = 2;

// Main BlogPage component with enhanced optimization strategies
const BlogPage = memo(() => {
  const navigate = useNavigate();

  // Pre-transformed posts - memoized with empty dependency array since BLOG_POSTS is static
  // This prevents unnecessary recalculations on every render
  const transformedPosts = useMemo(() => 
    BLOG_POSTS.map(transformStaticPost), 
    [] // Static data dependency - no need to recalculate
  );

  // Featured posts extraction - optimized to avoid slice operation on every render
  const featuredPosts = useMemo(() => 
    transformedPosts.slice(0, FEATURED_POSTS_COUNT), 
    [transformedPosts]
  );

  // Stable navigation handler - prevents unnecessary child re-renders through reference equality
  const handleReadMore = useCallback((postId: string) => {
    navigate(`/blog/${postId}`);
  }, [navigate]);

  // Optimized post grid renderer with better type safety and performance characteristics
  const renderPostGrid = useCallback((
    posts: readonly SharedBlogPost[], 
    variant: GridVariant = 'default'
  ) => {
    // Use pre-defined constants for better performance and maintainability
    // Access the grid class safely to prevent potential object injection issues
    const gridClassName = Object.prototype.hasOwnProperty.call(GRID_CLASSES, variant) 
      ? GRID_CLASSES[variant] 
      : GRID_CLASSES.default;

    return (
      <div className={gridClassName}>
        {posts.map((post) => (
          <BlogPostCard
            key={post.id}
            post={post}
            onReadMore={() => handleReadMore(post.id)}
            variant={variant}
            showTags={false}
            showViewCount={false}
          />
        ))}
      </div>
    );
  }, [handleReadMore]);

  // Enhanced component structure with improved semantic HTML and accessibility features
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Semantic header with enhanced accessibility attributes */}
          <header className="text-center mb-16" role="banner">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              TripleCheck Insights
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Navigate Africa&rsquo;s dynamic real estate landscape with confidence. 
              Our deep-dive analyses uncover emerging opportunities, decode market 
              shifts, and translate complex PropTech innovations into actionable 
              investment strategies that drive sustainable returns across the continent&rsquo;s 
              most promising markets.
            </p>
          </header>

          {/* Featured posts section with proper ARIA labeling */}
          <section className="mb-16" aria-labelledby="featured-heading">
            <SectionHeader 
              id="featured-heading"
              title="Featured Articles" 
              className="scroll-mt-4" 
            />
            {renderPostGrid(featuredPosts, 'featured')}
          </section>

          {/* All posts section with consistent semantic structure */}
          <section aria-labelledby="all-posts-heading">
            <SectionHeader 
              id="all-posts-heading"
              title="All Articles" 
              className="scroll-mt-4" 
            />
            {renderPostGrid(transformedPosts)}
          </section>
        </div>
      </div>
    </div>
  );
});

// Display name for enhanced debugging and development experience
BlogPage.displayName = 'BlogPage';

export default BlogPage;