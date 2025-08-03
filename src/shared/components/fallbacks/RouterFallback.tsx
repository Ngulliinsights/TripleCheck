import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import React from 'react';

/**
 * Simple fallback router component for when the main router crashes
 * This provides basic routing functionality without complex features
 */
export function RouterFallback() {
  const currentPath = window.location.pathname;
  
  const handleNavigation = (href: string) => {
    try {
      window.location.href = href;
    } catch (error) {
      console.error('Router fallback navigation failed:', error);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => handleNavigation('/')}
            className="flex items-center gap-2 text-xl font-bold text-primary"
          >
            <Home className="w-6 h-6" />
            TripleCheck
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
          >
            <RefreshCw className="w-4 h-4" />
            Reload
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Navigation System Error
            </h1>
            <p className="text-gray-600">
              The main navigation system encountered an error. You can still access the site using the options below.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleNavigation('/')}
              className="w-full px-4 py-3 bg-primary text-white rounded-md hover:bg-primary-hover font-medium"
            >
              Go to Homepage
            </button>
            
            <button
              onClick={() => handleNavigation('/properties')}
              className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
            >
              Browse Properties
            </button>
            
            <button
              onClick={() => handleNavigation('/services')}
              className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
            >
              View Services
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>Current page: {currentPath}</p>
            <p>If this problem persists, please contact support.</p>
          </div>
        </div>
      </main>
    </div>
  );
}