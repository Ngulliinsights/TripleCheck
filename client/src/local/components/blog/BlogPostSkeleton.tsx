import { memo } from "react"

import { Card, CardContent } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlogPostSkeletonProps {
  showTags?: boolean;
}

// ---------------------------------------------------------------------------
// Component
//
// Dimensions mirror BlogPostCard exactly so the layout shift on load is
// imperceptible. Any structural change to BlogPostCard should be reflected
// here.
// ---------------------------------------------------------------------------

export const BlogPostSkeleton = memo<BlogPostSkeletonProps>(({
  showTags = true,
}) => (
  <Card className="h-full overflow-hidden" aria-busy="true" aria-label="Loading post…">
    {/* Image — matches BlogPostCard h-48 */}
    <Skeleton className="h-48 w-full rounded-none" />

    <CardContent className="p-6 flex flex-col flex-1">
      {/* Meta row — date + read-time */}
      <div className="flex items-center gap-4 mb-3">
        <Skeleton className="h-4 w-20" /> {/* date */}
        <Skeleton className="h-4 w-16" /> {/* read time */}
      </div>

      {/* Title — two lines matching line-clamp-2 */}
      <div className="space-y-2 mb-3 shrink-0">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>

      {/* Excerpt — three lines matching line-clamp-3 */}
      <div className="space-y-2 mb-4 grow">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Tags */}
      {showTags && (
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      )}

      {/* Footer — author + button */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" /> {/* User icon */}
          <Skeleton className="h-4 w-28" />             {/* "By Author Name" */}
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />    {/* Read More button */}
      </div>
    </CardContent>
  </Card>
));

BlogPostSkeleton.displayName = "BlogPostSkeleton";