import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import App from "./app/App"
import { AppProviders } from "./app/providers"
// TODO: Locate and import globals CSS after directory restructuring
// import "./shared/styles/globals.css";


// Initialize MSW for development (non-blocking)
if (import.meta.env.DEV) {
  // Missing module: ./shared/test-utils/msw-browser
  // import('./shared/test-utils/msw-browser').then(({ startMswWorker }) => {
  //   startMswWorker().catch((error: unknown) => {
  //     console.warn('MSW worker failed to start:', error);
  //   });
  // }).catch((error: unknown) => {
  //   console.warn('Failed to load MSW:', error);
  // });
}

// Development logging
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log("Starting TripleCheck application...");
  // eslint-disable-next-line no-console
  console.log("Environment:", import.meta.env.MODE);
  // eslint-disable-next-line no-console
  console.log("Base URL:", import.meta.env.BASE_URL);
}

// Create query client for the full app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Add error boundary for production debugging
const rootElement = document.getElementById("root");
if (!rootElement) {
  // eslint-disable-next-line no-console
  console.error("Root element not found!");
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h2>Critical Error: Root element not found</h2>
      <p>The application failed to find the root element.</p>
    </div>
  `;
  throw new Error("Root element not found");
}

// Using full TripleCheck app with proper React Router bundling
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log("Loading full TripleCheck application for competition...");
}

// Initialize theme preference (let ThemeProvider handle the actual theme application)
if (typeof window !== 'undefined') {
  // Clear any conflicting theme state and let ThemeProvider handle initialization
  // The ThemeProvider default is already set to 'dark' in ThemeContext.tsx
}

// Simple React availability check
if (!React || !ReactDOM) {
  console.error("React or ReactDOM not loaded");
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h2>Application Loading Error</h2>
      <p>Failed to load React libraries. Please refresh the page.</p>
    </div>
  `;
  throw new Error("React or ReactDOM not available");
}



// Render with better error handling for production builds
const renderApp = () => {
  try {
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppProviders>
              <App />
            </AppProviders>
          </BrowserRouter>
        </QueryClientProvider>
      </React.StrictMode>
    );
    
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("Full TripleCheck app rendered successfully");
    }
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Failed to render TripleCheck app:", error);
    
    // More robust fallback error display
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'padding: 20px; color: red; font-family: monospace; background: white; margin: 20px; border: 1px solid red;';
    errorDiv.innerHTML = `
      <h2>TripleCheck Failed to Load</h2>
      <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p><strong>Environment:</strong> ${import.meta.env.MODE}</p>
      <p><strong>Suggestion:</strong> Try refreshing the page or clearing your browser cache</p>
      <details>
        <summary>Technical Details</summary>
        <pre>${error instanceof Error ? error.stack : 'No stack trace available'}</pre>
      </details>
    `;
    
    rootElement.appendChild(errorDiv);
    
    // Also try to render a minimal fallback
    setTimeout(() => {
      try {
        const fallbackRoot = ReactDOM.createRoot(rootElement);
        fallbackRoot.render(
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Loading...</h1>
            <p>If this message persists, please refresh the page.</p>
          </div>
        );
      } catch (fallbackError) {
        // eslint-disable-next-line no-console
        console.error("Even fallback render failed:", fallbackError);
      }
    }, 1000);
  }
};

renderApp();
