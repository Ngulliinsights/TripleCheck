# Data Schema Documentation

## Core Data Models

### Property

```typescript
interface Property {
  id: number;
  ownerId: number;
  title: string;
  description: string;
  location: string;
  price: number;
  imageUrls: string[];
  features: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    parkingSpaces: number;
    yearBuilt: number;
    amenities: string[];
    petFriendly: boolean;
    furnished: boolean;
    propertyType?: "apartment" | "house" | "commercial" | "land" | "industrial";
  };
  verificationStatus: string;
  aiVerificationResults?: {
    documentAuthenticity: string;
    ownershipVerified: boolean;
    riskScore: number;
    verifiedAt: string;
    fraudDetection?: {
      isSuspicious: boolean;
      suspiciousScore: number;
      reasons: string[];
      riskLevel: "low" | "medium" | "high";
    };
  };
  createdAt: string;
  updatedAt: string;
}
```

### User

```typescript
interface User {
  id: number;
  username: string;
  password: string; // Hashed in production
  email: string;
  role: "user" | "agent" | "admin";
  verificationStatus: "unverified" | "pending" | "verified";
  profile?: {
    fullName: string;
    phone?: string;
    address?: string;
    company?: string;
    licenseNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Review

```typescript
interface Review {
  id: number;
  propertyId: number;
  userId: number;
  rating: number;
  comment: string;
  verified: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Location

```typescript
interface Location {
  id: string;
  name: string;
  description?: string;
  type: "city" | "neighborhood" | "area";
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  metadata?: {
    population?: number;
    averagePrice?: number;
    popularity?: number;
  };
}
```

## Verification Models

### Document Verification

```typescript
interface DocumentVerificationResult {
  isVerified: boolean;
  confidence: number;
  issues: string[];
  recommendations: string[];
  documentType: string;
  extractedData: Record<string, any>;
  verificationDate: Date;
  aiAnalysis: {
    authenticity: number;
    completeness: number;
    consistency: number;
  };
}
```

### Fraud Detection

```typescript
interface FraudDetectionResult {
  isSuspicious: boolean;
  suspiciousScore: number;
  reasons: string[];
  riskLevel: "low" | "medium" | "high";
  verificationDate: Date;
  fraudPatterns: {
    priceAnomaly: number;
    documentInconsistency: number;
    ownershipRisk: number;
    marketDeviation: number;
  };
}
```

## Request/Response Models

### Property Search Request

```typescript
interface PropertySearchRequest {
  type?: string[];
  priceRange?: [number, number];
  bedrooms?: number;
  bathrooms?: number;
  area?: [number, number];
  features?: string[];
  verificationStatus?: string[];
  location?: string;
  sortBy?: "price" | "date" | "popularity";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}
```

### Property Search Response

```typescript
interface PropertySearchResponse {
  success: boolean;
  properties: Property[];
  totalCount: number;
  metadata?: {
    averagePrice: number;
    priceRange: [number, number];
    popularFeatures: string[];
    locationStats: {
      [location: string]: number;
    };
  };
}
```

### Location Search Response

```typescript
interface LocationSearchResponse {
  suggestions: Array<{
    id: string;
    name: string;
    description: string;
    type?: string;
    score?: number;
  }>;
}
```

## AI/ML Models

### Training Data

```typescript
interface TrainingData {
  propertyId: number;
  features: number[];
  fraudLabel: boolean;
  riskScore: number;
  verificationStatus: string;
  documentScores: {
    authenticity: number;
    completeness: number;
    consistency: number;
  };
}
```

### Model Metrics

```typescript
interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  timestamp: string;
}
```

## Validation Schemas (Zod)

### Property Schema

```typescript
const propertySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  location: z.string().min(1),
  price: z.number().positive(),
  features: z.object({
    bedrooms: z.number().int().min(0),
    bathrooms: z.number().int().min(0),
    squareFeet: z.number().positive(),
    // ... other features
  }),
  // ... other fields
});
```

### User Schema

```typescript
const userSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  email: z.string().email(),
  role: z.enum(["user", "agent", "admin"]),
  // ... other fields
});
```

## Schema Usage Notes

1. **Validation Flow**
   - Request validation using Zod schemas
   - Database schema validation
   - Response transformation

2. **Type Safety**
   - TypeScript interfaces for compile-time checks
   - Zod schemas for runtime validation
   - Automatic type inference

3. **Schema Evolution**
   - Version control for schema changes
   - Migration strategies
   - Backward compatibility

4. **Performance Considerations**
   - Indexing strategies
   - Query optimization
   - Cache invalidation

This schema documentation provides a comprehensive overview of the data models used in the application and can be referenced when making changes or optimizing the code.
