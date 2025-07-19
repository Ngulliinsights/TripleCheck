import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
  lines?: number;
}

export function LoadingSkeleton({ 
  className, 
  variant = 'default',
  lines = 1 
}: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 rounded";
  
  switch (variant) {
    case 'card':
      return (
        <div className={cn("space-y-4", className)}>
          <div className={cn(baseClasses, "h-48 w-full")} />
          <div className="space-y-2">
            <div className={cn(baseClasses, "h-4 w-3/4")} />
            <div className={cn(baseClasses, "h-4 w-1/2")} />
            <div className={cn(baseClasses, "h-6 w-1/3")} />
          </div>
        </div>
      );
    
    case 'text':
      return (
        <div className={cn("space-y-2", className)}>
          {Array.from({ length: lines }, (_, i) => (
            <div 
              key={i} 
              className={cn(
                baseClasses, 
                "h-4",
                i === lines - 1 ? "w-2/3" : "w-full"
              )} 
            />
          ))}
        </div>
      );
    
    case 'avatar':
      return (
        <div className={cn(baseClasses, "h-10 w-10 rounded-full", className)} />
      );
    
    case 'button':
      return (
        <div className={cn(baseClasses, "h-10 w-24", className)} />
      );
    
    default:
      return (
        <div className={cn(baseClasses, "h-4 w-full", className)} />
      );
  }
}

// Specialized loading components for common use cases
export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <LoadingSkeleton variant="card" />
    </div>
  );
}

export function ReviewSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-4 p-4", className)}>
      <LoadingSkeleton variant="avatar" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton className="h-4 w-1/4" />
        <LoadingSkeleton className="h-4 w-1/2" />
        <LoadingSkeleton variant="text" lines={3} />
      </div>
    </div>
  );
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-8", className)}>
      <div className="space-y-4">
        <LoadingSkeleton className="h-8 w-1/3" />
        <LoadingSkeleton variant="text" lines={2} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}