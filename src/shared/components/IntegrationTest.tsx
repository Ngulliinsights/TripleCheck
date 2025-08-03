/**
 * Integration Test Component
 * Tests the complete integration between frontend, backend, and database
 */

import React, { useState } from 'react';
import { apiClient } from '../services/api-client';

interface IntegrationTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

export const IntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<IntegrationTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runIntegrationTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Database Integration Test',
        endpoint: '/api/test/integration'
      },
      {
        name: 'Properties API Test',
        endpoint: '/api/test/properties'
      },
      {
        name: 'Single Property Test',
        endpoint: '/api/test/properties/1'
      },
      {
        name: 'Properties List (Real API)',
        endpoint: '/api/properties'
      }
    ];
    
    const results: IntegrationTestResult[] = [];
    
    for (const test of tests) {
      try {
        console.log(`Running test: ${test.name}`);
        const response = await apiClient.get(test.endpoint);
        
        results.push({
          success: response.success || false,
          message: `${test.name}: ${response.success ? 'PASSED' : 'FAILED'}`,
          data: response.data,
          error: response.error,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          success: false,
          message: `${test.name}: ERROR`,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Frontend-Backend-Database Integration Test
        </h2>
        
        <div className="mb-6">
          <button
            onClick={runIntegrationTests}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium ${
              isRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
          </button>
        </div>
        
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Test Results:</h3>
            
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  result.success
                    ? 'bg-green-50 border-green-400'
                    : 'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {result.error && (
                  <div className="text-red-600 text-sm mb-2">
                    Error: {result.error}
                  </div>
                )}
                
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      View Response Data
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Test Summary:</h4>
              <div className="text-sm text-blue-700">
                <div>Total Tests: {testResults.length}</div>
                <div>Passed: {testResults.filter(r => r.success).length}</div>
                <div>Failed: {testResults.filter(r => !r.success).length}</div>
                <div>Success Rate: {Math.round((testResults.filter(r => r.success).length / testResults.length) * 100)}%</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">What This Tests:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Database connection and basic queries</li>
            <li>• Backend API endpoints and response formatting</li>
            <li>• Frontend API client and request handling</li>
            <li>• Data serialization between layers</li>
            <li>• Error handling across the stack</li>
          </ul>
        </div>
      </div>
    </div>
  );
};