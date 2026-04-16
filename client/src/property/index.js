"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListProperty = exports.PropertyOptimize = exports.PropertyPhotos = exports.PropertyCompare = exports.PropertyEdit = exports.PropertyDetails = exports.EnhancedLandCard = exports.PropertyCard = exports.PropertyReviews = exports.PropertyMap = exports.usePropertyCompareState = exports.usePropertyCompareAnalysis = exports.usePropertyCompareActions = exports.usePropertyCompare = exports.useFavorites = exports.usePropertyFilters = exports.usePropertyActions = exports.usePropertyState = exports.usePropertyContext = exports.PropertyProvider = void 0;
// Property Domain Exports
__exportStar(require("./types/property.types"), exports);
// New consolidated hooks
__exportStar(require("./hooks/useUnifiedProperty"), exports);
__exportStar(require("./hooks/useConsolidatedPropertySearch"), exports);
// Legacy hooks (deprecated - use consolidated hooks above)
__exportStar(require("./hooks/useProperty"), exports);
__exportStar(require("./hooks/usePropertySearch"), exports);
__exportStar(require("./hooks/useLandProperty"), exports);
// Services - Unified PropertyApi
__exportStar(require("./services/property-api"), exports);
// Contexts - Unified PropertyContext with comparison functionality
var contexts_1 = require("./contexts");
Object.defineProperty(exports, "PropertyProvider", { enumerable: true, get: function () { return contexts_1.PropertyProvider; } });
Object.defineProperty(exports, "usePropertyContext", { enumerable: true, get: function () { return contexts_1.usePropertyContext; } });
Object.defineProperty(exports, "usePropertyState", { enumerable: true, get: function () { return contexts_1.usePropertyState; } });
Object.defineProperty(exports, "usePropertyActions", { enumerable: true, get: function () { return contexts_1.usePropertyActions; } });
Object.defineProperty(exports, "usePropertyFilters", { enumerable: true, get: function () { return contexts_1.usePropertyFilters; } });
Object.defineProperty(exports, "useFavorites", { enumerable: true, get: function () { return contexts_1.useFavorites; } });
Object.defineProperty(exports, "usePropertyCompare", { enumerable: true, get: function () { return contexts_1.usePropertyCompare; } });
Object.defineProperty(exports, "usePropertyCompareActions", { enumerable: true, get: function () { return contexts_1.usePropertyCompareActions; } });
Object.defineProperty(exports, "usePropertyCompareAnalysis", { enumerable: true, get: function () { return contexts_1.usePropertyCompareAnalysis; } });
Object.defineProperty(exports, "usePropertyCompareState", { enumerable: true, get: function () { return contexts_1.usePropertyCompareState; } });
// Components
var PropertyMap_1 = require("./components/PropertyMap");
Object.defineProperty(exports, "PropertyMap", { enumerable: true, get: function () { return PropertyMap_1.PropertyMap; } });
var PropertyReviews_1 = require("./components/PropertyReviews");
Object.defineProperty(exports, "PropertyReviews", { enumerable: true, get: function () { return PropertyReviews_1.PropertyReviews; } });
var PropertyCard_1 = require("../local/components/property/PropertyCard");
Object.defineProperty(exports, "PropertyCard", { enumerable: true, get: function () { return PropertyCard_1.PropertyCard; } });
var LandCard_1 = require("./components/LandCard");
Object.defineProperty(exports, "EnhancedLandCard", { enumerable: true, get: function () { return LandCard_1.default; } });
// Utilities
// Image utilities moved to shared/components/images/ for better reusability
// Pages
var PropertyDetails_1 = require("./pages/PropertyDetails");
Object.defineProperty(exports, "PropertyDetails", { enumerable: true, get: function () { return PropertyDetails_1.default; } });
var PropertyEdit_1 = require("./pages/PropertyEdit");
Object.defineProperty(exports, "PropertyEdit", { enumerable: true, get: function () { return PropertyEdit_1.default; } });
var PropertyCompare_1 = require("./pages/PropertyCompare");
Object.defineProperty(exports, "PropertyCompare", { enumerable: true, get: function () { return PropertyCompare_1.default; } });
var PropertyPhotos_1 = require("./pages/PropertyPhotos");
Object.defineProperty(exports, "PropertyPhotos", { enumerable: true, get: function () { return PropertyPhotos_1.default; } });
var PropertyOptimize_1 = require("./pages/PropertyOptimize");
Object.defineProperty(exports, "PropertyOptimize", { enumerable: true, get: function () { return PropertyOptimize_1.default; } });
// export { default as PropertyMap } from './pages/PropertyMap' // File doesn't exist
var ListProperty_1 = require("./pages/ListProperty");
Object.defineProperty(exports, "ListProperty", { enumerable: true, get: function () { return ListProperty_1.default; } });
