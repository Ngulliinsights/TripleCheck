import React, { useState, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'

interface DebugLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

const NavigationDebug: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [testStep, setTestStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (level: DebugLog['level'], message: string, data?: any) => {
    setLogs(prev => [...prev, {
      timestamp: new Date(),
      level,
      message,
      data
    }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const runNavigationTest = async () => {
    setIsRunning(true);
    clearLogs();
    addLog('info', 'Starting navigation debug test...');

    try {
      // Step 1: Test basic imports
      setTestStep(1);
      addLog('info', 'Step 1: Testing basic imports...');
      
      try {
        const utils = await import('@shared/lib/utils');
        addLog('info', 'Utils imported successfully', { cn: typeof utils.cn });
      } catch (error) {
        addLog('error', 'Utils import failed', error);
      }

      try {
        const lucideReact = await import('lucide-react');
        addLog('info', 'Lucide React imported successfully', { Menu: typeof lucideReact.Menu });
      } catch (error) {
        addLog('error', 'Lucide React import failed', error);
      }

      // Step 2: Test UI components
      setTestStep(2);
      addLog('info', 'Step 2: Testing UI components...');
      
      try {
        const button = await import('@shared/components/ui/button');
        addLog('info', 'Button component imported successfully');
      } catch (error) {
        addLog('error', 'Button component import failed', error);
      }

      try {
        const input = await import('@shared/components/ui/input');
        addLog('info', 'Input component imported successfully');
      } catch (error) {
        addLog('error', 'Input component import failed', error);
      }

      // Step 3: Test Logo and Wordmark
      setTestStep(3);
      addLog('info', 'Step 3: Testing Logo and Wordmark components...');
      
      try {
        const logo = await import('@shared/components/ui/logo');
        addLog('info', 'Logo component imported successfully');
      } catch (error) {
        addLog('error', 'Logo component import failed', error);
      }

      try {
        const wordmark = await import('@shared/components/ui/wordmark');
        addLog('info', 'Wordmark component imported successfully');
      } catch (error) {
        addLog('error', 'Wordmark component import failed', error);
      }

      // Step 4: Test hooks
      setTestStep(4);
      addLog('info', 'Step 4: Testing hooks...');
      
      try {
        const accessibility = await import('@shared/hooks/useAccessibility');
        addLog('info', 'useAccessibility hook imported successfully');
      } catch (error) {
        addLog('error', 'useAccessibility hook import failed', error);
      }

      // Step 5: Test MobileNav
      setTestStep(5);
      addLog('info', 'Step 5: Testing MobileNav component...');
      
      try {
        const mobileNav = await import('./MobileNav');
        addLog('info', 'MobileNav component imported successfully');
      } catch (error) {
        addLog('error', 'MobileNav component import failed', error);
      }

      // Step 6: Test Navigation
      setTestStep(6);
      addLog('info', 'Step 6: Testing Navigation component...');
      
      try {
        const navigation = await import('../layout/Navigation');
        addLog('info', 'Navigation component imported successfully');
      } catch (error) {
        addLog('error', 'Navigation component import failed', error);
      }

      addLog('info', 'Navigation debug test completed successfully!');
      
    } catch (error) {
      addLog('error', 'Navigation debug test failed', error);
    } finally {
      setIsRunning(false);
      setTestStep(0);
    }
  };

  const TestComponent = ({ step }: { step: number }) => {
    try {
      switch (step) {
        case 1:
          return <div className="p-4 bg-blue-100 rounded">Testing basic imports...</div>;
        case 2:
          return <div className="p-4 bg-green-100 rounded">Testing UI components...</div>;
        case 3:
          return <div className="p-4 bg-yellow-100 rounded">Testing Logo and Wordmark...</div>;
        case 4:
          return <div className="p-4 bg-purple-100 rounded">Testing hooks...</div>;
        case 5:
          return <div className="p-4 bg-pink-100 rounded">Testing MobileNav...</div>;
        case 6:
          return <div className="p-4 bg-red-100 rounded">Testing Navigation...</div>;
        default:
          return <div className="p-4 bg-gray-100 rounded">Ready to test</div>;
      }
    } catch (error) {
      return <div className="p-4 bg-red-200 rounded">Error in test component: {String(error)}</div>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Navigation Debug Tool</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={runNavigationTest}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isRunning ? 'Running Test...' : 'Run Navigation Test'}
            </button>
            
            <button
              onClick={clearLogs}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>

          <TestComponent step={testStep} />
        </div>

        {/* Logs */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Debug Logs ({logs.length})</h2>
          
          <div className="h-96 overflow-y-auto border border-gray-300 rounded p-4 bg-gray-50">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Run a test to see debug information.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      log.level === 'error' ? 'bg-red-100 text-red-800' :
                      log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{log.message}</span>
                      <span className="text-xs opacity-75">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {log.data && (
                      <pre className="mt-1 text-xs opacity-75 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Area */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Test Area</h2>
        <div className="border border-gray-300 rounded p-4 min-h-32">
          <p className="text-gray-600 mb-4">
            This area can be used to test navigation components in isolation.
          </p>
          
          <BrowserRouter>
            <div className="space-y-4">
              <div className="p-4 border rounded">
                <h3 className="font-medium mb-2">Safe Navigation Test</h3>
                <nav className="flex space-x-4">
                  <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                    Home
                  </button>
                  <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                    Properties
                  </button>
                  <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                    Services
                  </button>
                </nav>
              </div>
            </div>
          </BrowserRouter>
        </div>
      </div>
    </div>
  );
};

export default NavigationDebug;