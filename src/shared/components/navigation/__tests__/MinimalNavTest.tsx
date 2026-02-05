import React from 'react'
import { BrowserRouter } from 'react-router-dom'

// Create a minimal version of Navigation to test
const MinimalNavigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div data-testid="logo-placeholder">Logo</div>
            <div data-testid="wordmark-placeholder">TripleCheck</div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-8">
            <button type="button" className="px-3 py-2 text-gray-700">Home</button>
            <button type="button" className="px-3 py-2 text-gray-700">Properties</button>
            <button type="button" className="px-3 py-2 text-gray-700">Services</button>
            <button type="button" className="px-3 py-2 text-gray-700">Pricing</button>
            <button type="button" className="px-3 py-2 text-gray-700">Help</button>
          </div>
          
          <div className="lg:hidden">
            <button type="button" className="p-2 text-gray-700">
              Menu
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Create a minimal version of MobileNav to test
const MinimalMobileNav = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 text-gray-700"
      >
        Menu
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70">
          <div className="fixed top-0 left-0 h-full w-80 bg-white">
            <div className="p-4">
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="mb-4 p-2"
              >
                Close
              </button>
              
              <nav>
                <button type="button" className="block w-full text-left p-2">Home</button>
                <button type="button" className="block w-full text-left p-2">Properties</button>
                <button type="button" className="block w-full text-left p-2">Services</button>
                <button type="button" className="block w-full text-left p-2">Pricing</button>
                <button type="button" className="block w-full text-left p-2">Help</button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Test component that gradually adds complexity
const NavigationTest = () => {
  const [testLevel, setTestLevel] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  
  const runTest = (level: number) => {
    try {
      setError(null);
      setTestLevel(level);
      console.log(`Running test level ${level}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error(`Test level ${level} failed:`, err);
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Navigation Test</h1>
      
      <div className="mb-4 space-x-2">
        <button 
          onClick={() => runTest(0)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Test Level 0: Minimal
        </button>
        <button 
          onClick={() => runTest(1)}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Test Level 1: With Router
        </button>
        <button 
          onClick={() => runTest(2)}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Test Level 2: Real Components
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="border p-4 rounded">
        {testLevel === 0 && (
          <div>
            <h2>Level 0: Basic HTML Navigation</h2>
            <MinimalNavigation />
            <div style={{ marginTop: '80px' }}>
              <MinimalMobileNav />
            </div>
          </div>
        )}
        
        {testLevel === 1 && (
          <div>
            <h2>Level 1: With React Router</h2>
            <BrowserRouter>
              <MinimalNavigation />
              <div style={{ marginTop: '80px' }}>
                <MinimalMobileNav />
              </div>
            </BrowserRouter>
          </div>
        )}
        
        {testLevel === 2 && (
          <div>
            <h2>Level 2: Real Components</h2>
            <BrowserRouter>
              {/* This is where we'd test the real components */}
              <div>Real components would go here</div>
            </BrowserRouter>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavigationTest;