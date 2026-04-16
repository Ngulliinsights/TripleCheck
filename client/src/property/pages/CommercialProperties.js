"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CommercialProperties;
var react_1 = require("react");
var CompareBar_1 = require("../components/CompareBar");
var CompareModal_1 = require("../components/CompareModal");
var PropertyListingPage_1 = require("../../local/components/property/PropertyListingPage");
var propertyTypes_1 = require("../../local/config/propertyTypes");
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
function CommercialProperties() {
    var _a = (0, react_1.useState)(false), showCompareModal = _a[0], setShowCompareModal = _a[1];
    var handleShowCompareModal = (0, react_1.useCallback)(function () {
        setShowCompareModal(true);
    }, []);
    var handleCloseCompareModal = (0, react_1.useCallback)(function () {
        setShowCompareModal(false);
    }, []);
    return (<>
      <PropertyListingPage_1.PropertyListingPage config={propertyTypes_1.commercialConfig} enableCompare={true} enablePhotoManagement={true} heroConfig={{
            title: "Commercial Properties",
            subtitle: "Discover premium commercial real estate opportunities across Kenya's prime business locations.",
        }} className="commercial-properties-page"/>

      {/* Compare functionality - floating UI components */}
      <CompareBar_1.CompareBar onQuickCompare={handleShowCompareModal}/>
      <CompareModal_1.CompareModal isOpen={showCompareModal} onClose={handleCloseCompareModal}/>
    </>);
}
// Export display name for debugging
CommercialProperties.displayName = "CommercialProperties";
