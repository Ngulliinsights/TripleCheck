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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMockProperties = fetchMockProperties;
exports.generateMockProperties = generateMockProperties;
exports.fetchMockProperty = fetchMockProperty;
exports.resetMockDataSeed = resetMockDataSeed;
// Enhanced seeded random number generator for consistent, predictable results
var SeededRandom = /** @class */ (function () {
    function SeededRandom(seed) {
        if (seed === void 0) { seed = 12345; }
        this.seed = seed;
    }
    /**
     * Generate a pseudorandom number between 0 and 1
     * Uses a simple linear congruential generator for predictability
     */
    SeededRandom.prototype.next = function () {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    };
    /**
     * Generate random integer between min (inclusive) and max (exclusive)
     */
    SeededRandom.prototype.nextInt = function (min, max) {
        return Math.floor(this.next() * (max - min)) + min;
    };
    /**
     * Select random element from array with proper type safety
     * Returns undefined if array is empty to maintain type safety
     */
    SeededRandom.prototype.choice = function (array) {
        if (array.length === 0) {
            return undefined;
        }
        return array[this.nextInt(0, array.length)];
    };
    /**
     * Select random element from array with guarantee of non-empty array
     * Use this when you're certain the array has elements
     */
    SeededRandom.prototype.safeChoice = function (array) {
        if (array.length === 0) {
            throw new Error('Cannot select from empty array');
        }
        var index = this.nextInt(0, array.length);
        var result = array[index];
        if (result === undefined) {
            throw new Error("Array access failed at index ".concat(index));
        }
        return result;
    };
    /**
     * Public method to reset seed for testing scenarios
     */
    SeededRandom.prototype.setSeed = function (newSeed) {
        this.seed = newSeed;
    };
    return SeededRandom;
}());
// Create instance for consistent mock data generation
var random = new SeededRandom();
// Mock property data for demonstration
var MOCK_PROPERTIES = [
    {
        id: '1',
        title: 'Modern 3-Bedroom Apartment in Westlands',
        description: 'Beautiful modern apartment with stunning city views and premium amenities. Features spacious rooms, modern kitchen, and excellent security.',
        location: 'Westlands, Nairobi',
        price: 15000000,
        images: [
            '/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg',
            '/assets/Residential/frames-for-your-heart-2d4lAQAlbDA-unsplash.jpg',
        ],
        features: {
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1200,
            parkingSpaces: 1,
            yearBuilt: 2020,
            amenities: ['Swimming Pool', 'Gym', '24/7 Security', 'Elevator'],
            propertyType: 'apartment',
            petFriendly: false,
            furnished: true,
        },
        verificationStatus: 'verified',
        type: 'apartment',
        createdAt: '2024-01-15T10:00:00Z',
        trustScore: 85,
        viewCount: 245,
    },
    {
        id: '2',
        title: 'Luxury Villa in Karen',
        description: 'Spacious family home with beautiful gardens and modern fixtures. Perfect for families seeking comfort and elegance.',
        location: 'Karen, Nairobi',
        price: 45000000,
        images: [
            '/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg',
            '/assets/Residential/etienne-beauregard-riverin-B0aCvAVSX8E-unsplash.jpg',
        ],
        features: {
            bedrooms: 5,
            bathrooms: 4,
            squareFeet: 3500,
            parkingSpaces: 3,
            yearBuilt: 2018,
            amenities: ['Swimming Pool', 'Garden', 'Staff Quarters', 'Generator'],
            propertyType: 'house',
            petFriendly: true,
            furnished: false,
        },
        verificationStatus: 'verified',
        type: 'house',
        createdAt: '2024-01-10T14:30:00Z',
        trustScore: 92,
        viewCount: 189,
    },
    {
        id: '3',
        title: 'Prime Commercial Land in Kilifi',
        description: 'Excellent investment opportunity with beach access and development potential.',
        location: 'Kilifi, Coast',
        price: 25000000,
        images: [
            '/assets/Land/bogdan-pasca-XpyDh3PY2lA-unsplash.jpg',
        ],
        features: {
            size: '2.5 acres',
            waterAccess: true,
            roadAccess: true,
            electricityAccess: false,
            zoning: 'commercial',
            developmentPotential: 'high',
            titleDeedStatus: 'available',
        },
        verificationStatus: 'verified',
        type: 'land',
        createdAt: '2024-01-08T09:15:00Z',
        trustScore: 78,
        viewCount: 156,
    },
    {
        id: '4',
        title: 'Modern Office Space in CBD',
        description: 'Premium office space in the heart of Nairobi CBD with excellent connectivity.',
        location: 'CBD, Nairobi',
        price: 35000000,
        images: [
            '/assets/Commercial/ash-lab-ka4HDVIti78-unsplash.jpg',
        ],
        features: {
            size: 2500,
            yearBuilt: 2019,
            floors: 3,
            elevators: 2,
            airConditioning: true,
            security: true,
            parkingSpaces: 15,
        },
        verificationStatus: 'verified',
        type: 'office',
        createdAt: '2024-01-05T16:45:00Z',
        trustScore: 88,
        viewCount: 203,
    },
];
/**
 * Safely extracts location string from property location field
 * Handles both string and object location formats with proper type safety
 */
