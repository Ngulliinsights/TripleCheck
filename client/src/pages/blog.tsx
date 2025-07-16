import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useBlogPosts, useBlogPost } from "@/hooks/useCMS";
import { BlogPost } from "@/services/cms";
import {
  Calendar,
  User,
  Clock,
  Share2,
  BookOpen,
  ArrowLeft,
  ExternalLink,
  Tag,
  Search,
  Filter,
  Eye,
} from "lucide-react";

// Helper function for better readability
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Enhanced loading skeleton component
const BlogPostSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <CardContent className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-20 w-full mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
    </CardContent>
  </Card>
);

// Enhanced blog post card component
const BlogPostCard = ({
  post,
  onReadMore,
}: {
  post: BlogPost;
  onReadMore: () => void;
}) => (
  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
    <div className="aspect-video relative group">
      <OptimizedImage
        webpSrc={post.image.webp}
        fallbackSrc={post.image.fallback}
        alt={post.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Badge variant={post.featured ? "default" : "secondary"}>
          {post.category}
        </Badge>
        {post.featured && (
          <Badge variant="destructive" className="text-xs">
            Featured
          </Badge>
        )}
      </div>
      {post.viewCount && (
        <div className="absolute bottom-4 right-4 flex items-center gap-1 text-white text-sm">
          <Eye className="w-4 h-4" />
          {post.viewCount.toLocaleString()}
        </div>
      )}
    </div>
    <CardContent className="p-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(post.publishedAt)}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {post.readTime}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-3 line-clamp-2 hover:text-primary transition-colors">
        {post.title}
      </h3>
      <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
        {post.excerpt}
      </p>
      <div className="flex flex-wrap gap-1 mb-4">
        {post.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
        {post.tags.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{post.tags.length - 3} more
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">{post.author.name}</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onReadMore}
            className="hover:bg-primary/90 transition-colors"
          >
            Read More
          </Button>
          {post.externalUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(post.externalUrl, "_blank")}
              className="hover:bg-secondary/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function BlogPage() {
  const [location, setLocation] = useLocation();

  // Extract blog ID from URL with better parsing
  const blogId = location.split("/blog/")[1];
  const isListView = !blogId;

  // Enhanced queries using CMS hooks
  const {
    data: posts = [],
    isLoading,
    error,
  } = useBlogPosts({
    enabled: isListView, // Only fetch posts list when in list view
  });

  const { 
    data: currentPost, 
    isLoading: isLoadingPost,
    error: postError 
  } = useBlogPost(blogId || '', {
    enabled: !!blogId, // Only fetch individual post when blogId exists
  });

  // Enhanced list view with better UX
  if (isListView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced header with better copy */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                TripleCheck Insights
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Expert analysis, market insights, and strategic guidance for
                African real estate investors. Stay ahead of the curve with our
                comprehensive coverage of PropTech trends and investment
                opportunities.
              </p>
            </div>

            {/* Featured posts section */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <span className="w-1 h-8 bg-primary rounded-full"></span>
                Featured Articles
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {posts
                  .filter((post) => post.featured)
                  .map((post) => (
                    <BlogPostCard
                      key={post.id}
                      post={post}
                      onReadMore={() => setLocation(`/blog/${post.id}`)}
                    />
                  ))}
              </div>
            </div>

            {/* All posts section */}
            <div>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <span className="w-1 h-8 bg-primary rounded-full"></span>
                All Articles
              </h2>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }, (_, i) => (
                    <BlogPostSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    We're having trouble loading the blog posts. Please try
                    again later.
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Refresh Page
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map((post) => (
                    <BlogPostCard
                      key={post.id}
                      post={post}
                      onReadMore={() => setLocation(`/blog/${post.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced loading state for individual posts
  if (isLoadingPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-64 w-full mb-8 rounded-lg" />
            <div className="space-y-4 mb-8">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-3/4" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced 404 state
  if (!currentPost && !isLoadingPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The article you're looking for doesn't exist or may have been
              moved.
            </p>
            <Button onClick={() => setLocation("/blog")} size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced individual post view
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/blog")}
            className="mb-6 hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>

          {currentPost && (
            <article className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Hero image */}
              <div className="aspect-video relative">
                <OptimizedImage
                  webpSrc={currentPost.image.webp}
                  fallbackSrc={currentPost.image.fallback}
                  alt={currentPost.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">{currentPost.category}</Badge>
                    {currentPost.featured && (
                      <Badge variant="destructive">Featured</Badge>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                    {currentPost.title}
                  </h1>
                </div>
              </div>

              {/* Article metadata */}
              <div className="p-8 border-b">
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{currentPost.author.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(currentPost.publishedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{currentPost.readTime}</span>
                  </div>
                  {currentPost.viewCount && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{currentPost.viewCount.toLocaleString()} views</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentPost.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Excerpt */}
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {currentPost.excerpt}
                </p>
              </div>

              {/* Article content */}
              <div className="p-8">
                <div 
                  className="prose prose-lg max-w-none prose-headings:text-customSecondary prose-links:text-primary hover:prose-links:text-primary/80 prose-blockquote:border-l-primary prose-blockquote:bg-secondary/20 prose-blockquote:p-4 prose-blockquote:rounded-r-lg"
                  dangerouslySetInnerHTML={{ __html: currentPost.content }}
                />
              </div>

              {/* Article footer */}
              <div className="p-8 bg-secondary/20 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-semibold">{currentPost.author.name}</h4>
                      {currentPost.author.bio && (
                        <p className="text-sm text-muted-foreground">
                          {currentPost.author.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.share?.({
                          title: currentPost.title,
                          text: currentPost.excerpt,
                          url: window.location.href,
                        }) || navigator.clipboard.writeText(window.location.href);
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    {currentPost.externalUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(currentPost.externalUrl, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        External Link
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}