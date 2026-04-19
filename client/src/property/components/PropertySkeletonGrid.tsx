import React from 'react'
import { Card, CardContent } from '../../local/components/ui/card'
import { Skeleton } from '../../local/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PropertySkeletonGridProps {
  readonly count: number
  readonly viewMode: 'grid' | 'list'
  readonly itemHeight?: number
  readonly className?: string
}

interface PropertySkeletonItemProps {
  readonly viewMode: 'grid' | 'list'
  readonly itemHeight: number
}

// ---------------------------------------------------------------------------
// PropertySkeletonItem
// ---------------------------------------------------------------------------

function PropertySkeletonItem({ viewMode, itemHeight }: PropertySkeletonItemProps): React.ReactElement {
  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden">
        <div className="flex">
          <div className="flex-shrink-0">
            <Skeleton className="w-48 h-32" />
          </div>
          <CardContent className="flex-1 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          </CardContent>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden" style={{ height: itemHeight }}>
      <div className="relative">
        <Skeleton className="w-full h-48" />
        <div className="absolute top-2 right-2">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="absolute bottom-2 left-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-3">
          {(['bed', 'bath', 'area'] as const).map((key) => (
            <div key={key} className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// UnifiedPropertySkeletonGrid (main)
// ---------------------------------------------------------------------------

function UnifiedPropertySkeletonGrid({
  count,
  viewMode,
  itemHeight = 320,
  className = '',
}: PropertySkeletonGridProps): React.ReactElement {
  return (
    <div className={className}>
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Grid / list */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }
      >
        {Array.from({ length: count }, (_, i) => (
          <PropertySkeletonItem key={i} viewMode={viewMode} itemHeight={itemHeight} />
        ))}
      </div>
    </div>
  )
}

UnifiedPropertySkeletonGrid.displayName = 'PropertySkeletonGrid'

// ---------------------------------------------------------------------------
// Specialised skeletons — factory avoids three near-identical components
// ---------------------------------------------------------------------------

type SkeletonVariant = 'residential' | 'commercial' | 'land'

const SKELETON_HEIGHTS: Record<SkeletonVariant, number> = {
  residential: 340,
  commercial: 360,
  land: 320,
}

interface SpecialisedSkeletonProps {
  readonly count?: number
  readonly viewMode?: 'grid' | 'list'
}

function createPropertySkeleton(variant: SkeletonVariant) {
  const height = SKELETON_HEIGHTS[variant]
  const displayName = `${variant.charAt(0).toUpperCase()}${variant.slice(1)}PropertySkeleton`

  function SpecialisedSkeleton({ count = 12, viewMode = 'grid' }: SpecialisedSkeletonProps) {
    return (
      <UnifiedPropertySkeletonGrid
        count={count}
        viewMode={viewMode}
        itemHeight={height}
        className="animate-pulse"
      />
    )
  }
  SpecialisedSkeleton.displayName = displayName
  return SpecialisedSkeleton
}

export const ResidentialPropertySkeleton = createPropertySkeleton('residential')
export const CommercialPropertySkeleton = createPropertySkeleton('commercial')
export const LandPropertySkeleton = createPropertySkeleton('land')

// ---------------------------------------------------------------------------
// PropertyDetailsSkeleton
// ---------------------------------------------------------------------------

export function PropertyDetailsSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title & meta */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-96 w-full" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <Card className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const PropertySkeletonGrid = UnifiedPropertySkeletonGrid
/** @deprecated Use PropertySkeletonGrid */
export const PropertySkeleton = UnifiedPropertySkeletonGrid

export default PropertySkeletonGrid