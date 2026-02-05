// Storage interface for AI service
import { Property, User, Review } from "..\..\src\types\land-verification";

export interface AIStorage {
  getProperty(id: string | number): Promise<Property | null>;
  getUser(id: string | number): Promise<User | null>;
  getReviews(propertyId: string | number): Promise<Review[]>;
  updateProperty(id: string | number, updates: Partial<Property>): Promise<Property>;
  updateVerificationStatus(id: string | number, status: string, results: unknown): Promise<void>;
}

// Mock storage implementation for AI service
class MockAIStorage implements AIStorage {
  async getProperty(id: string | number): Promise<Property | null> {
    // Mock implementation - in real app this would connect to database
    const propertyId = typeof id === 'string' ? parseInt(id) : id;
    return {
      id: propertyId,
      title: "Sample Property",
      description: "A sample property for AI analysis",
      price: "100000.00",
      location: "Sample Location",
      address: null,
      coordinates: null,
      imageUrls: [],
      verificationStatus: "pending",
      features: null,
      ownerId: 1,
      aiVerificationResults: null,
      viewCount: 0,
      favoriteCount: 0,
      isActive: true,
      isFeatured: false,
      availableFrom: null,
      availableUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getUser(id: string | number): Promise<User | null> {
    // Mock implementation
    const userId = typeof id === 'string' ? parseInt(id) : id;
    return {
      id: userId,
      username: "sampleuser",
      email: "user@example.com",
      password: process.env.MOCK_USER_PASSWORD || "mock_hashed_password",
      role: "user",
      trustScore: 50,
      isVerifiedAgent: false,
      firstName: "Sample",
      lastName: "User",
      bio: null,
      profileImageUrl: null,
      phone: null,
      isActive: true,
      emailVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getReviews(_propertyId: string | number): Promise<Review[]> {
    // Mock implementation
    return [];
  }

  async updateProperty(id: string | number, updates: Partial<Property>): Promise<Property> {
    // Mock implementation
    const property = await this.getProperty(id);
    if (!property) {
      throw new Error("Property not found");
    }
    return { ...property, ...updates };
  }

  async updateVerificationStatus(_id: string | number, _status: string, _results: unknown): Promise<void> {
    // Mock implementation - in real app this would update the database
    // No operation needed for mock implementation
  }
}

export const storage = new MockAIStorage();