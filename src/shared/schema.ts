export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  imageUrls?: string[];
  verificationStatus: "verified" | "pending" | "unverified" | "draft";
  features?: PropertyFeatures;
}

export interface PropertyFeatures {
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
  propertyType?: string;
  petFriendly?: boolean;
  furnished?: boolean;
  amenities?: string[];
}