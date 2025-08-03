/**
 * Simple test to verify the property hook is working after fixes
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProperties } from './src/property/hooks/useProperty';

const queryClient = new QueryClient();

function TestComponent() {
  const { data, isLoading, error } = useProperties({ limit: 5 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Property Hook Test</h2>
      <p>Properties loaded: {data?.data?.length || 0}</p>
      <p>Total: {data?.total || 0}</p>
      <p>Has next: {data?.hasNext ? 'Yes' : 'No'}</p>
      
      {data?.data?.map((property) => (
        <div key={property.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <h3>{property.title}</h3>
          <p>Price: {property.price}</p>
          <p>Location: {property.location}</p>
        </div>
      ))}
    </div>
  );
}

export function PropertyHookTest() {
  return (
    <QueryClientProvider client={queryClient}>
      <TestComponent />
    </QueryClientProvider>
  );
}