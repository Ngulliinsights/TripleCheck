export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  images: string[];
  features?: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    parkingSpaces: number;
    yearBuilt: number;
    amenities: string[];
    propertyType: string;
    petFriendly: boolean;
    furnished: boolean;
  };
  status: 'verified' | 'pending' | 'rejected';
  verificationData?: {
    imageAnalysis: {
      qualityScore: number;
      authenticityScore: number;
      flaggedIssues: string[];
    };
    descriptionAnalysis: {
      accuracyScore: number;
      completenessScore: number;
      suggestedImprovements: string[];
    };
    overallScore: number;
    verificationTimestamp: string;
    aiModel: string;
  };
  createdAt?: string;
  updatedAt?: string;
}