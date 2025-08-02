
import { lazy, Suspense } from 'react';
import { Skeleton } from '../ui/skeleton';

// Lazy load heavy components
export const LazyFindProfessionals = lazy(() => import('../pages/FindProfessionals'));
export const LazyPropertyWizard = lazy(() => import('../../property/pages/PropertyWizard'));
export const LazyPropertyDetails = lazy(() => import('../../property/pages/PropertyDetails'));
export const LazyTrustDashboard = lazy(() => import('../../trust/pages/TrustDashboard'));

// Loading fallback component
export function ComponentSkeleton({ height = "400px" }: { height?: string }) {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className={`h-[${height}] w-full`} />
    </div>
  );
}

// Wrapper with suspense
export function withLazyLoading<T extends object>(
  Component: React.LazyExoticComponent<React.ComponentType<T>>,
  fallback?: React.ReactNode
) {
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback || <ComponentSkeleton />}>
        <Component {...props} />
      </Suspense>
    );
  };
}
