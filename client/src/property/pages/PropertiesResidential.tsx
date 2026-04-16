import React, { useState, useCallback } from "react"

import { PropertyListingPage } from '../../local/components/property/PropertyListingPage"
import { residentialConfig } from '../../local/config/propertyTypes"
import { CompareBar } from "../components/CompareBar"
import { CompareModal } from "../components/CompareModal"

/**
 * Modern Residential Properties page using the enhanced property listing architecture
 *
 * Features:
 * - Generic PropertyListingPage component for consistency
 * - Advanced filter state management with URL synchronization
 * - Paginated query management with prefetching
 * - Normalized property types for residential category
 * - Integrated photo management system
 * - Compare functionality with floating UI
 * - Responsive design with virtualization
 * - Error boundaries and loading states
 */
export default function PropertiesResidential(): React.ReactElement {
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
        config={residentialConfig}
        enableCompare={true}
        enablePhotoManagement={true}
        heroConfig={{
          title: "Residential Properties",
          subtitle:
            "Find your perfect home among Kenya's finest residential properties with verified listings and premium amenities.",
        }}
        className="residential-properties-page"
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
PropertiesResidential.displayName = "PropertiesResidential";
