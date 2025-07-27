import React from 'react';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { NavigationErrorBoundary } from '../navigation/NavigationErrorBoundary';
import { ErrorBoundary } from '../../../app/error-boundary';
import { NavigationFallback } from '../fallbacks/NavigationFallback';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <ErrorBoundary level="component" fallback={<NavigationFallback />}>
        <NavigationErrorBoundary>
          <Navigation />
        </NavigationErrorBoundary>
      </ErrorBoundary>
      
      <ErrorBoundary level="component">
        <main className="flex-1">
          {children}
        </main>
      </ErrorBoundary>
      
      <ErrorBoundary level="component">
        <Footer />
      </ErrorBoundary>
    </div>
  );
}