import React from 'react';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { NavigationErrorBoundary } from '../navigation/NavigationErrorBoundary';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavigationErrorBoundary>
        <Navigation />
      </NavigationErrorBoundary>
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}