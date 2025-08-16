import React, { useState, useCallback } from "react";

import { CompareBar } from "../components/CompareBar";
import { CompareModal } from "../components/CompareModal";
import { PropertyListingPage } from "../../shared/components/property/PropertyListingPage";
import { commercialConfig } from "../../shared/config/propertyTypes";

/**
 * Modern Commercial Properties page using the enhanced property listing architecture
 *
 * Features:
 * - Generic PropertyListingPage component for consistency
 * - Advanced filter state management with URL synchronization
 * - Paginated query management with prefetching
 * - Normalized property types for commercial category
 * - Integrated photo management system
 * - Compare functionality with floating UI
 * - Responsive design with virtualization
 * - Error boundaries and loading states
 */
export default function CommercialProperties(): React.ReactElement {
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
        config={commercialConfig}
        enableCompare={true}
        enablePhotoManagement={true}
        heroConfig={{
          title: "Commercial Properties",
          subtitle:
            "Discover premium commercial real estate opportunities across Kenya's prime business locations.",
        }}
        className="commercial-properties-page"
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
CommercialProperties.displayName = "CommercialProperties";