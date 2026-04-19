import { memo, useMemo } from "react"
import { useBlogPosts } from "../hooks/useCMS"
import { BlogPostCard, type BlogPost } from "./blog/BlogPostCard"
import { BlogPostSkeleton } from "./blog/BlogPostSkeleton"

interface NewsBlogProps {
  maxPosts?: number
  variant?: "featured" | "default"
}

export const NewsBlog = memo(function NewsBlog({
  maxPosts = 3,
  variant = "default",
}: NewsBlogProps) {
  const { data: posts = [], isLoading, error } = useBlogPosts()

  const displayPosts = useMemo(() => {
    if (!posts || posts.length === 0) return []
    return posts.slice(0, maxPosts)
  }, [posts, maxPosts])

  if (error) {
    return null // Silently fail for now - blog is non-critical
  }

  return (
    <section
      className="py-24 bg-gradient-to-b from-dark-500 to-dark-600"
      aria-label="Latest news and blog posts"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-3">Latest News & Insights</h2>
          <p className="text-gray-300 text-lg">
            Stay updated with African property trends and market insights
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: maxPosts }).map((_, i) => (
              <BlogPostSkeleton key={i} />
            ))}
          </div>
        ) : displayPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No blog posts available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(displayPosts as BlogPost[]).map((post) => (
              <BlogPostCard
                key={post.id}
                post={post}
                onReadMore={() => {
                  // Handle read more action
                  window.location.hash = `/blog/${post.id}`
                }}
                showTags
                showViewCount
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
})

NewsBlog.displayName = "NewsBlog"
