import { Calendar, User, Clock, ArrowRight } from "lucide-react"
import { memo, useMemo, useCallback } from "react"

import { formatDate } from "../../utils/date-utils"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"

// Unified blog post type that works with both static and dynamic data
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  featured?: boolean;
  date?: string; // For static posts
  publishedAt?: string; // For dynamic posts
  readTime: string;
  viewCount?: number;
  image: {
    webp?: string;
    jpg?: string;
    fallback?: string;
    alt?: string;
  };
  tags?: string[];
  author: {
    name: string;
  } | string; // Support both object and string formats
}

interface BlogPostCardProps {
  post: BlogPost;
  onReadMore: () => void;
  variant?: "default" | "featured";
  showTags?: boolean;
  showViewCount?: boolean;
  maxTags?: number;
}

const DAYS_TO_SHOW_NEW_BADGE = 7;

// Utility functions
const isPostNew = (dateString: string): boolean => {
  const publishedDate = new Date(dateString);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff <= DAYS_TO_SHOW_NEW_BADGE;
};

const formatViewCount = (count: number): string => {
  return count.toLocaleString();
};

const getAuthorName = (author: BlogPost['author']): string => {
  return typeof author === 'string' ? author : author.name;
};

const getPostDate = (post: BlogPost): string => {
  return post.publishedAt || post.date || '';
};

export const BlogPostCard = memo<BlogPostCardProps>(({ 
  post, 
  onReadMore, 
  variant = "default",
  showTags = true,
  showViewCount = true,
  maxTags = 2
}) => {
  const postDate = getPostDate(post);
  const formattedDate = useMemo(() => formatDate(postDate), [postDate]);
  const authorName = getAuthorName(post.author);
  const isNew = useMemo(() => isPostNew(postDate), [postDate]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Allow clicking on the card itself
    if (e.target === e.currentTarget || !(e.target as Element).closest('button')) {
      onReadMore();
    }
  }, [onReadMore]);

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onReadMore();
  }, [onReadMore]);

  return (
    <Card 
      className="glass-property-card h-full overflow-hidden group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Blog Image */}
      <div className="relative overflow-hidden">
        <picture>
          {post.image.webp && <source srcSet={post.image.webp} type="image/webp" />}
          <img
            src={post.image.jpg || post.image.fallback || ''}
            alt={post.image.alt || post.title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
        </picture>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Badge className="glass-secondary text-white">
            {post.category}
          </Badge>
          {post.featured && (
            <Badge className="glass-accent text-white text-xs">
              Featured
            </Badge>
          )}
          {isNew && (
            <Badge className="glass-primary text-white text-xs animate-pulse">
              New
            </Badge>
          )}
        </div>
        
        {/* View count */}
        {showViewCount && post.viewCount && (
          <div className="absolute bottom-4 right-4 glass-card px-2 py-1 text-xs text-glass-dark">
            {formatViewCount(post.viewCount)} views
          </div>
        )}
      </div>

      <CardContent className="p-6 flex flex-col h-full">
        {/* Meta Information */}
        <div className="flex items-center gap-4 text-sm text-glass-medium mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
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
        {showTags && post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, maxTags).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {post.tags.length > maxTags && (
              <Badge variant="outline" className="text-xs">
                +{post.tags.length - maxTags}
              </Badge>
            )}
          </div>
        )}
        
        {/* Author and Button */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-sm text-glass-medium">
            <User className="w-4 h-4" />
            <span>By {authorName}</span>
          </div>
          <Button
            size="sm"
            onClick={handleButtonClick}
            className="glass-btn-secondary"
          >
            Read More
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

BlogPostCard.displayName = "BlogPostCard";