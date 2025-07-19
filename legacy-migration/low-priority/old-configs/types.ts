export interface Property {
  id: number;
  price: number;
  location: string;
  features: {
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    amenities: string[];
  };
  verificationStatus?: string;
  trustScore?: number;
  ownerId?: number;
  isFraudulent?: boolean;
  yearBuilt?: number;
}

export interface FraudAnalysis {
  isSuspicious: boolean;
  suspiciousScore: number;
  fraudPatterns?: {
    priceAnomaly?: number;
    documentInconsistency?: number;
    ownershipRisk?: number;
    marketDeviation?: number;
  };
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
  verificationDate: string;
}

// Session type augmentation
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
    isAuthenticated?: boolean;
  }
}
