import { memo, useEffect } from "react"

import { Footer } from "../local/components/layout/Footer"
import { Navigation } from "../local/components/layout/Navigation"
import { NavigationErrorBoundary } from "../local/components/navigation/NavigationErrorBoundary"

import { ErrorBoundary } from "./error-boundary"
import { AppRouter } from "./router"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppLayoutProps {
  readonly children: React.ReactNode
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Runs once on mount; logs are dev-only and collapsed for readability. */
function useAppInit(): void {
  useEffect(() => {
    // Logging disabled to avoid console warnings in development
  }, [])
}

// ─── Layout ───────────────────────────────────────────────────────────────────

/**
 * Structural shell: nav → main → footer.
 * Each region is isolated behind its own ErrorBoundary so a failure
 * in one section never takes down the rest of the page.
 */
function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <ErrorBoundary>
        <NavigationErrorBoundary>
          <Navigation />
        </NavigationErrorBoundary>
      </ErrorBoundary>

      <ErrorBoundary>
        <main className="flex-1 transparent-navbar-content">{children}</main>
      </ErrorBoundary>

      <ErrorBoundary>
        <Footer />
      </ErrorBoundary>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

/**
 * Application root.
 * The outer ErrorBoundary is the last-resort catch-all for anything
 * that escapes the per-region boundaries inside AppLayout.
 */
export const App = memo(function App() {
  useAppInit()

  return (
    <ErrorBoundary>
      <AppLayout>
        <AppRouter />
      </AppLayout>
    </ErrorBoundary>
  )
})

export default App