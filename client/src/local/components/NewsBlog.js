"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsBlog = NewsBlog;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var useCMS_1 = require("../hooks/useCMS");
var BlogPostCard_1 = require("./blog/BlogPostCard");
var BlogPostSkeleton_1 = require("./blog/BlogPostSkeleton");
var button_1 = require("./ui/button");
var error_states_1 = require("./ui/error-states");
// Constants moved outside component to prevent re-creation on each render
var SKELETON_COUNT = 3;
// Transform CMS post to shared blog post format with proper type safety
var transformCMSPost = function (post) { return (__assign(__assign(__assign(__assign({ id: post.id, title: post.title, excerpt: post.excerpt, category: post.category }, (post.featured !== undefined && { featured: post.featured })), { publishedAt: post.publishedAt, readTime: post.readTime }), (post.viewCount !== undefined && { viewCount: post.viewCount })), { image: {
        webp: post.image.webp,
        fallback: post.image.fallback
    }, tags: post.tags, author: post.author })); };
function NewsBlog() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    // Fetch the latest 3 posts for the home page
    var _a = (0, useCMS_1.useRecentPosts)(SKELETON_COUNT), _b = _a.data, posts = _b === void 0 ? [] : _b, isLoading = _a.isLoading, error = _a.error;
    // Memoized callback functions to prevent unnecessary re-renders of child components
    var handleReadMore = (0, react_1.useCallback)(function (postId) {
        navigate("/blog/".concat(postId));
    }, [navigate]);
    var handleViewAll = (0, react_1.useCallback)(function () {
        navigate('/blog');
    }, [navigate]);
    // Memoized skeleton array to prevent recreation
    var skeletonArray = (0, react_1.useMemo)(function () {
        return Array.from({ length: SKELETON_COUNT }, function (_, i) { return i; });
    }, []);
    // Memoized transformed posts to prevent recalculation on every render
    var transformedPosts = (0, react_1.useMemo)(function () {
        return posts.map(transformCMSPost);
    }, [posts]);
    // All useMemo hooks must be called before any conditional returns
    // This ensures React's hook call order remains consistent across renders
    // Dynamic CTA copy based on content state - computed before conditional returns
    var ctaCopy = (0, react_1.useMemo)(function () {
        var postCount = transformedPosts.length;
        if (postCount === 0)
            return "Explore Knowledge Base";
        if (postCount < SKELETON_COUNT)
            return "View All ".concat(postCount > 1 ? 'Stories' : 'Story');
        return "Explore Full Library";
    }, [transformedPosts.length]);
    // Loading State - Early return pattern for cleaner code flow
    if (isLoading) {
        return (<div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {skeletonArray.map(function (i) { return (<BlogPostSkeleton_1.BlogPostSkeleton key={"skeleton-".concat(i)}/>); })}
        </div>
      </div>);
    }
    // Error State with more specific messaging
    if (error) {
        return (<div className="container mx-auto px-4">
        <error_states_1.ErrorState title="Content Temporarily Unavailable" message="Our editorial team is working to restore access to the knowledge base. Please check back shortly or contact support if this persists." variant="generic"/>
      </div>);
    }
    // Main content render
    return (<div className="container mx-auto px-4">
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {transformedPosts.map(function (post) { return (<BlogPostCard_1.BlogPostCard key={post.id} post={post} onReadMore={function () { return handleReadMore(post.id); }} showTags={true} showViewCount={true} maxTags={2}/>); })}
      </div>

      {/* Call to Action Section */}
      <div className="text-center mt-12">
        <button_1.Button size="lg" variant="coral" className="px-8 py-3 hover:bg-secondary/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl" onClick={handleViewAll}>
          {ctaCopy}
          <lucide_react_1.ArrowRight className="w-5 h-5 ml-2"/>
        </button_1.Button>
      </div>
    </div>);
}
