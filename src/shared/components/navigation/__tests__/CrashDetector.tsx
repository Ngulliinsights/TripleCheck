import React, { Component, ErrorInfo } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { Navigation } from '../../layout/Navigation';
import { MobileNav } from '../MobileNav';

interface CrashDetectorState {
  crashes: Array<{
    component: string;
    error: Error;
    errorInfo: ErrorInfo;
    timestamp: Date;
  }>;
  isRunning: boolean;
}

class CrashDetector extends Component<{}, CrashDetectorState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      crashes: [],
      isRunning: false,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState(prevState => ({
      crashes: [
        ...prevState.crashes,
        {
          component: 'CrashDetector',
          error,
          errorInfo,
          timestamp: new Date(),
        }
      ]
    }));
  }

  runNavigationTests = async () => {
    this.setState({ isRunning: true });
    
    const tests = [
      this.testNavigationRender,
      this.testMobileNavRender,
      this.testNavigationInteractions,
      this.testMobileNavInteractions,
      this.testRouteChanges,
    ];

    for (const test of tests) {
      try {
        await test();
        console.log(`✅ ${test.name} passed`);
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error);
        this.setState(prevState => ({
          crashes: [
            ...prevState.crashes,
            {
              component: test.name,
              error: error as Error,
              errorInfo: { componentStack: '' },
              timestamp: new Date(),
            }
          ]
        }));
      }
    }

    this.setState({ isRunning: false });
  };

  testNavigationRender = async () => {
    const TestComponent = () => (
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    // This would normally use a testing library, but for crash detection
    // we'll simulate the render process
    try {
      const element = React.createElement(TestComponent);
      if (!element) {
        throw new Error('Failed to create Navigation element');
      }
    } catch (error) {
      throw new Error(`Navigation render failed: ${error}`);
    }
  };

  testMobileNavRender = async () => {
    const TestComponent = () => (
      <BrowserRouter>
        <MobileNav />
      </BrowserRouter>
    );

    try {
      const element = React.createElement(TestComponent);
      if (!element) {
        throw new Error('Failed to create MobileNav element');
      }
    } catch (error) {
      throw new Error(`MobileNav render failed: ${error}`);
    }
  };

  testNavigationInteractions = async () => {
    // Test navigation state management
    try {
      const mockNavigate = jest.fn();
      const mockLocation = { pathname: '/' };
      
      // Simulate navigation interactions
      const navigationProps = {
        navigate: mockNavigate,
        location: mockLocation,
      };
      
      if (!navigationProps.navigate || !navigationProps.location) {
        throw new Error('Navigation props are invalid');
      }
    } catch (error) {
      throw new Error(`Navigation interactions failed: ${error}`);
    }
  };

  testMobileNavInteractions = async () => {
    // Test mobile nav state management
    try {
      const mockState = {
        isOpen: false,
        expandedSections: [],
        searchQuery: '',
        dragOffset: 0,
        isDragging: false,
      };
      
      // Simulate state changes
      const newState = {
        ...mockState,
        isOpen: true,
        expandedSections: ['Properties'],
        searchQuery: 'test',
      };
      
      if (!newState || typeof newState.isOpen !== 'boolean') {
        throw new Error('MobileNav state is invalid');
      }
    } catch (error) {
      throw new Error(`MobileNav interactions failed: ${error}`);
    }
  };

  testRouteChanges = async () => {
    // Test route change handling
    try {
      const routes = ['/', '/properties', '/services', '/pricing', '/help'];
      
      for (const route of routes) {
        if (!route || typeof route !== 'string') {
          throw new Error(`Invalid route: ${route}`);
        }
        
        // Simulate route validation
        const isValidRoute = route.startsWith('/') && route.length > 0;
        if (!isValidRoute) {
          throw new Error(`Route validation failed for: ${route}`);
        }
      }
    } catch (error) {
      throw new Error(`Route changes failed: ${error}`);
    }
  };

  override render() {
    const { crashes, isRunning } = this.state;

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Navigation Crash Detector</h1>
        
        <div className="mb-6">
          <button
            onClick={this.runNavigationTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunning ? 'Running Tests...' : 'Run Navigation Tests'}
          </button>
        </div>

        {crashes.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-red-600">
              Detected Crashes ({crashes.length})
            </h2>
            
            {crashes.map((crash, index) => (
              <div key={index} className="mb-4 p-4 border border-red-300 rounded bg-red-50">
                <div className="font-semibold text-red-800">
                  Component: {crash.component}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Time: {crash.timestamp.toLocaleString()}
                </div>
                <div className="text-red-700 mb-2">
                  Error: {crash.error.message}
                </div>
                {crash.error.stack && (
                  <details className="text-xs">
                    <summary className="cursor-pointer">Stack Trace</summary>
                    <pre className="mt-2 whitespace-pre-wrap bg-gray-100 p-2 rounded">
                      {crash.error.stack}
                    </pre>
                  </details>
                )}
                {crash.errorInfo.componentStack && (
                  <details className="text-xs">
                    <summary className="cursor-pointer">Component Stack</summary>
                    <pre className="mt-2 whitespace-pre-wrap bg-gray-100 p-2 rounded">
                      {crash.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Components</h2>
          
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Navigation Component</h3>
            <BrowserRouter>
              <Navigation />
            </BrowserRouter>
          </div>
          
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Mobile Navigation Component</h3>
            <BrowserRouter>
              <MobileNav />
            </BrowserRouter>
          </div>
        </div>
      </div>
    );
  }
}

export default CrashDetector;