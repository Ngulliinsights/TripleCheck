import React from 'react';
import { usePageSpacing } from '../hooks/useNavigationSpacing';

/**
 * Test page for verifying navigation scroll behavior and spacing
 * This page demonstrates proper navigation-aware spacing and scroll behavior
 */
export default function NavigationTest() {
  const { navHeight, isScrolled, pageStyle } = usePageSpacing();

  return (
    <div className="min-h-screen bg-background nav-aware-spacing">
      {/* Status indicator */}
      <div className="fixed top-20 right-4 z-40 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-lg">
        <div className="text-sm space-y-1">
          <div>Nav Height: <span className="font-mono">{navHeight}px</span></div>
          <div>Scrolled: <span className="font-mono">{isScrolled ? 'Yes' : 'No'}</span></div>
        </div>
      </div>

      {/* Test content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Navigation Scroll Test
        </h1>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <section>
            <h2 id="section-1" className="text-2xl font-semibold mb-4">
              Section 1: Navigation Behavior
            </h2>
            <p className="text-gray-600 mb-4">
              This page tests the navigation scroll behavior. The navigation should:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Start transparent when at the top</li>
              <li>Transition to opaque background when scrolled</li>
              <li>Change padding from py-4 to py-2 when scrolled</li>
              <li>Not overlap with page content</li>
            </ul>
          </section>

          <section>
            <h2 id="section-2" className="text-2xl font-semibold mb-4">
              Section 2: Scroll Margin Test
            </h2>
            <p className="text-gray-600 mb-4">
              Click the links below to test scroll behavior:
            </p>
            <div className="space-x-4">
              <a href="#section-1" className="text-blue-600 hover:underline">Go to Section 1</a>
              <a href="#section-3" className="text-blue-600 hover:underline">Go to Section 3</a>
              <a href="#section-4" className="text-blue-600 hover:underline">Go to Section 4</a>
            </div>
          </section>

          {/* Spacer content to enable scrolling */}
          {Array.from({ length: 10 }, (_, i) => (
            <section key={i}>
              <h3 className="text-xl font-medium mb-3">
                Test Section {i + 3}
              </h3>
              <p className="text-gray-600 mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
                quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p className="text-gray-600 mb-4">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
                eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, 
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </section>
          ))}

          <section>
            <h2 id="section-3" className="text-2xl font-semibold mb-4">
              Final Section
            </h2>
            <p className="text-gray-600 mb-4">
              This is the final section to test scroll behavior. The navigation should 
              maintain proper spacing and not overlap with content.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Navigation Test Complete
              </h3>
              <p className="text-blue-700">
                If you can see this content clearly without navigation overlap, 
                the navigation scroll behavior is working correctly!
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}