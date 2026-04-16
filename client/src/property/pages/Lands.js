"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Lands;
var react_1 = require("react");
var PropertyListingPage_1 = require("../../local/components/property/PropertyListingPage");
var propertyTypes_1 = require("../../local/config/propertyTypes");
var CompareBar_1 = require("../components/CompareBar");
var CompareModal_1 = require("../components/CompareModal");
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
function Lands() {
    var _a = (0, react_1.useState)(false), showCompareModal = _a[0], setShowCompareModal = _a[1];
    var handleShowCompareModal = (0, react_1.useCallback)(function () {
        setShowCompareModal(true);
    }, []);
    var handleCloseCompareModal = (0, react_1.useCallback)(function () {
        setShowCompareModal(false);
    }, []);
    return (<>
      <PropertyListingPage_1.PropertyListingPage config={propertyTypes_1.landConfig} enableCompare={true} enablePhotoManagement={true} heroConfig={{
            title: "Land Properties",
            subtitle: "Verified land with comprehensive verification and documentation across Kenya.",
        }} className="land-properties-page"/>

      {/* Compare functionality - floating UI components */}
      <CompareBar_1.CompareBar onQuickCompare={handleShowCompareModal}/>
      <CompareModal_1.CompareModal isOpen={showCompareModal} onClose={handleCloseCompareModal}/>
    </>);
}
// Export display name for debugging
Lands.displayName = "Lands";
