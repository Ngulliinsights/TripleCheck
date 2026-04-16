import { memo } from "react"

import { Card, CardContent, CardHeader } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

interface BlogPostSkeletonProps {
  variant?: "default" | "compact";
  showTags?: boolean;
}

export const BlogPostSkeleton = memo<BlogPostSkeletonProps>(({ 
  variant = "default",
  showTags = true 
}) => (
  <Card className="h-full overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <CardHeader className="pb-3">
      <div className="flex items-center gap-4 mb-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-3/4" />
    </CardHeader>
    <CardContent className="pt-0">
      <Skeleton className="h-16 w-full mb-4" />
      
      {showTags && (
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
    </CardContent>
  </Card>
));

BlogPostSkeleton.displayName = "BlogPostSkeleton";