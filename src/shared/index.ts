// Shared Exports
export * from './types';
export * from './utils/error-handling';

// UI Components
export * from './components/ui/button';
export * from './components/ui/card';
export * from './components/ui/input';
export * from './components/ui/badge';
export * from './components/ui/avatar';
export * from './components/ui/dialog';
export * from './components/ui/alert';
export * from './components/ui/skeleton';
export * from './components/ui/separator';
export * from './components/ui/label';
export { LoadingSkeleton } from './components/ui/loading-skeleton';
export * from './components/ui/loading-states';
export { OptimizedImage } from './components/ui/optimized-image';
export { Logo } from './components/ui/logo';

// Navigation Components
export { MobileNav } from './components/navigation/MobileNav';
export { EnhancedNavigation } from './components/navigation/EnhancedNavigation';

// Other Shared Components
export { NewsBlog } from './components/NewsBlog';
export { EnhancedTestimonials as Testimonials } from './components/Testimonials';
export { ServiceCategories } from './components/ServiceCategories';
export { TrustIndicators } from './components/TrustIndicators';
export { DemoLoginHelper } from './components/DemoLoginHelper';
export { QueryErrorBoundary } from './components/QueryErrorBoundary';


// Shared Pages
export { default as Home } from './pages/Home';
export { default as Features } from './pages/Features';
export { default as Pricing } from './pages/Pricing';
export { default as Resources } from './pages/Resources';
export { default as OurStory } from './pages/OurStory';
export { default as Partners } from './pages/Partners';
export { default as PressMedia } from './pages/PressMedia';
export { default as Blog } from './pages/Blog';
export { default as NotFound } from './pages/NotFound';