function getLocationString(location) {
    if (typeof location === 'string') {
        return location;
    }
    // Use optional chaining and type guard for safer object access
    if (location && typeof location === 'object' && 'address' in location) {
        var locationObj = location;
        return locationObj.address;
    }
    return '';
}
/**
 * Safely converts price to number for comparison operations
 * Handles both string and number price formats with validation
 */
function getPriceAsNumber(price) {
    if (typeof price === 'number') {
        return price;
    }
    var parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
}
/**
 * Determines property category based on type
 * Provides consistent categorization logic with fallback handling
 */
function getPropertyCategory(property) {
    var type = property.type || property.propertyType || '';
    if (['apartment', 'house', 'villa', 'duplex', 'penthouse'].includes(type)) {
        return 'residential';
    }
    if (['office', 'retail', 'warehouse', 'industrial'].includes(type)) {
        return 'commercial';
    }
    if (type === 'land') {
        return 'land';
    }
    return 'other';
}
/**
 * Mock API function that simulates server response with enhanced filtering
 * Provides consistent pagination and filtering capabilities with proper null handling
 */
function fetchMockProperties(filters_1) {
    return __awaiter(this, arguments, void 0, function (filters, page, pageSize) {
        var filteredProperties, query_1, location_1, targetCategory_1, totalCount, totalPages, currentPage, startIndex, endIndex, paginatedProperties, result;
        var _a, _b, _c;
        if (page === void 0) { page = 1; }
        if (pageSize === void 0) { pageSize = 12; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.log("📊 fetchMockProperties called with:", { filters: filters, page: page, pageSize: pageSize });
                        // eslint-disable-next-line no-console
                        console.log("📊 Available mock properties:", MOCK_PROPERTIES.length);
                    }
                    // Simulate realistic network delay
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 800); })];
                case 1:
                    // Simulate realistic network delay
                    _d.sent();
                    filteredProperties = __spreadArray([], MOCK_PROPERTIES, true);
                    // Apply text-based query filter across multiple fields
                    if ((_a = filters.query) === null || _a === void 0 ? void 0 : _a.trim()) {
                        query_1 = filters.query.toLowerCase().trim();
                        filteredProperties = filteredProperties.filter(function (property) {
                            var searchableText = [
                                property.title,
                                property.description,
                                getLocationString(property.location)
                            ].join(' ').toLowerCase();
                            return searchableText.includes(query_1);
                        });
                    }
                    // Apply location-specific filtering
                    if ((_b = filters.location) === null || _b === void 0 ? void 0 : _b.trim()) {
                        location_1 = filters.location.toLowerCase().trim();
                        filteredProperties = filteredProperties.filter(function (property) {
                            var propertyLocation = getLocationString(property.location).toLowerCase();
                            return propertyLocation.includes(location_1);
                        });
                    }
                    // Apply minimum price filter with safe number conversion
                    // Use != for null/undefined check as recommended by ESLint
                    if (filters.priceMin != null) {
                        filteredProperties = filteredProperties.filter(function (property) {
                            var _a;
                            var price = getPriceAsNumber(property.price);
                            return price >= ((_a = filters.priceMin) !== null && _a !== void 0 ? _a : 0);
                        });
                    }
                    // Apply maximum price filter with safe number conversion
                    if (filters.priceMax != null) {
                        filteredProperties = filteredProperties.filter(function (property) {
                            var _a;
                            var price = getPriceAsNumber(property.price);
                            return price <= ((_a = filters.priceMax) !== null && _a !== void 0 ? _a : Infinity);
                        });
                    }
                    // Filter by verification status when requested
                    if (filters.verified === true) {
                        filteredProperties = filteredProperties.filter(function (property) {
                            return property.verificationStatus === 'verified';
                        });
                    }
                    // Apply category-based filtering with enhanced logic
                    if ((_c = filters.category) === null || _c === void 0 ? void 0 : _c.trim()) {
                        targetCategory_1 = filters.category.toLowerCase().trim();
                        filteredProperties = filteredProperties.filter(function (property) {
                            var propertyCategory = getPropertyCategory(property);
                            return propertyCategory === targetCategory_1;
                        });
                    }
                    totalCount = filteredProperties.length;
                    totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
                    currentPage = Math.max(1, Math.min(page, totalPages));
                    startIndex = (currentPage - 1) * pageSize;
                    endIndex = Math.min(startIndex + pageSize, totalCount);
                    paginatedProperties = filteredProperties.slice(startIndex, endIndex);
                    result = {
                        items: paginatedProperties,
                        totalCount: totalCount,
                        totalPages: totalPages,
                    };
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.log("📊 fetchMockProperties returning:", {
                            itemsCount: result.items.length,
                            totalCount: result.totalCount,
                            totalPages: result.totalPages,
                            currentPage: currentPage
                        });
                    }
                    return [2 /*return*/, result];
            }
        });
    });
}
/**
 * Enhanced mock data generator with consistent, reproducible results
 * Generates realistic property data for testing and development
 */
