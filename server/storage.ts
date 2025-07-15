import { 
  User, InsertUser, 
  Property, InsertProperty,
  Review, InsertReview,
  PropertyFeatures
} from "@shared/schema";

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

  // Review operations
  getReviews(propertyId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
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

    // Add some mock data
    this.initializeMockData();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    // Now including both createdAt and updatedAt timestamps as required by the User schema
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
    if (!user) throw new Error("User not found");

    // Update the updatedAt timestamp when modifying the user
    const updatedUser = { 
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
    // Including both createdAt and updatedAt as required by the Property schema
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
    if (!property) throw new Error("Property not found");

    // Update the updatedAt timestamp when modifying the property
    const updatedProperty = {
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
    // Including both createdAt and updatedAt as required by the Review schema
    const review: Review = {
      ...insertReview,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.reviews.set(id, review);
    return review;
  }

  private initializeMockData() {
    // Add mock properties with complete PropertyFeatures that include petFriendly and furnished
    const mockProperties: InsertProperty[] = [
      {
        ownerId: 1,
        title: "Modern Apartment in Kilimani",
        description: "Luxurious 3-bedroom apartment with amazing city views",
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
          amenities: ["Swimming Pool", "Gym", "Security"],
          // Adding the missing required properties for PropertyFeatures
          petFriendly: true,
          furnished: true,
          propertyType: "apartment" as const
        }
      },
      {
        ownerId: 1,
        title: "Family Home in Karen",
        description: "Spacious 4-bedroom house with large garden",
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
          amenities: ["Garden", "Staff Quarters", "Security"],
          // Adding the missing required properties for PropertyFeatures
          petFriendly: false,
          furnished: false,
          propertyType: "house" as const
        }
      }
    ];

    // Initialize the mock properties through the createProperty method
    mockProperties.forEach(property => {
      this.createProperty(property);
    });
  }
}

export const storage = new MemStorage();