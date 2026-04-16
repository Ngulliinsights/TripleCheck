"use strict";
/**
 * Mock Land Data Service
 * Provides mock data for land properties to support development and presentation
 */
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
exports.fetchMockLandProperty = fetchMockLandProperty;
exports.getAllMockLandProperties = getAllMockLandProperties;
exports.hasMockLandProperty = hasMockLandProperty;
// Mock land properties database
var mockLandProperties = {
    "1": {
        id: "1",
        title: "5-Acre Agricultural Land in Kiambu",
        description: "Prime agricultural land with fertile soil, perfect for farming or development. Located in the heart of Kiambu County with excellent access to Nairobi markets. The land features rich clay loam soil ideal for various crops including coffee, maize, and vegetables. Water access is available through a nearby borehole, and the property has clear title deeds with no encumbrances.",
        price: 12000000,
        location: {
            address: "Kiambu Road, Kiambu County",
            city: "Kiambu",
            county: "Kiambu County",
            coordinates: {
                lat: -1.1719,
                lng: 36.8356,
            },
        },
        images: [
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1574263867128-a3d5c1b1deaa?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&crop=center",
        ],
        landFeatures: {
            size: "5 acres",
            soilType: "Fertile clay loam",
            waterAccess: true,
            roadAccess: true,
            electricity: true,
            landUse: "agricultural",
            topography: "flat",
            drainage: "excellent",
            vegetation: "Mixed farming crops and natural vegetation",
            nearbyAmenities: ["Primary School", "Health Center", "Local Market", "Church", "Water Point"],
        },
        verification: {
            titleDeedStatus: "verified",
            surveyStatus: "completed",
            boundaryStatus: "clear",
            landRights: "freehold",
            encumbrances: [],
            lastSurveyDate: "2023-06-15",
            surveyorName: "John Kamau (Licensed Surveyor)",
            registrationNumber: "LR/KIAMBU/123/456",
        },
        owner: {
            name: "Mary Wanjiku",
            phone: "+254 712 345 678",
            email: "mary.wanjiku@email.com",
            trustScore: 92,
            verified: true,
        },
        trustScore: 95,
        verificationStatus: "verified",
        riskLevel: "low",
        createdAt: "2024-01-10T08:00:00Z",
        updatedAt: "2024-01-15T14:30:00Z",
    },
    "2": {
        id: "2",
        title: "2-Acre Residential Plot in Nakuru",
        description: "Well-located residential plot with access to utilities and good road network. Perfect for building your dream home with scenic views of the Rift Valley. The plot is situated in a developing residential area with modern infrastructure and is ideal for both residential development and investment purposes.",
        price: 8500000,
        location: {
            address: "Nakuru-Eldoret Highway, Nakuru",
            city: "Nakuru",
            county: "Nakuru County",
            coordinates: {
                lat: -0.3031,
                lng: 36.0800,
            },
        },
        images: [
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1574263867128-a3d5c1b1deaa?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=center",
        ],
        landFeatures: {
            size: "2 acres",
            soilType: "Red volcanic soil",
            waterAccess: true,
            roadAccess: true,
            electricity: true,
            landUse: "residential",
            topography: "hilly",
            drainage: "good",
            vegetation: "Scattered acacia trees and grass",
            nearbyAmenities: ["Shopping Center", "Hospital", "Schools", "Banks", "Restaurants"],
        },
        verification: {
            titleDeedStatus: "verified",
            surveyStatus: "completed",
            boundaryStatus: "clear",
            landRights: "freehold",
            encumbrances: [],
            lastSurveyDate: "2023-08-20",
            surveyorName: "Peter Mwangi (Licensed Surveyor)",
            registrationNumber: "LR/NAKURU/789/012",
        },
        owner: {
            name: "James Kipchoge",
            phone: "+254 722 987 654",
            email: "james.kipchoge@email.com",
            trustScore: 88,
            verified: true,
        },
        trustScore: 89,
        verificationStatus: "verified",
        riskLevel: "low",
        createdAt: "2024-01-12T10:15:00Z",
        updatedAt: "2024-01-18T16:45:00Z",
    },
    "3": {
        id: "3",
        title: "10-Acre Commercial Land in Mombasa",
        description: "Strategic commercial land near the port with high development potential. Ideal for warehousing, logistics, or industrial development projects. The property offers excellent connectivity to major transportation networks and is located in a designated commercial zone with all necessary approvals for development.",
        price: 45000000,
        location: {
            address: "Mombasa-Malindi Road, Mombasa",
            city: "Mombasa",
            county: "Mombasa County",
            coordinates: {
                lat: -4.0435,
                lng: 39.6682,
            },
        },
        images: [
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1574263867128-a3d5c1b1deaa?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center",
        ],
        landFeatures: {
            size: "10 acres",
            soilType: "Sandy loam",
            waterAccess: true,
            roadAccess: true,
            electricity: true,
            landUse: "commercial",
            topography: "flat",
            drainage: "excellent",
            vegetation: "Coastal vegetation and palm trees",
            nearbyAmenities: ["Port of Mombasa", "Airport", "Industrial Area", "Highway Access", "Container Depot"],
        },
        verification: {
            titleDeedStatus: "verified",
            surveyStatus: "completed",
            boundaryStatus: "clear",
            landRights: "freehold",
            encumbrances: [],
            lastSurveyDate: "2023-09-10",
            surveyorName: "Sarah Ochieng (Licensed Surveyor)",
            registrationNumber: "LR/MOMBASA/345/678",
        },
        owner: {
            name: "Ahmed Hassan",
            phone: "+254 733 456 789",
            email: "ahmed.hassan@email.com",
            trustScore: 94,
            verified: true,
        },
        trustScore: 92,
        verificationStatus: "verified",
        riskLevel: "low",
        createdAt: "2024-01-08T12:30:00Z",
        updatedAt: "2024-01-20T09:15:00Z",
    },
    "4": {
        id: "4",
        title: "3-Acre Industrial Plot in Machakos",
        description: "Well-positioned industrial land with excellent connectivity to major highways. Suitable for manufacturing, processing, or distribution facilities. The plot is located in a designated industrial zone with proper zoning approvals and access to three-phase power supply.",
        price: 18000000,
        location: {
            address: "Machakos-Kitui Road, Machakos",
            city: "Machakos",
            county: "Machakos County",
            coordinates: {
                lat: -1.5177,
                lng: 37.2634,
            },
        },
        images: [
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1574263867128-a3d5c1b1deaa?w=800&h=600&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=600&fit=crop&crop=center",
        ],
        landFeatures: {
            size: "3 acres",
            soilType: "Clay loam",
            waterAccess: true,
            roadAccess: true,
            electricity: true,
            landUse: "industrial",
            topography: "flat",
            drainage: "good",
            vegetation: "Sparse natural vegetation",
            nearbyAmenities: ["Industrial Park", "Highway Access", "Railway Line", "Fuel Station", "Truck Stop"],
        },
        verification: {
            titleDeedStatus: "pending",
            surveyStatus: "completed",
            boundaryStatus: "clear",
            landRights: "freehold",
            encumbrances: ["Pending final title deed processing"],
            lastSurveyDate: "2023-11-05",
            surveyorName: "David Mutua (Licensed Surveyor)",
            registrationNumber: "LR/MACHAKOS/901/234",
        },
        owner: {
            name: "Grace Mutindi",
            phone: "+254 744 567 890",
            email: "grace.mutindi@email.com",
            trustScore: 82,
            verified: true,
        },
        trustScore: 85,
        verificationStatus: "pending",
        riskLevel: "low",
        createdAt: "2024-01-05T14:20:00Z",
        updatedAt: "2024-01-22T11:30:00Z",
    },
};
/**
 * Mock API function to simulate fetching land property details
 */
function fetchMockLandProperty(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Simulate API delay
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 1:
                    // Simulate API delay
                    _a.sent();
                    return [2 /*return*/, mockLandProperties[id] || null];
            }
        });
    });
}
/**
 * Get all mock land properties
 */
function getAllMockLandProperties() {
    return Object.values(mockLandProperties);
}
/**
 * Check if a land property exists in mock data
 */
function hasMockLandProperty(id) {
    return id in mockLandProperties;
}
