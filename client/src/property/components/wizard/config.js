"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhancedWizardConfig = exports.modernWizardConfig = exports.defaultWizardConfigs = void 0;
exports.getWizardConfigForPropertyType = getWizardConfigForPropertyType;
exports.mergeWizardConfig = mergeWizardConfig;
var lucide_react_1 = require("lucide-react");
var steps_1 = require("./steps");
// Step validation functions
var validateBasicDetails = function (data) {
    return !!(data.title && data.description && data.propertyType);
};
var validateLocation = function (data) {
    return !!(data.location.address && data.location.city);
};
var validateFeatures = function (data) {
    var RESIDENTIAL_TYPES = ['apartment', 'house', 'villa', 'townhouse'];
    var isResidential = data.propertyType && RESIDENTIAL_TYPES.includes(data.propertyType);
    var isValid = data.area > 0 && data.price > 0;
    if (isResidential) {
        isValid = isValid && (data.bedrooms || 0) > 0 && (data.bathrooms || 0) > 0;
    }
    return isValid;
};
var validateImages = function (data) {
    var _a, _b;
    return (((_a = data.images) === null || _a === void 0 ? void 0 : _a.length) || 0) > 0 || (((_b = data.imageUrls) === null || _b === void 0 ? void 0 : _b.length) || 0) > 0;
};
var validateDocumentation = function (_data) {
    // Documentation is optional by default
    return true;
};
var validatePreview = function (_data) {
    return true;
};
// Base step configurations
var baseSteps = [
    {
        id: 'basic',
        title: 'Basic Information',
        icon: lucide_react_1.Home,
        description: 'Property title, type, and description',
        required: true,
        component: steps_1.BasicDetailsStep,
        validation: validateBasicDetails
    },
    {
        id: 'location',
        title: 'Location Details',
        icon: lucide_react_1.MapPin,
        description: 'Address and map location',
        required: true,
        component: steps_1.LocationStep,
        validation: validateLocation
    },
    {
        id: 'features',
        title: 'Property Details',
        icon: lucide_react_1.FileText,
        description: 'Bedrooms, bathrooms, and amenities',
        required: true,
        component: steps_1.FeaturesStep,
        validation: validateFeatures
    },
    {
        id: 'images',
        title: 'Photos & Media',
        icon: lucide_react_1.Camera,
        description: 'Property photos and virtual tour',
        required: true,
        component: steps_1.ImagesStep,
        validation: validateImages
    },
    {
        id: 'documentation',
        title: 'Documentation',
        icon: lucide_react_1.Shield,
        description: 'Verification documents and ownership proof',
        required: false,
        component: steps_1.DocumentationStep,
        validation: validateDocumentation
    },
    {
        id: 'preview',
        title: 'Review & Submit',
        icon: lucide_react_1.CheckCircle,
        description: 'Review and publish your listing',
        required: true,
        component: steps_1.PreviewStep,
        validation: validatePreview
    }
];
// Modern step configurations (for PropertyListingWizard compatibility)
var modernSteps = [
    {
        id: 'basic',
        title: 'Basic Details',
        icon: lucide_react_1.Home,
        description: 'Property title, type, and description',
        required: true,
        component: steps_1.BasicDetailsStep,
        validation: validateBasicDetails
    },
    {
        id: 'location',
        title: 'Location',
        icon: lucide_react_1.MapPin,
        description: 'Address and map location',
        required: true,
        component: steps_1.LocationStep,
        validation: validateLocation
    },
    {
        id: 'features',
        title: 'Features',
        icon: lucide_react_1.FileText,
        description: 'Bedrooms, bathrooms, and amenities',
        required: true,
        component: steps_1.FeaturesStep,
        validation: validateFeatures
    },
    {
        id: 'images',
        title: 'Images',
        icon: lucide_react_1.Camera,
        description: 'Property photos and virtual tour',
        required: true,
        component: steps_1.ImagesStep,
        validation: validateImages
    },
    {
        id: 'pricing',
        title: 'Pricing',
        icon: lucide_react_1.DollarSign,
        description: 'Price and market insights',
        required: true,
        component: steps_1.FeaturesStep, // Reuse features step for pricing
        validation: function (data) { return data.price > 0; }
    },
    {
        id: 'preview',
        title: 'Preview',
        icon: lucide_react_1.Eye,
        description: 'Review and publish',
        required: true,
        component: steps_1.PreviewStep,
        validation: validatePreview
    }
];
// Default configurations for different property types
exports.defaultWizardConfigs = {
    apartment: {
        title: 'List Your Apartment',
        subtitle: 'Step-by-step guided process to create comprehensive apartment listings',
        steps: baseSteps,
        showDocumentVerification: false,
        showEnhancedUI: true,
        validationMode: 'strict'
    },
    house: {
        title: 'List Your House',
        subtitle: 'Step-by-step guided process to create comprehensive house listings',
        steps: baseSteps,
        showDocumentVerification: false,
        showEnhancedUI: true,
        validationMode: 'strict'
    },
    villa: {
        title: 'List Your Villa',
        subtitle: 'Step-by-step guided process to create comprehensive villa listings',
        steps: baseSteps,
        showDocumentVerification: false,
        showEnhancedUI: true,
        validationMode: 'strict'
    },
    townhouse: {
        title: 'List Your Townhouse',
        subtitle: 'Step-by-step guided process to create comprehensive townhouse listings',
        steps: baseSteps,
        showDocumentVerification: false,
        showEnhancedUI: true,
        validationMode: 'strict'
    },
    land: {
        title: 'List Your Land',
        subtitle: 'Step-by-step guided process to create comprehensive land listings',
        steps: baseSteps, // Land properties can use all steps
        showDocumentVerification: true, // Documentation is especially important for land
        showEnhancedUI: true,
        validationMode: 'strict'
    },
    commercial: {
        title: 'List Your Commercial Property',
        subtitle: 'Step-by-step guided process to create comprehensive commercial listings',
        steps: baseSteps,
        showDocumentVerification: false,
        showEnhancedUI: true,
        validationMode: 'strict'
    },
    office: {
        title: 'List Your Office Space',
        subtitle: 'Step-by-step guided process to create comprehensive office listings',
        steps: baseSteps,
        showDocumentVerification: false,
        showEnhancedUI: true,
        validationMode: 'strict'
    },
    warehouse: {
        title: 'List Your Warehouse',
        subtitle: 'Step-by-step guided process to create comprehensive warehouse listings',
        steps: baseSteps,
        showDocumentVerification: false,
        showEnhancedUI: true,
        validationMode: 'strict'
    }
};
// Modern configuration (PropertyListingWizard style)
exports.modernWizardConfig = {
    title: 'List Your Property',
    subtitle: 'Create a comprehensive listing to attract verified buyers and tenants',
    steps: modernSteps,
    showDocumentVerification: false,
    showEnhancedUI: false,
    validationMode: 'lenient'
};
// Enhanced configuration (PropertyWizard style)
exports.enhancedWizardConfig = {
    title: 'List Your Property',
    subtitle: 'Step-by-step guided process to create comprehensive and verified property listings',
    steps: baseSteps,
    showDocumentVerification: true,
    showEnhancedUI: true,
    validationMode: 'strict'
};
// Utility function to get configuration for property type
function getWizardConfigForPropertyType(propertyType) {
    if (propertyType && Object.prototype.hasOwnProperty.call(exports.defaultWizardConfigs, propertyType)) {
        return exports.defaultWizardConfigs[propertyType];
    }
    return exports.enhancedWizardConfig;
}
// Utility function to merge configurations
function mergeWizardConfig(base, overrides) {
    return __assign(__assign(__assign({}, base), overrides), { steps: overrides.steps || base.steps });
}
