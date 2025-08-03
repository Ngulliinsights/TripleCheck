import React, { Suspense, lazy } from "react";

import { useAuth } from "../../auth/hooks/useAuth";
import { LoadingSkeleton } from "../../shared/components/ui/loading-skeleton";

// Lazy load components to prevent import issues
const FraudProtectionInfo = lazy(() => import("./FraudProtectionInfo"));
const FraudDetectionDashboard = lazy(() => import("../components/FraudDetectionDashboard"));

function FraudDetection(): JSX.Element {
  const { user, isAuthenticated } = useAuth();

  // Always render the same structure, but conditionally show content
  return (
    <div className="min-h-screen bg-background">
      {!isAuthenticated ? (
        <Suspense fallback={<LoadingSkeleton variant="page" />}>
          <FraudProtectionInfo />
        </Suspense>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <Suspense fallback={<LoadingSkeleton variant="page" />}>
            <FraudDetectionDashboard userId={user?.id} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default FraudDetection;
