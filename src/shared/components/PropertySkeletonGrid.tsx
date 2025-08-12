import React from 'react';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface PropertySkeletonGridProps {
  count?: number;
  viewMode?: 'grid' | 'list';
  itemHeight?: number;
}

export const PropertySkeletonGrid: React.FC<PropertySkeletonGridProps> = ({
  count = 12,
  viewMode = 'grid',
  itemHeight = 340,
}) => {
  return (
    <div className={`property-grid-container ${viewMode === 'grid' ? 'property-grid-virtualized' : 'property-list-virtualized'}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className={`property-card ${viewMode === 'grid' ? 'property-card--grid-mode' : 'property-card--list-mode'}`}>
          <div className="property-card-image-container">
            <Skeleton className="property-card-image" />
          </div>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PropertySkeletonGrid;