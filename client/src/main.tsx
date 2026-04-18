import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import App from "./app/App"
import { AppProviders } from "./app/providers"
import "./local/styles/design-system.css"
import "./local/styles/globals.css"

// Initialize MSW in development (non-blocking, fails silently)
async function initMockServiceWorker() {
  if (!import.meta.env.DEV) return
  
  try {
    // MSW is disabled or not found in the project.
    // const { startMswWorker } = await import("./shared/test-utils/msw-browser")
    // await startMswWorker()
  } catch (error) {
    console.warn("[MSW] Mock service worker initialization failed:", error)
  }
}

// Configure React Query with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Dev-only diagnostics
if (import.meta.env.DEV) {
  console.log("Starting TripleCheck application...")
  console.log("Environment:", import.meta.env.MODE)
  console.log("Base URL:", import.meta.env.BASE_URL)
}

// Initialize MSW (development only)
initMockServiceWorker()

// Fatal error fallback UI
function renderFatalError(message: string, details?: string): never {
  const rootElement = document.getElementById("root")
  
  const errorHtml = `
    <div style="padding: 2rem; font-family: system-ui, monospace; color: #dc2626;">
      <h1 style="margin: 0 0 1rem; font-size: 1.25rem;">Application Failed to Load</h1>
      <p style="margin: 0 0 0.5rem;"><strong>Error:</strong> ${message}</p>
      ${details ? `<pre style="background: #f5f5f4; padding: 1rem; border-radius: 0.375rem; overflow: auto; font-size: 0.875rem;">${details}</pre>` : ""}
      <p style="margin-top: 1rem; color: #57534e;">
        Try refreshing the page or clearing your browser cache.
      </p>
    </div>
  `
  
  if (rootElement) {
    rootElement.innerHTML = errorHtml
  } else {
    document.body.insertAdjacentHTML("afterbegin", errorHtml)
  }
  
  throw new Error(message)
}

// Application entry point
function bootstrap() {
  const rootElement = document.getElementById("root")
  
  if (!rootElement) {
    renderFatalError("Root element #root not found in document")
  }

  try {
    const root = ReactDOM.createRoot(rootElement)

    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppProviders>
              <App />
            </AppProviders>
          </BrowserRouter>
        </QueryClientProvider>
      </React.StrictMode>
    )

    if (import.meta.env.DEV) {
      console.log("TripleCheck app rendered successfully")
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown render error"
    const stackTrace = error instanceof Error ? error.stack : undefined
    renderFatalError(errorMessage, stackTrace)
  }
}

bootstrap()