import React from "react";

import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface PropertySkeletonGridProps {
  readonly count: number;
  readonly viewMode: "grid" | "list";
  readonly itemHeight?: number;
  readonly className?: string;
}

/**
 * Individual property skeleton item component
 * This handles both grid and list view modes with optimized rendering
 */
interface PropertySkeletonItemProps {
  readonly viewMode: "grid" | "list";
  readonly itemHeight: number;
}

function PropertySkeletonItem({
  viewMode,
  itemHeight,
}: PropertySkeletonItemProps): React.ReactElement {
  // List view provides a horizontal layout with image on the left
  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden">
        <div className="flex">
          {/* Left side: Image skeleton with fixed width for consistent alignment */}
          <div className="flex-shrink-0">
            <Skeleton className="w-48 h-32" />
          </div>

          {/* Right side: Content that expands to fill available space */}
          <CardContent className="flex-1 p-4">
            <div className="space-y-3">
              {/* Header: Title and price in a flex layout */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" /> {/* Property title */}
                  <Skeleton className="h-4 w-32" /> {/* Location */}
                </div>
                <Skeleton className="h-6 w-24" /> {/* Price */}
              </div>

              {/* Property features (bedrooms, bathrooms, area) */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>

              {/* Description lines with realistic text width variation */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" /> {/* Icon button */}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Grid view provides a vertical card layout
  return (
    <Card className="overflow-hidden" style={{ height: itemHeight }}>
      {/* Image section with overlay elements */}
      <div className="relative">
        <Skeleton className="w-full h-48" />

        {/* Top-right: Verification badge */}
        <div className="absolute top-2 right-2">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Bottom-left: Price badge */}
        <div className="absolute bottom-2 left-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* Card content section */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Property title */}
          <Skeleton className="h-5 w-full" />

          {/* Location with icon placeholder */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" /> {/* Location icon */}
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Property features with icon placeholders */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" /> {/* Bed icon */}
              <Skeleton className="h-4 w-8" /> {/* Count */}
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" /> {/* Bath icon */}
              <Skeleton className="h-4 w-8" /> {/* Count */}
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" /> {/* Area icon */}
              <Skeleton className="h-4 w-8" /> {/* Size */}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-8 flex-1" /> {/* Primary action */}
            <Skeleton className="h-8 w-8" /> {/* Secondary action */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main unified skeleton loading component for property listings
 * Provides consistent loading states across all property types with responsive design
 */
function UnifiedPropertySkeletonGrid({
  count,
  viewMode,
  itemHeight = 320,
  className = "",
}: PropertySkeletonGridProps): React.ReactElement {
  // Generate skeleton items efficiently using Array.from for better performance
  const skeletonItems = Array.from({ length: count }, (_, index) => (
    <PropertySkeletonItem
      key={`skeleton-${index}`} // More descriptive keys for debugging
      viewMode={viewMode}
      itemHeight={itemHeight}
    />
  ));

  return (
    <div className={className}>
      {/* View mode controls skeleton - mimics the actual toggle interface */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-32" /> {/* Results count */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16" /> {/* Grid button */}
          <Skeleton className="h-8 w-16" /> {/* List button */}
        </div>
      </div>

      {/* Main content grid - responsive layout that matches actual property grid */}
      <div
        className={
          viewMode === "grid" ?
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4" // List view uses vertical stacking
        }
      >
        {skeletonItems}
      </div>
    </div>
  );
}

/**
 * Specialized skeleton components for different property types
 * These provide type-specific optimizations and heights
 */
export function ResidentialPropertySkeleton({
  count = 12,
  viewMode = "grid" as const,
}: {
  readonly count?: number;
  readonly viewMode?: "grid" | "list";
}): React.ReactElement {
  return (
    <UnifiedPropertySkeletonGrid
      count={count}
      viewMode={viewMode}
      itemHeight={340} // Slightly taller for residential details
      className="animate-pulse"
    />
  );
}

export function CommercialPropertySkeleton({
  count = 12,
  viewMode = "grid" as const,
}: {
  readonly count?: number;
  readonly viewMode?: "grid" | "list";
}): React.ReactElement {
  return (
    <UnifiedPropertySkeletonGrid
      count={count}
      viewMode={viewMode}
      itemHeight={360} // Tallest for commercial property details
      className="animate-pulse"
    />
  );
}

export function LandPropertySkeleton({
  count = 12,
  viewMode = "grid" as const,
}: {
  readonly count?: number;
  readonly viewMode?: "grid" | "list";
}): React.ReactElement {
  return (
    <UnifiedPropertySkeletonGrid
      count={count}
      viewMode={viewMode}
      itemHeight={320} // Standard height for land listings
      className="animate-pulse"
    />
  );
}

/**
 * Comprehensive skeleton for property details page
 * Mimics the full property detail page layout structure
 */
export function PropertyDetailsSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header with breadcrumb and title */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" /> {/* Property title */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-32" /> {/* Location */}
          <Skeleton className="h-5 w-24" /> {/* Property type */}
          <Skeleton className="h-5 w-20" /> {/* Status */}
        </div>
      </div>

      {/* Image gallery section with main image and thumbnails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-96 w-full" /> {/* Main image */}
        <div className="grid grid-cols-2 gap-2">
          {/* Thumbnail grid */}
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={`thumb-${i}`} className="h-48 w-full" />
          ))}
        </div>
      </div>

      {/* Main content area with sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Property details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description section */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" /> {/* Section title */}
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Features and amenities grid */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" /> {/* Section title */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={`feature-${i}`} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" /> {/* Feature icon */}
                  <Skeleton className="h-4 w-20" /> {/* Feature name */}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar: Contact and actions */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" /> {/* Price */}
              <Skeleton className="h-10 w-full" /> {/* Contact button */}
              <Skeleton className="h-10 w-full" /> {/* Schedule viewing */}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Export the main component with a clear name to avoid conflicts
export const PropertySkeletonGrid = UnifiedPropertySkeletonGrid;

// Export PropertySkeleton as an alias for backward compatibility
export const PropertySkeleton = UnifiedPropertySkeletonGrid;

// Add display name for debugging (using Object.defineProperty to satisfy TypeScript)
Object.defineProperty(UnifiedPropertySkeletonGrid, "displayName", {
  value: "PropertySkeletonGrid",
  writable: false,
  enumerable: false,
  configurable: true,
});

// Default export for convenience
export default PropertySkeletonGrid;
