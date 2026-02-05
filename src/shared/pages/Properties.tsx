import React, { useState, useCallback } from "react"

import { CompareBar } from "../../property/components/CompareBar"
import { CompareModal } from "../../property/components/CompareModal"
import { PropertyListingPage } from "../components/property/PropertyListingPage"
import { allPropertiesConfig } from "../config/propertyTypes"

/**
 * Modern Properties page using the enhanced property listing architecture
 *
 * Features:
 * - Generic PropertyListingPage component for consistency
 * - Advanced filter state management with URL synchronization
 * - Paginated query management with prefetching
 * - Normalized property types across all categories
 * - Integrated photo management system
 * - Compare functionality with floating UI
 * - Responsive design with virtualization
 * - Error boundaries and loading states
 */
export default function Properties(): React.ReactElement {
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
        config={allPropertiesConfig}
        enableCompare={true}
        enablePhotoManagement={true}
        heroConfig={{
          title: "Find Your Perfect Verified Property",
          subtitle:
            "Browse thousands of verified properties across Kenya. Every listing is authenticated and fraud-checked.",
        }}
        className="properties-page"
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
