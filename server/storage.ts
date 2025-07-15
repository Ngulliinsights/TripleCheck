import { 
  User, InsertUser, 
  Property, InsertProperty,
  Review, InsertReview,
  PropertyFeatures
} from "@shared/schema";

// Define the missing PropertyFilter interface
export interface PropertyFilter {
  type?: string[];
  priceRange?: [number, number];
  bedrooms?: number;
  bathrooms?: number;
  area?: [number, number];
  features?: string[];
  verificationStatus?: string[];
  location?: string;
}

// Define a custom Location interface to avoid conflicts with the DOM Location type
export interface PropertyLocation {
  id: string;
  name: string;
  description?: string;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTrustScore(id: number, score: number): Promise<User>;

  // Property operations
  getProperty(id: number): Promise<Property | undefined>;
  getProperties(): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateVerificationStatus(id: number, status: string, results: any): Promise<Property>;
  searchProperties(query: string): Promise<Property[]>;
  searchPropertiesWithFilters(filters: PropertyFilter): Promise<Property[]>;

  // Review operations
  getReviews(propertyId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Location operations - now using our custom PropertyLocation interface
  searchLocations(query: string): Promise<PropertyLocation[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private reviews: Map<number, Review>;
  private currentIds: { users: number; properties: number; reviews: number; };

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.reviews = new Map();
    this.currentIds = { users: 1, properties: 1, reviews: 1 };

    // Initialize with mock data for demonstration purposes
    this.initializeMockData();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Using Array.from for better performance with large datasets
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    
    // Construct user object with all required properties from schema
    const user: User = { 
      ...insertUser, 
      id, 
      trustScore: 0, 
      isVerifiedAgent: false,
      createdAt: now,
      updatedAt: now
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUserTrustScore(id: number, score: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    // Create updated user object with new trust score and timestamp
    const updatedUser: User = { 
      ...user, 
      trustScore: score,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.currentIds.properties++;
    const now = new Date();
    
    // Construct property with default values for required fields
    const property: Property = {
      ...insertProperty,
      id,
      verificationStatus: 'pending',
      aiVerificationResults: null,
      createdAt: now,
      updatedAt: now
    };
    
    this.properties.set(id, property);
    return property;
  }

  async updateVerificationStatus(id: number, status: string, results: any): Promise<Property> {
    const property = await this.getProperty(id);
    if (!property) {
      throw new Error(`Property with id ${id} not found`);
    }

    // Update verification status and results with new timestamp
    const updatedProperty: Property = {
      ...property,
      verificationStatus: status,
      aiVerificationResults: results,
      updatedAt: new Date()
    };
    
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async searchProperties(query: string): Promise<Property[]> {
    const lowercaseQuery = query.toLowerCase();
    
    // Search across multiple fields for better results
    return Array.from(this.properties.values()).filter(property => 
      property.title.toLowerCase().includes(lowercaseQuery) ||
      property.location.toLowerCase().includes(lowercaseQuery) ||
      property.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getReviews(propertyId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.propertyId === propertyId);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentIds.reviews++;
    const now = new Date();
    
    // Create review with timestamps
    const review: Review = {
      ...insertReview,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.reviews.set(id, review);
    return review;
  }

  async searchLocations(query: string): Promise<PropertyLocation[]> {
    // Common Nairobi locations for property search
    const commonLocations: PropertyLocation[] = [
      { id: "1", name: "Karen", description: "Affluent suburb in Nairobi" },
      { id: "2", name: "Runda", description: "Exclusive residential area" },
      { id: "3", name: "Kilimani", description: "Popular urban residential area" },
      { id: "4", name: "Westlands", description: "Commercial and residential hub" },
      { id: "5", name: "Lavington", description: "Upmarket residential area" },
      { id: "6", name: "Parklands", description: "Diverse residential and commercial area" },
      { id: "7", name: "Upperhill", description: "Business district with residential options" },
      { id: "8", name: "Kileleshwa", description: "Mixed residential area" },
      { id: "9", name: "Ngong Road", description: "Developing residential corridor" },
      { id: "10", name: "Riverside", description: "Upscale residential area" }
    ];

    // Filter locations based on query matching name or description
    return commonLocations.filter(location => 
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.description?.toLowerCase().includes(query.toLowerCase())
    );
  }

  async searchPropertiesWithFilters(filters: PropertyFilter): Promise<Property[]> {
    const allProperties = await this.getProperties();
    
    // Apply comprehensive filtering logic
    return allProperties.filter(property => {
      // Property type filter
      if (filters.type?.length && !filters.type.includes(property.features.propertyType || '')) {
        return false;
      }

      // Price range filter
      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        if (property.price < min || property.price > max) {
          return false;
        }
      }

      // Minimum bedrooms filter
      if (filters.bedrooms && property.features.bedrooms < filters.bedrooms) {
        return false;
      }

      // Minimum bathrooms filter
      if (filters.bathrooms && property.features.bathrooms < filters.bathrooms) {
        return false;
      }

      // Area range filter
      if (filters.area) {
        const [min, max] = filters.area;
        if (property.features.squareFeet < min || property.features.squareFeet > max) {
          return false;
        }
      }

      // Required features filter - all specified features must be present
      if (filters.features?.length) {
        const propertyAmenities = property.features.amenities;
        // Use explicit typing for the feature parameter to resolve the 'any' type error
        if (!filters.features.every((feature: string) => propertyAmenities.includes(feature))) {
          return false;
        }
      }

      // Verification status filter
      if (filters.verificationStatus?.length) {
        if (!filters.verificationStatus.includes(property.verificationStatus)) {
          return false;
        }
      }

      // Location filter - case-insensitive partial matching
      if (filters.location && !property.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      return true;
    });
  }

  private initializeMockData(): void {
    // Create comprehensive mock data for testing and demonstration
    const mockProperties: InsertProperty[] = [
      {
        ownerId: 1,
        title: "Modern Apartment in Kilimani",
        description: "Luxurious 3-bedroom apartment with amazing city views and modern amenities",
        location: "Kilimani, Nairobi",
        price: 25000000,
        imageUrls: [
          "https://images.unsplash.com/photo-1580041065738-e72023775cdc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        ],
        features: {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1500,
          parkingSpaces: 2,
          yearBuilt: 2020,
          amenities: ["Swimming Pool", "Gym", "Security", "Backup Generator"],
          petFriendly: true,
          furnished: true,
          propertyType: "apartment" as const
        }
      },
      {
        ownerId: 1,
        title: "Family Home in Karen",
        description: "Spacious 4-bedroom house with large garden and staff quarters",
        location: "Karen, Nairobi",
        price: 45000000,
        imageUrls: [
          "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        ],
        features: {
          bedrooms: 4,
          bathrooms: 3,
          squareFeet: 3000,
          parkingSpaces: 3,
          yearBuilt: 2019,
          amenities: ["Garden", "Staff Quarters", "Security", "Borehole"],
          petFriendly: false,
          furnished: false,
          propertyType: "house" as const
        }
      },
      {
        ownerId: 2,
        title: "Executive Office in Westlands",
        description: "Premium office space in the heart of Westlands business district",
        location: "Westlands, Nairobi",
        price: 35000000,
        imageUrls: [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        ],
        features: {
          bedrooms: 0,
          bathrooms: 2,
          squareFeet: 1200,
          parkingSpaces: 5,
          yearBuilt: 2021,
          amenities: ["High-Speed Internet", "Conference Room", "Reception Area", "Security"],
          petFriendly: false,
          furnished: true,
          propertyType: "condo" as const
        }
      }
    ];

    // Initialize properties through the createProperty method to maintain consistency
    mockProperties.forEach(property => {
      this.createProperty(property);
    });
  }
}

// Export singleton instance for use throughout the application
export const storage = new MemStorage();