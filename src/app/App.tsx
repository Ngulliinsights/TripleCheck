import { useEffect, memo } from "react";
import { Routes, Route } from "react-router-dom";

import { AppLayout } from "../shared/components/layout/AppLayout";
import { ErrorBoundary } from "./error-boundary";

// Import pages directly (no lazy loading to avoid context issues)
import HomePage from "../shared/pages/Home";
import FeaturesPage from "../shared/pages/Features";
import PricingPage from "../shared/pages/Pricing";
import PropertiesPage from "../shared/pages/Properties";
import DashboardPage from "../user/pages/Dashboard";
import LoginPage from "../auth/pages/Login";
import RegisterPage from "../auth/pages/Register";
import NotFoundPage from "../shared/pages/NotFound";

// Land Verification Pages
import LandVerificationDashboard from "../land-verification/pages/LandVerificationDashboardPage";
import NewVerificationPage from "../land-verification/pages/NewVerificationPage";

// Trust Pages
import DocumentAuthPage from "../trust/pages/DocumentAuth";

// Communication Pages
import InboxPage from "../communication/pages/Inbox";

function useNonCriticalInitialization(): void {
  useEffect(() => {
    console.log('TripleCheck Full App initialized successfully');
    
    // Add production debugging
    if (typeof window !== 'undefined') {
      console.log('Environment:', import.meta.env.MODE);
      console.log('Base URL:', import.meta.env.BASE_URL);
      console.log('Window location:', window.location.href);
      console.log('Document ready state:', document.readyState);
      console.log('Root element exists:', !!document.getElementById('root'));
    }
  }, []);
}

export const App = memo(() => {
  useNonCriticalInitialization();

  return (
    <ErrorBoundary level="page">
      <AppLayout>
        <main>
          <ErrorBoundary level="route">
            <Routes>
              {/* Core Pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              
              {/* Property Routes */}
              <Route path="/properties" element={<PropertiesPage />} />
              
              {/* User Routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Authentication Routes */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              
              {/* Land Verification Routes */}
              <Route path="/land-verification/dashboard" element={<LandVerificationDashboard />} />
              <Route path="/land-verification/new" element={<NewVerificationPage />} />
              
              {/* Trust & Document Routes */}
              <Route path="/services/document-auth" element={<DocumentAuthPage />} />
              
              {/* Communication Routes */}
              <Route path="/inbox" element={<InboxPage />} />
              
              {/* Catch all route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </AppLayout>
    </ErrorBoundary>
  );
});

App.displayName = "App";

export default App;