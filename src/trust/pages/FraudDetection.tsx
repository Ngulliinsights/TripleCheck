import { useAuth } from "../../auth/hooks/useAuth";
import FraudDetectionDashboard from "../components/FraudDetectionDashboard";

import FraudProtectionInfo from "./FraudProtectionInfo";

function FraudDetection(): JSX.Element {
  const { user, isAuthenticated } = useAuth();

  // Always render the same structure, but conditionally show content
  return (
    <div className="min-h-screen bg-background">
      {!isAuthenticated ?
        <FraudProtectionInfo />
      : <div className="container mx-auto px-4 py-8">
          <FraudDetectionDashboard userId={user?.id} />
        </div>
      }
    </div>
  );
}

export default FraudDetection;
