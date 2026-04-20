import { Calendar, User, Clock, ArrowRight } from "lucide-react"
import { type KeyboardEvent, memo, useCallback, useMemo } from "react"

import { formatDate } from "../../utils/date-utils"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Unified blog post type that works with both static and dynamic data.
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  featured?: boolean;
  date?: string;        // static posts
  publishedAt?: string; // dynamic posts
  readTime: string;
  viewCount?: number;
  image: {
    webp?: string;
    jpg?: string;
    fallback?: string;
    alt?: string;
  };
  tags?: string[];
  author: { name: string } | string;
}

interface BlogPostCardProps {
  post: BlogPost;
  onReadMore: () => void;
  /** Controls visual emphasis. "featured" may be used by parent grids for layout; reserved for future card-level styling. */
  _variant?: "default" | "featured";
  showTags?: boolean;
  showViewCount?: boolean;
  maxTags?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS_TO_SHOW_NEW_BADGE = 7;

// ---------------------------------------------------------------------------
// Pure helpers (defined outside the component to avoid re-allocation)
// ---------------------------------------------------------------------------

const getAuthorName = (author: BlogPost["author"]): string =>
  typeof author === "string" ? author : author.name;

const getPostDate = (post: BlogPost): string =>
  post.publishedAt ?? post.date ?? "";

/**
 * Returns true when the post was published within the last N days.
 * Guards against an empty or invalid date string gracefully.
 */
const isPostNew = (dateString: string): boolean => {
  if (!dateString) return false;
  const published = new Date(dateString);
  if (isNaN(published.getTime())) return false;
  const diffMs = Date.now() - published.getTime();
  return Math.floor(diffMs / 86_400_000) <= DAYS_TO_SHOW_NEW_BADGE;
};

const formatViewCount = (count: number): string => count.toLocaleString();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BlogPostCard = memo<BlogPostCardProps>(({
  post,
  onReadMore,
  variant = "default",
  showTags = true,
  showViewCount = true,
  maxTags = 2,
}) => {
  const postDate     = getPostDate(post);
  const formattedDate = useMemo(() => (postDate ? formatDate(postDate) : null), [postDate]);
  const authorName   = useMemo(() => getAuthorName(post.author), [post.author]);
  const isNew        = useMemo(() => isPostNew(postDate), [postDate]);

  // The card is an interactive region; the Read More button has stopPropagation,
  // so clicking it will NOT bubble here — no extra guard needed.
  const handleCardClick = useCallback(() => {
    onReadMore();
  }, [onReadMore]);

  // Allow keyboard users to activate the card via Enter or Space.
  const handleCardKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onReadMore();
    }
  }, [onReadMore]);

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onReadMore();
  }, [onReadMore]);

  const extraTagCount = (post.tags?.length ?? 0) - maxTags;

  return (
    <Card
      role="article"
      tabIndex={0}
      aria-label={post.title}
      className="glass-property-card h-full overflow-hidden group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <picture>
          {post.image.webp && <source srcSet={post.image.webp} type="image/webp" />}
          <img
            src={post.image.jpg ?? post.image.fallback ?? ""}
            alt={post.image.alt ?? post.title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
        </picture>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-hidden="true"
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Badge className="glass-secondary text-white">{post.category}</Badge>
          {post.featured && (
            <Badge className="glass-accent text-white text-xs">Featured</Badge>
          )}
          {isNew && (
            <Badge className="glass-primary text-white text-xs animate-pulse">New</Badge>
          )}
        </div>

        {/* View count */}
        {showViewCount && post.viewCount != null && (
          <div
            className="absolute bottom-4 right-4 glass-card px-2 py-1 text-xs text-glass-dark"
            aria-label={`${formatViewCount(post.viewCount)} views`}
          >
            {formatViewCount(post.viewCount)} views
          </div>
        )}
      </div>

      {/* Body */}
      <CardContent className="p-6 flex flex-col flex-1">
        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-glass-medium mb-3">
          {formattedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <time dateTime={postDate}>{formattedDate}</time>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold mb-3 line-clamp-2 hover:text-secondary transition-colors shrink-0 text-glass-dark">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-glass-medium mb-4 grow leading-relaxed line-clamp-3">
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
            {extraTagCount > 0 && (
              <Badge variant="outline" className="text-xs">
                +{extraTagCount}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-sm text-glass-medium">
            <User className="w-4 h-4" aria-hidden="true" />
            <span>By {authorName}</span>
          </div>

          <Button
            size="sm"
            onClick={handleButtonClick}
            className="glass-btn-secondary group/btn"
            aria-label={`Read more about ${post.title}`}
          >
            Read More
            <ArrowRight
              className="w-4 h-4 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1"
              aria-hidden="true"
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

BlogPostCard.displayName = "BlogPostCard";