function generateMockProperties(count) {
    // Reset random generator for consistent results
    var generator = new SeededRandom(42); // Fixed seed for reproducibility
    // Expanded location data for more variety
    var locations = [
        'Westlands', 'Karen', 'Kilimani', 'CBD',
        'Kileleshwa', 'Lavington', 'Runda', 'Muthaiga'
    ];
    // Property types with associated metadata
    var propertyTypeData = [
        { type: 'apartment', category: 'residential', basePrice: 8000000 },
        { type: 'house', category: 'residential', basePrice: 20000000 },
        { type: 'office', category: 'commercial', basePrice: 15000000 },
        { type: 'land', category: 'land', basePrice: 10000000 }
    ];
    var properties = [];
    for (var i = 0; i < count; i++) {
        // Select property type and location using seeded randomization
        var typeData = generator.safeChoice(propertyTypeData);
        var location_2 = generator.safeChoice(locations);
        // Generate realistic price variation (±50% of base price)
        var priceVariation = generator.nextInt(-50, 51) / 100;
        var finalPrice = Math.round(typeData.basePrice * (1 + priceVariation));
        // Create property object with all required fields
        var property = {
            id: "mock-".concat(i + 1),
            title: "".concat(typeData.type === 'land' ? 'Prime Land' : 'Modern Property', " in ").concat(location_2),
            description: "Beautiful ".concat(typeData.type, " with excellent features and great location. Perfect for ").concat(typeData.category === 'residential' ? 'families' : 'business', "."),
            location: "".concat(location_2, ", Nairobi"),
            price: finalPrice,
            images: ["/assets/placeholder-".concat(typeData.type, ".jpg")],
            features: __assign(__assign(__assign(__assign({}, (typeData.category === 'residential' && {
                bedrooms: generator.nextInt(1, 6),
                bathrooms: generator.nextInt(1, 4),
                squareFeet: generator.nextInt(500, 3500),
            })), (typeData.type === 'land' && {
                size: "".concat(generator.nextInt(1, 6), " acres"),
            })), (typeData.category === 'commercial' && {
                squareFeet: generator.nextInt(1000, 5000),
                parkingSpaces: generator.nextInt(5, 25),
            })), { propertyType: typeData.type }),
            verificationStatus: generator.next() > 0.2 ? 'verified' : 'pending',
            type: typeData.type,
            createdAt: new Date(Date.now() - generator.nextInt(0, 30) * 24 * 60 * 60 * 1000).toISOString(),
            trustScore: generator.nextInt(60, 101),
            viewCount: generator.nextInt(10, 501),
        };
        properties.push(property);
    }
    return properties;
}
/**
 * Mock API function to fetch a single property by ID
 * Simulates server response for individual property details
 */
function fetchMockProperty(id) {
    return __awaiter(this, void 0, void 0, function () {
        var property;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.log("🏠 fetchMockProperty called with ID:", id);
                    }
                    // Simulate realistic network delay
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 1:
                    // Simulate realistic network delay
                    _a.sent();
                    property = MOCK_PROPERTIES.find(function (p) { return p.id === id; });
                    if (process.env.NODE_ENV === "development") {
                        // eslint-disable-next-line no-console
                        console.log("🏠 fetchMockProperty result:", property ? "Found" : "Not found");
                    }
                    return [2 /*return*/, property || null];
            }
        });
    });
}
/**
 * Utility function to reset the random generator seed
 * Useful for testing scenarios requiring specific data patterns
 */
function resetMockDataSeed(seed) {
    if (seed === void 0) { seed = 12345; }
    random.setSeed(seed);
}
