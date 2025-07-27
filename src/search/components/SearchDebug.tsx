import React, { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';

export function SearchDebug() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSearch = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('Testing search with term:', searchTerm);
      
      // Test 1: Basic API call
      const url = searchTerm 
        ? `/api/properties?q=${encodeURIComponent(searchTerm)}`
        : '/api/properties';
      
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Raw API response:', data);
      
      setResults(data);
    } catch (err) {
      console.error('Search test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testBasicAPI = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('Testing basic API endpoint...');
      const response = await fetch('/api/properties');
      console.log('Basic API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Basic API response:', data);
      setResults(data);
    } catch (err) {
      console.error('Basic API test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Search Functionality Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter search term..."
            className="flex-1"
          />
          <Button onClick={testSearch} disabled={loading}>
            {loading ? 'Testing...' : 'Test Search'}
          </Button>
        </div>
        
        <Button onClick={testBasicAPI} disabled={loading} variant="outline" className="w-full">
          Test Basic API (No Search)
        </Button>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Testing API...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800">Error:</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">Results:</h3>
            <div className="bg-white rounded border p-3 max-h-96 overflow-auto">
              <pre className="text-xs">{JSON.stringify(results, null, 2)}</pre>
            </div>
            {results.data?.properties && (
              <p className="mt-2 text-sm text-green-600">
                Found {results.data.properties.length} properties
              </p>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p><strong>Debug Info:</strong></p>
          <p>Current URL: {window.location.href}</p>
          <p>Search Term: "{searchTerm}"</p>
          <p>Check browser console for detailed logs</p>
        </div>
      </CardContent>
    </Card>
  );
}