import { OptimizedImage } from "./ui/optimized-image";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { useRecentPosts } from "@/hooks/useCMS";

// Helper function to format dates
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Loading skeleton for blog posts
const BlogPostSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="aspect-video w-full" />
    <CardHeader>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-3/4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-16 w-full mb-4" />
      <Skeleton className="h-9 w-24" />
    </CardContent>
  </Card>
);

export function NewsBlog() {
  const [, setLocation] = useLocation();
  
  // Fetch recent posts using CMS hook
  const { data: posts = [], isLoading, error } = useRecentPosts(3);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-customPrimary mb-4">
            Latest News & Insights
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Stay informed with expert analysis, market insights, and the latest trends in African real estate
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {isLoading ? (
            // Show loading skeletons
            Array.from({ length: 3 }, (_, i) => (
              <BlogPostSkeleton key={i} />
            ))
          ) : error ? (
            // Show error state
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 mb-4">
                Unable to load latest articles. Please try again later.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : (
            // Show actual posts
            posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover-scale cursor-pointer transition-all duration-300 hover:shadow-lg">
                <div className="aspect-video relative">
                  <OptimizedImage
                    webpSrc={post.image.webp}
                    fallbackSrc={post.image.fallback}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="text-sm text-gray-500 mb-2">
                    {formatDate(post.publishedAt)}
                  </div>
                  <CardTitle className="text-xl text-customSecondary hover:text-customSecondary/80 transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  <Button
                    variant="outline"
                    className="text-customSecondary border-customSecondary hover:bg-customSecondary hover:text-white transition-all duration-300"
                    onClick={() => setLocation(`/blog/${post.id}`)}
                  >
                    Read More
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* View All Articles Button */}
        <div className="text-center">
          <Button
            size="lg"
            className="bg-customSecondary hover:bg-customSecondaryHover text-white px-8 py-3 transition-all duration-300 hover:scale-105"
            onClick={() => setLocation('/blog')}
          >
            View All Articles
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
