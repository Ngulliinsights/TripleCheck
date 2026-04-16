"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Properties;
var react_1 = require("react");
var CompareBar_1 = require("../../property/components/CompareBar");
var CompareModal_1 = require("../../property/components/CompareModal");
var PropertyListingPage_1 = require("../components/property/PropertyListingPage");
var propertyTypes_1 = require("../config/propertyTypes");
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
function Properties() {
    var _a = (0, react_1.useState)(false), showCompareModal = _a[0], setShowCompareModal = _a[1];
    var handleShowCompareModal = (0, react_1.useCallback)(function () {
        setShowCompareModal(true);
    }, []);
    var handleCloseCompareModal = (0, react_1.useCallback)(function () {
        setShowCompareModal(false);
    }, []);
    return (<>
      <PropertyListingPage_1.PropertyListingPage config={propertyTypes_1.allPropertiesConfig} enableCompare={true} enablePhotoManagement={true} heroConfig={{
            title: "Find Your Perfect Verified Property",
            subtitle: "Browse thousands of verified properties across Kenya. Every listing is authenticated and fraud-checked.",
        }} className="properties-page"/>

      {/* Compare functionality - floating UI components */}
      <CompareBar_1.CompareBar onQuickCompare={handleShowCompareModal}/>
      <CompareModal_1.CompareModal isOpen={showCompareModal} onClose={handleCloseCompareModal}/>
    </>);
}
