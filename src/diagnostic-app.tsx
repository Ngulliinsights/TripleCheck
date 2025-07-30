import React from 'react';

// Minimal diagnostic component to test basic rendering
export function DiagnosticApp() {
  console.log('DiagnosticApp rendering...');
  
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('DiagnosticApp mounted successfully');
  }, []);
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f8ff',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: 'green' }}>🔧 TripleCheck Diagnostic</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Basic React Test:</h2>
        <p>Counter: {count}</p>
        <button 
          onClick={() => setCount(c => c + 1)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Increment
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Environment Info:</h2>
        <ul>
          <li>React Version: {React.version}</li>
          <li>Environment: {import.meta.env.MODE}</li>
          <li>Base URL: {import.meta.env.BASE_URL}</li>
          <li>Timestamp: {new Date().toISOString()}</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Component Status:</h2>
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          color: '#155724'
        }}>
          ✅ Basic React rendering is working!
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Next Steps:</h2>
        <ol>
          <li>Check browser console for any errors</li>
          <li>Verify that all imports are resolving correctly</li>
          <li>Test individual components in isolation</li>
          <li>Check if the issue is with specific hooks or components</li>
        </ol>
      </div>
    </div>
  );
}

export default DiagnosticApp;