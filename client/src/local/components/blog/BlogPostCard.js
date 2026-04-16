"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPostCard = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var date_utils_1 = require("../../utils/date-utils");
var badge_1 = require("../ui/badge");
var button_1 = require("../ui/button");
var card_1 = require("../ui/card");
var DAYS_TO_SHOW_NEW_BADGE = 7;
// Utility functions
var isPostNew = function (dateString) {
    var publishedDate = new Date(dateString);
    var now = new Date();
    var daysDiff = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= DAYS_TO_SHOW_NEW_BADGE;
};
var formatViewCount = function (count) {
    return count.toLocaleString();
};
var getAuthorName = function (author) {
    return typeof author === 'string' ? author : author.name;
};
var getPostDate = function (post) {
    return post.publishedAt || post.date || '';
};
exports.BlogPostCard = (0, react_1.memo)(function (_a) {
    var post = _a.post, onReadMore = _a.onReadMore, _b = _a.variant, variant = _b === void 0 ? "default" : _b, _c = _a.showTags, showTags = _c === void 0 ? true : _c, _d = _a.showViewCount, showViewCount = _d === void 0 ? true : _d, _e = _a.maxTags, maxTags = _e === void 0 ? 2 : _e;
    var postDate = getPostDate(post);
    var formattedDate = (0, react_1.useMemo)(function () { return (0, date_utils_1.formatDate)(postDate); }, [postDate]);
    var authorName = getAuthorName(post.author);
    var isNew = (0, react_1.useMemo)(function () { return isPostNew(postDate); }, [postDate]);
    var handleCardClick = (0, react_1.useCallback)(function (e) {
        // Allow clicking on the card itself
        if (e.target === e.currentTarget || !e.target.closest('button')) {
            onReadMore();
        }
    }, [onReadMore]);
    var handleButtonClick = (0, react_1.useCallback)(function (e) {
        e.stopPropagation();
        onReadMore();
    }, [onReadMore]);
    return (<card_1.Card className="glass-property-card h-full overflow-hidden group cursor-pointer" onClick={handleCardClick}>
      {/* Blog Image */}
      <div className="relative overflow-hidden">
        <picture>
          {post.image.webp && <source srcSet={post.image.webp} type="image/webp"/>}
          <img src={post.image.jpg || post.image.fallback || ''} alt={post.image.alt || post.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" decoding="async"/>
        </picture>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <badge_1.Badge className="glass-secondary text-white">
            {post.category}
          </badge_1.Badge>
          {post.featured && (<badge_1.Badge className="glass-accent text-white text-xs">
              Featured
            </badge_1.Badge>)}
          {isNew && (<badge_1.Badge className="glass-primary text-white text-xs animate-pulse">
              New
            </badge_1.Badge>)}
        </div>
        
        {/* View count */}
        {showViewCount && post.viewCount && (<div className="absolute bottom-4 right-4 glass-card px-2 py-1 text-xs text-glass-dark">
            {formatViewCount(post.viewCount)} views
          </div>)}
      </div>

      <card_1.CardContent className="p-6 flex flex-col h-full">
        {/* Meta Information */}
        <div className="flex items-center gap-4 text-sm text-glass-medium mb-3">
          <div className="flex items-center gap-1">
            <lucide_react_1.Calendar className="w-4 h-4"/>
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <lucide_react_1.Clock className="w-4 h-4"/>
            <span>{post.readTime}</span>
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold mb-3 line-clamp-2 hover:text-secondary transition-colors flex-shrink-0 text-glass-dark">
          {post.title}
        </h3>
        
        {/* Excerpt */}
        <p className="text-glass-medium mb-4 flex-grow leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>
        
        {/* Tags */}
        {showTags && post.tags && post.tags.length > 0 && (<div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, maxTags).map(function (tag) { return (<badge_1.Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </badge_1.Badge>); })}
            {post.tags.length > maxTags && (<badge_1.Badge variant="outline" className="text-xs">
                +{post.tags.length - maxTags}
              </badge_1.Badge>)}
          </div>)}
        
        {/* Author and Button */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-sm text-glass-medium">
            <lucide_react_1.User className="w-4 h-4"/>
            <span>By {authorName}</span>
          </div>
          <button_1.Button size="sm" onClick={handleButtonClick} className="glass-btn-secondary">
            Read More
            <lucide_react_1.ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300"/>
          </button_1.Button>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
});
exports.BlogPostCard.displayName = "BlogPostCard";
