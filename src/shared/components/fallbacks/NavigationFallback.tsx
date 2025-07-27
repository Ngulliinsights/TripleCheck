import React from 'react';
import { Home, Search, Menu } from 'lucide-react';

/**
 * Simple fallback navigation component for when the main navigation crashes
 * This provides basic navigation functionality without complex features that might cause crashes
 */
export function NavigationFallback() {
  const handleNavigation = (href: string) => {
    try {
      window.location.href = href;
    } catch (error) {
      console.error('Fallback navigation failed:', error);
      // Ultimate fallback - reload to home
      window.location.href = '/';
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Simple logo/brand */}
        <button
          onClick={() => handleNavigation('/')}
          className="flex items-center gap-2 text-xl font-bold text-primary hover:text-primary-hover"
        >
          <Home className="w-6 h-6" />
          TripleCheck
        </button>

        {/* Basic navigation links */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => handleNavigation('/properties')}
            className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
          >
            Properties
          </button>
          <button
            onClick={() => handleNavigation('/services')}
            className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
          >
            Services
          </button>
          <button
            onClick={() => handleNavigation('/help')}
            className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
          >
            Help
          </button>
        </div>

        {/* Simple search */}
        <div className="hidden lg:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search properties..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const query = (e.target as HTMLInputElement).value;
                  if (query.trim()) {
                    handleNavigation(`/search?q=${encodeURIComponent(query.trim())}`);
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100"
          onClick={() => {
            // Simple mobile menu toggle
            const mobileMenu = document.getElementById('mobile-menu-fallback');
            if (mobileMenu) {
              mobileMenu.classList.toggle('hidden');
            }
          }}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Simple mobile menu */}
      <div id="mobile-menu-fallback" className="hidden md:hidden mt-4 pb-4 border-t border-gray-200">
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={() => handleNavigation('/properties')}
            className="text-left text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
          >
            Properties
          </button>
          <button
            onClick={() => handleNavigation('/services')}
            className="text-left text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
          >
            Services
          </button>
          <button
            onClick={() => handleNavigation('/help')}
            className="text-left text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
          >
            Help
          </button>
        </div>
      </div>
    </nav>
  );
}