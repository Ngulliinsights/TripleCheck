import { memo, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";


import { BlogPostCard, type BlogPost as SharedBlogPost } from "../components/blog/BlogPostCard";
import { BLOG_POSTS } from "../config/assets";

// Define the static blog post type with better clarity
type StaticBlogPost = typeof BLOG_POSTS[number];

// Transform static blog post to shared format with enhanced type safety
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
  author: post.author // Static posts use string format
});

// Memoized section header component to prevent unnecessary re-renders
const SectionHeader = memo<{ title: string; className?: string }>(({ title, className = "" }) => (
  <h2 className={`text-2xl font-bold mb-8 flex items-center gap-2 ${className}`}>
    <span className="w-1 h-8 bg-secondary rounded-full" aria-hidden="true" />
    {title}
  </h2>
));

SectionHeader.displayName = 'SectionHeader';

// Enhanced main component with better performance and maintainability
const BlogPage = memo(() => {
  const navigate = useNavigate();

  // Transform static blog posts to shared format - memoized for performance
  const transformedPosts = useMemo(() => 
    BLOG_POSTS.map(transformStaticPost), 
    [] // Empty dependency array since BLOG_POSTS is static
  );

  // Memoize featured posts calculation to avoid recalculation
  const featuredPosts = useMemo(() => 
    transformedPosts.slice(0, 2), 
    [transformedPosts]
  );

  // Stable navigation handler using useCallback to prevent child re-renders
  const handleReadMore = useCallback((postId: string) => {
    navigate(`/blog/${postId}`);
  }, [navigate]);

  // Memoized post grid renderer to optimize rendering performance
  const renderPostGrid = useCallback((posts: SharedBlogPost[], variant: 'featured' | 'default' = 'default') => {
    const gridClasses = variant === 'featured' 
      ? "grid grid-cols-1 lg:grid-cols-2 gap-8"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8";

    return (
      <div className={gridClasses}>
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

  // Enhanced accessibility and semantic structure
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced header with improved semantic HTML and better accessibility */}
          <header className="text-center mb-16" role="banner">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              TripleCheck Insights
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Expert analysis, market insights, and strategic guidance for
              African real estate investors. Stay ahead of the curve with our
              comprehensive coverage of PropTech trends and investment
              opportunities.
            </p>
          </header>

          {/* Featured posts section with enhanced semantic structure */}
          <section className="mb-16" aria-labelledby="featured-heading">
            <SectionHeader 
              title="Featured Articles" 
              className="scroll-mt-4" 
            />
            {renderPostGrid(featuredPosts, 'featured')}
          </section>

          {/* All posts section with improved accessibility and performance */}
          <section aria-labelledby="all-posts-heading">
            <SectionHeader 
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

// Set display name for better debugging experience
BlogPage.displayName = 'BlogPage';

export default BlogPage;