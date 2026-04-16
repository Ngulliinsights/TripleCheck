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
exports.NotFound = exports.Blog = exports.PressMedia = exports.Partners = exports.OurStory = exports.Resources = exports.Pricing = exports.Features = exports.Home = exports.normalizeProperty = exports.EnhancedPhotoManagementButton = exports.PhotoManagementButton = exports.BasePropertyFilters = exports.ResidentialFiltersComponent = exports.ResidentialFilters = exports.PropertyDetailsSkeleton = exports.PropertySkeletonGrid = exports.PropertyDataGrid = exports.useSafeQuery = exports.useSafePropertiesQuery = exports.useNavigationSpacing = exports.usePageSpacing = exports.usePropertyGridVirtualization = exports.usePropertyListVirtualization = exports.withPerformanceMonitor = exports.useComponentPerformance = exports.useDebounce = exports.Pagination = exports.GridVirtualizedList = exports.EnterpriseVirtualizedList = exports.QueryErrorBoundary = exports.DemoLoginHelper = exports.TrustIndicators = exports.ServiceCategories = exports.EnhancedTestimonials = exports.Testimonials = exports.NewsBlog = exports.EnhancedNavigation = exports.Navigation = exports.MobileNav = exports.Logo = exports.PropertyImageWorkflowManager = exports.PropertyImageUploadService = exports.PropertyImageValidationService = exports.PropertyImageGallery = exports.ImageGallery = exports.PropertyImageVault = exports.LoadingSkeleton = void 0;
// Shared Exports
__exportStar(require("./types"), exports);
__exportStar(require("./error-handling"), exports);
// UI Components
__exportStar(require("./components/ui/button"), exports);
__exportStar(require("./components/ui/card"), exports);
__exportStar(require("./components/ui/input"), exports);
__exportStar(require("./components/ui/badge"), exports);
__exportStar(require("./components/ui/avatar"), exports);
__exportStar(require("./components/ui/dialog"), exports);
__exportStar(require("./components/ui/alert"), exports);
__exportStar(require("./components/ui/skeleton"), exports);
__exportStar(require("./components/ui/separator"), exports);
__exportStar(require("./components/ui/label"), exports);
var loading_skeleton_1 = require("./components/ui/loading-skeleton");
Object.defineProperty(exports, "LoadingSkeleton", { enumerable: true, get: function () { return loading_skeleton_1.LoadingSkeleton; } });
__exportStar(require("./components/ui/loading-states"), exports);
// Image components - refactored architecture
var PropertyImageVault_1 = require("./components/images/PropertyImageVault");
Object.defineProperty(exports, "PropertyImageVault", { enumerable: true, get: function () { return PropertyImageVault_1.default; } });
var ImageGallery_1 = require("./components/images/ImageGallery");
Object.defineProperty(exports, "ImageGallery", { enumerable: true, get: function () { return ImageGallery_1.default; } });
var ImageGallery_2 = require("./components/images/ImageGallery");
Object.defineProperty(exports, "PropertyImageGallery", { enumerable: true, get: function () { return ImageGallery_2.default; } });
var PropertyImageValidationService_1 = require("./services/images/PropertyImageValidationService");
Object.defineProperty(exports, "PropertyImageValidationService", { enumerable: true, get: function () { return PropertyImageValidationService_1.PropertyImageValidationService; } });
var PropertyImageUploadService_1 = require("./services/images/PropertyImageUploadService");
Object.defineProperty(exports, "PropertyImageUploadService", { enumerable: true, get: function () { return PropertyImageUploadService_1.PropertyImageUploadService; } });
// Legacy export for backward compatibility
// export { PropertyImageUploadCoordinator } from './services/images/PropertyImageUploadCoordinator' // File doesn't exist
var PropertyImageWorkflowManager_1 = require("./services/images/PropertyImageWorkflowManager");
Object.defineProperty(exports, "PropertyImageWorkflowManager", { enumerable: true, get: function () { return PropertyImageWorkflowManager_1.PropertyImageWorkflowManager; } });
var logo_1 = require("./components/ui/logo");
Object.defineProperty(exports, "Logo", { enumerable: true, get: function () { return logo_1.Logo; } });
// Navigation Components
var MobileNav_1 = require("./components/navigation/MobileNav");
Object.defineProperty(exports, "MobileNav", { enumerable: true, get: function () { return MobileNav_1.MobileNav; } });
var Navigation_1 = require("./components/navigation/Navigation");
Object.defineProperty(exports, "Navigation", { enumerable: true, get: function () { return Navigation_1.Navigation; } });
var Navigation_2 = require("./components/navigation/Navigation"); // Backward compatibility
Object.defineProperty(exports, "EnhancedNavigation", { enumerable: true, get: function () { return Navigation_2.Navigation; } });
// Other Shared Components
var NewsBlog_1 = require("./components/NewsBlog");
Object.defineProperty(exports, "NewsBlog", { enumerable: true, get: function () { return NewsBlog_1.NewsBlog; } });
var Testimonials_1 = require("./components/Testimonials");
Object.defineProperty(exports, "Testimonials", { enumerable: true, get: function () { return Testimonials_1.Testimonials; } });
var Testimonials_2 = require("./components/Testimonials"); // Backward compatibility
Object.defineProperty(exports, "EnhancedTestimonials", { enumerable: true, get: function () { return Testimonials_2.Testimonials; } });
var ServiceCategories_1 = require("./components/ServiceCategories");
Object.defineProperty(exports, "ServiceCategories", { enumerable: true, get: function () { return ServiceCategories_1.ServiceCategories; } });
var TrustIndicators_1 = require("./components/TrustIndicators");
Object.defineProperty(exports, "TrustIndicators", { enumerable: true, get: function () { return TrustIndicators_1.TrustIndicators; } });
var DemoLoginHelper_1 = require("./components/DemoLoginHelper");
Object.defineProperty(exports, "DemoLoginHelper", { enumerable: true, get: function () { return DemoLoginHelper_1.DemoLoginHelper; } });
var QueryErrorBoundary_1 = require("./components/QueryErrorBoundary");
Object.defineProperty(exports, "QueryErrorBoundary", { enumerable: true, get: function () { return QueryErrorBoundary_1.QueryErrorBoundary; } });
var VirtualizedList_1 = require("./components/VirtualizedList");
Object.defineProperty(exports, "EnterpriseVirtualizedList", { enumerable: true, get: function () { return VirtualizedList_1.EnterpriseVirtualizedList; } });
Object.defineProperty(exports, "GridVirtualizedList", { enumerable: true, get: function () { return VirtualizedList_1.GridVirtualizedList; } });
var Pagination_1 = require("./components/Pagination");
Object.defineProperty(exports, "Pagination", { enumerable: true, get: function () { return Pagination_1.Pagination; } });
// Hooks
var useDebounce_1 = require("./hooks/useDebounce");
Object.defineProperty(exports, "useDebounce", { enumerable: true, get: function () { return useDebounce_1.useDebounce; } });
var useComponentPerformance_1 = require("./hooks/useComponentPerformance");
Object.defineProperty(exports, "useComponentPerformance", { enumerable: true, get: function () { return useComponentPerformance_1.useComponentPerformance; } });
Object.defineProperty(exports, "withPerformanceMonitor", { enumerable: true, get: function () { return useComponentPerformance_1.withPerformanceMonitor; } });
var useMemoryOptimization_1 = require("./hooks/useMemoryOptimization");
Object.defineProperty(exports, "usePropertyListVirtualization", { enumerable: true, get: function () { return useMemoryOptimization_1.usePropertyListVirtualization; } });
Object.defineProperty(exports, "usePropertyGridVirtualization", { enumerable: true, get: function () { return useMemoryOptimization_1.usePropertyGridVirtualization; } });
var useNavigationSpacing_1 = require("./hooks/useNavigationSpacing");
Object.defineProperty(exports, "usePageSpacing", { enumerable: true, get: function () { return useNavigationSpacing_1.usePageSpacing; } });
Object.defineProperty(exports, "useNavigationSpacing", { enumerable: true, get: function () { return useNavigationSpacing_1.useNavigationSpacing; } });
var useSafeQuery_1 = require("./hooks/useSafeQuery");
Object.defineProperty(exports, "useSafePropertiesQuery", { enumerable: true, get: function () { return useSafeQuery_1.useSafePropertiesQuery; } });
Object.defineProperty(exports, "useSafeQuery", { enumerable: true, get: function () { return useSafeQuery_1.useSafeQuery; } });
// Property Management Hooks
__exportStar(require("./hooks/useFilterState"), exports);
__exportStar(require("./hooks/usePagination"), exports);
// Property Components
__exportStar(require("./components/property"), exports);
var PropertyDataGrid_1 = require("./components/property/PropertyDataGrid");
Object.defineProperty(exports, "PropertyDataGrid", { enumerable: true, get: function () { return PropertyDataGrid_1.PropertyDataGrid; } });
var PropertySkeletonGrid_1 = require("./components/property/PropertySkeletonGrid");
Object.defineProperty(exports, "PropertySkeletonGrid", { enumerable: true, get: function () { return PropertySkeletonGrid_1.PropertySkeletonGrid; } });
Object.defineProperty(exports, "PropertyDetailsSkeleton", { enumerable: true, get: function () { return PropertySkeletonGrid_1.PropertyDetailsSkeleton; } });
var ResidentialFilters_1 = require("./components/property/filters/ResidentialFilters");
Object.defineProperty(exports, "ResidentialFilters", { enumerable: true, get: function () { return ResidentialFilters_1.ResidentialFilters; } });
Object.defineProperty(exports, "ResidentialFiltersComponent", { enumerable: true, get: function () { return ResidentialFilters_1.ResidentialFiltersComponent; } });
var BasePropertyFilters_1 = require("./components/property/filters/BasePropertyFilters");
Object.defineProperty(exports, "BasePropertyFilters", { enumerable: true, get: function () { return BasePropertyFilters_1.BasePropertyFiltersComponent; } });
var PhotoManagementButton_1 = require("./components/property/PhotoManagementButton");
Object.defineProperty(exports, "PhotoManagementButton", { enumerable: true, get: function () { return PhotoManagementButton_1.PhotoManagementButton; } });
Object.defineProperty(exports, "EnhancedPhotoManagementButton", { enumerable: true, get: function () { return PhotoManagementButton_1.EnhancedPhotoManagementButton; } });
// Property Utilities
__exportStar(require("./utils/property-mapper"), exports);
var property_mapper_1 = require("./utils/property-mapper");
Object.defineProperty(exports, "normalizeProperty", { enumerable: true, get: function () { return property_mapper_1.normalizeProperty; } });
// Shared Pages
var Home_1 = require("./pages/Home");
Object.defineProperty(exports, "Home", { enumerable: true, get: function () { return Home_1.default; } });
var Features_1 = require("./pages/Features");
Object.defineProperty(exports, "Features", { enumerable: true, get: function () { return Features_1.default; } });
var Pricing_1 = require("./pages/Pricing");
Object.defineProperty(exports, "Pricing", { enumerable: true, get: function () { return Pricing_1.default; } });
var Resources_1 = require("./pages/Resources");
Object.defineProperty(exports, "Resources", { enumerable: true, get: function () { return Resources_1.default; } });
var OurStory_1 = require("./pages/OurStory");
Object.defineProperty(exports, "OurStory", { enumerable: true, get: function () { return OurStory_1.default; } });
var Partners_1 = require("./pages/Partners");
Object.defineProperty(exports, "Partners", { enumerable: true, get: function () { return Partners_1.default; } });
var PressMedia_1 = require("./pages/PressMedia");
Object.defineProperty(exports, "PressMedia", { enumerable: true, get: function () { return PressMedia_1.default; } });
var Blog_1 = require("./pages/Blog");
Object.defineProperty(exports, "Blog", { enumerable: true, get: function () { return Blog_1.default; } });
var NotFound_1 = require("./pages/NotFound");
Object.defineProperty(exports, "NotFound", { enumerable: true, get: function () { return NotFound_1.default; } });
