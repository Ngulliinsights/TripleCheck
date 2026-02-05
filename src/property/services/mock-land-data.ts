/**
 * Mock Land Data Service
 * Provides mock data for land properties to support development and presentation
 */

// Land-specific types
interface LandFeatures {
  size: string;
  soilType: string;
  waterAccess: boolean;
  roadAccess: boolean;
  electricity: boolean;
  landUse: "agricultural" | "residential" | "commercial" | "industrial" | "mixed";
  topography: "flat" | "hilly" | "mountainous" | "valley";
  drainage: "excellent" | "good" | "fair" | "poor";
  vegetation: string;
  nearbyAmenities: string[];
}

interface LandVerificationData {
  titleDeedStatus: "verified" | "pending" | "missing" | "disputed";
  surveyStatus: "completed" | "pending" | "required";
  boundaryStatus: "clear" | "disputed" | "unmarked";
  landRights: "freehold" | "leasehold" | "customary" | "government";
  encumbrances: string[];
  lastSurveyDate?: string;
  surveyorName?: string;
  registrationNumber?: string;
}

export interface MockLandProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    county: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  landFeatures: LandFeatures;
  verification: LandVerificationData;
  owner: {
    name: string;
    phone: string;
    email: string;
    trustScore: number;
    verified: boolean;
  };
  trustScore: number;
  verificationStatus: "verified" | "pending" | "unverified" | "flagged";
  riskLevel: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

// Mock land properties database
const mockLandProperties: Record<string, MockLandProperty> = {
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
export async function fetchMockLandProperty(id: string): Promise<MockLandProperty | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockLandProperties[id] || null;
}

/**
 * Get all mock land properties
 */
export function getAllMockLandProperties(): MockLandProperty[] {
  return Object.values(mockLandProperties);
}

/**
 * Check if a land property exists in mock data
 */
export function hasMockLandProperty(id: string): boolean {
  return id in mockLandProperties;
}