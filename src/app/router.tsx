import React from 'react';
import { Switch, Route } from 'wouter';
import { Suspense } from 'react';
import { LoadingSkeleton } from '../shared/components/ui/LoadingSkeleton';
import { AppLayout } from '../../client/src/app/applayout';
import {
  WorkingRoutes,
  preloadRoutes
} from './lazy-routes';

/**
 * Main routing component that handles all application routes
 * Uses React.Suspense for lazy-loaded components and proper error boundaries
 * Integrates with AppLayout for consistent navigation and structure
 * 
 * Updated to use wouter consistently and reference working client routes
 */
export function AppRouter() {
  return (
    <div className="min-h-screen bg-background">
      <AppLayout>
        <main>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSkeleton className="w-full max-w-4xl mx-auto p-6" />
            </div>
          }>
            <Switch>
              {/* Critical user paths - Home and marketing pages */}
              <Route path="/" component={WorkingRoutes.Home} />
              <Route path="/features" component={WorkingRoutes.Features} />
              <Route path="/pricing" component={WorkingRoutes.Pricing} />
              
              {/* Authentication routes */}
              <Route path="/auth/login" component={WorkingRoutes.Login} />
              <Route path="/auth/register" component={WorkingRoutes.Register} />
              
              {/* Property routes with parameter handling and preloading */}
              <Route path="/property/:id">
                {(params) => {
                  // Preload related property routes for better UX
                  preloadRoutes.property();
                  return <WorkingRoutes.PropertyDetails id={params.id} />;
                }}
              </Route>
              <Route path="/property/:id/edit">
                {(params) => <WorkingRoutes.PropertyEdit id={params.id} />}
              </Route>
              <Route path="/compare" component={WorkingRoutes.PropertyCompare} />
              
              {/* User management routes */}
              <Route path="/dashboard" component={WorkingRoutes.Dashboard} />
              <Route path="/team" component={WorkingRoutes.Team} />
              
              {/* Trust and verification services routes */}
              <Route path="/services/basic-checks" component={WorkingRoutes.BasicChecks} />
              <Route path="/services/fraud-detection" component={WorkingRoutes.FraudDetection} />
              <Route path="/services/document-auth" component={WorkingRoutes.DocumentAuth} />
              <Route path="/services/reports" component={WorkingRoutes.Reports} />
              <Route path="/services/alerts" component={WorkingRoutes.Alerts} />
              <Route path="/services/karma" component={WorkingRoutes.Karma} />
              <Route path="/services/reputation" component={WorkingRoutes.Reputation} />
              <Route path="/services/trust-points" component={WorkingRoutes.TrustPoints} />
              <Route path="/services/reviews" component={WorkingRoutes.Reviews} />
              <Route path="/services/list-property" component={WorkingRoutes.ListProperty} />
              <Route path="/services/resources" component={WorkingRoutes.Resources} />
              <Route path="/services/tenants" component={WorkingRoutes.Tenants} />
              
              {/* Search functionality routes */}
              <Route path="/search" component={WorkingRoutes.SearchResults} />
              
              {/* Communication and messaging routes */}
              <Route path="/inbox" component={WorkingRoutes.Inbox} />
              
              {/* Static content and informational routes */}
              <Route path="/static/our-story" component={WorkingRoutes.OurStory} />
              <Route path="/static/partners" component={WorkingRoutes.Partners} />
              <Route path="/static/press-media" component={WorkingRoutes.PressMedia} />
              <Route path="/static/features" component={WorkingRoutes.Features} />
              <Route path="/static/pricing" component={WorkingRoutes.Pricing} />
              <Route path="/static/team" component={WorkingRoutes.Team} />
              <Route path="/blog" component={WorkingRoutes.Blog} />
              <Route path="/blog/:id">
                {(params) => <WorkingRoutes.BlogPost id={params.id} />}
              </Route>
              
              {/* Catch all route for 404 handling */}
              <Route component={WorkingRoutes.NotFound} />
            </Switch>
          </Suspense>
        </main>
      </AppLayout>
    </div>
  );
}