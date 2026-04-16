"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var BlogPostCard_1 = require("../components/blog/BlogPostCard");
var assets_1 = require("../config/assets");
var useNavigationSpacing_1 = require("../hooks/useNavigationSpacing");
// Optimized transformation function with explicit return type for better type inference
var transformStaticPost = function (post) { return ({
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
}); };
var SectionHeader = (0, react_1.memo)(function (_a) {
    var title = _a.title, _b = _a.className, className = _b === void 0 ? "" : _b, id = _a.id;
    return (<h2 id={id} className={"text-2xl font-bold mb-8 flex items-center gap-2 ".concat(className)}>
    <span className="w-1 h-8 bg-secondary rounded-full" aria-hidden="true"/>
    {title}
  </h2>);
});
SectionHeader.displayName = 'SectionHeader';
// Constants for better maintainability and performance
var GRID_CLASSES = {
    featured: "grid grid-cols-1 lg:grid-cols-2 gap-8",
    default: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
};
var FEATURED_POSTS_COUNT = 2;
// Main BlogPage component with enhanced optimization strategies
var BlogPage = (0, react_1.memo)(function () {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var pageClassName = (0, useNavigationSpacing_1.usePageSpacing)().pageClassName;
    // Pre-transformed posts - memoized with empty dependency array since BLOG_POSTS is static
    // This prevents unnecessary recalculations on every render
    var transformedPosts = (0, react_1.useMemo)(function () {
        return assets_1.BLOG_POSTS.map(transformStaticPost);
    }, [] // Static data dependency - no need to recalculate
    );
    // Featured posts extraction - optimized to avoid slice operation on every render
    var featuredPosts = (0, react_1.useMemo)(function () {
        return transformedPosts.slice(0, FEATURED_POSTS_COUNT);
    }, [transformedPosts]);
    // Stable navigation handler - prevents unnecessary child re-renders through reference equality
    var handleReadMore = (0, react_1.useCallback)(function (postId) {
        navigate("/blog/".concat(postId));
    }, [navigate]);
    // Optimized post grid renderer with better type safety and performance characteristics
    var renderPostGrid = (0, react_1.useCallback)(function (posts, variant) {
        if (variant === void 0) { variant = 'default'; }
        // Use pre-defined constants for better performance and maintainability
        // Access the grid class safely to prevent potential object injection issues
        var gridClassName = Object.prototype.hasOwnProperty.call(GRID_CLASSES, variant)
            ? GRID_CLASSES[variant]
            : GRID_CLASSES.default;
        return (<div className={gridClassName}>
        {posts.map(function (post) { return (<BlogPostCard_1.BlogPostCard key={post.id} post={post} onReadMore={function () { return handleReadMore(post.id); }} variant={variant} showTags={false} showViewCount={false}/>); })}
      </div>);
    }, [handleReadMore]);
    // Enhanced component structure with improved semantic HTML and accessibility features
    return (<div className={"min-h-screen bg-dark-gradient-primary ".concat(pageClassName)}>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Semantic header with enhanced accessibility attributes */}
          <header className="text-center mb-16" role="banner">
            <div className="glass-modal p-12 mx-auto max-w-4xl">
              <h1 className="text-5xl font-bold mb-6 text-glass-light">
                TripleCheck Insights
              </h1>
              <p className="text-xl text-glass-medium max-w-3xl mx-auto leading-relaxed">
                Navigate Africa&rsquo;s dynamic real estate landscape with confidence. 
                Our deep-dive analyses uncover emerging opportunities, decode market 
                shifts, and translate complex PropTech innovations into actionable 
                investment strategies that drive sustainable returns across the continent&rsquo;s 
                most promising markets.
              </p>
            </div>
          </header>

          {/* Featured posts section with proper ARIA labeling */}
          <section className="mb-16 py-12 bg-dark-gradient-secondary relative overflow-hidden" aria-labelledby="featured-heading">
            <div className="absolute inset-0 bg-glass-secondary backdrop-blur-glass-medium"></div>
            <div className="relative z-10">
              <SectionHeader id="featured-heading" title="Featured Articles" className="scroll-margin-nav text-glass-light"/>
              {renderPostGrid(featuredPosts, 'featured')}
            </div>
          </section>

          {/* All posts section with consistent semantic structure */}
          <section className="py-12 bg-dark-gradient-accent relative overflow-hidden" aria-labelledby="all-posts-heading">
            <div className="absolute inset-0 bg-glass-accent backdrop-blur-glass-light"></div>
            <div className="relative z-10">
              <SectionHeader id="all-posts-heading" title="All Articles" className="scroll-margin-nav text-glass-light"/>
              {renderPostGrid(transformedPosts)}
            </div>
          </section>
        </div>
      </div>
    </div>);
});
// Display name for enhanced debugging and development experience
BlogPage.displayName = 'BlogPage';
exports.default = BlogPage;
