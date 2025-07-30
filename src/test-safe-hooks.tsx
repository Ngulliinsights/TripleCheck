import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSafeQuery } from './shared/hooks/useSafeQuery';

// Create a simple query client for testing
const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple test component using safe hooks
function TestSafeHooksComponent() {
  console.log('TestSafeHooksComponent rendering...');

  // Test basic safe query
  const { data, isLoading, error, hasValidData } = useSafeQuery({
    endpoint: '/api/test',
    method: 'GET',
    fallbackData: { message: 'Fallback data working!' },
    validator: (data: any) => {
      console.log('Validator called with:', data);
      return data || null;
    },
    enabled: true,
    context: 'test',
  });

  console.log('Hook results:', { data, isLoading, error, hasValidData });

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>Safe Hooks Test</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Hook Status:</h2>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Has Valid Data: {hasValidData ? 'Yes' : 'No'}</p>
        <p>Error: {error ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Data:</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px', color: 'blue' }}>
        <p>If you can see this, the safe hooks are working and not preventing component rendering!</p>
      </div>
    </div>
  );
}

// Wrapper with QueryClient provider
export function TestSafeHooksApp() {
  console.log('TestSafeHooksApp rendering...');
  
  return (
    <QueryClientProvider client={testQueryClient}>
      <TestSafeHooksComponent />
    </QueryClientProvider>
  );
}

export default TestSafeHooksApp;