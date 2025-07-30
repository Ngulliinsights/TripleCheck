import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./app/App";
import "./shared/styles/globals.css";

console.log("Starting TripleCheck application...");
console.log("Environment:", import.meta.env.MODE);
console.log("Base URL:", import.meta.env.BASE_URL);

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
console.log("Loading full TripleCheck application for competition...");

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
  console.log("Full TripleCheck app rendered successfully");
} catch (error) {
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
