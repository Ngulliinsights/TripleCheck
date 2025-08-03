import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./app/App";
import { AppProviders } from "./app/providers";
import "./shared/styles/globals.css";

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

try {
  ReactDOM.createRoot(rootElement).render(
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
} catch (error) {
  // eslint-disable-next-line no-console
  console.error("Failed to render TripleCheck app:", error);
  // Fallback error display
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h2>TripleCheck Failed to Load</h2>
      <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p>Check console for details</p>
      <p>Stack: ${error instanceof Error ? error.stack : 'No stack trace'}</p>
    </div>
  `;
}
