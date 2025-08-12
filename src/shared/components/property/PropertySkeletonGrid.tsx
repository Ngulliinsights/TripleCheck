import React from 'react';

import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

interface PropertySkeletonGridProps {
  count: number;
  viewMode: 'grid' | 'list';
  itemHeight?: number;
  className?: string;
}

/**
 * Unified skeleton loading component for property listings
 * Provides consistent loading states across all property types
 */
export function PropertySkeletonGrid({
  count,
  viewMode,
  itemHeight = 320,
  className = '',
}: PropertySkeletonGridProps): React.ReactElement {

  // Generate skeleton items
  const skeletonItems = Array.from({ length: count }, (_, index) => (
    <PropertySkeletonItem
      key={index}
      viewMode={viewMode}
      itemHeight={itemHeight}
    />
  ));

  return (
    <div className={className}>
      {/* View Mode Toggle Skeleton */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Grid/List Skeleton */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
      }>
        {skeletonItems}
      </div>
    </div>
  );
}

/**
 * Individual property skeleton item
 */
function PropertySkeletonItem({
  viewMode,
  itemHeight,
}: {
  viewMode: 'grid' | 'list';
  itemHeight: number;
}): React.ReactElement {

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden">
        <div className="flex">
          {/* Image skeleton */}
          <div className="flex-shrink-0">
            <Skeleton className="w-48 h-32" />
          </div>
          
          {/* Content skeleton */}
          <CardContent className="flex-1 p-4">
            <div className="space-y-3">
              {/* Title and price */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
              
              {/* Features */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Grid view skeleton
  return (
    <Card className="overflow-hidden" style={{ height: itemHeight }}>
      <div className="relative">
        {/* Image skeleton */}
        <Skeleton className="w-full h-48" />
        
        {/* Verification badge skeleton */}
        <div className="absolute top-2 right-2">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        {/* Price badge skeleton */}
        <div className="absolute bottom-2 left-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title */}
          <Skeleton className="h-5 w-full" />
          
          {/* Location */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          
          {/* Features */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Specialized skeleton for different property types
 */
export function ResidentialPropertySkeleton({ count = 12 }: { count?: number }) {
  return (
    <PropertySkeletonGrid
      count={count}
      viewMode="grid"
      itemHeight={340}
      className="animate-pulse"
    />
  );
}

export function CommercialPropertySkeleton({ count = 12 }: { count?: number }) {
  return (
    <PropertySkeletonGrid
      count={count}
      viewMode="grid"
      itemHeight={360}
      className="animate-pulse"
    />
  );
}

export function LandPropertySkeleton({ count = 12 }: { count?: number }) {
  return (
    <PropertySkeletonGrid
      count={count}
      viewMode="grid"
      itemHeight={320}
      className="animate-pulse"
    />
  );
}

/**
 * Skeleton for property details page
 */
export function PropertyDetailsSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      
      {/* Image gallery skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-96 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
      
      {/* Content skeleton */}
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
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Export with display name for debugging
PropertySkeletonGrid.displayName = 'PropertySkeletonGrid';

export default PropertySkeletonGrid;