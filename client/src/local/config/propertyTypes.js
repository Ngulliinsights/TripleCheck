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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyTypeConfigs = exports.allPropertiesConfig = exports.landConfig = exports.commercialConfig = exports.residentialConfig = void 0;
exports.getPropertyTypeConfig = getPropertyTypeConfig;
exports.isValidPropertyType = isValidPropertyType;
exports.getAvailablePropertyTypes = getAvailablePropertyTypes;
var LandCard_1 = require("../../property/components/LandCard");
var AllPropertiesFilters_1 = require("../components/property/filters/AllPropertiesFilters");
var CommercialFilters_1 = require("../components/property/filters/CommercialFilters");
var LandFilters_1 = require("../components/property/filters/LandFilters");
var ResidentialFilters_1 = require("../components/property/filters/ResidentialFilters");
var PropertyCard_1 = require("../components/property/PropertyCard");
// Mock properties functionality moved to property module
var propertyAdapters_1 = require("../utils/propertyAdapters");
var mockPropertyApi_1 = require("../utils/mockPropertyApi");
// Simple fetcher functions
function fetchResidentialProperties(filters, page, pageSize) {
    return __awaiter(this, void 0, void 0, function () {
        var result, items;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.log("🏘️ fetchResidentialProperties called with:", { filters: filters, page: page, pageSize: pageSize });
                    }
                    return [4 /*yield*/, (0, mockPropertyApi_1.fetchMockProperties)(__assign(__assign({}, filters), { category: 'residential' }), page, pageSize)];
                case 1:
                    result = _a.sent();
                    items = result.items.map(function (item) { return (0, propertyAdapters_1.residentialPropertyAdapter)(item); });
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.log("🏘️ fetchResidentialProperties result:", { itemsCount: items.length, totalCount: result.totalCount });
                    }
                    return [2 /*return*/, {
                            items: items,
                            totalCount: result.totalCount,
                            totalPages: result.totalPages,
                        }];
            }
        });
    });
}
function fetchCommercialProperties(filters, page, pageSize) {
    return __awaiter(this, void 0, void 0, function () {
        var result, items;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.log("🏢 fetchCommercialProperties called with:", { filters: filters, page: page, pageSize: pageSize });
                    }
                    return [4 /*yield*/, (0, mockPropertyApi_1.fetchMockProperties)(__assign(__assign({}, filters), { category: 'commercial' }), page, pageSize)];
                case 1:
                    result = _a.sent();
                    items = result.items.map(function (item) { return (0, propertyAdapters_1.commercialPropertyAdapter)(item); });
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.log("🏢 fetchCommercialProperties result:", { itemsCount: items.length, totalCount: result.totalCount });
                    }
                    return [2 /*return*/, {
                            items: items,
                            totalCount: result.totalCount,
                            totalPages: result.totalPages,
                        }];
            }
        });
    });
}
function fetchLandProperties(filters, page, pageSize) {
    return __awaiter(this, void 0, void 0, function () {
        var result, items;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.log("🏞️ fetchLandProperties called with:", { filters: filters, page: page, pageSize: pageSize });
                    }
                    return [4 /*yield*/, (0, mockPropertyApi_1.fetchMockProperties)(__assign(__assign({}, filters), { category: 'land' }), page, pageSize)];
                case 1:
                    result = _a.sent();
                    items = result.items.map(function (item) { return (0, propertyAdapters_1.landPropertyAdapter)(item); });
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.log("🏞️ fetchLandProperties result:", { itemsCount: items.length, totalCount: result.totalCount });
                    }
                    return [2 /*return*/, {
                            items: items,
                            totalCount: result.totalCount,
                            totalPages: result.totalPages,
                        }];
            }
        });
    });
}
function fetchAllProperties(filters, page, pageSize) {
    return __awaiter(this, void 0, void 0, function () {
        var result, items;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.log("🏠 fetchAllProperties called with:", { filters: filters, page: page, pageSize: pageSize });
                    }
                    return [4 /*yield*/, (0, mockPropertyApi_1.fetchMockProperties)(filters, page, pageSize)];
                case 1:
                    result = _a.sent();
                    items = result.items.map(function (item) { return (0, propertyAdapters_1.residentialPropertyAdapter)(item); });
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.log("🏠 fetchAllProperties result:", { itemsCount: items.length, totalCount: result.totalCount });
                    }
                    return [2 /*return*/, {
                            items: items,
                            totalCount: result.totalCount,
                            totalPages: result.totalPages,
                        }];
            }
        });
    });
}
// Simple adapter functions
var residentialAdapter = function (item) {
    return (0, propertyAdapters_1.residentialPropertyAdapter)(item);
};
var commercialAdapter = function (item) {
    return (0, propertyAdapters_1.commercialPropertyAdapter)(item);
};
var landAdapter = function (item) {
    return (0, propertyAdapters_1.landPropertyAdapter)(item);
};
// Property type configurations
exports.residentialConfig = {
    title: 'Residential Properties',
    description: 'Find your perfect home from apartments, houses, and more',
    queryKey: ['properties', 'residential'],
    defaultFilters: {
        query: '',
        location: '',
        priceMin: null,
        priceMax: null,
        verified: false,
        category: 'residential',
        bedrooms: null,
        bathrooms: null,
        propertyType: '',
        amenities: [],
        furnished: false,
        petFriendly: false,
    },
    fetcher: fetchResidentialProperties,
    adapter: residentialAdapter,
    filterComponent: ResidentialFilters_1.ResidentialFilters,
    cardComponent: PropertyCard_1.PropertyCard,
};
exports.commercialConfig = {
    title: 'Commercial Properties',
    description: 'Discover office spaces, retail locations, and investment opportunities',
    queryKey: ['properties', 'commercial'],
    defaultFilters: {
        query: '',
        location: '',
        priceMin: null,
        priceMax: null,
        verified: false,
        category: 'commercial',
        propertyType: '',
        sizeMin: null,
        sizeMax: null,
        yearBuiltMin: null,
        roiMin: null,
        commercialType: '',
        businessZone: '',
        areaMin: '',
        areaMax: '',
        floorsMin: '',
        floorsMax: '',
        parking: false,
        elevator: false,
        airConditioning: false,
        security: false,
        wifi: false,
        generator: false,
    },
    fetcher: fetchCommercialProperties,
    adapter: commercialAdapter,
    filterComponent: CommercialFilters_1.default,
    cardComponent: PropertyCard_1.PropertyCard,
};
exports.landConfig = {
    title: 'Land Properties',
    description: 'Verified land with comprehensive verification and documentation',
    queryKey: ['properties', 'land'],
    defaultFilters: {
        query: '',
        location: '',
        priceMin: null,
        priceMax: null,
        verified: false,
        category: 'land',
        landType: '',
        sizeMin: '',
        sizeMax: '',
        waterAccess: false,
        roadAccess: false,
        electricityAccess: false,
    },
    fetcher: fetchLandProperties,
    adapter: landAdapter,
    filterComponent: LandFilters_1.default,
    cardComponent: LandCard_1.LandCard,
};
exports.allPropertiesConfig = {
    title: 'All Properties',
    description: 'Browse all verified properties across Kenya',
    queryKey: ['properties', 'all'],
    defaultFilters: {
        query: '',
        location: '',
        priceMin: null,
        priceMax: null,
        verified: false,
        category: null,
    },
    fetcher: fetchAllProperties,
    adapter: function (item) { return item; },
    filterComponent: AllPropertiesFilters_1.default,
    cardComponent: PropertyCard_1.AdaptivePropertyCard,
};
// Configuration registry
exports.propertyTypeConfigs = {
    residential: exports.residentialConfig,
    commercial: exports.commercialConfig,
    land: exports.landConfig,
    all: exports.allPropertiesConfig,
};
// Utility functions
function getPropertyTypeConfig(type) {
    switch (type) {
        case 'residential':
            return exports.propertyTypeConfigs.residential;
        case 'commercial':
            return exports.propertyTypeConfigs.commercial;
        case 'land':
            return exports.propertyTypeConfigs.land;
        case 'all':
            return exports.propertyTypeConfigs.all;
        default:
            throw new Error("Invalid property type: ".concat(type));
    }
}
function isValidPropertyType(type) {
    return ['residential', 'commercial', 'land', 'all'].includes(type);
}
function getAvailablePropertyTypes() {
    return ['residential', 'commercial', 'land', 'all'];
}
