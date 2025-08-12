import React from 'react';

import { CompareBar } from '../../property/components/CompareBar';
import { CompareModal } from '../../property/components/CompareModal';
import { CompareProvider } from '../../property/contexts/CompareContext';
import { PropertyListingPage } from '../components/property/PropertyListingPage';
import { allPropertiesConfig } from '../config/propertyTypes';

/**
 * New Properties page using the enhanced property listing architecture
 * This demonstrates the improved approach with:
 * - Generic PropertyListingPage component
 * - Advanced filter state management with URL sync
 * - Paginated query management with prefetching
 * - Normalized property types
 * - Integrated photo management
 */
export default function PropertiesNew(): React.ReactElement {
  return (
    <CompareProvider>
      <PropertyListingPage
        config={allPropertiesConfig}
        enableCompare={true}
        enablePhotoManagement={true}
        heroConfig={{
          title: 'Find Your Perfect Verified Property',
          subtitle: 'Browse thousands of verified properties across Kenya. Every listing is authenticated and fraud-checked.',
        }}
        className="properties-new-page"
      />
      
      {/* Compare functionality - preserved from existing implementation */}
      <CompareBar />
      <CompareModal />
    </CompareProvider>
  );
}

// Export for backward compatibility
export { PropertiesNew as Properties };