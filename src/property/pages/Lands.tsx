import React, { useState, useCallback } from "react"

import { PropertyListingPage } from "../../shared/components/property/PropertyListingPage"
import { landConfig } from "../../shared/config/propertyTypes"
import { CompareBar } from "../components/CompareBar"
import { CompareModal } from "../components/CompareModal"
/**
 * Modern Land Properties page using the enhanced property listing architecture
 *
 * Features:
 * - Generic PropertyListingPage component for consistency
 * - Advanced filter state management with URL synchronization
 * - Paginated query management with prefetching
 * - Normalized property types for land category
 * - Integrated photo management system
 * - Compare functionality with floating UI
 * - Responsive design with virtualization
 * - Error boundaries and loading states
 */
export default function Lands(): React.ReactElement {
  const [showCompareModal, setShowCompareModal] = useState(false);

  const handleShowCompareModal = useCallback(() => {
    setShowCompareModal(true);
  }, []);

  const handleCloseCompareModal = useCallback(() => {
    setShowCompareModal(false);
  }, []);

  return (
    <>
      <PropertyListingPage
        config={landConfig}
        enableCompare={true}
        enablePhotoManagement={true}
        heroConfig={{
          title: "Land Properties",
          subtitle:
            "Verified land with comprehensive verification and documentation across Kenya.",
        }}
        className="land-properties-page"
      />

      {/* Compare functionality - floating UI components */}
      <CompareBar onQuickCompare={handleShowCompareModal} />
      <CompareModal
        isOpen={showCompareModal}
        onClose={handleCloseCompareModal}
      />
    </>
  );
}

// Export display name for debugging
Lands.displayName = "Lands";
